---
layout: doc
---

The decor project contains some classes and utilities that are not directly related to UI.

## Observable classes

* [Invalidating](Invalidating.html) - Mixin class to for UI-related Custom Elements that want to calculate computed
  properties at once and/or to render UI at once upon multiple property changes
* [Observable](Observable.html) - The bedrock observable class, ES7 `Object.observe()` shim based on value-holder object
* [Stateful](Stateful.html) - Base class for widgets or other objects to allow ES5 getter/setter of properties and
  a simplified interface for notifications of property changes.

## Other classes

* [Destroyable](Destroyable.html) - Base class to track handles and release them when the instance is destroyed.
* [Evented](Evented.html) - Base class to emit events and let applications easily monitor those events.
* [schedule](schedule.html) - A utility function to schedule a callback at the end of [micro-task](http://www.whatwg.org/specs/web-apps/current-work/multipage/webappapis.html#microtask).
* [sniff](sniff.html) - Browser sniffing.

## General information

* [Decor architecture](architecture.html) - Notes on decor's design choices.