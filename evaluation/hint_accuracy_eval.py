"""
Hint Accuracy Evaluation Script
================================
Sends 30 Java code samples with various errors to the AI-Code-Explainer
backend one by one, collects hints, and evaluates their accuracy.

Error categories covered:
- Compilation errors (syntax, type, missing symbols)
- Runtime errors (NPE, ArrayIndexOutOfBounds, StackOverflow, etc.)
- Logic errors (wrong output)
- Common beginner mistakes
"""

import json
import time
import requests
from datetime import datetime

API_URL = "http://localhost:5000/api/submit-code"
USER_ID = "eval_user_001"

# Each entry: (id, error_category, description, code, expected_error_keywords)
# expected_error_keywords: list of keywords we expect the hints to mention
DATASET = [
    # --- COMPILATION ERRORS ---
    (1, "SyntaxError", "Missing semicolon",
     """public class Main {
    public static void main(String[] args) {
        int x = 10
        System.out.println(x);
    }
}""",
     ["semicolon", ";", "missing", "statement"]),

    (2, "SyntaxError", "Unclosed string literal",
     """public class Main {
    public static void main(String[] args) {
        String msg = "Hello World;
        System.out.println(msg);
    }
}""",
     ["string", "literal", "unclosed", "quote"]),

    (3, "SyntaxError", "Missing closing brace",
     """public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println(i);
    }
}""",
     ["brace", "}", "block", "close"]),

    (4, "TypeError", "Incompatible types - String to int",
     """public class Main {
    public static void main(String[] args) {
        int number = "hello";
        System.out.println(number);
    }
}""",
     ["type", "incompatible", "String", "int", "assign"]),

    (5, "TypeError", "Cannot compare String with ==",
     """public class Main {
    public static void main(String[] args) {
        String a = new String("hello");
        String b = new String("hello");
        if (a == b) {
            System.out.println("Equal");
        } else {
            System.out.println("Not Equal");
        }
    }
}""",
     ["equals", "==", "reference", "compare", "String"]),

    (6, "SymbolError", "Undeclared variable",
     """public class Main {
    public static void main(String[] args) {
        System.out.println(result);
        int result = 42;
    }
}""",
     ["variable", "declared", "symbol", "scope", "before"]),

    (7, "SymbolError", "Misspelled method name",
     """public class Main {
    public static void main(String[] args) {
        String text = "Hello";
        System.out.println(text.lenght());
    }
}""",
     ["method", "symbol", "spell", "length"]),

    (8, "SyntaxError", "Missing return type on method",
     """public class Main {
    public static main(String[] args) {
        System.out.println("Hello");
    }
}""",
     ["return", "type", "void", "method"]),

    (9, "TypeError", "Array type mismatch",
     """public class Main {
    public static void main(String[] args) {
        int[] numbers = {1, 2, "three", 4, 5};
        System.out.println(numbers[2]);
    }
}""",
     ["type", "array", "int", "String", "incompatible"]),

    (10, "SyntaxError", "Invalid for loop syntax",
     """public class Main {
    public static void main(String[] args) {
        for (int i = 0, i < 10, i++) {
            System.out.println(i);
        }
    }
}""",
     ["for", "loop", "syntax", "semicolon", ","]),

    # --- RUNTIME ERRORS ---
    (11, "NullPointerException", "Calling method on null",
     """public class Main {
    public static void main(String[] args) {
        String text = null;
        System.out.println(text.length());
    }
}""",
     ["null", "NullPointer", "initialize", "object"]),

    (12, "ArrayIndexOutOfBounds", "Accessing index beyond array length",
     """public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        System.out.println(arr[5]);
    }
}""",
     ["index", "bound", "array", "length", "range"]),

    (13, "StackOverflow", "Infinite recursion",
     """public class Main {
    public static int factorial(int n) {
        return n * factorial(n - 1);
    }
    public static void main(String[] args) {
        System.out.println(factorial(5));
    }
}""",
     ["recursion", "base case", "stack", "overflow", "condition"]),

    (14, "ArithmeticException", "Division by zero",
     """public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 0;
        System.out.println(a / b);
    }
}""",
     ["division", "zero", "ArithmeticException", "divide"]),

    (15, "ClassCastException", "Invalid type cast",
     """public class Main {
    public static void main(String[] args) {
        Object obj = "Hello";
        Integer num = (Integer) obj;
        System.out.println(num);
    }
}""",
     ["cast", "type", "ClassCast", "Object", "Integer"]),

    (16, "StringIndexOutOfBounds", "charAt with invalid index",
     """public class Main {
    public static void main(String[] args) {
        String word = "Java";
        char c = word.charAt(10);
        System.out.println(c);
    }
}""",
     ["index", "bound", "charAt", "length", "String"]),

    (17, "NumberFormatException", "Parsing non-numeric string",
     """public class Main {
    public static void main(String[] args) {
        String value = "abc123";
        int num = Integer.parseInt(value);
        System.out.println(num);
    }
}""",
     ["parse", "number", "format", "numeric", "parseInt"]),

    (18, "ConcurrentModification", "Modifying list during iteration",
     """import java.util.ArrayList;
public class Main {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("a");
        list.add("b");
        list.add("c");
        for (String s : list) {
            if (s.equals("b")) {
                list.remove(s);
            }
        }
        System.out.println(list);
    }
}""",
     ["concurrent", "modification", "iterator", "remove", "loop"]),

    (19, "InputMismatch", "Scanner reading wrong type",
     """import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner("hello");
        int num = sc.nextInt();
        System.out.println(num);
    }
}""",
     ["input", "mismatch", "Scanner", "type", "int"]),

    (20, "NegativeArraySize", "Creating array with negative size",
     """public class Main {
    public static void main(String[] args) {
        int[] arr = new int[-5];
        System.out.println(arr.length);
    }
}""",
     ["negative", "array", "size", "NegativeArraySize"]),

    # --- LOGIC ERRORS & COMMON BEGINNER MISTAKES ---
    (21, "LogicError", "Off-by-one in loop (prints one extra)",
     """public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};
        for (int i = 0; i <= arr.length; i++) {
            System.out.println(arr[i]);
        }
    }
}""",
     ["bound", "index", "<=", "<", "length", "off-by-one"]),

    (22, "LogicError", "Using = instead of == in condition",
     """public class Main {
    public static void main(String[] args) {
        int x = 5;
        if (x = 10) {
            System.out.println("Ten");
        }
    }
}""",
     ["=", "==", "assignment", "comparison", "condition"]),

    (23, "ScopeError", "Variable declared inside if block used outside",
     """public class Main {
    public static void main(String[] args) {
        int x = 10;
        if (x > 5) {
            int result = x * 2;
        }
        System.out.println(result);
    }
}""",
     ["scope", "variable", "block", "declared", "outside"]),

    (24, "TypeError", "Comparing int with String using equals()",
     """public class Main {
    public static void main(String[] args) {
        int num = 5;
        if (num.equals(5)) {
            System.out.println("Five");
        }
    }
}""",
     ["primitive", "int", "equals", "method", "object"]),

    (25, "SyntaxError", "Missing parentheses in if statement",
     """public class Main {
    public static void main(String[] args) {
        int x = 10;
        if x > 5 {
            System.out.println("Big");
        }
    }
}""",
     ["parentheses", "(", "if", "condition", "syntax"]),

    (26, "LogicError", "Infinite while loop - missing increment",
     """public class Main {
    public static void main(String[] args) {
        int i = 0;
        while (i < 10) {
            System.out.println(i);
        }
    }
}""",
     ["infinite", "loop", "increment", "update", "i++"]),

    (27, "TypeError", "Void method used in expression",
     """public class Main {
    public static void greet() {
        System.out.println("Hello");
    }
    public static void main(String[] args) {
        String result = greet();
        System.out.println(result);
    }
}""",
     ["void", "return", "type", "method", "assign"]),

    (28, "AccessError", "Accessing private member from another context",
     """class Animal {
    private String name = "Dog";
}
public class Main {
    public static void main(String[] args) {
        Animal a = new Animal();
        System.out.println(a.name);
    }
}""",
     ["private", "access", "visibility", "modifier", "getter"]),

    (29, "SyntaxError", "Static method calling non-static method",
     """public class Main {
    public void display() {
        System.out.println("Hello");
    }
    public static void main(String[] args) {
        display();
    }
}""",
     ["static", "non-static", "instance", "object", "context"]),

    (30, "TypeError", "Generic type mismatch in ArrayList",
     """import java.util.ArrayList;
public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>();
        numbers.add(1);
        numbers.add(2);
        numbers.add("three");
        System.out.println(numbers);
    }
}""",
     ["type", "generic", "Integer", "String", "ArrayList"]),
]


def evaluate_hint_accuracy(hints: dict, expected_keywords: list, error_category: str) -> dict:
    """
    Evaluate hint quality based on multiple criteria:
    1. Relevance: Do hints mention expected keywords?
    2. Completeness: Are all hint fields present?
    3. Specificity: Are hints specific (not generic fallback)?
    4. No-solution policy: Hints don't contain full solutions?
    """
    if not hints:
        return {"score": 0, "relevance": 0, "completeness": 0, "specificity": 0, "no_solution": 1, "notes": "No hints returned"}

    # Combine all hint text for keyword matching
    all_hint_text = " ".join(str(v) for v in hints.values()).lower()

    # 1. Relevance (0-1): What fraction of expected keywords appear?
    matched_keywords = [kw for kw in expected_keywords if kw.lower() in all_hint_text]
    relevance = len(matched_keywords) / len(expected_keywords) if expected_keywords else 0

    # 2. Completeness (0-1): Are the expected fields present and non-empty?
    expected_fields = ["problem_summary", "why", "hint_1", "learning_tip"]
    present_fields = [f for f in expected_fields if hints.get(f, "").strip()]
    completeness = len(present_fields) / len(expected_fields)

    # 3. Specificity (0-1): Is the hint specific to the error (not generic)?
    generic_phrases = [
        "there is an issue in your code",
        "carefully read the error message",
        "an error was detected",
    ]
    is_generic = any(phrase in all_hint_text for phrase in generic_phrases)
    specificity = 0.3 if is_generic else 1.0

    # 4. No-solution policy (0-1): Hints should NOT contain full solutions
    # Check for code blocks longer than 2 lines
    solution_indicators = [
        "public class",
        "public static void main",
        "here is the corrected",
        "the fixed code",
    ]
    has_solution = any(indicator in all_hint_text for indicator in solution_indicators)
    no_solution = 0.0 if has_solution else 1.0

    # Weighted overall score
    score = (relevance * 0.4) + (completeness * 0.25) + (specificity * 0.25) + (no_solution * 0.1)

    return {
        "score": round(score, 3),
        "relevance": round(relevance, 3),
        "completeness": round(completeness, 3),
        "specificity": round(specificity, 3),
        "no_solution": round(no_solution, 3),
        "matched_keywords": matched_keywords,
        "notes": "Generic fallback" if is_generic else ("Contains solution" if has_solution else "OK"),
    }


def send_code_to_api(code: str, delay: float = 3.0) -> dict:
    """Send a single code sample to the API and return the response."""
    payload = {
        "user_id": USER_ID,
        "code": code,
        "submission_type": "submit",
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=120)
        result = response.json()
        time.sleep(delay)  # Respect server timeout between requests
        return result
    except requests.exceptions.Timeout:
        return {"success": False, "error": {"message": "Request timed out"}}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": {"message": "Cannot connect to server"}}
    except Exception as e:
        return {"success": False, "error": {"message": str(e)}}


def run_evaluation():
    """Run the full evaluation pipeline."""
    print("=" * 80)
    print("HINT ACCURACY EVALUATION")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Dataset: {len(DATASET)} Java code samples")
    print(f"API: {API_URL}")
    print("=" * 80)
    print()

    results = []
    total_score = 0
    category_scores = {}

    for idx, (sample_id, category, description, code, keywords) in enumerate(DATASET):
        print(f"[{idx+1:02d}/30] Testing: {category} - {description}")
        print(f"        Sending to API...", end=" ", flush=True)

        api_response = send_code_to_api(code)

        if not api_response.get("success"):
            error_msg = api_response.get("error", {}).get("message", "Unknown error")
            print(f"FAILED ({error_msg})")
            eval_result = {"score": 0, "relevance": 0, "completeness": 0,
                          "specificity": 0, "no_solution": 1, "notes": f"API Error: {error_msg}"}
        else:
            data = api_response.get("data", {})
            hints = data.get("hints")
            execution = data.get("execution", {})
            exec_status = execution.get("status", "Unknown")

            eval_result = evaluate_hint_accuracy(hints, keywords, category)
            print(f"OK (status={exec_status}, score={eval_result['score']:.3f})")

        results.append({
            "id": sample_id,
            "category": category,
            "description": description,
            "evaluation": eval_result,
            "hints": api_response.get("data", {}).get("hints") if api_response.get("success") else None,
            "execution_status": api_response.get("data", {}).get("execution", {}).get("status") if api_response.get("success") else None,
        })

        total_score += eval_result["score"]

        if category not in category_scores:
            category_scores[category] = []
        category_scores[category].append(eval_result["score"])

    # --- Summary Report ---
    print()
    print("=" * 80)
    print("EVALUATION SUMMARY")
    print("=" * 80)
    print()

    avg_score = total_score / len(DATASET)
    print(f"Overall Accuracy Score: {avg_score:.3f} / 1.000  ({avg_score*100:.1f}%)")
    print()

    # Per-category breakdown
    print("Per-Category Breakdown:")
    print("-" * 60)
    print(f"{'Category':<30} {'Avg Score':<12} {'Samples':<10}")
    print("-" * 60)
    for cat, scores in sorted(category_scores.items()):
        cat_avg = sum(scores) / len(scores)
        print(f"{cat:<30} {cat_avg:.3f}        {len(scores)}")
    print("-" * 60)
    print()

    # Metric breakdown
    avg_relevance = sum(r["evaluation"]["relevance"] for r in results) / len(results)
    avg_completeness = sum(r["evaluation"]["completeness"] for r in results) / len(results)
    avg_specificity = sum(r["evaluation"]["specificity"] for r in results) / len(results)
    avg_no_solution = sum(r["evaluation"]["no_solution"] for r in results) / len(results)

    print("Metric Breakdown (averaged across all samples):")
    print(f"  Relevance (keyword match):    {avg_relevance:.3f}")
    print(f"  Completeness (fields present): {avg_completeness:.3f}")
    print(f"  Specificity (not generic):     {avg_specificity:.3f}")
    print(f"  No-Solution Policy:            {avg_no_solution:.3f}")
    print()

    # Worst performers
    sorted_results = sorted(results, key=lambda r: r["evaluation"]["score"])
    print("Bottom 5 (lowest scoring samples):")
    print("-" * 60)
    for r in sorted_results[:5]:
        print(f"  #{r['id']:02d} [{r['category']}] {r['description']}")
        print(f"      Score: {r['evaluation']['score']:.3f} | Notes: {r['evaluation']['notes']}")
    print()

    # Top performers
    print("Top 5 (highest scoring samples):")
    print("-" * 60)
    for r in sorted_results[-5:]:
        print(f"  #{r['id']:02d} [{r['category']}] {r['description']}")
        print(f"      Score: {r['evaluation']['score']:.3f} | Notes: {r['evaluation']['notes']}")
    print()

    # Save detailed results to JSON
    output = {
        "evaluation_date": datetime.now().isoformat(),
        "total_samples": len(DATASET),
        "overall_score": round(avg_score, 4),
        "metrics": {
            "relevance": round(avg_relevance, 4),
            "completeness": round(avg_completeness, 4),
            "specificity": round(avg_specificity, 4),
            "no_solution_policy": round(avg_no_solution, 4),
        },
        "category_scores": {cat: round(sum(s)/len(s), 4) for cat, s in category_scores.items()},
        "results": results,
    }

    output_path = "evaluation/hint_eval_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Detailed results saved to: {output_path}")
    print("=" * 80)

    return output


if __name__ == "__main__":
    run_evaluation()
