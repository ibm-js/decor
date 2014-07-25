---
layout: default
title: Decor Architecture
---

# Decor Architecture

## Stateful

The design goals of Stateful were:

* allow property update and access via `myWidget.foo = ...` syntax, rather than `set()` and `get()`
  methods (or `setFoo()` and `getFoo()` methods)
* no requirement to call `deliverChangeRecords()` (or similar function) after changing instance properties
* work with [dcl](http://www.dcljs.org/) to allow proper OO programming
* no performance penalty due to polling for property changes
* no performance penalty if many instances of the class are created

The `observe()` method is implemented using the [`decor/Observable`](Observable.md) shim of `Object.observe()`.

`decor/Stateful`(Stateful.md) notes all the properties defined in the prototype, direct and inherited,
and calls `Object.defineProperty()` on the **prototype** to add native ES5 setters and getters for those properties.
For properties where the subclass doesn't define a custom setter, Stateful will generate one on-the-fly
that just calls `this._set(...)` to save the new value and notify `Observable` that the value changed.

Putting the custom setters on the prototype means that there's no performance issue when many instances of
the class are created.

Ideally ES5 native accessors would be supported via [dcl](http://www.dcljs.org/) but we are
[still waiting for that](https://github.com/uhop/dcl/issues/2).