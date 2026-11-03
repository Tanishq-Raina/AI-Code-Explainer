# Hint review interface

For two teammates cloning the repository, use `start_hint_review.ps1 -Reviewer 1`
and `start_hint_review.ps1 -Reviewer 2`, respectively (45 responses each).
Use `-Shared` only for the complete 90-response owner view.
The self-contained instructions and data are in `evaluation/review_data/README.md`.
The launcher can use ordinary Python if the project's virtual environment is absent.

From the project root:

```powershell
.\evaluation\start_hint_review.ps1
```

The launcher opens http://127.0.0.1:8765 and keeps a small local server running.
Leave that terminal open while reviewing. No tutor backend, Ollama, Docker,
internet connection or benchmark execution is needed. If the reviewer is already
running, open the address directly. Use `-Port 8766` to choose another port.

Each page shows one of the 90 responses, its submitted Java code and verified
reference, reference output, recorded diagnostic, all response fields, AI scores
and the response-specific rationale. Use the reference tab to switch programs.
The same randomized response order is retained. Condition labels are visible
because this workflow reviews existing AI judgments; it is not a blinded study.

1. Read the code, response and AI explanation.
2. Pick your four ratings or click **Use AI scores** to fill them.
3. Add your own note when useful.
4. Click **Save review & next** to commit and continue, or **Save** to stay.
5. Use **Flag for later** for an uncertain or incomplete assessment. Flagged
   cases do not count as completed reviews.

Find a response by task or ID, or filter by unreviewed, reviewed, flagged,
disagreements or AI correctness issues. Previous/Next navigation retains drafts.
Drafts are kept in that browser; **Save** writes the actual review file.

Saved ratings go to `evaluation/runs/benchmark-v2/human_hint_reviews.json`.
Earlier saved decisions are retained in `human_hint_review_history.jsonl`.
The original author CSV, video CSV, frozen files and AI rating ledger are not
modified. A conflicting save from another tab is rejected rather than silently
overwritten; use **Reload saved reviews** and save your retained draft again.

**Export reviews** downloads the JSON ratings. **CSV** downloads a separate CSV
containing the original response fields plus your choices. Unreviewed responses
remain blank, and zero scores remain zero. Exports contain saved reviews only;
browser drafts must be saved first.

This creates user review of AI-assisted ratings. It does not establish independent
expert assessment or inter-rater reliability. Keep the AI evaluation alongside
your amendments when reporting the assessment method.
