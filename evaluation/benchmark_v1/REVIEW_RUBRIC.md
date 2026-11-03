# Frozen review rubric

The author is the sole assessor. Condition labels are hidden in the randomized
review sheet where possible, but text can reveal the condition. This is not an
independent expert study or inter-rater reliability assessment.

## Hint correctness

Score each complete response against the verified program, reference and task:

- 0: materially incorrect diagnosis, false Java claim or guidance that introduces
  another error or contradicts the task.
- 1: partially correct guidance with an incomplete or ambiguous diagnosis; note
  exactly which part is unsupported or misleading.
- 2: explains the verified defect correctly and the substantive guidance is
  consistent with the task and Java behavior.

Record actionability separately: 0 unhelpful/misleading, 1 related but vague,
2 concrete and useful for the next debugging step. Do not combine these scores
into an unexplained accuracy percentage or the old HQS.

Excessive disclosure is yes if the response provides a full replacement program
or more solution detail than the stated hint-level policy permits. A small code
snippet is not automatically proof that the no-solution policy was satisfied.
Progression is yes if levels become more specific in the intended conceptual,
logic and limited-code order; no if they repeat or reverse that progression;
use N/A and explain when a fallback supplies fewer than three levels.

Assess the preselected 30 programs ending 03,06,09, first repetition only, in all
three conditions. Do not replace inconvenient cases after reading outputs.
Blank scores remain missing, never silently correct. Keep concrete failure notes.

## Video capability criteria

Use the frozen expected_events and stdout for each scenario. Inspect the full
relevant transitions and narration, not only the title or final frame.

- Detection: use archived parser_summary evidence of the specific representation
  or semantic structure. An LLM naming a structure is not parser detection.
  Generic recognition as an array/object is insufficient for heap/trie/etc.
- Dedicated animation: the specific structure and requested operation/state
  change are represented correctly. A variable tracker or generic card is not a
  dedicated structure visualization. Graph arrows and link direction matter.
- Generic tracking: correctly showing values/output without a dedicated visual;
  count separately from dedicated coverage.
- Correctness: record transitions, narration and final output separately. Failure
  to generate a movie is a rendering failure, not a missing value to exclude.
- A right-rotation example does not establish full balanced-tree support; a
  Fenwick example does not establish segment-tree support. Recursion and graph
  representations are capability scenarios, not disjoint data-structure classes.

Report numerators over the stated 24 scenarios and disclose partial support.
Do not call successful downloads detection accuracy or educational effectiveness.

## Statistical interpretation

Average repetitions within each program before paired comparisons. The automatic
bootstrap is for the contract-acceptance difference only; it is not a test of
semantic quality. Related control-flow and rule families, synthetic provenance,
unassessed pretraining overlap and author judgment limit generalization.
