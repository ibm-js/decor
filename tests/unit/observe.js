define([
	"intern!object",
	"intern/chai!assert",
	"decor/observe"
], function (registerSuite, assert, observe) {
	var handles = [];

	registerSuite({
		name: "bind",

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
		}

		// TODO: check that observers called in order they were registered.
		// TODO: test observe of decor/Stateful subclasses
		// TODO: test that setting a prop to its current value doesn't trigger a notification
	});
});
