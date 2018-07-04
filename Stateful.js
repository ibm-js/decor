/** @module decor/Stateful */
define([
	"dcl/advise",
	"dcl/dcl",
	"./features",
	"./Notifier"
], function (advise, dcl, has, Notifier) {
	var apn = {};

	// Object.is() polyfill from Observable.js
	function is(lhs, rhs) {
		return lhs === rhs && (lhs !== 0 || 1 / lhs === 1 / rhs) || lhs !== lhs && rhs !== rhs;
	}

	/**
	 * Helper function to map "foo" --> "_setFooAttr" with caching to avoid recomputing strings.
	 */
	function propNames(name) {
		if (apn[name]) {
			return apn[name];
		}
		var ret = apn[name] = {
			s: "_" + name + "Shadow",	// shadow property, used for storage by accessors
			o: "_" + name + "Old"		// used to track when value has changed
		};
		return ret;
	}

	// Track which objects have been introspected already.
	var instrumentedObjects = new WeakMap();

	/**
	 * Base class for objects that provide named properties with the ability to observe for property changes.
	 * Note though that expando properties (i.e. properties added to an instance but not in the prototype) are not
	 * observable for changes.
	 *
	 * Also has _set() and _get methods for helping to write custom accessors.
	 *
	 * @example <caption>Example 1</caption>
	 * var MyClass = dcl(Stateful, { foo: "initial" });
	 * var obj = new MyClass();
	 * obj.observe(function(oldValues){
	 *    if ("foo" in oldValues) {
	 *      console.log("foo changed to " + this.foo);
	 *    }
	 * });
	 * obj.foo = bar;
	 *
	 * Stateful by default interprets the first parameter passed to the constructor as a set of properties to
	 * mix in to the instance immediately after it is created:
	 *
	 * @example <caption>Example 2</caption>
	 * var MyClass = dcl(Stateful, { foo: "initial" });
	 * var obj = new MyClass({ foo: "special"});
	 *
	 * @mixin module:decor/Stateful
	 */
	var Stateful = dcl(/** @lends module:decor/Stateful# */ {
		declaredClass: "decor/Stateful",

		// Flag used by instrument()
		_isStatefulSuperclass: true,

		/**
		 * Sets up ES5 getters/setters for every enumerated property in every object in the prototype chain.
		 * @protected
		 */
		instrument: function () {
			// Instrument all objects in the prototype chain excluding a base class of HTMLElement, i.e. all objects
			// up to and including the one with the _isStatefulSuperclass flag.
			// Note: must instrument the object with the _isStatefulSuperclass flag because it might not just be
			// Stateful, but a mixture of Stateful properties with other classes' properties, due to complexities of
			// how dcl() handles multiple inheritance and also complications from having HTMLElement (or any non-dcl
			// class?) in the prototype chain.
			var proto = this;
			do {
				proto = Object.getPrototypeOf(proto);
				if (!instrumentedObjects.has(proto)) {
					this.instrumentObject(proto);
					instrumentedObjects.set(proto, true);
				}
			} while (!proto.hasOwnProperty("_isStatefulSuperclass"));
		},

		/**
		 * Instrument enumerable properties of one object in the prototype chain.
		 */
		instrumentObject: function (proto) {
			Object.keys(proto).forEach(function (prop) {
				// Skip functions, instrumenting them will break calls like advice.after(widget, "destroy", ...).
				if (typeof proto[prop] === "function") {
					return;
				}

				var names = propNames(prop),
					shadowProp = names.s,
					oldProp = names.o;

				// Setup hidden shadow property to store the original value of the property.
				// For a property named foo, saves raw value in _fooShadow.
				Object.defineProperty(proto, shadowProp, {
					enumerable: false,
					configurable: false,
					value: proto[prop]
				});
				
				// Setup ES5 getter and setter for this property, unless it already has custom ones.
				var descriptor = Object.getOwnPropertyDescriptor(proto, prop);
				if (!descriptor.set) {
					Object.defineProperty(proto, prop, {
						enumerable: true,
						configurable: true,
						set: function (val) {
							// Put shadow property in instance, masking the one in the prototype chain.
							Object.defineProperty(this, shadowProp, {
								enumerable: false,
								configurable: true,
								value: val
							});
						},
						get: function () {
							return this[shadowProp];
						}
					});
				}

				// Track when user changes the value.
				advise(proto, prop, {
					set: {
						before: function () {
							// Save old value before it's overwritten.
							this[oldProp] = this[prop];
						},
						after: function () {
							var oldValue = this[oldProp],
								newValue = this[prop];
							if (!is(newValue, oldValue)) {
								this._notify(prop, oldValue);
							}
							delete this[oldProp];
						}
					}
				});
			}, this);
		},

		constructor: dcl.advise({
			before: function () {
				// First time this class is instantiated, instrument it.
				// Use _instrumented flag on constructor, rather than prototype, to avoid hits when superclass
				// was already inspected but this class wasn't.
				var ctor = this.constructor;
				if (!ctor._instrumented) {
					this.instrument();
					ctor._instrumented = true;
				}
			},

			after: function (args) {
				// Automatic setting of params during construction.
				// In after() advice so that it runs after all the subclass constructor methods.
				this.processConstructorParameters(args);
			}
		}),

		/**
		 * Called after Object is created to process parameters passed to constructor.
		 * @protected
		 */
		processConstructorParameters: function (args) {
			if (args.length) {
				this.mix(args[0]);
			}
		},

		/**
		 * Set a hash of properties on a Stateful instance.
		 * @param {Object} hash - Hash of properties.
		 * @example
		 * myObj.mix({
		 *     foo: "Howdy",
		 *     bar: 3
		 * });
		 */
		mix: function (hash) {
			for (var x in hash) {
				this[x] = hash[x];
			}
		},

		/**
		 * Helper for custom accessors, set value for "shadow" copy of a property.
		 * @param {string} name - The property to set.
		 * @param {*} value - Value to set the property to.
		 * @protected
		 */
		_set: function (name, value) {
			var shadowPropName = propNames(name).s;
			
			// Add the shadow property to the instance, masking what's in the prototype.
			// Use Object.defineProperty() so it's hidden from for(var key in ...) and Object.keys().
			Object.defineProperty(this, shadowPropName, {
				enumerable: false,
				configurable: true,
				value: value
			});
		},

		/**
		 * Helper for custom accessors, returns value of "shadow" copy of a property.
		 * @param {string} name - Name of property.
		 * @returns {*} Value of property.
		 * @protected
		 */
		_get: function (name) {
			return this[propNames(name).s];
		},

		/**
		 * Returns true if _set() has been called to save a custom value for the specified property.
		 * @param {string} name - Name of property.
		 * @returns {*} Value of property.
		 * @protected
		 */
		_has: function (name) {
			return this.hasOwnProperty(propNames(name).s);
		},

		/**
		 * Notifies current values to observers for specified property name(s).
		 * Handy to manually schedule invocation of observer callbacks when there is no change in value.
		 * @method module:decor/Stateful#notifyCurrentValue
		 * @param {...string} name The property name.
		 */
		notifyCurrentValue: function () {
			if (this._notify) {
				Array.prototype.forEach.call(arguments, function (name) {
					this._notify(name, this[name]);
				}, this);
			}
		},

		/**
		 * Observes for change in properties.
		 * Callback is called at the end of micro-task of changes with a hash table of
		 * old values keyed by changed property.
		 * Multiple changes to a property in a micro-task are squashed.
		 * @method module:decor/Stateful#observe
		 * @param {function} callback The callback.
		 * @returns {Object}
		 *     Object with `deliver()`, `discardChanges()`, and `remove()` methods.
		 * @example
		 *     var stateful = new (dcl(Stateful, {
		 *             foo: undefined,
		 *             bar: undefined,
		 *             baz: undefined
		 *         }))({
		 *             foo: 3,
		 *             bar: 5,
		 *             baz: 7
		 *         });
		 *     stateful.observe(function (oldValues) {
		 *         // oldValues is {foo: 3, bar: 5, baz: 7}
		 *     });
		 *     stateful.foo = 4;
		 *     stateful.bar = 6;
		 *     stateful.baz = 8;
		 *     stateful.foo = 6;
		 *     stateful.bar = 8;
		 *     stateful.baz = 10;
		 */
		observe: function (callback) {
			var h = new Notifier(callback.bind(this));

			// Tell the Notifier when any property's value is changed,
			// Also, make this.deliver() and this.discardComputing() call deliver() and discardComputing() on Notifier.
			var advices = [
				advise.after(this, "_notify", function (args) {
					h.notify(args[0], args[1]);
				}),
				advise.after(this, "deliver", h.deliver.bind(h)),
				advise.after(this, "discardChanges", h.discardChanges.bind(h))
			];

			return {
				deliver: h.deliver.bind(h),
				discardChanges: h.discardChanges.bind(h),
				remove: function () {
					if (!this._removed) {
						h.discardChanges();
						advices.forEach(function (advice) {
							advice.destroy();
						});
						h = null;
						advices = null;
						this._removed = true;
					}
				}
			};
		},

		/**
		 * Don't call this directly, it's a hook-point to register listeners.
		 * @private
		 */
		_notify: function () {
		},

		/**
		 * Synchronously deliver change records to all listeners registered via `observe()`.
		 */
		deliver: function () {
		},

		/**
		 * Discard change records for all listeners registered via `observe()`.
		 */
		discardChanges: function () {
		}
	}, {
		enumerable: false
	});

	dcl.chainAfter(Stateful, "instrument");

	return Stateful;
});
