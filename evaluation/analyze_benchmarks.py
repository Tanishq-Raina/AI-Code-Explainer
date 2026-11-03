"""Post-collection descriptive analysis. No model, Java or render calls.

Semantic and educational claims require the separately completed review/study.
"""
import argparse
import csv
import json
from pathlib import Path
import random
from statistics import mean


def read(path):return json.loads(path.read_text(encoding='utf-8'))
def fraction(values):return sum(values)/len(values) if values else None
def percentile(values,q):
    if not values:return None
    ordered=sorted(values);return ordered[round((len(ordered)-1)*q)]
def paired_bootstrap(differences,seed=20261103):
    if not differences:return None
    rng=random.Random(seed)
    sampled=[mean(rng.choices(differences,k=len(differences))) for _ in range(10000)]
    return {'mean_difference':mean(differences),'ci95':[percentile(sampled,.025),percentile(sampled,.975)],
            'unit':'program; repetitions averaged within program','method':'paired program bootstrap, 10000 draws'}


def analyze(root):
    result={'scope':'technical benchmark; no independent ratings or learning study'}
    for stage in ['time_complexity','space_complexity']:
        rows=[read(p) for p in (root/stage/'records').glob('*.json')]
        labels=sorted(set(r['expected'] for r in rows))
        by_label={}
        confusion={label:{} for label in labels}
        f1=[]
        for label in labels:
            tp=sum(r.get('predicted')==label and r['expected']==label for r in rows)
            fp=sum(r.get('predicted')==label and r['expected']!=label for r in rows)
            fn=sum(r.get('predicted')!=label and r['expected']==label for r in rows)
            precision=tp/(tp+fp) if tp+fp else 0
            recall=tp/(tp+fn) if tp+fn else 0
            score=2*precision*recall/(precision+recall) if precision+recall else 0
            f1.append(score)
            by_label[label]={'count':tp+fn,'precision':precision,'recall':recall,'f1':score}
        for r in rows:
            prediction=r.get('predicted','ERROR')
            confusion[r['expected']][prediction]=confusion[r['expected']].get(prediction,0)+1
        result[stage]={'count':len(rows),'accuracy':fraction([r['correct'] for r in rows]),
                       'per_class':by_label,'macro_f1':mean(f1) if f1 else None,'confusion':confusion,
                       'failures':sum('error' in r for r in rows),'note':'Related control-flow families limit generalization.'}
    guards=[read(p) for p in (root/'guard').glob('*.json')]
    result['guard']={group:{'count':len(selected),'accepted':sum(r['accepted'] for r in selected),
                                  'contract_matches':sum(r['contract_matches_expectation'] for r in selected)}
                     for group in sorted({r['group'] for r in guards})
                     if (selected:=[r for r in guards if r['group']==group])}
    result['guard']['semantic_warning']='Acceptance of well-formed factual errors demonstrates limits; contract accuracy is not hallucination-detection accuracy.'
    hints=[read(p) for p in (root/'hints').glob('*_r*.json')]
    result['hints']={}
    for condition in ['code_only','diagnostic_grounded']:
        rows=[r[condition] for r in hints]
        result['hints'][condition]={'generations':len(rows),'transport_ok':sum(r['transport_ok'] for r in rows),
            'parse_ok':sum(r['parse_ok'] for r in rows),'guard_accepts':sum(r['guard_accepts'] for r in rows),
            'latency_p50_seconds':percentile([r['elapsed_seconds'] for r in rows],.5),
            'latency_p95_seconds':percentile([r['elapsed_seconds'] for r in rows],.95)}
    paired={}
    for r in hints:
        paired.setdefault(r['id'],[]).append(int(r['diagnostic_grounded']['guard_accepts'])-int(r['code_only']['guard_accepts']))
    result['hints']['paired_contract_acceptance_difference']=paired_bootstrap([mean(x) for x in paired.values()])
    tiers={}
    for r in hints:
        tier=r['full_pipeline']['tier'];tiers[tier]=tiers.get(tier,0)+1
    result['hints']['full_pipeline_tiers']=tiers
    result['hints']['interpretation']='Format validity and fallback availability are not factual correctness or educational quality.'
    analytics=[read(p) for p in (root/'analytics').glob('*.json')]
    result['analytics']={'count':len(analytics),'passed':sum(r['passed'] for r in analytics),
                         'scope':'synthetic rule tests, not learner mastery validation'}
    video=[read(p) for p in (root/'video').glob('video_*.json') if '.submission.' not in p.name]
    result['video']={'count':len(video),'downloaded':sum(r['status']=='downloaded' for r in video),
                      'failed':sum(r['status']=='failed' for r in video),
                      'coverage_and_semantic_accuracy':'pending manual capability review; download success is not coverage'}
    review=root/'author_review.csv'
    if review.exists():
        with review.open(encoding='utf-8-sig',newline='') as stream: ratings=list(csv.DictReader(stream))
        filled=[r for r in ratings if r['correctness_0_1_2'].strip() in ('0','1','2')]
        result['author_review']={'expected_rows':len(ratings),'correctness_rows_filled':len(filled),
                                'complete':len(filled)==len(ratings),'independent_raters':False}
    result['collection_finished']=(root/'collection_complete.json').exists()
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=Path(__file__).resolve().parent/'runs'/'benchmark-v1')
    args=parser.parse_args()
    if not (args.out/'run_manifest.json').exists():raise SystemExit('No benchmark run exists. Nothing to analyze.')
    summary=analyze(args.out)
    (args.out/'descriptive_analysis.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(json.dumps(summary,indent=2))
