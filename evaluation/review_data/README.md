# Teammate hint review

This is a portable copy of the 90 synthetic responses and AI-assisted ratings,
with two disjoint 45-response assignments in `reviewer_1` and `reviewer_2`.
No model, Docker, API key, Java, npm or Python packages are needed. Python 3.10
or later is the only runtime requirement.

## Start

Pull the shared commit on `develop`, then open a terminal in the repository root.

Reviewer 1, Windows PowerShell:

```powershell
.\evaluation\start_hint_review.ps1 -Reviewer 1
```

Reviewer 2, Windows PowerShell:

```powershell
.\evaluation\start_hint_review.ps1 -Reviewer 2
```

Alternatively, on Windows, macOS or Linux (choose the assigned folder):

```text
python evaluation/review_app.py --run-dir evaluation/review_data/reviewer_1 --open
```

For reviewer 2, replace `reviewer_1` with `reviewer_2`. The page header identifies
the assignment and the progress counter starts at 0 of 45. The complete 90-response
owner view is still available with `start_hint_review.ps1 -Shared`.

Each assignment has 15 programs, with all three condition responses for each
program kept together. Each person therefore reviews 15 code-only, 15 grounded
and 15 full-pipeline outputs. Both assignments include all ten categories; each
category contributes one or two programs per person. No responses overlap.
`review_assignments.json` records the allocation. Do not redistribute IDs ad hoc.

Use `python3` instead of `python` if that is your Python command. The browser
opens http://127.0.0.1:8765. Keep the terminal running while reviewing. If needed,
choose `--port 8766` (or `-Port 8766` in PowerShell).

The local address works on the reviewer's own machine, not as a remotely shared
website. Each person runs their own server and keeps their own review file.

## Review

Read each task, submitted program, reference and complete tutor response. Check
the AI explanation, choose your own four scores and add notes where useful.
**Use AI scores** only fills the form. **Save review & next** records your judgment.
**Flag for later** does not count as a completed review. Enter your name in the
optional reviewer field so the returned assessment can be attributed correctly.

The source condition labels and AI ratings are visible. Describe the result as
a teammate's review of AI-assisted ratings; do not call it a blinded or
independent study. The AI initially helped author the benchmark and is not an
independent expert. Completing this review does not validate learning outcomes.

## Return your work

Click **Export reviews** after saving your decisions and send the downloaded
`reviewer_1_hint_reviews.json` or `reviewer_2_hint_reviews.json` to the project
owner. The CSV export is optional. Both exports are needed to cover all 90 rows.

Saved decisions also remain in the assigned `reviewer_1` or `reviewer_2` folder,
as `human_hint_reviews.json`; the history is in `human_hint_review_history.jsonl`. These
personal output files are ignored by Git. Do not overwrite another reviewer's
file or replace the original response/AI-rating inputs with your judgments.

Because the two people review different programs, do not calculate inter-rater
agreement or describe the same outputs as independently double-rated. Report
two reviewers assessing disjoint 45-response subsets with the same rubric.

This folder intentionally contains only the response sheet, condition mapping,
AI rating ledger and provenance manifest. Videos and the full collected run are
not required. The `.gitattributes` file preserves exact bytes so Windows/Linux
line endings do not invalidate the source hash check.
