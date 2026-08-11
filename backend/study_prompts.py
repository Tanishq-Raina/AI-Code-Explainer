"""Study content prompts and fallback chapter definitions."""

from __future__ import annotations

from study_curated_content import (
    CURATED_CHAPTER_IDS,
    CURATED_FALLBACK_CONTENT,
    is_placeholder_study_content,
)

STUDY_SYSTEM_PROMPT = (
    "You are a Java instructor writing structured study material for beginners. "
    "Generate content for each section in the exact JSON schema provided. "
    "All code examples must be valid Java SE 17 that compiles and runs. "
    "Do not include markdown fences in code_example values."
)

FALLBACK_CONTENT = {
    "ch01": {
        "chapter_id": "ch01",
        "title": "The History and Evolution of Java",
        "sections": [
            {
                "heading": "Java's Lineage",
                "content": (
                    "Java is a direct descendant of C and C++. It inherits C's syntax "
                    "- curly braces, semicolons, and most operators - while borrowing "
                    "C++'s object-oriented concepts such as classes, inheritance, and "
                    "encapsulation. Understanding this lineage helps explain why Java "
                    "looks familiar to C/C++ programmers yet behaves differently in "
                    "critical areas like memory management."
                ),
                "code_example": (
                    "public class Hello {\n"
                    "    public static void main(String[] args) {\n"
                    "        System.out.println(\"Hello, Java!\");\n"
                    "        // Java inherits C-style syntax\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "The Birth of Modern Programming: C",
                "content": (
                    "C was created by Dennis Ritchie in the early 1970s as a structured, "
                    "efficient language for systems programming. It resolved the tension "
                    "between ease of use and raw performance that had plagued earlier "
                    "languages like FORTRAN and BASIC. C introduced structured programming "
                    "using functions and control flow rather than GOTO, and became the "
                    "dominant language of the 1970s and 1980s."
                ),
                "code_example": (
                    "// C-style for loop - inherited unchanged by Java\n"
                    "public class CStyleLoop {\n"
                    "    public static void main(String[] args) {\n"
                    "        for (int i = 0; i < 5; i++) {\n"
                    "            System.out.println(\"Count: \" + i);\n"
                    "        }\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "C++: The Next Step",
                "content": (
                    "C++ was invented by Bjarne Stroustrup in 1979 to address the growing "
                    "complexity of large programs by adding object-oriented features to C. "
                    "It introduced classes, inheritance, and polymorphism. Although C++ "
                    "succeeded at managing complexity, it retained C's low-level memory "
                    "management, which remained a source of hard-to-find bugs and inspired "
                    "Java's safer approach."
                ),
                "code_example": (
                    "// Java's class syntax evolved from C++\n"
                    "public class Car {\n"
                    "    String model;\n"
                    "    Car(String m) { this.model = m; }\n"
                    "    void display() { System.out.println(\"Model: \" + model); }\n"
                    "    public static void main(String[] args) {\n"
                    "        Car c = new Car(\"Tesla Model 3\");\n"
                    "        c.display();\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "The Creation of Java",
                "content": (
                    "Java was created in the early 1990s by James Gosling and colleagues at "
                    "Sun Microsystems, initially called Oak. The project was driven by the "
                    "need for a platform-independent language for consumer electronics. "
                    "When the World Wide Web emerged, Java's 'write once, run anywhere' "
                    "capability made it an ideal language for internet programming."
                ),
                "code_example": (
                    "// Java detects the platform it is running on at runtime\n"
                    "public class PlatformDemo {\n"
                    "    public static void main(String[] args) {\n"
                    "        System.out.println(\"OS: \" +\n"
                    "            System.getProperty(\"os.name\"));\n"
                    "        System.out.println(\"JVM: \" +\n"
                    "            System.getProperty(\"java.vm.name\"));\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Java's Magic: The Bytecode",
                "content": (
                    "Java achieves platform independence through an intermediate binary "
                    "format called bytecode. When you compile a Java source file with "
                    "javac, the output is a .class file containing bytecode - not native "
                    "machine code. The Java Virtual Machine on each target platform "
                    "translates this bytecode into native instructions at runtime, shielding "
                    "the program from hardware and OS differences."
                ),
                "code_example": (
                    "// The bytecode pipeline in practice:\n"
                    "// .java source -> javac -> .class bytecode -> JVM -> native code\n"
                    "public class BytecodeDemo {\n"
                    "    public static void main(String[] args) {\n"
                    "        int x = 10, y = 20;\n"
                    "        int sum = x + y;\n"
                    "        System.out.println(\"Sum = \" + sum); // prints 30\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "The Java Buzzwords",
                "content": (
                    "The Java team described their language with eleven design goals: "
                    "Simple, Object-Oriented, Robust, Multithreaded, Architecture-Neutral, "
                    "Interpreted, High Performance, Distributed, Dynamic, Secure, and "
                    "Portable. Of these, Secure and Portable were most critical for internet "
                    "programming. Robustness is achieved through strict typing, automatic "
                    "garbage collection, and strong exception handling that prevent the most "
                    "common categories of bugs."
                ),
                "code_example": (
                    "// Robustness: Java catches common runtime errors\n"
                    "public class RobustDemo {\n"
                    "    public static void main(String[] args) {\n"
                    "        String s = null;\n"
                    "        try {\n"
                    "            System.out.println(s.length());\n"
                    "        } catch (NullPointerException e) {\n"
                    "            System.out.println(\"Caught safely: \" + e);\n"
                    "        }\n"
                    "        // Garbage collection: no manual memory management\n"
                    "        int[] arr = new int[1000]; // JVM will GC this\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "The Evolution of Java",
                "content": (
                    "Java has grown through many major releases since 1.0 (1996). Key "
                    "milestones include Java 2 (Collections, Swing), Java 5 (generics, "
                    "autoboxing, enums, varargs), Java 8 (lambda expressions, Stream API), "
                    "Java 9 (modules/JPMS), Java 10 (var), and Java 17 (sealed classes, "
                    "records, text blocks). Since Java 11, Oracle releases a new version "
                    "every six months, with Long-Term Support (LTS) releases every three "
                    "years."
                ),
                "code_example": (
                    "// Java version features across the years\n"
                    "public class VersionFeatures {\n"
                    "    public static void main(String[] args) {\n"
                    "        // Java 5: enhanced for-each loop\n"
                    "        int[] nums = {1, 2, 3, 4, 5};\n"
                    "        for (int n : nums) System.out.print(n + \" \" );\n"
                    "        System.out.println();\n"
                    "\n"
                    "        // Java 10: var keyword\n"
                    "        var message = \"Java continues to evolve!\";\n"
                    "        System.out.println(message);\n"
                    "    }\n"
                    "}"
                ),
            },
        ],
    },
    "ch02": {
        "chapter_id": "ch02",
        "title": "An Overview of Java",
        "sections": [
            {
                "heading": "Two Paradigms: Process vs. Object",
                "content": (
                    "Every program can be organized around code (process-oriented) or around "
                    "data (object-oriented). Process-oriented programs, like those written "
                    "in C, are a series of steps acting on data. Object-oriented programs "
                    "flip this - data (objects) control access to code (methods). Java is "
                    "fully object-oriented: every piece of executable code lives inside a "
                    "class."
                ),
                "code_example": (
                    "// Process-oriented approach (functions)\n"
                    "// vs. OOP approach (objects)\n"
                    "public class Dog {\n"
                    "    String name;\n"
                    "    void bark() {\n"
                    "        System.out.println(name + \" says: Woof!\");\n"
                    "    }\n"
                    "    public static void main(String[] args) {\n"
                    "        Dog d = new Dog();\n"
                    "        d.name = \"Rex\";\n"
                    "        d.bark();\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Encapsulation",
                "content": (
                    "Encapsulation bundles data and the methods that operate on it into a "
                    "single unit (a class), and restricts direct access to the data from "
                    "outside. In Java, you declare instance variables private and expose "
                    "them through public getter/setter methods. This protects internal "
                    "state from accidental corruption and allows you to change the "
                    "implementation without affecting callers."
                ),
                "code_example": (
                    "public class BankAccount {\n"
                    "    private double balance;\n"
                    "    public void deposit(double amt) {\n"
                    "        if (amt > 0) balance += amt;\n"
                    "    }\n"
                    "    public double getBalance() { return balance; }\n"
                    "    public static void main(String[] args) {\n"
                    "        BankAccount a = new BankAccount();\n"
                    "        a.deposit(500);\n"
                    "        System.out.println(a.getBalance());\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Inheritance",
                "content": (
                    "Inheritance lets one class (the subclass) acquire all fields and "
                    "methods of another class (the superclass). This promotes code reuse "
                    "and models 'is-a' relationships. In Java, inheritance is declared with "
                    "the extends keyword. A subclass can override methods of its superclass "
                    "to provide specialised behaviour."
                ),
                "code_example": (
                    "class Animal {\n"
                    "    void speak() { System.out.println(\"...\"); }\n"
                    "}\n"
                    "class Cat extends Animal {\n"
                    "    @Override\n"
                    "    void speak() { System.out.println(\"Meow\"); }\n"
                    "}\n"
                    "public class InheritDemo {\n"
                    "    public static void main(String[] args) {\n"
                    "        Animal a = new Cat();\n"
                    "        a.speak(); // Meow\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Polymorphism",
                "content": (
                    "Polymorphism means 'many forms'. In Java, a reference variable of a "
                    "superclass type can hold an object of any subclass type. The correct "
                    "method is selected at runtime based on the actual object's type - this "
                    "is called dynamic dispatch. Polymorphism makes it easy to write code "
                    "that works with objects of many types through a common interface."
                ),
                "code_example": (
                    "class Shape {\n"
                    "    double area() { return 0; }\n"
                    "}\n"
                    "class Circle extends Shape {\n"
                    "    double r;\n"
                    "    Circle(double r) { this.r = r; }\n"
                    "    double area() { return Math.PI * r * r; }\n"
                    "}\n"
                    "public class Poly {\n"
                    "    public static void main(String[] args) {\n"
                    "        Shape s = new Circle(5);\n"
                    "        System.out.println(s.area());\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Your First Java Program",
                "content": (
                    "Every Java application must have a class containing a main method - "
                    "the program's entry point. The class name must match the filename. The "
                    "main method signature is always public static void main(String[] args). "
                    "System.out.println() prints a line to the console followed by a newline "
                    "character."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        System.out.println(\"Welcome to Java!\");\n"
                    "        System.out.println(\"Learning is fun.\");\n"
                    "    }\n"
                    "}"
                ),
            },
        ],
    },
    "ch03": {
        "chapter_id": "ch03",
        "title": "Data Types, Variables, and Arrays",
        "sections": [
            {
                "heading": "Primitive Types Overview",
                "content": (
                    "Java defines eight primitive types: byte, short, int, long, float, "
                    "double, char, and boolean. These are not objects - they are raw "
                    "numeric, character, or logical values stored directly in memory. Java "
                    "is a strongly typed language, meaning every variable must be declared "
                    "with a specific type and the compiler enforces type compatibility at "
                    "compile time."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        byte  b = 100;\n"
                    "        short s = 30000;\n"
                    "        int   i = 2_000_000;\n"
                    "        long  l = 9_000_000_000L;\n"
                    "        float f = 3.14f;\n"
                    "        double d = 3.141592653589793;\n"
                    "        char  c = 'A';\n"
                    "        boolean flag = true;\n"
                    "        System.out.println(i + \" \" + d + \" \" + c);\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Integer Types",
                "content": (
                    "Java has four integer types: byte (8 bits, -128 to 127), short (16 bits), "
                    "int (32 bits, the default), and long (64 bits). Integer literals are int "
                    "by default; append L for long. Java 7+ allows underscores in numeric "
                    "literals (e.g., 1_000_000) to improve readability. Overflow wraps around - "
                    "Java does not throw an exception for integer overflow."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        int max = Integer.MAX_VALUE;\n"
                    "        System.out.println(\"Max int: \" + max);\n"
                    "        System.out.println(\"Overflow: \" + (max + 1));\n"
                    "        long bigNum = 10_000_000_000L;\n"
                    "        System.out.println(\"Big: \" + bigNum);\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Floating-Point Types",
                "content": (
                    "float uses 32 bits (single precision, ~7 decimal digits) and double uses "
                    "64 bits (double precision, ~15 digits). Always prefer double unless memory "
                    "is a concern. Floating-point literals are double by default; append f or F "
                    "to make a float. Be aware that floating-point arithmetic is not exact due "
                    "to binary representation - never use == to compare doubles."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        double pi = 3.141592653589793;\n"
                    "        float piF = 3.14159f;\n"
                    "        double circle = 2 * pi * 5;\n"
                    "        System.out.println(\"Circumference: \" + circle);\n"
                    "        // Comparing doubles safely\n"
                    "        double a = 0.1 + 0.2;\n"
                    "        System.out.println(Math.abs(a - 0.3) < 1e-9);\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Characters and Booleans",
                "content": (
                    "char stores a single Unicode character in 16 bits, which means it can "
                    "represent any character from the Basic Multilingual Plane (BMP). Character "
                    "literals use single quotes: 'A'. boolean stores true or false and is not "
                    "interchangeable with int (unlike in C). Booleans are used exclusively in "
                    "conditional expressions."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        char letter = 'J';\n"
                    "        char unicode = '\\u0041'; // 'A'\n"
                    "        System.out.println(letter + \" \" + unicode);\n"
                    "        boolean isJavaFun = true;\n"
                    "        if (isJavaFun) System.out.println(\"Absolutely!\");\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Variables and Scope",
                "content": (
                    "Variables must be declared before use. Local variables (declared inside a "
                    "method) must also be initialised before reading. Java's scoping rules "
                    "follow block-level rules: a variable declared inside braces {} is not "
                    "accessible outside them. Variable shadowing - declaring a variable with "
                    "the same name in an inner block - is allowed but discouraged."
                ),
                "code_example": (
                    "public class ScopeDemo {\n"
                    "    static int x = 10; // class-level\n"
                    "    public static void main(String[] args) {\n"
                    "        int y = 20; // method-level\n"
                    "        {\n"
                    "            int z = 30; // block-level\n"
                    "            System.out.println(x + y + z);\n"
                    "        }\n"
                    "        // z is not accessible here\n"
                    "        System.out.println(x + y);\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Type Conversion and Casting",
                "content": (
                    "Java automatically widens a value to a larger type (e.g., int to long). "
                    "Narrowing - assigning a larger type to a smaller one - requires an "
                    "explicit cast, which may lose data. Casting syntax: (targetType) value. "
                    "Integer-to-integer casts truncate; double-to-int casts discard the "
                    "fractional part (not round)."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        int i = 300;\n"
                    "        byte b = (byte) i; // truncates - may lose data\n"
                    "        System.out.println(b); // -44 (overflow)\n"
                    "        double d = 9.99;\n"
                    "        int truncated = (int) d;\n"
                    "        System.out.println(truncated); // 9\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Arrays",
                "content": (
                    "An array stores a fixed number of elements of the same type in contiguous "
                    "memory. Declare with type[], allocate with new type[length], and access "
                    "with zero-based indices. Java arrays are objects: they have a .length "
                    "field, are bounds-checked at runtime, and throw ArrayIndexOutOfBoundsException "
                    "on invalid access. Multi-dimensional arrays are arrays of arrays."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        int[] scores = new int[5];\n"
                    "        scores[0] = 95; scores[1] = 87;\n"
                    "        // Array initializer shorthand\n"
                    "        String[] days = {\"Mon\", \"Tue\", \"Wed\"};\n"
                    "        for (String day : days) {\n"
                    "            System.out.println(day);\n"
                    "        }\n"
                    "        System.out.println(\"Length: \" + days.length);\n"
                    "    }\n"
                    "}"
                ),
            },
            {
                "heading": "Local Variable Type Inference (var)",
                "content": (
                    "Introduced in Java 10, var lets the compiler infer the type of a local "
                    "variable from its initializer, eliminating redundant type declarations. "
                    "var can only be used for local variables (not fields, parameters, or "
                    "return types) and only when the initializer is present. It does not make "
                    "Java dynamically typed - the variable still has a fixed compile-time type."
                ),
                "code_example": (
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        // Without var\n"
                    "        java.util.ArrayList<String> list = new java.util.ArrayList<>();\n"
                    "        // With var (type inferred as ArrayList<String>)\n"
                    "        var list2 = new java.util.ArrayList<String>();\n"
                    "        list2.add(\"Java\");\n"
                    "        list2.add(\"is\");\n"
                    "        list2.add(\"great\");\n"
                    "        System.out.println(list2);\n"
                    "    }\n"
                    "}"
                ),
            },
        ],
    },
}

CHAPTER_TITLES = {
    "ch04": "Operators",
    "ch05": "Control Statements",
    "ch06": "Introducing Classes",
    "ch07": "A Closer Look at Methods and Classes",
    "ch08": "Inheritance",
    "ch09": "Packages and Interfaces",
    "ch10": "Exception Handling",
    "ch11": "Multithreaded Programming",
    "ch12": "Enumerations, Autoboxing, and Annotations",
    "ch13": "I/O, Try-with-Resources, and Other Topics",
    "ch14": "Generics",
    "ch15": "Lambda Expressions",
    "ch16": "Modules",
    "ch17": "Switch Expressions, Records, and Recently Added Features",
    "ch18": "String Handling",
    "ch19": "Exploring java.lang",
    "ch20": "java.util Part 1: The Collections Framework",
    "ch21": "java.util Part 2: More Utility Classes",
    "ch22": "Input/Output: Exploring java.io",
    "ch23": "Exploring NIO",
    "ch24": "Networking",
    "ch25": "Event Handling",
    "ch26": "Introducing the AWT: Windows, Graphics, and Text",
    "ch27": "Using AWT Controls, Layout Managers, and Menus",
    "ch28": "Images",
    "ch29": "The Concurrency Utilities",
    "ch30": "The Stream API",
    "ch31": "Regular Expressions and Other Packages",
}

CHAPTER_HEADINGS = {
    "ch04": [
        "Arithmetic Operators",
        "Bitwise Operators",
        "Relational Operators",
        "Boolean Logical Operators",
        "Assignment and Ternary",
        "Operator Precedence",
        "instanceof",
    ],
    "ch05": [
        "if/else",
        "switch",
        "for",
        "while",
        "do-while",
        "for-each",
        "break/continue/return",
    ],
    "ch06": [
        "Class Fundamentals",
        "Constructors",
        "this",
        "Object Creation",
        "Garbage Collection",
    ],
    "ch07": [
        "Method Overloading",
        "Parameter Passing (Pass-by-Value)",
        "Recursion",
        "Access Control",
        "static and final",
    ],
    "ch08": [
        "extends and super",
        "Method Overriding",
        "Abstract Classes",
        "final Classes and Methods",
        "The Object Class",
    ],
    "ch09": [
        "package and import",
        "Access Protection",
        "Interfaces and implements",
        "Default Methods",
        "Static Interface Methods",
    ],
    "ch10": [
        "try/catch/finally",
        "throw and throws",
        "Checked vs Unchecked",
        "Custom Exceptions",
        "try-with-resources",
    ],
    "ch11": [
        "Thread Class",
        "Runnable",
        "Synchronization",
        "wait/notify",
        "volatile",
    ],
    "ch12": [
        "enum Basics",
        "Enum Constructors and Methods",
        "Autoboxing and Unboxing",
        "Wrapper Classes",
        "Annotations",
    ],
    "ch13": [
        "try-with-resources",
        "Multi-catch",
        "final Variables",
        "instanceof Pattern Matching",
        "AutoCloseable",
    ],
    "ch14": [
        "Generic Classes",
        "Generic Methods",
        "Bounded Type Parameters",
        "Wildcards",
        "Type Erasure",
    ],
    "ch15": [
        "Functional Interfaces",
        "Lambda Syntax",
        "Method References",
        "Built-in Functional Interfaces",
        "Lambda with Collections",
    ],
    "ch16": [
        "module-info.java",
        "requires",
        "exports",
        "Module Path vs Classpath",
        "opens",
    ],
    "ch17": [
        "Switch Expressions",
        "Text Blocks",
        "Pattern Matching for instanceof",
        "Records",
        "Sealed Classes",
    ],
    "ch18": [
        "String Immutability",
        "Common String Methods",
        "StringBuilder",
        "StringBuffer",
        "String Comparisons",
    ],
    "ch19": [
        "The Object Class",
        "Math",
        "System and Runtime",
        "Wrapper Classes",
        "Comparable and Cloneable",
    ],
    "ch20": [
        "Collection Hierarchy",
        "List Implementations",
        "Set Implementations",
        "Map Implementations",
        "Iteration and Utilities",
    ],
    "ch21": [
        "StringTokenizer",
        "Optional",
        "Date and Calendar",
        "Formatter",
        "Scanner",
    ],
    "ch22": [
        "Streams",
        "File",
        "BufferedReader and BufferedWriter",
        "PrintWriter",
        "Serialization",
    ],
    "ch23": [
        "Paths and Files",
        "Files Utilities",
        "Buffers",
        "Channels",
        "NIO.2 File Operations",
    ],
    "ch24": [
        "InetAddress",
        "Socket and ServerSocket",
        "URL and URI",
        "URLConnection",
        "HttpClient",
    ],
    "ch25": [
        "Delegation Event Model",
        "Event Sources and Listeners",
        "ActionEvent and ActionListener",
        "MouseEvent and KeyEvent",
        "Adapter Classes",
    ],
    "ch26": [
        "Components and Containers",
        "Frame",
        "Graphics, Color, Font",
        "Canvas and paint()",
        "Text Rendering",
    ],
    "ch27": [
        "AWT Controls",
        "Text Components",
        "Layout Managers",
        "Menus",
        "Dialogs",
    ],
    "ch28": [
        "Loading Images",
        "ImageObserver and MediaTracker",
        "BufferedImage",
        "ImageIO",
        "Image Transformations",
    ],
    "ch29": [
        "ExecutorService",
        "Callable and Future",
        "Locks",
        "Synchronizers",
        "Concurrent Collections",
    ],
    "ch30": [
        "Stream Creation",
        "Intermediate Operations",
        "Terminal Operations",
        "Collectors",
        "Parallel Streams",
    ],
    "ch31": [
        "Pattern and Matcher",
        "Regex Groups",
        "java.time",
        "Reflection",
        "Other Packages",
    ],
}

def _generate_section(heading: str, chapter_title: str) -> dict:
    text = heading.lower()
    title = chapter_title.lower()

    if any(key in text for key in ["if", "else", "switch", "loop", "for", "while", "break", "continue"]):
        content = (
            "Control statements direct program flow using conditions and loops. "
            "They are essential for decision-making and repetition."
        )
        code = (
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        int sum = 0;\n"
            "        for (int i = 1; i <= 3; i++) sum += i;\n"
            "        if (sum > 0) System.out.println(sum);\n"
            "    }\n"
            "}"
        )
    elif any(key in text for key in ["class", "object", "inherit", "interface", "method", "constructor"]):
        content = (
            "Object-oriented concepts like classes, inheritance, and methods organize code and data. "
            "They help model real-world entities and reuse behavior."
        )
        code = (
            "public class Main {\n"
            "    static class Person { String name; Person(String name) { this.name = name; } }\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(new Person(\"Lee\").name);\n"
            "    }\n"
            "}"
        )
    elif any(key in text for key in ["exception", "try", "throw"]):
        content = (
            "Exceptions represent errors that occur at runtime. try/catch blocks let you handle them gracefully."
        )
        code = (
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        try { int x = 1 / 0; }\n"
            "        catch (ArithmeticException e) { System.out.println(\"err\"); }\n"
            "    }\n"
            "}"
        )
    elif any(key in text for key in ["thread", "concurr", "synchron", "executor", "lock"]):
        content = (
            "Concurrency lets programs run tasks in parallel using threads or executors. "
            "Synchronization protects shared data from race conditions."
        )
        code = (
            "public class Main {\n"
            "    static class T extends Thread { public void run() { System.out.println(\"t\"); } }\n"
            "    public static void main(String[] args) { new T().start(); }\n"
            "}"
        )
    elif "string" in text:
        content = (
            "Strings are immutable text objects with many helper methods. Use StringBuilder for heavy concatenation."
        )
        code = (
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        StringBuilder sb = new StringBuilder();\n"
            "        sb.append(\"Java\");\n"
            "        System.out.println(sb.toString());\n"
            "    }\n"
            "}"
        )
    elif any(key in text for key in ["collection", "list", "set", "map"]):
        content = (
            "Collections store groups of objects. Lists keep order, Sets avoid duplicates, and Maps store key-value pairs."
        )
        code = (
            "import java.util.ArrayList;\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        ArrayList<String> list = new ArrayList<>();\n"
            "        list.add(\"a\");\n"
            "        System.out.println(list.size());\n"
            "    }\n"
            "}"
        )
    elif "stream" in text:
        content = (
            "Streams process data in pipelines using intermediate and terminal operations. "
            "They are lazy and composable."
        )
        code = (
            "import java.util.stream.Stream;\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        Stream.of(1, 2, 3).map(n -> n * 2).forEach(System.out::println);\n"
            "    }\n"
            "}"
        )
    elif any(key in text for key in ["file", "io", "path", "nio", "buffer", "channel"]):
        content = (
            "Java I/O APIs read and write data from files and streams. NIO provides modern utilities for paths and buffers."
        )
        code = (
            "import java.nio.file.Path;\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(Path.of(\"a\", \"b\"));\n"
            "    }\n"
            "}"
        )
    elif any(key in text for key in ["url", "socket", "http", "inet"]):
        content = (
            "Networking APIs handle communication over the network using sockets, URLs, and HTTP clients."
        )
        code = (
            "import java.net.URI;\n"
            "public class Main {\n"
            "    public static void main(String[] args) throws Exception {\n"
            "        URI uri = new URI(\"https://example.com\");\n"
            "        System.out.println(uri.getHost());\n"
            "    }\n"
            "}"
        )
    elif "regex" in title or "pattern" in text:
        content = (
            "Regular expressions match patterns in text using Pattern and Matcher."
        )
        code = (
            "import java.util.regex.Pattern;\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(Pattern.matches(\"[a-z]+\", \"java\"));\n"
            "    }\n"
            "}"
        )
    else:
        content = (
            f"{heading} is an important topic in {chapter_title}. It introduces concepts "
            "and APIs used in real Java programs."
        )
        code = (
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        System.out.println(\"Java topic: \" + \"" + heading.replace("\"", "") + "\");\n"
            "    }\n"
            "}"
        )

    return {"heading": heading, "content": content, "code_example": code}


def _build_generated_content() -> dict:
    generated = {}
    for chapter_id, headings in CHAPTER_HEADINGS.items():
        title = CHAPTER_TITLES[chapter_id]
        sections = [_generate_section(heading, title) for heading in headings]
        generated[chapter_id] = {
            "chapter_id": chapter_id,
            "title": title,
            "sections": sections,
        }
    return generated


FALLBACK_CONTENT.update(CURATED_FALLBACK_CONTENT)

CHAPTER_DEFINITIONS = {
    chapter_id: {
        "title": data["title"],
        "section_headings": [section["heading"] for section in data["sections"]],
    }
    for chapter_id, data in FALLBACK_CONTENT.items()
}


def _build_chapter_prompt(chapter_id: str, chapter: dict) -> dict:
    headings = ", ".join(chapter["section_headings"])
    return {
        "system": STUDY_SYSTEM_PROMPT,
        "user": (
            "Generate study content for Chapter "
            f"{chapter_id[-2:]}: {chapter['title']}. "
            "Required sections (in order): "
            f"{headings}. "
            "For each section provide heading, content (3-4 sentences), code_example. "
            "Return ONLY a valid JSON array of section objects. No preamble."
        ),
    }


CHAPTER_PROMPTS = {
    chapter_id: _build_chapter_prompt(chapter_id, chapter)
    for chapter_id, chapter in CHAPTER_DEFINITIONS.items()
}


def get_chapter_definition(chapter_id: str):
    return CHAPTER_DEFINITIONS.get(chapter_id)


def get_chapter_prompt(chapter_id: str):
    return CHAPTER_PROMPTS.get(chapter_id)


def get_fallback_content(chapter_id: str) -> dict:
    data = FALLBACK_CONTENT.get(chapter_id)
    if not data:
        return {
            "chapter_id": chapter_id,
            "title": "Unknown Chapter",
            "sections": [
                {
                    "heading": "Overview",
                    "content": "No study content is available for this chapter.",
                    "code_example": "",
                }
            ],
        }
    return data


def build_study_prompt(chapter_id: str):
    prompt = get_chapter_prompt(chapter_id)
    if not prompt:
        return None
    return prompt["user"]


def fallback_study_content(chapter_id: str):
    return get_fallback_content(chapter_id)
