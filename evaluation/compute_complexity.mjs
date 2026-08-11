/**
 * Node.js script that takes a parsed AST JSON (from backend /api/parse-ast)
 * and runs the frontend complexity analysis pipeline.
 * 
 * Usage: node compute_complexity.mjs <ast_json_file>
 * Output: JSON with { finalComplexity: "O(...)" }
 */

import { readFileSync } from "fs";
import { toSimulatorProgramAst } from "../frontend/src/simulator/astAdapter.js";
import { buildTimeComplexityTimeline } from "../frontend/src/simulator/timeComplexityVisualizer.js";

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: node compute_complexity.mjs <ast_json_file>");
  process.exit(1);
}

const raw = readFileSync(inputFile, "utf-8");
const parsed = JSON.parse(raw);

const language = parsed.language || "java";
const programAst = toSimulatorProgramAst(parsed, language);
const timeline = buildTimeComplexityTimeline(programAst);

console.log(JSON.stringify({
  finalComplexity: timeline.finalComplexity,
  totalSteps: timeline.metadata?.totalSteps || 0,
  dominantTerm: timeline.metadata?.dominantTerm || "1",
}));
