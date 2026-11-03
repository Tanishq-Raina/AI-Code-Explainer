"""Reliability checks with mocks and tiny invented fixtures; never run benchmark cases."""
import csv
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

sys.path.insert(0,str(Path(__file__).resolve().parent))
import run_benchmarks as suite
import collect_video_pilot as collector


@pytest.fixture(autouse=True)
def prohibit_real_work(monkeypatch):
    monkeypatch.setattr(suite,'json_http',Mock(side_effect=AssertionError('No real services in audit checks')))
    monkeypatch.setattr(suite.subprocess,'run',Mock(side_effect=AssertionError('No real programs in audit checks')))


def test_version_mismatch_names_both_versions(monkeypatch):
    protocol={'ollama':{'base_url':'http://localhost:11434','model':'fixture','digest':'weights','version':'old'}}
    monkeypatch.setattr(suite,'json_http',Mock(side_effect=[{'models':[{'name':'fixture','digest':'weights'}]}, {'version':'new'}]))
    with pytest.raises(RuntimeError,match='frozen old, installed new'):suite.verify_ollama(protocol)


def test_changed_weights_are_rejected_even_if_version_matches(monkeypatch):
    protocol={'ollama':{'base_url':'http://localhost:11434','model':'fixture','digest':'weights','version':'same'}}
    metadata=Mock(return_value={'models':[{'name':'fixture','digest':'different'}]})
    monkeypatch.setattr(suite,'json_http',metadata)
    with pytest.raises(RuntimeError,match='digest'):suite.verify_ollama(protocol)
    assert metadata.call_count==1


def test_matching_metadata_passes_without_inference(monkeypatch):
    model={'name':'fixture','digest':'weights'}
    protocol={'ollama':{'base_url':'http://localhost:11434','model':'fixture','digest':'weights','version':'same'}}
    metadata=Mock(side_effect=[{'models':[model]},{'version':'same'}]);monkeypatch.setattr(suite,'json_http',metadata)
    assert suite.verify_ollama(protocol)==(model,'same')
    assert [call.args[0] for call in metadata.call_args_list]==['http://localhost:11434/api/tags','http://localhost:11434/api/version']


def test_saved_hint_call_is_not_repeated(tmp_path):
    infer=Mock(return_value={'transport_ok':True,'raw_text':'fixture'})
    first=suite.cached_call(tmp_path,'call',infer)
    assert suite.cached_call(tmp_path,'call',infer)==first
    infer.assert_called_once()


def test_interrupted_hint_intent_blocks_silent_repeat(tmp_path):
    infer=Mock(side_effect=KeyboardInterrupt)
    with pytest.raises(KeyboardInterrupt):suite.cached_call(tmp_path,'call',infer)
    retry=Mock()
    with pytest.raises(RuntimeError,match='Uncertain prior hint request'):suite.cached_call(tmp_path,'call',retry)
    retry.assert_not_called()


def test_recorded_transport_failure_is_preserved(tmp_path):
    infer=Mock(return_value={'transport_ok':False,'error_type':'Timeout'})
    suite.cached_call(tmp_path,'failed',infer)
    assert suite.cached_call(tmp_path,'failed',infer)['error_type']=='Timeout'
    infer.assert_called_once()


def test_manual_ratings_are_never_overwritten(tmp_path):
    path=tmp_path/'review.csv'
    suite.preserve_review_csv(path,[{'id':'R001','rating':''}])
    path.write_text('id,rating\nR001,2\n',encoding='utf-8')
    suite.preserve_review_csv(path,[{'id':'R001','rating':''}])
    assert 'R001,2' in path.read_text()


def test_review_csv_handles_multiline_code(tmp_path):
    path=tmp_path/'review.csv';rows=[{'id':'R001','code':'first\nsecond, "quoted"'}]
    suite.preserve_review_csv(path,rows)
    with path.open(encoding='utf-8-sig',newline='') as stream:assert list(csv.DictReader(stream))==rows


@pytest.fixture
def tiny_suite(tmp_path,monkeypatch):
    data=tmp_path/'data';out=tmp_path/'out';data.mkdir();out.mkdir()
    names=['guard_test','analytics_test','complexity_test','space_test','hints_test']
    for name in names:suite.write(data/(name+'.json'),[{'id':'fixture_01'}])
    suite.write(data/'video_test.json',{'cases':[{'id':'fixture_video'}]})
    monkeypatch.setattr(suite,'DATA',data)
    for stage in ['guard','analytics','time_complexity/records','space_complexity/records']:
        suite.write(out/stage/'fixture_01.json',{'result':'fixture'})
    suite.write(out/'hints/fixture_01_r0.json',{'result':'fixture'})
    suite.write(out/'video/fixture_video.json',{'status':'downloaded'})
    return data,out


def test_integrity_accepts_complete_fixture_records(tiny_suite):
    _,out=tiny_suite;suite.collection_integrity(out)
    assert suite.read(out/'integrity_check.json')['all_planned_records_present']


@pytest.mark.parametrize('stage',['guard','analytics','time_complexity/records','space_complexity/records','hints'])
def test_integrity_rejects_missing_stage_records(tiny_suite,stage):
    _,out=tiny_suite
    next((out/stage).glob('*.json')).unlink()
    with pytest.raises(RuntimeError,match='Incomplete collection'):suite.collection_integrity(out)
    assert not (out/'integrity_check.json').exists()


@pytest.mark.parametrize('status',['polling','submission_uncertain','job_missing','render_completed'])
def test_integrity_rejects_nonterminal_video(tiny_suite,status):
    _,out=tiny_suite;suite.write(out/'video/fixture_video.json',{'status':status})
    with pytest.raises(RuntimeError,match='not terminal'):suite.collection_integrity(out)


def java_protocol():
    return {'java':{'home':'unused','compile_timeout_seconds':30,'run_timeout_seconds':3,'heap_limit':'128m','stack_limit':'512k'}}


def test_java_warning_does_not_turn_zero_exit_into_runtime_error(monkeypatch,tmp_path):
    run=Mock(side_effect=[SimpleNamespace(returncode=0,stdout='',stderr=''),
                         SimpleNamespace(returncode=0,stdout='fixture\n',stderr='VM warning\n')])
    monkeypatch.setattr(suite.subprocess,'run',run)
    result=suite.execute_java('not compiled: mocked',tmp_path,java_protocol())
    assert result['status']=='Success' and result['output']=='fixture'
    assert result['error_message']=='VM warning\n'
    assert run.call_args.kwargs['encoding']=='utf-8'
    assert '-Dfile.encoding=UTF-8' in run.call_args.args[0]


def test_java_environment_cannot_inject_extra_options(monkeypatch,tmp_path):
    for name in ['JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS','CLASSPATH']:monkeypatch.setenv(name,'fixture')
    run=Mock(return_value=SimpleNamespace(returncode=0,stdout='',stderr=''));monkeypatch.setattr(suite.subprocess,'run',run)
    suite.execute_java('mocked',tmp_path,java_protocol(),False)
    environment=run.call_args.kwargs['env']
    assert not any(name in environment for name in ['JAVA_TOOL_OPTIONS','JDK_JAVA_OPTIONS','_JAVA_OPTIONS','CLASSPATH'])


def test_compile_timeout_is_a_durable_explicit_result(monkeypatch,tmp_path):
    monkeypatch.setattr(suite.subprocess,'run',Mock(side_effect=subprocess.TimeoutExpired('mocked',30)))
    assert suite.execute_java('mocked',tmp_path,java_protocol())['status']=='CompileTimeout'


def test_run_timeout_remains_explicit(monkeypatch,tmp_path):
    monkeypatch.setattr(suite.subprocess,'run',Mock(side_effect=[SimpleNamespace(returncode=0,stdout='',stderr=''),subprocess.TimeoutExpired('mocked',3)]))
    assert suite.execute_java('mocked',tmp_path,java_protocol())['status']=='Timeout'


@pytest.mark.parametrize('payload',[{'job_id':'different','stage':'completed'},{'job_id':'fixture-job','stage':'unknown'}])
def test_wrong_video_identity_or_schema_stops_without_submission(monkeypatch,tmp_path,payload):
    suite.write(tmp_path/'fixture.json',{'status':'submitted','job_id':'fixture-job','started_epoch':0})
    http=Mock(return_value=(200,payload));monkeypatch.setattr(collector,'http_json',http)
    args=SimpleNamespace(attach=None,max_wait=1,request_timeout=1,poll_seconds=.001)
    with pytest.raises(RuntimeError):collector.collect_case(tmp_path,{'id':'fixture'},'http://unused/api','low',args)
    assert http.call_count==1
    assert http.call_args.kwargs.get('body') is None


@pytest.mark.parametrize('defect',['none','missing_provenance','wrong_download_hash','wrong_java_hash'])
def test_video_stage_archives_and_checks_provenance(monkeypatch,tmp_path,defect):
    data=tmp_path/'data';data.mkdir();out=tmp_path/'out';out.mkdir()
    code='synthetic fixture only'
    suite.write(data/'video_test.json',{'cases':[{'id':'fixture_video','code':code}]});monkeypatch.setattr(suite,'DATA',data)
    body=b'fixture bytes, not a real movie';digest=hashlib.sha256(body).hexdigest()
    def collect(folder,*args):
        (folder/'fixture_video.mp4').write_bytes(body)
        suite.write(folder/'fixture_video.json',{'status':'downloaded','job_id':'fixture-job',
            'last_response':{'job_id':'fixture-job','artifact':{'job_id':'fixture-job','sha256':'wrong' if defect=='wrong_download_hash' else digest}}})
    monkeypatch.setattr(collector,'initialize',Mock());monkeypatch.setattr(collector,'collect_case',collect)
    def copy(command,**kwargs):
        target=Path(command[-1])
        if defect=='missing_provenance':return SimpleNamespace(returncode=1)
        if target.name=='generation.json':suite.write(target,{'java_sha256':'wrong' if defect=='wrong_java_hash' else hashlib.sha256(code.encode()).hexdigest()})
        else:target.write_text('fixture')
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(suite.subprocess,'run',copy)
    protocol={'video':{'base_url':'http://unused','quality':'low','max_wait_seconds':1,'poll_seconds':1,'container_name':'unused'}}
    if defect=='none':suite.video_stage(out,protocol)
    else:
        with pytest.raises(RuntimeError):suite.video_stage(out,protocol)


def test_review_export_preserves_filled_sheets(monkeypatch,tmp_path):
    data=tmp_path/'data';data.mkdir()
    suite.write(data/'hints_test.json',[])
    suite.write(data/'video_test.json',{'cases':[{'id':'fixture','category':'fixture','expected_stdout':'x','expected_events':['x']}]})
    monkeypatch.setattr(suite,'DATA',data)
    (tmp_path/'video_review.csv').write_text('author ratings already filled',encoding='utf-8')
    suite.review_export(tmp_path,{'seed':1})
    assert (tmp_path/'video_review.csv').read_text()=='author ratings already filled'


def test_preflight_mode_never_calls_stages(monkeypatch):
    monkeypatch.setattr(suite,'check_freeze',Mock(return_value={'files':{}}))
    monkeypatch.setattr(suite,'read',Mock(return_value={}))
    metadata=Mock(return_value={'no_inference_performed':True});monkeypatch.setattr(suite,'preflight',metadata)
    stage=Mock(side_effect=AssertionError('Stage must not run'))
    for name in ['oracle_validation','deterministic_stages','video_stage','hint_stage']:monkeypatch.setattr(suite,name,stage)
    suite.main(['--preflight'])
    metadata.assert_called_once();stage.assert_not_called()


def test_main_stops_before_any_stage_when_preflight_fails(monkeypatch,tmp_path):
    monkeypatch.setattr(suite,'check_freeze',Mock(return_value={'files':{}}))
    monkeypatch.setattr(suite,'read',Mock(return_value={}))
    monkeypatch.setattr(suite,'preflight',Mock(side_effect=RuntimeError('changed runtime')))
    stage=Mock();monkeypatch.setattr(suite,'oracle_validation',stage)
    out=tmp_path/'not-created'
    with pytest.raises(RuntimeError):suite.main(['--run','--allow-external-video','--out',str(out)])
    stage.assert_not_called();assert not out.exists()


def test_repetitive_diagnostics_are_bounded_without_changing_oracle_evidence():
    original={'status':'RuntimeError','error_message':'StackOverflowError\n'+'  at fixture.work(Main.java:2)\n'*1000}
    protocol={'diagnostic_budget':{'max_error_characters':4000,'max_error_lines':40}}
    result=suite.bounded_diagnostic(original,protocol)
    assert len(result['error_message'])<4100
    assert 'StackOverflowError' in result['error_message']
    assert result['diagnostic_truncation']['original_lines']==1001
    assert len(original['error_message'])>20000


def test_short_diagnostic_is_not_changed():
    original={'status':'RuntimeError','error_message':'NullPointerException'}
    assert suite.bounded_diagnostic(original,{'diagnostic_budget':{'max_error_characters':4000,'max_error_lines':40}})==original


def test_all_stages_run_in_declared_order_using_mocks_only(monkeypatch,tmp_path):
    events=[]
    monkeypatch.setattr(suite,'check_freeze',lambda:events.append('hashes') or {'files':{}})
    monkeypatch.setattr(suite,'read',Mock(return_value={}))
    monkeypatch.setattr(suite,'sha',lambda path:'fixture-hash')
    monkeypatch.setattr(suite,'preflight',lambda protocol:events.append('preflight') or {})
    for name in ['oracle_validation','deterministic_stages','video_stage','hint_stage','review_export']:
        monkeypatch.setattr(suite,name,lambda *args,name=name:events.append(name))
    monkeypatch.setattr(suite,'collection_integrity',lambda *args:events.append('integrity'))
    monkeypatch.setattr(suite,'HERE',tmp_path)
    suite.main(['--run','--allow-external-video','--out',str(tmp_path/'out')])
    stages=[e for e in events if e not in ('hashes','preflight')]
    assert stages==['oracle_validation','deterministic_stages','video_stage','hint_stage','integrity','review_export']
    assert events.count('preflight')==3


def test_oracle_failure_prevents_video_and_hint_calls(monkeypatch,tmp_path):
    monkeypatch.setattr(suite,'check_freeze',lambda:{'files':{}})
    monkeypatch.setattr(suite,'read',Mock(return_value={}))
    monkeypatch.setattr(suite,'sha',lambda path:'fixture-hash')
    monkeypatch.setattr(suite,'preflight',lambda protocol:{})
    monkeypatch.setattr(suite,'oracle_validation',Mock(side_effect=RuntimeError('oracle mismatch fixture')))
    forbidden=Mock(side_effect=AssertionError('Must not continue'))
    for name in ['deterministic_stages','video_stage','hint_stage','review_export']:monkeypatch.setattr(suite,name,forbidden)
    monkeypatch.setattr(suite,'HERE',tmp_path)
    with pytest.raises(RuntimeError,match='oracle mismatch'):suite.main(['--run','--allow-external-video','--out',str(tmp_path/'out')])
    forbidden.assert_not_called()
    assert not (tmp_path/'out/collection_complete.json').exists()


def test_analysis_counts_complete_pipeline_latency_and_partial_ratings(tmp_path):
    path=Path(__file__).with_name('analyze_benchmarks.py')
    spec=importlib.util.spec_from_file_location('analysis_fixture',path)
    analysis=importlib.util.module_from_spec(spec);spec.loader.exec_module(analysis)
    call={'transport_ok':True,'parse_ok':True,'guard_accepts':True,'elapsed_seconds':4}
    suite.write(tmp_path/'hints/fixture_r0.json',{'id':'fixture','code_only':call,'diagnostic_grounded':call,
        'full_pipeline':{'tier':'strict_retry','generation_seconds':7,'retry_traces':[{'transport_ok':False}]}})
    suite.preserve_review_csv(tmp_path/'author_review.csv',[{'correctness_0_1_2':'2','actionability_0_1_2':'',
        'excessive_disclosure_yes_no':'','progression_appropriate_yes_no':''}])
    summary=analysis.analyze(tmp_path)
    assert summary['hints']['full_pipeline_latency']['p50_seconds']==7
    assert summary['hints']['strict_retries']=={'calls':1,'transport_failures':1}
    assert summary['author_review']['correctness_rows_filled']==1
    assert summary['author_review']['complete'] is False
    assert summary['collection_finished'] is False
