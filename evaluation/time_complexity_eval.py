"""
Time Complexity Evaluation Script
==================================
Tests the time complexity analysis pipeline by:
1. Sending known algorithms to the backend /api/parse-ast endpoint
2. Feeding the AST to the frontend complexity analyzer (via Node.js)
3. Comparing the computed Big-O against the known correct answer

Dataset: 30 Java algorithms with known time complexities.
"""

import json
import time
import subprocess
import requests
from datetime import datetime

API_URL = "http://localhost:5000/api/parse-ast"

# (id, algorithm_name, expected_complexity, java_code)
DATASET = [
    # --- O(1) Constant Time ---
    (1, "Simple assignment and return", "O(1)",
     """public class Main {
    public static int getFirst(int[] arr) {
        int x = arr[0];
        return x;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        System.out.println(getFirst(arr));
    }
}"""),

    (2, "Arithmetic operations", "O(1)",
     """public class Main {
    public static int compute(int a, int b) {
        int sum = a + b;
        int product = a * b;
        int result = sum + product;
        return result;
    }
    public static void main(String[] args) {
        System.out.println(compute(3, 4));
    }
}"""),

    (3, "Array access by index", "O(1)",
     """public class Main {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};
        int first = arr[0];
        int last = arr[4];
        System.out.println(first + last);
    }
}"""),

    # --- O(n) Linear Time ---
    (4, "Linear search", "O(n)",
     """public class Main {
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        System.out.println(linearSearch(arr, 3));
    }
}"""),

    (5, "Sum of array elements", "O(n)",
     """public class Main {
    public static int sum(int[] arr) {
        int total = 0;
        for (int i = 0; i < arr.length; i++) {
            total = total + arr[i];
        }
        return total;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        System.out.println(sum(arr));
    }
}"""),

    (6, "Find maximum element", "O(n)",
     """public class Main {
    public static int findMax(int[] arr) {
        int max = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        return max;
    }
    public static void main(String[] args) {
        int[] arr = {3, 7, 1, 9, 4};
        System.out.println(findMax(arr));
    }
}"""),

    (7, "Reverse array", "O(n)",
     """public class Main {
    public static void reverse(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n / 2; i++) {
            int temp = arr[i];
            arr[i] = arr[n - 1 - i];
            arr[n - 1 - i] = temp;
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        reverse(arr);
        System.out.println(arr[0]);
    }
}"""),

    (8, "Count occurrences", "O(n)",
     """public class Main {
    public static int count(int[] arr, int target) {
        int count = 0;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                count++;
            }
        }
        return count;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 2, 3, 2};
        System.out.println(count(arr, 2));
    }
}"""),

    (9, "While loop linear traversal", "O(n)",
     """public class Main {
    public static void printAll(int[] arr) {
        int i = 0;
        while (i < arr.length) {
            System.out.println(arr[i]);
            i++;
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        printAll(arr);
    }
}"""),

    # --- O(n^2) Quadratic Time ---
    (10, "Bubble sort", "O(n^2)",
     """public class Main {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }
    public static void main(String[] args) {
        int[] arr = {5, 3, 1, 4, 2};
        bubbleSort(arr);
        System.out.println(arr[0]);
    }
}"""),

    (11, "Selection sort", "O(n^2)",
     """public class Main {
    public static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
    public static void main(String[] args) {
        int[] arr = {5, 3, 1, 4, 2};
        selectionSort(arr);
        System.out.println(arr[0]);
    }
}"""),

    (12, "Insertion sort", "O(n^2)",
     """public class Main {
    public static void insertionSort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }
    public static void main(String[] args) {
        int[] arr = {5, 3, 1, 4, 2};
        insertionSort(arr);
        System.out.println(arr[0]);
    }
}"""),

    (13, "Print all pairs", "O(n^2)",
     """public class Main {
    public static void printPairs(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                System.out.println(arr[i] + " " + arr[j]);
            }
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        printPairs(arr);
    }
}"""),

    (14, "Matrix row-column traversal", "O(n^2)",
     """public class Main {
    public static int matrixSum(int[][] matrix) {
        int sum = 0;
        for (int i = 0; i < matrix.length; i++) {
            for (int j = 0; j < matrix[i].length; j++) {
                sum = sum + matrix[i][j];
            }
        }
        return sum;
    }
    public static void main(String[] args) {
        int[][] m = {{1,2},{3,4}};
        System.out.println(matrixSum(m));
    }
}"""),

    (15, "Check duplicates with nested loop", "O(n^2)",
     """public class Main {
    public static boolean hasDuplicates(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (arr[i] == arr[j]) {
                    return true;
                }
            }
        }
        return false;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 2};
        System.out.println(hasDuplicates(arr));
    }
}"""),

    # --- O(n^3) Cubic Time ---
    (16, "Triple nested loop (matrix multiply pattern)", "O(n^3)",
     """public class Main {
    public static void tripleLoop(int n) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                for (int k = 0; k < n; k++) {
                    System.out.println(i + j + k);
                }
            }
        }
    }
    public static void main(String[] args) {
        tripleLoop(3);
    }
}"""),

    (17, "Matrix multiplication", "O(n^3)",
     """public class Main {
    public static int[][] multiply(int[][] a, int[][] b) {
        int n = a.length;
        int[][] result = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                for (int k = 0; k < n; k++) {
                    result[i][j] = result[i][j] + a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }
    public static void main(String[] args) {
        int[][] a = {{1,2},{3,4}};
        int[][] b = {{5,6},{7,8}};
        int[][] r = multiply(a, b);
        System.out.println(r[0][0]);
    }
}"""),

    # --- O(log n) Logarithmic Time ---
    (18, "Binary search", "O(log n)",
     """public class Main {
    public static int binarySearch(int[] arr, int target) {
        int low = 0;
        int high = arr.length - 1;
        while (low <= high) {
            int mid = (low + high) / 2;
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5, 6, 7, 8};
        System.out.println(binarySearch(arr, 5));
    }
}"""),

    (19, "Power of 2 check (divide by 2)", "O(log n)",
     """public class Main {
    public static int countDivisions(int n) {
        int count = 0;
        while (n > 1) {
            n = n / 2;
            count++;
        }
        return count;
    }
    public static void main(String[] args) {
        System.out.println(countDivisions(64));
    }
}"""),

    (20, "Multiply by 2 until threshold", "O(log n)",
     """public class Main {
    public static int countMultiplications(int n) {
        int i = 1;
        int count = 0;
        while (i < n) {
            i = i * 2;
            count++;
        }
        return count;
    }
    public static void main(String[] args) {
        System.out.println(countMultiplications(100));
    }
}"""),

    # --- O(n log n) Linearithmic Time ---
    (21, "Loop with inner halving", "O(n log n)",
     """public class Main {
    public static void nLogN(int n) {
        for (int i = 0; i < n; i++) {
            int j = n;
            while (j > 1) {
                j = j / 2;
            }
        }
    }
    public static void main(String[] args) {
        nLogN(16);
    }
}"""),

    (22, "Outer linear inner logarithmic (multiply)", "O(n log n)",
     """public class Main {
    public static void process(int n) {
        for (int i = 0; i < n; i++) {
            int j = 1;
            while (j < n) {
                j = j * 2;
            }
        }
    }
    public static void main(String[] args) {
        process(32);
    }
}"""),

    (23, "Simulated merge sort pattern", "O(n log n)",
     """public class Main {
    public static void mergePattern(int n) {
        for (int i = 0; i < n; i++) {
            int k = n;
            while (k > 0) {
                k = k / 2;
            }
        }
    }
    public static void main(String[] args) {
        mergePattern(8);
    }
}"""),

    # --- Mixed / Edge Cases ---
    (24, "Sequential loops (O(n) + O(n) = O(n))", "O(n)",
     """public class Main {
    public static void twoLoops(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            System.out.println(arr[i]);
        }
        for (int j = 0; j < n; j++) {
            System.out.println(arr[j] * 2);
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        twoLoops(arr);
    }
}"""),

    (25, "Loop followed by nested loop (O(n) + O(n^2) = O(n^2))", "O(n^2)",
     """public class Main {
    public static void mixed(int n) {
        for (int i = 0; i < n; i++) {
            System.out.println(i);
        }
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                System.out.println(i + j);
            }
        }
    }
    public static void main(String[] args) {
        mixed(5);
    }
}"""),

    (26, "Single for loop with if inside", "O(n)",
     """public class Main {
    public static int countEven(int[] arr) {
        int count = 0;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] % 2 == 0) {
                count++;
            }
        }
        return count;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5, 6};
        System.out.println(countEven(arr));
    }
}"""),

    (27, "Nested loop with inner loop constant (O(n * 5) = O(n))", "O(n)",
     """public class Main {
    public static void process(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < 5; j++) {
                System.out.println(arr[i] + j);
            }
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        process(arr);
    }
}"""),

    (28, "For loop with logarithmic for loop inside", "O(n log n)",
     """public class Main {
    public static void algo(int n) {
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < n; j = j * 2) {
                System.out.println(i + j);
            }
        }
    }
    public static void main(String[] args) {
        algo(16);
    }
}"""),

    (29, "Empty main (no loops)", "O(1)",
     """public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}"""),

    (30, "Nested for with inner doubling (O(n * log n))", "O(n log n)",
     """public class Main {
    public static void search(int n) {
        for (int i = 0; i < n; i++) {
            int j = 1;
            while (j < n) {
                j = j * 2;
            }
        }
    }
    public static void main(String[] args) {
        search(100);
    }
}"""),
]


def parse_ast_via_api(code: str, language: str = "java") -> dict:
    """Send code to /api/parse-ast and return the parsed AST."""
    payload = {"language": language, "code": code}
    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        result = response.json()
        if result.get("success"):
            return result["data"]
        else:
            return None
    except Exception as e:
        print(f"        API Error: {e}")
        return None


def compute_complexity_via_node(ast_data: dict) -> str:
    """Run the Node.js complexity analyzer on the parsed AST."""
    # Write AST to temp file
    temp_file = "evaluation/_temp_ast.json"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(ast_data, f)

    try:
        result = subprocess.run(
            ["node", "evaluation/compute_complexity.mjs", temp_file],
            capture_output=True, text=True, timeout=15,
            cwd="."
        )
        if result.returncode != 0:
            print(f"        Node.js Error: {result.stderr.strip()[:200]}")
            return None
        output = json.loads(result.stdout.strip())
        return output.get("finalComplexity")
    except subprocess.TimeoutExpired:
        print("        Node.js timed out")
        return None
    except Exception as e:
        print(f"        Node.js Error: {e}")
        return None


def normalize_complexity(s: str) -> str:
    """Normalize a Big-O string for comparison."""
    if not s:
        return ""
    s = s.strip().upper().replace(" ", "")
    # Normalize common variants
    s = s.replace("O(N)", "O(N)")
    s = s.replace("O(LOGN)", "O(LOGN)")
    s = s.replace("O(N*LOGN)", "O(NLOGN)")
    s = s.replace("O(N*LOG(N))", "O(NLOGN)")
    s = s.replace("O(NLOG(N))", "O(NLOGN)")
    s = s.replace("O(N*LOGN)", "O(NLOGN)")
    s = s.replace("O(LOG(N))", "O(LOGN)")
    return s


def complexities_match(computed: str, expected: str) -> bool:
    """Check if computed complexity matches expected (with normalization)."""
    c = normalize_complexity(computed)
    e = normalize_complexity(expected)
    if c == e:
        return True
    # Handle equivalent representations
    equivalences = {
        "O(N^1)": "O(N)",
        "O(N^2)": "O(N^2)",
        "O(N^3)": "O(N^3)",
        "O(1)": "O(1)",
        "O(N*LOGN)": "O(NLOGN)",
        "O(NLOGN)": "O(N*LOGN)",
    }
    return equivalences.get(c) == e or equivalences.get(e) == c


def run_evaluation():
    """Run the full time complexity evaluation pipeline."""
    print("=" * 80)
    print("TIME COMPLEXITY EVALUATION")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Dataset: {len(DATASET)} Java algorithms with known complexities")
    print(f"API: {API_URL}")
    print("=" * 80)
    print()

    results = []
    correct = 0
    category_results = {}

    for idx, (sample_id, name, expected, code) in enumerate(DATASET):
        print(f"[{idx+1:02d}/30] #{sample_id:02d} {name}")
        print(f"        Expected: {expected}")

        # Step 1: Parse AST
        ast_data = parse_ast_via_api(code)
        if not ast_data:
            print(f"        FAILED: Could not parse AST")
            computed = None
        else:
            # Step 2: Compute complexity via Node.js
            computed = compute_complexity_via_node(ast_data)

        if computed:
            match = complexities_match(computed, expected)
            status = "CORRECT" if match else "WRONG"
            if match:
                correct += 1
            print(f"        Computed: {computed} | {status}")
        else:
            match = False
            print(f"        Computed: FAILED | WRONG")

        # Categorize by expected complexity
        cat = expected
        if cat not in category_results:
            category_results[cat] = {"correct": 0, "total": 0}
        category_results[cat]["total"] += 1
        if match:
            category_results[cat]["correct"] += 1

        results.append({
            "id": sample_id,
            "algorithm": name,
            "expected": expected,
            "computed": computed,
            "correct": match,
        })

        time.sleep(0.5)  # Small delay between API calls

    # --- Summary ---
    print()
    print("=" * 80)
    print("EVALUATION SUMMARY")
    print("=" * 80)
    print()

    accuracy = correct / len(DATASET)
    print(f"Overall Accuracy: {correct}/{len(DATASET)} = {accuracy*100:.1f}%")
    print()

    # Per-complexity breakdown
    print("Per-Complexity Breakdown:")
    print("-" * 60)
    print(f"{'Expected Complexity':<20} {'Correct':<12} {'Accuracy':<10}")
    print("-" * 60)
    for cat in ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(n^3)"]:
        if cat in category_results:
            data = category_results[cat]
            cat_acc = data["correct"] / data["total"] * 100
            print(f"{cat:<20} {data['correct']}/{data['total']}          {cat_acc:.1f}%")
    print("-" * 60)
    print()

    # Wrong answers
    wrong = [r for r in results if not r["correct"]]
    if wrong:
        print(f"Incorrect Results ({len(wrong)}):")
        print("-" * 60)
        for r in wrong:
            print(f"  #{r['id']:02d} {r['algorithm']}")
            print(f"      Expected: {r['expected']} | Got: {r['computed']}")
        print()

    # Save results
    output = {
        "evaluation_date": datetime.now().isoformat(),
        "total_samples": len(DATASET),
        "overall_accuracy": round(accuracy, 4),
        "correct_count": correct,
        "category_results": {cat: round(d["correct"]/d["total"], 4) for cat, d in category_results.items()},
        "results": results,
    }

    output_path = "evaluation/time_complexity_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Detailed results saved to: {output_path}")
    print("=" * 80)

    return output


if __name__ == "__main__":
    run_evaluation()
