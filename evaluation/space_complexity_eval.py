"""
Space Complexity Evaluation Script
====================================
Tests the space complexity analysis pipeline by:
1. Sending Java algorithms to /api/parse-ast
2. Feeding the AST to the frontend space complexity analyzer (via Node.js)
3. Comparing the computed space Big-O against the known correct answer

Dataset: 30 Java algorithms with known space complexities, including
several long/complex programs to test stability on larger inputs.
"""

import json
import time
import subprocess
import requests
from datetime import datetime

API_URL = "http://localhost:5000/api/parse-ast"

# (id, name, expected_space_complexity, java_code)
DATASET = [
    # --- O(1) Constant Space ---
    (1, "Swap two variables", "O(1)",
     """public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int temp = a;
        a = b;
        b = temp;
        System.out.println(a);
    }
}"""),

    (2, "Iterative sum (no array)", "O(1)",
     """public class Main {
    public static int sumTo(int n) {
        int total = 0;
        for (int i = 1; i <= n; i++) {
            total = total + i;
        }
        return total;
    }
    public static void main(String[] args) {
        System.out.println(sumTo(100));
    }
}"""),

    (3, "Find max in array (in place)", "O(1)",
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
        int[] arr = {3, 7, 1, 9};
        System.out.println(findMax(arr));
    }
}"""),

    (4, "Iterative factorial (no extra storage)", "O(1)",
     """public class Main {
    public static long factorial(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) {
            result = result * i;
        }
        return result;
    }
    public static void main(String[] args) {
        System.out.println(factorial(10));
    }
}"""),

    (5, "Reverse array in place", "O(1)",
     """public class Main {
    public static void reverse(int[] arr) {
        int left = 0;
        int right = arr.length - 1;
        while (left < right) {
            int temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        reverse(arr);
        System.out.println(arr[0]);
    }
}"""),

    (6, "Iterative fibonacci O(1) space", "O(1)",
     """public class Main {
    public static long fib(int n) {
        long a = 0;
        long b = 1;
        for (int i = 0; i < n; i++) {
            long c = a + b;
            a = b;
            b = c;
        }
        return a;
    }
    public static void main(String[] args) {
        System.out.println(fib(20));
    }
}"""),

    # --- O(n) Linear Space ---
    (7, "Create copy of array", "O(n)",
     """public class Main {
    public static int[] copy(int[] src) {
        int[] dest = new int[src.length];
        for (int i = 0; i < src.length; i++) {
            dest[i] = src[i];
        }
        return dest;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        int[] c = copy(arr);
        System.out.println(c[0]);
    }
}"""),

    (8, "Build prefix sum array", "O(n)",
     """public class Main {
    public static int[] prefixSum(int[] arr) {
        int n = arr.length;
        int[] prefix = new int[n];
        prefix[0] = arr[0];
        for (int i = 1; i < n; i++) {
            prefix[i] = prefix[i - 1] + arr[i];
        }
        return prefix;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4};
        int[] p = prefixSum(arr);
        System.out.println(p[3]);
    }
}"""),

    (9, "Memoized fibonacci with array", "O(n)",
     """public class Main {
    public static long fib(int n) {
        long[] memo = new long[n + 1];
        memo[0] = 0;
        if (n > 0) {
            memo[1] = 1;
        }
        for (int i = 2; i <= n; i++) {
            memo[i] = memo[i - 1] + memo[i - 2];
        }
        return memo[n];
    }
    public static void main(String[] args) {
        System.out.println(fib(20));
    }
}"""),

    (10, "Recursive sum (recursion stack O(n))", "O(n)",
     """public class Main {
    public static int sum(int n) {
        if (n <= 0) {
            return 0;
        }
        return n + sum(n - 1);
    }
    public static void main(String[] args) {
        System.out.println(sum(100));
    }
}"""),

    (11, "Recursive factorial", "O(n)",
     """public class Main {
    public static long factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }
    public static void main(String[] args) {
        System.out.println(factorial(10));
    }
}"""),

    (12, "Build doubled array", "O(n)",
     """public class Main {
    public static int[] doubleArray(int[] arr) {
        int[] result = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            result[i] = arr[i] * 2;
        }
        return result;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        int[] d = doubleArray(arr);
        System.out.println(d[2]);
    }
}"""),

    # --- O(n^2) Quadratic Space ---
    (13, "Create n by n matrix", "O(n^2)",
     """public class Main {
    public static int[][] makeMatrix(int n) {
        int[][] mat = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                mat[i][j] = i + j;
            }
        }
        return mat;
    }
    public static void main(String[] args) {
        int[][] m = makeMatrix(5);
        System.out.println(m[0][0]);
    }
}"""),

    (14, "Build adjacency matrix", "O(n^2)",
     """public class Main {
    public static int[][] buildGraph(int n) {
        int[][] graph = new int[n][n];
        for (int i = 0; i < n; i++) {
            graph[i][i] = 0;
        }
        return graph;
    }
    public static void main(String[] args) {
        int[][] g = buildGraph(10);
        System.out.println(g[0][0]);
    }
}"""),

    (15, "Multiply matrices result", "O(n^2)",
     """public class Main {
    public static int[][] multiply(int[][] a, int[][] b, int n) {
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
        int[][] r = multiply(a, b, 2);
        System.out.println(r[0][0]);
    }
}"""),

    # --- O(log n) Logarithmic Space (recursive halving) ---
    (16, "Binary search recursive", "O(log n)",
     """public class Main {
    public static int binarySearch(int[] arr, int low, int high, int target) {
        if (low > high) {
            return -1;
        }
        int mid = (low + high) / 2;
        if (arr[mid] == target) {
            return mid;
        }
        if (arr[mid] < target) {
            return binarySearch(arr, mid + 1, high, target);
        }
        return binarySearch(arr, low, mid - 1, target);
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        System.out.println(binarySearch(arr, 0, 4, 3));
    }
}"""),

    # --- Long / Complex programs (testing stability on large inputs) ---
    (17, "Long: Selection sort (O(1) auxiliary space)", "O(1)",
     """public class Main {
    public static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }
    }
    public static void main(String[] args) {
        int[] arr = {5, 3, 8, 1, 9, 2, 7, 4, 6};
        selectionSort(arr);
        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }
}"""),

    (18, "Long: Counting sort with count array (O(n))", "O(n)",
     """public class Main {
    public static int[] countingSort(int[] arr, int range) {
        int[] count = new int[range + 1];
        int[] output = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            count[arr[i]]++;
        }
        for (int i = 1; i <= range; i++) {
            count[i] = count[i] + count[i - 1];
        }
        for (int i = arr.length - 1; i >= 0; i--) {
            output[count[arr[i]] - 1] = arr[i];
            count[arr[i]]--;
        }
        return output;
    }
    public static void main(String[] args) {
        int[] arr = {4, 2, 2, 8, 3, 3, 1};
        int[] sorted = countingSort(arr, 8);
        for (int i = 0; i < sorted.length; i++) {
            System.out.print(sorted[i] + " ");
        }
        System.out.println();
    }
}"""),

    (19, "Long: Pascal's triangle (2D array O(n^2))", "O(n^2)",
     """public class Main {
    public static int[][] pascals(int n) {
        int[][] triangle = new int[n][n];
        for (int i = 0; i < n; i++) {
            triangle[i][0] = 1;
            triangle[i][i] = 1;
            for (int j = 1; j < i; j++) {
                triangle[i][j] = triangle[i - 1][j - 1] + triangle[i - 1][j];
            }
        }
        return triangle;
    }
    public static void main(String[] args) {
        int[][] t = pascals(6);
        for (int i = 0; i < 6; i++) {
            for (int j = 0; j <= i; j++) {
                System.out.print(t[i][j] + " ");
            }
            System.out.println();
        }
    }
}"""),

    (20, "Long: Recursive merge sort (O(n) auxiliary)", "O(n)",
     """public class Main {
    public static void merge(int[] arr, int left, int mid, int right) {
        int n1 = mid - left + 1;
        int n2 = right - mid;
        int[] L = new int[n1];
        int[] R = new int[n2];
        for (int i = 0; i < n1; i++) {
            L[i] = arr[left + i];
        }
        for (int i = 0; i < n2; i++) {
            R[i] = arr[mid + 1 + i];
        }
        int i = 0;
        int j = 0;
        int k = left;
        while (i < n1 && j < n2) {
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            k++;
        }
        while (i < n1) {
            arr[k] = L[i];
            i++;
            k++;
        }
        while (j < n2) {
            arr[k] = R[j];
            j++;
            k++;
        }
    }
    public static void mergeSort(int[] arr, int left, int right) {
        if (left < right) {
            int mid = (left + right) / 2;
            mergeSort(arr, left, mid);
            mergeSort(arr, mid + 1, right);
            merge(arr, left, mid, right);
        }
    }
    public static void main(String[] args) {
        int[] arr = {12, 11, 13, 5, 6, 7};
        mergeSort(arr, 0, arr.length - 1);
        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }
}"""),

    (21, "Long: Linear search (in place O(1))", "O(1)",
     """public class Main {
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }
    public static int countOccurrences(int[] arr, int target) {
        int count = 0;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                count++;
            }
        }
        return count;
    }
    public static boolean contains(int[] arr, int target) {
        return linearSearch(arr, target) != -1;
    }
    public static void main(String[] args) {
        int[] arr = {1, 5, 3, 5, 7, 9, 5, 2};
        System.out.println(linearSearch(arr, 5));
        System.out.println(countOccurrences(arr, 5));
        System.out.println(contains(arr, 99));
    }
}"""),

    (22, "Long: Build histogram (O(k) bucket array)", "O(n)",
     """public class Main {
    public static int[] histogram(int[] arr, int buckets) {
        int[] hist = new int[buckets];
        int max = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        int bucketSize = max / buckets + 1;
        for (int i = 0; i < arr.length; i++) {
            int b = arr[i] / bucketSize;
            hist[b]++;
        }
        return hist;
    }
    public static void main(String[] args) {
        int[] arr = {1, 5, 3, 8, 2, 9, 4, 7, 6};
        int[] h = histogram(arr, 4);
        for (int i = 0; i < h.length; i++) {
            System.out.println(h[i]);
        }
    }
}"""),

    (23, "Long: Recursive tree traversal (O(n) stack)", "O(n)",
     """public class Main {
    public static int treeSum(int[] tree, int index, int n) {
        if (index >= n) {
            return 0;
        }
        int left = treeSum(tree, 2 * index + 1, n);
        int right = treeSum(tree, 2 * index + 2, n);
        return tree[index] + left + right;
    }
    public static int treeDepth(int[] tree, int index, int n) {
        if (index >= n) {
            return 0;
        }
        int leftDepth = treeDepth(tree, 2 * index + 1, n);
        int rightDepth = treeDepth(tree, 2 * index + 2, n);
        if (leftDepth > rightDepth) {
            return 1 + leftDepth;
        }
        return 1 + rightDepth;
    }
    public static void main(String[] args) {
        int[] tree = {1, 2, 3, 4, 5, 6, 7};
        System.out.println(treeSum(tree, 0, 7));
        System.out.println(treeDepth(tree, 0, 7));
    }
}"""),

    (24, "Long: Build identity matrix (O(n^2))", "O(n^2)",
     """public class Main {
    public static int[][] identity(int n) {
        int[][] mat = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    mat[i][j] = 1;
                } else {
                    mat[i][j] = 0;
                }
            }
        }
        return mat;
    }
    public static int trace(int[][] mat, int n) {
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum = sum + mat[i][i];
        }
        return sum;
    }
    public static void main(String[] args) {
        int[][] m = identity(5);
        System.out.println(trace(m, 5));
        for (int i = 0; i < 5; i++) {
            for (int j = 0; j < 5; j++) {
                System.out.print(m[i][j] + " ");
            }
            System.out.println();
        }
    }
}"""),

    (25, "Long: Two sum with iteration (O(1) extra)", "O(1)",
     """public class Main {
    public static int[] twoSum(int[] arr, int target) {
        int[] result = new int[2];
        result[0] = -1;
        result[1] = -1;
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] + arr[j] == target) {
                    result[0] = i;
                    result[1] = j;
                    return result;
                }
            }
        }
        return result;
    }
    public static void main(String[] args) {
        int[] arr = {2, 7, 11, 15};
        int[] r = twoSum(arr, 9);
        System.out.println(r[0]);
        System.out.println(r[1]);
    }
}"""),

    (26, "Long: Dynamic programming with table (O(n^2))", "O(n^2)",
     """public class Main {
    public static int longestCommon(String a, String b) {
        int m = a.length();
        int n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                if (i == 0 || j == 0) {
                    dp[i][j] = 0;
                } else if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    int top = dp[i - 1][j];
                    int left = dp[i][j - 1];
                    if (top > left) {
                        dp[i][j] = top;
                    } else {
                        dp[i][j] = left;
                    }
                }
            }
        }
        return dp[m][n];
    }
    public static void main(String[] args) {
        System.out.println(longestCommon("abcde", "ace"));
    }
}"""),

    (27, "Long: Quick sort with O(log n) recursion stack (best case)", "O(log n)",
     """public class Main {
    public static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }
    public static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }
    public static void main(String[] args) {
        int[] arr = {10, 7, 8, 9, 1, 5};
        quickSort(arr, 0, arr.length - 1);
        for (int i = 0; i < arr.length; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }
}"""),

    (28, "Long: Multiple variable declarations only (O(1))", "O(1)",
     """public class Main {
    public static void main(String[] args) {
        int a = 1;
        int b = 2;
        int c = 3;
        int d = 4;
        int e = 5;
        int f = 6;
        int g = 7;
        int h = 8;
        int sum = a + b + c + d + e + f + g + h;
        int product = a * b * c * d;
        int max = h;
        int min = a;
        System.out.println(sum);
        System.out.println(product);
        System.out.println(max);
        System.out.println(min);
    }
}"""),

    (29, "Long: Build new array of squares (O(n))", "O(n)",
     """public class Main {
    public static int[] squares(int[] arr) {
        int[] result = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            result[i] = arr[i] * arr[i];
        }
        return result;
    }
    public static int sumOfSquares(int[] arr) {
        int total = 0;
        for (int i = 0; i < arr.length; i++) {
            total = total + arr[i] * arr[i];
        }
        return total;
    }
    public static int[] cubes(int[] arr) {
        int[] result = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            result[i] = arr[i] * arr[i] * arr[i];
        }
        return result;
    }
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int[] sq = squares(arr);
        int[] cb = cubes(arr);
        int sumSq = sumOfSquares(arr);
        System.out.println(sq[2]);
        System.out.println(cb[2]);
        System.out.println(sumSq);
    }
}"""),

    (30, "Long: 3D array allocation (O(n^3))", "O(n^3)",
     """public class Main {
    public static int[][][] make3D(int n) {
        int[][][] cube = new int[n][n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                for (int k = 0; k < n; k++) {
                    cube[i][j][k] = i + j + k;
                }
            }
        }
        return cube;
    }
    public static void main(String[] args) {
        int[][][] c = make3D(3);
        System.out.println(c[0][0][0]);
        System.out.println(c[2][2][2]);
    }
}"""),
]


def parse_ast_via_api(code: str, language: str = "java") -> dict:
    payload = {"language": language, "code": code}
    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        result = response.json()
        if result.get("success"):
            return result["data"]
        return None
    except Exception as e:
        print(f"        API Error: {e}")
        return None


def compute_space_complexity_via_node(ast_data: dict) -> str:
    """Run the Node.js space complexity analyzer on the parsed AST."""
    temp_file = "evaluation/_temp_space_ast.json"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(ast_data, f)

    try:
        result = subprocess.run(
            ["node", "evaluation/compute_space_complexity.mjs", temp_file],
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
    if not s:
        return ""
    s = s.strip().upper().replace(" ", "")
    s = s.replace("O(LOG(N))", "O(LOGN)")
    return s


def complexities_match(computed: str, expected: str) -> bool:
    c = normalize_complexity(computed)
    e = normalize_complexity(expected)
    if c == e:
        return True
    equivalences = {
        "O(N^1)": "O(N)",
        "O(N^2)": "O(N^2)",
        "O(N^3)": "O(N^3)",
    }
    return equivalences.get(c) == e or equivalences.get(e) == c


def run_evaluation():
    print("=" * 80)
    print("SPACE COMPLEXITY EVALUATION")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Dataset: {len(DATASET)} Java algorithms")
    print(f"API: {API_URL}")
    print("=" * 80)
    print()

    results = []
    correct = 0
    category_results = {}

    for idx, (sample_id, name, expected, code) in enumerate(DATASET):
        loc = code.count("\n") + 1
        print(f"[{idx+1:02d}/30] #{sample_id:02d} {name} ({loc} lines)")
        print(f"        Expected: {expected}")

        ast_data = parse_ast_via_api(code)
        if not ast_data:
            print(f"        FAILED: Could not parse AST")
            computed = None
        else:
            computed = compute_space_complexity_via_node(ast_data)

        if computed:
            match = complexities_match(computed, expected)
            status = "CORRECT" if match else "WRONG"
            if match:
                correct += 1
            print(f"        Computed: {computed} | {status}")
        else:
            match = False
            print(f"        Computed: FAILED | WRONG")

        cat = expected
        if cat not in category_results:
            category_results[cat] = {"correct": 0, "total": 0}
        category_results[cat]["total"] += 1
        if match:
            category_results[cat]["correct"] += 1

        results.append({
            "id": sample_id,
            "algorithm": name,
            "lines_of_code": loc,
            "expected": expected,
            "computed": computed,
            "correct": match,
        })

        time.sleep(0.3)

    print()
    print("=" * 80)
    print("EVALUATION SUMMARY")
    print("=" * 80)
    print()

    accuracy = correct / len(DATASET)
    print(f"Overall Accuracy: {correct}/{len(DATASET)} = {accuracy*100:.1f}%")
    print()

    print("Per-Complexity Breakdown:")
    print("-" * 60)
    print(f"{'Expected Complexity':<20} {'Correct':<12} {'Accuracy':<10}")
    print("-" * 60)
    for cat in ["O(1)", "O(log n)", "O(n)", "O(n^2)", "O(n^3)"]:
        if cat in category_results:
            data = category_results[cat]
            cat_acc = data["correct"] / data["total"] * 100
            print(f"{cat:<20} {data['correct']}/{data['total']}          {cat_acc:.1f}%")
    print("-" * 60)
    print()

    # Long programs separately (samples 17-30)
    long_results = [r for r in results if r["id"] >= 17]
    long_correct = sum(1 for r in long_results if r["correct"])
    print(f"Long Programs Accuracy: {long_correct}/{len(long_results)} = {long_correct/len(long_results)*100:.1f}%")
    print()

    wrong = [r for r in results if not r["correct"]]
    if wrong:
        print(f"Incorrect Results ({len(wrong)}):")
        print("-" * 60)
        for r in wrong:
            print(f"  #{r['id']:02d} ({r['lines_of_code']} lines) {r['algorithm']}")
            print(f"      Expected: {r['expected']} | Got: {r['computed']}")
        print()
    else:
        print("All correct!")

    output = {
        "evaluation_date": datetime.now().isoformat(),
        "total_samples": len(DATASET),
        "overall_accuracy": round(accuracy, 4),
        "long_programs_accuracy": round(long_correct / len(long_results), 4),
        "category_results": {cat: round(d["correct"]/d["total"], 4) for cat, d in category_results.items()},
        "results": results,
    }

    output_path = "evaluation/space_complexity_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"Detailed results saved to: {output_path}")
    print("=" * 80)

    return output


if __name__ == "__main__":
    run_evaluation()
