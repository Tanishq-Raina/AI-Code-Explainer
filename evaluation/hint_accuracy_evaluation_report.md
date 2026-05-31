# Hint Accuracy Evaluation Report

## Evaluation Methodology

The hint accuracy evaluation assesses the quality of AI-generated hints for 30 Java code samples containing various error types. Each code sample is submitted to the backend API, and the returned hints are evaluated across four metrics combined into a weighted overall score.

## Metric Definitions

| Metric | Weight | Range | Formula / Calculation | Description |
|--------|--------|-------|----------------------|-------------|
| **Relevance** | 0.40 | 0.0 – 1.0 | `matched_keywords / total_expected_keywords` | Measures whether the hints address the actual error by checking what fraction of predefined expected keywords appear in the combined hint text. |
| **Completeness** | 0.25 | 0.0 – 1.0 | `present_fields / 4` | Measures structural completeness by checking how many of the four expected fields (`problem_summary`, `why`, `hint_1`, `learning_tip`) are present and non-empty. |
| **Specificity** | 0.25 | 0.3 or 1.0 | Binary check against generic fallback phrases | Penalizes generic/vague hints. If the hint contains phrases like *"there is an issue in your code"* or *"carefully read the error message"*, specificity is 0.3; otherwise 1.0. |
| **No-Solution Policy** | 0.10 | 0.0 or 1.0 | Binary check for solution indicators | Ensures hints guide learning without giving away answers. If hints contain full code solutions (e.g., `public class`, `here is the corrected`), score is 0.0; otherwise 1.0. |
| **Overall Score** | — | 0.0 – 1.0 | `(relevance × 0.4) + (completeness × 0.25) + (specificity × 0.25) + (no_solution × 0.1)` | Weighted composite score reflecting overall hint quality. |

## Overall Results

| Metric | Value |
|--------|-------|
| Total Samples | 30 |
| Overall Accuracy Score | 0.8911 (89.11%) |
| Average Relevance | 0.8278 |
| Average Completeness | 0.9333 |
| Average Specificity | 0.9333 |
| No-Solution Policy Compliance | 1.0000 |

## Per-Category Results

| Error Category | Avg Score | Samples | Description |
|---------------|-----------|---------|-------------|
| SyntaxError | 0.9486 | 6 | Missing semicolons, braces, parentheses, return types, invalid loop syntax |
| TypeError | 0.8067 | 5 | Incompatible types, String comparison with ==, primitive method calls, void assignment, generic mismatch |
| SymbolError | 0.9200 | 2 | Undeclared variables, misspelled method names |
| NullPointerException | 0.9000 | 1 | Calling methods on null references |
| ArrayIndexOutOfBounds | 0.9200 | 1 | Accessing indices beyond array length |
| StackOverflow | 1.0000 | 1 | Infinite recursion without base case |
| ArithmeticException | 0.9000 | 1 | Division by zero |
| ClassCastException | 1.0000 | 1 | Invalid type casting |
| StringIndexOutOfBounds | 0.9200 | 1 | charAt with invalid index |
| NumberFormatException | 1.0000 | 1 | Parsing non-numeric strings |
| ConcurrentModification | 0.0000 | 1 | Modifying list during iteration |
| InputMismatch | 0.9200 | 1 | Scanner reading wrong type |
| NegativeArraySize | 1.0000 | 1 | Creating array with negative size |
| LogicError | 0.9777 | 3 | Off-by-one errors, assignment vs comparison, infinite loops |
| ScopeError | 1.0000 | 1 | Variable scope violations |
| AccessError | 0.9200 | 1 | Private member access violations |

## Per-Sample Detailed Results

| # | Category | Description | Score | Relevance | Completeness | Specificity | No-Solution | Execution Status |
|---|----------|-------------|-------|-----------|--------------|-------------|-------------|-----------------|
| 1 | SyntaxError | Missing semicolon | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 2 | SyntaxError | Unclosed string literal | 0.900 | 0.750 | 1.000 | 1.000 | 1.000 | CompilationError |
| 3 | SyntaxError | Missing closing brace | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 4 | TypeError | Incompatible types - String to int | 0.920 | 0.800 | 1.000 | 1.000 | 1.000 | CompilationError |
| 5 | TypeError | Cannot compare String with == | 0.000 | 0.000 | 0.000 | 0.000 | 1.000 | Success |
| 6 | SymbolError | Undeclared variable | 0.840 | 0.600 | 1.000 | 1.000 | 1.000 | CompilationError |
| 7 | SymbolError | Misspelled method name | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 8 | SyntaxError | Missing return type on method | 0.900 | 0.750 | 1.000 | 1.000 | 1.000 | CompilationError |
| 9 | TypeError | Array type mismatch | 0.920 | 0.800 | 1.000 | 1.000 | 1.000 | CompilationError |
| 10 | SyntaxError | Invalid for loop syntax | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 11 | NullPointerException | Calling method on null | 0.900 | 0.750 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 12 | ArrayIndexOutOfBounds | Accessing index beyond array length | 0.920 | 0.800 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 13 | StackOverflow | Infinite recursion | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 14 | ArithmeticException | Division by zero | 0.900 | 0.750 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 15 | ClassCastException | Invalid type cast | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 16 | StringIndexOutOfBounds | charAt with invalid index | 0.920 | 0.800 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 17 | NumberFormatException | Parsing non-numeric string | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 18 | ConcurrentModification | Modifying list during iteration | 0.000 | 0.000 | 0.000 | 0.000 | 1.000 | Success |
| 19 | InputMismatch | Scanner reading wrong type | 0.920 | 0.800 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 20 | NegativeArraySize | Creating array with negative size | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 21 | LogicError | Off-by-one in loop | 0.933 | 0.833 | 1.000 | 1.000 | 1.000 | RuntimeError |
| 22 | LogicError | Using = instead of == in condition | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 23 | ScopeError | Variable declared inside if block used outside | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 24 | TypeError | Comparing int with String using equals() | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 25 | SyntaxError | Missing parentheses in if statement | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 26 | LogicError | Infinite while loop - missing increment | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | Timeout |
| 27 | TypeError | Void method used in expression | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |
| 28 | AccessError | Accessing private member from another context | 0.920 | 0.800 | 1.000 | 1.000 | 1.000 | CompilationError |
| 29 | SyntaxError | Static method calling non-static method | 0.840 | 0.600 | 1.000 | 1.000 | 1.000 | CompilationError |
| 30 | TypeError | Generic type mismatch in ArrayList | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | CompilationError |

## Observations

1. **Two samples scored 0.0** (samples #5 and #18) because the backend classified them as `Success` (no error detected), so no hints were generated. These represent edge cases where the code compiles and runs without throwing an exception despite containing logical issues (String comparison with `==` and ConcurrentModificationException that may not always trigger).

2. **No-Solution Policy achieved 100% compliance** — the system never leaked full solutions in hints, maintaining its pedagogical approach.

3. **Completeness was high (93.33%)** — most responses included all four expected structural fields.

4. **Relevance was the weakest metric (82.78%)** — some hints used alternative terminology rather than the exact expected keywords, which is acceptable pedagogically but lowers the keyword-match score.

## Evaluation Configuration

| Parameter | Value |
|-----------|-------|
| API Endpoint | `http://localhost:5000/api/submit-code` |
| Request Timeout | 120 seconds |
| Inter-request Delay | 3 seconds |
| Dataset Size | 30 Java code samples |
| Error Categories | 16 distinct categories |
| Evaluation Date | 2026-05-18 |

## Per-Sample Hints and Average Scores

This table shows each Java code sample, the three progressive hints generated by the AI, and the overall average score for that sample.

| # | Category | Code | Hint 1 | Hint 2 | Hint 3 | Avg Score |
|---|----------|------|--------|--------|--------|-----------|
| 1 | SyntaxError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int x = 10<br>        System.out.println(x);<br>    }<br>}</code></pre> | Look closely at line 3 where you declare the variable x. | Every statement in Java needs to end with a specific punctuation mark to tell the compiler the statement is complete. | Add a semicolon at the end of the line: int x = 10; | 1.000 |
| 2 | SyntaxError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        String msg = "Hello World;<br>        System.out.println(msg);<br>    }<br>}</code></pre> | Look closely at the line where the string is defined and check both ends of the text. | Every opening quotation mark needs a corresponding closing quotation mark for string literals. | The string should have quotes at both the beginning and end: "Hello World" | 0.900 |
| 3 | SyntaxError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        for (int i = 0; i < 5; i++) {<br>            System.out.println(i);<br>    }<br>}</code></pre> | Look at the structure of your for loop and check if all opening braces have matching closing braces. | Count the number of opening braces '{' and make sure there are equal number of closing braces '}' in your code. | Add a closing brace after the System.out.println statement to close the for loop block: } | 1.000 |
| 4 | TypeError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int number = "hello";<br>        System.out.println(number);<br>    }<br>}</code></pre> | Look at the data type of your variable and compare it to the value you're trying to assign. | Consider what data type would be appropriate for storing text versus numbers. | Try changing the variable type to match the value, like: String number = "hello"; | 0.920 |
| 5 | TypeError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        String a = new String("hello");<br>        String b = new String("hello");<br>        if (a == b) {<br>            System.out.println("Equal");<br>        } else {<br>            System.out.println("Not Equal");<br>        }<br>    }<br>}</code></pre> | — | — | — | 0.000 |
| 6 | SymbolError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        System.out.println(result);<br>        int result = 42;<br>    }<br>}</code></pre> | Look at the order of your statements in the main method. | Try moving the variable declaration before the print statement so the variable exists when you try to use it. | Move the line 'int result = 42;' to appear before 'System.out.println(result);' | 0.840 |
| 7 | SymbolError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        String text = "Hello";<br>        System.out.println(text.lenght());<br>    }<br>}</code></pre> | Look closely at the method name you're trying to call on the String variable. | Check the spelling of the method that returns the number of characters in a string. | The correct method name is 'length()' - try calling text.length() instead. | 1.000 |
| 8 | SyntaxError | <pre><code>public class Main {<br>    public static main(String[] args) {<br>        System.out.println("Hello");<br>    }<br>}</code></pre> | Add the return type before the method name | The main method should return nothing, so use a specific keyword for that | — | 0.900 |
| 9 | TypeError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int[] numbers = {1, 2, "three", 4, 5};<br>        System.out.println(numbers[2]);<br>    }<br>}</code></pre> | Look at the data types in your array initialization - do they all match the array's declared type? | Consider what happens when you try to put a text value into a container that only accepts numbers. | Either change "three" to its numeric value 3, or declare a different array type that can hold both numbers and text. | 0.920 |
| 10 | SyntaxError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        for (int i = 0, i < 10, i++) {<br>            System.out.println(i);<br>        }<br>    }<br>}</code></pre> | Look at the for loop syntax on line 3 - something is wrong with the punctuation between the three parts. | The for loop needs semicolons (;) to separate the initialization, condition, and increment expressions, not commas (,). | Change the commas to semicolons: for (int i = 0; i < 10; i++) | 1.000 |
| 11 | NullPointerException | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        String text = null;<br>        System.out.println(text.length());<br>    }<br>}</code></pre> | Look at what value the 'text' variable holds when you try to use it. | You need to ensure the String variable has an actual value before calling methods on it. | Try assigning a string value like "hello" to text instead of null: String text = "hello"; | 0.900 |
| 12 | ArrayIndexOutOfBounds | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int[] arr = {1, 2, 3};<br>        System.out.println(arr[5]);<br>    }<br>}</code></pre> | Check the size of your array and compare it with the index you're trying to access. | Remember that array indices start at 0 and go up to the length of the array minus one. | Use arr.length to check the actual size of your array before accessing an index. | 0.920 |
| 13 | StackOverflow | <pre><code>public class Main {<br>    public static int factorial(int n) {<br>        return n * factorial(n - 1);<br>    }<br>    public static void main(String[] args) {<br>        System.out.println(factorial(5));<br>    }<br>}</code></pre> | Look at the factorial method and think about when the recursion should stop. | Consider what the smallest input value for factorial should return, and add a condition to handle it. | Add a base case like: if (n <= 1) return 1; | 1.000 |
| 14 | ArithmeticException | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int a = 10;<br>        int b = 0;<br>        System.out.println(a / b);<br>    }<br>}</code></pre> | Look at the values of your variables when performing mathematical operations. | Check what value you're using as the denominator in your division operation and make sure it's not zero. | Before dividing, add a condition to check if the divisor equals zero, for example: `if (b != 0) { System.out.println(a / b); }` | 0.900 |
| 15 | ClassCastException | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        Object obj = "Hello";<br>        Integer num = (Integer) obj;<br>        System.out.println(num);<br>    }<br>}</code></pre> | Look at what type of object is stored in the 'obj' variable and compare it to what you're trying to cast it to. | You need to ensure that the object you're casting actually represents the type you're casting to, or use a different approach to convert between types. | If you need to convert a String to an Integer, you should use methods like Integer.parseInt() instead of casting. For example: Integer num = Integer.parseInt(obj.toString()); | 1.000 |
| 16 | StringIndexOutOfBounds | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        String word = "Java";<br>        char c = word.charAt(10);<br>        System.out.println(c);<br>    }<br>}</code></pre> | Check the length of the string and compare it to the index you're trying to access. | Remember that string indices start at 0 and go up to the length of the string minus one. | Use `word.length()` to check how many characters are in the string before accessing a specific index. | 0.920 |
| 17 | NumberFormatException | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        String value = "abc123";<br>        int num = Integer.parseInt(value);<br>        System.out.println(num);<br>    }<br>}</code></pre> | Look at the value you're trying to convert on line 4. | Check what characters are allowed when using Integer.parseInt() method. | Try parsing a string like "123" instead of "abc123" to see the difference. | 1.000 |
| 18 | ConcurrentModification | <pre><code>import java.util.ArrayList;<br>public class Main {<br>    public static void main(String[] args) {<br>        ArrayList<String> list = new ArrayList<>();<br>        list.add("a");<br>        list.add("b");<br>        list.add("c");<br>        for (String s : list) {<br>            if (s.equals("b")) {<br>                list.remove(s);<br>            }<br>        }<br>        System.out.println(list);<br>    }<br>}</code></pre> | — | — | — | 0.000 |
| 19 | InputMismatch | <pre><code>import java.util.Scanner;<br>public class Main {<br>    public static void main(String[] args) {<br>        Scanner sc = new Scanner("hello");<br>        int num = sc.nextInt();<br>        System.out.println(num);<br>    }<br>}</code></pre> | Look at how you're creating the Scanner object and what input source you're providing. | The Scanner constructor should typically use System.in for keyboard input, not a literal string. | Try changing Scanner sc = new Scanner("hello"); to Scanner sc = new Scanner(System.in); | 0.920 |
| 20 | NegativeArraySize | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int[] arr = new int[-5];<br>        System.out.println(arr.length);<br>    }<br>}</code></pre> | Look at the array creation statement and think about what values are valid for array sizes. | Array sizes must always be zero or positive integers since they represent how many elements the array can hold. | Change the negative number to a positive number or zero: `int[] arr = new int[5];` | 1.000 |
| 21 | LogicError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int[] arr = {10, 20, 30, 40, 50};<br>        for (int i = 0; i <= arr.length; i++) {<br>            System.out.println(arr[i]);<br>        }<br>    }<br>}</code></pre> | Check the condition in your for loop - when does it stop? | Think about the relationship between array length and the last valid index. | The loop should run while i < arr.length, not i <= arr.length. | 0.933 |
| 22 | LogicError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int x = 5;<br>        if (x = 10) {<br>            System.out.println("Ten");<br>        }<br>    }<br>}</code></pre> | Look at the condition inside the parentheses of your if statement on line 4. | Think about the difference between assigning a value to a variable and comparing two values for equality. | Replace the single equals sign with double equals signs to perform comparison: if (x == 10) | 1.000 |
| 23 | ScopeError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int x = 10;<br>        if (x > 5) {<br>            int result = x * 2;<br>        }<br>        System.out.println(result);<br>    }<br>}</code></pre> | Look at where you declared the 'result' variable and where you're trying to use it. | The variable 'result' is declared inside the if block, but you're trying to use it outside that block where it's no longer accessible. | Declare the variable before the if statement like this: `int result;` then assign and use it inside the if block. | 1.000 |
| 24 | TypeError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int num = 5;<br>        if (num.equals(5)) {<br>            System.out.println("Five");<br>        }<br>    }<br>}</code></pre> | Look at the type of variable 'num' and think about whether it's an object or a primitive. | For comparing primitive values like int, you should use the == operator instead of equals(). | Change the condition to use == for comparison: if (num == 5) | 1.000 |
| 25 | SyntaxError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int x = 10;<br>        if x > 5 {<br>            System.out.println("Big");<br>        }<br>    }<br>}</code></pre> | Look at line 4 where the if statement is written. | The condition 'x > 5' needs to be wrapped in parentheses to be valid syntax. | Try writing the if statement like: if (x > 5) { | 1.000 |
| 26 | LogicError | <pre><code>public class Main {<br>    public static void main(String[] args) {<br>        int i = 0;<br>        while (i < 10) {<br>            System.out.println(i);<br>        }<br>    }<br>}</code></pre> | Look at your while loop and think about how the variable 'i' changes during execution. | The loop needs a statement that modifies the loop control variable so that the condition eventually becomes false. | Add a line inside the loop body to increment 'i', such as: i++; | 1.000 |
| 27 | TypeError | <pre><code>public class Main {<br>    public static void greet() {<br>        System.out.println("Hello");<br>    }<br>    public static void main(String[] args) {<br>        String result = greet();<br>        System.out.println(result);<br>    }<br>}</code></pre> | Look at the return type of your greet() method and compare it with how you're trying to use it. | Either change the greet() method to return a String value, or don't try to store its result in a variable. | You could modify greet() to return a String like this: public static String greet() { return "Hello"; } | 1.000 |
| 28 | AccessError | <pre><code>class Animal {<br>    private String name = "Dog";<br>}<br>public class Main {<br>    public static void main(String[] args) {<br>        Animal a = new Animal();<br>        System.out.println(a.name);<br>    }<br>}</code></pre> | Look at the access modifier of the 'name' field in the Animal class. | Consider providing a public method in the Animal class that returns the value of the private field. | Create a public getter method like 'public String getName() { return name; }' in the Animal class and call it from main. | 0.920 |
| 29 | SyntaxError | <pre><code>public class Main {<br>    public void display() {<br>        System.out.println("Hello");<br>    }<br>    public static void main(String[] args) {<br>        display();<br>    }<br>}</code></pre> | Look at the relationship between your main method and the display method. | Consider how you can make the display method accessible from the static main method. | You could either make display() static or create an instance of the class to call display(). | 0.840 |
| 30 | TypeError | <pre><code>import java.util.ArrayList;<br>public class Main {<br>    public static void main(String[] args) {<br>        ArrayList<Integer> numbers = new ArrayList<>();<br>        numbers.add(1);<br>        numbers.add(2);<br>        numbers.add("three");<br>        System.out.println(numbers);<br>    }<br>}</code></pre> | Look at the declaration of your ArrayList and compare it with what you're trying to add. | Either change the ArrayList to accept Strings instead of Integers, or add an actual integer value instead of the string "three". | You could declare: ArrayList<String> numbers = new ArrayList<>(); OR numbers.add(3); | 1.000 |
