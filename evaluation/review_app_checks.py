"""Review-interface tests using invented rows, never the real rating files."""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys
import pytest

sys.path.insert(0,str(Path(__file__).resolve().parent))
from review_app import ReviewStore,SCORE_FIELDS


@pytest.fixture
def store(tmp_path):
    row={'review_id':'R001','task':'fixture','code':'class Main {}','reference_code':'class Main {}',
         'expected_stdout':'','observed_error':'fixture diagnostic','problem_summary':'fixture summary',
         'why':'fixture reason','hint_1':'one','hint_2':'two','hint_3':'three','learning_tip':'fixture tip',
         **{field:'' for field in SCORE_FIELDS},'notes':''}
    source=tmp_path/'author_review.csv'
    with source.open('w',encoding='utf-8-sig',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=list(row));writer.writeheader();writer.writerow(row)
    ledger={'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'assessment_type':'fixture AI evaluation',
            'rules':[],'official_references':[],
            'ratings':[{'review_id':'R001',**dict(zip(SCORE_FIELDS,[2,2,'no','yes']))}]}
    (tmp_path/'ai_hint_evaluation').mkdir()
    (tmp_path/'ai_hint_evaluation/ai_hint_ratings.json').write_text(json.dumps(ledger))
    (tmp_path/'review_mapping_keep_separate.json').write_text(json.dumps([{'review_id':'R001','case_id':'fixture','condition':'code_only'}]))
    return ReviewStore(tmp_path)


def payload(revision=0,**changes):
    return {'review_id':'R001','revision':revision,
            'review':{'status':'reviewed',**dict(zip(SCORE_FIELDS,[2,2,'no','yes'])),'notes':'My own review',**changes}}


def test_initial_state_does_not_create_or_fill_reviews(store):
    assert store.snapshot()['reviews']=={}
    assert not store.path.exists()


def test_save_acceptance_survives_reload_and_preserves_source(store):
    before=(store.run_dir/'author_review.csv').read_bytes()
    result=store.save(payload())
    assert result['state']['reviews']['R001']['decision']=='accepted_ai'
    assert ReviewStore(store.run_dir).snapshot()['reviews']['R001']['notes']=='My own review'
    assert (store.run_dir/'author_review.csv').read_bytes()==before
    assert len(store.journal.read_text().splitlines())==1


def test_adjustment_is_separate_from_ai(store):
    review=store.save(payload(correctness_0_1_2=0))['state']['reviews']['R001']
    assert review['decision']=='adjusted_ai'
    assert store.ai['R001']['correctness_0_1_2']==2


def test_zero_scores_are_valid(store):
    review=store.save(payload(correctness_0_1_2=0,actionability_0_1_2=0))['state']['reviews']['R001']
    assert review['correctness_0_1_2']==0


def test_incomplete_reviews_can_be_flagged(store):
    result=store.save({'review_id':'R001','revision':0,'review':{'status':'flagged','notes':'Check again'}})
    assert result['state']['reviews']['R001']['status']=='flagged'
    assert result['state']['reviews']['R001']['correctness_0_1_2']==''


@pytest.mark.parametrize('field,value',[(SCORE_FIELDS[0],''),(SCORE_FIELDS[0],True),(SCORE_FIELDS[0],3),
    (SCORE_FIELDS[1],-1),(SCORE_FIELDS[2],'maybe'),(SCORE_FIELDS[3],'sometimes')])
def test_invalid_ratings_are_rejected(store,field,value):
    with pytest.raises(ValueError):store.save(payload(**{field:value}))
    assert not store.path.exists()


def test_concurrent_tab_conflict_does_not_overwrite(store):
    store.save(payload())
    with pytest.raises(FileExistsError):store.save(payload(notes='Stale request'))
    assert store.snapshot()['reviews']['R001']['notes']=='My own review'


def test_second_process_can_reload_the_latest_version(store):
    second=ReviewStore(store.run_dir)
    store.save(payload())
    assert second.snapshot()['revision']==1
    second.save(payload(1,notes='Latest valid edit'))
    assert store.snapshot()['reviews']['R001']['notes']=='Latest valid edit'


def test_csv_export_preserves_multiline_notes_and_actual_zero(store):
    store.save(payload(correctness_0_1_2=0,notes='First line, "quoted"\nSecond line'))
    rows=list(csv.DictReader(io.StringIO(store.export_csv().decode('utf-8-sig'))))
    assert rows[0]['correctness_0_1_2']=='0'
    assert rows[0]['notes']=='First line, "quoted"\nSecond line'
    assert rows[0]['review_status']=='reviewed'


def test_unreviewed_export_does_not_inherit_ai_scores(store):
    rows=list(csv.DictReader(io.StringIO(store.export_csv().decode('utf-8-sig'))))
    assert rows[0]['correctness_0_1_2']==''
    assert rows[0]['review_status']=='unreviewed'


def test_dataset_changes_refuse_to_reuse_saved_ratings(store):
    store.save(payload())
    (store.run_dir/'author_review.csv').write_text('changed')
    with pytest.raises(ValueError,match='differs'):ReviewStore(store.run_dir)


def test_unknown_response_cannot_write(store):
    request=payload();request['review_id']='../elsewhere'
    with pytest.raises(ValueError,match='Unknown'):store.save(request)
    assert not store.path.exists()


def test_history_retains_previous_ratings(store):
    store.save(payload());store.save(payload(1,correctness_0_1_2=1,notes='Reconsidered'))
    history=[json.loads(line) for line in store.journal.read_text().splitlines()]
    assert [event['review']['correctness_0_1_2'] for event in history]==[2,1]


def test_assignment_metadata_is_loaded_and_checked(store):
    assignment={'id':'reviewer_1','label':'Reviewer 1','review_ids':['R001'],'response_count':1}
    (store.run_dir/'assignment.json').write_text(json.dumps(assignment))
    assigned=ReviewStore(store.run_dir)
    assert assigned.assignment['label']=='Reviewer 1'
    assignment['review_ids']=['R002']
    (store.run_dir/'assignment.json').write_text(json.dumps(assignment))
    with pytest.raises(ValueError,match='assignment'):ReviewStore(store.run_dir)
