function q(question, options, correctIndex) {
  return { question, options, correctIndex };
}

export const studyQuizzes = {
  ch01: [
    q(
      "A team needs the same Java program to run on Windows, macOS, and Linux without recompiling for each OS. Which part of Java makes that practical?",
      ["Java bytecode running on a JVM for each platform", "Rewriting the source code in C++", "Using only static methods", "Compiling directly to machine code for one CPU"],
      0
    ),
    q(
      "A developer moves from C to Java and notices there are no pointer arithmetic statements in the code. What Java design goal is best illustrated by that change?",
      ["Safer memory handling", "Faster assembly generation", "Manual memory control", "Multiple inheritance of classes"],
      0
    ),
    q(
      "A language feature allows compiled code to be checked by the JVM before execution, reducing low-level platform issues. Which Java idea is being used?",
      ["Bytecode verification", "Header files", "Preprocessor macros", "Friend functions"],
      0
    ),
    q(
      "A company wants object-oriented features like classes and inheritance while keeping syntax familiar to C programmers. Which earlier language most directly influenced that step before Java?",
      ["C++", "COBOL", "Pascal", "FORTRAN"],
      0
    ),
    q(
      "A browser-era tool wanted downloadable programs to run in a managed environment instead of native binaries. Which Java feature best matched that need?",
      ["Portable bytecode executed inside a virtual machine", "Manual linking with system libraries", "Direct access to processor registers", "Compilation through a C preprocessor"],
      0
    ),
  ],
  ch02: [
    q(
      "A class stores `balance` as private and updates it only through `deposit()`. Which object-oriented idea is being applied?",
      ["Encapsulation", "Inheritance", "Bytecode verification", "Method overloading"],
      0
    ),
    q(
      "Given `Animal a = new Dog(); a.sound();`, Java calls `Dog`'s version of `sound()`. Which concept is being demonstrated?",
      ["Polymorphism", "Package access", "Autoboxing", "Type erasure"],
      0
    ),
    q(
      "A program models `Car`, `Bike`, and `Truck` as separate objects with their own data and behavior instead of one long list of procedures. Which approach is this?",
      ["Object-oriented programming", "Process-only programming", "Bitwise programming", "Procedural macros"],
      0
    ),
    q(
      "A student's first Java program fails to start because `main` was declared as `void main()` instead of the standard entry point. Which signature should be used?",
      ["`public static void main(String[] args)`", "`public void main()`", "`static int main(String args)`", "`public static Main(String[] args)`"],
      0
    ),
    q(
      "A subclass `SavingsAccount` reuses fields and methods from `Account` and adds an interest method. Which concept makes this reuse possible?",
      ["Inheritance", "Short-circuit evaluation", "Serialization", "Garbage collection"],
      0
    ),
  ],
  ch03: [
    q(
      "What is printed by this code?\n`int x = 5;\ndouble y = x / 2;\nSystem.out.println(y);`",
      ["2.0", "2.5", "2", "Compilation error"],
      0
    ),
    q(
      "A method needs to store the Unicode character `A` and a true/false flag. Which declaration is most appropriate?",
      ["`char letter = 'A'; boolean ok = true;`", "`String letter = A; int ok = true;`", "`byte letter = \"A\"; bool ok = 1;`", "`double letter = 'A'; char ok = true;`"],
      0
    ),
    q(
      "What is the output?\n`int[] nums = {2, 4, 6};\nSystem.out.println(nums[1]);`",
      ["4", "2", "6", "Array index error"],
      0
    ),
    q(
      "What does this print?\n`double d = 9.8;\nint n = (int) d;\nSystem.out.println(n);`",
      ["9", "10", "9.8", "Compilation error"],
      0
    ),
    q(
      "A developer writes `var total = 15;` inside a method. What type does `total` get?",
      ["`int`, inferred from the assigned value", "`var` at runtime", "`double` because numbers default to floating point", "`Object` because inference always uses Object"],
      0
    ),
  ],
  ch04: [
    q(
      "What is the output?\n`int a = 10;\nint b = 3;\nSystem.out.println(a % b);`",
      ["1", "3", "0", "Compilation error"],
      0
    ),
    q(
      "If `int mask = 6;` and `int bit = 3;`, what is `mask & bit`?",
      ["2", "5", "7", "1"],
      0
    ),
    q(
      "What does this print?\n`int age = 18;\nSystem.out.println(age >= 18);`",
      ["true", "false", "18", "Compilation error"],
      0
    ),
    q(
      "What is printed?\n`boolean ready = false;\nSystem.out.println(ready && (10 / 0 > 1));`",
      ["false", "true", "ArithmeticException", "Compilation error"],
      0
    ),
    q(
      "What is the value of `result`?\n`int result = 2 + 3 * 4;`",
      ["14", "20", "24", "11"],
      0
    ),
  ],
  ch05: [
    q(
      "What is printed?\n`int score = 72;\nif (score >= 75) System.out.println(\"A\");\nelse System.out.println(\"B\");`",
      ["B", "A", "72", "Nothing"],
      0
    ),
    q(
      "What is the output?\n`int day = 2;\nswitch(day) {\n  case 1 -> System.out.println(\"Mon\");\n  case 2 -> System.out.println(\"Tue\");\n  default -> System.out.println(\"Other\");\n}`",
      ["Tue", "Mon", "Other", "Compilation error"],
      0
    ),
    q(
      "What does this loop print?\n`for (int i = 1; i <= 3; i++) {\n  System.out.print(i);\n}`",
      ["123", "012", "321", "13"],
      0
    ),
    q(
      "What is printed?\n`int n = 3;\nwhile (n > 0) {\n  System.out.print(n);\n  n--;\n}`",
      ["321", "123", "333", "Nothing"],
      0
    ),
    q(
      "A loop should skip printing `3` but continue with later values. Which statement fits that requirement inside the loop body?",
      ["`continue;`", "`break;`", "`return;`", "`switch;`"],
      0
    ),
  ],
  ch06: [
    q(
      "A class `Box` has fields `width` and `height`. Which line creates a new object named `b`?",
      ["`Box b = new Box();`", "`Box() b = new Box;`", "`new Box b();`", "`Box b();`"],
      0
    ),
    q(
      "What is the purpose of a constructor in `class Student { Student(String name) { ... } }`?",
      ["To initialize a new object's state when it is created", "To destroy the object manually", "To overload operators", "To import the class automatically"],
      0
    ),
    q(
      "In `Person(String name) { this.name = name; }`, why is `this.name` used?",
      ["To refer to the instance field when the parameter has the same name", "To create a local variable", "To call the garbage collector", "To make the field static"],
      0
    ),
    q(
      "A class `Lamp` has method `turnOn()`. After `Lamp lamp = new Lamp();`, which call uses that object's method correctly?",
      ["`lamp.turnOn();`", "`Lamp.turnOn(lamp);`", "`turnOn.lamp();`", "`new turnOn(lamp);`"],
      0
    ),
    q(
      "A program sets `obj = null;` and later no references to that object remain. What is the correct expectation?",
      ["The object becomes eligible for garbage collection", "The object is destroyed immediately by the assignment", "The constructor runs again", "The object becomes static"],
      0
    ),
  ],
  ch07: [
    q(
      "A class defines `print(int x)` and `print(String x)`. What allows both methods to exist in the same class?",
      ["Method overloading", "Method overriding", "Inheritance", "Type erasure"],
      0
    ),
    q(
      "A method receives `int count` and changes it inside the method. Why does the caller's original `int` stay unchanged?",
      ["Java passes the value of the variable, not the caller's variable itself", "Primitive values are always final", "Methods cannot modify parameters", "Java copies the whole class"],
      0
    ),
    q(
      "What does this method compute?\n`int fact(int n) { return n == 1 ? 1 : n * fact(n - 1); }`",
      ["Factorial using recursion", "Sum of an array", "Binary search", "String reversal with loops only"],
      0
    ),
    q(
      "A field should be usable only inside its own class. Which access modifier best matches that requirement?",
      ["`private`", "`public`", "`protected`", "No modifier in another package"],
      0
    ),
    q(
      "A field belongs to the class itself rather than each object, and its value must not change after assignment. Which combination is appropriate?",
      ["`static final`", "`private protected`", "`abstract synchronized`", "`volatile transient`"],
      0
    ),
  ],
  ch08: [
    q(
      "A subclass constructor needs to call the superclass constructor with an argument before doing its own setup. Which statement is used first?",
      ["`super(value);`", "`this(value);`", "`extends(value);`", "`base(value);`"],
      0
    ),
    q(
      "If `class Dog extends Animal` overrides `sound()`, what happens when `Animal a = new Dog(); a.sound();` runs?",
      ["The overridden `Dog` version runs", "The `Animal` version always runs", "Both versions run automatically", "Compilation fails because of polymorphism"],
      0
    ),
    q(
      "A class has a method declaration but no implementation because each subclass must provide its own version. What kind of class is this usually part of?",
      ["An abstract class", "A final class", "A sealed class only", "A utility class with only static methods"],
      0
    ),
    q(
      "A library author wants to prevent other classes from extending `SecureToken`. Which declaration should be used?",
      ["`final class SecureToken`", "`abstract class SecureToken`", "`static class SecureToken`", "`volatile class SecureToken`"],
      0
    ),
    q(
      "Every class in Java can call methods such as `toString()` and `equals()` even if they are not explicitly written. Why?",
      ["They are inherited from `Object`", "They are inserted by the compiler as keywords", "They come from `String`", "They exist only in interfaces"],
      0
    ),
  ],
  ch09: [
    q(
      "A file uses `ArrayList` without writing the full package name each time. Which statement makes that convenient?",
      ["`import java.util.ArrayList;`", "`package java.util.ArrayList;`", "`implements ArrayList;`", "`export java.util.ArrayList;`"],
      0
    ),
    q(
      "A class member should be visible in subclasses but not to unrelated classes in other packages. Which modifier best fits?",
      ["`protected`", "`private`", "`public`", "`final`"],
      0
    ),
    q(
      "A class `Car` promises to provide a `start()` method defined by `Vehicle`. Which keyword shows that `Vehicle` is an interface being adopted?",
      ["`implements`", "`extends`", "`imports`", "`requires`"],
      0
    ),
    q(
      "An interface adds a new method with a method body so old implementations do not break. What kind of interface member is this?",
      ["A default method", "An abstract method", "A constructor", "A package-private field"],
      0
    ),
    q(
      "Code calls `MathUtil.square(4)` where `square` is defined inside an interface without requiring an implementing object. What kind of interface member is being used?",
      ["A static interface method", "A default interface method", "A protected interface method", "A constructor"],
      0
    ),
  ],
  ch10: [
    q(
      "What is guaranteed to run whether or not an exception occurs in a `try` block, assuming the JVM is still continuing normally?",
      ["The `finally` block", "The `catch` block only", "The `throw` statement", "The method header"],
      0
    ),
    q(
      "A method detects invalid input and wants the caller to handle it later. Which line actively creates and signals the problem?",
      ["`throw new IllegalArgumentException();`", "`throws IllegalArgumentException;`", "`catch IllegalArgumentException;`", "`finally new IllegalArgumentException();`"],
      0
    ),
    q(
      "A method reads a file and does not catch `IOException` inside the method. What must the method signature include?",
      ["`throws IOException`", "`throw IOException`", "`catch IOException`", "`final IOException`"],
      0
    ),
    q(
      "Which exception type is checked by the compiler and usually must be caught or declared?",
      ["`IOException`", "`ArithmeticException`", "`NullPointerException`", "`ArrayIndexOutOfBoundsException`"],
      0
    ),
    q(
      "A project wants a custom error type `InvalidAgeException` that can be caught separately from other problems. What should it do?",
      ["Extend an exception class such as `Exception`", "Implement `Runnable`", "Extend `Thread`", "Use a static method only"],
      0
    ),
  ],
  ch11: [
    q(
      "A class extends `Thread` and overrides `run()`. Which call starts a new thread of execution?",
      ["`t.start();`", "`t.run();`", "`Thread.run(t);`", "`execute(t);`"],
      0
    ),
    q(
      "A class should define work for a thread but still be free to extend another class. Which approach is more flexible?",
      ["Implement `Runnable`", "Extend `Thread` twice", "Use a constructor only", "Mark the class `volatile`"],
      0
    ),
    q(
      "Two threads increment the same counter and produce inconsistent results. Which keyword helps make the increment block execute by one thread at a time?",
      ["`synchronized`", "`final`", "`native`", "`transient`"],
      0
    ),
    q(
      "A thread should pause until another thread signals that shared data is ready. Which pair of methods is designed for that coordination on a monitor object?",
      ["`wait()` and `notify()`", "`sleep()` and `join()`", "`yield()` and `interrupt()`", "`start()` and `stop()`"],
      0
    ),
    q(
      "A flag `running` is changed by one thread and repeatedly read by another. Which modifier improves visibility of the latest written value?",
      ["`volatile`", "`abstract`", "`private`", "`strictfp`"],
      0
    ),
  ],
  ch12: [
    q(
      "A program stores the days of a week as a fixed set of constants and uses `switch(day)` safely. Which Java feature fits best?",
      ["`enum`", "`record`", "`interface`", "`annotation`"],
      0
    ),
    q(
      "An enum `Level` stores an integer code with each constant and returns it using a method. What does that show about enums?",
      ["They can have constructors, fields, and methods", "They cannot contain behavior", "They must extend `Thread`", "They can have multiple public superclasses"],
      0
    ),
    q(
      "What happens in `Integer n = 5;`?",
      ["The primitive `int` value is autoboxed into an `Integer` object", "The `Integer` is unboxed into `int`", "A compilation error occurs", "The value becomes a `double` automatically"],
      0
    ),
    q(
      "Which line uses a wrapper class method to turn text into a number?",
      ["`Integer.parseInt(\"42\")`", "`int.wrap(\"42\")`", "`Number.toInt(\"42\")`", "`Wrapper.value(42)`"],
      0
    ),
    q(
      "A programmer writes `@Override` above a method and the compiler reports an error if no superclass method is actually overridden. What is `@Override`?",
      ["An annotation", "A package", "A constructor", "A generic bound"],
      0
    ),
  ],
  ch13: [
    q(
      "A resource such as a file reader should close automatically even if an exception is thrown. Which statement structure is designed for that?",
      ["try-with-resources", "A plain `if` statement", "A recursive call", "A `volatile` field"],
      0
    ),
    q(
      "A block can handle either `IOException` or `SQLException` with identical recovery logic. Which syntax is most suitable?",
      ["`catch (IOException | SQLException e)`", "`catch (IOException && SQLException e)`", "`catch (IOException, SQLException e)`", "`catch (Exception e1 + e2)`"],
      0
    ),
    q(
      "A variable should be assigned once and then never changed because it represents a fixed conversion rate. Which modifier should be used?",
      ["`final`", "`static`", "`volatile`", "`transient`"],
      0
    ),
    q(
      "Given `Object obj = \"Java\"; if (obj instanceof String s) { System.out.println(s.length()); }`, what does pattern matching provide?",
      ["Type test and cast in one step", "Automatic serialization", "Inheritance between unrelated classes", "A new thread"],
      0
    ),
    q(
      "A custom class is placed in a try-with-resources header, but the compiler rejects it. What must the class provide?",
      ["It must implement `AutoCloseable`", "It must extend `Thread`", "It must be final", "It must declare only static methods"],
      0
    ),
  ],
  ch14: [
    q(
      "A class `Box<T>` should store either `String`, `Integer`, or another chosen type safely. What benefit does `T` mainly provide?",
      ["Compile-time type safety without separate classes for each type", "Automatic multithreading", "Direct operator overloading", "Package-level visibility"],
      0
    ),
    q(
      "A utility method should return the first element of an array regardless of its element type. Which feature fits best?",
      ["A generic method", "A default interface method", "A `finally` block", "A `switch` expression"],
      0
    ),
    q(
      "A method should accept only number-like types because it calls `doubleValue()`. Which declaration idea is appropriate?",
      ["A bounded type parameter such as `<T extends Number>`", "A raw type", "A private constructor", "An unchecked cast"],
      0
    ),
    q(
      "A method only needs to read items from `List<Integer>` and `List<Double>` without adding new elements. Which parameter type is most flexible?",
      ["`List<? extends Number>`", "`List<Object>`", "`List<int>`", "`List<? super String>`"],
      0
    ),
    q(
      "At runtime, `List<String>` and `List<Integer>` do not keep separate generic type information for most ordinary operations. What concept explains that?",
      ["Type erasure", "Autoboxing", "Sealing", "Reflection"],
      0
    ),
  ],
  ch15: [
    q(
      "An interface has exactly one abstract method `int square(int x);`. Which lambda can be assigned to it?",
      ["`x -> x * x`", "`x, y -> x + y`", "`() -> 4`", "`return x * x;`"],
      0
    ),
    q(
      "Why does Java require a target type such as a functional interface when using a lambda expression?",
      ["The lambda needs exactly one abstract method to match", "Lambdas can only be used in loops", "Lambdas always create threads", "Lambdas replace packages"],
      0
    ),
    q(
      "If `List<String> names = List.of(\"Ana\", \"Bo\");` and the code uses `names.forEach(System.out::println);`, what is `System.out::println`?",
      ["A method reference", "A constructor chain", "A generic bound", "A text block"],
      0
    ),
    q(
      "A lambda should test whether a number is positive and return `true` or `false`. Which built-in functional interface is the best match?",
      ["`Predicate<Integer>`", "`Supplier<Integer>`", "`Consumer<Integer>`", "`Runnable`"],
      0
    ),
    q(
      "A developer sorts a list with `list.sort((a, b) -> a.compareTo(b));`. What is the lambda doing in this scenario?",
      ["Providing comparison logic to a collection operation", "Creating a new package", "Declaring an enum", "Opening a file resource"],
      0
    ),
  ],
  ch16: [
    q(
      "A modular project needs a descriptor file that names the module and lists its dependencies. Which file is used?",
      ["`module-info.java`", "`package-info.java`", "`manifest.mf`", "`Main.java`"],
      0
    ),
    q(
      "A module uses `java.sql` APIs. Which directive belongs in its module descriptor?",
      ["`requires java.sql;`", "`exports java.sql;`", "`opens java.sql;`", "`implements java.sql;`"],
      0
    ),
    q(
      "Code in another module should be allowed to use classes in package `com.shop.api`. Which directive supports that?",
      ["`exports com.shop.api;`", "`requires com.shop.api;`", "`opens com.shop.api;`", "`package com.shop.api;`"],
      0
    ),
    q(
      "A modular application is launched with named modules instead of placing everything on the traditional class lookup path. Which path is being used?",
      ["The module path", "The source path only", "The package path", "The annotation path"],
      0
    ),
    q(
      "A framework uses reflection to inspect non-public members of a package inside a module. Which directive can be used to allow reflective access?",
      ["`opens`", "`exports`", "`requires transitive`", "`provides`"],
      0
    ),
  ],
  ch17: [
    q(
      "What does this evaluate to?\n`int day = 6;\nString type = switch (day) {\n  case 1, 7 -> \"Weekend\";\n  default -> \"Weekday\";\n};`",
      ["Weekday", "Weekend", "6", "Compilation error"],
      0
    ),
    q(
      "A SQL query needs multiple lines without string concatenation and should preserve line breaks as written. Which modern Java feature is most suitable?",
      ["Text blocks", "Enums", "Wildcards", "Bitwise shifts"],
      0
    ),
    q(
      "Given `Object obj = \"hello\"; if (obj instanceof String s) { System.out.println(s.toUpperCase()); }`, what improvement is shown?",
      ["Pattern matching avoids a separate cast after the type test", "Strings become mutable", "The `instanceof` check becomes recursive", "The code now uses reflection"],
      0
    ),
    q(
      "A type should mainly hold immutable data such as `name` and `age`, and Java should generate accessors and value-based methods automatically. Which feature fits best?",
      ["A record", "A raw type", "A synchronized block", "A static initializer"],
      0
    ),
    q(
      "A class hierarchy should allow only `Circle` and `Rectangle` to extend `Shape`. Which feature supports that design?",
      ["Sealed classes", "Wrapper classes", "Default methods", "Type erasure"],
      0
    ),
  ],
  ch18: [
    q(
      "What is printed?\n`String s = \"Java\";\ns.concat(\" 17\");\nSystem.out.println(s);`",
      ["Java", "Java 17", "17", "Compilation error"],
      0
    ),
    q(
      "Which call returns the number of characters in `String name = \"Code\";`?",
      ["`name.length()`", "`name.size()`", "`length(name)`", "`name.count()`"],
      0
    ),
    q(
      "A loop appends thousands of small pieces of text. Which class is generally a better choice than repeated `String` concatenation?",
      ["`StringBuilder`", "`StringTokenizer`", "`Character`", "`Math`"],
      0
    ),
    q(
      "Multiple threads update the same mutable text buffer and the code wants synchronized string operations. Which class is the closer match?",
      ["`StringBuffer`", "`StringBuilder`", "`StringJoiner`", "`StringReader`"],
      0
    ),
    q(
      "What is the correct way to compare the contents of two strings `a` and `b`?",
      ["`a.equals(b)`", "`a == b`", "`a.compare(b)`", "`a.same(b)`"],
      0
    ),
  ],
  ch19: [
    q(
      "A class overrides `toString()` so objects print meaningful text in logs. Which class originally defines `toString()`?",
      ["`Object`", "`System`", "`Runtime`", "`Math`"],
      0
    ),
    q(
      "A program needs the larger of two values `4.2` and `9.1`. Which call from `Math` is appropriate?",
      ["`Math.max(4.2, 9.1)`", "`Math.top(4.2, 9.1)`", "`Math.upper(4.2, 9.1)`", "`Math.biggest(4.2, 9.1)`"],
      0
    ),
    q(
      "A developer wants to print an error message to the standard error stream instead of standard output. Which field should be used?",
      ["`System.err`", "`System.in`", "`Runtime.err`", "`Math.err`"],
      0
    ),
    q(
      "A string `" + "\"123\"" + "` must be converted into an `Integer` object. Which wrapper class method is appropriate?",
      ["`Integer.valueOf(\"123\")`", "`Integer.wrap(\"123\")`", "`Object.valueOf(\"123\")`", "`Number.toInteger(\"123\")`"],
      0
    ),
    q(
      "A class implements `Comparable<Book>` and defines `compareTo`. What does that mainly allow?",
      ["Objects to be ordered, such as during sorting", "Automatic cloning of objects", "Module export of the class", "Reflection-only access to fields"],
      0
    ),
  ],
  ch20: [
    q(
      "A program needs an ordered collection that allows duplicates like `[\"A\", \"A\", \"B\"]`. Which interface family is the best fit?",
      ["`List`", "`Set`", "`Map`", "`Queue` only"],
      0
    ),
    q(
      "A shopping app frequently adds and reads elements by index, such as `items.get(3)`. Which implementation is commonly chosen for this use case?",
      ["`ArrayList`", "`HashSet`", "`TreeMap`", "`StackWalker`"],
      0
    ),
    q(
      "A class stores unique student IDs and must reject duplicates automatically. Which collection is the most suitable?",
      ["`HashSet`", "`ArrayList`", "`HashMap`", "`LinkedList`"],
      0
    ),
    q(
      "An application wants to look up a city name from a postal code key. Which collection type matches key-value access best?",
      ["`Map`", "`Set`", "`List`", "`Deque`"],
      0
    ),
    q(
      "Which loop style is commonly used to visit each item in a collection with an iterator behind the scenes?",
      ["The enhanced for-each loop", "A `switch` statement", "A constructor call", "A module directive"],
      0
    ),
  ],
  ch21: [
    q(
      "A string `" + "\"red,green,blue\"" + "` should be split into tokens using commas as separators in older `java.util` style code. Which class fits that scenario?",
      ["`StringTokenizer`", "`Formatter`", "`Date`", "`Optional`"],
      0
    ),
    q(
      "A method may or may not find a user and wants to avoid returning `null` directly. Which type models that possibility?",
      ["`Optional<User>`", "`Scanner`", "`Calendar`", "`Formatter`"],
      0
    ),
    q(
      "Legacy code needs to represent a calendar date and then add one month using older utility classes. Which pair is commonly involved?",
      ["`Date` and `Calendar`", "`Math` and `StringBuilder`", "`Optional` and `Map`", "`Path` and `Files`"],
      0
    ),
    q(
      "Which class is designed to create formatted text such as `" + "\"Total: 42.50\"" + "` using placeholders?",
      ["`Formatter`", "`Scanner`", "`Thread`", "`Pattern`"],
      0
    ),
    q(
      "A console program wants to read an `int` typed by the user from standard input. Which class is usually used?",
      ["`Scanner`", "`StringTokenizer`", "`Optional`", "`Formatter`"],
      0
    ),
  ],
  ch22: [
    q(
      "A program reads raw bytes from an image file. Which base stream family is the best match?",
      ["Byte streams such as `InputStream`", "Character streams only", "A `Map` implementation", "A `Thread` subclass"],
      0
    ),
    q(
      "Code wants to check whether `report.txt` exists and inspect its path using classic `java.io`. Which class is appropriate?",
      ["`File`", "`PathMatcher`", "`Socket`", "`Pattern`"],
      0
    ),
    q(
      "A program reads text line by line efficiently from a file. Which combination is commonly used?",
      ["`BufferedReader` wrapped around a reader", "`PrintWriter` only", "`ObjectOutputStream`", "`Scanner` writing to a file"],
      0
    ),
    q(
      "An application wants convenient formatted text output to a file using `println`. Which writer class fits well?",
      ["`PrintWriter`", "`BufferedInputStream`", "`FileInputStream`", "`RandomAccessFile` only"],
      0
    ),
    q(
      "A program saves an object's state to a file so it can be reconstructed later. What operation is this?",
      ["Serialization", "Autoboxing", "Short-circuit evaluation", "Pattern matching"],
      0
    ),
  ],
  ch23: [
    q(
      "A modern file API call needs a path to `data.txt`. Which expression creates that path in NIO?",
      ["`Path path = Paths.get(\"data.txt\");`", "`File path = Path.get(\"data.txt\");`", "`Paths path = new Path(\"data.txt\");`", "`Path path = new File(\"data.txt\");`"],
      0
    ),
    q(
      "A program wants to copy a file using modern utility methods without manually reading each byte. Which class provides that convenience?",
      ["`Files`", "`Math`", "`System`", "`Thread`"],
      0
    ),
    q(
      "Before writing bytes through a channel, the program stores them in a memory block with position and limit values. What NIO structure is this?",
      ["A buffer", "A package", "A module", "An enum"],
      0
    ),
    q(
      "A file is read through `FileChannel` for potentially efficient I/O operations. Which NIO idea is being used?",
      ["Channels connect buffers with data sources or sinks", "Interfaces replace streams completely", "Records make I/O automatic", "Enums control operating system handles"],
      0
    ),
    q(
      "A directory tree should be traversed and filtered using newer file operations added in NIO.2. Which API is the closest fit?",
      ["`Files.walk(...)` and related NIO.2 utilities", "`Math.max(...)`", "`Thread.sleep(...)`", "`Integer.parseInt(...)`"],
      0
    ),
  ],
  ch24: [
    q(
      "A program needs the IP address for a host name such as `example.com`. Which class is used to represent that network address information?",
      ["`InetAddress`", "`URL`", "`Socket`", "`Path`"],
      0
    ),
    q(
      "A client needs a two-way connection to a remote server over TCP. Which class is usually created on the client side?",
      ["`Socket`", "`ServerSocket`", "`URI`", "`DatagramPacket` only"],
      0
    ),
    q(
      "A server application waits for incoming TCP clients on a port. Which class is designed for that job?",
      ["`ServerSocket`", "`Socket`", "`URLConnection`", "`InetAddress`"],
      0
    ),
    q(
      "A string such as `" + "\"https://example.com/docs?id=5\"" + "` should be parsed as a web resource location. Which class most directly models that complete locator?",
      ["`URL`", "`Path`", "`Scanner`", "`Math`"],
      0
    ),
    q(
      "A program has a `URL` and wants to open the connection and read response metadata such as content type. Which API is commonly used?",
      ["`URLConnection`", "`Runtime`", "`ObjectOutputStream`", "`ThreadLocal`"],
      0
    ),
  ],
  ch25: [
    q(
      "A button click should trigger a handler method registered with the component. Which event-handling model is Java using here?",
      ["The delegation event model", "Direct machine interrupts", "Bitwise event routing", "Generic type erasure"],
      0
    ),
    q(
      "In GUI code, which object generates the event when a user clicks a button?",
      ["The event source", "The listener", "The adapter class", "The layout manager"],
      0
    ),
    q(
      "Which interface would you implement to respond to a button press represented by `ActionEvent`?",
      ["`ActionListener`", "`MouseListener`", "`Runnable`", "`Comparator`"],
      0
    ),
    q(
      "A drawing panel should react when the mouse is moved or clicked. Which event family is most directly relevant?",
      ["`MouseEvent`", "`ActionEvent`", "`WindowEvent` only", "`Cloneable`"],
      0
    ),
    q(
      "A class cares only about `mouseClicked()` and does not want to implement every method of `MouseListener`. What helper is commonly used?",
      ["An adapter class such as `MouseAdapter`", "A `final` method", "A static import", "A stream collector"],
      0
    ),
  ],
  ch26: [
    q(
      "A `Frame` contains buttons, labels, and text areas. In AWT terms, what role is the frame mainly playing?",
      ["A container", "A listener", "An annotation", "A generic bound"],
      0
    ),
    q(
      "A simple AWT desktop window with a title bar should be created. Which class is the basic top-level choice?",
      ["`Frame`", "`Canvas`", "`Color`", "`Font`"],
      0
    ),
    q(
      "Inside `paint(Graphics g)`, which object is used to draw shapes and text?",
      ["The `Graphics` object", "The `Frame` constructor", "The layout manager", "The module descriptor"],
      0
    ),
    q(
      "A custom drawing surface should render circles by overriding `paint()`. Which AWT component is commonly extended?",
      ["`Canvas`", "`Label`", "`MenuBar`", "`Dialog`"],
      0
    ),
    q(
      "A program wants bigger bold text and a blue drawing color before calling `drawString`. Which AWT concepts are being configured?",
      ["Font and color", "Socket and stream", "Enum and annotation", "Module and package"],
      0
    ),
  ],
  ch27: [
    q(
      "A form needs a clickable button and a checkbox. Which chapter concept covers those UI elements?",
      ["AWT controls", "Parallel streams", "Wildcards", "Reflection"],
      0
    ),
    q(
      "A user should type a single line of text into a form field. Which AWT component is the usual fit?",
      ["`TextField`", "`Label`", "`MenuItem`", "`Canvas`"],
      0
    ),
    q(
      "Components should automatically be arranged in rows and wrap based on available space. Which layout manager is a common simple choice?",
      ["`FlowLayout`", "`MouseAdapter`", "`Graphics`", "`MediaTracker`"],
      0
    ),
    q(
      "A desktop window needs a top menu with File and Edit options. Which AWT concept provides that structure?",
      ["Menus", "Annotations", "Channels", "Comparators"],
      0
    ),
    q(
      "A program should show a small pop-up asking the user to confirm deletion. Which GUI element best matches?",
      ["A dialog", "A package", "A wildcard", "A byte stream"],
      0
    ),
  ],
  ch28: [
    q(
      "A GUI app wants to display a photo stored on disk. What is the first broad task it must perform?",
      ["Load the image into memory", "Open a socket server", "Create a generic type", "Start a new module"],
      0
    ),
    q(
      "Image drawing happens asynchronously, and a component wants to know whether enough of the image is ready to paint. Which interface helps with that?",
      ["`ImageObserver`", "`ActionListener`", "`Comparable`", "`Runnable`"],
      0
    ),
    q(
      "Several images should be loaded and tracked until each is ready before display. Which utility is designed for that coordination?",
      ["`MediaTracker`", "`Formatter`", "`Optional`", "`Lock`"],
      0
    ),
    q(
      "A program needs direct pixel access for image processing such as tinting or grayscale conversion. Which class is especially useful?",
      ["`BufferedImage`", "`ImageObserver`", "`File`", "`Scanner`"],
      0
    ),
    q(
      "A PNG file should be read from disk into an image object using the standard library. Which API is commonly used?",
      ["`ImageIO.read(...)`", "`Math.read(...)`", "`Graphics.load(...)`", "`Files.tokenize(...)`"],
      0
    ),
  ],
  ch29: [
    q(
      "An app wants to submit many tasks to a thread pool instead of creating threads manually one by one. Which service is commonly used?",
      ["`ExecutorService`", "`ServerSocket`", "`Scanner`", "`StringBuilder`"],
      0
    ),
    q(
      "A task should return a computed value later, such as the sum of a list. Which pair of types is designed for that?",
      ["`Callable` and `Future`", "`Runnable` and `Thread` only", "`Lock` and `Condition`", "`Map` and `Set`"],
      0
    ),
    q(
      "Two threads need explicit lock and unlock calls around a critical section. Which API is most directly relevant?",
      ["`Lock`", "`Optional`", "`Pattern`", "`Module`"],
      0
    ),
    q(
      "Several worker threads should all wait until a fixed number of tasks complete before continuing. Which concurrency utility fits that coordination style?",
      ["A synchronizer such as `CountDownLatch`", "A text block", "A wrapper class", "A package import"],
      0
    ),
    q(
      "A shared map is updated by many threads and the code wants a collection designed for concurrent access. Which choice is most suitable?",
      ["`ConcurrentHashMap`", "`HashMap` without synchronization", "`ArrayList`", "`StringTokenizer`"],
      0
    ),
  ],
  ch30: [
    q(
      "A list of integers should become a stream for pipeline processing. Which line creates that stream from the list?",
      ["`list.stream()`", "`Stream.of(list.get(0))` only", "`new Stream(list)`", "`list.toChannel()`"],
      0
    ),
    q(
      "What does `filter(n -> n % 2 == 0)` do in a stream pipeline?",
      ["Keeps only elements that satisfy the predicate", "Converts every number to text", "Ends the stream and returns a sum", "Sorts elements in descending order automatically"],
      0
    ),
    q(
      "Which operation is terminal because it finishes the pipeline and produces a result?",
      ["`count()`", "`map(...)`", "`filter(...)`", "`peek(...)`"],
      0
    ),
    q(
      "A stream of names should be collected into a `List<String>` after mapping them to uppercase. Which tool is commonly used at the end?",
      ["A collector such as `Collectors.toList()`", "A wildcard", "A module export", "A lock"],
      0
    ),
    q(
      "A CPU-heavy stream operation is switched to `parallelStream()`. What is the intended effect?",
      ["Work may be processed in parallel across multiple cores", "The stream becomes sorted automatically", "Each element is boxed into `Optional`", "The stream ignores terminal operations"],
      0
    ),
  ],
  ch31: [
    q(
      "A program checks whether `\"cat123\"` matches the regex `[a-z]+\\d+`. Which API pair is commonly used to compile and apply that regex?",
      ["`Pattern` and `Matcher`", "`Scanner` and `Formatter`", "`Path` and `Files`", "`Lock` and `Condition`"],
      0
    ),
    q(
      "A regex `(\d{2})-(\d{2})` is matched against `\"12-34\"`, and the code later asks for the first captured part. What feature is it using?",
      ["Regex groups", "Type erasure", "Default methods", "Bytecode verification"],
      0
    ),
    q(
      "A modern API is needed for dates like `LocalDate.now()` instead of the older `Date` and `Calendar` classes. Which package provides that?",
      ["`java.time`", "`java.awt`", "`java.net`", "`java.io`"],
      0
    ),
    q(
      "A framework inspects a class at runtime to list its methods and fields without hardcoding them. Which Java capability is being used?",
      ["Reflection", "Autoboxing", "Short-circuit evaluation", "Encapsulation only"],
      0
    ),
    q(
      "A regex should match strings like `AA-101` but not `A-101`. Which pattern is the best fit?",
      ["`[A-Z]{2}-\\d{3}`", "`[A-Z]-\\d{3}`", "`[A-Z]{3}-\\d{2}`", "`\\d{2}-[A-Z]{3}`"],
      0
    ),
  ],
};
