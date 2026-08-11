// Problem catalog for the Codexa AI practice dashboard.
// 4 topics (Java Basics, Conditions, Loops, Arrays) × 6 problems each
// (2 Easy, 2 Medium, 2 Hard) = 24 problems total.
//
// Each problem embeds its own `starterCode` so the Practice page can load
// a topic-appropriate scaffold instead of a single global template.

export const problems = [
  // ─────────────────────────────────────────────────────────────────────
  // JAVA BASICS
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: "Hello, Codexa!",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Output"],
    description:
      "Write a Java program that prints the exact line `Hello, Codexa!` (without quotes) to the console.",
    note1:
      "The output must match exactly, including capitalization, the comma, and the exclamation mark.",
    note2:
      "Use System.out.println to print to standard output.",
    examples: [
      {
        label: "Example 1",
        input: "(no input)",
        output: "Hello, Codexa!",
        explanation:
          "The program prints the greeting on its own line.",
      },
    ],
    constraints: [
      "The output must be exactly `Hello, Codexa!` followed by a newline.",
      "Do not print any additional text.",
    ],
    followUp:
      "Can you print the greeting three times using three separate println calls?",
    beginnerTips: [
      "Every Java program starts from the `main` method.",
      "`System.out.println` prints the given text and moves to the next line.",
      "Strings are wrapped in double quotes.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        // Print the greeting below
    }
}`,
  },
  {
    id: 2,
    title: "Swap Two Variables",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Variables"],
    description:
      "Two integer variables `a` and `b` are declared with initial values 5 and 10. Swap their values and print them on a single line separated by a space.",
    note1:
      "You may use a temporary variable or any Java syntax you know.",
    note2:
      "The final output must show the swapped values in the order: value of a, then value of b.",
    examples: [
      {
        label: "Example 1",
        input: "a = 5, b = 10",
        output: "10 5",
        explanation:
          "After swapping, `a` holds 10 and `b` holds 5.",
      },
    ],
    constraints: [
      "Do not hardcode the final values — perform an actual swap.",
      "Print both values on the same line separated by a single space.",
    ],
    followUp:
      "Can you swap the two values without using a third temporary variable?",
    beginnerTips: [
      "A temporary variable is the simplest way to swap.",
      "`System.out.println(a + \" \" + b)` prints both values together.",
      "Integer operations like +, -, and XOR can also swap without a temp.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        // Swap the values of a and b here
        System.out.println(a + " " + b);
    }
}`,
  },
  {
    id: 3,
    title: "Area of a Circle",
    topic: "Java Basics",
    difficulty: "Medium",
    topics: ["Java Basics", "Math"],
    description:
      "Given a radius of 7.0 (already declared), compute and print the area of a circle. Use `Math.PI` for the value of π and print the result rounded to two decimal places.",
    note1:
      "Area = π × r × r.",
    note2:
      "Use `String.format(\"%.2f\", value)` to round to two decimal places.",
    examples: [
      {
        label: "Example 1",
        input: "radius = 7.0",
        output: "153.94",
        explanation:
          "π × 7 × 7 ≈ 153.9380 which rounds to 153.94.",
      },
    ],
    constraints: [
      "Use `Math.PI` rather than hardcoding 3.14.",
      "Print the result rounded to exactly two decimal places.",
    ],
    followUp:
      "Can you extend the program to also print the circumference?",
    beginnerTips: [
      "`Math.PI` is a `double` constant — use `double` for radius and area.",
      "Multiplication uses the * operator.",
      "`String.format` produces a rounded string you can pass to println.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        double radius = 7.0;
        // Compute the area and print it rounded to 2 decimals
    }
}`,
  },
  {
    id: 4,
    title: "Celsius to Fahrenheit",
    topic: "Java Basics",
    difficulty: "Medium",
    topics: ["Java Basics", "Math"],
    description:
      "A Celsius temperature `c` is declared with a value of 37.0. Convert it to Fahrenheit and print the result rounded to one decimal place.",
    note1:
      "The conversion formula is: F = (C × 9/5) + 32.",
    note2:
      "Watch out for integer division — use doubles or the literal 9.0/5.0.",
    examples: [
      {
        label: "Example 1",
        input: "c = 37.0",
        output: "98.6",
        explanation:
          "(37 × 9/5) + 32 = 66.6 + 32 = 98.6.",
      },
    ],
    constraints: [
      "The output must be rounded to one decimal place.",
      "Do not hardcode the result.",
    ],
    followUp:
      "Can you also compute and print the Kelvin equivalent on the next line?",
    beginnerTips: [
      "Use `double` variables for the math to avoid integer division.",
      "Writing `9.0 / 5.0` forces floating-point division.",
      "`String.format(\"%.1f\", value)` rounds to one decimal place.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        double c = 37.0;
        // Convert c to Fahrenheit and print it rounded to 1 decimal
    }
}`,
  },
  {
    id: 5,
    title: "Simple Interest Calculator",
    topic: "Java Basics",
    difficulty: "Hard",
    topics: ["Java Basics", "Math"],
    description:
      "Given principal = 1500.0, annual rate = 4.3, and time = 3.0 years (all declared), compute the simple interest and print both the interest and the total amount on separate lines, each rounded to two decimal places.",
    note1:
      "Simple Interest = (Principal × Rate × Time) / 100.",
    note2:
      "Total Amount = Principal + Simple Interest.",
    examples: [
      {
        label: "Example 1",
        input: "principal = 1500.0, rate = 4.3, time = 3.0",
        output: "193.50\n1693.50",
        explanation:
          "Interest = (1500 × 4.3 × 3) / 100 = 193.5. Total = 1500 + 193.5 = 1693.5.",
      },
    ],
    constraints: [
      "Use `double` throughout to preserve precision.",
      "Print interest first, then total amount, each rounded to 2 decimals.",
    ],
    followUp:
      "Can you rewrite the calculation as a reusable method that takes the three inputs and returns the interest?",
    beginnerTips: [
      "Mixing int and double in one expression promotes the result to double.",
      "Use separate `println` calls to put the two values on different lines.",
      "`String.format(\"%.2f\", value)` gives a consistently formatted string.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        double principal = 1500.0;
        double rate = 4.3;
        double time = 3.0;
        // Compute and print interest and total amount (each rounded to 2 decimals)
    }
}`,
  },
  {
    id: 6,
    title: "Reverse a String",
    topic: "Java Basics",
    difficulty: "Hard",
    topics: ["Java Basics", "Strings"],
    description:
      "A string `text` is declared with the value `\"Codexa\"`. Reverse the string and print the reversed version.",
    note1:
      "You may use any approach: StringBuilder, a char array, or a manual loop.",
    note2:
      "Do not hardcode the reversed string in your output.",
    examples: [
      {
        label: "Example 1",
        input: "text = \"Codexa\"",
        output: "axedoC",
        explanation:
          "Reading the characters from the end to the start gives `axedoC`.",
      },
    ],
    constraints: [
      "The reversal must be computed at runtime.",
      "Print only the reversed string with no extra text.",
    ],
    followUp:
      "Can you also detect and print whether the original string is a palindrome?",
    beginnerTips: [
      "`StringBuilder` has a built-in `reverse()` method.",
      "`text.length()` returns the number of characters.",
      "`text.charAt(i)` returns the character at index `i` (0-based).",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        String text = "Codexa";
        // Reverse the string and print it
    }
}`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // CONDITIONS
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 7,
    title: "Even or Odd",
    topic: "Conditions",
    difficulty: "Easy",
    topics: ["Conditions", "Modulo"],
    description:
      "A variable `n` is declared with the value 17. Print `Even` if `n` is divisible by 2, otherwise print `Odd`.",
    note1:
      "Use the modulo operator `%` to test divisibility.",
    note2:
      "The output is exactly one word: either `Even` or `Odd`.",
    examples: [
      {
        label: "Example 1",
        input: "n = 17",
        output: "Odd",
        explanation:
          "17 % 2 == 1, so 17 is odd.",
      },
      {
        label: "Example 2",
        input: "n = 42",
        output: "Even",
        explanation:
          "42 % 2 == 0, so 42 is even.",
      },
    ],
    constraints: [
      "Use an `if` / `else` statement — do not hardcode the answer.",
      "Output must be exactly `Even` or `Odd` with matching capitalization.",
    ],
    followUp:
      "Can you handle negative numbers correctly as well?",
    beginnerTips: [
      "`n % 2` gives the remainder after dividing by 2.",
      "An `if` condition must be a boolean expression like `n % 2 == 0`.",
      "`System.out.println(\"Even\")` prints the word Even.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 17;
        // Print "Even" if n is even, otherwise "Odd"
    }
}`,
  },
  {
    id: 8,
    title: "Positive, Negative, or Zero",
    topic: "Conditions",
    difficulty: "Easy",
    topics: ["Conditions", "If-Else"],
    description:
      "Given an integer `n` declared with the value -5, print `Positive` if it is greater than 0, `Negative` if it is less than 0, and `Zero` otherwise.",
    note1:
      "Use an `if` / `else if` / `else` chain.",
    note2:
      "Output is exactly one word with matching capitalization.",
    examples: [
      {
        label: "Example 1",
        input: "n = -5",
        output: "Negative",
      },
      {
        label: "Example 2",
        input: "n = 0",
        output: "Zero",
      },
      {
        label: "Example 3",
        input: "n = 12",
        output: "Positive",
      },
    ],
    constraints: [
      "Exactly one of the three words must be printed.",
      "Do not print any extra text.",
    ],
    followUp:
      "Can you rewrite this using a single ternary expression (nested)?",
    beginnerTips: [
      "`if-else if-else` handles three mutually exclusive branches.",
      "Comparisons return a boolean value: `n > 0`, `n < 0`, `n == 0`.",
      "Pay attention to string capitalization in the output.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = -5;
        // Print Positive / Negative / Zero based on n
    }
}`,
  },
  {
    id: 9,
    title: "Grade Calculator",
    topic: "Conditions",
    difficulty: "Medium",
    topics: ["Conditions", "If-Else"],
    description:
      "A variable `marks` holds an integer test score (0–100). Print a letter grade using these rules: 90 and above → A, 80–89 → B, 70–79 → C, 60–69 → D, below 60 → F. Use the declared value `marks = 76`.",
    note1:
      "Use an `if` / `else if` chain.",
    note2:
      "Print only the letter, nothing else.",
    examples: [
      {
        label: "Example 1",
        input: "marks = 76",
        output: "C",
      },
      {
        label: "Example 2",
        input: "marks = 91",
        output: "A",
      },
      {
        label: "Example 3",
        input: "marks = 59",
        output: "F",
      },
    ],
    constraints: [
      "Marks are guaranteed to be between 0 and 100 inclusive.",
      "The printed grade must be a single uppercase letter.",
    ],
    followUp:
      "Can you add a plus/minus modifier (e.g., B+, B, B-) based on the last digit?",
    beginnerTips: [
      "Order your `else if` branches from highest to lowest threshold.",
      "Each branch should only need to check the lower bound once the higher bounds have been ruled out.",
      "Use `>=` so boundary values like 90 map to A.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int marks = 76;
        // Print the grade letter based on the rules above
    }
}`,
  },
  {
    id: 10,
    title: "Leap Year Check",
    topic: "Conditions",
    difficulty: "Medium",
    topics: ["Conditions", "Logic"],
    description:
      "Given a year declared as `year = 2024`, print `Leap` if it is a leap year, otherwise print `Not Leap`. A leap year is divisible by 4, except for years divisible by 100 but not by 400.",
    note1:
      "Combine the three rules with `&&` and `||`.",
    note2:
      "Year 2000 is a leap year, but 1900 is not.",
    examples: [
      {
        label: "Example 1",
        input: "year = 2024",
        output: "Leap",
      },
      {
        label: "Example 2",
        input: "year = 1900",
        output: "Not Leap",
      },
      {
        label: "Example 3",
        input: "year = 2000",
        output: "Leap",
      },
    ],
    constraints: [
      "The check must use the standard Gregorian leap year rules.",
      "Output is either `Leap` or `Not Leap` — exact capitalization.",
    ],
    followUp:
      "Can you extract the leap year check into a helper method that returns a boolean?",
    beginnerTips: [
      "A leap year condition can be written as: (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0).",
      "Use parentheses to group the conditions clearly.",
      "Print the exact strings with matching spaces.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int year = 2024;
        // Print "Leap" or "Not Leap"
    }
}`,
  },
  {
    id: 11,
    title: "Largest of Three Numbers",
    topic: "Conditions",
    difficulty: "Hard",
    topics: ["Conditions", "Comparison"],
    description:
      "Three integer variables `a`, `b`, and `c` are declared with values 14, 27, and 9. Without using `Math.max`, print the largest of the three.",
    note1:
      "Use nested `if` statements or combined boolean conditions.",
    note2:
      "Print only the number, nothing else.",
    examples: [
      {
        label: "Example 1",
        input: "a = 14, b = 27, c = 9",
        output: "27",
      },
    ],
    constraints: [
      "Do not use `Math.max` or any library helper.",
      "Assume all three numbers may be equal.",
    ],
    followUp:
      "Can you print the smallest number as well, on the next line?",
    beginnerTips: [
      "`if (a >= b && a >= c)` means `a` is at least as large as the other two.",
      "Only one of the three branches should print.",
      "Test with equal numbers to make sure your comparisons use `>=` where needed.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int a = 14;
        int b = 27;
        int c = 9;
        // Print the largest of a, b, c
    }
}`,
  },
  {
    id: 12,
    title: "Quadratic Roots Nature",
    topic: "Conditions",
    difficulty: "Hard",
    topics: ["Conditions", "Math"],
    description:
      "Given coefficients a = 1, b = -3, c = 2 for the equation ax² + bx + c = 0, print the nature of the roots: `Real and Distinct`, `Real and Equal`, or `Complex`.",
    note1:
      "Compute the discriminant: d = b² − 4ac.",
    note2:
      "d > 0 → real and distinct, d == 0 → real and equal, d < 0 → complex.",
    examples: [
      {
        label: "Example 1",
        input: "a = 1, b = -3, c = 2",
        output: "Real and Distinct",
        explanation:
          "d = 9 - 8 = 1, which is > 0.",
      },
      {
        label: "Example 2",
        input: "a = 1, b = 2, c = 1",
        output: "Real and Equal",
      },
      {
        label: "Example 3",
        input: "a = 1, b = 0, c = 4",
        output: "Complex",
      },
    ],
    constraints: [
      "Assume `a` is always non-zero.",
      "Use `int` or `double` — the result must match exactly one of the three strings.",
    ],
    followUp:
      "Can you also compute and print the actual roots when they are real?",
    beginnerTips: [
      "Watch out for operator precedence: `b * b - 4 * a * c` evaluates correctly.",
      "Use an `if` / `else if` / `else` chain to classify the three cases.",
      "Match the output strings exactly, including spaces and capitalization.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int a = 1;
        int b = -3;
        int c = 2;
        // Print the nature of the roots
    }
}`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // LOOPS
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 13,
    title: "Sum of First N Numbers",
    topic: "Loops",
    difficulty: "Easy",
    topics: ["Loops", "For Loop"],
    description:
      "A variable `n` is declared with the value 10. Use a `for` loop to compute and print the sum 1 + 2 + 3 + ... + n.",
    note1:
      "Do not use the closed-form formula n*(n+1)/2.",
    note2:
      "Print only the final sum.",
    examples: [
      {
        label: "Example 1",
        input: "n = 10",
        output: "55",
        explanation:
          "1 + 2 + ... + 10 = 55.",
      },
    ],
    constraints: [
      "You must use a loop to perform the summation.",
      "Assume `n` is a non-negative integer.",
    ],
    followUp:
      "Can you print the sum of only the even numbers from 1 to n?",
    beginnerTips: [
      "Declare a `sum` variable initialized to 0 before the loop.",
      "Inside the loop, add the loop counter to `sum`.",
      "A classic pattern is `for (int i = 1; i <= n; i++)`.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 10;
        // Use a loop to compute and print the sum 1 + 2 + ... + n
    }
}`,
  },
  {
    id: 14,
    title: "Factorial of N",
    topic: "Loops",
    difficulty: "Easy",
    topics: ["Loops", "Math"],
    description:
      "A variable `n` is declared with the value 6. Compute the factorial n! using a loop and print the result.",
    note1:
      "Factorial: n! = 1 × 2 × 3 × ... × n. By convention 0! = 1.",
    note2:
      "Use a `long` to avoid overflow for larger values of n.",
    examples: [
      {
        label: "Example 1",
        input: "n = 6",
        output: "720",
        explanation:
          "6! = 1 × 2 × 3 × 4 × 5 × 6 = 720.",
      },
    ],
    constraints: [
      "Use a loop (for or while).",
      "Assume `n` is between 0 and 20.",
    ],
    followUp:
      "Can you rewrite the factorial using recursion instead of a loop?",
    beginnerTips: [
      "Initialize `result` to 1 before the loop (not 0 — you are multiplying).",
      "Multiply `result` by `i` for every iteration.",
      "Use `long` to hold the result because factorials grow fast.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 6;
        // Compute and print n!
    }
}`,
  },
  {
    id: 15,
    title: "Multiplication Table",
    topic: "Loops",
    difficulty: "Medium",
    topics: ["Loops", "For Loop"],
    description:
      "A variable `n` is declared with the value 7. Print the multiplication table of `n` from 1 to 10. Each line must be formatted as `n x i = result`.",
    note1:
      "There should be exactly 10 lines of output.",
    note2:
      "Use the lowercase letter x with single spaces around it.",
    examples: [
      {
        label: "Example 1",
        input: "n = 7",
        output: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n... (up to 7 x 10 = 70)",
      },
    ],
    constraints: [
      "Use a single for loop from 1 to 10.",
      "Match the line format exactly, including spaces around `x` and `=`.",
    ],
    followUp:
      "Can you print multiplication tables for numbers 1 through 5 using nested loops?",
    beginnerTips: [
      "String concatenation with `+` builds each line: `n + \" x \" + i + \" = \" + (n * i)`.",
      "`println` puts each line on its own row.",
      "Use `i` as the loop variable that goes from 1 to 10.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 7;
        // Print the multiplication table of n from 1 to 10
    }
}`,
  },
  {
    id: 16,
    title: "Count Digits of a Number",
    topic: "Loops",
    difficulty: "Medium",
    topics: ["Loops", "While Loop"],
    description:
      "A variable `n` is declared with the value 40562. Use a `while` loop to count and print how many digits it has. Do not convert the number to a string.",
    note1:
      "You can strip the last digit each iteration with `n = n / 10`.",
    note2:
      "Be careful: the loop must run at least once so that `0` reports 1 digit.",
    examples: [
      {
        label: "Example 1",
        input: "n = 40562",
        output: "5",
      },
      {
        label: "Example 2",
        input: "n = 0",
        output: "1",
      },
    ],
    constraints: [
      "Do not use `String.valueOf(n).length()`.",
      "Handle the n == 0 case correctly.",
    ],
    followUp:
      "Can you also print the sum of the digits on the next line?",
    beginnerTips: [
      "Use a `do-while` or initialize count to 1 so n == 0 works.",
      "Each iteration: `count++` then `n = n / 10`.",
      "Integer division truncates toward zero in Java.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 40562;
        // Count and print the number of digits in n
    }
}`,
  },
  {
    id: 17,
    title: "Fibonacci Series",
    topic: "Loops",
    difficulty: "Hard",
    topics: ["Loops", "Math"],
    description:
      "Given `n = 8`, print the first `n` terms of the Fibonacci sequence on a single line, separated by spaces. The sequence starts with 0 and 1.",
    note1:
      "Each term is the sum of the two previous terms.",
    note2:
      "Print the numbers on one line with a single space between them.",
    examples: [
      {
        label: "Example 1",
        input: "n = 8",
        output: "0 1 1 2 3 5 8 13",
      },
    ],
    constraints: [
      "Use `int` or `long` — values stay well within range for small n.",
      "Do not print a trailing space, and do not add a leading space.",
    ],
    followUp:
      "Can you print only the even Fibonacci numbers below a given limit?",
    beginnerTips: [
      "Track two variables: the previous and current Fibonacci values.",
      "Use a `StringBuilder` to avoid trailing spaces in the output.",
      "Update the pair inside the loop: new current = previous + current.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 8;
        // Print the first n Fibonacci numbers on one line
    }
}`,
  },
  {
    id: 18,
    title: "Prime Number Check",
    topic: "Loops",
    difficulty: "Hard",
    topics: ["Loops", "Math"],
    description:
      "A variable `n` is declared with the value 29. Use a loop to determine whether `n` is a prime number. Print `Prime` or `Not Prime`.",
    note1:
      "A prime number is greater than 1 and divisible only by 1 and itself.",
    note2:
      "You only need to test divisors up to √n for efficiency.",
    examples: [
      {
        label: "Example 1",
        input: "n = 29",
        output: "Prime",
      },
      {
        label: "Example 2",
        input: "n = 15",
        output: "Not Prime",
      },
      {
        label: "Example 3",
        input: "n = 1",
        output: "Not Prime",
      },
    ],
    constraints: [
      "Handle the edge cases 0 and 1 correctly (both are Not Prime).",
      "Output must match the exact strings.",
    ],
    followUp:
      "Can you print the list of all primes below n instead?",
    beginnerTips: [
      "Start with a `boolean isPrime = true` flag.",
      "Loop from 2 up to `Math.sqrt(n)`, checking `n % i == 0`.",
      "Break out of the loop as soon as you find a divisor.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 29;
        // Print "Prime" or "Not Prime"
    }
}`,
  },

  // ─────────────────────────────────────────────────────────────────────
  // ARRAYS
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 19,
    title: "Print Array Elements",
    topic: "Arrays",
    difficulty: "Easy",
    topics: ["Arrays", "For Loop"],
    description:
      "An array `nums = {4, 9, 2, 7, 1}` is declared. Use a loop to print each element on its own line.",
    note1:
      "Do not use `Arrays.toString` — iterate the array yourself.",
    note2:
      "Exactly one element per line, no extra text.",
    examples: [
      {
        label: "Example 1",
        input: "nums = {4, 9, 2, 7, 1}",
        output: "4\n9\n2\n7\n1",
      },
    ],
    constraints: [
      "You must iterate the array.",
      "Print elements in their original order.",
    ],
    followUp:
      "Can you print the array in reverse order on the next attempt?",
    beginnerTips: [
      "`nums.length` gives the number of elements in the array.",
      "Array indexes start at 0, so use `i = 0; i < nums.length`.",
      "A for-each loop `for (int x : nums)` also works.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {4, 9, 2, 7, 1};
        // Print each element on its own line
    }
}`,
  },
  {
    id: 20,
    title: "Sum of Array",
    topic: "Arrays",
    difficulty: "Easy",
    topics: ["Arrays", "Aggregation"],
    description:
      "Given `nums = {3, 8, 2, 11, 6}`, compute the sum of all elements and print it.",
    note1:
      "Use a loop to accumulate the sum.",
    note2:
      "Print only the final sum.",
    examples: [
      {
        label: "Example 1",
        input: "nums = {3, 8, 2, 11, 6}",
        output: "30",
      },
    ],
    constraints: [
      "The array may contain any non-negative integers.",
      "Do not use any external library helpers.",
    ],
    followUp:
      "Can you also print the average (sum divided by length), rounded to 2 decimals?",
    beginnerTips: [
      "Initialize `sum = 0` before the loop.",
      "Inside the loop, do `sum += nums[i]` or `sum += x` with for-each.",
      "Print `sum` only once — after the loop finishes.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 8, 2, 11, 6};
        // Compute and print the sum of all elements
    }
}`,
  },
  {
    id: 21,
    title: "Maximum in Array",
    topic: "Arrays",
    difficulty: "Medium",
    topics: ["Arrays", "Comparison"],
    description:
      "Given `nums = {12, 45, 7, 89, 23, 56}`, find and print the maximum value. Do not use `Math.max` or `Arrays.stream`.",
    note1:
      "Initialize a `max` variable to the first element of the array.",
    note2:
      "Walk through the rest of the array and update `max` when you find a larger element.",
    examples: [
      {
        label: "Example 1",
        input: "nums = {12, 45, 7, 89, 23, 56}",
        output: "89",
      },
    ],
    constraints: [
      "Array is guaranteed to be non-empty.",
      "Do not use built-in max helpers.",
    ],
    followUp:
      "Can you also print the index of the maximum element?",
    beginnerTips: [
      "`int max = nums[0]` is a safe starting point for non-empty arrays.",
      "Loop from index 1 onwards for efficiency.",
      "Use `if (nums[i] > max) max = nums[i]`.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {12, 45, 7, 89, 23, 56};
        // Find and print the maximum value
    }
}`,
  },
  {
    id: 22,
    title: "Count Even Numbers",
    topic: "Arrays",
    difficulty: "Medium",
    topics: ["Arrays", "Conditions"],
    description:
      "Given `nums = {5, 12, 7, 8, 9, 14, 3, 6}`, count how many elements are even and print the count.",
    note1:
      "Use a loop and the modulo operator.",
    note2:
      "Print only the integer count.",
    examples: [
      {
        label: "Example 1",
        input: "nums = {5, 12, 7, 8, 9, 14, 3, 6}",
        output: "4",
        explanation:
          "The even numbers are 12, 8, 14, 6 — four in total.",
      },
    ],
    constraints: [
      "The array may be empty — in that case the count is 0.",
      "Do not use any stream API.",
    ],
    followUp:
      "Can you also print the count of odd numbers on the next line?",
    beginnerTips: [
      "Initialize a `count` variable to 0.",
      "Inside the loop, check `nums[i] % 2 == 0`.",
      "Print `count` after the loop finishes.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {5, 12, 7, 8, 9, 14, 3, 6};
        // Count and print how many elements are even
    }
}`,
  },
  {
    id: 23,
    title: "Reverse an Array",
    topic: "Arrays",
    difficulty: "Hard",
    topics: ["Arrays", "Two Pointers"],
    description:
      "Given `nums = {1, 2, 3, 4, 5}`, reverse the array in place (without creating a new array) and print the reversed elements separated by single spaces.",
    note1:
      "Use two pointers: one at the start, one at the end, and swap.",
    note2:
      "Move the pointers toward each other until they meet.",
    examples: [
      {
        label: "Example 1",
        input: "nums = {1, 2, 3, 4, 5}",
        output: "5 4 3 2 1",
      },
    ],
    constraints: [
      "Do not allocate a second array for the result.",
      "Print the elements on one line separated by single spaces, no trailing space.",
    ],
    followUp:
      "Can you generalize the swap into a helper method?",
    beginnerTips: [
      "Use a temporary variable for the swap: `int tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp;`.",
      "Stop when `i >= j`.",
      "Use a `StringBuilder` when printing to avoid trailing spaces.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5};
        // Reverse in place and print with single spaces
    }
}`,
  },
  {
    id: 24,
    title: "Linear Search",
    topic: "Arrays",
    difficulty: "Hard",
    topics: ["Arrays", "Search"],
    description:
      "Given `nums = {10, 25, 37, 48, 59, 63}` and `target = 48`, find the index of the target using linear search. Print the index if found, or `-1` if the target is not in the array.",
    note1:
      "Return the first index where `nums[i] == target`.",
    note2:
      "If the target is not found, print `-1` exactly.",
    examples: [
      {
        label: "Example 1",
        input: "nums = {10, 25, 37, 48, 59, 63}, target = 48",
        output: "3",
      },
      {
        label: "Example 2",
        input: "nums = {10, 25, 37, 48, 59, 63}, target = 100",
        output: "-1",
      },
    ],
    constraints: [
      "Do not use `Arrays.asList` or any built-in search helpers.",
      "The array is not guaranteed to be sorted — use linear search, not binary search.",
    ],
    followUp:
      "Can you count how many times the target appears in the array instead?",
    beginnerTips: [
      "Track an `int index = -1;` variable before the loop.",
      "Inside the loop, if you find the target set `index = i;` and `break;`.",
      "Print `index` once after the loop ends.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] nums = {10, 25, 37, 48, 59, 63};
        int target = 48;
        // Print the index of target, or -1 if not found
    }
}`,
  },
  {
    id: 25,
    title: "Print Name and Age",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Output"],
    description:
      "A student profile screen needs to show a learner's name and age in one friendly sentence. Use the declared variables `name` and `age` to print the exact sentence `Aarav is 14 years old.`.",
    note1:
      "Build the sentence from the variables instead of typing the whole final sentence as one literal.",
    note2:
      "Place spaces inside the string pieces you concatenate so the words do not run together.",
    examples: [
      {
        label: "Example 1",
        input: "name = \"Aarav\", age = 14",
        output: "Aarav is 14 years old.",
        explanation:
          "The program combines the name, age, and surrounding words into one readable sentence.",
      },
    ],
    constraints: [
      "Use both declared variables in the output.",
      "Print exactly one sentence with the final period.",
    ],
    followUp:
      "Can you print the same profile as two labeled lines: one for name and one for age?",
    beginnerTips: [
      "Use `+` to join strings and variables.",
      "String literals need double quotes, such as `\" is \"`.",
      "Print once after the full sentence has been assembled.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        String name = "Aarav";
        int age = 14;
        // Print the sentence using name and age
    }
}`,
  },
  {
    id: 26,
    title: "Add Two Integers",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Arithmetic"],
    description:
      "A shopkeeper enters the prices of two notebooks: `firstPrice = 18` and `secondPrice = 24`. Calculate and print the total bill amount.",
    note1:
      "Add the two integer prices and print the resulting total.",
    note2:
      "Store the sum in a variable before printing so the calculation is easy to read.",
    examples: [
      {
        label: "Example 1",
        input: "firstPrice = 18, secondPrice = 24",
        output: "42",
        explanation:
          "The total bill is 18 + 24, which is 42.",
      },
    ],
    constraints: [
      "Use the declared price variables.",
      "Print only the numeric total.",
    ],
    followUp:
      "Can you add a third item price and print the new total?",
    beginnerTips: [
      "The `+` operator adds numbers.",
      "An `int` is suitable for whole-number prices here.",
      "Do not put quotes around the sum variable when printing it.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int firstPrice = 18;
        int secondPrice = 24;
        // Calculate and print the total bill
    }
}`,
  },
  {
    id: 27,
    title: "Multiply Two Numbers",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Arithmetic"],
    description:
      "A classroom has 9 benches, and each bench seats 6 students. Calculate and print the total seating capacity.",
    note1:
      "Multiply the number of benches by the number of students per bench.",
    note2:
      "Java uses `*` for multiplication, not `x`.",
    examples: [
      {
        label: "Example 1",
        input: "benches = 9, studentsPerBench = 6",
        output: "54",
        explanation:
          "9 benches with 6 students each can seat 54 students.",
      },
    ],
    constraints: [
      "Use the declared variables in the multiplication.",
      "Print only the capacity number.",
    ],
    followUp:
      "Can you calculate the capacity for two classrooms and print their combined capacity?",
    beginnerTips: [
      "Create a variable such as `capacity` for the result.",
      "Multiplication happens before addition in mixed expressions.",
      "Keep variable names descriptive so the formula is clear.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int benches = 9;
        int studentsPerBench = 6;
        // Calculate and print the total seating capacity
    }
}`,
  },
  {
    id: 28,
    title: "Calculate Rectangle Area",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Math"],
    description:
      "A gardener wants to cover a rectangular flower bed that is 12 meters long and 5 meters wide. Calculate and print the area that must be covered.",
    note1:
      "Use the rectangle area formula: length multiplied by width.",
    note2:
      "The result should be a number only; do not print units like square meters.",
    examples: [
      {
        label: "Example 1",
        input: "length = 12, width = 5",
        output: "60",
        explanation:
          "The area is 12 * 5, which equals 60.",
      },
    ],
    constraints: [
      "Use the declared length and width variables.",
      "Print only the calculated area.",
    ],
    followUp:
      "Can you also calculate how much fencing is needed around the flower bed?",
    beginnerTips: [
      "Area formulas are a good way to practice arithmetic expressions.",
      "Use `int area = length * width;` as the general pattern.",
      "Print after the calculation, not before it.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int length = 12;
        int width = 5;
        // Calculate and print the flower bed area
    }
}`,
  },
  {
    id: 29,
    title: "Calculate Simple Average",
    topic: "Java Basics",
    difficulty: "Medium",
    topics: ["Java Basics", "Math"],
    description:
      "A teacher records three quiz scores: 80, 90, and 70. Calculate the average score and print it rounded to one decimal place.",
    note1:
      "Add all three scores, then divide by the number of scores.",
    note2:
      "Use decimal division so the average keeps `.0` when needed.",
    examples: [
      {
        label: "Example 1",
        input: "quiz1 = 80, quiz2 = 90, quiz3 = 70",
        output: "80.0",
        explanation:
          "The total is 240, and 240 divided by 3 is 80.0 when formatted to one decimal place.",
      },
    ],
    constraints: [
      "Use the three declared quiz score variables.",
      "Print exactly one digit after the decimal point.",
    ],
    followUp:
      "Can you calculate the average after dropping the lowest quiz score?",
    beginnerTips: [
      "Dividing by `3.0` avoids integer-only division.",
      "Use a `double` variable for the average.",
      "`String.format(\"%.1f\", average)` controls the displayed precision.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int quiz1 = 80;
        int quiz2 = 90;
        int quiz3 = 70;
        // Calculate and print the average rounded to 1 decimal
    }
}`,
  },
  {
    id: 30,
    title: "Convert Minutes to Hours and Minutes",
    topic: "Java Basics",
    difficulty: "Medium",
    topics: ["Java Basics", "Arithmetic"],
    description:
      "A movie lasts 135 minutes. Convert the duration into hours and remaining minutes, then print it in the format `2 hours 15 minutes`.",
    note1:
      "Calculate whole hours and leftover minutes from the total minutes.",
    note2:
      "Integer division gives the hours, and modulo gives the remainder minutes.",
    examples: [
      {
        label: "Example 1",
        input: "totalMinutes = 135",
        output: "2 hours 15 minutes",
        explanation:
          "135 minutes is 2 full hours with 15 minutes remaining.",
      },
    ],
    constraints: [
      "Use arithmetic operators instead of hardcoding the converted duration.",
      "Match the output format exactly.",
    ],
    followUp:
      "Can you convert a number of seconds into hours, minutes, and seconds?",
    beginnerTips: [
      "`totalMinutes / 60` gives whole hours.",
      "`totalMinutes % 60` gives leftover minutes.",
      "Concatenate numbers and words in the required order.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int totalMinutes = 135;
        // Convert to hours and minutes, then print the formatted result
    }
}`,
  },
  {
    id: 31,
    title: "Calculate Perimeter of Square",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Math"],
    description:
      "A craft project uses a square tile with side length 9 cm. Calculate and print the total border length of the tile.",
    note1:
      "The perimeter of a square is 4 times its side length.",
    note2:
      "Only print the number; the checker does not expect `cm`.",
    examples: [
      {
        label: "Example 1",
        input: "side = 9",
        output: "36",
        explanation:
          "A square has four equal sides, so 4 * 9 = 36.",
      },
    ],
    constraints: [
      "Use the declared side variable.",
      "Print only the perimeter value.",
    ],
    followUp:
      "Can you calculate both the perimeter and area of the square?",
    beginnerTips: [
      "Use multiplication for repeated addition.",
      "A named variable like `perimeter` makes the code readable.",
      "Formula problems are a good place to practice clear variable names.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int side = 9;
        // Calculate and print the perimeter
    }
}`,
  },
  {
    id: 32,
    title: "Find Remainder",
    topic: "Java Basics",
    difficulty: "Easy",
    topics: ["Java Basics", "Modulo"],
    description:
      "A teacher divides 29 pencils equally among groups of 5 students. Print how many pencils are left over.",
    note1:
      "Use the modulo operator to find the leftover amount after division.",
    note2:
      "The quotient is not needed for this task; only the remainder is printed.",
    examples: [
      {
        label: "Example 1",
        input: "pencils = 29, groupSize = 5",
        output: "4",
        explanation:
          "Five groups can receive 25 pencils, leaving 4 pencils unused.",
      },
    ],
    constraints: [
      "Use `%` with the declared variables.",
      "Print only the leftover count.",
    ],
    followUp:
      "Can you also print how many full groups can be formed?",
    beginnerTips: [
      "Modulo answers the question: what is left after division?",
      "`29 % 5` evaluates to 4.",
      "Modulo is used often in conditions and loops too.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int pencils = 29;
        int groupSize = 5;
        // Print how many pencils are left over
    }
}`,
  },
  {
    id: 33,
    title: "Swap Without Third Variable",
    topic: "Java Basics",
    difficulty: "Hard",
    topics: ["Java Basics", "Variables"],
    description:
      "Two scoreboard values were entered in the wrong order: `homeScore = 8` and `awayScore = 3`. Swap them without using a third variable, then print the corrected order.",
    note1:
      "Change the values stored in the two existing variables so they trade places.",
    note2:
      "Addition and subtraction can move values around, but do each step carefully.",
    examples: [
      {
        label: "Example 1",
        input: "homeScore = 8, awayScore = 3",
        output: "3 8",
        explanation:
          "After swapping, the first variable holds 3 and the second holds 8.",
      },
    ],
    constraints: [
      "Do not declare another variable for the swap.",
      "Print the two final values on one line separated by one space.",
    ],
    followUp:
      "Can you explain why this technique is risky for very large integers?",
    beginnerTips: [
      "Track the value of each variable after every assignment.",
      "Assignment changes the variable on the left side.",
      "Print only after both variables have been updated.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int homeScore = 8;
        int awayScore = 3;
        // Swap the scores without using a third variable
        System.out.println(homeScore + " " + awayScore);
    }
}`,
  },
  {
    id: 34,
    title: "Calculate BMI",
    topic: "Java Basics",
    difficulty: "Hard",
    topics: ["Java Basics", "Math"],
    description:
      "A health app stores a user's weight as 68.0 kg and height as 1.7 meters. Calculate the BMI and print it rounded to one decimal place.",
    note1:
      "Use the BMI formula: weight divided by height squared.",
    note2:
      "Use parentheses around `height * height` so the denominator is calculated first.",
    examples: [
      {
        label: "Example 1",
        input: "weight = 68.0, height = 1.7",
        output: "23.5",
        explanation:
          "68.0 / (1.7 * 1.7) rounds to 23.5.",
      },
    ],
    constraints: [
      "Use `double` values for the calculation.",
      "Print exactly one digit after the decimal point.",
    ],
    followUp:
      "Can you use conditions to classify the BMI range after calculating it?",
    beginnerTips: [
      "Decimal measurements should usually use `double`.",
      "Complex formulas are easier to read when split into variables.",
      "Formatting controls the output without changing the actual calculation idea.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        double weight = 68.0;
        double height = 1.7;
        // Calculate and print BMI rounded to 1 decimal
    }
}`,
  },
  {
    id: 35,
    title: "Check Voting Eligibility",
    topic: "Conditions",
    difficulty: "Easy",
    topics: ["Conditions", "Comparison"],
    description:
      "A registration form stores a person's age as `age = 19`. Print `Eligible` if the person can vote, otherwise print `Not Eligible`.",
    note1:
      "Use a condition to compare the age with the voting age requirement of 18.",
    note2:
      "The boundary matters: someone who is exactly 18 is eligible.",
    examples: [
      {
        label: "Example 1",
        input: "age = 19",
        output: "Eligible",
        explanation:
          "19 is greater than or equal to 18, so the person is eligible.",
      },
    ],
    constraints: [
      "Use an `if` / `else` statement.",
      "Print exactly one of the two allowed messages.",
    ],
    followUp:
      "Can you print how many years remain when the person is under 18?",
    beginnerTips: [
      "Use `>=` for at least comparisons.",
      "The `if` block handles the true case.",
      "The `else` block handles everything that did not pass the condition.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int age = 19;
        // Print Eligible or Not Eligible
    }
}`,
  },
  {
    id: 36,
    title: "Check Divisibility by 5",
    topic: "Conditions",
    difficulty: "Easy",
    topics: ["Conditions", "Modulo"],
    description:
      "A game awards a bonus when a score is a multiple of 5. Given `score = 45`, print `Divisible` if it earns the bonus, otherwise print `Not Divisible`.",
    note1:
      "Check whether the score leaves no remainder when divided by 5.",
    note2:
      "Modulo gives the remainder; a remainder of 0 means exact divisibility.",
    examples: [
      {
        label: "Example 1",
        input: "score = 45",
        output: "Divisible",
        explanation:
          "45 divided by 5 leaves remainder 0.",
      },
    ],
    constraints: [
      "Use `%` in the condition.",
      "Print exactly `Divisible` or `Not Divisible`.",
    ],
    followUp:
      "Can you check whether a score is divisible by both 5 and 10?",
    beginnerTips: [
      "Write comparisons with `==`, not `=`.",
      "`score % 5 == 0` is a boolean expression.",
      "Keep output strings exactly as requested.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int score = 45;
        // Print Divisible or Not Divisible
    }
}`,
  },
  {
    id: 37,
    title: "Check Divisibility by 3 and 7",
    topic: "Conditions",
    difficulty: "Medium",
    topics: ["Conditions", "Logic"],
    description:
      "A puzzle accepts only numbers that are divisible by both 3 and 7. Given `code = 84`, print `Yes` if it is accepted, otherwise print `No`.",
    note1:
      "Write two divisibility checks and require both to be true.",
    note2:
      "The logical AND operator `&&` is useful when two rules must pass together.",
    examples: [
      {
        label: "Example 1",
        input: "code = 84",
        output: "Yes",
        explanation:
          "84 is divisible by 3 and also divisible by 7.",
      },
    ],
    constraints: [
      "Use modulo for both divisibility checks.",
      "Print only `Yes` or `No`.",
    ],
    followUp:
      "Can you print `Only 3`, `Only 7`, or `Both` for more detailed feedback?",
    beginnerTips: [
      "Break the condition into two smaller ideas first.",
      "Use parentheses if the combined condition feels hard to read.",
      "`&&` is true only when both sides are true.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int code = 84;
        // Print Yes if code is divisible by both 3 and 7
    }
}`,
  },
  {
    id: 38,
    title: "Find Smaller of Two Numbers",
    topic: "Conditions",
    difficulty: "Easy",
    topics: ["Conditions", "Comparison"],
    description:
      "A delivery app compares two route distances: `routeA = 32` km and `routeB = 18` km. Print the shorter distance.",
    note1:
      "Compare the two route values and print the smaller one.",
    note2:
      "An `if` / `else` is enough because there are only two choices.",
    examples: [
      {
        label: "Example 1",
        input: "routeA = 32, routeB = 18",
        output: "18",
        explanation:
          "Route B is shorter, so 18 is printed.",
      },
    ],
    constraints: [
      "Do not use `Math.min`.",
      "Print only the smaller number.",
    ],
    followUp:
      "Can you print `Same distance` when both routes are equal?",
    beginnerTips: [
      "Use `<` to check whether one value is smaller than another.",
      "Think through what the `else` branch means.",
      "Only one value should be printed.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int routeA = 32;
        int routeB = 18;
        // Print the shorter route distance
    }
}`,
  },
  {
    id: 39,
    title: "Check Pass or Fail",
    topic: "Conditions",
    difficulty: "Easy",
    topics: ["Conditions", "If-Else"],
    description:
      "An exam system stores a student's marks as `marks = 41`. Print `Pass` if the marks meet the passing score, otherwise print `Fail`.",
    note1:
      "The student passes when marks are 40 or higher.",
    note2:
      "Use `>=` so exactly 40 is treated as a pass.",
    examples: [
      {
        label: "Example 1",
        input: "marks = 41",
        output: "Pass",
        explanation:
          "41 is above the passing mark of 40.",
      },
    ],
    constraints: [
      "Marks are between 0 and 100.",
      "Print exactly `Pass` or `Fail`.",
    ],
    followUp:
      "Can you add `Distinction` for marks 75 and above?",
    beginnerTips: [
      "Boundary values are important in conditions.",
      "Use `else` for the failing case.",
      "Avoid printing both results by putting prints inside separate branches.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int marks = 41;
        // Print Pass or Fail
    }
}`,
  },
  {
    id: 40,
    title: "Check Character is Vowel or Consonant",
    topic: "Conditions",
    difficulty: "Medium",
    topics: ["Conditions", "Characters"],
    description:
      "A spelling helper receives the lowercase character `ch = 'e'`. Print `Vowel` if it is a vowel, otherwise print `Consonant`.",
    note1:
      "Compare the character against the five lowercase vowels.",
    note2:
      "Use `||` because matching any one vowel is enough.",
    examples: [
      {
        label: "Example 1",
        input: "ch = 'e'",
        output: "Vowel",
        explanation:
          "The character `e` is one of the lowercase vowels.",
      },
    ],
    constraints: [
      "Assume `ch` is a lowercase English letter.",
      "Print only `Vowel` or `Consonant`.",
    ],
    followUp:
      "Can you handle uppercase letters without duplicating every condition?",
    beginnerTips: [
      "Character literals use single quotes, like `'a'`.",
      "Use `==` to compare primitive `char` values.",
      "Long conditions become easier to read when split across lines.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        char ch = 'e';
        // Print Vowel or Consonant
    }
}`,
  },
  {
    id: 41,
    title: "Check Number Range",
    topic: "Conditions",
    difficulty: "Medium",
    topics: ["Conditions", "Logic"],
    description:
      "A scholarship form accepts scores from 50 to 100 inclusive. Given `score = 75`, print `In Range` if the score is valid, otherwise print `Out of Range`.",
    note1:
      "Check both the lower boundary and the upper boundary.",
    note2:
      "Use `&&` because the score must satisfy both range checks.",
    examples: [
      {
        label: "Example 1",
        input: "score = 75",
        output: "In Range",
        explanation:
          "75 is at least 50 and at most 100.",
      },
    ],
    constraints: [
      "Include both 50 and 100 as valid values.",
      "Print exactly one of the two range messages.",
    ],
    followUp:
      "Can you print `Too Low` and `Too High` as separate messages?",
    beginnerTips: [
      "Range checks often need two comparisons.",
      "`score >= 50` checks the lower end.",
      "`score <= 100` checks the upper end.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int score = 75;
        // Print In Range or Out of Range
    }
}`,
  },
  {
    id: 42,
    title: "Electricity Bill Slab",
    topic: "Conditions",
    difficulty: "Hard",
    topics: ["Conditions", "If-Else"],
    description:
      "An electricity board charges 5 per unit for the first 100 units and 8 per unit for each unit above 100. Given `units = 120`, calculate and print the total bill.",
    note1:
      "Use one calculation for customers at or below 100 units and another for customers above 100 units.",
    note2:
      "For extra units, subtract 100 first so only the additional units use the higher rate.",
    examples: [
      {
        label: "Example 1",
        input: "units = 120",
        output: "660",
        explanation:
          "The bill is 100 * 5 plus 20 * 8, which totals 660.",
      },
    ],
    constraints: [
      "Units are non-negative whole numbers.",
      "Print only the final bill amount.",
    ],
    followUp:
      "Can you add a third slab for units above 200?",
    beginnerTips: [
      "Slab problems are a common use for `if` / `else`.",
      "Calculate the base cost separately from the extra cost.",
      "Store the bill in a variable and print it once.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int units = 120;
        // Calculate and print the electricity bill
    }
}`,
  },
  {
    id: 43,
    title: "Simple Login Check",
    topic: "Conditions",
    difficulty: "Hard",
    topics: ["Conditions", "Strings"],
    description:
      "A small app checks login details. Given `username = \"admin\"` and `password = \"java123\"`, print `Login Successful` only when both match the saved credentials.",
    note1:
      "Check the username and password separately, then combine the checks.",
    note2:
      "Use `.equals()` for string content comparison in Java.",
    examples: [
      {
        label: "Example 1",
        input: "username = \"admin\", password = \"java123\"",
        output: "Login Successful",
        explanation:
          "Both entered values match the expected login details.",
      },
    ],
    constraints: [
      "Do not compare strings with `==`.",
      "Print exactly `Login Successful` or `Login Failed`.",
    ],
    followUp:
      "Can you print a separate message for an incorrect username and an incorrect password?",
    beginnerTips: [
      "Strings are objects, so `.equals()` checks their text.",
      "Use `&&` when both credentials must be correct.",
      "Keep expected credentials as clear string literals.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        String username = "admin";
        String password = "java123";
        // Print Login Successful or Login Failed
    }
}`,
  },
  {
    id: 44,
    title: "Triangle Validity Check",
    topic: "Conditions",
    difficulty: "Hard",
    topics: ["Conditions", "Geometry"],
    description:
      "A drawing program receives three side lengths: `a = 5`, `b = 7`, and `c = 10`. Print `Valid` if these sides can form a triangle, otherwise print `Invalid`.",
    note1:
      "Check that the sum of every pair of sides is greater than the remaining side.",
    note2:
      "All three triangle inequality checks must pass for the triangle to be valid.",
    examples: [
      {
        label: "Example 1",
        input: "a = 5, b = 7, c = 10",
        output: "Valid",
        explanation:
          "Each pair of sides adds up to more than the third side.",
      },
    ],
    constraints: [
      "Assume all side lengths are positive integers.",
      "Print only `Valid` or `Invalid`.",
    ],
    followUp:
      "Can you classify a valid triangle as equilateral, isosceles, or scalene?",
    beginnerTips: [
      "Geometry rules often translate directly into boolean expressions.",
      "Use `&&` to require all triangle checks.",
      "Write each side-sum comparison clearly before combining them.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 7;
        int c = 10;
        // Print Valid or Invalid
    }
}`,
  },
  {
    id: 45,
    title: "Print Numbers 1 to N",
    topic: "Loops",
    difficulty: "Easy",
    topics: ["Loops", "For Loop"],
    description:
      "A ticket counter needs to display token numbers from 1 through `n = 5`. Print each token number on its own line.",
    note1:
      "Use a loop counter that starts at 1 and increases until it reaches n.",
    note2:
      "The condition should include n, so the final number 5 is printed.",
    examples: [
      {
        label: "Example 1",
        input: "n = 5",
        output: "1\\n2\\n3\\n4\\n5",
        explanation:
          "The loop prints every token number from 1 to 5.",
      },
    ],
    constraints: [
      "Use a loop instead of five separate print statements.",
      "Print exactly one number per line.",
    ],
    followUp:
      "Can you print the same numbers on one line separated by spaces?",
    beginnerTips: [
      "A `for` loop is ideal when you know the start and end values.",
      "The loop counter changes automatically after each iteration.",
      "Use `println` when each value needs its own line.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        // Print numbers from 1 to n
    }
}`,
  },
  {
    id: 46,
    title: "Print Numbers N to 1",
    topic: "Loops",
    difficulty: "Easy",
    topics: ["Loops", "For Loop"],
    description:
      "A launch screen counts down from `n = 5` to 1 before starting. Print each countdown number on its own line.",
    note1:
      "Use a loop counter that starts at n and decreases by 1 each time.",
    note2:
      "The loop should continue while the counter is at least 1.",
    examples: [
      {
        label: "Example 1",
        input: "n = 5",
        output: "5\\n4\\n3\\n2\\n1",
        explanation:
          "The countdown prints 5 first and 1 last.",
      },
    ],
    constraints: [
      "Use a loop with a decrementing counter.",
      "Print exactly one number per line.",
    ],
    followUp:
      "Can you print `Go!` after the countdown finishes?",
    beginnerTips: [
      "Use `i--` to reduce a counter by 1.",
      "The starting value can be the variable `n`.",
      "Check that your loop does not stop before printing 1.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        // Print numbers from n down to 1
    }
}`,
  },
  {
    id: 47,
    title: "Sum of Even Numbers",
    topic: "Loops",
    difficulty: "Easy",
    topics: ["Loops", "Aggregation"],
    description:
      "A math worksheet asks for the sum of all even numbers from 1 to `n = 10`. Calculate and print that sum.",
    note1:
      "Loop through the numbers and add only the even ones to an accumulator.",
    note2:
      "Use modulo to test whether the current number is even.",
    examples: [
      {
        label: "Example 1",
        input: "n = 10",
        output: "30",
        explanation:
          "2 + 4 + 6 + 8 + 10 equals 30.",
      },
    ],
    constraints: [
      "Use a loop and an accumulator variable.",
      "Print only the final sum.",
    ],
    followUp:
      "Can you solve it by making the loop jump by 2 each time?",
    beginnerTips: [
      "An accumulator usually starts at 0.",
      "`i % 2 == 0` identifies even numbers.",
      "Print after the loop, not during every iteration.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 10;
        // Sum and print the even numbers from 1 to n
    }
}`,
  },
  {
    id: 48,
    title: "Sum of Odd Numbers",
    topic: "Loops",
    difficulty: "Easy",
    topics: ["Loops", "Aggregation"],
    description:
      "A number game scores only odd positions from 1 to `n = 9`. Calculate and print the sum of those odd position numbers.",
    note1:
      "Loop from 1 to n and add only numbers that are odd.",
    note2:
      "A number is odd when dividing by 2 leaves a remainder.",
    examples: [
      {
        label: "Example 1",
        input: "n = 9",
        output: "25",
        explanation:
          "1 + 3 + 5 + 7 + 9 equals 25.",
      },
    ],
    constraints: [
      "Use a loop and a sum variable.",
      "Print only the final sum.",
    ],
    followUp:
      "Can you also count how many odd numbers were added?",
    beginnerTips: [
      "Use `i % 2 != 0` to detect odd values.",
      "Add matching values to `sum` with `sum += i`.",
      "Keep the print statement outside the loop.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 9;
        // Sum and print the odd numbers from 1 to n
    }
}`,
  },
  {
    id: 49,
    title: "Print Squares from 1 to N",
    topic: "Loops",
    difficulty: "Medium",
    topics: ["Loops", "Math"],
    description:
      "A practice table needs the square values for numbers 1 through `n = 5`. Print each square on its own line.",
    note1:
      "For each loop value, multiply it by itself and print the result.",
    note2:
      "Calculate the square inside the loop so every number gets its own result.",
    examples: [
      {
        label: "Example 1",
        input: "n = 5",
        output: "1\\n4\\n9\\n16\\n25",
        explanation:
          "The program prints 1 squared through 5 squared.",
      },
    ],
    constraints: [
      "Use a loop from 1 through n.",
      "Print one square per line.",
    ],
    followUp:
      "Can you print cubes from 1 to n instead?",
    beginnerTips: [
      "`i * i` gives the square of the current number.",
      "The loop counter can be used directly in formulas.",
      "Use `println` so each square appears on a new line.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        // Print squares from 1 to n
    }
}`,
  },
  {
    id: 50,
    title: "Reverse Digits of a Number",
    topic: "Loops",
    difficulty: "Medium",
    topics: ["Loops", "Digits"],
    description:
      "A number display must show the digits of `n = 1234` in reverse order. Reverse the digits using arithmetic and print the reversed number.",
    note1:
      "Repeatedly take the last digit from the number and attach it to a new reversed value.",
    note2:
      "Modulo gets the last digit, and integer division removes it.",
    examples: [
      {
        label: "Example 1",
        input: "n = 1234",
        output: "4321",
        explanation:
          "The digits 1, 2, 3, 4 become 4, 3, 2, 1.",
      },
    ],
    constraints: [
      "Do not convert the number to a string.",
      "Use a loop and arithmetic operations.",
    ],
    followUp:
      "Can you preserve leading zeroes when reversing a number like 1200?",
    beginnerTips: [
      "Start the reversed number at 0.",
      "Use `digit = n % 10` to read the last digit.",
      "Use `reversed = reversed * 10 + digit` to append a digit.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 1234;
        // Reverse the digits and print the result
    }
}`,
  },
  {
    id: 51,
    title: "Check Palindrome Number",
    topic: "Loops",
    difficulty: "Medium",
    topics: ["Loops", "Digits"],
    description:
      "A ticket number `n = 1221` is considered special if it reads the same forward and backward. Print `Palindrome` if it is special, otherwise print `Not Palindrome`.",
    note1:
      "Reverse the digits and compare the reversed value with the original number.",
    note2:
      "Save the original number before the loop changes `n`.",
    examples: [
      {
        label: "Example 1",
        input: "n = 1221",
        output: "Palindrome",
        explanation:
          "1221 reads the same from left to right and right to left.",
      },
    ],
    constraints: [
      "Do not convert the number to a string.",
      "Print exactly `Palindrome` or `Not Palindrome`.",
    ],
    followUp:
      "Can you check whether a four-digit PIN is a palindrome after removing leading zeroes?",
    beginnerTips: [
      "Changing `n` inside the loop destroys the original value unless you save it.",
      "The reverse-digit pattern from the previous problem is useful here.",
      "Compare numbers with `==` after the loop finishes.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 1221;
        // Print Palindrome or Not Palindrome
    }
}`,
  },
  {
    id: 52,
    title: "Count Factors of a Number",
    topic: "Loops",
    difficulty: "Hard",
    topics: ["Loops", "Modulo"],
    description:
      "A math app needs to know how many positive factors `n = 12` has. Count and print the number of factors.",
    note1:
      "Test every number from 1 through n and count the values that divide n evenly.",
    note2:
      "A factor leaves remainder 0 when used with modulo.",
    examples: [
      {
        label: "Example 1",
        input: "n = 12",
        output: "6",
        explanation:
          "The factors are 1, 2, 3, 4, 6, and 12.",
      },
    ],
    constraints: [
      "Use a loop from 1 to n.",
      "Print only the factor count.",
    ],
    followUp:
      "Can you print each factor before printing the count?",
    beginnerTips: [
      "A counter variable usually starts at 0.",
      "Use `n % i == 0` to detect a factor.",
      "Increment the counter only when the condition is true.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 12;
        // Count and print the number of factors
    }
}`,
  },
  {
    id: 53,
    title: "Print Star Pattern",
    topic: "Loops",
    difficulty: "Hard",
    topics: ["Loops", "Nested Loops"],
    description:
      "A console drawing tool needs a right triangle pattern with `n = 4` rows. Print 1 star on the first row, 2 on the second, and continue up to 4 stars.",
    note1:
      "Use one loop for rows and another loop to print the stars in each row.",
    note2:
      "Use `print` for stars on the same row and `println` when a row is complete.",
    examples: [
      {
        label: "Example 1",
        input: "n = 4",
        output: "*\\n**\\n***\\n****",
        explanation:
          "Each row contains one more star than the previous row.",
      },
    ],
    constraints: [
      "Use nested loops.",
      "Do not print spaces after the stars.",
    ],
    followUp:
      "Can you print the same triangle upside down?",
    beginnerTips: [
      "The outer loop controls the row number.",
      "The inner loop controls how many stars appear on that row.",
      "Patterns become easier when you write the desired output first.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int n = 4;
        // Print the star pattern
    }
}`,
  },
  {
    id: 54,
    title: "Find Power Using Loop",
    topic: "Loops",
    difficulty: "Hard",
    topics: ["Loops", "Math"],
    description:
      "A calculator is missing its power function. Given `base = 3` and `exponent = 4`, calculate base raised to exponent using repeated multiplication and print the result.",
    note1:
      "Multiply the result by the base exactly exponent times.",
    note2:
      "Start the result at 1 so exponent 0 can work naturally later.",
    examples: [
      {
        label: "Example 1",
        input: "base = 3, exponent = 4",
        output: "81",
        explanation:
          "3 multiplied by itself 4 times is 81.",
      },
    ],
    constraints: [
      "Do not use `Math.pow`.",
      "Assume the exponent is non-negative.",
    ],
    followUp:
      "Can you handle exponent 0 and explain why the answer should be 1?",
    beginnerTips: [
      "Repeated multiplication is a natural loop problem.",
      "A loop can run `exponent` times using a counter.",
      "Keep the multiplication inside the loop and the print after it.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int base = 3;
        int exponent = 4;
        // Calculate power using a loop and print it
    }
}`,
  },
  {
    id: 55,
    title: "Find Minimum in Array",
    topic: "Arrays",
    difficulty: "Easy",
    topics: ["Arrays", "Comparison"],
    description:
      "A weather app stores weekly morning temperatures in `temps = {12, 5, 27, 3, 19}`. Find and print the lowest temperature.",
    note1:
      "Visit each array element and keep track of the smallest value seen so far.",
    note2:
      "Start with the first element as the current minimum, then compare the rest.",
    examples: [
      {
        label: "Example 1",
        input: "temps = {12, 5, 27, 3, 19}",
        output: "3",
        explanation:
          "3 is the smallest value in the array.",
      },
    ],
    constraints: [
      "The array is non-empty.",
      "Do not use built-in helper methods.",
    ],
    followUp:
      "Can you also print the index where the minimum temperature occurs?",
    beginnerTips: [
      "Arrays are read with indexes like `temps[i]`.",
      "Use a loop to avoid checking each element manually.",
      "Update the minimum only when a smaller value is found.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] temps = {12, 5, 27, 3, 19};
        // Find and print the lowest temperature
    }
}`,
  },
  {
    id: 56,
    title: "Calculate Average of Array",
    topic: "Arrays",
    difficulty: "Easy",
    topics: ["Arrays", "Aggregation"],
    description:
      "A coach records four lap times in seconds: `times = {10, 20, 30, 40}`. Calculate the average lap time and print it rounded to one decimal place.",
    note1:
      "Add every array element, then divide by the number of elements.",
    note2:
      "Use `times.length` so the code depends on the array size, not a hardcoded count.",
    examples: [
      {
        label: "Example 1",
        input: "times = {10, 20, 30, 40}",
        output: "25.0",
        explanation:
          "The total is 100, and 100 divided by 4 is 25.0.",
      },
    ],
    constraints: [
      "The array is non-empty.",
      "Print exactly one digit after the decimal point.",
    ],
    followUp:
      "Can you calculate the average after ignoring the slowest lap?",
    beginnerTips: [
      "Use a loop to accumulate the total.",
      "Cast or divide by a double to keep decimal precision.",
      "`array.length` is the standard way to get array size.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] times = {10, 20, 30, 40};
        // Calculate and print the average rounded to 1 decimal
    }
}`,
  },
  {
    id: 57,
    title: "Count Odd Numbers",
    topic: "Arrays",
    difficulty: "Easy",
    topics: ["Arrays", "Conditions"],
    description:
      "A list of house numbers is stored as `houses = {2, 7, 9, 12, 15, 20}`. Count how many house numbers are odd and print the count.",
    note1:
      "Traverse the array and test each value for oddness.",
    note2:
      "Modulo by 2 tells you whether a number is even or odd.",
    examples: [
      {
        label: "Example 1",
        input: "houses = {2, 7, 9, 12, 15, 20}",
        output: "3",
        explanation:
          "7, 9, and 15 are odd, so the count is 3.",
      },
    ],
    constraints: [
      "Use a loop over the array.",
      "Print only the final count.",
    ],
    followUp:
      "Can you count even and odd house numbers separately?",
    beginnerTips: [
      "Use a counter variable for matching elements.",
      "A for-each loop works well when indexes are not needed.",
      "Increment the counter only for odd values.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] houses = {2, 7, 9, 12, 15, 20};
        // Count and print odd house numbers
    }
}`,
  },
  {
    id: 58,
    title: "Count Positive and Negative Numbers",
    topic: "Arrays",
    difficulty: "Medium",
    topics: ["Arrays", "Conditions"],
    description:
      "A bank statement stores daily balance changes as `changes = {-3, 5, 0, -1, 8, -6}`. Count positive changes and negative changes, then print the two counts on separate lines.",
    note1:
      "Use one counter for deposits or gains and another counter for losses.",
    note2:
      "Zero should not be counted as positive or negative.",
    examples: [
      {
        label: "Example 1",
        input: "changes = {-3, 5, 0, -1, 8, -6}",
        output: "2\\n3",
        explanation:
          "There are 2 positive values and 3 negative values.",
      },
    ],
    constraints: [
      "Use a loop over the array.",
      "Print positive count first, then negative count.",
    ],
    followUp:
      "Can you also count zero-change days?",
    beginnerTips: [
      "Use `value > 0` for positives.",
      "Use `value < 0` for negatives.",
      "Separate counters make the result easier to manage.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] changes = {-3, 5, 0, -1, 8, -6};
        // Count positives and negatives, then print both counts
    }
}`,
  },
  {
    id: 59,
    title: "Copy Array Elements",
    topic: "Arrays",
    difficulty: "Medium",
    topics: ["Arrays", "Copying"],
    description:
      "A backup tool needs to copy product codes from `source = {4, 8, 15}` into a new array. Copy the elements manually and print the copied values on one line.",
    note1:
      "Create a destination array with the same length and copy each element by index.",
    note2:
      "Assigning one array variable to another would only copy the reference, not practice element-by-element copying.",
    examples: [
      {
        label: "Example 1",
        input: "source = {4, 8, 15}",
        output: "4 8 15",
        explanation:
          "The copied array contains the same values in the same order.",
      },
    ],
    constraints: [
      "Use a new array for the copied values.",
      "Print values with single spaces and no trailing space.",
    ],
    followUp:
      "Can you copy the values into the new array in reverse order?",
    beginnerTips: [
      "Use `new int[source.length]` for the destination.",
      "The same index can read from source and write to copy.",
      "A `StringBuilder` helps build clean spaced output.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] source = {4, 8, 15};
        // Copy source into a new array and print the copied values
    }
}`,
  },
  {
    id: 60,
    title: "Find Second Largest Element",
    topic: "Arrays",
    difficulty: "Hard",
    topics: ["Arrays", "Comparison"],
    description:
      "A competition stores final scores as `scores = {10, 25, 7, 40, 32}`. Find and print the second highest score.",
    note1:
      "Track the largest score and the best score below it while traversing the array.",
    note2:
      "When a new largest value is found, the old largest may become the second largest.",
    examples: [
      {
        label: "Example 1",
        input: "scores = {10, 25, 7, 40, 32}",
        output: "32",
        explanation:
          "40 is highest, and 32 is the next highest score.",
      },
    ],
    constraints: [
      "The array has at least two distinct values.",
      "Do not sort the array.",
    ],
    followUp:
      "Can you handle duplicate highest scores correctly?",
    beginnerTips: [
      "This problem needs two tracking variables, not just one.",
      "Update second largest before replacing the largest when needed.",
      "Test your logic mentally with values in different orders.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] scores = {10, 25, 7, 40, 32};
        // Find and print the second highest score
    }
}`,
  },
  {
    id: 61,
    title: "Check Element Exists",
    topic: "Arrays",
    difficulty: "Medium",
    topics: ["Arrays", "Search"],
    description:
      "A library shelf stores book IDs in `bookIds = {6, 11, 18, 24}`. Given `target = 18`, print `Found` if the ID exists, otherwise print `Not Found`.",
    note1:
      "Search the array one element at a time until the target is found or the array ends.",
    note2:
      "A boolean flag can remember whether the target has been seen.",
    examples: [
      {
        label: "Example 1",
        input: "bookIds = {6, 11, 18, 24}, target = 18",
        output: "Found",
        explanation:
          "The value 18 appears in the array.",
      },
    ],
    constraints: [
      "Use linear search.",
      "Print exactly `Found` or `Not Found`.",
    ],
    followUp:
      "Can you print the index of the found book ID?",
    beginnerTips: [
      "Linear search checks values from left to right.",
      "Use `break` when no further searching is needed.",
      "Print after the search so the message appears once.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] bookIds = {6, 11, 18, 24};
        int target = 18;
        // Print Found or Not Found
    }
}`,
  },
  {
    id: 62,
    title: "Count Frequency of Element",
    topic: "Arrays",
    difficulty: "Medium",
    topics: ["Arrays", "Search"],
    description:
      "A survey records chosen option numbers as `responses = {2, 5, 2, 8, 2, 9}`. Count how many people chose option `target = 2` and print the count.",
    note1:
      "Traverse the full array and count every value equal to the target.",
    note2:
      "Do not stop after the first match because the target can appear multiple times.",
    examples: [
      {
        label: "Example 1",
        input: "responses = {2, 5, 2, 8, 2, 9}, target = 2",
        output: "3",
        explanation:
          "Option 2 appears three times in the responses.",
      },
    ],
    constraints: [
      "Use a loop and a counter.",
      "Print only the frequency count.",
    ],
    followUp:
      "Can you count the frequency of every option from 1 to 5?",
    beginnerTips: [
      "Frequency means number of occurrences.",
      "Compare each element with the target using `==`.",
      "Increment the counter for every match.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] responses = {2, 5, 2, 8, 2, 9};
        int target = 2;
        // Count and print the target frequency
    }
}`,
  },
  {
    id: 63,
    title: "Merge Two Arrays",
    topic: "Arrays",
    difficulty: "Hard",
    topics: ["Arrays", "Copying"],
    description:
      "Two short attendance lists are stored as `morning = {1, 3, 5}` and `evening = {2, 4}`. Merge them into one new array and print all IDs in order.",
    note1:
      "Create a merged array large enough to hold both source arrays.",
    note2:
      "Copy the first array, then continue copying the second array from the next open position.",
    examples: [
      {
        label: "Example 1",
        input: "morning = {1, 3, 5}, evening = {2, 4}",
        output: "1 3 5 2 4",
        explanation:
          "The merged array keeps all morning IDs first, followed by evening IDs.",
      },
    ],
    constraints: [
      "Do not use collection classes.",
      "Print values with single spaces and no trailing space.",
    ],
    followUp:
      "Can you merge two sorted arrays so the final array is also sorted?",
    beginnerTips: [
      "The merged length is `morning.length + evening.length`.",
      "A separate index variable can track where to write next.",
      "Array merging is mostly careful index management.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] morning = {1, 3, 5};
        int[] evening = {2, 4};
        // Merge both arrays and print the result
    }
}`,
  },
  {
    id: 64,
    title: "Sort Array in Ascending Order",
    topic: "Arrays",
    difficulty: "Hard",
    topics: ["Arrays", "Sorting"],
    description:
      "A results board stores unsorted race positions as `positions = {5, 1, 4, 2, 3}`. Sort the array in ascending order using loops and print the sorted positions.",
    note1:
      "Use a beginner-friendly sorting method such as bubble sort or selection sort.",
    note2:
      "Whenever two values are out of order, swap them using a temporary variable.",
    examples: [
      {
        label: "Example 1",
        input: "positions = {5, 1, 4, 2, 3}",
        output: "1 2 3 4 5",
        explanation:
          "After sorting, the positions are printed from smallest to largest.",
      },
    ],
    constraints: [
      "Do not use `Arrays.sort`.",
      "Print values with single spaces and no trailing space.",
    ],
    followUp:
      "Can you sort the same array in descending order?",
    beginnerTips: [
      "Sorting often needs nested loops for beginner algorithms.",
      "Use a temporary variable when swapping two array elements.",
      "Print only after all swaps are complete.",
    ],
    starterCode: `public class Main {
    public static void main(String[] args) {
        int[] positions = {5, 1, 4, 2, 3};
        // Sort in ascending order and print the sorted values
    }
}`,
  },
];

// ─── expectedOutput normalization ──────────────────────────────────
// Surface each problem's first example output as a top-level
// `expectedOutput` field so the Practice page's Submit checker has a
// single, canonical source of truth to compare against. Using the
// existing examples data keeps the catalog DRY — there's no chance of
// the displayed example drifting away from what the checker validates.
problems.forEach((problem) => {
  if (problem.expectedOutput === undefined) {
    const firstOutput = problem.examples?.[0]?.output ?? "";
    problem.expectedOutput = firstOutput;
  }
});

// Helper: return problems grouped by topic in a fixed order.
// Used by the Dashboard to render topic sections.
export const TOPIC_ORDER = ["Java Basics", "Conditions", "Loops", "Arrays"];

export function problemsByTopic() {
  const grouped = {};
  for (const topic of TOPIC_ORDER) {
    grouped[topic] = problems.filter((p) => p.topic === topic);
  }
  return grouped;
}

export function getProblemById(id) {
  return problems.find((p) => p.id === id) || problems[0];
}
