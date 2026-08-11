const section = (heading, content, code_example) => ({
  heading,
  content,
  code_example,
});

export const studyFallbackContent = {
  ch04: {
    chapter_id: "ch04",
    title: "Operators",
    sections: [
      section(
        "Arithmetic Operators",
        "Arithmetic operators perform basic math with numeric values. Java uses +, -, *, /, and % for addition, subtraction, multiplication, division, and remainder, and operators like ++ or += provide short forms for updates.",
        `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 3;
        System.out.println(a + b);
        System.out.println(a - b);
        System.out.println(a * b);
        System.out.println(a / b);
        System.out.println(a % b);
        a++;
        b += 2;
        System.out.println(a + " " + b);
    }
}`
      ),
      section(
        "Bitwise Operators",
        "Bitwise operators work on the individual bits of integer values. Operators such as &, |, ^, ~, <<, and >> are useful when you need masking, flag checks, or low-level numeric manipulation.",
        `public class Main {
    public static void main(String[] args) {
        int x = 6;
        int y = 3;
        System.out.println(x & y);
        System.out.println(x | y);
        System.out.println(x ^ y);
        System.out.println(~x);
        System.out.println(x << 1);
        System.out.println(x >> 1);
    }
}`
      ),
      section(
        "Relational Operators",
        "Relational operators compare two values and produce a boolean result. They are commonly used in conditions, loops, and validation logic.",
        `public class Main {
    public static void main(String[] args) {
        int marks = 75;
        System.out.println(marks > 50);
        System.out.println(marks >= 75);
        System.out.println(marks == 75);
        System.out.println(marks != 90);
        System.out.println(marks < 100);
    }
}`
      ),
      section(
        "Boolean Logical Operators",
        "Boolean logical operators combine or invert true and false values. Java also provides short-circuit operators && and ||, which stop evaluating as soon as the final answer is known.",
        `public class Main {
    public static void main(String[] args) {
        boolean hasId = true;
        boolean hasTicket = false;
        System.out.println(hasId && hasTicket);
        System.out.println(hasId || hasTicket);
        System.out.println(!hasTicket);
    }
}`
      ),
      section(
        "Assignment and Ternary",
        "Assignment stores a value in a variable, and compound assignments like += combine an operation with assignment. The ternary operator ?: is a compact way to choose one value when a condition is true and another when it is false.",
        `public class Main {
    public static void main(String[] args) {
        int score = 68;
        score += 7;
        String result = score >= 75 ? "Pass" : "Retry";
        System.out.println("Score: " + score);
        System.out.println(result);
    }
}`
      ),
      section(
        "Operator Precedence",
        "When an expression has multiple operators, Java follows precedence rules to decide which part is evaluated first. Parentheses are the safest way to make your intent clear and avoid unexpected results.",
        `public class Main {
    public static void main(String[] args) {
        int answer1 = 2 + 3 * 4;
        int answer2 = (2 + 3) * 4;
        System.out.println(answer1);
        System.out.println(answer2);
    }
}`
      ),
      section(
        "instanceof",
        "The instanceof operator checks whether a reference points to an object of a specific type. It is useful before casting, especially when working with inheritance or interface-based code.",
        `public class Main {
    static class Animal { }
    static class Dog extends Animal { }

    public static void main(String[] args) {
        Animal pet = new Dog();
        System.out.println(pet instanceof Dog);
        System.out.println(pet instanceof Animal);
    }
}`
      ),
    ],
  },
  ch05: {
    chapter_id: "ch05",
    title: "Control Statements",
    sections: [
      section(
        "if/else",
        "if and else let a program choose between different paths based on a condition. This is the most common way to make decisions such as checking marks, age, or input values.",
        `public class Main {
    public static void main(String[] args) {
        int temperature = 28;
        if (temperature > 30) {
            System.out.println("It is hot.");
        } else {
            System.out.println("It is pleasant.");
        }
    }
}`
      ),
      section(
        "switch",
        "switch selects one branch from many possible constant values. It is often clearer than a long chain of if/else statements when you are matching a menu choice, day number, or grade.",
        `public class Main {
    public static void main(String[] args) {
        int day = 3;
        switch (day) {
            case 1 -> System.out.println("Monday");
            case 2 -> System.out.println("Tuesday");
            case 3 -> System.out.println("Wednesday");
            default -> System.out.println("Other day");
        }
    }
}`
      ),
      section(
        "for",
        "A for loop is best when you know how many times a block should run. It combines initialization, condition checking, and update logic in one place.",
        `public class Main {
    public static void main(String[] args) {
        for (int i = 1; i <= 5; i++) {
            System.out.println("Table row: " + i);
        }
    }
}`
      ),
      section(
        "while",
        "A while loop repeats as long as its condition stays true. It is useful when the number of repetitions depends on changing data rather than a fixed count.",
        `public class Main {
    public static void main(String[] args) {
        int count = 3;
        while (count > 0) {
            System.out.println("Countdown: " + count);
            count--;
        }
    }
}`
      ),
      section(
        "do-while",
        "A do-while loop checks its condition after the loop body runs. That means the body executes at least once, which is helpful for menus or input prompts.",
        `public class Main {
    public static void main(String[] args) {
        int value = 1;
        do {
            System.out.println("Value: " + value);
            value++;
        } while (value <= 3);
    }
}`
      ),
      section(
        "for-each",
        "The enhanced for loop, often called for-each, is designed for reading arrays and collections element by element. It is cleaner than index-based looping when you do not need the current position.",
        `public class Main {
    public static void main(String[] args) {
        String[] colors = {"Red", "Green", "Blue"};
        for (String color : colors) {
            System.out.println(color);
        }
    }
}`
      ),
      section(
        "break/continue/return",
        "break exits a loop or switch immediately, continue skips to the next loop iteration, and return leaves the current method. These statements give you precise control over program flow when a special case appears.",
        `public class Main {
    static int findFirstEven(int[] values) {
        for (int value : values) {
            if (value < 0) {
                continue;
            }
            if (value % 2 == 0) {
                return value;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] numbers = {-3, -1, 7, 10, 12};
        System.out.println(findFirstEven(numbers));
    }
}`
      ),
    ],
  },
  ch06: {
    chapter_id: "ch06",
    title: "Introducing Classes",
    sections: [
      section(
        "Class Fundamentals",
        "A class is a blueprint that groups data and behavior into one unit. Fields store the state of an object, and methods define the actions that object can perform.",
        `public class Main {
    static class Box {
        double width = 4;
        double height = 3;
        double depth = 2;

        double volume() {
            return width * height * depth;
        }
    }

    public static void main(String[] args) {
        Box box = new Box();
        System.out.println(box.volume());
    }
}`
      ),
      section(
        "Constructors",
        "A constructor runs when an object is created and is commonly used to set initial values. Constructors have the same name as the class and do not declare a return type.",
        `public class Main {
    static class Student {
        String name;
        int age;

        Student(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }

    public static void main(String[] args) {
        Student student = new Student("Anaya", 19);
        System.out.println(student.name + " " + student.age);
    }
}`
      ),
      section(
        "this",
        "The this keyword refers to the current object. It is often used when constructor or method parameters have the same names as instance variables.",
        `public class Main {
    static class Book {
        String title;

        Book(String title) {
            this.title = title;
        }

        void show() {
            System.out.println(this.title);
        }
    }

    public static void main(String[] args) {
        Book book = new Book("Java Basics");
        book.show();
    }
}`
      ),
      section(
        "Object Creation",
        "Objects are created with the new operator, which allocates memory and calls a constructor. Each object gets its own copy of instance data, so changing one object does not automatically change another.",
        `public class Main {
    static class Lamp {
        boolean on;

        void switchOn() {
            on = true;
        }
    }

    public static void main(String[] args) {
        Lamp first = new Lamp();
        Lamp second = new Lamp();
        first.switchOn();
        System.out.println(first.on);
        System.out.println(second.on);
    }
}`
      ),
      section(
        "Garbage Collection",
        "Java automatically reclaims memory for objects that are no longer reachable, which reduces manual memory-management errors. You can remove references to objects, but the exact time of cleanup is controlled by the JVM and should not be relied on for program logic.",
        `public class Main {
    static class Temp {
        int value = 99;
    }

    public static void main(String[] args) {
        Temp item = new Temp();
        System.out.println(item.value);
        item = null;
        System.gc();
        System.out.println("Reference cleared.");
    }
}`
      ),
    ],
  },
  ch07: {
    chapter_id: "ch07",
    title: "A Closer Look at Methods and Classes",
    sections: [
      section(
        "Method Overloading",
        "Method overloading lets one class define several methods with the same name but different parameter lists. The compiler chooses the version whose parameters best match the call.",
        `public class Main {
    static int add(int a, int b) {
        return a + b;
    }

    static double add(double a, double b) {
        return a + b;
    }

    public static void main(String[] args) {
        System.out.println(add(4, 5));
        System.out.println(add(2.5, 3.1));
    }
}`
      ),
      section(
        "Parameter Passing (Pass-by-Value)",
        "Java always passes arguments by value, which means a method receives a copy of the variable’s value. For object references, the copied reference still points to the same object, so the method can change the object’s state but cannot replace the caller’s variable itself.",
        `public class Main {
    static class Counter {
        int value = 1;
    }

    static void update(Counter counter) {
        counter.value = 10;
    }

    public static void main(String[] args) {
        Counter counter = new Counter();
        update(counter);
        System.out.println(counter.value);
    }
}`
      ),
      section(
        "Recursion",
        "A recursive method calls itself to solve a smaller version of the same problem. Every recursive solution needs a base case so that the method eventually stops calling itself.",
        `public class Main {
    static int factorial(int n) {
        if (n == 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        System.out.println(factorial(5));
    }
}`
      ),
      section(
        "Access Control",
        "Access modifiers decide where a class member can be used. private members stay inside the same class, while public members are visible from anywhere that can access the class.",
        `public class Main {
    static class Account {
        private double balance = 5000;

        public double getBalance() {
            return balance;
        }
    }

    public static void main(String[] args) {
        Account account = new Account();
        System.out.println(account.getBalance());
    }
}`
      ),
      section(
        "static and final",
        "static members belong to the class itself instead of individual objects, so they are shared by every instance. final prevents reassignment for variables and prevents overriding when applied to methods.",
        `public class Main {
    static final double TAX_RATE = 0.18;
    static int count = 0;

    Main() {
        count++;
    }

    public static void main(String[] args) {
        new Main();
        new Main();
        System.out.println("Objects: " + count);
        System.out.println("Tax: " + TAX_RATE);
    }
}`
      ),
    ],
  },
  ch08: {
    chapter_id: "ch08",
    title: "Inheritance",
    sections: [
      section(
        "extends and super",
        "Inheritance lets a subclass reuse fields and methods from a superclass through extends. The super keyword accesses superclass members and is commonly used to call a parent constructor.",
        `public class Main {
    static class Animal {
        String name;

        Animal(String name) {
            this.name = name;
        }
    }

    static class Dog extends Animal {
        Dog(String name) {
            super(name);
        }
    }

    public static void main(String[] args) {
        Dog dog = new Dog("Rocky");
        System.out.println(dog.name);
    }
}`
      ),
      section(
        "Method Overriding",
        "Method overriding happens when a subclass provides its own version of a method defined in the superclass. Java uses dynamic dispatch so the overridden method runs based on the object’s actual type.",
        `public class Main {
    static class Shape {
        void draw() {
            System.out.println("Drawing shape");
        }
    }

    static class Circle extends Shape {
        @Override
        void draw() {
            System.out.println("Drawing circle");
        }
    }

    public static void main(String[] args) {
        Shape shape = new Circle();
        shape.draw();
    }
}`
      ),
      section(
        "Abstract Classes",
        "An abstract class defines a common base that cannot be instantiated directly. It can include both complete methods and abstract methods that subclasses must implement.",
        `public class Main {
    static abstract class Vehicle {
        abstract void start();
    }

    static class Bike extends Vehicle {
        @Override
        void start() {
            System.out.println("Bike started");
        }
    }

    public static void main(String[] args) {
        Vehicle vehicle = new Bike();
        vehicle.start();
    }
}`
      ),
      section(
        "final Classes and Methods",
        "A final method cannot be overridden, and a final class cannot be extended. These restrictions are useful when you want to lock down behavior or protect an implementation from modification.",
        `final class Utility {
    final void show() {
        System.out.println("Fixed behavior");
    }
}

public class Main {
    public static void main(String[] args) {
        Utility utility = new Utility();
        utility.show();
    }
}`
      ),
      section(
        "The Object Class",
        "Every class in Java ultimately inherits from Object, which supplies methods like toString, equals, and hashCode. Overriding these methods gives more meaningful behavior for your own classes.",
        `public class Main {
    static class Point {
        int x;
        int y;

        Point(int x, int y) {
            this.x = x;
            this.y = y;
        }

        @Override
        public String toString() {
            return "(" + x + ", " + y + ")";
        }
    }

    public static void main(String[] args) {
        System.out.println(new Point(2, 5));
    }
}`
      ),
    ],
  },
  ch09: {
    chapter_id: "ch09",
    title: "Packages and Interfaces",
    sections: [
      section(
        "package and import",
        "Packages organize related classes and help avoid name conflicts in large programs. The import statement lets you refer to classes by short names instead of writing their full package paths every time.",
        `package school;

import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> names = new ArrayList<>();
        names.add("Riya");
        System.out.println(names);
    }
}`
      ),
      section(
        "Access Protection",
        "Java controls visibility with private, default access, protected, and public. protected is especially useful in inheritance because it allows subclasses to use a member even when they are in different packages.",
        `public class Main {
    static class Parent {
        protected String message = "Visible to subclass";
    }

    static class Child extends Parent {
        void show() {
            System.out.println(message);
        }
    }

    public static void main(String[] args) {
        new Child().show();
    }
}`
      ),
      section(
        "Interfaces and implements",
        "An interface defines a contract that classes agree to follow. A class uses implements to promise that it will provide the required methods.",
        `public class Main {
    interface Printable {
        void print();
    }

    static class Report implements Printable {
        public void print() {
            System.out.println("Printing report");
        }
    }

    public static void main(String[] args) {
        Printable item = new Report();
        item.print();
    }
}`
      ),
      section(
        "Default Methods",
        "A default method lets an interface include a ready-made method body. This makes it possible to add new behavior to interfaces without breaking every existing implementing class.",
        `public class Main {
    interface Greeter {
        default void sayHello() {
            System.out.println("Hello from the interface");
        }
    }

    static class Student implements Greeter { }

    public static void main(String[] args) {
        new Student().sayHello();
    }
}`
      ),
      section(
        "Static Interface Methods",
        "Interfaces can also contain static methods that belong to the interface itself, not to any object. They are called with the interface name and are useful for helper behavior tied to that contract.",
        `public class Main {
    interface Converter {
        static int toMinutes(int hours) {
            return hours * 60;
        }
    }

    public static void main(String[] args) {
        System.out.println(Converter.toMinutes(2));
    }
}`
      ),
    ],
  },
  ch10: {
    chapter_id: "ch10",
    title: "Exception Handling",
    sections: [
      section(
        "try/catch/finally",
        "Exception handling keeps a program from crashing unexpectedly when something goes wrong at runtime. try holds risky code, catch handles a matching exception, and finally runs cleanup code whether an exception occurred or not.",
        `public class Main {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;
            System.out.println(result);
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero");
        } finally {
            System.out.println("Done.");
        }
    }
}`
      ),
      section(
        "throw and throws",
        "throw creates and sends an exception explicitly, while throws declares that a method may pass an exception to its caller. Together they help move error-handling responsibility to the right level of a program.",
        `public class Main {
    static void checkAge(int age) throws Exception {
        if (age < 18) {
            throw new Exception("Age must be 18 or above");
        }
    }

    public static void main(String[] args) {
        try {
            checkAge(16);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}`
      ),
      section(
        "Checked vs Unchecked",
        "Checked exceptions must be handled or declared because the compiler enforces them, while unchecked exceptions come from RuntimeException and are not checked at compile time. Checked exceptions often represent recoverable conditions such as file problems, whereas unchecked ones often signal programming mistakes.",
        `import java.io.IOException;

public class Main {
    static void checkedExample() throws IOException {
        throw new IOException("File problem");
    }

    public static void main(String[] args) {
        try {
            checkedExample();
        } catch (IOException e) {
            System.out.println("Checked: " + e.getMessage());
        }

        try {
            int value = 5 / 0;
            System.out.println(value);
        } catch (ArithmeticException e) {
            System.out.println("Unchecked: " + e.getClass().getSimpleName());
        }
    }
}`
      ),
      section(
        "Custom Exceptions",
        "A custom exception gives a meaningful name to a specific problem in your application. It improves readability because callers can catch a domain-specific error instead of a vague general one.",
        `public class Main {
    static class InvalidMarksException extends Exception {
        InvalidMarksException(String message) {
            super(message);
        }
    }

    static void validate(int marks) throws InvalidMarksException {
        if (marks < 0 || marks > 100) {
            throw new InvalidMarksException("Marks must be between 0 and 100");
        }
    }

    public static void main(String[] args) {
        try {
            validate(120);
        } catch (InvalidMarksException e) {
            System.out.println(e.getMessage());
        }
    }
}`
      ),
      section(
        "try-with-resources",
        "try-with-resources automatically closes objects that implement AutoCloseable after use. This makes resource cleanup shorter, safer, and less error-prone than manually closing objects in finally blocks.",
        `class DemoResource implements AutoCloseable {
    void use() {
        System.out.println("Using resource");
    }

    public void close() {
        System.out.println("Resource closed");
    }
}

public class Main {
    public static void main(String[] args) {
        try (DemoResource resource = new DemoResource()) {
            resource.use();
        }
    }
}`
      ),
    ],
  },
  ch11: {
    chapter_id: "ch11",
    title: "Multithreaded Programming",
    sections: [
      section(
        "Thread Class",
        "One way to create a new thread is to extend the Thread class and override its run method. Calling start creates a separate path of execution, while calling run directly would just execute the method normally on the current thread.",
        `public class Main {
    static class Worker extends Thread {
        public void run() {
            System.out.println("Thread is running");
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Worker worker = new Worker();
        worker.start();
        worker.join();
    }
}`
      ),
      section(
        "Runnable",
        "Implementing Runnable separates the task from the thread that executes it. This is often more flexible than extending Thread because your class can still inherit from another class if needed.",
        `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> System.out.println("Runnable task executed");
        Thread thread = new Thread(task);
        thread.start();
        thread.join();
    }
}`
      ),
      section(
        "Synchronization",
        "When multiple threads share data, synchronization prevents race conditions by allowing only one thread at a time into a critical section. The synchronized keyword is a simple way to protect shared state.",
        `public class Main {
    static class Counter {
        private int value = 0;

        synchronized void increment() {
            value++;
        }

        int getValue() {
            return value;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        Thread t1 = new Thread(counter::increment);
        Thread t2 = new Thread(counter::increment);
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(counter.getValue());
    }
}`
      ),
      section(
        "wait/notify",
        "wait pauses a thread until another thread signals it with notify or notifyAll on the same monitor object. This pattern is useful when one thread must wait for data or a state change produced by another thread.",
        `public class Main {
    public static void main(String[] args) throws InterruptedException {
        Object lock = new Object();

        Thread waiter = new Thread(() -> {
            synchronized (lock) {
                try {
                    lock.wait();
                    System.out.println("Resumed after notify");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        });

        waiter.start();
        Thread.sleep(100);

        synchronized (lock) {
            lock.notify();
        }

        waiter.join();
    }
}`
      ),
      section(
        "volatile",
        "volatile tells the JVM that a variable may be changed by multiple threads and should not be cached in a thread-local way. It improves visibility of updates, but it does not make compound operations like increment automatically safe.",
        `public class Main {
    static volatile boolean running = true;

    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(() -> {
            while (running) {
                // waiting for flag change
            }
            System.out.println("Stopped");
        });

        thread.start();
        Thread.sleep(100);
        running = false;
        thread.join();
    }
}`
      ),
    ],
  },
  ch12: {
    chapter_id: "ch12",
    title: "Enumerations, Autoboxing, and Annotations",
    sections: [
      section(
        "enum Basics",
        "An enum defines a fixed set of named constants. It is safer and clearer than using raw numbers or strings for values such as days, statuses, or directions.",
        `public class Main {
    enum Level { LOW, MEDIUM, HIGH }

    public static void main(String[] args) {
        Level level = Level.MEDIUM;
        System.out.println(level);
    }
}`
      ),
      section(
        "Enum Constructors and Methods",
        "Enums can have fields, constructors, and methods just like regular classes. This allows each constant to carry related data and behavior instead of being just a plain name.",
        `public class Main {
    enum TrafficLight {
        RED("Stop"),
        GREEN("Go");

        private final String action;

        TrafficLight(String action) {
            this.action = action;
        }

        String getAction() {
            return action;
        }
    }

    public static void main(String[] args) {
        System.out.println(TrafficLight.RED.getAction());
    }
}`
      ),
      section(
        "Autoboxing and Unboxing",
        "Autoboxing converts a primitive value into its wrapper object automatically, and unboxing converts it back to a primitive when needed. This happens often when working with collections, which store objects rather than primitive types.",
        `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>();
        numbers.add(10);
        int value = numbers.get(0);
        System.out.println(value);
    }
}`
      ),
      section(
        "Wrapper Classes",
        "Wrapper classes such as Integer, Double, and Boolean let primitives be used as objects. They also provide useful helper methods for parsing strings, comparing values, and converting formats.",
        `public class Main {
    public static void main(String[] args) {
        int age = Integer.parseInt("21");
        double price = Double.parseDouble("99.5");
        System.out.println(age + 1);
        System.out.println(price * 2);
    }
}`
      ),
      section(
        "Annotations",
        "Annotations attach metadata to code that tools and the compiler can use. A common beginner example is @Override, which helps the compiler confirm that a method really overrides a parent method.",
        `public class Main {
    static class Parent {
        void show() {
            System.out.println("Parent");
        }
    }

    static class Child extends Parent {
        @Override
        void show() {
            System.out.println("Child");
        }
    }

    public static void main(String[] args) {
        new Child().show();
    }
}`
      ),
    ],
  },
  ch13: {
    chapter_id: "ch13",
    title: "I/O, Try-with-Resources, and Other Topics",
    sections: [
      section(
        "try-with-resources",
        "try-with-resources is especially useful in I/O code because files and streams must be closed reliably. The JVM automatically closes each declared resource in reverse order when the block finishes.",
        `class ReaderResource implements AutoCloseable {
    public void close() {
        System.out.println("Closed");
    }
}

public class Main {
    public static void main(String[] args) {
        try (ReaderResource resource = new ReaderResource()) {
            System.out.println("Reading data");
        }
    }
}`
      ),
      section(
        "Multi-catch",
        "Multi-catch lets one catch block handle several exception types that need the same response. It keeps code shorter and avoids repeating identical recovery logic.",
        `public class Main {
    public static void main(String[] args) {
        try {
            if (args.length == 0) {
                throw new IllegalArgumentException("Missing input");
            }
            int value = Integer.parseInt(args[0]);
            System.out.println(value);
        } catch (IllegalArgumentException | ArrayIndexOutOfBoundsException e) {
            System.out.println("Input problem: " + e.getMessage());
        }
    }
}`
      ),
      section(
        "final Variables",
        "A final variable can be assigned only once, which makes constants safer and easier to understand. final is commonly used for values such as rates, IDs, and object references that should not change after initialization.",
        `public class Main {
    public static void main(String[] args) {
        final double PI = 3.14159;
        final String school = "Codexa";
        System.out.println(PI);
        System.out.println(school);
    }
}`
      ),
      section(
        "instanceof Pattern Matching",
        "Pattern matching for instanceof combines type checking and casting into one step. If the test succeeds, Java creates a typed variable that is ready to use inside the same branch.",
        `public class Main {
    public static void main(String[] args) {
        Object value = "Java";
        if (value instanceof String text) {
            System.out.println(text.toUpperCase());
        }
    }
}`
      ),
      section(
        "AutoCloseable",
        "Any class that implements AutoCloseable can be used in a try-with-resources statement. This makes it easy to build your own resource types that clean themselves up in a predictable way.",
        `class Session implements AutoCloseable {
    void open() {
        System.out.println("Session open");
    }

    public void close() {
        System.out.println("Session closed");
    }
}

public class Main {
    public static void main(String[] args) {
        try (Session session = new Session()) {
            session.open();
        }
    }
}`
      ),
    ],
  },
  ch14: {
    chapter_id: "ch14",
    title: "Generics",
    sections: [
      section(
        "Generic Classes",
        "A generic class works with a type parameter so the same class can store different kinds of data safely. It reduces casting and catches type mistakes at compile time.",
        `public class Main {
    static class Box<T> {
        private final T value;

        Box(T value) {
            this.value = value;
        }

        T getValue() {
            return value;
        }
    }

    public static void main(String[] args) {
        Box<String> box = new Box<>("Java");
        System.out.println(box.getValue());
    }
}`
      ),
      section(
        "Generic Methods",
        "A generic method declares its own type parameter and can work with many data types without being tied to one class type. This is useful for utility methods such as printing, comparing, or copying values.",
        `public class Main {
    static <T> void printTwice(T value) {
        System.out.println(value);
        System.out.println(value);
    }

    public static void main(String[] args) {
        printTwice(25);
        printTwice("Hello");
    }
}`
      ),
      section(
        "Bounded Type Parameters",
        "A bounded type parameter restricts the allowed types to those that extend a particular class or interface. This lets generic code use methods that are guaranteed to exist on those types.",
        `public class Main {
    static <T extends Number> double square(T value) {
        double number = value.doubleValue();
        return number * number;
    }

    public static void main(String[] args) {
        System.out.println(square(4));
        System.out.println(square(2.5));
    }
}`
      ),
      section(
        "Wildcards",
        "Wildcards make generic methods more flexible when the exact type is not important. ? extends reads from a family of types safely, while ? super is useful when writing values into a structure.",
        `import java.util.Arrays;
import java.util.List;

public class Main {
    static void printAll(List<?> items) {
        for (Object item : items) {
            System.out.println(item);
        }
    }

    public static void main(String[] args) {
        printAll(Arrays.asList(1, 2, 3));
        printAll(Arrays.asList("A", "B"));
    }
}`
      ),
      section(
        "Type Erasure",
        "Java implements generics through type erasure, which means most type-parameter information is removed at runtime. This is why ArrayList<String> and ArrayList<Integer> are the same raw class while still getting compile-time type checks.",
        `import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> names = new ArrayList<>();
        ArrayList<Integer> scores = new ArrayList<>();
        System.out.println(names.getClass() == scores.getClass());
    }
}`
      ),
    ],
  },
  ch15: {
    chapter_id: "ch15",
    title: "Lambda Expressions",
    sections: [
      section(
        "Functional Interfaces",
        "A functional interface has exactly one abstract method, which makes it compatible with lambda expressions. Many built-in Java APIs use this idea to accept behavior as data.",
        `public class Main {
    interface Greeting {
        void say(String name);
    }

    public static void main(String[] args) {
        Greeting greeting = name -> System.out.println("Hello, " + name);
        greeting.say("Mira");
    }
}`
      ),
      section(
        "Lambda Syntax",
        "A lambda expression provides a compact way to write a small block of behavior. It includes parameters, an arrow, and the expression or block to run.",
        `public class Main {
    interface MathOperation {
        int apply(int a, int b);
    }

    public static void main(String[] args) {
        MathOperation multiply = (a, b) -> a * b;
        System.out.println(multiply.apply(4, 6));
    }
}`
      ),
      section(
        "Method References",
        "A method reference is a shorter form of lambda when an existing method already does the work you want. It improves readability by naming the method directly instead of wrapping it in another lambda body.",
        `import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Asha", "Dev", "Rohan");
        names.forEach(System.out::println);
    }
}`
      ),
      section(
        "Built-in Functional Interfaces",
        "Java provides common functional interfaces in java.util.function, such as Predicate, Function, Consumer, and Supplier. These save you from writing custom interfaces for many everyday tasks.",
        `import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        Predicate<Integer> isEven = number -> number % 2 == 0;
        System.out.println(isEven.test(8));
        System.out.println(isEven.test(5));
    }
}`
      ),
      section(
        "Lambda with Collections",
        "Lambdas are especially useful with collections because they make filtering, sorting, and processing shorter. Even simple operations like removing items or sorting strings become easier to read.",
        `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> names = new ArrayList<>();
        names.add("Zara");
        names.add("Aman");
        names.add("Neel");
        Collections.sort(names, (a, b) -> a.compareTo(b));
        System.out.println(names);
    }
}`
      ),
    ],
  },
  ch16: {
    chapter_id: "ch16",
    title: "Modules",
    sections: [
      section(
        "module-info.java",
        "A module uses a module-info.java descriptor to declare its name and dependencies. This file acts like a summary of what the module needs and what it chooses to expose.",
        `module school.app {
    requires java.base;
}`
      ),
      section(
        "requires",
        "The requires statement tells Java that a module depends on another named module. Without it, code in one module cannot access packages exported by another module.",
        `module reporting.app {
    requires java.sql;
}`
      ),
      section(
        "exports",
        "exports makes one of a module’s packages available to other modules. If a package is not exported, code outside the module cannot use its public types through the module system.",
        `module library.app {
    exports com.codexa.study;
}`
      ),
      section(
        "Module Path vs Classpath",
        "The classpath is the older way to locate classes and JAR files, while the module path is used for named modules with descriptors. Modules add stronger boundaries and more reliable dependency checking than the traditional classpath model.",
        `// Compile on the classpath:
// javac Main.java
//
// Compile on the module path:
// javac --module-path mods -d out src/module-info.java src/com/example/Main.java`
      ),
      section(
        "opens",
        "opens allows reflective access to a package, which is useful for frameworks that inspect fields or constructors at runtime. Unlike exports, opens is mainly about reflection rather than normal compile-time access.",
        `module app.core {
    opens com.codexa.model to framework.module;
}`
      ),
    ],
  },
  ch17: {
    chapter_id: "ch17",
    title: "Switch Expressions, Records, and Recently Added Features",
    sections: [
      section(
        "Switch Expressions",
        "Modern switch expressions can return a value directly, which often makes code shorter and clearer. Arrow labels also remove the need for break in many common cases.",
        `public class Main {
    public static void main(String[] args) {
        int day = 6;
        String type = switch (day) {
            case 6, 7 -> "Weekend";
            default -> "Weekday";
        };
        System.out.println(type);
    }
}`
      ),
      section(
        "Text Blocks",
        "Text blocks make multi-line strings easier to read because they avoid repeated escape characters and string concatenation. They are useful for formatted messages, HTML, or JSON snippets.",
        `public class Main {
    public static void main(String[] args) {
        String message = """
                Java Study Plan
                - Operators
                - Classes
                - Streams
                """;
        System.out.println(message);
    }
}`
      ),
      section(
        "Pattern Matching for instanceof",
        "Pattern matching improves instanceof by introducing a typed variable only when the test succeeds. This removes the extra cast and keeps the code focused on the real logic.",
        `public class Main {
    public static void main(String[] args) {
        Object item = "codexa";
        if (item instanceof String text) {
            System.out.println(text.length());
        }
    }
}`
      ),
      section(
        "Records",
        "A record is a compact way to model simple data carriers whose main job is to hold values. Java automatically provides a constructor, accessors, equals, hashCode, and toString for record components.",
        `public class Main {
    record Student(String name, int marks) { }

    public static void main(String[] args) {
        Student student = new Student("Kiran", 92);
        System.out.println(student.name());
        System.out.println(student);
    }
}`
      ),
      section(
        "Sealed Classes",
        "A sealed class restricts which classes are allowed to extend it. This gives you tighter control over an inheritance hierarchy and makes the set of valid subtypes explicit.",
        `sealed class Shape permits Circle, Square { }

final class Circle extends Shape { }
final class Square extends Shape { }

public class Main {
    public static void main(String[] args) {
        Shape shape = new Circle();
        System.out.println(shape.getClass().getSimpleName());
    }
}`
      ),
    ],
  },
  ch18: {
    chapter_id: "ch18",
    title: "String Handling",
    sections: [
      section(
        "String Immutability",
        "Strings are immutable, which means their contents cannot change after creation. Methods that seem to modify a string actually create a new String object and leave the original unchanged.",
        `public class Main {
    public static void main(String[] args) {
        String name = "Java";
        String upper = name.toUpperCase();
        System.out.println(name);
        System.out.println(upper);
    }
}`
      ),
      section(
        "Common String Methods",
        "The String class offers many helper methods for searching, slicing, and transforming text. Methods like length, charAt, substring, and contains are fundamental for beginner programs.",
        `public class Main {
    public static void main(String[] args) {
        String text = "Learn Java";
        System.out.println(text.length());
        System.out.println(text.charAt(0));
        System.out.println(text.substring(6));
        System.out.println(text.contains("Java"));
    }
}`
      ),
      section(
        "StringBuilder",
        "StringBuilder is a mutable sequence of characters designed for efficient repeated changes. It is usually the better choice when you are building a string inside a loop.",
        `public class Main {
    public static void main(String[] args) {
        StringBuilder builder = new StringBuilder();
        builder.append("Java");
        builder.append(" ");
        builder.append("Tutor");
        System.out.println(builder.toString());
    }
}`
      ),
      section(
        "StringBuffer",
        "StringBuffer is similar to StringBuilder but its methods are synchronized. That extra thread safety can be useful in shared-thread situations, though StringBuilder is usually faster for single-threaded code.",
        `public class Main {
    public static void main(String[] args) {
        StringBuffer buffer = new StringBuffer("Safe");
        buffer.append(" Text");
        System.out.println(buffer);
    }
}`
      ),
      section(
        "String Comparisons",
        "Use equals to compare the contents of strings and compareTo when you need alphabetical ordering. The == operator compares object references, so it should not be used for general text comparison.",
        `public class Main {
    public static void main(String[] args) {
        String a = new String("Java");
        String b = new String("Java");
        System.out.println(a.equals(b));
        System.out.println(a.compareTo("Javb"));
    }
}`
      ),
    ],
  },
  ch19: {
    chapter_id: "ch19",
    title: "Exploring java.lang",
    sections: [
      section(
        "The Object Class",
        "java.lang.Object sits at the top of Java’s class hierarchy. Its methods provide common behavior that every class can inherit or customize.",
        `public class Main {
    static class Item {
        int id;

        Item(int id) {
            this.id = id;
        }

        @Override
        public boolean equals(Object obj) {
            if (!(obj instanceof Item other)) {
                return false;
            }
            return id == other.id;
        }
    }

    public static void main(String[] args) {
        System.out.println(new Item(1).equals(new Item(1)));
    }
}`
      ),
      section(
        "Math",
        "The Math class provides useful static methods for common calculations such as rounding, powers, roots, and absolute values. Because its methods are static, you call them with Math.methodName rather than creating an object.",
        `public class Main {
    public static void main(String[] args) {
        System.out.println(Math.sqrt(81));
        System.out.println(Math.pow(2, 5));
        System.out.println(Math.round(4.6));
    }
}`
      ),
      section(
        "System and Runtime",
        "System gives access to standard input and output, system properties, and utility methods such as currentTimeMillis. Runtime provides information about the JVM environment and can be used to inspect memory or available processors.",
        `public class Main {
    public static void main(String[] args) {
        System.out.println(System.getProperty("java.version"));
        Runtime runtime = Runtime.getRuntime();
        System.out.println(runtime.availableProcessors());
    }
}`
      ),
      section(
        "Wrapper Classes",
        "Wrapper classes in java.lang turn primitive values into objects and offer useful parsing and conversion methods. They are heavily used when primitives need to interact with collections or generic APIs.",
        `public class Main {
    public static void main(String[] args) {
        Integer number = Integer.valueOf(42);
        Boolean flag = Boolean.valueOf("true");
        System.out.println(number.intValue() + 8);
        System.out.println(flag);
    }
}`
      ),
      section(
        "Comparable and Cloneable",
        "Comparable lets objects define their natural ordering through compareTo, which is useful for sorting. Cloneable marks a class as supporting object copying through clone, though many modern programs prefer constructors or factory methods for copying.",
        `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    static class Student implements Comparable<Student> {
        String name;

        Student(String name) {
            this.name = name;
        }

        public int compareTo(Student other) {
            return name.compareTo(other.name);
        }

        public String toString() {
            return name;
        }
    }

    public static void main(String[] args) {
        ArrayList<Student> students = new ArrayList<>();
        students.add(new Student("Zoya"));
        students.add(new Student("Aarav"));
        Collections.sort(students);
        System.out.println(students);
    }
}`
      ),
    ],
  },
  ch20: {
    chapter_id: "ch20",
    title: "java.util Part 1: The Collections Framework",
    sections: [
      section(
        "Collection Hierarchy",
        "The Collections Framework organizes reusable data structures such as lists, sets, queues, and maps. Choosing the right branch of the hierarchy helps you match the structure to the problem you are solving.",
        `import java.util.ArrayList;
import java.util.Collection;

public class Main {
    public static void main(String[] args) {
        Collection<String> items = new ArrayList<>();
        items.add("Book");
        items.add("Pen");
        System.out.println(items.size());
    }
}`
      ),
      section(
        "List Implementations",
        "A List keeps elements in order and allows duplicates. ArrayList is fast for indexed access, while LinkedList is designed for efficient insertions and removals in the middle or at the ends.",
        `import java.util.ArrayList;
import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> cities = new ArrayList<>();
        cities.add("Delhi");
        cities.add("Pune");

        LinkedList<String> queue = new LinkedList<>();
        queue.add("First");
        queue.add("Second");

        System.out.println(cities.get(1));
        System.out.println(queue.getFirst());
    }
}`
      ),
      section(
        "Set Implementations",
        "A Set stores unique elements and ignores duplicates. HashSet focuses on fast lookups, while TreeSet keeps the elements sorted.",
        `import java.util.HashSet;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        HashSet<String> tags = new HashSet<>();
        tags.add("java");
        tags.add("java");
        tags.add("oop");

        TreeSet<Integer> scores = new TreeSet<>();
        scores.add(70);
        scores.add(50);
        scores.add(90);

        System.out.println(tags);
        System.out.println(scores);
    }
}`
      ),
      section(
        "Map Implementations",
        "A Map stores key-value pairs instead of single values. HashMap is the common general-purpose choice, while TreeMap keeps keys in sorted order.",
        `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        HashMap<String, Integer> marks = new HashMap<>();
        marks.put("Asha", 91);
        marks.put("Ravi", 84);
        System.out.println(marks.get("Asha"));
    }
}`
      ),
      section(
        "Iteration and Utilities",
        "Collections can be traversed with iterators, enhanced for loops, or utility methods from the Collections class. Utility methods such as sort, reverse, and shuffle save you from rewriting common operations.",
        `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>();
        numbers.add(30);
        numbers.add(10);
        numbers.add(20);
        Collections.sort(numbers);
        for (int number : numbers) {
            System.out.println(number);
        }
    }
}`
      ),
    ],
  },
  ch21: {
    chapter_id: "ch21",
    title: "java.util Part 2: More Utility Classes",
    sections: [
      section(
        "StringTokenizer",
        "StringTokenizer splits a string into smaller tokens using separators such as spaces or commas. It is an older utility, but it still shows the basic idea of breaking text into manageable parts.",
        `import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) {
        StringTokenizer tokenizer = new StringTokenizer("red,green,blue", ",");
        while (tokenizer.hasMoreTokens()) {
            System.out.println(tokenizer.nextToken());
        }
    }
}`
      ),
      section(
        "Optional",
        "Optional represents a value that may or may not be present. It encourages you to handle missing data explicitly instead of risking a NullPointerException.",
        `import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        Optional<String> name = Optional.of("Java");
        Optional<String> empty = Optional.empty();
        System.out.println(name.orElse("Unknown"));
        System.out.println(empty.orElse("Unknown"));
    }
}`
      ),
      section(
        "Date and Calendar",
        "Date represents a point in time, and Calendar offers field-based access such as year, month, and day. These older classes still appear in existing code, though newer programs often prefer java.time.",
        `import java.util.Calendar;
import java.util.Date;

public class Main {
    public static void main(String[] args) {
        Date now = new Date();
        Calendar calendar = Calendar.getInstance();
        System.out.println(now);
        System.out.println(calendar.get(Calendar.YEAR));
    }
}`
      ),
      section(
        "Formatter",
        "Formatter creates formatted text using placeholders similar to printf. It is useful when you want clean numeric output, aligned columns, or readable reports.",
        `import java.util.Formatter;

public class Main {
    public static void main(String[] args) {
        Formatter formatter = new Formatter();
        formatter.format("Name: %s, Marks: %.1f", "Neha", 87.5);
        System.out.println(formatter);
        formatter.close();
    }
}`
      ),
      section(
        "Scanner",
        "Scanner reads tokens from input sources such as the keyboard, strings, or files. It is beginner-friendly because it can parse numbers and words with methods like nextInt and nextLine.",
        `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner("45 55");
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b);
        scanner.close();
    }
}`
      ),
    ],
  },
  ch22: {
    chapter_id: "ch22",
    title: "Input/Output: Exploring java.io",
    sections: [
      section(
        "Streams",
        "The java.io package is built around streams, which represent flows of bytes or characters. Input streams read data into a program, and output streams send data out.",
        `import java.io.ByteArrayInputStream;

public class Main {
    public static void main(String[] args) throws Exception {
        byte[] data = {65, 66, 67};
        ByteArrayInputStream input = new ByteArrayInputStream(data);
        System.out.println((char) input.read());
        input.close();
    }
}`
      ),
      section(
        "File",
        "The File class represents file and directory paths and provides basic information about them. It can tell you whether something exists, whether it is a file or folder, and what its name is.",
        `import java.io.File;

public class Main {
    public static void main(String[] args) {
        File file = new File("notes.txt");
        System.out.println(file.getName());
        System.out.println(file.exists());
    }
}`
      ),
      section(
        "BufferedReader and BufferedWriter",
        "BufferedReader and BufferedWriter add buffering to character-based I/O so reads and writes happen efficiently. They are commonly used for line-based text processing.",
        `import java.io.BufferedReader;
import java.io.StringReader;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new StringReader("Java\\nTutor"));
        System.out.println(reader.readLine());
        System.out.println(reader.readLine());
        reader.close();
    }
}`
      ),
      section(
        "PrintWriter",
        "PrintWriter makes it easy to write formatted text using print, println, and printf-style methods. It is convenient for producing readable text output to files or other character destinations.",
        `import java.io.PrintWriter;
import java.io.StringWriter;

public class Main {
    public static void main(String[] args) {
        StringWriter output = new StringWriter();
        PrintWriter writer = new PrintWriter(output);
        writer.println("Hello");
        writer.printf("Marks: %d", 90);
        writer.flush();
        System.out.println(output);
    }
}`
      ),
      section(
        "Serialization",
        "Serialization converts an object into a byte stream so it can be stored or sent and later rebuilt. A class must implement Serializable for Java’s built-in object serialization mechanism to handle it.",
        `import java.io.Serializable;

public class Main {
    static class Student implements Serializable {
        String name = "Anvi";
        int marks = 88;
    }

    public static void main(String[] args) {
        Student student = new Student();
        System.out.println(student.name + " " + student.marks);
    }
}`
      ),
    ],
  },
  ch23: {
    chapter_id: "ch23",
    title: "Exploring NIO",
    sections: [
      section(
        "Paths and Files",
        "NIO uses Path objects to represent file-system locations in a modern, flexible way. The Files utility class then performs common operations such as checking existence, reading text, or copying files.",
        `import java.nio.file.Path;

public class Main {
    public static void main(String[] args) {
        Path path = Path.of("data", "notes.txt");
        System.out.println(path.getFileName());
        System.out.println(path.toAbsolutePath());
    }
}`
      ),
      section(
        "Files Utilities",
        "The Files class contains many static helper methods for everyday file work. It can read strings, write data, list directories, and query file properties without manually managing streams in simple cases.",
        `import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    public static void main(String[] args) {
        Path path = Path.of("sample.txt");
        System.out.println(Files.exists(path));
        System.out.println(Files.isDirectory(path));
    }
}`
      ),
      section(
        "Buffers",
        "Buffers are containers used by NIO to hold data while it moves between a program and a channel. They keep track of positions, limits, and capacity so you can read and write efficiently.",
        `import java.nio.ByteBuffer;

public class Main {
    public static void main(String[] args) {
        ByteBuffer buffer = ByteBuffer.allocate(4);
        buffer.put((byte) 65);
        buffer.flip();
        System.out.println((char) buffer.get());
    }
}`
      ),
      section(
        "Channels",
        "Channels are NIO connections for reading and writing data, often working together with buffers. They can represent files, sockets, and other I/O endpoints in a more structured way than classic streams.",
        `import java.io.ByteArrayInputStream;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;

public class Main {
    public static void main(String[] args) throws Exception {
        ByteArrayInputStream input = new ByteArrayInputStream(new byte[]{70});
        ReadableByteChannel channel = Channels.newChannel(input);
        System.out.println(channel.isOpen());
        channel.close();
    }
}`
      ),
      section(
        "NIO.2 File Operations",
        "NIO.2 expanded Java’s file support with better path handling, directory walking, and copy or move operations. These utilities make modern file-system tasks easier to express than older java.io code.",
        `import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class Main {
    public static void main(String[] args) {
        Path source = Path.of("source.txt");
        Path target = Path.of("backup.txt");
        System.out.println(source);
        System.out.println(target);
        System.out.println(StandardCopyOption.REPLACE_EXISTING);
    }
}`
      ),
    ],
  },
  ch24: {
    chapter_id: "ch24",
    title: "Networking",
    sections: [
      section(
        "InetAddress",
        "InetAddress represents an IP address or host name. It is often the first step in basic networking because it lets a program resolve host names and inspect address information.",
        `import java.net.InetAddress;

public class Main {
    public static void main(String[] args) throws Exception {
        InetAddress address = InetAddress.getByName("localhost");
        System.out.println(address.getHostName());
        System.out.println(address.getHostAddress());
    }
}`
      ),
      section(
        "Socket and ServerSocket",
        "A Socket handles a client-side network connection, and a ServerSocket waits for incoming client requests. Together they form the basis of many TCP client-server programs.",
        `import java.net.ServerSocket;
import java.net.Socket;

public class Main {
    public static void main(String[] args) throws Exception {
        try (ServerSocket server = new ServerSocket(0)) {
            int port = server.getLocalPort();
            try (Socket client = new Socket("localhost", port)) {
                System.out.println("Connected on port " + port);
            } catch (Exception e) {
                System.out.println("Client example created for port " + port);
            }
        }
    }
}`
      ),
      section(
        "URL and URI",
        "A URL identifies the location of a resource, while a URI is a more general identifier syntax that can describe many kinds of resources. In practice, Java often uses URI for parsing and URL for resource access.",
        `import java.net.URI;
import java.net.URL;

public class Main {
    public static void main(String[] args) throws Exception {
        URI uri = new URI("https://example.com/docs?id=7");
        URL url = uri.toURL();
        System.out.println(uri.getHost());
        System.out.println(url.getProtocol());
    }
}`
      ),
      section(
        "URLConnection",
        "URLConnection is a general API for communicating with a resource identified by a URL. It can be used to inspect metadata such as content type or to open input and output streams for the resource.",
        `import java.net.URL;
import java.net.URLConnection;

public class Main {
    public static void main(String[] args) throws Exception {
        URL url = new URL("https://example.com");
        URLConnection connection = url.openConnection();
        System.out.println(connection.getURL());
    }
}`
      ),
      section(
        "HttpClient",
        "HttpClient is Java’s modern API for sending HTTP requests and receiving responses. It supports synchronous and asynchronous calls and is more convenient than older networking approaches for web communication.",
        `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;

public class Main {
    public static void main(String[] args) {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://example.com")).GET().build();
        System.out.println(client.getClass().getSimpleName());
        System.out.println(request.uri());
    }
}`
      ),
    ],
  },
  ch25: {
    chapter_id: "ch25",
    title: "Event Handling",
    sections: [
      section(
        "Delegation Event Model",
        "Java’s event system uses the delegation event model, where a source creates an event and sends it to listener objects. This keeps event-producing components separate from the code that responds to those events.",
        `import java.awt.Button;
import java.awt.Frame;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class Main extends Frame {
    public Main() {
        Button button = new Button("Click");
        button.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println("Event handled");
            }
        });
        add(button);
    }

    public static void main(String[] args) {
        new Main();
    }
}`
      ),
      section(
        "Event Sources and Listeners",
        "An event source is the component that generates events, and a listener is the object that handles them. You connect them by registering the listener with the source.",
        `import java.awt.Button;
import java.awt.event.ActionListener;

public class Main {
    public static void main(String[] args) {
        Button button = new Button("Save");
        ActionListener listener = e -> System.out.println("Saved");
        button.addActionListener(listener);
        System.out.println("Listener attached");
    }
}`
      ),
      section(
        "ActionEvent and ActionListener",
        "ActionEvent represents common command-style actions such as button clicks. ActionListener receives those events through its single actionPerformed method.",
        `import java.awt.Button;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class Main {
    public static void main(String[] args) {
        Button button = new Button("Run");
        button.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e) {
                System.out.println(e.getActionCommand());
            }
        });
        System.out.println("Action listener ready");
    }
}`
      ),
      section(
        "MouseEvent and KeyEvent",
        "MouseEvent reports actions such as clicks and movement, while KeyEvent reports keyboard input. These events allow GUI programs to react to direct user interaction with the screen and keyboard.",
        `import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;

public class Main {
    public static void main(String[] args) {
        System.out.println(MouseEvent.MOUSE_CLICKED);
        System.out.println(KeyEvent.VK_ENTER);
    }
}`
      ),
      section(
        "Adapter Classes",
        "Adapter classes provide empty method bodies for listener interfaces that have many methods. You extend the adapter and override only the event methods you actually need.",
        `import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

public class Main {
    static class MyMouseHandler extends MouseAdapter {
        @Override
        public void mouseClicked(MouseEvent e) {
            System.out.println("Mouse clicked");
        }
    }

    public static void main(String[] args) {
        new MyMouseHandler();
        System.out.println("Adapter created");
    }
}`
      ),
    ],
  },
  ch26: {
    chapter_id: "ch26",
    title: "Introducing the AWT: Windows, Graphics, and Text",
    sections: [
      section(
        "Components and Containers",
        "In AWT, components are visible controls such as buttons and labels, while containers hold and arrange those components. Building a GUI usually means placing components inside containers such as Frame or Panel.",
        `import java.awt.Button;
import java.awt.Frame;
import java.awt.Panel;

public class Main {
    public static void main(String[] args) {
        Frame frame = new Frame("Demo");
        Panel panel = new Panel();
        panel.add(new Button("OK"));
        frame.add(panel);
        System.out.println("Component added to container");
    }
}`
      ),
      section(
        "Frame",
        "Frame is a top-level AWT window that can hold controls, drawings, and layout-managed content. It is one of the simplest ways to create a desktop window in classic Java GUI programming.",
        `import java.awt.Frame;

public class Main {
    public static void main(String[] args) {
        Frame frame = new Frame("AWT Frame");
        frame.setSize(300, 200);
        System.out.println(frame.getTitle());
    }
}`
      ),
      section(
        "Graphics, Color, Font",
        "The Graphics class draws shapes and text, while Color and Font control appearance. These classes work together whenever you need custom visual output inside a component.",
        `import java.awt.Color;
import java.awt.Font;

public class Main {
    public static void main(String[] args) {
        Color color = Color.BLUE;
        Font font = new Font("Dialog", Font.BOLD, 18);
        System.out.println(color);
        System.out.println(font.getName());
    }
}`
      ),
      section(
        "Canvas and paint()",
        "Canvas is a blank area meant for custom drawing. You override paint to tell Java how to render graphics whenever the component needs to be displayed or refreshed.",
        `import java.awt.Canvas;
import java.awt.Graphics;

public class Main extends Canvas {
    public void paint(Graphics g) {
        g.drawString("Hello AWT", 20, 30);
    }

    public static void main(String[] args) {
        new Main();
        System.out.println("Canvas ready");
    }
}`
      ),
      section(
        "Text Rendering",
        "AWT can draw text directly onto components using the current font and color. This is useful for labels inside custom drawings, charts, or simple game interfaces.",
        `import java.awt.Canvas;
import java.awt.Graphics;

public class Main extends Canvas {
    public void paint(Graphics g) {
        g.drawString("Study Mode", 40, 40);
    }

    public static void main(String[] args) {
        new Main();
        System.out.println("Text rendering example");
    }
}`
      ),
    ],
  },
  ch27: {
    chapter_id: "ch27",
    title: "Using AWT Controls, Layout Managers, and Menus",
    sections: [
      section(
        "AWT Controls",
        "AWT provides ready-made controls such as Button, Checkbox, Choice, and List. These controls save time because they already know how to display themselves and participate in event handling.",
        `import java.awt.Button;
import java.awt.Checkbox;
import java.awt.Choice;

public class Main {
    public static void main(String[] args) {
        Button button = new Button("Submit");
        Checkbox checkbox = new Checkbox("Java");
        Choice choice = new Choice();
        choice.add("Beginner");
        System.out.println(button.getLabel());
        System.out.println(checkbox.getLabel());
        System.out.println(choice.getItem(0));
    }
}`
      ),
      section(
        "Text Components",
        "TextField is used for single-line input and TextArea is used for larger multi-line text. These components are common in forms, editors, and chat-style interfaces.",
        `import java.awt.TextArea;
import java.awt.TextField;

public class Main {
    public static void main(String[] args) {
        TextField nameField = new TextField("Riya");
        TextArea notes = new TextArea("Java notes");
        System.out.println(nameField.getText());
        System.out.println(notes.getText());
    }
}`
      ),
      section(
        "Layout Managers",
        "Layout managers automatically position components inside containers. They help GUI designs adapt better than fixed coordinates when window sizes or component counts change.",
        `import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.Frame;

public class Main {
    public static void main(String[] args) {
        Frame frame = new Frame("Layouts");
        frame.setLayout(new FlowLayout());
        System.out.println(frame.getLayout().getClass().getSimpleName());
        frame.setLayout(new BorderLayout());
        System.out.println(frame.getLayout().getClass().getSimpleName());
    }
}`
      ),
      section(
        "Menus",
        "Menus organize commands into labeled groups at the top of a window. AWT provides MenuBar, Menu, and MenuItem to build basic desktop-style menus.",
        `import java.awt.Frame;
import java.awt.Menu;
import java.awt.MenuBar;
import java.awt.MenuItem;

public class Main {
    public static void main(String[] args) {
        Frame frame = new Frame("Menu Demo");
        MenuBar bar = new MenuBar();
        Menu file = new Menu("File");
        file.add(new MenuItem("Open"));
        bar.add(file);
        frame.setMenuBar(bar);
        System.out.println(file.getItem(0).getLabel());
    }
}`
      ),
      section(
        "Dialogs",
        "Dialogs are temporary windows used to show messages, gather input, or confirm actions. They are often used for alerts, file operations, and simple option selection.",
        `import java.awt.Dialog;
import java.awt.Frame;

public class Main {
    public static void main(String[] args) {
        Frame owner = new Frame("Owner");
        Dialog dialog = new Dialog(owner, "Warning", true);
        dialog.setSize(200, 100);
        System.out.println(dialog.getTitle());
    }
}`
      ),
    ],
  },
  ch28: {
    chapter_id: "ch28",
    title: "Images",
    sections: [
      section(
        "Loading Images",
        "Java can load images for display in GUI programs, games, and drawing tools. AWT components often obtain an Image through Toolkit or other image-loading helpers.",
        `import java.awt.Image;
import java.awt.Toolkit;

public class Main {
    public static void main(String[] args) {
        Image image = Toolkit.getDefaultToolkit().getImage("logo.png");
        System.out.println(image);
    }
}`
      ),
      section(
        "ImageObserver and MediaTracker",
        "ImageObserver helps AWT report image loading progress, and MediaTracker waits until images are fully prepared. They are useful when images load asynchronously and the program must know when drawing is safe.",
        `import java.awt.Frame;
import java.awt.MediaTracker;
import java.awt.Toolkit;

public class Main {
    public static void main(String[] args) {
        Frame frame = new Frame();
        MediaTracker tracker = new MediaTracker(frame);
        tracker.addImage(Toolkit.getDefaultToolkit().getImage("logo.png"), 1);
        System.out.println("Image registered with tracker");
    }
}`
      ),
      section(
        "BufferedImage",
        "BufferedImage stores image data in memory and is useful for direct pixel work or off-screen drawing. It is commonly used when a program needs to generate or edit an image instead of only displaying one.",
        `import java.awt.image.BufferedImage;

public class Main {
    public static void main(String[] args) {
        BufferedImage image = new BufferedImage(100, 50, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, 0x00FF00);
        System.out.println(image.getWidth() + "x" + image.getHeight());
    }
}`
      ),
      section(
        "ImageIO",
        "ImageIO reads and writes common image formats such as PNG and JPG. It is one of the easiest ways to move image data between files and BufferedImage objects.",
        `import java.io.File;
import javax.imageio.ImageIO;

public class Main {
    public static void main(String[] args) {
        System.out.println(ImageIO.getReaderFormatNames()[0]);
        System.out.println(new File("picture.png").getName());
    }
}`
      ),
      section(
        "Image Transformations",
        "Image transformations change the way an image is displayed, such as scaling, rotating, or translating it. Java performs these operations through graphics APIs that apply geometric changes during drawing.",
        `import java.awt.geom.AffineTransform;

public class Main {
    public static void main(String[] args) {
        AffineTransform transform = new AffineTransform();
        transform.scale(2.0, 2.0);
        transform.rotate(Math.toRadians(45));
        System.out.println(transform);
    }
}`
      ),
    ],
  },
  ch29: {
    chapter_id: "ch29",
    title: "The Concurrency Utilities",
    sections: [
      section(
        "ExecutorService",
        "ExecutorService manages a pool of worker threads so you can submit tasks without creating each thread manually. This makes concurrent programs easier to scale and control.",
        `import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) {
        ExecutorService service = Executors.newSingleThreadExecutor();
        service.submit(() -> System.out.println("Task executed"));
        service.shutdown();
    }
}`
      ),
      section(
        "Callable and Future",
        "Callable is like Runnable but it can return a result and throw checked exceptions. Future represents the pending result so you can retrieve it later or check whether the task has finished.",
        `import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class Main {
    public static void main(String[] args) throws Exception {
        Callable<Integer> task = () -> 7 * 6;
        Future<Integer> future = Executors.newSingleThreadExecutor().submit(task);
        System.out.println(future.get());
    }
}`
      ),
      section(
        "Locks",
        "Lock objects from java.util.concurrent.locks give explicit control over mutual exclusion. They can be more flexible than synchronized blocks when advanced locking patterns are needed.",
        `import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class Main {
    public static void main(String[] args) {
        Lock lock = new ReentrantLock();
        lock.lock();
        try {
            System.out.println("Locked section");
        } finally {
            lock.unlock();
        }
    }
}`
      ),
      section(
        "Synchronizers",
        "Synchronizers are ready-made coordination tools such as CountDownLatch, Semaphore, and CyclicBarrier. They help threads wait for each other or limit access to shared resources without manually building the coordination logic from scratch.",
        `import java.util.concurrent.CountDownLatch;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        CountDownLatch latch = new CountDownLatch(1);
        new Thread(() -> {
            System.out.println("Worker finished");
            latch.countDown();
        }).start();
        latch.await();
        System.out.println("Main continues");
    }
}`
      ),
      section(
        "Concurrent Collections",
        "Concurrent collections are designed for safe use by multiple threads with less manual locking. They are often better than wrapping ordinary collections yourself when many threads share data.",
        `import java.util.concurrent.ConcurrentHashMap;

public class Main {
    public static void main(String[] args) {
        ConcurrentHashMap<String, Integer> scores = new ConcurrentHashMap<>();
        scores.put("Ali", 80);
        scores.put("Sara", 92);
        System.out.println(scores.get("Sara"));
    }
}`
      ),
    ],
  },
  ch30: {
    chapter_id: "ch30",
    title: "The Stream API",
    sections: [
      section(
        "Stream Creation",
        "A stream is a pipeline for processing data from arrays, collections, generators, or files. Creating a stream does not process anything yet; it only sets up the source.",
        `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        long count = Arrays.asList(1, 2, 3, 4).stream().count();
        System.out.println(count);
    }
}`
      ),
      section(
        "Intermediate Operations",
        "Intermediate operations transform a stream into another stream and are evaluated lazily. Common examples include filter, map, sorted, and distinct.",
        `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        Arrays.asList(1, 2, 3, 4, 5)
                .stream()
                .filter(n -> n % 2 == 0)
                .map(n -> n * 10)
                .forEach(System.out::println);
    }
}`
      ),
      section(
        "Terminal Operations",
        "A terminal operation produces the final result or side effect that actually triggers stream processing. Examples include forEach, count, reduce, collect, and anyMatch.",
        `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int total = Arrays.asList(5, 10, 15)
                .stream()
                .reduce(0, Integer::sum);
        System.out.println(total);
    }
}`
      ),
      section(
        "Collectors",
        "Collectors gather stream results into useful forms such as lists, maps, strings, or grouped summaries. They are often used at the end of a pipeline to build a final collection or report.",
        `import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<String> result = Arrays.asList("java", "oop", "loops")
                .stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());
        System.out.println(result);
    }
}`
      ),
      section(
        "Parallel Streams",
        "A parallel stream can split work across multiple threads automatically. It can improve performance for suitable workloads, but it is best used carefully because ordering and shared-state assumptions become more important.",
        `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int sum = Arrays.asList(1, 2, 3, 4, 5, 6)
                .parallelStream()
                .mapToInt(Integer::intValue)
                .sum();
        System.out.println(sum);
    }
}`
      ),
    ],
  },
  ch31: {
    chapter_id: "ch31",
    title: "Regular Expressions and Other Packages",
    sections: [
      section(
        "Pattern and Matcher",
        "Pattern stores a compiled regular expression, and Matcher applies it to a specific input string. This separation makes regex matching more efficient and organized when the same pattern is reused.",
        `import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Main {
    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("\\\\d+");
        Matcher matcher = pattern.matcher("Room 204");
        System.out.println(matcher.find());
        System.out.println(matcher.group());
    }
}`
      ),
      section(
        "Regex Groups",
        "Groups let parts of a regular expression be captured for later use. They are helpful when you want to validate text and also extract meaningful pieces from it.",
        `import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Main {
    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("(\\\\w+)@(\\\\w+\\\\.\\\\w+)");
        Matcher matcher = pattern.matcher("student@codexa.com");
        if (matcher.matches()) {
            System.out.println(matcher.group(1));
            System.out.println(matcher.group(2));
        }
    }
}`
      ),
      section(
        "java.time",
        "The java.time package provides modern date and time classes that are clearer and less error-prone than older APIs. Classes such as LocalDate and LocalTime model dates and times in a readable way.",
        `import java.time.LocalDate;

public class Main {
    public static void main(String[] args) {
        LocalDate examDate = LocalDate.of(2026, 5, 10);
        System.out.println(examDate.getDayOfWeek());
    }
}`
      ),
      section(
        "Reflection",
        "Reflection lets a program inspect classes, methods, and fields at runtime. It is powerful for frameworks and tools, though beginners should use it carefully because it can bypass normal design boundaries.",
        `public class Main {
    static class Student {
        String name;
        void study() { }
    }

    public static void main(String[] args) {
        Class<?> type = Student.class;
        System.out.println(type.getSimpleName());
        System.out.println(type.getDeclaredMethods()[0].getName());
    }
}`
      ),
      section(
        "Other Packages",
        "Java’s standard library includes many other useful packages beyond the core language chapters, such as java.text for formatting and java.net for networking. Learning to browse these packages helps you discover built-in solutions before writing utilities from scratch.",
        `import java.text.NumberFormat;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.US);
        System.out.println(format.format(1499.5));
    }
}`
      ),
    ],
  },
};

const GENERIC_MARKERS = [
  " overview for ",
  " is an important topic in ",
  "Control statements direct program flow using conditions and loops.",
  "Object-oriented concepts like classes, inheritance, and methods organize code and data.",
  "Exceptions represent errors that occur at runtime. try/catch blocks let you handle them gracefully.",
  "Concurrency lets programs run tasks in parallel using threads or executors.",
  "Strings are immutable text objects with many helper methods.",
  "Collections store groups of objects.",
  "Streams process data in pipelines using intermediate and terminal operations.",
  "Java I/O APIs read and write data from files and streams.",
  "Networking APIs handle communication over the network using sockets, URLs, and HTTP clients.",
  "Regular expressions match patterns in text using Pattern and Matcher.",
  'System.out.println("Java topic:',
  'System.out.println(new Person("Lee").name);',
  'System.out.println(Path.of("a", "b"));',
  'Pattern.matches("[a-z]+", "java")',
];

export function isGenericStudyContent(content) {
  const sections = content?.sections;
  if (!Array.isArray(sections) || sections.length === 0) return true;

  return sections.some((sectionItem) => {
    const combined = `${sectionItem?.content ?? ""}\n${sectionItem?.code_example ?? ""}`;
    return GENERIC_MARKERS.some((marker) => combined.includes(marker));
  });
}
