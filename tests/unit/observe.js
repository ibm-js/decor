define(function (require) {
	"use strict";

	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var dcl = require("dcl/dcl");
	var observe = require("decor/observe");
	var Stateful = require("decor/Stateful");

	var handles = [];

	registerSuite("observe", {
		"basic": function () {
			var dfd = this.async(1000);
			var pojo = {
				foo: "Foo0",
				bar: "Bar0"
			};
			handles.push(observe(pojo, dfd.callback(function (oldVals) {
				assert.deepEqual(oldVals, {
					foo: "Foo0",
					bar: "Bar0"
				}, "oldVals");
			})));

			pojo.foo = "Foo1";
			pojo.bar = "Bar1";
			assert.strictEqual(pojo.foo, "Foo1", "observable.foo");
			assert.strictEqual(pojo.bar, "Bar1", "observable.bar");
		},

		"multiple notifications": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0"
			};
			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));

			pojo.foo = "Foo1";
			pojo.bar = "Bar1";

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(log, [
					{
						foo: "Foo0",
						bar: "Bar0"
					}
				], "first notification");

				pojo.foo = "Foo2";
				pojo.bar = "Bar2";

				setTimeout(dfd.callback(function () {
					assert.deepEqual(log, [
						{
							foo: "Foo0",
							bar: "Bar0"
						},
						{
							foo: "Foo1",
							bar: "Bar1"
						}
					], "second notification");
				}), 1);
			}), 1);
		},

		"set to same value": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0"
			};
			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));

			pojo.foo = "Foo0";

			setTimeout(dfd.callback(function () {
				assert.deepEqual(log, [], "no notifications");
			}), 1);
		},

		"notifications collapsed": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0"
			};
			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));

			pojo.foo = "Foo1";
			pojo.foo = "Foo2";

			setTimeout(dfd.callback(function () {
				assert.deepEqual(log, [{
					foo: "Foo0"
				}], "only one notification");
			}), 1);
		},

		"unobserve": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0"
			};
			var handle = observe(pojo, function (oldVals) {
				log.push(oldVals);
			});

			pojo.foo = "Foo1";

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(log, [{
					foo: "Foo0"
				}], "observed");

				handle.remove();
				log = [];

				pojo.foo = "Foo2";

				setTimeout(dfd.callback(function () {
					assert.deepEqual(log, [], "no notifications");
				}), 1);
			}), 1);
		},

		"multiple observers": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0"
			};
			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));

			pojo.foo = "Foo1";
			pojo.bar = "Bar1";

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(log, [
					{
						foo: "Foo0",
						bar: "Bar0"
					}
				], "first notification");

				pojo.foo = "Foo2";
				pojo.bar = "Bar2";

				setTimeout(dfd.callback(function () {
					assert.deepEqual(log, [
						{
							foo: "Foo0",
							bar: "Bar0"
						},
						{
							foo: "Foo1",
							bar: "Bar1"
						}
					], "second notification");
				}), 1);
			}), 1);
		},

		"observers called in order registered": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo1 = {
				foo: "pojo 1",
				bar: "Bar0"
			};
			var pojo2 = {
				foo: "pojo 2",
				bar: "Bar0"
			};

			handles.push(observe(pojo1, function (oldVals) {
				log.push(oldVals);
			}));
			handles.push(observe(pojo2, function (oldVals) {
				log.push(oldVals);
			}));

			// Update pojo2 first.  Pojo1 listener should still be called first.
			pojo2.foo = "pojo 2 update";
			pojo1.foo = "pojo 1 update";

			setTimeout(dfd.callback(function () {
				assert.deepEqual(log, [
					{
						foo: "pojo 1"
					},
					{
						foo: "pojo 2"
					}
				]);
			}), 1);
		},

		"nested": function () {
			var dfd = this.async(1000);
			var log = [], log2 = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0",
				nested1: {
					a: 1,
					b: 2,
					nested2: {
						c: 3,
						d: 4
					}
				}
			};
			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));
			handles.push(observe(pojo, function (oldVals) {
				log2.push(oldVals);
			}));

			// Change nested property.
			pojo.nested1.a = 2;

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(log, [
					{
						"nested1.a": 1
					}
				], "change in nested1");
				assert.deepEqual(log2, [
					{
						"nested1.a": 1
					}
				], "change in nested1, second listener");

				assert.strictEqual(pojo.nested1.a, 2, "new nested1.a");

				log = [];
				log2 = [];

				pojo.nested1.nested2.c = 4;

				setTimeout(dfd.rejectOnError(function () {
					assert.deepEqual(log, [
						{
							"nested1.nested2.c": 3
						}
					], "changed in nested2");
					assert.deepEqual(log, [
						{
							"nested1.nested2.c": 3
						}
					], "changed in nested2, second listener");

					log = [];
					log2 = [];

					// Change whole object.
					var oldNested1 = pojo.nested1;
					pojo.nested1 = {
						a: 5,
						b: 2,
						nested2: {
							c: 4,
							d: 10
						}
					};

					setTimeout(dfd.rejectOnError(function () {
						assert.deepEqual(log, [
							{
								"nested1.a": 2,
								"nested1.nested2.d": 4
							}
						], "new nested1");
						assert.deepEqual(log2, [
							{
								"nested1.a": 2,
								"nested1.nested2.d": 4
							}
						], "new nested1, second listener");

						log = [];
						log2 = [];

						// Check that changes to new nested1 are tracked and conversely,
						// that changes to old nested1 are *not* tracked.
						oldNested1.a = 20;
						pojo.nested1.b = 30;

						setTimeout(dfd.callback(function () {
							assert.deepEqual(log, [
								{
									"nested1.b": 2
								}
							], "changes to new nested1 tracked, changes to old nested1 not tracked");
							assert.deepEqual(log, [
								{
									"nested1.b": 2
								}
							], "changes to new nested1 tracked, changes to old nested1 not tracked, second listener");
						}), 1);
					}), 1);
				}), 1);
			}), 1);
		},

		"arrays and scalars": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				foo: "Foo0",
				bar: "Bar0",
				ary: [1, 2, 3, 4, 5]
			};
			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));

			// Change array child.
			pojo.ary[2] = -3;
			pojo.foo = "Foo1";

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(log, [
					{
						foo: "Foo0"
					}
				], "array elements not monitored");

				log = [];

				// Change array to scalar
				pojo.ary = "Hello world";

				setTimeout(dfd.rejectOnError(function () {
					assert.deepEqual(log, [
						{
							ary: [1, 2, -3, 4, 5]
						}
					], "array to scalar");

					log = [];

					// Change scalar to array
					pojo.ary = [1, 2, 3, 4, 5];

					setTimeout(dfd.callback(function () {
						assert.deepEqual(log, [
							{
								ary: "Hello world"
							}
						], "scalar to array");
					}), 1);
				}), 1);
			}), 1);
		},

		"HTML elements treated as scalars": function () {
			var dfd = this.async(1000);
			var log = [];
			var pojo = {
				a: 1,
				b: null
			};

			handles.push(observe(pojo, function (oldVals) {
				log.push(oldVals);
			}));

			pojo.b = document.createElement("div");

			setTimeout(dfd.callback(function () {
				// Don't do an assert() because the log has a ridiculous number of entries.
				// Not infinite, but every node etc. in the document.
			}), 1);
		},

		"observe decor/Stateful subclass": function () {
			var dfd = this.async(1000);
			var MyClass = dcl(Stateful, {
				foo: 1,
				bar: 2
			});
			var myObj = new MyClass();
			handles.push(observe(myObj, dfd.callback(function (oldVals) {
				assert.deepEqual(oldVals, {
					foo: 1,
					bar: 2
				}, "oldVals");
			})));

			myObj.foo = 3;
			myObj.bar = 4;
		}
	});
});
