"""Prepare disjoint 45-response review sets. No inference or benchmark execution."""
from collections import Counter,defaultdict
import csv
import hashlib
import json
from pathlib import Path
import random

HERE=Path(__file__).resolve().parent


def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(root):
    from review_app import ReviewStore
    root=Path(root)
    parent=ReviewStore(root)
    mapping=json.loads((root/'review_mapping_keep_separate.json').read_text())
    ledger=json.loads((root/'ai_hint_evaluation/ai_hint_ratings.json').read_text())
    groups=defaultdict(list)
    for row in mapping:groups[row['case_id'].rsplit('_',1)[0]].append(row['case_id'])
    categories=sorted(groups)
    assert len(categories)==10
    rng=random.Random(20261103)
    selected=[set(),set()]
    for index,category in enumerate(categories):
        cases=sorted(set(groups[category]));assert len(cases)==3
        rng.shuffle(cases)
        number=2 if index%2==0 else 1
        selected[0].update(cases[:number]);selected[1].update(cases[number:])
    assert len(selected[0])==len(selected[1])==15 and not selected[0]&selected[1]
    assert not any((root/f'reviewer_{i}').exists() for i in (1,2)),'Assignments already exist; never overwrite ongoing reviews.'
    plan={'source_dataset_hash':parent.dataset_hash,'rule':'Two disjoint program-level sets; all three conditions for a program stay together',
          'total_responses':90,'shared_responses':0,'inter_rater_agreement':'Not estimable from disjoint assignments',
          'assignments':{}}
    for number,case_ids in enumerate(selected,1):
        identifier=f'reviewer_{number}';folder=root/identifier
        (folder/'ai_hint_evaluation').mkdir(parents=True)
        subset_mapping=[row for row in mapping if row['case_id'] in case_ids]
        review_ids={row['review_id'] for row in subset_mapping}
        rows=[row for row in parent.rows if row['review_id'] in review_ids]
        assert len(rows)==45
        with (folder/'author_review.csv').open('w',encoding='utf-8-sig',newline='') as stream:
            writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
        child={**ledger,'source_sha256':digest(folder/'author_review.csv'),
               'subset_of_original_ledger_sha256':digest(root/'ai_hint_evaluation/ai_hint_ratings.json'),
               'ratings':[row for row in ledger['ratings'] if row['review_id'] in review_ids]}
        (folder/'ai_hint_evaluation/ai_hint_ratings.json').write_text(json.dumps(child,indent=2)+'\n',encoding='utf-8')
        (folder/'review_mapping_keep_separate.json').write_text(json.dumps(subset_mapping,indent=2)+'\n',encoding='utf-8')
        assignment={'id':identifier,'label':f'Reviewer {number}','response_count':45,'program_count':15,
            'review_ids':sorted(review_ids),'case_ids':sorted(case_ids),
            'condition_counts':dict(Counter(row['condition'] for row in subset_mapping)),
            'programs_by_category':dict(Counter(case.rsplit('_',1)[0] for case in case_ids)),
            'source_dataset_hash':parent.dataset_hash}
        assert set(assignment['condition_counts'].values())=={15}
        (folder/'assignment.json').write_text(json.dumps(assignment,indent=2)+'\n',encoding='utf-8')
        child_store=ReviewStore(folder)
        assignment['dataset_hash']=child_store.dataset_hash
        (folder/'assignment.json').write_text(json.dumps(assignment,indent=2)+'\n',encoding='utf-8')
        plan['assignments'][identifier]=assignment
    assert set(plan['assignments']['reviewer_1']['review_ids'])|set(plan['assignments']['reviewer_2']['review_ids'])==parent.ids
    assert not set(plan['assignments']['reviewer_1']['review_ids'])&set(plan['assignments']['reviewer_2']['review_ids'])
    (root/'review_assignments.json').write_text(json.dumps(plan,indent=2)+'\n',encoding='utf-8')
    return plan


if __name__=='__main__':
    plan=prepare(HERE/'review_data')
    print(json.dumps({key:{'responses':value['response_count'],'programs':value['program_count'],
                           'conditions':value['condition_counts']} for key,value in plan['assignments'].items()},indent=2))
