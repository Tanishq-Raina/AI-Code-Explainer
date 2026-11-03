"""Local, one-response-at-a-time hint reviewer. Never calls models or runs benchmarks."""
from __future__ import annotations
import argparse
import csv
from datetime import datetime, timezone
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import threading
from urllib.parse import urlparse
import webbrowser

HERE=Path(__file__).resolve().parent
UI=HERE/'review_ui'
SCORE_FIELDS=['correctness_0_1_2','actionability_0_1_2','excessive_disclosure_yes_no','progression_appropriate_yes_no']


def read_json(path):return json.loads(path.read_text(encoding='utf-8'))
def now():return datetime.now(timezone.utc).isoformat()
def sha(data):return hashlib.sha256(data).hexdigest()


class ReviewStore:
    def __init__(self,run_dir):
        self.run_dir=Path(run_dir).resolve()
        self.lock=threading.Lock()
        self.path=self.run_dir/'human_hint_reviews.json'
        self.journal=self.run_dir/'human_hint_review_history.jsonl'
        source=self.run_dir/'author_review.csv'
        ledger_path=self.run_dir/'ai_hint_evaluation/ai_hint_ratings.json'
        mapping_path=self.run_dir/'review_mapping_keep_separate.json'
        ledger=read_json(ledger_path)
        if ledger['source_sha256']!=sha(source.read_bytes()):
            raise ValueError('The original review sheet differs from the AI rating source. Reconcile it before reviewing.')
        with source.open(encoding='utf-8-sig',newline='') as stream:self.rows=list(csv.DictReader(stream))
        ratings={r['review_id']:r for r in ledger['ratings']}
        mapping={r['review_id']:r for r in read_json(mapping_path)}
        if {r['review_id'] for r in self.rows}!=set(ratings) or set(ratings)!=set(mapping):
            raise ValueError('Response IDs do not match the rating ledger and condition mapping.')
        self.dataset_hash=sha(source.read_bytes()+ledger_path.read_bytes()+mapping_path.read_bytes())
        self.cases=[{**r,**mapping[r['review_id']],'ai':ratings[r['review_id']]} for r in self.rows]
        self.ids={r['review_id'] for r in self.cases}
        self.ai=ratings
        assignment_path=self.run_dir/'assignment.json'
        self.assignment=read_json(assignment_path) if assignment_path.exists() else None
        if self.assignment and set(self.assignment['review_ids'])!=self.ids:
            raise ValueError('The assignment does not match its response set.')
        self.method={'assessment_type':ledger['assessment_type'],'rules':ledger['rules'],
                     'official_references':ledger['official_references']}
        self.state=self._load()

    def _load(self):
        if not self.path.exists():return {'schema_version':1,'dataset_hash':self.dataset_hash,'revision':0,'reviews':{}}
        state=read_json(self.path)
        if state.get('dataset_hash')!=self.dataset_hash:
            raise ValueError('Saved reviews belong to a different response dataset; no files were overwritten.')
        return state

    def snapshot(self):
        with self.lock:
            self.state=self._load()
            return json.loads(json.dumps(self.state))

    def save(self,payload):
        identifier=payload.get('review_id')
        if identifier not in self.ids:raise ValueError('Unknown response ID.')
        review=payload.get('review')
        if not isinstance(review,dict):raise ValueError('A review object is required.')
        status=review.get('status')
        if status not in ('reviewed','flagged'):raise ValueError('Choose save review or flag for later.')
        cleaned={'status':status}
        for field in SCORE_FIELDS:
            value=review.get(field,'')
            if field.endswith('_0_1_2'):
                valid=type(value) is int and value in (0,1,2)
            elif field=='excessive_disclosure_yes_no':valid=value in ('yes','no')
            else:valid=value in ('yes','no','N/A')
            if not valid:
                if status=='flagged' and value in ('',None):value=''
                else:raise ValueError('Please complete all four ratings before saving the review.')
            cleaned[field]=value
        for key,limit in [('notes',12000),('reviewer_name',120)]:
            value=review.get(key,'')
            if not isinstance(value,str) or len(value)>limit:raise ValueError('Review notes or name are too long.')
            cleaned[key]=value.strip()
        cleaned['decision']='flagged' if status=='flagged' else (
            'accepted_ai' if all(cleaned[k]==self.ai[identifier][k] for k in SCORE_FIELDS) else 'adjusted_ai')
        cleaned['reviewed_at_utc']=now()
        cleaned['assessment_type']='user review of AI-assisted ratings'
        with self.lock:
            current=self._load()
            if type(payload.get('revision')) is not int or payload['revision']!=current['revision']:
                raise FileExistsError('Another tab saved a review. Reload saved reviews, then save your draft again.')
            revision=current['revision']+1
            updated={**current,'revision':revision,'updated_at_utc':now(),
                     'reviews':{**current['reviews'],identifier:cleaned}}
            temporary=self.path.with_suffix('.json.tmp')
            with temporary.open('w',encoding='utf-8') as stream:
                json.dump(updated,stream,indent=2,ensure_ascii=False);stream.flush();os.fsync(stream.fileno())
            os.replace(temporary,self.path)
            self.state=updated
            # Keep earlier decisions as an append-only audit trail as well as current ratings.
            try:
                with self.journal.open('a',encoding='utf-8') as stream:
                    stream.write(json.dumps({'revision':revision,'review_id':identifier,'review':cleaned},ensure_ascii=False)+'\n')
                    stream.flush();os.fsync(stream.fileno())
                journal_warning=None
            except OSError:
                journal_warning='Your review was saved, but the additional history log could not be updated.'
            return {'state':updated,'warning':journal_warning}

    def export_csv(self):
        state=self.snapshot();buffer=io.StringIO(newline='')
        fields=list(self.rows[0])+['review_status','reviewer_name','decision','reviewed_at_utc']
        writer=csv.DictWriter(buffer,fieldnames=fields);writer.writeheader()
        for source in self.rows:
            saved=state['reviews'].get(source['review_id'],{})
            row={**source,**{k:saved.get(k,'') for k in SCORE_FIELDS},'notes':saved.get('notes',''),
                 'review_status':saved.get('status','unreviewed'),
                 **{k:saved.get(k,'') for k in ['reviewer_name','decision','reviewed_at_utc']}}
            writer.writerow(row)
        return ('\ufeff'+buffer.getvalue()).encode('utf-8')


def handler_for(store):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass

        def send(self,status,body,kind='application/json; charset=utf-8',filename=None):
            data=json.dumps(body,ensure_ascii=False).encode('utf-8') if isinstance(body,(dict,list)) else body
            self.send_response(status)
            self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(data)))
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'")
            if filename:self.send_header('Content-Disposition',f'attachment; filename="{filename}"')
            self.end_headers();self.wfile.write(data)

        def valid_host(self):
            # Only this loopback page can submit ratings; the server exposes no other files.
            allowed={f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'}
            return self.headers.get('Host') in allowed

        def do_GET(self):
            if not self.valid_host():return self.send(403,{'error':'Use the local reviewer address.'})
            path=urlparse(self.path).path
            if path=='/api/data':
                return self.send(200,{'dataset_hash':store.dataset_hash,'cases':store.cases,'state':store.snapshot(),
                    'method':store.method,'saved_filename':store.path.name,'assignment':store.assignment})
            if path=='/api/reviews':return self.send(200,store.snapshot())
            export_name=store.assignment['id']+'_hint_reviews' if store.assignment else 'human_hint_reviews'
            if path=='/api/export.json':return self.send(200,store.snapshot(),filename=export_name+'.json')
            if path=='/api/export.csv':return self.send(200,store.export_csv(),'text/csv; charset=utf-8',export_name+'.csv')
            assets={'/':('index.html','text/html; charset=utf-8'),'/app.js':('app.js','text/javascript; charset=utf-8'),
                    '/styles.css':('styles.css','text/css; charset=utf-8')}
            if path not in assets:return self.send(404,{'error':'Page not found.'})
            name,kind=assets[path]
            return self.send(200,(UI/name).read_bytes(),kind)

        def do_POST(self):
            if not self.valid_host():return self.send(403,{'error':'Use the local reviewer address.'})
            origin=self.headers.get('Origin')
            if origin and origin!=f'http://{self.headers.get("Host")}':return self.send(403,{'error':'Reviews must be saved from this local page.'})
            if urlparse(self.path).path!='/api/reviews':return self.send(404,{'error':'Endpoint not found.'})
            if self.headers.get_content_type()!='application/json':return self.send(415,{'error':'JSON is required.'})
            try:
                length=int(self.headers.get('Content-Length','0'))
                if length<=0 or length>65536:raise ValueError('The review request is too large or empty.')
                payload=json.loads(self.rfile.read(length))
                if not isinstance(payload,dict):raise ValueError('A review object is required.')
                self.send(200,store.save(payload))
            except FileExistsError as exc:self.send(409,{'error':str(exc)})
            except (ValueError,TypeError) as exc:self.send(400,{'error':str(exc)})
            except OSError:self.send(500,{'error':'Could not save the review file. Your draft is still in this page.'})
    return Handler


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-dir',type=Path,default=HERE/'runs/benchmark-v2')
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--open',action='store_true',help='Open the local reviewer in your browser')
    args=parser.parse_args()
    store=ReviewStore(args.run_dir)
    try:server=ThreadingHTTPServer(('127.0.0.1',args.port),handler_for(store))
    except OSError:raise SystemExit(f'Port {args.port} is in use. Open the existing reviewer or choose --port 8766.')
    print(f'Hint reviewer: http://127.0.0.1:{server.server_port}',flush=True)
    print('Reviews are saved separately in '+str(store.path),flush=True)
    print('No benchmark, model or video calls are made. Press Ctrl+C to stop.',flush=True)
    if args.open:webbrowser.open(f'http://127.0.0.1:{server.server_port}')
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()


if __name__=='__main__':main()
