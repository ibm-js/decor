---
layout: default
title: decor/Invalidating
---

# decor/Invalidating

`decor/Invalidating` is a mixin class to for UI-related Custom Elements
that want to calculate computed properties at once and/or to render UI at once upon multiple property changes.
Invalidating extends `decor/Stateful`, and `delite/Widget` extends Invalidating.

For that purpose the class adds two lifecycle phases to the class.

The first phase is the refresh properties phase. It is used to reconcile instances properties after they have been
set. A typical example is making sure the value of a range component is correctly set between min and max values and
that the max value is bigger than min value. This phase is optional and not all classes leveraging `decor/Invalidating`
will need it.

The second phase is the refresh rendering phase. It is used to refresh the rendering of the class (usually a
`delite/Widget`) based on the new values of the changed properties. The advantage compared to doing that in a custom setter
or through template binding is that for several properties changes the refresh rendering phase will be called only once
leading to better performance by making sure the rendering is not modified several times in a row

##### Table of Contents
[Setting Up Invalidating](#setting)
[Implementing Lifecycle](#implementing)
[Using Invalidating](#using)
[Events](#events)

<a name="setting"></a>
## Setting up Invalidating

Note that in order to be subject to invalidation the corresponding property must also haven been declared on the class.

Note that any property subject to refresh properties phase will also be subject to the refresh rendering phase in a
second phase.

<a name="implementing"></a>
## Implementing the Lifecycle

Once you have setup your class, you will need to implement the lifecycle functions in order to react to property changes.
This can be done by redefining the `computeProperties()` and/or `refreshRendering()` functions. They both take as
parameter a hash object which contains the name of the properties that have triggered the refresh action. This is
particularly useful when several properties are involved.

```js
define(["delite/register", "delite/Widget"/*, ...*/],
  function (register, Widget/*, ...*/) {
  return register("my-widget", [HTMElement, Widget], {
    a: true,
    b: "value",
    computeProperties (oldValues) {
      if ("a" in oldValues) {
        // do something logical that does not directly impact the DOM because "a" has changed
        // To access new value, access directly to `this.a`
      }
    },
    refreshRendering (oldValues) {
      if ("b" in oldValues) {
        // modify the DOM because "b" has changed
        // To access new value, access directly to `this.b`
      }
      if ("a" in oldValues) {
      }
    }
  });
});
```

<a name="using"></a>
## Using Invalidating

Once setup you don't need anything special to use the invalidating class. You just need to change one of the properties
and the refresh methods will be called automatically for you.

If for some reason you want to invalidate a particular property without setting it explicitly
then you can call `notifyCurrentValue(property)`.

In some cases you might want to force the rendering to occur right after a given property has been set. For that you can
use `deliver()`.

In some cases you might want to avoid rendering from occurring even if a property was changed.
For that you can use `discardChanges()`.
