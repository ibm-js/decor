---
layout: doc
title: decor/Stateful
---

# decor/Stateful

decor/Stateful allows an application to define a class with a set of properties,
and to observe changes to an instance's properties.
The application defines the class like this, declaring the properties in the prototype:

```js
MyClass = dcl(Stateful, {
	label: "Press"
});
```

Then the application can instantiate instances of that class, and set and retrieve its properties
using standard notation:

```js
var myInstance = new MyClass();
myInstance.label = "hello";
console.log(myInstance.label);
```

## Observing changes

Application code can observe changes to the instance properties using `.observe()`, like this:

```js
myInstance.observe(function (oldVals) {
	Object.keys(oldVals).forEach(function (prop) {
		console.log(prop + "  changed from " + oldVals[prop] + " to " + this[prop]);
	}, this);
});
```

Note that `oldVals` is a hash of all the properties that have changed (since the last execution of the
callback method), rather than an array of change records such as `Object.observe()` delivers.

## Custom setters

It can also define custom getters/setters for some (or all, or none) of those properties,
using dcl's syntax.

```js
MyClass = dcl(Stateful, {
	label: dcl.prop({
		set: function (val) {
			this._set("label", ...);
			...
		},
		get: function () {
			return this._has("label") ? this._get("label") : "Default value";
		},
		enumerable: true,
		configurable: true
	});
});
```

Note that:
 
1. The custom setter should call `this._set()` to record the new value of the property.
2. Setter and getter must be defined in pairs.
3. To monitor changes to the property, must set `enumerable` and `configurable` to true.
