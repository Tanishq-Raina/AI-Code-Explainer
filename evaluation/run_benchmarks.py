"""Frozen-suite launcher. Default is LOCAL HASH CHECK ONLY, never a benchmark.

--preflight reads local service metadata. --run is required for any measurements.
See BENCHMARK_READY.md before using --run --allow-external-video.
"""
from __future__ import annotations
import argparse
import contextlib
import csv
from datetime import datetime, timezone
import hashlib
import importlib
import io
from importlib.metadata import version as package_version
import json
import os
from pathlib import Path
import platform
import random
import re
import subprocess
import sys
import time
from types import SimpleNamespace
from unittest.mock import patch
from urllib import request

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parent
DATA=HERE/'benchmark_v2'
sys.path.insert(0,str(PROJECT/'backend'))
sys.path.insert(0,str(HERE))


def read(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def stamp(): return datetime.now(timezone.utc).isoformat()
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp')
    with temp.open('w',encoding='utf-8') as stream:
        json.dump(value,stream,indent=2,ensure_ascii=False);stream.flush();os.fsync(stream.fileno())
    os.replace(temp,path)


def check_freeze():
    manifest=read(DATA/'FREEZE.json')
    drift=[name for name,digest in manifest['files'].items() if not (PROJECT/name).is_file() or sha(PROJECT/name)!=digest]
    if drift: raise RuntimeError('Frozen files changed; do not mix versions: '+', '.join(drift))
    return manifest


def json_http(url):
    # Metadata only. Inference lives exclusively in the explicitly invoked stage.
    opener=request.build_opener(request.ProxyHandler({}))
    try:
        with opener.open(url,timeout=15) as response:return json.load(response)
    except (OSError,ValueError) as exc:
        raise RuntimeError(f'Cannot read local service metadata at {url}: {exc}. Check that the required local service is running; no inference was requested by this check.') from exc


def verify_ollama(protocol):
    o=protocol['ollama']
    tags=json_http(o['base_url']+'/api/tags')['models']
    model=next((m for m in tags if m['name']==o['model']),None)
    if not model or model['digest']!=o['digest']:raise RuntimeError('Installed Ollama model differs from frozen digest; do not substitute weights during collection')
    version=json_http(o['base_url']+'/api/version')['version']
    if version!=o['version']:raise RuntimeError(f'Ollama version changed: frozen {o["version"]}, installed {version}. Stop and create a documented revision before collection; never bypass the check.')
    return model,version


def preflight(protocol):
    model,version=verify_ollama(protocol)
    v=protocol['video']
    health=json_http(v['base_url']+'/health')
    if health.get('status')!='ok':raise RuntimeError('Video Render API unavailable or wrong port')
    inspected=json.loads(subprocess.run(['docker','inspect',v['container_name']],capture_output=True,text=True,check=True,timeout=20).stdout)[0]
    if inspected['Image']!=v['image_id']:raise RuntimeError('Video container image differs from freeze')
    if not inspected['State']['Running']:raise RuntimeError('Frozen video container is stopped')
    env=dict(x.split('=',1) for x in inspected['Config']['Env'])
    if env.get('LLM_MODEL')!=v['model'] or env.get('LLM_BASE_URL','').rstrip('/')!=v['model_endpoint'].rstrip('/'):
        raise RuntimeError('Video provider/model configuration differs from freeze')
    java=Path(protocol['java']['home'])/'bin'
    for name in ['java.exe','javac.exe']:
        if not (java/name).is_file():raise RuntimeError('Frozen Java runtime not found: '+str(java/name))
    node=protocol['node_executable']
    if not Path(node).is_file():raise RuntimeError('Frozen Node executable missing')
    for module in ['requests','tree_sitter','tree_sitter_java','tree_sitter_python','pymongo',
                   'ast_parser','hallucination_guard','topic_analyzer','fallback_engine']:
        importlib.import_module(module)
    if sys.version.split()[0]!=protocol['python_version']:raise RuntimeError('Python version changed')
    for package,expected in protocol['library_versions'].items():
        if package_version(package)!=expected:raise RuntimeError('Package version changed: '+package)
    versions={name:subprocess.run(command,capture_output=True,text=True,check=True,timeout=20).stdout.strip()
              for name,command in [('node',[node,'--version'])]}
    if versions['node']!=protocol['node_version']:raise RuntimeError('Node version changed')
    compiler=subprocess.run([str(java/'javac.exe'),'-version'],capture_output=True,text=True,check=True,timeout=20)
    versions['javac']=(compiler.stdout+compiler.stderr).strip()
    if versions['javac']!=protocol['java']['compiler_version']:raise RuntimeError('Java compiler version changed')
    return {'at':stamp(),'ollama_model':model,'ollama_version':version,'video_health':health,
            'video_image_id':inspected['Image'],'python':sys.version,'platform':platform.platform(),
            'cpu':platform.processor(),'logical_cpus':os.cpu_count(),'versions':versions,
            'no_inference_performed':True}


@contextlib.contextmanager
def locked(folder):
    folder.mkdir(parents=True,exist_ok=True)
    with (folder/'suite.lock').open('a+b') as lock:
        lock.seek(0)
        if not lock.read(1):lock.write(b'0');lock.flush()
        lock.seek(0)
        if os.name=='nt':
            import msvcrt
            msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        else:
            import fcntl
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        yield


def cached(folder,key,fn):
    path=folder/(key+'.json')
    if path.exists():return read(path)
    value=fn();write(path,value);return value


def cached_call(folder,key,fn):
    """Never silently regenerate a response lost between a request and durable save."""
    result=folder/(key+'.json');intent=folder/(key+'.intent.json')
    if result.exists():return read(result)
    if intent.exists():raise RuntimeError('Uncertain prior hint request: '+str(intent)+'. Preserve evidence and reconcile; no automatic repeat was sent.')
    write(intent,{'started_at':stamp(),'status':'request_started','key':key})
    value=fn();write(result,value)
    write(intent,{'finished_at':stamp(),'status':'response_saved','key':key})
    return value


def execute_java(code,folder,protocol,execute=True):
    folder.mkdir(parents=True,exist_ok=True)
    (folder/'Main.java').write_text(code,encoding='utf-8')
    j=protocol['java'];tools=Path(j['home'])/'bin'
    begin=time.perf_counter()
    environment={k:v for k,v in os.environ.items() if k.upper() not in {'JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS','CLASSPATH'}}
    try:
        compiled=subprocess.run([str(tools/'javac.exe'),'-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','Main.java'],
                                cwd=folder,capture_output=True,text=True,encoding='utf-8',errors='replace',env=environment,
                                timeout=j['compile_timeout_seconds'])
    except subprocess.TimeoutExpired:
        return {'status':'CompileTimeout','compiler_stdout':'','compiler_stderr':'Compiler exceeded time limit',
                'output':'','error_message':'Compiler exceeded time limit','compile_seconds':time.perf_counter()-begin}
    result={'compile_seconds':time.perf_counter()-begin,'compiler_stdout':compiled.stdout,'compiler_stderr':compiled.stderr}
    if compiled.returncode!=0:
        line=re.search(r'Main.java:(\d+)',compiled.stderr)
        return {**result,'status':'CompilationError','error_message':compiled.stderr,'output':'',
                'line_number':int(line.group(1)) if line else None}
    if not execute:return {**result,'status':'Compiled'}
    try:
        begin=time.perf_counter()
        ran=subprocess.run([str(tools/'java.exe'),'-Duser.language=en','-Duser.country=US','-Dfile.encoding=UTF-8',
                            '-Xmx'+j['heap_limit'],'-Xss'+j['stack_limit'],'-cp',str(folder.resolve()),'Main'],
                           cwd=folder,capture_output=True,text=True,encoding='utf-8',errors='replace',env=environment,
                           timeout=j['run_timeout_seconds'])
        exception=re.search(r'(?:[\w$]+\.)*([A-Za-z]\w*(?:Exception|Error))',ran.stderr)
        return {**result,'status':'Success' if ran.returncode==0 else 'RuntimeError','exit_code':ran.returncode,
                'output':ran.stdout.strip(),'error_message':ran.stderr,'run_seconds':time.perf_counter()-begin,
                'exception_type':exception.group(1) if exception else None}
    except subprocess.TimeoutExpired:
        return {**result,'status':'Timeout','output':'','error_message':'Execution time exceeded the frozen limit',
                'run_seconds':j['run_timeout_seconds']}


def oracle_validation(out,protocol):
    folder=out/'oracles'
    jobs=[]
    for case in read(DATA/'hints_test.json'):
        jobs.extend([(case['id'],case['code'],case,True),
                     (case['id']+'_reference',case['reference_code'],{**case,'expected_status':'Success','expected_exception':None},True)])
    for case in read(DATA/'controls.json')+read(DATA/'video_test.json')['cases']:
        jobs.append((case['id'],case['code'],{**case,'expected_status':'Success','expected_exception':None},True))
    for case in read(DATA/'complexity_test.json')+read(DATA/'space_test.json'):
        jobs.append((case['id'],case['code'],{'expected_status':'Compiled'},False))
    failures=[]
    for index,(identifier,code,case,execute) in enumerate(jobs):
        result=cached(folder/'records',identifier,lambda:execute_java(code,folder/'java'/identifier,protocol,execute))
        expected=case['expected_status']
        good=result['status']==('Success' if expected=='WrongOutput' else expected)
        if expected=='WrongOutput':good=good and result['output']!=case['expected_stdout']
        elif expected=='Success':good=good and result['output']==case['expected_stdout']
        if case.get('expected_exception'):good=good and case['expected_exception'] in result.get('error_message','')
        if not good:failures.append({'id':identifier,'expected':case,'actual':result})
        if index%20==0:print(f'Oracle validation {index+1}/{len(jobs)}',flush=True)
    write(folder/'validation.json',{'count':len(jobs),'failures':failures,'completed_at':stamp()})
    if failures:raise RuntimeError('Oracle validation failed. No inference started. See oracles/validation.json; do not silently relabel/drop cases.')


def deterministic_stages(out,protocol):
    from hallucination_guard import validate_and_filter_response
    from topic_analyzer import _classify,_hint_weight
    for case in read(DATA/'guard_test.json'):
        def run_guard(case=case):
            accepted=validate_and_filter_response(case['output'],{'status':'RuntimeError','exception_type':'ArithmeticException'}) is not None
            return {**case,'accepted':accepted,'contract_matches_expectation':accepted==case['expected_contract_accept'],
                    'semantic_error_accepted':accepted and case['semantic_label']=='incorrect'}
        cached(out/'guard',case['id'],run_guard)
    for case in read(DATA/'analytics_test.json'):
        def run_analytics(case=case):
            actual=_hint_weight(case['hints_used']) if 'hints_used' in case else _classify(case['stat'])
            expected=case.get('expected_weight',case.get('expected'))
            passed=abs(actual-expected)<1e-8 if isinstance(actual,float) else actual==expected
            return {**case,'actual':actual,'passed':passed,'scope':'synthetic rule behavior; not learning validation'}
        cached(out/'analytics',case['id'],run_analytics)
    from ast_parser import parse_code_to_structured_ast
    for filename,stage,helper,label in [('complexity_test.json','time_complexity','compute_complexity.mjs','time'),
                                       ('space_test.json','space_complexity','compute_space_complexity.mjs','space')]:
        for case in read(DATA/filename):
            def analyze(case=case,stage=stage,helper=helper,label=label):
                begin=time.perf_counter()
                try:
                    parsed=parse_code_to_structured_ast(case['code'],'java')
                    path=out/stage/'asts'/(case['id']+'.json');write(path,parsed)
                    response=subprocess.run([protocol['node_executable'],str(HERE/helper),str(path.resolve())],
                                             capture_output=True,text=True,timeout=60)
                    if response.returncode:raise RuntimeError(response.stderr)
                    value=json.loads(response.stdout)
                    return {'id':case['id'],'expected':case[label],'predicted':value['finalComplexity'],
                            'correct':value['finalComplexity']==case[label],'raw':value,'elapsed_seconds':time.perf_counter()-begin}
                except Exception as exc:return {'id':case['id'],'expected':case[label],'error':str(exc),'correct':False}
            cached(out/stage/'records',case['id'],analyze)


def video_stage(out,protocol):
    import collect_video_pilot as collector
    v=protocol['video'];plan=read(DATA/'video_test.json');folder=out/'video'
    folder.mkdir(parents=True,exist_ok=True)
    collector.initialize(folder,plan,v['base_url'],v['quality'],v)
    args=SimpleNamespace(attach=None,request_timeout=60,max_wait=v['max_wait_seconds'],poll_seconds=v['poll_seconds'])
    for case in plan['cases']:
        collector.collect_case(folder,case,v['base_url'],v['quality'],args)
        state=read(folder/(case['id']+'.json'))
        if not state.get('job_id'):continue
        evidence=folder/'server_evidence'/case['id'];evidence.mkdir(parents=True,exist_ok=True)
        artifacts={'generation.json':f'/app/var/scripts/{state["job_id"]}.generation.json',
                   'generated_scene.py':f'/app/var/scripts/{state["job_id"]}.py'}
        for name in ['command.json','stdout.log','stderr.log','exit.json','artifact.json']:
            artifacts[name]=f'/app/var/scripts/render_artifacts/{state["job_id"]}/{name}'
        missing=[]
        for filename,server_path in artifacts.items():
            if (evidence/filename).exists():continue
            copied=subprocess.run(['docker','cp',v['container_name']+':'+server_path,str(evidence/filename)],
                                  capture_output=True,text=True,timeout=30)
            if copied.returncode:missing.append(filename)
        write(evidence/'archive_status.json',{'missing':missing,'status':state['status']})
        if state['status']=='downloaded' and missing:
            raise RuntimeError('Completed video is missing required provenance: '+case['id']+' '+', '.join(missing))
        if (evidence/'generation.json').exists():
            generated=read(evidence/'generation.json')
            if generated['java_sha256']!=hashlib.sha256(case['code'].encode('utf-8')).hexdigest():
                raise RuntimeError('Server Java source differs from the frozen case: '+case['id'])
        if state['status']=='downloaded':
            payload=collector.unwrap(state['last_response']);artifact=payload.get('artifact',{})
            if artifact.get('job_id')!=state['job_id'] or artifact.get('sha256')!=sha(folder/(case['id']+'.mp4')):
                raise RuntimeError('Downloaded video identity/hash differs from server evidence: '+case['id'])


def configure_local(protocol):
    o=protocol['ollama']
    os.environ.update(LLM_PROVIDER='ollama',LLM_BASE_URL=o['base_url']+'/v1',LLM_MODEL=o['model'],
                      LLM_ENABLED='true',LLM_TIMEOUT=str(o['request_timeout_seconds']),
                      LLM_TEMPERATURE=str(o['temperature']),LLM_MAX_TOKENS=str(o['num_predict']))
    # Re-import after importing analytics/database (which loads .env); explicit local settings win.
    import llm
    importlib.reload(llm)
    return llm


def capture_call(llm,system,user,seed,protocol):
    begin=time.perf_counter()
    try:
        trace=llm.call_llm_detailed(system,user,seed=seed,num_ctx=protocol['ollama']['num_ctx'])
        return {**trace,'transport_ok':True}
    except Exception as exc:
        response=getattr(exc,'response',None)
        return {'transport_ok':False,'parse_ok':False,'parsed':{},'error_type':type(exc).__name__,
                'error':str(exc),'http_status':getattr(response,'status_code',None),
                'response_body':getattr(response,'text',None) if response is not None else None,
                'request_messages':[{'role':'system','content':system},{'role':'user','content':user}],
                'elapsed_seconds':time.perf_counter()-begin,'seed':seed}


def bounded_diagnostic(result,protocol):
    """Keep repetitive stack traces inside the frozen input budget; raw oracle stays intact."""
    diagnostic=dict(result)
    raw=str(diagnostic.get('error_message') or '')
    limits=protocol['diagnostic_budget']
    lines=raw.splitlines(keepends=True)
    text=''.join(lines[:limits['max_error_lines']])[:limits['max_error_characters']]
    if text!=raw:
        diagnostic['error_message']=text+'\n[Remaining diagnostic omitted by the frozen input budget.]'
        diagnostic['diagnostic_truncation']={'original_characters':len(raw),'original_lines':len(lines),
            'original_sha256':hashlib.sha256(raw.encode()).hexdigest(),'max_error_characters':limits['max_error_characters'],
            'max_error_lines':limits['max_error_lines']}
    return diagnostic


def hint_stage(out,protocol):
    llm=configure_local(protocol)
    import fallback_engine
    from hallucination_guard import validate_and_filter_response
    system=llm._build_system_prompt()
    warmup=read(DATA/'development.json')[0]
    warmup_trace=cached_call(out/'hints','warmup_excluded',lambda:capture_call(llm,system,
        llm._build_user_prompt(warmup['code'],{'status':'Unknown','error_message':'Development warmup; not scored'}),
        protocol['seed'],protocol))
    if not warmup_trace['transport_ok']:
        raise RuntimeError('Excluded warmup could not reach the model. No test generations started; inspect hints/warmup_excluded.json.')
    work=[]
    for case in read(DATA/'hints_test.json'):
        repeats=3 if case['id'].endswith(('_03','_08')) else 1
        for repetition in range(repeats):work.append((case,repetition))
    random.Random(protocol['seed']).shuffle(work)
    consecutive_errors=0
    for index,(case,repetition) in enumerate(work):
        if index%20==0:verify_ollama(protocol)
        identifier=case['id']+f'_r{repetition}'
        path=out/'hints'/(identifier+'.json')
        if path.exists():continue
        diagnostic=dict(read(out/'oracles'/'records'/(case['id']+'.json')))
        if case['expected_status']=='WrongOutput':
            diagnostic.update(status='WrongOutput',error_message='Output does not match the task specification. Actual stdout: '+diagnostic['output'])
        diagnostic=bounded_diagnostic(diagnostic,protocol)
        seed=protocol['seed']+repetition
        grounded=llm._build_user_prompt(case['code'],diagnostic,case['public_context'])
        footer=grounded[grounded.index('Please analyse the code and the error'):]
        code_only=grounded.split('Execution Result:')[0]+'Execution Result:\n  Diagnostic evidence not supplied.\n\n'+footer
        prompts={'code_only':code_only,'diagnostic_grounded':grounded}
        conditions=list(prompts) if index%2==0 else list(reversed(prompts))
        evidence={'id':case['id'],'category':case['category'],'repetition':repetition,'seed':seed,
                  'condition_order':conditions,'started_at':stamp(),'diagnostic':diagnostic}
        # Persist each initial response independently to avoid rerunning completed inference after interruption.
        for condition in conditions:
            evidence[condition]=cached_call(out/'hints'/'calls',identifier+'_'+condition,
                lambda condition=condition:capture_call(llm,system,prompts[condition],seed,protocol))
            evidence[condition]['guard_accepts']=validate_and_filter_response(evidence[condition].get('parsed'),diagnostic) is not None
        retry=[]
        def traced_retry(system_prompt,user_prompt):
            trace=cached_call(out/'hints'/'calls',identifier+'_strict_retry',
                lambda:capture_call(llm,system_prompt,user_prompt,seed+10000,protocol))
            retry.append(trace)
            return trace.get('parsed',{})
        begin=time.perf_counter()
        with patch.object(llm,'_call_llm',traced_retry):
            final=fallback_engine.process_with_fallback(case['code'],diagnostic,3,
                evidence['diagnostic_grounded'].get('parsed',{}),question_context=case['public_context'])
        evidence['full_pipeline']={'output':final,'tier':final.get('_tier'),'retry_traces':retry,
                                  'postprocessing_wall_seconds':time.perf_counter()-begin,
                                  'initial_call_seconds':evidence['diagnostic_grounded']['elapsed_seconds']}
        evidence['full_pipeline']['generation_seconds']=evidence['diagnostic_grounded']['elapsed_seconds']+sum(t['elapsed_seconds'] for t in retry)
        write(path,evidence)
        print(f'Hints {index+1}/{len(work)} {identifier}: {final.get("_tier")}',flush=True)
        failures=all(not evidence[c]['transport_ok'] for c in conditions)
        consecutive_errors=consecutive_errors+1 if failures else 0
        if consecutive_errors>=5:raise RuntimeError('Five consecutive paired transport failures. Queue stopped; recorded failures retained.')
    # Controls exercise the application's successful-execution eligibility gate, not an LLM accuracy test.
    write(out/'hints'/'controls_gate.json',{'count':len(read(DATA/'controls.json')),
          'model_calls':0,'scope':'Paired corrected controls passed execution oracles; success path does not request hints.'})


def preserve_review_csv(path,rows):
    if path.exists():return  # Never erase manual ratings when collection is resumed.
    buffer=io.StringIO(newline='')
    writer=csv.DictWriter(buffer,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
    temporary=path.with_suffix('.csv.tmp')
    with temporary.open('w',encoding='utf-8-sig',newline='') as stream:
        stream.write(buffer.getvalue());stream.flush();os.fsync(stream.fileno())
    os.replace(temporary,path)


def collection_integrity(out):
    """Require every planned record, including failures, before declaring collection complete."""
    expected={}
    for filename,stage in [('guard_test.json','guard'),('analytics_test.json','analytics'),
                           ('complexity_test.json','time_complexity/records'),('space_test.json','space_complexity/records')]:
        expected[stage]={c['id'] for c in read(DATA/filename)}
    expected['hints']={c['id']+f'_r{r}' for c in read(DATA/'hints_test.json')
                       for r in range(3 if c['id'].endswith(('_03','_08')) else 1)}
    for stage,identifiers in expected.items():
        missing=[name for name in identifiers if not (out/stage/(name+'.json')).is_file()]
        if missing:raise RuntimeError('Incomplete collection in '+stage+': '+', '.join(sorted(missing)))
    for case in read(DATA/'video_test.json')['cases']:
        path=out/'video'/(case['id']+'.json')
        if not path.exists() or read(path)['status'] not in ('downloaded','failed','rejected'):
            raise RuntimeError('Video collection is not terminal: '+case['id'])
    write(out/'integrity_check.json',{'at':stamp(),'all_planned_records_present':True,
                                    'counts':{k:len(v) for k,v in expected.items()}})


def review_export(out,protocol):
    rows=[];mapping=[]
    cases={c['id']:c for c in read(DATA/'hints_test.json')}
    records=[]
    for path in sorted((out/'hints').glob('*_r0.json')):
        value=read(path)
        if value['id'].endswith(('_03','_06','_09')):
            for condition in ['code_only','diagnostic_grounded','full_pipeline']:
                payload=value[condition].get('output',value[condition].get('parsed',{}))
                records.append((value,condition,payload))
    random.Random(protocol['seed']).shuffle(records)
    for i,(value,condition,payload) in enumerate(records):
        blind=f'R{i+1:03d}';case=cases[value['id']]
        rows.append({'review_id':blind,'task':case['name'],'code':case['code'],'reference_code':case['reference_code'],
                     'expected_stdout':case['expected_stdout'],'observed_error':value['diagnostic'].get('error_message',''),
                     **{k:payload.get(k,'') for k in ['problem_summary','why','hint_1','hint_2','hint_3','learning_tip']},
                     'correctness_0_1_2':'','actionability_0_1_2':'','excessive_disclosure_yes_no':'','progression_appropriate_yes_no':'','notes':''})
        mapping.append({'review_id':blind,'case_id':value['id'],'condition':condition})
    if rows:
        preserve_review_csv(out/'author_review.csv',rows)
    write(out/'review_mapping_keep_separate.json',mapping)
    video_rows=[{'case_id':c['id'],'category':c['category'],'expected_stdout':c['expected_stdout'],
                 'expected_events':'; '.join(c['expected_events']),
                 'detection':'','dedicated_animation':'','generic_tracking':'','state_transitions_correct':'',
                 'narration_correct':'','output_correct':'','notes':''} for c in read(DATA/'video_test.json')['cases']]
    preserve_review_csv(out/'video_review.csv',video_rows)
    write(out/'collection_complete.json',{'at':stamp(),'meaning':'All planned collection stages traversed; inspect recorded failures.',
          'semantic_assessment':'pending author review; no independent ratings or learning outcomes'})


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preflight',action='store_true',help='Read local metadata only; no inference or Java execution')
    parser.add_argument('--run',action='store_true',help='Start the frozen suite; do NOT use until ready')
    parser.add_argument('--allow-external-video',action='store_true',help='Authorize this frozen synthetic video set to configured AbacusAI and Edge speech')
    parser.add_argument('--out',type=Path,default=HERE/'runs'/'benchmark-v2')
    args=parser.parse_args(argv)
    manifest=check_freeze();protocol=read(DATA/'protocol.json')
    print('Frozen file hashes verified. Dataset counts:',json.dumps(read(DATA/'dataset_summary.json')),flush=True)
    if not args.run:
        if args.preflight:print(json.dumps(preflight(protocol),indent=2))
        print('PREPARATION ONLY: no benchmark, inference, rendering or Java execution started.')
        return
    if not args.allow_external_video:parser.error('--run also requires --allow-external-video for the declared external video services')
    metadata=preflight(protocol)
    with locked(HERE/'runs'/'benchmark-global'), locked(args.out):
        contract={'freeze_sha256':sha(DATA/'FREEZE.json'),'protocol':protocol}
        path=args.out/'run_manifest.json'
        if path.exists():
            if read(path)['contract']!=contract:raise RuntimeError('Output directory belongs to another frozen configuration')
        else:write(path,{'contract':contract,'started_at':stamp(),'runtime_metadata':metadata})
        print('Stage 1: execute all oracles before inference',flush=True);oracle_validation(args.out,protocol)
        check_freeze();print('Stages 2-5: validator, analytics, time and space',flush=True);deterministic_stages(args.out,protocol)
        check_freeze();preflight(protocol);print('Stage 6: sequential external video jobs',flush=True);video_stage(args.out,protocol)
        check_freeze();preflight(protocol);print('Stage 7: local hint conditions and frozen repetitions',flush=True);hint_stage(args.out,protocol)
        check_freeze()
        collection_integrity(args.out)
        print('Stage 8: export review sheets',flush=True);review_export(args.out,protocol)
        print('Collection finished. Failures remain in the dataset; author review and analysis are next.',flush=True)


if __name__=='__main__':
    try:main()
    except KeyboardInterrupt:
        print('Stopped. Do not restart the video container; rerun the same command/output folder to resume.',file=sys.stderr);sys.exit(130)
    except Exception as exc:
        print('STOPPED:',str(exc),file=sys.stderr);sys.exit(1)
