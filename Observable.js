/** @module decor/Observable */
define([
	"./features",
	"./features!object-observe-api?:./schedule"
], function (has, schedule) {
	"use strict";

	/**
	 * An observable object, working as a shim
	 * of {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
	 * @class
	 * @alias module:decor/Observable
	 * @param {Object} o The object to mix-into the new Observable.
	 * @example
	 *     var observable = new Observable({foo: "Foo0"});
	 *     Observable.observe(observable, function (changeRecords) {
	 *         // Called at the end of microtask with:
	 *         //     [
	 *         //         {
	 *         //             type: "update",
	 *         //             object: observable,
	 *         //             name: "foo",
	 *         //             oldValue: "Foo0"
	 *         //         },
	 *         //         {
	 *         //             type: "add",
	 *         //             object: observable,
	 *         //             name: "bar"
	 *         //         }
	 *         //     ]
	 *     });
	 *     observable.set("foo", "Foo1");
	 *     observable.set("bar", "Bar0");
	 */
	var Observable,
		defineProperty = Object.defineProperty,
		getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	/**
	 * The default list of change record types, which is:
	 * [
	 *     "add",
	 *     "update",
	 *     "delete",
	 *     "reconfigure",
	 *     "setPrototype",
	 *     "preventExtensions"
	 * ]
	 * @constant {Array.<module:decor/Observable~ChangeType>}
	 *     module:decor/Observable~DEFAULT_CHANGETYPES
	 */
	var DEFAULT_ACCEPT_CHANGETYPES = {
		"add": 1,
		"update": 1,
		"delete": 1,
		"reconfigure": 1,
		"setPrototype": 1,
		"preventExtensions": 1
	}; // Observable#set() only supports the first two

	/**
	 * Change record type.
	 * One of:
	 * * "add"
	 * * "update"
	 * * "delete"
	 * * "reconfigure"
	 * * "setPrototype"
	 * * "preventExtensions"
	 * * "splice"
	 * @typedef {string} module:decor/Observable~ChangeType
	 */

	/**
	 * Change record seen in Observable.observe().
	 * @typedef {Object} module:decor/Observable~ChangeRecord
	 * @property {module:decor/Observable~ChangeType} type The type of change record.
	 * @property {Object} object The changed object.
	 * @property {string} [name] The changed property name. Set only for non-splice type of change records.
	 * @property {number} [index] The array index of splice. Set only for splice type of change records.
	 * @property {Array} [removed] The removed array elements. Set only for splice type of change records.
	 * @property {number} [addedCount] The count of added array elements. Set only for splice type of change records.
	 */

	/**
	 * Change callback.
	 * @callback module:decor/Observable~ChangeCallback
	 * @param {Array.<module:decor/Observable~ChangeRecord>} changeRecords The change records.
	 */

	Observable = function (o) {
		// Make Observable marker not enumerable, configurable or writable
		if (!this._observable) { // In case this constructor is called manually
			defineProperty(this, "_observable", {value: 1});
		}
		o && Observable.assign(this, o);
	};

	/**
	 * @method module:decor/Observable.test
	 * @param {Object} o The object to test.
	 * @returns {boolean} true if o is an instance of Observable.
	 */
	Observable.test = function (o) {
		return o && o._observable;
	};

	/**
	 * @method module:decor/Observable.is
	 * @returns {boolean} true if the given two values are the same, considering NaN as well as +0 vs. -0.
	 */
	Observable.is = has("object-is-api") ? Object.is : function (lhs, rhs) {
		return lhs === rhs && (lhs !== 0 || 1 / lhs === 1 / rhs) || lhs !== lhs && rhs !== rhs;
	};

	/**
	 * Copy properties of given source objects to given target object.
	 * If target object has {@link module:decor/Observable#set set()} function for the property, uses it.
	 * @function module:decor/Observable.assign
	 * @param {Object} dst The target object.
	 * @param {...Object} var_args The source objects.
	 * @returns {Object} The target object.
	 */
	Observable.assign = function (dst) {
		if (dst == null) {
			throw new TypeError("Can't convert " + dst + " to object.");
		}
		dst = Object(dst);
		for (var i = 1, l = arguments.length; i < l; ++i) {
			var src = Object(arguments[i]),
				props = Object.getOwnPropertyNames(src);
			for (var j = 0, m = props.length; j < m; ++j) {
				var prop = props[j];
				Observable.prototype.set.call(dst, prop, src[prop]);
			}
		}
		return dst;
	};

	/**
	 * @method module:decor/Observable.canObserve
	 * @param {Object} o The object to test.
	 * @returns {boolean} true if o can be observed with {@link module:decor/Observable.observe Observable.observe()}.
	 */
	Observable.canObserve = Observable.test;

	defineProperty(Observable.prototype, "set", { // Make set() not enumerable
		/**
		 * Sets a value.
		 * Automatically emits change record(s)
		 * compatible with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe Object.observe()}
		 * if no ECMAScript setter is defined for the given property.
		 * If ECMAScript setter is defined for the given property, use
		 * {@link module:decor/Observable~Notifier#notify Observable.getNotifier(observable).notify(changeRecord)}
		 * to manually emit a change record.
		 * @method module:decor/Observable#set
		 * @param {string} name The property name.
		 * @param value The property value.
		 * @returns The value set.
		 */
		value: function (name, value) {
			var type = name in this ? "update" : "add",
				oldValue = this[name],
				// For defining setter, ECMAScript setter should be used
				setter = (getOwnPropertyDescriptor(this, name) || {}).set;
			this[name] = value;
			if (!Observable.is(value, oldValue) && setter === undefined) {
				// Auto-notify if there is no setter defined for the property.
				// Application should manually call Observable.getNotifier(observable).notify(changeRecord)
				// if a setter is defined.
				var changeRecord = {
					type: type,
					object: this,
					name: name + ""
				};
				if (type === "update") {
					changeRecord.oldValue = oldValue;
				}
				Observable.getNotifier(this).notify(changeRecord);
			}
			return value;
		},
		configurable: true,
		writable: true
	});

	var seq = 0,
		hotCallbacks = {},
		deliverHandle = null,
		deliverAllByTimeout = function () {
			for (var anyWorkDone = true; anyWorkDone;) {
				anyWorkDone = false;
				// Observation may stop during observer callback
				var callbacks = [];
				for (var s in hotCallbacks) {
					callbacks.push(hotCallbacks[s]);
				}
				hotCallbacks = {};
				callbacks = callbacks.sort(function (lhs, rhs) {
					return lhs._seq - rhs._seq;
				});
				for (var i = 0, l = callbacks.length; i < l; ++i) {
					if (callbacks[i]._changeRecords.length > 0) {
						Observable.deliverChangeRecords(callbacks[i]);
						anyWorkDone = true;
					}
				}
			}
			deliverHandle = null;
		},
		removeGarbageCallback = function (callback) {
			if (callback._changeRecords.length === 0 && callback._refCountOfNotifier === 0) {
				callback._seq = undefined;
			}
		};

	/**
	 * Notifier object for Observable.
	 * This is an internal function and cannot be used directly.
	 * @class module:decor/Observable~Notifier
	 */
	var Notifier = function (target) {
		this.target = target;
		this.observers = {};
		this._activeChanges = {};
	};

	Notifier.prototype = /** @lends module:decor/Observable~Notifier */ {
		/**
		 * Queue up a change record.
		 * It will be notified at the end of microtask,
		 * or when {@link module:decor/Observable.deliverChangeRecords Observable.deliverChangeRecords()}
		 * is called.
		 * @method module:decor/Observable~Notifier#notify
		 * @param {module:decor/Observable~ChangeRecord} changeRecord
		 *     The change record to queue up for notification.
		 */
		notify: function (changeRecord) {
			function shouldDeliver(activeChanges, acceptTable, changeType) {
				if (changeType in acceptTable) {
					for (var s in acceptTable) {
						if (activeChanges[s] > 0) {
							return false;
						}
					}
					return true;
				}
			}
			for (var s in this.observers) {
				if (shouldDeliver(this._activeChanges, this.observers[s].acceptTable, changeRecord.type)) {
					var callback = this.observers[s].callback;
					callback._changeRecords.push(changeRecord);
					hotCallbacks[callback._seq] = callback;
					if (!deliverHandle) {
						deliverHandle = schedule(deliverAllByTimeout);
					}
				}
			}
		},
		/**
		 * Let the series of changes made in the given callback be represented
		 * by a synthetic change of the given change type.
		 * The callback may return the synthetic change record,
		 * which will be of the `type` and automatically emitted.
		 * Otherwise, the caller can emit the synthetic record manually
		 * via {@link module:decor/Observable~Notifier#notify notify()}.
		 * @param {string} type The change type of synthetic change record.
		 * @param {Function} callback The callback function.
		 */
		performChange: function (type, callback) {
			this._activeChanges[type] = (this._activeChanges[type] || 0) + 1;
			var source = callback.call(undefined);
			--this._activeChanges[type];
			if (source) {
				var target = {
					type: type,
					object: this.target
				};
				for (var s in source) {
					if (!(s in target)) {
						target[s] = source[s];
					}
				}
				this.notify(target);
			}
		}
	};

	/**
	 * Obtains a notifier object for the given {@link module:decor/Observable Observable}.
	 * @method module:decor/Observable.getNotifier
	 * @param {Object} observable The {@link module:decor/Observable Observable} to get a notifier object of.
	 * @returns {module:decor/Observable~Notifier}
	 */
	Observable.getNotifier = function (observable) {
		if (!getOwnPropertyDescriptor(observable, "_notifier")) {
			// Make the notifier reference not enumerable, configurable or writable
			defineProperty(observable, "_notifier", {
				value: new Notifier(observable)
			});
		}
		return observable._notifier;
	};

	/**
	 * Observes an {@link module:decor/Observable Observable} for changes.
	 * @method module:decor/Observable.observe
	 * @param {Object} observable The {@link module:decor/Observable Observable} to observe.
	 * @param {module:decor/Observable~ChangeCallback} callback The change callback.
	 * @param {Array.<module:decor/Observable~ChangeType>}
	 *     [accept={@link module:decor/Observable~DEFAULT_CHANGETYPES}]
	 *     The list of change record types to observe.
	 * @returns {Handle} The handle to stop observing.
	 * @throws {TypeError} If the 1st argument is non-object or null.
	 */
	Observable.observe = function (observable, callback, accept) {
		if (Object(observable) !== observable) {
			throw new TypeError("Observable.observe() cannot be called on non-object.");
		}
		if (!("_seq" in callback)) {
			callback._seq = seq++;
			callback._changeRecords = [];
			callback._refCountOfNotifier = 0;
		}
		var acceptTable = accept ? accept.reduce(function (types, type) {
				types[type] = 1;
				return types;
			}, {}) : DEFAULT_ACCEPT_CHANGETYPES,
			notifier = Observable.getNotifier(observable);
		if (!(callback._seq in notifier.observers)) {
			notifier.observers[callback._seq] = {
				acceptTable: acceptTable,
				callback: callback
			};
			++callback._refCountOfNotifier;
		} else {
			notifier.observers[callback._seq].acceptTable = acceptTable;
		}
		return {
			remove: function () {
				if (callback._seq in notifier.observers) {
					delete notifier.observers[callback._seq];
					--callback._refCountOfNotifier;
				}
			}
		};
	};

	/**
	 * Delivers change records immediately.
	 * @method module:decor/Observable.deliverChangeRecords
	 * @param {Function} callback The change callback to deliver change records of.
	 */
	Observable.deliverChangeRecords = function (callback) {
		var length = callback._changeRecords.length;
		try {
			callback(callback._changeRecords.splice(0, length));
		} catch (e) {
			has("console-api") && console.error("Error occured in observer callback: " + (e.stack || e));
		}
		removeGarbageCallback(callback);
	};

	return Observable;
});
