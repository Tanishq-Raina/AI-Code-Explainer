# Pre-collection audit and revision v2

Audit date: 3 November 2026. Benchmark collection remains unstarted.

## Why the launch stopped

The installed Ollama server changed from 0.40.13 to 0.40.14. The installed
`qwen3-coder:30b` model digest is unchanged. The original launcher correctly
stopped at its runtime identity check, before creating a benchmark output
directory or executing any cases. This is an environment change, not evidence
that the model or datasets are broken.

V1 is preserved, including every originally sealed source file, in
`evaluation/freeze_history/benchmark-v1-pre-audit.zip`. Its manifest and archive
hashes are recorded in the new protocol. V1's original manifest has not been
overwritten. V2 uses the updated runtime and documented reliability fixes.
The seven case datasets and the video plan retain their exact original bytes;
sample counts and labels are unchanged. No result-based case selection occurred.

## Corrections made before collection

1. Runtime checks now name the installed and frozen versions. Version and model
   digest checks stay strict. Metadata is checked again before expensive service
   stages, and Ollama identity is checked periodically during hint collection.
2. Hint requests have durable intent records. Interrupted requests without a
   saved response stop recovery for reconciliation; they are not silently sent
   again. Saved responses and transport failures are reused without regeneration.
3. Review CSV files are written atomically and never overwrite existing author
   ratings when the suite is resumed.
4. A completion gate requires every planned hint, guard, analytics, complexity
   and terminal video record. It does not require scientific predictions to be
   correct; model failures remain part of the reported data.
5. Video polling rejects mismatched job identities and unknown stages. Successful
   downloads must match the server's job ID and SHA-256. Required successful-job
   provenance must be archived, and the server's Java hash must match the case.
6. Java compilation and output decoding use explicit UTF-8. Inherited Java options
   are removed from child-process environments. A zero exit with a VM warning is
   not mislabeled as a runtime crash. Compiler timeouts become explicit records.
7. Prompt diagnostics are capped at 40 lines and 4000 characters so repetitive
   StackOverflowError traces cannot consume the context budget. Full original
   diagnostics remain in oracle records. Truncation metadata includes the original
   text hash. This input-budget change is declared in the v2 protocol.
8. Analysis reports full-pipeline generation latency including strict retries,
   retry transport failures, and whether all required manual rating fields are
   complete. Formatting acceptance is still not described as factual correctness.

The default data directory is now `evaluation/benchmark_v2`; the default future
output is `evaluation/runs/benchmark-v2`. The command itself has not changed.

## Verification and operational check

129 offline software checks passed: 124 mocked/unit checks and five collector
checks using a temporary fake localhost server. They cover native transport,
request safety, source drift, version/digest mismatch, stage ordering, oracle
failure stopping later stages, interruption recovery, video identity/provenance,
CSV preservation, output handling and analysis with tiny invented fixtures.
They do not execute or score the frozen benchmark examples.

The prepared video container had stopped. The existing container was started
without rebuilding, and its health and exact image identity passed the metadata
check. Ollama version, model digest, Python dependencies, Node and Java compiler
versions also passed. No model, speech or render requests were made in this audit.

Use this safe check before collection:

```powershell
.\.venv\Scripts\python.exe evaluation\run_benchmarks.py --preflight
```

That command reads metadata and checks hashes; it does not run Java cases,
inference or rendering. A later automatic Ollama update intentionally invalidates
readiness until another documented review. Do not edit the frozen manifest to
bypass that check. Keep the computer awake and avoid restarting the video
container during actual collection.

## What remains deliberately untested

Actual execution-oracle validation of the 344 Java jobs remains the first gate
of a future authorized run. No claim is made that these cases already compile
or produce the expected output. A mismatch will stop before model/video calls.
Real inference availability, cloud-key validity, speech availability, media
generation and semantic accuracy cannot be guaranteed through offline tests.
The earlier separate timing pilot and video pilot are not benchmark results.
