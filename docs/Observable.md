---
layout: default
title: decor/Observable - A shim of ES7 Object.observe() by value-holder object
---

# decor/Observable

`Observable` is an object working as a shim of ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).
`Observable` has `.set()` method for automatic emission of change record, and static `Observable.observe()` method to observe for that, for example:

<iframe width="100%" height="225" src="http://jsfiddle.net/ibmjs/pngb8/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/pngb8/">checkout the sample on JSFiddle</a></iframe>

Similar to ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe),
change records are delivered in a batch at the end of the [micro-task](http://www.whatwg.org/specs/web-apps/current-work/multipage/webappapis.html#microtask).
In above example, you'll see that change to `foo` property and change to `bar` properties are notified in a single callback, in a format of array.
The format of change records is compatible with ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).

Under the hood, `Observable.observe()` directly uses ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) if it's available natively in browser.

## Synchronous delivery of change record

There are some cases you want to deliver change records immediately,
instead of waiting for the end of [micro-task](http://www.whatwg.org/specs/web-apps/current-work/multipage/webappapis.html#microtask).
For that purpose, you can use `Observable.deliverChangeRecord()` that synchronously delivers change records that are queued for callback.
Here's an example:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/S83Ey/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/S83Ey/">checkout the sample on JSFiddle</a></iframe>

## Manual emission of change record

Similar to `Object.observe()`, `.set()` won't automatically emit a change record if:

* There is no actual change in value
* The given property has a setter (ECMAScript setter)

In such conditions, you can manually emit a change record (and queue it for delivery) by `Observable.getNotifier(observable).notify(changeRecord)` method, which is what `.set()` calls under the hood. Here's an example:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/5ezRw/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/5ezRw/">checkout the sample on JSFiddle</a></iframe>

## Synthetic change record

If you make a higher-level change to an object (as opposed to a simple property update/delete/add), such as array splice, having such higher-level change represented directly in a change record will be useful. You can do that by `Observable.getNotifier(observable).performChange(type, callback)` method. The first argument (`type`) is the change type you define for your higher-level change. The second argument is a function where you can make a series of changes that your higher-level change represents, and then return your higher-level change.

You can observe your higher-level change by adding the change type of your higher-level change to the third argument of `Observable.observe()`. Otherwise, raw changes to `Observable` (`update`, etc.) will be observed.

Here's an example, where `Point#move()` method moves the point with the given distance and direction (`angle`). The code to update `x` and `y` with the result is in `performChange()` callback so that the updates are represented by a change record with `move` type, with the distance and direction (`angle`):

<iframe width="100%" height="600" src="http://jsfiddle.net/ibmjs/B5BQK/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/B5BQK/">checkout the sample on JSFiddle</a></iframe>

## Utility functions

`Observable` has two static utility funcitons:

* `Observable.is(value0, value1)` - Compares `value0` and `value1`. Basically returns `value0 === value1`, except:
  * Returns `true` for `NaN` and `NaN`
  * Returns `false` for `+0` and `-0`
* `Observable.assign(observable, object0, object1...)` - Copies all enumerable properties in `object0`, `object1`, ... to `observable`, and automatically emits change records for those properties.
