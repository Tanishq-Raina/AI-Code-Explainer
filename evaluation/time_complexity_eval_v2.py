"""
Time Complexity Evaluation Script - Dataset V2
================================================
A completely new dataset of 30 Java algorithms with known time complexities,
different from the first evaluation set.

Tests the full pipeline: backend /api/parse-ast → frontend astAdapter → timeComplexityVisualizer
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
    (1, "Swap two variables", "O(1)",
     """public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int temp = a;
        a = b;
        b = temp;
        System.out.println(a + " " + b);
    }
}"""),

    (2, "Check if number is even", "O(1)",
     """public class Main {
    public static boolean isEven(int n) {
        return n % 2 == 0;
    }
    public static void main(String[] args) {
        System.out.println(isEven(4));
    }
}"""),

    (3, "Get middle element of array", "O(1)",
     """public class Main {
    public static int getMiddle(int[] arr) {
        int mid = arr.length / 2;
        return arr[mid];
    }
    public static void main(String[] args) {
        int[] arr = {2, 4, 6, 8, 10};
        System.out.println(getMiddle(arr));
    }
}"""),

    (4, "Calculate circle area", "O(1)",
     """public class Main {
    public static double circleArea(double radius) {
        double area = 3.14159 * radius * radius;
        return area;
    }
    public static void main(String[] args) {
        System.out.println(circleArea(5.0));
    }
}"""),

    # --- O(n) Linear Time ---
    (5, "Calculate factorial iteratively", "O(n)",
     """public class Main {
    public static long factorial(int n) {
        long result = 1;
        for (int i = 1; i <= n; i++) {
            result = result * i;
        }
        return result;
    }
    public static void main(String[] args) {
        System.out.println(factorial(10));
    }
}"""),

    (6, "Check if array is sorted", "O(n)",
     """public class Main {
    public static boolean isSorted(int[] arr) {
        for (int i = 0; i < arr.length - 1; i++) {
            if (arr[i] > arr[i + 1]) {
                return false;
            }
        }
        return true;
    }
    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 9};
        System.out.println(isSorted(arr));
    }
}"""),

    (7, "Copy array elements", "O(n)",
     """public class Main {
    public static int[] copyArray(int[] src) {
        int[] dest = new int[src.length];
        for (int i = 0; i < src.length; i++) {
            dest[i] = src[i];
        }
        return dest;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int[] copy = copyArray(arr);
        System.out.println(copy[0]);
    }
}"""),

    (8, "String character frequency count", "O(n)",
     """public class Main {
    public static int countChar(String str, char target) {
        int count = 0;
        for (int i = 0; i < str.length(); i++) {
            if (str.charAt(i) == target) {
                count++;
            }
        }
        return count;
    }
    public static void main(String[] args) {
        System.out.println(countChar("hello world", 'l'));
    }
}"""),

    (9, "Find minimum in array", "O(n)",
     """public class Main {
    public static int findMin(int[] arr) {
        int min = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] < min) {
                min = arr[i];
            }
        }
        return min;
    }
    public static void main(String[] args) {
        int[] arr = {8, 3, 9, 1, 5};
        System.out.println(findMin(arr));
    }
}"""),

    (10, "Compute prefix sum array", "O(n)",
     """public class Main {
    public static int[] prefixSum(int[] arr) {
        int[] prefix = new int[arr.length];
        prefix[0] = arr[0];
        for (int i = 1; i < arr.length; i++) {
            prefix[i] = prefix[i - 1] + arr[i];
        }
        return prefix;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int[] ps = prefixSum(arr);
        System.out.println(ps[4]);
    }
}"""),

    (11, "Two sequential loops (still O(n))", "O(n)",
     """public class Main {
    public static int process(int[] arr) {
        int sum = 0;
        for (int i = 0; i < arr.length; i++) {
            sum = sum + arr[i];
        }
        int product = 1;
        for (int i = 0; i < arr.length; i++) {
            product = product * arr[i];
        }
        return sum + product;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        System.out.println(process(arr));
    }
}"""),

    # --- O(n^2) Quadratic Time ---
    (12, "Transpose a matrix", "O(n^2)",
     """public class Main {
    public static void transpose(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }
    }
    public static void main(String[] args) {
        int[][] m = {{1,2,3},{4,5,6},{7,8,9}};
        transpose(m);
        System.out.println(m[0][1]);
    }
}"""),

    (13, "Find pair with given sum", "O(n^2)",
     """public class Main {
    public static boolean hasPairSum(int[] arr, int target) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (arr[i] + arr[j] == target) {
                    return true;
                }
            }
        }
        return false;
    }
    public static void main(String[] args) {
        int[] arr = {2, 4, 6, 8, 10};
        System.out.println(hasPairSum(arr, 12));
    }
}"""),

    (14, "Print multiplication table", "O(n^2)",
     """public class Main {
    public static void printTable(int n) {
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                System.out.print(i * j + " ");
            }
            System.out.println();
        }
    }
    public static void main(String[] args) {
        printTable(5);
    }
}"""),

    (15, "Count inversions (brute force)", "O(n^2)",
     """public class Main {
    public static int countInversions(int[] arr) {
        int count = 0;
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (arr[i] > arr[j]) {
                    count++;
                }
            }
        }
        return count;
    }
    public static void main(String[] args) {
        int[] arr = {5, 3, 2, 4, 1};
        System.out.println(countInversions(arr));
    }
}"""),

    (16, "String pattern matching (naive)", "O(n^2)",
     """public class Main {
    public static int findPattern(String text, String pattern) {
        int n = text.length();
        int m = pattern.length();
        for (int i = 0; i <= n - m; i++) {
            int j = 0;
            while (j < m && text.charAt(i + j) == pattern.charAt(j)) {
                j++;
            }
            if (j == m) {
                return i;
            }
        }
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(findPattern("hello world", "world"));
    }
}"""),

    (17, "Rotate matrix 90 degrees", "O(n^2)",
     """public class Main {
    public static void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) {
            for (int j = i; j < n; j++) {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }
    }
    public static void main(String[] args) {
        int[][] m = {{1,2},{3,4}};
        rotate(m);
        System.out.println(m[0][0]);
    }
}"""),

    # --- O(n^3) Cubic Time ---
    (18, "Floyd-Warshall pattern (triple nested)", "O(n^3)",
     """public class Main {
    public static void floydWarshall(int[][] dist) {
        int n = dist.length;
        for (int k = 0; k < n; k++) {
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
    }
    public static void main(String[] args) {
        int[][] dist = {{0,5,99},{99,0,2},{99,99,0}};
        floydWarshall(dist);
        System.out.println(dist[0][2]);
    }
}"""),

    (19, "Check if three numbers sum to target", "O(n^3)",
     """public class Main {
    public static boolean threeSum(int[] arr, int target) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                for (int k = j + 1; k < n; k++) {
                    if (arr[i] + arr[j] + arr[k] == target) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        System.out.println(threeSum(arr, 10));
    }
}"""),

    # --- O(log n) Logarithmic Time ---
    (20, "Count digits in a number", "O(log n)",
     """public class Main {
    public static int countDigits(int n) {
        int count = 0;
        while (n > 0) {
            n = n / 10;
            count++;
        }
        return count;
    }
    public static void main(String[] args) {
        System.out.println(countDigits(123456));
    }
}"""),

    (21, "Fast exponentiation (repeated squaring)", "O(log n)",
     """public class Main {
    public static long power(int base, int exp) {
        long result = 1;
        long b = base;
        while (exp > 0) {
            if (exp % 2 == 1) {
                result = result * b;
            }
            b = b * b;
            exp = exp / 2;
        }
        return result;
    }
    public static void main(String[] args) {
        System.out.println(power(2, 10));
    }
}"""),

    (22, "Find floor of square root (binary search)", "O(log n)",
     """public class Main {
    public static int sqrt(int n) {
        int low = 1;
        int high = n;
        int ans = 0;
        while (low <= high) {
            int mid = (low + high) / 2;
            if (mid <= n / mid) {
                ans = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return ans;
    }
    public static void main(String[] args) {
        System.out.println(sqrt(25));
    }
}"""),

    (23, "GCD using Euclidean algorithm (divide pattern)", "O(log n)",
     """public class Main {
    public static int gcd(int a, int b) {
        while (b > 0) {
            int temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
    public static void main(String[] args) {
        System.out.println(gcd(48, 18));
    }
}"""),

    # --- O(n log n) Linearithmic Time ---
    (24, "Outer loop linear, inner loop doubling", "O(n log n)",
     """public class Main {
    public static void compute(int n) {
        for (int i = 0; i < n; i++) {
            int j = 1;
            while (j < n) {
                j = j * 2;
            }
        }
    }
    public static void main(String[] args) {
        compute(64);
    }
}"""),

    (25, "Outer loop linear, inner loop halving", "O(n log n)",
     """public class Main {
    public static void analyze(int n) {
        for (int i = 0; i < n; i++) {
            int k = n;
            while (k > 1) {
                k = k / 2;
            }
        }
    }
    public static void main(String[] args) {
        analyze(32);
    }
}"""),

    (26, "For loop with inner for j = j * 3", "O(n log n)",
     """public class Main {
    public static void tripling(int n) {
        for (int i = 0; i < n; i++) {
            for (int j = 1; j < n; j = j * 3) {
                System.out.println(i + j);
            }
        }
    }
    public static void main(String[] args) {
        tripling(27);
    }
}"""),

    # --- Mixed / Edge Cases ---
    (27, "Nested loop with constant inner bound (O(n * 10) = O(n))", "O(n)",
     """public class Main {
    public static void fixedInner(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < 10; j++) {
                System.out.println(arr[i]);
            }
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        fixedInner(arr);
    }
}"""),

    (28, "Three sequential loops (still O(n))", "O(n)",
     """public class Main {
    public static void threePasses(int[] arr) {
        int n = arr.length;
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum = sum + arr[i];
        }
        int max = arr[0];
        for (int i = 1; i < n; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        int min = arr[0];
        for (int i = 1; i < n; i++) {
            if (arr[i] < min) {
                min = arr[i];
            }
        }
        System.out.println(sum + max + min);
    }
    public static void main(String[] args) {
        int[] arr = {3, 1, 4, 1, 5};
        threePasses(arr);
    }
}"""),

    (29, "Linear loop followed by quadratic (O(n^2) dominates)", "O(n^2)",
     """public class Main {
    public static void mixed(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            System.out.println(arr[i]);
        }
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                System.out.println(arr[i] + arr[j]);
            }
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        mixed(arr);
    }
}"""),

    (30, "Quadratic with inner log (O(n^2 log n))", "O(n^2 log n)",
     """public class Main {
    public static void complex(int n) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                int k = n;
                while (k > 1) {
                    k = k / 2;
                }
            }
        }
    }
    public static void main(String[] args) {
        complex(16);
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
    temp_file = "evaluation/_temp_ast_v2.json"
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
    s = s.replace("O(LOG(N))", "O(LOGN)")
    s = s.replace("O(N^2*LOGN)", "O(N^2LOGN)")
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
        "O(N^2*LOGN)": "O(N^2LOGN)",
        "O(N^2LOGN)": "O(N^2*LOGN)",
    }
    return equivalences.get(c) == e or equivalences.get(e) == c


def run_evaluation():
    """Run the full time complexity evaluation pipeline."""
    print("=" * 80)
    print("TIME COMPLEXITY EVALUATION - DATASET V2")
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
    for cat in ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(n^3)", "O(n^2 log n)"]:
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
    else:
        print("All results correct!")
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

    output_path = "evaluation/time_complexity_results_v2.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Detailed results saved to: {output_path}")
    print("=" * 80)

    return output


if __name__ == "__main__":
    run_evaluation()
