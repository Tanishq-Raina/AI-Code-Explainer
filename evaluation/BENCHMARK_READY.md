# Frozen benchmark v1 preparation

Status: prepared for a future authorized run. No benchmark programs, hint requests,
video jobs, guard measurements or complexity predictions were executed during
preparation. Only metadata reads and mocked/offline software tests were used.
The Java ground-truth execution gate is deliberately still pending.

## What is frozen

| Material | Count | Interpretation |
|---|---:|---|
| Buggy Java hint programs | 100 | Ten categories, ten cases each |
| Correct controls | 20 | Paired corrected versions; not independent extra algorithms |
| Legacy development examples | 20 | Previously used examples, excluded from final scores |
| Time-complexity cases | 60 | Six classes with ten cases each |
| Auxiliary-space cases | 40 | Four classes with ten cases each |
| Video capability scenarios | 24 | Dedicated/generic support must be inspected |
| Validator challenges | 100 | Four groups of 25; related rule families disclosed |
| Analytics scenarios | 12 | Synthetic rule behavior, not student learning |

Files are under evaluation/benchmark_v1. FREEZE.json seals their bytes, protocol,
runner, relevant backend/frontend source and analysis code. It is a tamper check,
not a claim that the labels have been empirically validated. Never overwrite a
freeze after seeing results. Changes require a new version and an explicit log.

The data are AI-assisted and author-constructed, with static author labels and no
independent raters. Category membership is a pedagogical primary tag, not a claim
that Java exception taxonomies are mutually exclusive. Complexity examples share
control-flow families, and time/space datasets can overlap. They must not be added
together and described as independent algorithms. Unordered collection outputs
are avoided. Twenty correct controls are paired references, not 20 new students.

Complexity labels refer to Main.work(n) with symbolic n, worst-case behavior and
unit-cost arithmetic. Space means peak auxiliary storage including recursion
frames, excluding inputs. Allocated arrays count as auxiliary storage because the
function returns an integer. A separate balanced space set prevents O(1) prevalence
in the time set from concealing space errors. The analyzer is not trained here.

## Model and service settings

Hints use local qwen3-coder:30b in Ollama, Q4_K_M, with its full installed digest,
Ollama version, 8192-token context, temperature 0.3, 1200 output-token limit and
600-second request timeout frozen in protocol.json. The output contract is
prompt-only JSON for both conditions; constrained decoding is not added to just
one condition. Raw text, complete response envelope, load/token timing and parse
failures are retained. Cloud credentials are never sent to the loopback endpoint.

Videos remain on the configured AbacusAI Qwen 480B model and Edge speech, as
requested. These are different deployments and must be described separately in
the paper. Video prompts/settings, parser traces, overview source and raw overview
responses are archived by the prepared service. Parser fallback is distinguishable
from a model-generated overview. The paper cannot claim that all code stays local.

The prepared machine has an i7-13700HX, approximately 16 GB RAM and an RTX 4060
Laptop GPU with 8188 MiB VRAM. The 30B weights exceed GPU memory; actual speed has
not been measured. Do not extrapolate the old cloud timings to local inference.

## Commands that do not start a benchmark

From the project root:

```powershell
.\.venv\Scripts\python.exe evaluation\run_benchmarks.py
```

This only checks the freeze. To also read local Ollama model identity, service
health, Docker image identity and tool versions, without inference or rendering:

```powershell
.\.venv\Scripts\python.exe evaluation\run_benchmarks.py --preflight
```

The equivalent PowerShell wrapper is evaluation/run_benchmarks.ps1. Its default
also does not run anything. Do not add -Run or --run until collection is intended.

## The command to use later when ready

```powershell
.\.venv\Scripts\python.exe evaluation\run_benchmarks.py --run --allow-external-video
```

The external-video flag authorizes this reviewed synthetic video set to the
declared AbacusAI and Microsoft speech services. It does not authorize uploading
other source files. There are no credentials in the frozen files.

One command runs everything in sequence, not simultaneously: oracle validation,
guard/analytics/time/space, videos, local hints, then review exports. This avoids
resource contention. Leave Docker and Ollama running, keep the computer awake,
close other heavy jobs and do not edit the frozen implementation during the run.
Metadata is read at startup and frozen hashes are checked again between stages.

The first stage compiles/runs 344 validation jobs: buggy programs, their reference
fixes, controls, video examples and compile-only complexity functions. It must
validate the actual expected exception/output before any model or video request.
An oracle mismatch stops the suite. Do not delete, relabel or silently exclude a
case to improve performance; report it and prepare a documented new version.

Hints compare code-only and diagnostic-grounded conditions on the same 100 cases.
The full pipeline reuses each grounded initial response, then records any strict
retry and fallback. Cases ending 03 and 08 in each category have two additional
repetitions. This is 280 initial test calls, at most 140 strict retries and one
excluded warmup. The exact duration is unknown until execution. There are 24 video
jobs at low quality, submitted sequentially; audio synthesis can make many speech
requests per video. There is no automatic multi-model search or prompt tuning.

The first-run hint cases ending 03, 06 and 09 are preselected for author review:
30 programs and 90 condition outputs. Review order is randomized and condition
mapping is kept separate. This is not independent or blinded expert validation.

## Pause and recovery

Default output: evaluation/runs/benchmark-v1. Rerun the exact same command and
output folder to resume. A global lock prevents duplicate suite launchers.
Completed responses, known failures and video job IDs are retained. A timeout
after video submission may leave a server job running: the collector stops instead
of blindly submitting another job. See VIDEO_PILOT.md for explicit UUID recovery.

Do not restart or rebuild the video container while jobs are pending: the server's
job store is in memory. Do not use the old pilot command for the final benchmark.
The previous pilot data remain separate and are not final benchmark cases.

Transport failures and timeouts are data. Five consecutive paired hint transport
failures stop the queue. A failed excluded warmup stops before test generations;
its record is retained for diagnosis. Do not delete failed call records to obtain
a favorable rerun. Ask for a documented recovery/version decision instead.

## After collection

Read collection_complete.json and all failure records. Completion means stages
were traversed, not that every case passed. Fill author_review.csv and
video_review.csv using the frozen rubric. Video technical success does not prove
correct detection, animation or narration. Use archived parser summaries and scene
files to distinguish parser recognition from LLM descriptions and generic display.

Descriptive analysis can be produced later with:

```powershell
.\.venv\Scripts\python.exe evaluation\analyze_benchmarks.py
```

It reports explicit denominators, class-wise confusion/F1, contract behavior,
fallback counts and case-level paired bootstrap intervals for contract acceptance.
It does not infer semantic correctness from keyword overlap, fill missing ratings,
claim significance for unrelated comparisons or establish educational benefit.
Correctness ratings, video capability judgments and the paper's conclusions still
require review. There is no participant study or inter-rater agreement in this run.

## Local application versus benchmark runner

The benchmark calls the local LLM functions directly and does not write MongoDB
or require the tutor Flask server. The video API is required. To use Ollama for
ordinary application hints, backend/start_local_tutor.ps1 sets local process
variables and starts the existing backend. It does not replace your .env secrets.
The benchmark preparation did not start that application or change its database.

Ollama transport reference: https://docs.ollama.com/api/chat
