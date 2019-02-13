define([
	"intern!object",
	"intern/chai!assert",
	"../../Stateful",
	"dcl/dcl"
], function (registerSuite, assert, Stateful, dcl) {
	registerSuite({
		name: "Stateful",

		"observe": function () {
			var StatefulClass1 = dcl(Stateful, {
				foo: 1,
				bar: 2
			});

			var log = [];
			var oldValsLog = [];
			var instance = new StatefulClass1();
			instance.observe(function callback1(oldVals) {
				log.push("a");
				oldValsLog.push(oldVals);
				throw new Error("Intentional exception for testing");
			});
			instance.observe(function callback2(oldVals) {
				log.push("b");
				oldValsLog.push(oldVals);
			});
			instance.foo = 3;
			instance.bar = 4;

			var dfd = this.async(1000);
			setTimeout(dfd.callback(function () {
				assert.deepEqual(log, ["a", "b"], "log");
				assert.deepEqual(oldValsLog, [{foo: 1, bar: 2}, {foo: 1, bar: 2}], "oldValsLog");
			}), 10);
		},

		"accessors": function () {
			var StatefulClass1 = dcl(Stateful, {
				foo: dcl.prop({
					set: function (val) {
						this._set("foo", val);
					},
					get: function () {
						return (this._has("foo") ? this._get("foo") : 0) - 1;
					},
					enumerable: true,
					configurable: true
				}),
				bar: dcl.prop({
					set: function (val) {
						this._set("bar", val + 1);
					},
					get: function () {
						return this._has("bar") ? this._get("bar") : 0;
					},
					enumerable: true,
					configurable: true
				}),
				baz: ""
			});

			var instance = new StatefulClass1();
			instance.foo = 4;
			instance.bar = 2;
			instance.baz = "bar";

			assert.strictEqual(instance.foo, 3, "instance.foo getter works");
			assert.strictEqual(instance.bar, 3, "instance.bar setter works");
			assert.strictEqual(instance.baz, "bar", "attribute set properly");

			// Make sure that prototype itself wasn't modified, only the instance.
			var instance2 = new StatefulClass1();
			assert.strictEqual(instance2.baz, "", "prototype.baz wasn't modified");
		},

		"paramHandling": function () {
			// Check if user overrides widget to not process constructor params
			var IgnoreParamsStateful = dcl(Stateful, {
				foo: 3,
				processConstructorParameters: function () {
				}
			});
			var ignore = new IgnoreParamsStateful({
				foo: 4
			});
			assert.strictEqual(ignore.foo, 3, "constructor foo ignored");

			// And make sure it works even if the argument isn't a hash
			var ignore2 = new IgnoreParamsStateful(5, 4, 3, 2, 1);
			assert.strictEqual(ignore2.foo, 3, "ignore2 created");
		},

		"getSetObserve": function () {
			var dfd = this.async(1000),
				count = 0,
				s = new (dcl(Stateful, {
					foo: 3
				}))();
			assert.strictEqual(s.foo, 3);
			var watching = s.observe(dfd.rejectOnError(function (oldValues) {
				if (++count > 1) {
					throw new Error("Observer callback should not be called after observation is stopped.");
				}

				assert.deepEqual(oldValues, {foo: 3});
				assert.strictEqual(s.foo, 4);

				watching.remove();
				s.foo = 5;
				assert.strictEqual(s.foo, 5);

				setTimeout(dfd.resolve.bind(dfd), 100);
			}));
			s.foo = 4;
			assert.strictEqual(s.foo, 4);
		},

		"removeObserveHandleTwice": function () {
			var dfd = this.async(1000),
				s = new (dcl(Stateful, {
					foo: 3
				}))(),
				changes = [];

			var watching = s.observe(dfd.rejectOnError(function (oldValues) {
				changes.push({id: "toBeRemoved", oldValues: oldValues});
			}));

			s.observe(dfd.rejectOnError(function (oldValues) {
				changes.push({id: "toBeAlive", oldValues: oldValues});
			}));

			s.foo = 4;
			watching.remove();
			watching.remove();
			s.foo = 5;

			setTimeout(dfd.callback(function () {
				assert.deepEqual(changes, [
					{id: "toBeAlive", oldValues: {foo: 3}}
				]);
			}), 100);
		},

		"setHash: observe()": function () {
			var dfd = this.async(1000),
				s = new (dcl(Stateful, {
					foo: 0,
					bar: 0
				}))(),
				changes = [];

			s.observe(dfd.rejectOnError(function (oldValues) {
				changes.push(oldValues);
			}));

			s.mix({
				foo: 3,
				bar: 5
			});

			assert.strictEqual(s.foo, 3);
			assert.strictEqual(s.bar, 5);

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(changes, [{foo: 0, bar: 0}]);

				var Clz2 = dcl(Stateful, {
						foo: 0,
						bar: 0
					}),
					s2 = new Clz2();
				s2.mix(s);
				assert.strictEqual(s2.foo, 3);
				assert.strictEqual(s2.bar, 5);

				setTimeout(dfd.callback(function () {
					// s watchers should not be copied to s2
					assert.strictEqual(changes.length, 1);
				}), 100);
			}), 100);
		},

		"observing custom accessors": function () {
			var dfd = this.async(1000),
				StatefulClass4 = dcl(Stateful, {
					foo: dcl.prop({
						set: function (val) {
							this._set("foo", val);
						},
						get: function () {
							return this._has("foo") ? this._get("foo") : 0;
						},
						enumerable: true,
						configurable: true
					}),

					// Alias for foo.
					bar: dcl.prop({
						set: function (val) {
							this.foo = val + 1;
						},
						get: function () {
							return this.foo - 1;
						},
						enumerable: false
					})
				}),
				attr4 = new StatefulClass4(),
				changes = [];
			attr4.observe(dfd.rejectOnError(function (oldValues) {
				changes.push(oldValues);
			}));
			attr4.foo = 3;
			assert.strictEqual(attr4.foo, 3, "foo #1");
			assert.strictEqual(attr4.bar, 2, "bar #1");
			attr4.bar = 4;
			assert.strictEqual(attr4.foo, 5, "foo #2");
			assert.strictEqual(attr4.bar, 4, "bar #2");

			setTimeout(dfd.callback(function () {
				assert.deepEqual(changes, [{foo: 0}]);
			}), 100);
		},

		"subclasses1: observe()": function () {
			// Test when superclass and subclass are declared first, and afterwards instantiated.
			var dfd = this.async(1000),
				SuperClass = dcl(Stateful, {
					foo: null,
					bar: null
				}),
				SubClass = dcl(SuperClass, {
					bar: 5
				}),
				sub = new SubClass(),
				changes = [];
			sub.observe(dfd.rejectOnError(function (oldValues) {
				changes.push({id: "sub", oldValues: oldValues});
			}));
			sub.foo = 3;
			sub.bar = 4;

			var sup = new SuperClass();
			sup.observe(dfd.rejectOnError(function (oldValues) {
				changes.push({id: "sup", oldValues: oldValues});
			}));
			sup.foo = 5;
			sup.bar = 6;

			setTimeout(dfd.callback(function () {
				assert.deepEqual(changes, [
					{id: "sub", oldValues: {foo: null, bar: 5}},
					{id: "sup", oldValues: {foo: null, bar: null}}
				]);
			}), 100);
		},

		"subclasses2: observe()": function () {
			// Test when superclass is declared and instantiated, then subclass is declared and used later.
			var dfd = this.async(1000),
				SuperClass = dcl(Stateful, {
					foo: null,
					bar: null
				}),
				sup = new SuperClass(),
				changes = [];
			sup.observe(dfd.rejectOnError(function (oldValues) {
				changes.push({id: "sup", oldValues: oldValues});
			}));
			sup.foo = 5;
			sup.bar = 6;

			var SubClass = dcl(SuperClass, {
					bar: 5
				}),
				sub = new SubClass();
			sub.observe(dfd.rejectOnError(function (oldValues) {
				changes.push({id: "sub", oldValues: oldValues});
			}));
			sub.foo = 3;
			sub.bar = 4;

			setTimeout(dfd.rejectOnError(function () {
				assert.deepEqual(changes, [
					{id: "sup", oldValues: {foo: null, bar: null}},
					{id: "sub", oldValues: {foo: null, bar: 5}}
				], "changes");

				// Changing bar from 6 to 6 doesn't trigger another observe callback.
				sup.bar = 6;
				setTimeout(dfd.callback(function () {
					assert.strictEqual(changes.length, 2, "changes.length");
				}), 100);
			}), 100);
		},

		"observe(): Changing some properties while some of them don't yield actual changes": function () {
			var dfd = this.async(1000),
				stateful = new (dcl(Stateful, {
					foo: undefined,
					bar: undefined,
					baz: undefined,
					quux: undefined
				}))({
					foo: "Foo",
					bar: "Bar0",
					baz: NaN,
					quux: 0
				});
			stateful.observe(dfd.callback(function (oldValues) {
				assert.deepEqual(oldValues, {
					bar: "Bar0",
					quux: 0
				});
			}));
			stateful.foo = "Foo";
			stateful.bar = "Bar1";
			stateful.bar = "Bar2";
			stateful.baz = NaN;
			stateful.quux = -0;
		},

		"notifyCurrentValue()": function () {
			var dfd = this.async(1000),
				stateful = new (dcl(Stateful, {
					foo: undefined,
					bar: undefined,
					zaz: undefined
				}))({
					foo: "Foo",
					bar: "Bar",
					zaz: "Zaz"
				});
			stateful.observe(dfd.callback(function (oldValues) {
				assert.deepEqual(oldValues, {foo: "Foo", bar: "Bar", zaz: "Zaz"});
			}));
			stateful.notifyCurrentValue("foo", "bar");
			stateful.notifyCurrentValue("zaz");
		},

		"Stateful.PropertyListObserver#deliver(), Stateful.PropertyListObserver#discardChanges()": function () {
			var changes = [],
				stateful = new (dcl(Stateful, {
					foo: undefined
				}))({
					foo: "Foo0"
				}),
				hObserve = stateful.observe(function (oldValues) {
					changes.push(oldValues);
				});
			stateful.foo = "Foo1";
			hObserve.discardChanges();
			stateful.foo = "Foo2";
			hObserve.deliver();
			assert.deepEqual(changes, [{foo: "Foo1"}]);
		},

		"Stateful#deliver(), Stateful#discardChanges()": function () {
			var stateful = new (dcl(Stateful, {
				foo: undefined,
				bar: undefined
			}))({
				foo: "Foo0",
				bar: "Bar0"
			});
			var log = "";
			stateful.observe(function () {
				log += "first";
			});
			stateful.observe(function () {
				log += ", second";
			});
			stateful.foo = "Foo1";
			stateful.bar = "Bar1";
			stateful.deliver();
			assert.strictEqual(log, "first, second", "deliver()");

			log = "";
			stateful.foo = "Foo2";
			stateful.bar = "Bar2";
			stateful.discardChanges();
			stateful.deliver();
			setTimeout(this.async().callback(function () {
				assert.strictEqual(log, "", "discardChanges()");
			}), 10);
		},

		"observe filter": function () {
			// Check to make sure reported changes are consistent between platforms with and without Object.observe()
			// native support
			var dfd = this.async(1000),
				stateful = new (dcl(Stateful, {
					_private: 1,

					foo: 2,

					constructor: function () {
						this.instanceProp = 3;
					}
				}))({});
			stateful.observe(dfd.callback(function (oldValues) {
				assert.deepEqual(oldValues, {
					_private: 1,
					foo: 2
				});
			}));
			stateful._private = 11;
			stateful.foo = 22;
			stateful.instanceProp = 33;
		},

		"enumeration": function () {
			// Test ability to hide all the properties (including inherited ones)
			// except the ones that should be public.
			var dfd = this.async(1000);
			var StatefulClass1 = dcl(Stateful, {
				foo: 0,
				bar: 0,
				barAlias: dcl.prop({
					set: function (val) { this.bar = val; },
					get: function () { return this.bar; },
					enumerable: false
				})
			});
			var instance1 = new StatefulClass1();

			// Make sure that shadow properties and Stateful methods aren't enumerable.
			var forEachKeys = [];
			for (var key in instance1) {
				forEachKeys.push(key);
			}
			assert.deepEqual(forEachKeys, ["foo", "bar"], "forEachKeys");

			instance1.observe(dfd.callback(function (oldValues) {
				assert.deepEqual(oldValues, {
					foo: 0,
					bar: 0
				});
			}));

			instance1.foo = 1;
			instance1.barAlias = 1;

			// Make sure that changing foo didn't make the shadow property visible.
			var forEachKeys2 = [];
			for (var key2 in instance1) {
				forEachKeys2.push(key2);
			}
			assert.deepEqual(forEachKeys2, ["foo", "bar"], "forEachKeys2");
		}
	});
});
