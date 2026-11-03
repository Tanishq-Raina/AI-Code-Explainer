"""Author the v1 datasets. No inference, rendering, compilation or measurements.

Run before freeze only. Frozen manifests refuse subsequent modifications.
Execution-oracle validation is the FIRST phase of the future authorized run.
"""
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
DEST=ROOT/'benchmark_v1'
DEST.mkdir(exist_ok=True)
if (DEST/'FREEZE.json').exists():
    raise SystemExit('Already frozen. Create a new version instead of regenerating v1.')


def program(body,helpers=''):
    tail=''
    if helpers.startswith('TOPLEVEL:'):
        tail=helpers[len('TOPLEVEL:'):];helpers=''
    return 'import java.util.*;\npublic class Main {\n'+helpers+'\npublic static void main(String[] args) {\n'+body+'\n}\n}\n'+tail


bugs=[]
def add(cat,name,bad,good,out,status='CompilationError',exc=None,helpers='',good_helpers=None):
    i=sum(x['category']==cat for x in bugs)+1
    bugs.append({'id':f'{cat}_{i:02d}','category':cat,'name':name,'split':'test',
                 'provenance':'AI-assisted author-constructed; static review; execution validation pending',
                 'code':program(bad,helpers),'reference_code':program(good,helpers if good_helpers is None else good_helpers),
                 'expected_status':status,'expected_exception':exc,'expected_stdout':out,
                 'public_context':{'title':name,'description':name+'. Diagnose the submitted program without giving a complete replacement.'},
                 'intended_change':name,'template_family':f'{cat}_{i:02d}'})

# Distinct defects and contexts, not parameter-only replicas.
add('syntax','Terminate a variable declaration','int age=12\nSystem.out.println(age);','int age=12; System.out.println(age);','12')
add('syntax','Parenthesize an if condition','int x=4; if x>2 {System.out.println(x);}','int x=4; if (x>2) {System.out.println(x);}','4')
add('syntax','Separate for header clauses','for(int i=0, i<2, i++){System.out.println(i);}','for(int i=0; i<2; i++){System.out.println(i);}','0\n1')
add('syntax','Close a method call','System.out.println("ready";','System.out.println("ready");','ready')
add('syntax','Use double quotes for a string','String s=\'hello\'; System.out.println(s);','String s="hello"; System.out.println(s);','hello')
add('syntax','Provide an assignment expression','int n=; System.out.println(n);','int n=9; System.out.println(n);','9')
add('syntax','Write the else keyword','boolean ok=false; if(ok){System.out.println(1);} otherwise {System.out.println(2);}','boolean ok=false; if(ok){System.out.println(1);} else {System.out.println(2);}','2')
add('syntax','Use array initializer braces','int[] a=[2,4]; System.out.println(a[1]);','int[] a={2,4}; System.out.println(a[1]);','4')
add('syntax','Use an equality operator','int x=3; if(x === 3){System.out.println("yes");}','int x=3; if(x == 3){System.out.println("yes");}','yes')
add('syntax','Close the loop body','int i=0; while(i<1){System.out.println(i);i++;','int i=0; while(i<1){System.out.println(i);i++;}','0')

add('scope','Declare the printed identifier','System.out.println(total);','int total=14; System.out.println(total);','14')
add('scope','Keep a conditional result in scope','if(true){int result=6;} System.out.println(result);','int result=0; if(true){result=6;} System.out.println(result);','6')
add('scope','Keep a loop index in scope','for(int i=0;i<2;i++){} System.out.println(i);','int i=0; for(;i<2;i++){} System.out.println(i);','2')
add('scope','Match identifier capitalization','int count=5; System.out.println(Count);','int count=5; System.out.println(count);','5')
add('scope','Declare before use','System.out.println(size); int size=8;','int size=8; System.out.println(size);','8')
add('scope','Initialize a local on every branch','int x; boolean flag=false; if(flag){x=7;} System.out.println(x);','int x=0; boolean flag=false; if(flag){x=7;} System.out.println(x);','0')
add('scope','Avoid duplicate local declarations','int n=2; int n=3; System.out.println(n);','int n=2; n=3; System.out.println(n);','3')
add('scope','Use the catch parameter inside its scope','try{Integer.parseInt("x");}catch(Exception e){} System.out.println(e.getClass().getSimpleName());','try{Integer.parseInt("x");}catch(Exception e){System.out.println(e.getClass().getSimpleName());}','NumberFormatException')
add('scope','Qualify an instance field','Box b=new Box(); System.out.println(value);','Box b=new Box(); System.out.println(b.value);','11',helpers='static class Box {int value=11;}')
add('scope','Keep enhanced loop elements in scope','int[] a={3}; for(int item:a){} System.out.println(item);','int[] a={3}; for(int item:a){System.out.println(item);}','3')

add('types','Convert floating point explicitly','int n=3.8; System.out.println(n);','int n=(int)3.8; System.out.println(n);','3')
add('types','Parse a numeric string','int n="12"; System.out.println(n);','int n=Integer.parseInt("12"); System.out.println(n);','12')
add('types','Keep boolean values boolean','int b=true; System.out.println(b);','boolean b=true; System.out.println(b);','true')
add('types','Distinguish array and element types','int a=new int[]{4}; System.out.println(a[0]);','int[] a=new int[]{4}; System.out.println(a[0]);','4')
add('types','Convert an integer to text','String s=5; System.out.println(s);','String s=String.valueOf(5); System.out.println(s);','5')
add('types','Compare compatible operand types','int n=4; if(n=="4"){System.out.println(n);}','int n=4; if(n==4){System.out.println(n);}','4')
add('types','Construct a string from characters','String s=new char[]{\'h\',\'i\'}; System.out.println(s);','String s=new String(new char[]{\'h\',\'i\'}); System.out.println(s);','hi')
add('types','Construct an integer wrapper from text','Integer n="9"; System.out.println(n);','Integer n=Integer.valueOf("9"); System.out.println(n);','9')
add('types','Respect collection element types','List<Integer> a=new ArrayList<>(); a.add("7"); System.out.println(a);','List<Integer> a=new ArrayList<>(); a.add(7); System.out.println(a);','[7]')
add('types','Use compatible conditional branches','boolean b=true; int n=b?1:"two"; System.out.println(n);','boolean b=true; int n=b?1:2; System.out.println(n);','1')

add('methods','Pass a required method argument','System.out.println(twice());','System.out.println(twice(3));','6',helpers='static int twice(int x){return x*2;}')
add('methods','Pass a compatible method argument','System.out.println(square("4"));','System.out.println(square(4));','16',helpers='static int square(int x){return x*x;}')
add('methods','Do not assign a void return','int x=log(); System.out.println(x);','log();','4',helpers='static void log(){System.out.println(4);}')
add('methods','Call an instance method through an instance','System.out.println(score());','System.out.println(new Main().score());','6',helpers='int score(){return 6;}')
add('methods','Respect a private field','System.out.println(new Box().n);','System.out.println(new Box().get());','8',helpers='TOPLEVEL:class Box{private int n=8; int get(){return n;}}')
add('methods','Handle a checked exception','fail();','try{fail();}catch(java.io.IOException e){System.out.println("handled");}','handled',helpers='static void fail() throws java.io.IOException {throw new java.io.IOException();}')
add('methods','Do not return a value from void main','return 5;','System.out.println(5);','5')
add('methods','Match the declared argument count','System.out.println(pick(1));','System.out.println(pick());','7',helpers='static int pick(){return 7;}')
add('methods','Instantiate a concrete implementation','Base b=new Base(); System.out.println(b.value());','Base b=new Base(){int value(){return 2;}}; System.out.println(b.value());','2',helpers='static abstract class Base{abstract int value();}')
add('methods','Implement an interface before instantiation','Op x=new Op(); System.out.println(x.get());','Op x=()->3; System.out.println(x.get());','3',helpers='interface Op{int get();}')

def runtime(cat,name,bad,good,out,exc,helpers='',good_helpers=None):
    add(cat,name,bad,good,out,'RuntimeError',exc,helpers,good_helpers)
runtime('null','Initialize a string before length','String s=null; System.out.println(s.length());','String s="cat"; System.out.println(s.length());','3','NullPointerException')
runtime('null','Initialize an array before reading length','int[] a=null; System.out.println(a.length);','int[] a={1,2}; System.out.println(a.length);','2','NullPointerException')
runtime('null','Initialize an object before field access','Box b=null; System.out.println(b.n);','Box b=new Box(); System.out.println(b.n);','4','NullPointerException',helpers='static class Box{int n=4;}')
runtime('null','Initialize a builder before append','StringBuilder b=null; b.append("x"); System.out.println(b);','StringBuilder b=new StringBuilder(); b.append("x"); System.out.println(b);','x','NullPointerException')
runtime('null','Avoid unboxing a null integer','Integer n=null; System.out.println(n+1);','Integer n=5; System.out.println(n+1);','6','NullPointerException')
runtime('null','Avoid unboxing a null boolean','Boolean b=null; if(b){System.out.println("yes");}','Boolean b=true; if(b){System.out.println("yes");}','yes','NullPointerException')
runtime('null','Initialize reference array elements','String[] a=new String[1]; System.out.println(a[0].length());','String[] a={"ok"}; System.out.println(a[0].length());','2','NullPointerException')
runtime('null','Handle missing map values','Map<String,Integer> m=new HashMap<>(); int n=m.get("age"); System.out.println(n);','Map<String,Integer> m=new HashMap<>(); int n=m.getOrDefault("age",4); System.out.println(n);','4','NullPointerException')
runtime('null','Initialize an iterator','Iterator<Integer> it=null; System.out.println(it.hasNext());','Iterator<Integer> it=Arrays.asList(1).iterator(); System.out.println(it.hasNext());','true','NullPointerException')
runtime('null','Initialize an exception reference','RuntimeException e=null; System.out.println(e.getMessage());','RuntimeException e=new RuntimeException("x"); System.out.println(e.getMessage());','x','NullPointerException')

runtime('index','Keep an array index below length','int[] a={2,4}; System.out.println(a[a.length]);','int[] a={2,4}; System.out.println(a[a.length-1]);','4','ArrayIndexOutOfBoundsException')
runtime('index','Avoid a negative array index','int[] a={8}; System.out.println(a[-1]);','int[] a={8}; System.out.println(a[0]);','8','ArrayIndexOutOfBoundsException')
runtime('index','Do not index an empty array','int[] a={}; System.out.println(a[0]);','int[] a={}; System.out.println(a.length);','0','ArrayIndexOutOfBoundsException')
runtime('index','Keep charAt within the string','String s="code"; System.out.println(s.charAt(4));','String s="code"; System.out.println(s.charAt(3));','e','StringIndexOutOfBoundsException')
runtime('index','Keep substring end within length','String s="java"; System.out.println(s.substring(1,6));','String s="java"; System.out.println(s.substring(1,4));','ava','StringIndexOutOfBoundsException')
runtime('index','Keep list get within size','List<Integer> a=new ArrayList<>();a.add(6); System.out.println(a.get(1));','List<Integer> a=new ArrayList<>();a.add(6); System.out.println(a.get(0));','6','IndexOutOfBoundsException')
runtime('index','Use a valid matrix row','int[][] a={{1,2},{3,4}};System.out.println(a[2][0]);','int[][] a={{1,2},{3,4}};System.out.println(a[1][0]);','3','ArrayIndexOutOfBoundsException')
runtime('index','Use the current jagged row length','int[][] a={{2},{4,6}};System.out.println(a[0][1]);','int[][] a={{2},{4,6}};System.out.println(a[1][1]);','6','ArrayIndexOutOfBoundsException')
runtime('index','Keep loop bounds exclusive','int[] a={1,2};for(int i=0;i<=a.length;i++){System.out.println(a[i]);}','int[] a={1,2};for(int i=0;i<a.length;i++){System.out.println(a[i]);}','1\n2','ArrayIndexOutOfBoundsException')
runtime('index','Validate a character deletion index','StringBuilder s=new StringBuilder("ab");s.deleteCharAt(2);System.out.println(s);','StringBuilder s=new StringBuilder("ab");s.deleteCharAt(1);System.out.println(s);','a','StringIndexOutOfBoundsException')

runtime('arithmetic','Check a division denominator','int d=0;System.out.println(12/d);','int d=3;System.out.println(12/d);','4','ArithmeticException')
runtime('arithmetic','Check a remainder denominator','int d=0;System.out.println(8%d);','int d=3;System.out.println(8%d);','2','ArithmeticException')
runtime('arithmetic','Avoid averaging an empty count','int count=0;System.out.println(9/count);','int count=3;System.out.println(9/count);','3','ArithmeticException')
runtime('arithmetic','Check empty input before division','int[] a={};System.out.println(1/a.length);','int[] a={};if(a.length==0){System.out.println(0);}else{System.out.println(1/a.length);}','0','ArithmeticException')
runtime('arithmetic','Inspect a zero difference denominator','int n=5;System.out.println(10/(n-n));','int n=5;System.out.println(10/n);','2','ArithmeticException')
runtime('arithmetic','Inspect a helper denominator','System.out.println(4/zero());','System.out.println(zero()==0?0:4/zero());','0','ArithmeticException',helpers='static int zero(){return 0;}')
runtime('arithmetic','Inspect integer conversion before division','double d=0.5;System.out.println(7/(int)d);','double d=0.5;System.out.println(7/d);','14.0','ArithmeticException')
runtime('arithmetic','Zero has no nonzero integer sign','int d=-0;System.out.println(3/d);','int d=-1;System.out.println(3/d);','-3','ArithmeticException')
runtime('arithmetic','Inspect a shifted denominator','int d=1>>1;System.out.println(6/d);','int d=1<<1;System.out.println(6/d);','3','ArithmeticException')
runtime('arithmetic','Check a mapped divisor','Map<String,Integer> m=new HashMap<>();m.put("d",0);System.out.println(9/m.get("d"));','Map<String,Integer> m=new HashMap<>();m.put("d",3);System.out.println(9/m.get("d"));','3','ArithmeticException')

for name,bad,good,out in [
 ('Parse decimal digits','Integer.parseInt("abc")','Integer.parseInt("123")','123'),
 ('Trim numeric whitespace','Integer.parseInt(" 7 ")','Integer.parseInt(" 7 ".trim())','7'),
 ('Use a compatible numeric parser','Integer.parseInt("2.5")','Double.parseDouble("2.5")','2.5'),
 ('Select a wide enough numeric type','Integer.parseInt("2147483648")','Long.parseLong("2147483648")','2147483648'),
 ('Provide digits for long parsing','Long.parseLong("")','Long.parseLong("10")','10'),
 ('Match digits to the radix','Integer.parseInt("19",8)','Integer.parseInt("17",8)','15'),
 ('Respect hexadecimal prefix handling','Integer.parseInt("0x10")','Integer.decode("0x10")','16'),
 ('Provide valid floating point text','Double.parseDouble("two")','Double.parseDouble("2.0")','2.0')]:
 runtime('parsing',name,'System.out.println('+bad+');','System.out.println('+good+');',out,'NumberFormatException')
runtime('parsing','Read integers from numeric tokens','Scanner s=new Scanner("hello");System.out.println(s.nextInt());','Scanner s=new Scanner("7");System.out.println(s.nextInt());','7','InputMismatchException')
runtime('parsing','Read booleans from boolean tokens','Scanner s=new Scanner("maybe");System.out.println(s.nextBoolean());','Scanner s=new Scanner("true");System.out.println(s.nextBoolean());','true','InputMismatchException')

for name,bh,gh,body,out in [
 ('Provide a recursive base case','static int f(int n){return f(n-1);}','static int f(int n){if(n<=0)return 0;return f(n-1);}','System.out.println(f(3));','0'),
 ('Move toward a recursive base case','static int f(int n){if(n==0)return 0;return f(n+1);}','static int f(int n){if(n==0)return 0;return f(n-1);}','System.out.println(f(2));','0'),
 ('Update the recursive argument','static int f(int n){if(n==0)return 1;return n*f(n);}','static int f(int n){if(n==0)return 1;return n*f(n-1);}','System.out.println(f(4));','24'),
 ('Handle both parity paths in termination','static int f(int n){if(n==0)return 0;return f(n-2);}','static int f(int n){if(n<=0)return 0;return f(n-2);}','System.out.println(f(3));','0'),
 ('Terminate mutual recursion','static int f(int n){return g(n);}static int g(int n){return f(n);}','static int f(int n){if(n==0)return 1;return g(n-1);}static int g(int n){return f(n);}','System.out.println(f(2));','1')]:
 runtime('termination',name,body,body,out,'StackOverflowError',bh,gh)
for name,bad,good,out in [
 ('Advance a while counter','int i=0;while(i<3){}System.out.println(i);','int i=0;while(i<3){i++;}System.out.println(i);','3'),
 ('Provide a for update','int i=0;for(;i<2;){}System.out.println(i);','int i=0;for(;i<2;i++){}System.out.println(i);','2'),
 ('Update the variable tested by a loop','int i=0,j=0;while(i<2){j++;}System.out.println(i);','int i=0,j=0;while(i<2){j++;i++;}System.out.println(i);','2'),
 ('Clear a loop control flag','boolean running=true;while(running){}System.out.println("done");','boolean running=true;while(running){running=false;}System.out.println("done");','done'),
 ('Advance a do while counter','int i=0;do{}while(i<4);System.out.println(i);','int i=0;do{i++;}while(i<4);System.out.println(i);','4')]:
 add('termination',name,bad,good,out,'Timeout')

for name,bad,good,out in [
 ('Sum all integers from one through five','int s=0;for(int i=1;i<5;i++)s+=i;System.out.println(s);','int s=0;for(int i=1;i<=5;i++)s+=i;System.out.println(s);','15'),
 ('Initialize a product with the multiplicative identity','int p=0;for(int i=1;i<=4;i++)p*=i;System.out.println(p);','int p=1;for(int i=1;i<=4;i++)p*=i;System.out.println(p);','24'),
 ('Find a maximum in an all negative array','int[] a={-5,-2,-8};int m=0;for(int x:a)if(x>m)m=x;System.out.println(m);','int[] a={-5,-2,-8};int m=a[0];for(int x:a)if(x>m)m=x;System.out.println(m);','-2'),
 ('Find a minimum in an all positive array','int[] a={7,3,9};int m=0;for(int x:a)if(x<m)m=x;System.out.println(m);','int[] a={7,3,9};int m=a[0];for(int x:a)if(x<m)m=x;System.out.println(m);','3'),
 ('Count the even values','int c=0;for(int x:new int[]{1,2,4})if(x%2==1)c++;System.out.println(c);','int c=0;for(int x:new int[]{1,2,4})if(x%2==0)c++;System.out.println(c);','2'),
 ('Compare string contents','String s=new String("cat");System.out.println(s=="cat");','String s=new String("cat");System.out.println(s.equals("cat"));','true'),
 ('Compute a nonintegral mean','int a=5,b=2;System.out.println(a/b);','int a=5,b=2;System.out.println((double)a/b);','2.5'),
 ('Subtract the smaller value from the larger','int a=8,b=3;System.out.println(b-a);','int a=8,b=3;System.out.println(a-b);','5'),
 ('Include the passing threshold','int mark=60;System.out.println(mark>60?"P":"F");','int mark=60;System.out.println(mark>=60?"P":"F");','P'),
 ('Preserve a found search result','boolean found=false;for(int x:new int[]{2,5,9}){found=(x==5);}System.out.println(found);','boolean found=false;for(int x:new int[]{2,5,9}){if(x==5)found=true;}System.out.println(found);','true')]:
 add('logic',name,bad,good,out,'WrongOutput')

assert len(bugs)==100 and set(Counter(x['category'] for x in bugs).values())=={10}
controls=[{**x,'id':'control_'+x['id'],'code':x['reference_code'],'expected_status':'Success',
           'expected_exception':None,'paired_with':x['id'],'category':'corrected_control'} for x in bugs if int(x['id'][-2:]) in (2,7)]

# Existing development material is explicitly not a new independent test set.
tree=ast.parse((ROOT/'hint_accuracy_eval.py').read_text(encoding='utf-8'))
legacy=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='DATASET' for t in n.targets))
development=[{'id':f'legacy_dev_{x[0]:02d}','category':x[1],'description':x[2],'code':x[3],
              'split':'development','provenance':'Previously used project example, not independent held-out data'} for x in legacy[:20]]

def dump(name,data):
    (DEST/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
dump('hints_test.json',bugs)
dump('controls.json',controls)
dump('development.json',development)

# Complexity labels refer to symbolic method work(n), not fixed main literals.
complexities=[]
def complexity(label,name,body,space='O(1)',reason='',helpers=''):
    ident=f'time_{label.replace(" ","").replace("(","").replace(")","").replace("^","p")}_{sum(x["time"]==label for x in complexities)+1:02d}'
    complexities.append({'id':ident,'name':name,'split':'test','language':'java','target':'Main.work',
       'input_size':'n is the integer parameter or the corresponding array length; n >= 2',
       'analysis_case':'worst case','time':label,'space':space,
       'space_definition':'peak auxiliary space excluding input storage and including recursion stack; unit-cost arithmetic',
       'reason':reason or name,'code':'public class Main {\npublic static int work(int n){\n'+body+'\n}\n'+helpers+'\n}',
       'verification_status':'static author label; compile and analyzer execution pending'})
for name,body in [
 ('Return a scalar','return n;'),('Swap scalar values','int a=n,b=3,t=a;a=b;b=t;return a+b;'),
 ('Fixed loop bound','int s=0;for(int i=0;i<7;i++)s+=i;return s;'),('Single branch','if(n>10)return n+1;return n-1;'),
 ('Arithmetic expression','return (n+3)*2;'),('Fixed array','int[] a=new int[4];return a.length;'),
 ('Two fixed loops','int s=0;for(int i=0;i<3;i++)s++;for(int j=0;j<4;j++)s++;return s;'),
 ('Bit mask','return n&1;'),('Nested fixed bounds','int s=0;for(int i=0;i<3;i++)for(int j=0;j<2;j++)s++;return s;'),
 ('Fixed while bound','int i=0;while(i<9)i++;return i;')]: complexity('O(1)',name,body)
for name,body,space in [
 ('Divide by two','int c=0;while(n>1){n/=2;c++;}return c;','O(1)'),
 ('Divide by three','int c=0;while(n>1){n/=3;c++;}return c;','O(1)'),
 ('Double a counter','int c=0;for(int i=1;i<n;i*=2)c++;return c;','O(1)'),
 ('Quadruple a counter','int c=0;for(int i=1;i<n;i*=4)c++;return c;','O(1)'),
 ('Halving for loop','int c=0;for(int i=n;i>0;i/=2)c++;return c;','O(1)'),
 ('Unsigned shift loop','int c=0;while(n>0){n>>>=1;c++;}return c;','O(1)'),
 ('Recursive halving','if(n<=1)return 0;return 1+work(n/2);','O(log n)'),
 ('Recursive thirds','if(n<=1)return 1;return work(n/3);','O(log n)'),
 ('Two logarithmic loops','int c=0;for(int i=1;i<n;i*=2)c++;for(int j=n;j>0;j/=2)c++;return c;','O(1)'),
 ('Fixed work per halving','int c=0;while(n>1){for(int k=0;k<4;k++)c++;n/=2;}return c;','O(1)')]: complexity('O(log n)',name,body,space)
for name,body,space in [
 ('Linear sum','int s=0;for(int i=0;i<n;i++)s+=i;return s;','O(1)'),
 ('Countdown','int c=0;while(n>0){n--;c++;}return c;','O(1)'),
 ('Stride two','int c=0;for(int i=0;i<n;i+=2)c++;return c;','O(1)'),
 ('Two sequential linear loops','int c=0;for(int i=0;i<n;i++)c++;for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Initialize output array','int[] a=new int[n];for(int i=0;i<n;i++)a[i]=i;return a[n-1];','O(n)'),
 ('Recursive countdown','if(n<=0)return 0;return 1+work(n-1);','O(n)'),
 ('Linear loop fixed inner work','int c=0;for(int i=0;i<n;i++)for(int j=0;j<3;j++)c++;return c;','O(1)'),
 ('Linear conditional work','int c=0;for(int i=0;i<n;i++){if(i%2==0)c++;}return c;','O(1)'),
 ('Fill two output arrays','int[] a=new int[n],b=new int[n];for(int i=0;i<n;i++){a[i]=i;b[i]=i+1;}return b[0];','O(n)'),
 ('Worst case early return','for(int i=0;i<n;i++){if(i==n-1)return i;}return -1;','O(1)')]: complexity('O(n)',name,body,space)
for name,body,space in [
 ('Linear outer logarithmic inner','int c=0;for(int i=0;i<n;i++)for(int j=1;j<n;j*=2)c++;return c;','O(1)'),
 ('Logarithmic outer linear inner','int c=0;for(int i=1;i<n;i*=2)for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Halving outer linear inner','int c=0;for(int i=n;i>0;i/=2)for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Linear outer divide by three inner','int c=0;for(int i=0;i<n;i++)for(int j=n;j>0;j/=3)c++;return c;','O(1)'),
 ('While outer doubling inner','int i=0,c=0;while(i<n){for(int j=1;j<n;j*=2)c++;i++;}return c;','O(1)'),
 ('Linear logarithmic stride variant','int c=0;for(int i=0;i<n;i+=2)for(int j=1;j<n;j*=2)c++;return c;','O(1)'),
 ('Logarithmic loop after linear work','int c=0;for(int k=0;k<n;k++)c++;for(int i=0;i<n;i++)for(int j=1;j<n;j*=2)c++;return c;','O(1)'),
 ('Linear log with output buffer','int[] a=new int[n];for(int i=0;i<n;i++)for(int j=1;j<n;j*=2)a[i]++;return a[0];','O(n)'),
 ('Quadrupling inner loop','int c=0;for(int i=0;i<n;i++)for(int j=1;j<n;j*=4)c++;return c;','O(1)'),
 ('Fixed extra nesting','int c=0;for(int i=0;i<n;i++)for(int j=1;j<n;j*=2)for(int k=0;k<2;k++)c++;return c;','O(1)')]: complexity('O(n log n)',name,body,space)
for name,body,space in [
 ('Square loops','int c=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Triangular loop','int c=0;for(int i=0;i<n;i++)for(int j=0;j<i;j++)c++;return c;','O(1)'),
 ('Reverse triangular loop','int c=0;for(int i=0;i<n;i++)for(int j=i;j<n;j++)c++;return c;','O(1)'),
 ('Nested while loops','int c=0,i=0;while(i<n){int j=0;while(j<n){c++;j++;}i++;}return c;','O(1)'),
 ('Initialize matrix','int[][] a=new int[n][n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)a[i][j]=i+j;return a[0][0];','O(n^2)'),
 ('Strided quadratic loops','int c=0;for(int i=0;i<n;i+=2)for(int j=0;j<n;j+=3)c++;return c;','O(1)'),
 ('Quadratic dominates linear','int c=0;for(int i=0;i<n;i++)c++;for(int i=0;i<n;i++)for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Two quadratic blocks','int c=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++)c++;for(int i=0;i<n;i++)for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Quadratic work linear buffer','int[] a=new int[n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)a[i]+=j;return a[0];','O(n)'),
 ('Conditional quadratic branch','int c=0;if(n>2){for(int i=0;i<n;i++)for(int j=0;j<n;j++)c++;}return c;','O(1)')]: complexity('O(n^2)',name,body,space)
for name,body,space in [
 ('Three variable loops','int c=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)c++;return c;','O(1)'),
 ('Cubic work matrix space','int[][] a=new int[n][n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)a[i][j]+=k;return a[0][0];','O(n^2)'),
 ('Triangular cubic','int c=0;for(int i=0;i<n;i++)for(int j=0;j<i;j++)for(int k=0;k<n;k++)c++;return c;','O(1)'),
 ('Reverse triangular cubic','int c=0;for(int i=0;i<n;i++)for(int j=i;j<n;j++)for(int k=0;k<n;k++)c++;return c;','O(1)'),
 ('Strided cubic','int c=0;for(int i=0;i<n;i+=2)for(int j=0;j<n;j++)for(int k=0;k<n;k++)c++;return c;','O(1)'),
 ('Cubic then quadratic','int c=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)c++;for(int i=0;i<n;i++)for(int j=0;j<n;j++)c++;return c;','O(1)'),
 ('Fixed fourth loop','int c=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)for(int q=0;q<2;q++)c++;return c;','O(1)'),
 ('Cubic work linear buffer','int[] a=new int[n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)a[i]+=k;return a[0];','O(n)'),
 ('Initialize cube','int[][][] a=new int[n][n][n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)a[i][j][k]=1;return a[0][0][0];','O(n^3)'),
 ('Cubic conditional body','int c=0;for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)if(k%2==0)c++;return c;','O(1)')]: complexity('O(n^3)',name,body,space)
assert len(complexities)==60
dump('complexity_test.json',complexities)

# A separately balanced auxiliary-space set prevents O(1) prevalence hiding errors.
space_cases=[]
def space_case(name,body,label,reason):
    space_cases.append({'id':f'space_{len(space_cases)+1:02d}','name':name,'split':'test','target':'Main.work',
       'input_size':'n is the positive integer parameter; asymptotics as n grows',
       'space':label,'reason':reason,'analysis_case':'worst case',
       'space_definition':'peak auxiliary space including recursion frames, excluding input; unit-cost scalars',
       'code':'public class Main {public static int work(int n){'+body+'}}',
       'verification_status':'static author label; compile and analyzer execution pending'})
for c in complexities[:10]:space_case(c['name'],c['code'].split('public static int work(int n){\n')[1].split('\n}\n')[0],'O(1)','Fixed number of scalar cells or fixed-size allocation.')
for divisor in [2,3,4,5,6]:
    space_case(f'Recursive division by {divisor}',f'if(n<=1)return 0;return 1+work(n/{divisor});','O(log n)','One constant-size frame per logarithmic recursion level; shared pattern family.')
for divisor in [2,3,4,5,6]:
    space_case(f'Recursive division with fixed local work {divisor}',f'if(n<=1)return 1;int x=n+1;int y=n-1;return x-y+work(n/{divisor});','O(log n)','Logarithmic-depth recursion with a constant number of locals per frame; shared pattern family.')
for name,body in [
 ('Single array','int[] a=new int[n];return a.length;'),('Two arrays','int[] a=new int[n],b=new int[n];return a.length+b.length;'),
 ('Linear recursive frames','if(n<=0)return 0;return 1+work(n-1);'),('Stride recursive frames','if(n<=0)return 0;return 1+work(n-2);'),
 ('Fill linear array','int[] a=new int[n];for(int i=0;i<n;i++)a[i]=i;return a[0];'),
 ('Reverse fill','int[] a=new int[n];for(int i=n-1;i>=0;i--)a[i]=i;return a[0];'),
 ('Two by n matrix','int[][] a=new int[2][n];return a.length;'),('n by two matrix','int[][] a=new int[n][2];return a.length;'),
 ('Linear array alias','int[] a=new int[n];int[] b=a;return b.length;'),
 ('Linear scratch for quadratic computation','int[] a=new int[n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)a[i]+=j;return a[0];')]:
 space_case(name,body,'O(n)','Linear peak allocation or linear recursion depth; time cost does not multiply live space.')
for name,body in [
 ('Square matrix','int[][] a=new int[n][n];return a.length;'),('Flat square','int[] a=new int[n*n];return a.length;'),
 ('Two matrices','int[][] a=new int[n][n],b=new int[n][n];return a.length+b.length;'),
 ('Matrix initialization','int[][] a=new int[n][n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)a[i][j]=i;return a[0][0];'),
 ('Jagged square','int[][] a=new int[n][];for(int i=0;i<n;i++)a[i]=new int[n];return a.length;'),
 ('Triangular live allocation','int[][] a=new int[n][];for(int i=0;i<n;i++)a[i]=new int[i+1];return a.length;'),
 ('Matrix alias','int[][] a=new int[n][n];int[][] b=a;return b.length;'),
 ('Double-width matrix','int[][] a=new int[n][2*n];return a.length;'),
 ('Cubic work matrix storage','int[][] a=new int[n][n];for(int i=0;i<n;i++)for(int j=0;j<n;j++)for(int k=0;k<n;k++)a[i][j]+=k;return a[0][0];'),
 ('Flat square initialization','int[] a=new int[n*n];for(int i=0;i<n*n;i++)a[i]=i;return a.length;')]:
 space_case(name,body,'O(n^2)','Quadratic number of live cells; scalar aliases do not duplicate storage.')
assert len(space_cases)==40
dump('space_test.json',space_cases)

# A capability benchmark; none of the support claims below is pre-scored.
videos=[]
def video(cat,body,out,helpers='',inspect='Check every relevant state transition and final output.'):
    videos.append({'id':f'video_{len(videos)+1:02d}','filename':'Main.java','category':cat,'code':program(body,helpers),
                   'expected_stdout':out,'inspection':inspect,'split':'test',
                   'provenance':'AI-assisted author-constructed capability example; execution validation pending',
                   'dedicated_visualization':'not yet assessed','detection':'not yet assessed'})
video('one_dimensional_array','int[] a={4,1,7};int t=a[0];a[0]=a[2];a[2]=t;System.out.println(Arrays.toString(a));','[7, 1, 4]')
video('matrix','int[][] a={{1,3},{5,7}};a[1][0]+=2;System.out.println(a[1][0]);','7')
video('array_list','ArrayList<Integer> a=new ArrayList<>();a.add(3);a.add(6);a.add(9);a.remove(1);System.out.println(a);','[3, 9]')
video('linked_list_api','LinkedList<Integer> a=new LinkedList<>();a.add(5);a.addFirst(2);a.addLast(8);a.removeFirst();System.out.println(a);','[5, 8]')
video('map','Map<String,Integer> m=new LinkedHashMap<>();m.put("x",3);m.put("y",8);m.put("x",5);m.remove("y");System.out.println(m.get("x"));','5')
video('stack','Stack<Integer> s=new Stack<>();s.push(4);s.push(8);int x=s.pop();s.push(2);System.out.println(x);System.out.println(s.peek());','8\n2')
video('binary_search_tree','Node r=new Node(8);r.left=new Node(3);r.right=new Node(11);inorder(r);','3\n8\n11',helpers='static class Node{int val;Node left,right;Node(int v){val=v;}}static void inorder(Node n){if(n==null)return;inorder(n.left);System.out.println(n.val);inorder(n.right);}')
video('directed_graph_list','List<List<Integer>> a=new ArrayList<>();for(int i=0;i<3;i++)a.add(new ArrayList<>());a.get(0).add(1);a.get(1).add(2);boolean[] v=new boolean[3];dfs(0,a,v);','0\n1\n2',helpers='static void dfs(int n,List<List<Integer>> a,boolean[] v){v[n]=true;System.out.println(n);for(int i=0;i<a.get(n).size();i++){int k=a.get(n).get(i);if(!v[k])dfs(k,a,v);}}')
video('directed_graph_map','Map<Integer,List<Integer>> g=new HashMap<>();g.put(0,new ArrayList<>());g.put(1,new ArrayList<>());g.get(0).add(1);System.out.println(g.get(0).get(0));','1')
video('directed_graph_matrix','int[][] g=new int[3][3];g[0][1]=1;g[1][2]=1;System.out.println(g[0][1]);System.out.println(g[1][2]);','1\n1')
video('undirected_graph','List<List<Integer>> g=new ArrayList<>();for(int i=0;i<3;i++)g.add(new ArrayList<>());g.get(0).add(1);g.get(1).add(0);g.get(1).add(2);g.get(2).add(1);System.out.println(g.get(1));','[0, 2]')
video('recursion_call_tree','System.out.println(digitSum(352));','10',helpers='static int digitSum(int n){if(n==0)return 0;return n%10+digitSum(n/10);}')
video('objects','Counter c=new Counter(4);c.inc();c.inc();System.out.println(c.value);','6',helpers='static class Counter{int value;Counter(int n){value=n;}void inc(){value++;}}')
video('temporary_merge_arrays','int[] left={1,5},right={2,6},merged=new int[4];int i=0,j=0,k=0;while(i<2&&j<2){if(left[i]<right[j])merged[k++]=left[i++];else merged[k++]=right[j++];}while(i<2)merged[k++]=left[i++];while(j<2)merged[k++]=right[j++];System.out.println(Arrays.toString(merged));','[1, 2, 5, 6]')
video('queue','Queue<Integer> q=new ArrayDeque<>();q.add(7);q.add(2);System.out.println(q.remove());System.out.println(q.peek());','7\n2')
video('priority_queue','PriorityQueue<Integer> q=new PriorityQueue<>();q.add(7);q.add(2);q.add(5);System.out.println(q.poll());System.out.println(q.poll());','2\n5')
video('set','Set<Integer> s=new HashSet<>();s.add(3);s.add(3);s.add(8);System.out.println(s.size());System.out.println(s.contains(8));','2\ntrue')
video('custom_singly_linked_list','Node a=new Node(2);a.next=new Node(5);a.next.next=new Node(9);for(Node n=a;n!=null;n=n.next)System.out.println(n.val);','2\n5\n9',helpers='static class Node{int val;Node next;Node(int n){val=n;}}')
video('array_heap','int[] h={2,5,4};int t=h[0];h[0]=h[2];h[2]=t;int heapSize=2;if(h[0]>h[1]){t=h[0];h[0]=h[1];h[1]=t;}System.out.println(h[0]);','4',inspect='Active heap size becomes two after removal; assess heap-specific interpretation separately from plain-array animation.')
video('trie','Trie r=new Trie();r.child[0]=new Trie();r.child[0].child[1]=new Trie();r.child[0].child[1].end=true;System.out.println(r.child[0].child[1].end);','true',helpers='static class Trie{Trie[] child=new Trie[2];boolean end;}')
video('balanced_tree_rotation','Node a=new Node(3);a.left=new Node(2);a.left.left=new Node(1);Node b=a.left;a.left=b.right;b.right=a;System.out.println(b.val);System.out.println(b.right.val);','2\n3',helpers='static class Node{int val;Node left,right;Node(int v){val=v;}}',inspect='A right rotation is demonstrated; a generic node display alone is not dedicated balancing support.')
video('doubly_linked_list','Node a=new Node(4),b=new Node(6);a.next=b;b.prev=a;System.out.println(b.prev.val);','4',helpers='static class Node{int val;Node next,prev;Node(int n){val=n;}}')
video('fenwick_tree','int[] tree=new int[6];int i=2;while(i<tree.length){tree[i]+=3;i+=i&-i;}int sum=0;i=4;while(i>0){sum+=tree[i];i-=i&-i;}System.out.println(sum);','3')
video('union_find','int[] p={0,1,2};p[find(p,1)]=find(p,0);System.out.println(find(p,1)==find(p,0));','true',helpers='static int find(int[] p,int x){while(p[x]!=x)x=p[x];return x;}')
assert len(videos)==24
events=[
 ['Show [4,1,7] changing to [7,1,4] by swapping indexes 0 and 2.'],
 ['Matrix cell [1][0] changes from 5 to 7.'],
 ['Append 3,6,9, then remove index 1 leaving [3,9].'],
 ['List goes [5], [2,5], [2,5,8], then [5,8].'],
 ['Map x=3,y=8 changes to x=5, then removes y.'],
 ['Push 4 then 8, pop 8, push 2; top is 2.'],
 ['BST root 8 with left 3/right 11; inorder visit 3,8,11.'],
 ['Directed edges 0->1->2, visited in order 0,1,2.'],
 ['Directed map edge 0->1; show direction, not just an object card.'],
 ['Matrix entries encode directed edges 0->1 and 1->2; graph-specific visual differs from a plain grid.'],
 ['Undirected chain 0--1--2 has symmetric adjacency; no traversal claim is tested.'],
 ['digitSum calls 352,35,3,0 and returns 0,3,8,10.'],
 ['Counter instance value changes 4,5,6.'],
 ['Separate left [1,5] and right [2,6], merged into [1,2,5,6].'],
 ['FIFO: enqueue 7,2, remove 7, peek 2.'],
 ['Min-priority behavior: remove 2 then 5, leaving 7.'],
 ['Duplicate insertion of 3 does not increase set size; {3,8} size 2.'],
 ['Singly linked chain 2->5->9 and traversal in that order.'],
 ['Extract minimum 2, active heap [4,5] with heapSize=2; do not count the removed last cell as live heap.'],
 ['Binary trie path child[0].child[1], with the terminal end flag true.'],
 ['Right rotation changes root 3(left 2(left 1)) into root 2(left 1,right 3); not a full AVL implementation.'],
 ['Node 4 next points to 6 and node 6 prev points to 4.'],
 ['Fenwick update touches indexes 2,4; prefix query at 4 returns 3.'],
 ['Union changes parent[1] to 0; find(1)==find(0), with element 2 separate.']]
for case,expected in zip(videos,events):case['expected_events']=expected
dump('video_test.json',{'purpose':'Frozen capability benchmark; not prevalence or general accuracy','cases':videos})

guard=[]
valid={'problem_summary':'An integer division uses zero as its divisor.','why':'Integer division by zero raises ArithmeticException.',
       'hint_1':'Inspect the denominator before the division.','learning_tip':'Check integer arithmetic preconditions.'}
for i in range(25):
    good={**valid,'hint_2':f'Inspect the denominator at statement {i+1}.'}
    guard.append({'id':f'valid_{i:02d}','group':'compliant','output':good,'expected_contract_accept':True,'semantic_label':'correct', 'family':'arithmetic_context_variation'})
    bad=dict(good)
    key=['problem_summary','why','hint_1','learning_tip'][i%4]
    if i%3==0:bad.pop(key)
    elif i%3==1:bad[key]=' '
    else:bad[key]=[i]
    guard.append({'id':f'structure_{i:02d}','group':'structural_violation','output':bad,'expected_contract_accept':False,'semantic_label':'not_assessed','family':f'field_rule_{i%12}'})
    leak={**good,'hint_3':['public static void main(String[] args) {}','import java.util.List;','Here is the full solution.','```java\nint x=0;\n```','complete solution'][i%5]}
    guard.append({'id':f'leak_{i:02d}','group':'prohibited_pattern','output':leak,'expected_contract_accept':False,'semantic_label':'not_assessed','family':f'leak_pattern_{i%5}'})
    false={**good,'why':['Java array indexes start at one.','Integer division by zero always returns zero.','A null Java reference automatically creates an object.','Java strings are mutable.','Every Java loop has constant time complexity.'][i%5]}
    guard.append({'id':f'factual_{i:02d}','group':'well_formed_factual_error','output':false,'expected_contract_accept':True,'semantic_label':'incorrect','family':f'factual_claim_{i%5}'})
dump('guard_test.json',guard)
dump('analytics_test.json',[
 {'id':'empty','stat':{},'expected':'neutral'},
 {'id':'weak','stat':{'total_errors':5,'successful_attempts':1},'expected':'weak'},
 {'id':'strong','stat':{'total_errors':2,'successful_attempts':8},'expected':'strong'},
 {'id':'not_strong_error_rate','stat':{'total_errors':5,'successful_attempts':8},'expected':'neutral'},
 {'id':'improving','stat':{'total_errors':7,'successful_attempts':3,'status':'weak','recent_attempts':[True,True,True]},'expected':'improving'},
 {'id':'not_improving','stat':{'total_errors':7,'successful_attempts':2,'status':'weak','recent_attempts':[True,False,True]},'expected':'weak'},
 *[{'id':f'hint_weight_{i}','hints_used':i,'expected_weight':max(0,1-.3*i)} for i in range(6)]])
dump('dataset_summary.json',{'hints_test':len(bugs),'hints_by_category':dict(Counter(x['category'] for x in bugs)),
 'paired_correct_controls':len(controls),'legacy_development':len(development),'complexity_test':len(complexities),
 'time_distribution':dict(Counter(x['time'] for x in complexities)),'space_distribution':dict(Counter(x['space'] for x in complexities)),
 'dedicated_space_test':len(space_cases),'dedicated_space_distribution':dict(Counter(x['space'] for x in space_cases)),
 'video_categories':len(videos),'guard_challenges':len(guard),'analytics_scenarios':12,
 'limitations':['Author-constructed and AI-assisted; no independent student data or raters.',
 'Repeated guard-rule families are not independent semantic examples.',
 'Complexity variants share control-flow families; report family-level limitations.',
 'All labels are frozen after static review; execution-oracle validation is pending and must pass before inference.',
 'No learning-outcome conclusions follow from these benchmarks.']})
print(json.dumps(json.loads((DEST/'dataset_summary.json').read_text()),indent=2))
