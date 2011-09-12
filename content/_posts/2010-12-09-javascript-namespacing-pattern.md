---
layout: post
title: "A JavaScript Namespacing Pattern"
tags: [javascript, namespacing]
categories: articles
---

# {{ page.title }}

### Namespacing Problem

The simplest way to create a namespace in JavaScript is to declare object variable in the global scope:

    var app = { ns: {}};
    app.ns.aFunction = function aFunction() (/*...*/};
    
Looks a bit clumsy even in a small example.
For an application with a hundred of source files it will make the code messy extremely fast.
The problem becomes even worse if several files should contribute in the same namespace
and you don't want to worry a lot about their inclusion order.

For real world tasks it would be better to have a solution that fits the following basic requirements:

*   Concise and readable syntax without duplication of namespace name;
*   Ability to add members to the same namespace in several files;
*   Scope for private data and functions;
*   Simple and library independent implementation;

### Combining Patterns for a Better Solution

There are several well known patterns that simplify namespacing in JavaScript.
Lets try to find a proper combination of them to split code into namespaces in an elegant way.

First, namespace creation should be done automatically on demand:

    ns('app.test.namespace');

The function parses namespace name and creates appropriate chain of objects in the global scope.
If the namespace already exists the function just returns it without damaging.

Next, created namespace should be filled with members in a convenient manner
without endless repetition of namespace's name.
The [pattern][edwards] provided by James Edwards looks elegant and concise:

    (function () {

        var aPrivateMember = 'value';
     
        this.aNamespaceMember = function() {/*...*/};
    
    }).apply(ns('app.test.namespace'));

Anonymous function gives the scope for private members and `this` is used as reference to the namespace.

Now let's give a final touch adding chaining.
It helps us to move namespace declaration at the beginning
and make the code a bit more readable hiding implementation details:

    ns('ns.test').extend(function () {

        var ctor = this.MyClass = function() {
            },
            secret = 'secret';  // private namespace data, common for all instances

        ctor.prototype.getSecret = function getSecret() { // public method
            return secret;
        };
    });
    
### Micro Library

For the sake of convenience I have created a micro library which implements the solution discussed above.
It's called `ns.js` and lives [here on Github][source].

Feel free to contact with [me][about] if you have any suggestions how to make it better.

### Links

1. [ns.js Micro Library on Github][source]
2. [Namespacing in JavaScript][croll] by Angus Croll
3. [My Favorite JavaScript Design Pattern][edwards] by James Edwards
4. [JavaScript Namespacing][michaux] by Peter Michaux


[source]: http://github.com/yushchenko/ns.js "ns.js source code"
[croll]: http://javascriptweblog.wordpress.com/2010/12/07/namespacing-in-javascript/
[edwards]: http://blogs.sitepoint.com/2010/11/30/my-favorite-javascript-design-pattern/
[michaux]: http://michaux.ca/articles/javascript-namespacing
[about]: /about/
