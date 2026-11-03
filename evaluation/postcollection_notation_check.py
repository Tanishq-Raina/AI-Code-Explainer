"""Read saved results only; disclose a notation-only scoring correction separately.

Never changes the frozen analyzer, dataset labels, or raw prediction records.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path


def canonical(label):
    # An explicit identity, not a heuristic that merges different growth rates.
    return {'O(n * log n)':'O(n log n)'}.get(label,label)


def summary(rows,normalize=False):
    rows=[{**r,'predicted':canonical(r.get('predicted','ERROR')) if normalize else r.get('predicted','ERROR')} for r in rows]
    labels=sorted({r['expected'] for r in rows});classes={};confusion={label:{} for label in labels}
    for label in labels:
        tp=sum(r['expected']==label and r['predicted']==label for r in rows)
        fp=sum(r['expected']!=label and r['predicted']==label for r in rows)
        fn=sum(r['expected']==label and r['predicted']!=label for r in rows)
        precision=tp/(tp+fp) if tp+fp else 0
        recall=tp/(tp+fn) if tp+fn else 0
        classes[label]={'count':tp+fn,'correct':tp,'precision':precision,'recall':recall,
            'f1':2*precision*recall/(precision+recall) if precision+recall else 0}
    for r in rows:
        bucket=confusion[r['expected']];bucket[r['predicted']]=bucket.get(r['predicted'],0)+1
    correct=sum(r['expected']==r['predicted'] for r in rows)
    return {'count':len(rows),'correct':correct,'accuracy':correct/len(rows) if rows else None,
            'macro_f1':sum(c['f1'] for c in classes.values())/len(classes) if classes else None,
            'per_class':classes,'confusion':confusion,
            'remaining_errors':[{'id':r['id'],'expected':r['expected'],'predicted':r['predicted']} for r in rows if r['expected']!=r['predicted']]}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=Path(__file__).resolve().parent/'runs/benchmark-v2')
    root=parser.parse_args().out
    if not (root/'collection_complete.json').exists():raise SystemExit('Collection completion marker is missing; inspect the run first.')
    report={'scope':'Post-collection notation audit; no new inference or implementation tuning',
            'scoring_amendment':'O(n * log n) and O(n log n) denote the same complexity. Normalize only this exact equivalent notation for scoring. Original strict-string scores remain available.',
            'labels_and_raw_predictions_modified':False}
    for stage in ['time_complexity','space_complexity']:
        rows=[json.loads(p.read_text()) for p in (root/stage/'records').glob('*.json')]
        report[stage]={'original_strict_string':summary(rows),'notation_normalized':summary(rows,True),
            'notation_only_adjustments':[{'id':r['id'],'expected':r['expected'],'raw_predicted':r.get('predicted')}
                for r in rows if r.get('predicted')!=r['expected'] and canonical(r.get('predicted'))==r['expected']]}
    videos=[json.loads(p.read_text()) for p in (root/'video').glob('video_*.json') if '.submission.' not in p.name]
    media=[]
    for state in videos:
        if state['status']!='downloaded':continue
        path=root/'video'/(state['case_id']+'.mp4')
        expected=state['artifact']['sha256']
        actual=hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
        media.append({'case_id':state['case_id'],'file_present':path.exists(),'download_hash_matches':actual==expected})
    report['video_integrity']={'states':dict(Counter(v['status'] for v in videos)),
        'all_downloaded_files_match_saved_hashes':all(m['download_hash_matches'] for m in media),'files':media}
    path=root/'notation_normalized_analysis.json'
    path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({stage:report[stage]['notation_normalized'] for stage in ['time_complexity','space_complexity']},indent=2))
    print('Saved separate audit:',path)


if __name__=='__main__':main()
