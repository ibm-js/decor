define([
	"intern!object",
	"intern/chai!assert",
	"decor/Invalidating",
	"dcl/dcl"
], function (registerSuite, assert, Invalidating, dcl) {
	registerSuite({
		name: "Invalidating",
		"Basic": function () {
			var dfd = this.async(1000),
				invalidating = new (dcl([Invalidating], {
					foo: undefined,
					bar: undefined,
					refreshRendering: dfd.callback(function (oldValues) {
						assert.deepEqual(oldValues, {foo: "Foo0", bar: "Bar0"});
					})
				}))({
					foo: "Foo0",
					bar: "Bar0"
				});
			// Changes after 1st addRenderingProperties() call should be delivered
			invalidating.bar = "Bar1";
			invalidating.foo = "Foo1";
		},
		"Property validation": function () {
			var computePropertiesCallCount = 0,
				dfd = this.async(1000),
				invalidating = new (dcl(Invalidating, {
					foo: undefined,
					computeProperties: dfd.rejectOnError(function () {
						if (++computePropertiesCallCount > 1) {
							throw new Error("computeProperties() should be called only once.");
						}
						if (this.foo < 0) {
							this.foo = 0;
							this.discardComputing();
						}
					}),
					refreshRendering: dfd.callback(function (oldValues) {
						assert.deepEqual(oldValues, {foo: 1});
					})
				}))({
					foo: 1
				});
			invalidating.foo = -1;
		},
		"Computed property": function () {
			var computePropertiesCallCount = 0,
				dfd = this.async(1000),
				invalidating = new (dcl(Invalidating, {
					foo: undefined,
					bar: undefined,
					baz: undefined,
					computeProperties: dfd.rejectOnError(function (oldValues) {
						if ("foo" in oldValues && typeof this.foo === "string") {
							this.bar = this.foo.replace(/^Foo/, "Bar");
						}
						if ("bar" in oldValues && typeof this.bar === "string") {
							this.baz = this.bar.replace(/^Bar/, "Baz");
						}
						if ("baz" in oldValues && typeof this.baz === "string") {
							this.foo = this.baz.replace(/^Baz/, "Foo");
						}
						++computePropertiesCallCount;
					}),
					refreshRendering: dfd.callback(function () {
						assert.strictEqual(computePropertiesCallCount, 3);
						assert.strictEqual(invalidating.foo, "Foo0");
						assert.strictEqual(invalidating.bar, "Bar0");
						assert.strictEqual(invalidating.baz, "Baz0");
					})
				}))();
			invalidating.foo = "Foo0";
		},
		"Synchronous change delivery": function () {
			var finishedMicrotask = false,
				dfd = this.async(1000),
				invalidating = new (dcl([Invalidating], {
					foo: undefined,
					bar: undefined,
					computeProperties: dfd.rejectOnError(function () {
						invalidating.bar = "Bar1";
						this.deliver();
					}),
					refreshRendering: dfd.callback(function (oldValues) {
						assert.isFalse(finishedMicrotask);
						assert.deepEqual(oldValues, {foo: "Foo0", bar: "Bar0"});
					})
				}))({
					foo: "Foo0",
					bar: "Bar0"
				});
			invalidating.foo = "Foo1";
			invalidating.deliverComputing();
			finishedMicrotask = true;
		},
		"Discard changes": function () {
			var dfd = this.async(1000),
				invalidating = new (dcl([Invalidating], {
					foo: undefined,
					refreshRendering: dfd.rejectOnError(function () {
						throw new Error("refreshRendering() shouldn't be called.");
					})
				}))({
					foo: "Foo0"
				});
			invalidating.foo = "Foo1";
			invalidating.discardChanges();
			setTimeout(dfd.resolve.bind(dfd), 100);
		}
	});
});
