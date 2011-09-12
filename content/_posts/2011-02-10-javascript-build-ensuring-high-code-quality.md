---
layout: post
title: "JavaScript Build: Ensuring High Code Quality"
tags: [javascript, build]
categories: articles
---

# {{ page.title }}

### Why To Build?

There are two phases in development repeated many times every day: making changes and checking if they work.
Build is in the middle, it can generate some code as soon as runs automatic code checks.
In many development environments build is mandatory, you need compile the code to see changes made.
Developing web applications we can postpone code verification and unit tests
and switch directly to checking our changes.
Working under pressure we tend to do so quite often forgetting about the checks at all
and then spend hours fixing strange bugs.
Discipline is a good thing but in this case automation is much more reliable.

The idea is fairly simple: the application references only combined JavaScript files
making build mandatory.
The first build step is code generation to keep sources and configs DRY.
Right after generation it's reasonable to check all code with JSLint.
If code quality is OK, it's a good time to run unit tests.
Only when all three previous steps are successful,
combining is done and the developer can see the changes made.

A web application can be built using different tools
but build based on Ant is sometimes considered as a kind of a standard.

* **Apache Ant** - split build into separate tasks, combining, regexp replacement, running other tools;
* **Mozila Rhino** - run code generation scripts and JSLint;
* **JSLint** - check JavaScript code quality;
* **JsTestDriver** - to run Jasmine unit tests in several browsers during the build;
* **Google Closure Compiler** - to crunch the code;

The described build process was developed as part of [formEngine.js][fe] project.
Many great ideas and even code fragments were taken from jQuery 1.4 and jQuery UI builds.

### Code Generation

To run build and tests we need reference the same set of files in several different places:
in `build.xml` for combining, in `tests.yaml` to run unit tests using JsTestDriver,
in `tests.html` to debug tests in browser...
In such situation a good solution is consider `build.xml` as the data source for
automatic generation of all other files.
This approach helps to avoid stupid mistakes made adding or removing files.

Lets mark required files in `build.xml` with a kind of tags
and than parse it using regular expressions to extract the file lists required to generate other configs.
The tags should be put in comments to make Ant completely ignore them:

	<concat destfile="..." >
      <fileset file="source/fe.js" /> <!--lint,test-->
      ...
	</concat>

In the code fragment above file `source/fe.js` is marked for JSLint check using `lint` tag
and as testable code with `test` tag.

On the first stage of the build we run script that parses `build.xml`,
extracts all files marked with `test` tag and generates `tests.yaml` and `tests.html` files
using predefined templates.
The script is written in JavaScript language and runs using Mozila Rhino JavaScript engine:

    <target name="gen">
	  <exec executable="java" failonerror="true">
	    <arg line="-jar build/libs/js.jar build/generate.js" />
	  </exec>
    </target>

Take a look at [utils.js][utils.js] and [generate.js][generate.js] scripts for implementation details.

### Checking Code Quality with JSLint

Having all code generated we can start one of the most important tasks - JSLint check.
In my opinion, the code quality check should be done before unit testing
because it quite often reveals misprint and low level mistakes.
It is not so wise to spend time fixing broken unit test having a variable name misspelled.

Next, it's very convenient to check not combined source but original files,
in this case row number and column returned by JSLint can be used to jump directly to the mistake
using an IDE features.
For example, in Emacs
it's enough to return error reference in simple format (path:line:column) in compilation output.
Such small conveniences look not so important at the first glance
but during project's life span they save pretty much developer's time.

To run JSLint simple [wrapper][lint.js] is used,
it extracts list of files for check from `build.xml` by `lint` tag
and then feeds the files one by one to JSLint.
If there is at least one error the script returns error code to make Ant stop the build
(`failonerror` attribute set for the build task).

### Running Unit Tests

When the code seems clean at least from JSLint's point of view, it's a good time to run unit tests.
Before the build JsTestDriver server should be started using the following command:

    java -jar JsTestDriver-1.2.2.jar --port 9876

And one or several browsers must be captured by the test server using `http://localhost:9876/capture` URL.

During the build JsTestDriver loads code according `tests.yaml` config into all captured browsers in parallel:

    <target name="tests" depends="jslint"> 
      <exec executable="java" failonerror="true">
        <arg line="-jar JsTestDriver-1.2.2.jar --config tests/tests.yaml --tests all" />
      </exec>
    </target>

At the end it returns error code, if one or more unit tests fail, that leads to build termination
due to `failonerror` attribute.
Stopping the build on JSLint error or unit test failure could be considered as a kind of inconvenience
but in 99% of cases the developer needs to fix such issues as soon as possible
before he forgets subtle details of changes made.
Such strategy emphasize the importance of code verification and unit testing
because even small error doesn't allows to see the result of your work.

On the other hand, there is no solution that fits every situation perfectly
and sometimes a project should be built in spite of broken tests.
In this case, `failonerror` attribute should be removed from `tests` task.

### Combining, Inserting Version Number & Date

Combining of several files is quite simple with Ant, it's made by `concat` task.
The `concat` contains list of files that should be included in target file.
Notice `fixlastline` attribute, it adds line break at the end of every file to make result code more
readable (typical mistakes with lost semicolon at the end of the file should be found by JSLint).
The file list is also used for code generation so files are marked by `lint` and `test` tags.

    <loadfile property="version" srcfile="version.txt" />
    <exec executable="git" outputproperty="date">
	  <arg line="log -1 --pretty=format:%ad" />
    </exec>

    <target name="combine" depends="tests">

      <echo message="Building ${FE}.js..." />

	  <concat destfile="${FE}.js" fixlastline="yes">
	    <fileset file="source/intro.js" />
        <fileset file="source/fe.js" /> <!--lint,test-->
        <fileset file="source/fe.dsl.js" /> <!--lint,test-->      
        <fileset file="source/fe.rule.js" /> <!--lint,test-->
        <!-- many other files here... -->
	    <fileset file="source/outro.js" />
	  </concat>

      <replaceregexp match="@VERSION" replace="${version}"
                     flags="g" byline="true" file="${FE}.js" />
	  <replaceregexp match="@DATE" replace="${date}" file="${FE}.js" />

    </target>

It's convenient to keep version number in one separate file
and insert it into all result files during the build.
Typical solution is to use `replaceregexp` task to replace `@VERSION` string by current number
taken from file by `loadfile` task.

Things are a bit more complex with `@DATE` replacement.
The code above, taken from jQuery 1.4 build, assumes that Git version control is used.
It extracts the date of the last commit using `git log` command
and than feeds it to `replaceregexp` task.

### The Final Step: Crunching

To minify JavaScript code Google Closure Compiler is applied to all combined files:

    <target name="min" depends="combine">
  
      <echo message="Minifing js files..." />
  
      <apply executable="java" parallel="false" verbose="true" dest=".">
        <fileset dir=".">
          <include name="${FE}.js" />
          <!-- other files here -->
        </fileset>
        <arg line="-jar" />
        <arg path="build/libs/google-compiler-20100917.jar" />
        <arg value="--warning_level" />
        <arg value="QUIET" />
        <arg value="--js_output_file" />
        <targetfile />
        <arg value="--js" />
        <mapper type="glob" from="*.js" to="*.min.js" />
      </apply>

    </target>
  
### Drawbacks

The described build process proved to be usable and quite efficient
but it has several drawbacks so there is still enough room for improvements.

The first problem is that JsTestDriver server should be run and at least one browsed should be captured
otherwise it can't run unit tests so the build seems broken.
The work around is to run the server and browsers on operation system start up.
Unfortunately, it is not complete solution because from time to time (quite rarely)
connection between the captured browser and the test server is lost
so you have to recapture the browsers.

Next, such build may work quite slow.
For example, on my netbook (Atom 1.6GHz, 1Gb) complete build of [formEngine.js][fe]
takes more than 20 seconds.
It is not so bad but I don't mind to reduce this time in tenfold.

The last drawback it inherent dependency on Java and Ant,
not a big deal, but these tools should be installed on all developer's and build machines.

### What Next: Glance in the Future

The solution described in this article has been developed at 2010
but JavaScript world goes forward so fast that at the beginning of 2011
it already seems a bit obsolete.
I wonder how it should evolve in the near feature
and what of cutting edge technologies will make developer's life a bit easier.

I bet on Node.js.
Ant is good and solves most of the problems more or less gracefully
but it's so tempting to write all build in pure JavaScript instead of XML...

Lets just look around.
JSLint has always been in JavaScript
and now there is also new and cool minifier - Uglify.js.
It's used by jQuery 1.5 so there is no doubts in its quality and maturity.
The results of Uglify.js are even better than Closure Compiler shows.
Besides these the most complex components there are many other build tools present,
for example, Jake is a JavaScript Ant replacement
and jasmine-node could be used to run Jasmine tests directly under Node.js.

The ground seems ready now and, I hope, in a next article about web application build
there will be no such thing as Java dependency drawback :)

Thank you for your time.

### Links

* [Apache Ant][ant]
* [Mozila Rhino][rhino]
* [JSLint][jslint]
* [JsTestDriver][jstestdriver]
* [Jasmine][jasmine]
* [Google Closure Compiler][closure]
* [Node.js][node]
* [Uglify.js][uglify]
* [Jake][jake]


[fe]: https://github.com/yushchenko/formEngine.js "FormEngine.js Project Home"
[jquery]: http://jquery.com/ "jQuery Project Home"
[jqueryui]: http://jqueryui.com/ "jQuery UI Project Home"
[ant]: http://ant.apache.org/ "Apache Ant Home"
[closure]: http://code.google.com/closure/compiler/ "Google Closure Compiler Home"
[jslint]: http://www.jslint.com/lint.html "JSLint Home"
[rhino]: http://www.mozilla.org/rhino/ "Mozila Rhino Home"
[jstestdriver]: http://code.google.com/p/js-test-driver/ "JsTestDrive Home"
[jasmine]: http://pivotal.github.com/jasmine/ "Jasmine BDD Home"
[node]: http://nodejs.org/ "Node.js Home"
[uglify]: https://github.com/mishoo/UglifyJS "Uglify.js Project"
[jake]: https://github.com/280north/jake "Jake Project"

[generate.js]: https://github.com/yushchenko/formEngine.js/blob/v0.2/build/generate.js "FormEngine.js 0.2 Source: generate.js"
[utils.js]: https://github.com/yushchenko/formEngine.js/blob/v0.2/build/utils.js "FormEngine.js 0.2 Source: utils.js"
[lint.js]: https://github.com/yushchenko/formEngine.js/blob/v0.2/build/lint.js "Form Engine.js 0.2 Source: lint.js"
