"""
Hallucination Guard Evaluation Script
======================================
Tests the hallucination_guard.validate_and_filter_response() function
with 30 test cases: 15 valid responses that should PASS and 15 invalid/
hallucinated responses that should be REJECTED.

Categories tested:
- Valid well-formed hints (should pass)
- Missing required keys (should reject)
- Empty required fields (should reject)
- Code fences in hints (should reject)
- Full solution leakage (should reject)
- Wrong types (should reject)
- Edge cases
"""

import sys
import json
from datetime import datetime

sys.path.insert(0, "backend")
from hallucination_guard import validate_and_filter_response

# Each test case: (id, category, description, llm_output, execution_result, expected_outcome)
# expected_outcome: "pass" = should return a dict, "reject" = should return None

DATASET = [
    # =========================================================================
    # VALID RESPONSES (should PASS the guard) - 15 cases
    # =========================================================================
    (1, "Valid", "Complete well-formed response with all fields",
     {
         "problem_summary": "Missing semicolon at end of statement.",
         "why": "Java requires every statement to end with a semicolon.",
         "hint_1": "Check line 3 for a missing punctuation mark.",
         "hint_2": "Add a semicolon after the variable declaration.",
         "hint_3": "int x = 10;",
         "learning_tip": "Review Java statement termination rules.",
     },
     {"status": "CompilationError", "error_message": "';' expected"},
     "pass"),

    (2, "Valid", "Minimal valid response (only required keys)",
     {
         "problem_summary": "Array index is out of bounds.",
         "why": "You are accessing an index that does not exist in the array.",
         "hint_1": "Check your loop boundary condition.",
         "learning_tip": "Arrays in Java are zero-indexed.",
     },
     {"status": "RuntimeError", "error_message": "ArrayIndexOutOfBoundsException"},
     "pass"),

    (3, "Valid", "Response with hint_2 but no hint_3",
     {
         "problem_summary": "NullPointerException thrown at runtime.",
         "why": "A variable is null when you try to call a method on it.",
         "hint_1": "Identify which variable could be null.",
         "hint_2": "Initialize the variable before using it.",
         "learning_tip": "Always check for null before calling methods.",
     },
     {"status": "RuntimeError", "error_message": "NullPointerException"},
     "pass"),

    (4, "Valid", "Response with special characters in text",
     {
         "problem_summary": "Type mismatch: cannot convert String to int.",
         "why": "Java is strongly typed - you can't assign a String value to an int variable.",
         "hint_1": "Look at the types on both sides of the '=' sign.",
         "hint_2": "Use Integer.parseInt() if you need to convert.",
         "hint_3": "int num = Integer.parseInt(str);",
         "learning_tip": "Study Java's type system and casting rules.",
     },
     {"status": "CompilationError", "error_message": "incompatible types"},
     "pass"),

    (5, "Valid", "Response with longer explanations",
     {
         "problem_summary": "The for loop has incorrect syntax using commas instead of semicolons.",
         "why": "In Java, the three parts of a for loop header (initialization, condition, update) must be separated by semicolons, not commas. The compiler interprets commas differently and cannot parse the loop correctly.",
         "hint_1": "Look at the separators between the three parts of your for loop header.",
         "hint_2": "Replace the commas with semicolons in the for loop parentheses.",
         "hint_3": "for (int i = 0; i < 10; i++)",
         "learning_tip": "Remember the for loop syntax: for(init; condition; update)",
     },
     {"status": "CompilationError", "error_message": "illegal start of expression"},
     "pass"),

    (6, "Valid", "Response about division by zero",
     {
         "problem_summary": "ArithmeticException due to division by zero.",
         "why": "Dividing an integer by zero is undefined in Java and throws an ArithmeticException at runtime.",
         "hint_1": "Check the value of the divisor variable before the division.",
         "hint_2": "Add a condition to check if the divisor is zero before dividing.",
         "learning_tip": "Always validate divisors to prevent ArithmeticException.",
     },
     {"status": "RuntimeError", "error_message": "ArithmeticException: / by zero"},
     "pass"),

    (7, "Valid", "Response about scope error",
     {
         "problem_summary": "Variable not found - it was declared in a different scope.",
         "why": "Variables declared inside an if block are only visible within that block. Once the block ends, the variable no longer exists.",
         "hint_1": "Check where the variable 'result' is declared.",
         "hint_2": "Move the declaration outside the if block so it is accessible later.",
         "hint_3": "Declare the variable before the if statement.",
         "learning_tip": "Learn about variable scope and block-level declarations in Java.",
     },
     {"status": "CompilationError", "error_message": "cannot find symbol"},
     "pass"),

    (8, "Valid", "Response with unicode-safe content",
     {
         "problem_summary": "The method name is misspelled.",
         "why": "Java method names are case-sensitive. The method 'lenght' does not exist on String.",
         "hint_1": "Check the spelling of the method you are calling.",
         "hint_2": "The correct method name uses standard English spelling.",
         "learning_tip": "Use IDE autocomplete to avoid typos in method names.",
     },
     {"status": "CompilationError", "error_message": "cannot find symbol: method lenght()"},
     "pass"),

    (9, "Valid", "Response about infinite recursion",
     {
         "problem_summary": "StackOverflowError due to infinite recursion.",
         "why": "The recursive method never stops calling itself because there is no base case to terminate the recursion.",
         "hint_1": "Look for a condition that should stop the recursion.",
         "hint_2": "Add a base case that returns a value without making another recursive call.",
         "hint_3": "if (n <= 1) return 1;",
         "learning_tip": "Every recursive method needs a base case to prevent infinite recursion.",
     },
     {"status": "RuntimeError", "error_message": "StackOverflowError"},
     "pass"),

    (10, "Valid", "Response about private access",
     {
         "problem_summary": "Cannot access a private field from outside the class.",
         "why": "Private members are only accessible within the class that declares them. External code cannot read or modify them directly.",
         "hint_1": "Check the access modifier of the field you are trying to use.",
         "hint_2": "Use a public getter method to access the private field.",
         "learning_tip": "Study Java access modifiers: public, private, protected, and default.",
     },
     {"status": "CompilationError", "error_message": "name has private access in Animal"},
     "pass"),

    (11, "Valid", "Response with empty optional hint_2 and hint_3 absent",
     {
         "problem_summary": "Static context cannot reference non-static method.",
         "why": "The main method is static but display() is not. Static methods cannot call instance methods directly.",
         "hint_1": "You need an object instance to call a non-static method.",
         "learning_tip": "Understand the difference between static and instance members.",
     },
     {"status": "CompilationError", "error_message": "non-static method cannot be referenced from a static context"},
     "pass"),

    (12, "Valid", "Response about ClassCastException",
     {
         "problem_summary": "ClassCastException when casting String to Integer.",
         "why": "Even though both are Objects, a String cannot be cast to Integer because they are unrelated types in the class hierarchy.",
         "hint_1": "Check what type the object actually is before casting.",
         "hint_2": "Use instanceof to verify the type before attempting a cast.",
         "learning_tip": "Learn about Java type hierarchy and safe casting with instanceof.",
     },
     {"status": "RuntimeError", "error_message": "ClassCastException"},
     "pass"),

    (13, "Valid", "Response with numbers and symbols in hints",
     {
         "problem_summary": "Array created with negative size throws NegativeArraySizeException.",
         "why": "Java does not allow arrays with negative length. The size must be >= 0.",
         "hint_1": "Check the value passed to new int[...] - it must not be negative.",
         "hint_2": "Ensure the size variable is 0 or greater before creating the array.",
         "learning_tip": "Validate array sizes before allocation to avoid runtime exceptions.",
     },
     {"status": "RuntimeError", "error_message": "NegativeArraySizeException"},
     "pass"),

    (14, "Valid", "Response about NumberFormatException",
     {
         "problem_summary": "NumberFormatException when parsing a non-numeric string.",
         "why": "Integer.parseInt() expects a string containing only digits. Letters or special characters cause this exception.",
         "hint_1": "Check what string value you are passing to parseInt().",
         "hint_2": "Validate the string contains only digits before parsing.",
         "learning_tip": "Use try-catch or regex validation before parsing strings to numbers.",
     },
     {"status": "RuntimeError", "error_message": "NumberFormatException"},
     "pass"),

    (15, "Valid", "Response with hint_3 containing short code snippet",
     {
         "problem_summary": "Variable used before declaration.",
         "why": "In Java, variables must be declared before they are used. The compiler reads top to bottom.",
         "hint_1": "Check the order of your variable declaration and usage.",
         "hint_2": "Move the declaration above the line where you first use the variable.",
         "hint_3": "int result = 42; System.out.println(result);",
         "learning_tip": "Always declare variables before referencing them.",
     },
     {"status": "CompilationError", "error_message": "cannot find symbol: variable result"},
     "pass"),

    # =========================================================================
    # INVALID / HALLUCINATED RESPONSES (should be REJECTED) - 15 cases
    # =========================================================================
    (16, "MissingKey", "Missing 'problem_summary' key",
     {
         "why": "The variable is not declared.",
         "hint_1": "Declare the variable before using it.",
         "learning_tip": "Study variable declarations.",
     },
     {"status": "CompilationError", "error_message": "cannot find symbol"},
     "reject"),

    (17, "MissingKey", "Missing 'why' key",
     {
         "problem_summary": "Syntax error in code.",
         "hint_1": "Check for missing semicolons.",
         "learning_tip": "Review Java syntax rules.",
     },
     {"status": "CompilationError", "error_message": "';' expected"},
     "reject"),

    (18, "MissingKey", "Missing 'hint_1' key",
     {
         "problem_summary": "Type mismatch error.",
         "why": "You cannot assign a String to an int.",
         "hint_2": "Use parseInt to convert.",
         "learning_tip": "Study type casting.",
     },
     {"status": "CompilationError", "error_message": "incompatible types"},
     "reject"),

    (19, "MissingKey", "Missing 'learning_tip' key",
     {
         "problem_summary": "Array out of bounds.",
         "why": "Index exceeds array length.",
         "hint_1": "Check your loop condition.",
     },
     {"status": "RuntimeError", "error_message": "ArrayIndexOutOfBoundsException"},
     "reject"),

    (20, "EmptyField", "Empty 'problem_summary' field",
     {
         "problem_summary": "",
         "why": "The loop never terminates.",
         "hint_1": "Add an increment statement.",
         "learning_tip": "Always ensure loops have exit conditions.",
     },
     {"status": "Timeout", "error_message": "Execution timed out"},
     "reject"),

    (21, "EmptyField", "Empty 'hint_1' field (whitespace only)",
     {
         "problem_summary": "Null pointer exception.",
         "why": "A null reference is being dereferenced.",
         "hint_1": "   ",
         "learning_tip": "Check for null before method calls.",
     },
     {"status": "RuntimeError", "error_message": "NullPointerException"},
     "reject"),

    (22, "CodeFence", "Code fence in problem_summary",
     {
         "problem_summary": "The error is ```java\nint x = 10;\n``` missing semicolon.",
         "why": "Semicolons are required.",
         "hint_1": "Add a semicolon.",
         "learning_tip": "Review syntax rules.",
     },
     {"status": "CompilationError", "error_message": "';' expected"},
     "reject"),

    (23, "CodeFence", "Code fence in hint_2",
     {
         "problem_summary": "Variable not found.",
         "why": "The variable is out of scope.",
         "hint_1": "Check variable scope.",
         "hint_2": "Move declaration outside: ```java\nint x;\nif(true){x=5;}\n```",
         "learning_tip": "Study block scope.",
     },
     {"status": "CompilationError", "error_message": "cannot find symbol"},
     "reject"),

    (24, "CodeFence", "Code fence in hint_3",
     {
         "problem_summary": "Missing return statement.",
         "why": "Method must return a value.",
         "hint_1": "Add a return statement.",
         "hint_2": "Return the computed value.",
         "hint_3": "```java\nreturn result;\n```",
         "learning_tip": "Non-void methods must return.",
     },
     {"status": "CompilationError", "error_message": "missing return statement"},
     "reject"),

    (25, "FullSolution", "Contains 'public static void main' (full solution)",
     {
         "problem_summary": "The code has a type error.",
         "why": "String cannot be assigned to int.",
         "hint_1": "Here is the corrected version: public static void main(String[] args) { int x = 5; }",
         "learning_tip": "Study type compatibility.",
     },
     {"status": "CompilationError", "error_message": "incompatible types"},
     "reject"),

    (26, "FullSolution", "Contains 'import java.' indicating full solution",
     {
         "problem_summary": "Scanner usage error.",
         "why": "Wrong method called on Scanner.",
         "hint_1": "You need to import java.util.Scanner and use nextLine() instead.",
         "learning_tip": "Read Scanner documentation.",
     },
     {"status": "RuntimeError", "error_message": "InputMismatchException"},
     "reject"),

    (27, "FullSolution", "Contains 'complete solution' phrase",
     {
         "problem_summary": "Loop logic error.",
         "why": "The loop condition is wrong.",
         "hint_1": "Change <= to < in the loop.",
         "hint_2": "Here is the complete solution for your reference.",
         "learning_tip": "Practice loop boundaries.",
     },
     {"status": "RuntimeError", "error_message": "ArrayIndexOutOfBoundsException"},
     "reject"),

    (28, "WrongType", "hint_1 is an integer instead of string",
     {
         "problem_summary": "Syntax error found.",
         "why": "Missing bracket.",
         "hint_1": 42,
         "learning_tip": "Check brackets.",
     },
     {"status": "CompilationError", "error_message": "'{' expected"},
     "reject"),

    (29, "WrongType", "Input is a list instead of dict",
     ["problem_summary", "why", "hint_1", "learning_tip"],
     {"status": "CompilationError", "error_message": "';' expected"},
     "reject"),

    (30, "WrongType", "Input is None",
     None,
     {"status": "RuntimeError", "error_message": "NullPointerException"},
     "reject"),
]


def run_evaluation():
    """Run the hallucination guard evaluation."""
    print("=" * 80)
    print("HALLUCINATION GUARD EVALUATION")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Dataset: {len(DATASET)} test cases (15 valid + 15 invalid)")
    print("=" * 80)
    print()

    results = []
    correct = 0
    category_results = {}

    for idx, (sample_id, category, description, llm_output, exec_result, expected) in enumerate(DATASET):
        # Run the hallucination guard
        result = validate_and_filter_response(llm_output, exec_result)

        # Determine if the guard made the correct decision
        if expected == "pass":
            is_correct = result is not None
            actual = "PASSED" if result is not None else "REJECTED"
            expected_label = "PASS"
        else:
            is_correct = result is None
            actual = "REJECTED" if result is None else "PASSED"
            expected_label = "REJECT"

        status = "CORRECT" if is_correct else "WRONG"
        if is_correct:
            correct += 1

        print(f"[{idx+1:02d}/30] #{sample_id:02d} [{category}] {description}")
        print(f"        Expected: {expected_label} | Actual: {actual} | {status}")

        if category not in category_results:
            category_results[category] = {"correct": 0, "total": 0}
        category_results[category]["total"] += 1
        if is_correct:
            category_results[category]["correct"] += 1

        results.append({
            "id": sample_id,
            "category": category,
            "description": description,
            "expected": expected,
            "actual": "pass" if result is not None else "reject",
            "correct": is_correct,
            "guard_output": result,
        })

    # --- Summary ---
    print()
    print("=" * 80)
    print("EVALUATION SUMMARY")
    print("=" * 80)
    print()

    accuracy = correct / len(DATASET)
    print(f"Overall Accuracy: {correct}/{len(DATASET)} = {accuracy*100:.1f}%")
    print()

    # Split by valid vs invalid
    valid_correct = sum(1 for r in results if r["expected"] == "pass" and r["correct"])
    valid_total = sum(1 for r in results if r["expected"] == "pass")
    invalid_correct = sum(1 for r in results if r["expected"] == "reject" and r["correct"])
    invalid_total = sum(1 for r in results if r["expected"] == "reject")

    print(f"True Positive Rate (valid accepted):    {valid_correct}/{valid_total} = {valid_correct/valid_total*100:.1f}%")
    print(f"True Negative Rate (invalid rejected):  {invalid_correct}/{invalid_total} = {invalid_correct/invalid_total*100:.1f}%")
    print()

    # False positives and negatives
    false_positives = [r for r in results if r["expected"] == "reject" and not r["correct"]]
    false_negatives = [r for r in results if r["expected"] == "pass" and not r["correct"]]

    if false_positives:
        print(f"False Positives (hallucinations that slipped through): {len(false_positives)}")
        for r in false_positives:
            print(f"  #{r['id']:02d} [{r['category']}] {r['description']}")
    else:
        print("False Positives: 0 (no hallucinations slipped through)")

    print()

    if false_negatives:
        print(f"False Negatives (valid responses incorrectly rejected): {len(false_negatives)}")
        for r in false_negatives:
            print(f"  #{r['id']:02d} [{r['category']}] {r['description']}")
    else:
        print("False Negatives: 0 (no valid responses were incorrectly rejected)")

    print()

    # Per-category breakdown
    print("Per-Category Breakdown:")
    print("-" * 60)
    print(f"{'Category':<20} {'Correct':<12} {'Accuracy':<10}")
    print("-" * 60)
    for cat, data in sorted(category_results.items()):
        cat_acc = data["correct"] / data["total"] * 100
        print(f"{cat:<20} {data['correct']}/{data['total']}          {cat_acc:.1f}%")
    print("-" * 60)
    print()

    # Save results
    output = {
        "evaluation_date": datetime.now().isoformat(),
        "total_samples": len(DATASET),
        "overall_accuracy": round(accuracy, 4),
        "true_positive_rate": round(valid_correct / valid_total, 4),
        "true_negative_rate": round(invalid_correct / invalid_total, 4),
        "false_positives": len(false_positives),
        "false_negatives": len(false_negatives),
        "category_results": {cat: round(d["correct"]/d["total"], 4) for cat, d in category_results.items()},
        "results": results,
    }

    output_path = "evaluation/hallucination_guard_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False, default=str)
    print(f"Detailed results saved to: {output_path}")
    print("=" * 80)

    return output


if __name__ == "__main__":
    run_evaluation()
