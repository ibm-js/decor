---
layout: default
title: decor/Stateful
---

# decor/Stateful

decor/Stateful allows you to define a class with a set of properties,
and to define custom getters/setters for some (or all, or none) of those properties:

```js
MyClass = dcl(Stateful, {
	label: "Press",
	_setLabelAttr: function(val){
		this._set("label", ...);
		...
	}
});
```

Then application code can instantiate instances of that class, and set and retrieve its properties
using standard notation:

```js
var myWidget = new MyClass();
myWidget.label = "hello";
console.log(myWidget.label);
```

Application code can also observe changes to the instance properties:

```js
myWidget.observe(function (oldVals) {
	Object.keys(oldVals).forEach(function (prop) {
		console.log(prop + "  changed from " + oldVals[prop] + " to " + this[prop]);
	});
});
```


## Implementation notes

The design goals of Stateful were:

* allow property update and access via `myWidget.foo = ...` syntax, rather than `set()` and `get()`
  methods (or `setFoo()` and `getFoo()` methods)
* no requirement to call `deliverChangeRecords()` (or similar function) after changing instance properties
* work with [dcl](http://www.dcljs.org/) to allow proper OO programming
* no performance penalty due to polling for property changes
* no performance penalty if many instances of the class are created

The `observe()` method is implemented using the `decor/Observable` shim of `Object.observe()`.

`decor/Stateful` notes all the properties defined in the prototype, direct and inherited,
and calls `Object.defineProperty()` on the **prototype** to add native ES5 setters and getters for those properties.
For properties where the subclass doesn't define a custom setter, Stateful will generate one on-the-fly
that just calls `this._set(...)` to save the new value and notify `Observable` that the value changed.

Putting the custom setters on the prototype means that there's no performance issue when many instances of
the class are created.

Ideally ES5 native accessors would be supported via [dcl](http://www.dcljs.org/) but we are
[still waiting for that](https://github.com/uhop/dcl/issues/2).  They aren't supported
by [ComposeJS](https://github.com/kriszyp/compose) either, although Kitson has
[a branch](https://github.com/kitsonk/core/blob/master/compose.js#L373) that supports them,
so using his branch is another option, if we could live with ComposeJS's limited features like
lack of C3MRO.
