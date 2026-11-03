"""Seal prepared datasets, source, settings and launchers. Never runs benchmarks."""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parent
DATA=HERE/'benchmark_v2'
def read(name):return json.loads((DATA/name).read_text(encoding='utf-8'))
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

if (DATA/'FREEZE.json').exists():raise SystemExit('Already frozen. Verify it, or create a new version; do not overwrite the freeze.')
for name in ['hints_test.json','controls.json','development.json','complexity_test.json','space_test.json','guard_test.json','analytics_test.json']:
    rows=read(name)
    assert len({r['id'] for r in rows})==len(rows),name+' has duplicate IDs'
assert Counter(r['category'] for r in read('hints_test.json'))=={k:10 for k in ['syntax','scope','types','methods','null','index','arithmetic','parsing','termination','logic']}
assert len({r['code'] for r in read('hints_test.json')})==100
assert len(read('video_test.json')['cases'])==24
assert len(read('complexity_test.json'))==60 and len(read('space_test.json'))==40
assert len(read('guard_test.json'))==100 and len(read('analytics_test.json'))==12
paths=set()
for pattern in ['backend/*.py','backend/requirements.txt','backend/.env.ollama.example','backend/start_local_tutor.ps1',
                'frontend/src/simulator/*.js','frontend/package.json','evaluation/benchmark_v2/*.json',
                'evaluation/benchmark_v2/*.md','evaluation/benchmark_v2/*.txt']:
    paths.update(PROJECT.glob(pattern))
for name in ['run_benchmarks.py','run_benchmarks.ps1','analyze_benchmarks.py','freeze_benchmark.py','prepare_benchmark.py',
             'collect_video_pilot.py','compute_complexity.mjs','compute_space_complexity.mjs',
             'benchmark_preparation_checks.py','benchmark_audit_checks.py','video_collector_checks.py',
             'BENCHMARK_READY.md','BENCHMARK_AUDIT.md','freeze_history/benchmark-v1-pre-audit.zip']:
    paths.add(HERE/name)
manifest={'frozen_at_utc':datetime.now(timezone.utc).isoformat(),'version':'v2','status':'prepared not executed',
          'execution_oracles':'NOT RUN: first gate of future authorized collection',
          'files':{p.relative_to(PROJECT).as_posix():digest(p) for p in sorted(paths)}}
(DATA/'FREEZE.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('Frozen',len(paths),'files. No benchmark execution occurred.')
