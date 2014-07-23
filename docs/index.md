---
layout: doc
---

decor project contains some classes and utilities that are not directly related to UI.

## Observable classes

* [Observable](Observable.md) - The bedrock observable class, ES7 `Object.observe()` shim based on value-holder object
* [Invalidating](Invalidating.md) - Mixin class to for UI-related Custom Elements that want to calculate computed properties at once and/or to render UI at once upon multiple property changes
