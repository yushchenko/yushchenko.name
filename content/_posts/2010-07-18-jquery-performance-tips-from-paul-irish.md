---
layout: post
title: "jQuery Performance Tips from Paul Irish"
tags: [javascript, jquery, performance]
---

# {{ page.title }}

Today I've been happy to find a really cool presentation about jQuery performance.
It was created by [Paul Irish][paul] and located [here][presentation].
The [video][video] is also available online.

In my humble opinion, the presentation should be seen by every jQuery developer
and I regret that I have found it so late.
This short summary shows the picture in whole but, in any case, doesn't replace the original.

1\. Append as late as it's possible:

     for ( .. many items ..) { 
         $(...).append(item);           // slow, many DOM operations
     }
 
     var items = [];
     for ( ... many items ...) {
         items.push(item);    
     }
     $(...).html(items.join(''));       // faster, changing DOM in one touch
 
2\. Don't requery:

    $(target).append('<to append />');
    $('<to append />').click(...);

    $('<to append />').appendTo(target).click(...);      // working with appended elements
    
    
3\. Query in context:

    $('#container').find('.an-item')...; // the recomended way
    $('.an-item', '#container')...;      // the same
    
    $('#container .an-item')...;         // usual and slow approach 
    
4\. Read selectors from right to left like Sizzle does:

    $('#element span')...;               // it's going to find all spans in entire document first
    $('#element').find('span')...;       // using context again
    
5\. Be specific:
   
    $(':radio')...;                      // = *:radio, select everything than filter it
    $('input:radio')...;                 // much faster version
   
6\. Delegate - live events in context (jQuery 1.4.2):

    $('#container').delegate('click', '.item', fn);    // explicit context reduce overhead

7\. Detach it from DOM (jQuery 1.4):

    var container = $('#container'), parent = container.parent();
    container.detach();
    ..                                   // do havy DOM manipulations here
    parent.append(container);            // allows browser render your changes
    
8\. Don't pay for nothing:

    $('#notExistingElement').slideUp();  // does a lot of job

9\. Attach data fast:

    $(element).data(key, value);         // the usual way
    $.data(elemement, key, value);       // works up to 10x faster 


[paul]: http://paulirish.com/ "Paul Irish blog"
[presentation]: http://www.slideshare.net/paul.irish/perfcompression "jQuery Anti-Patterns for Performance & Compression"
[video]: http://vimeo.com/10295601 "jQuery Anti-Patterns for Performance & Compression Video"
