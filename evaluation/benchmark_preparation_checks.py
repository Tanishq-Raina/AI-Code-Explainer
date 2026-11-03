"""Preparation tests with mocks only. No frozen cases are executed or scored."""
import importlib.util
import json
from pathlib import Path
import sys
from unittest.mock import Mock
import pytest

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'backend'))
sys.path.insert(0,str(HERE))
import llm
import run_benchmarks as suite


@pytest.fixture
def local(monkeypatch):
    monkeypatch.setattr(llm,'LLM_PROVIDER','ollama')
    monkeypatch.setattr(llm,'LLM_API_URL','http://localhost:11434/v1/chat/completions')
    monkeypatch.setattr(llm,'ROUTELLM_API_KEY','fake-cloud-key-must-not-be-sent')


def response(content,**extra):
    value=Mock()
    value.json.return_value={'done':True,'done_reason':'stop','message':{'content':content},**extra}
    return value


def test_native_transport_preserves_evidence_and_never_sends_cloud_key(local,monkeypatch):
    post=Mock(return_value=response('{"problem_summary":"fixture"}',eval_count=9))
    monkeypatch.setattr(llm.requests,'post',post)
    trace=llm.call_llm_detailed('system','fixture',seed=4)
    args,kwargs=post.call_args
    assert args[0]=='http://localhost:11434/api/chat'
    assert 'Authorization' not in kwargs['headers']
    assert kwargs['json']['stream'] is False
    assert kwargs['json']['options']['seed']==4
    assert 'format' not in kwargs['json']
    assert trace['response']['eval_count']==9
    assert trace['raw_text']=='{"problem_summary":"fixture"}'


def test_native_rejects_remote_endpoint_before_request(local,monkeypatch):
    monkeypatch.setattr(llm,'LLM_API_URL','https://example.invalid/v1/chat/completions')
    post=Mock();monkeypatch.setattr(llm.requests,'post',post)
    with pytest.raises(ValueError,match='loopback'):llm.call_llm_detailed('s','u')
    post.assert_not_called()


@pytest.mark.parametrize('content',['not JSON','[]','null','42'])
def test_parse_failure_is_not_fabricated_hint(content):
    parsed=llm._parse_llm_response(content)
    assert parsed['status']=='LLMError'
    assert 'hint_1' not in parsed


def test_incomplete_and_truncated_are_visible(local,monkeypatch):
    for extra in [{'done':False},{'done_reason':'length'}]:
        monkeypatch.setattr(llm.requests,'post',Mock(return_value=response('{"why":"fixture"}',**extra)))
        trace=llm.call_llm_detailed('s','u')
        assert not trace['parse_ok']
        assert trace['raw_text']=='{"why":"fixture"}'


def test_default_launcher_does_not_call_services_or_stages(monkeypatch):
    monkeypatch.setattr(suite,'check_freeze',lambda:{'files':{}})
    monkeypatch.setattr(suite,'read',lambda path:{})
    forbidden=Mock(side_effect=AssertionError('Must not execute during preparation'))
    monkeypatch.setattr(suite,'preflight',forbidden)
    monkeypatch.setattr(suite,'oracle_validation',forbidden)
    monkeypatch.setattr(suite,'video_stage',forbidden)
    monkeypatch.setattr(suite,'hint_stage',forbidden)
    suite.main([])
    forbidden.assert_not_called()


def test_run_requires_explicit_video_transfer_flag(monkeypatch):
    monkeypatch.setattr(suite,'check_freeze',lambda:{'files':{}})
    monkeypatch.setattr(suite,'read',lambda path:{})
    forbidden=Mock();monkeypatch.setattr(suite,'preflight',forbidden)
    with pytest.raises(SystemExit):suite.main(['--run'])
    forbidden.assert_not_called()


def test_check_freeze_detects_source_drift(monkeypatch,tmp_path):
    data=tmp_path/'benchmark_v1';data.mkdir()
    source=tmp_path/'fixture.py';source.write_text('original')
    (data/'FREEZE.json').write_text(json.dumps({'files':{'fixture.py':suite.sha(source)}}))
    monkeypatch.setattr(suite,'DATA',data);monkeypatch.setattr(suite,'PROJECT',tmp_path)
    suite.check_freeze()
    source.write_text('changed')
    with pytest.raises(RuntimeError,match='Frozen files changed'):suite.check_freeze()
