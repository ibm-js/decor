/** @module decor/ObservableArray */
define([
	"requirejs-dplugins/has",
	"./Observable"
], function (has, Observable) {
	"use strict";

	/**
	 * The same argument list of Array, taking the length of the new array or the initial list of array elements.
	 * @typedef {number|...Anything} module:decor/ObservableArray~CtorArguments
	 */

	/**
	 * An observable array, working as a shim
	 * of {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
	 * @class
	 * @alias module:decor/ObservableArray
	 * @augments module:decor/Observable
	 * @param {module:decor/ObservableArray~CtorArguments} [args]
	 *     The length of the new array or the initial list of array elements.
	 */
	var ObservableArray,
		augmentedMethods,
		defineProperty = Object.defineProperty,
		EMPTY_ARRAY = [],
		REGEXP_GLOBAL_OBJECT = /\[\s*object\s+global\s*\]/i; // Global object in node.js

	(function () {
		var observableArrayMarker = "_observableArray";

		// TODO(asudoh):
		// Document that ObservableArray cannot be observed by Observable.observe()
		// without "splice" in accept list.
		// We need to create large amount of change records to do so,
		// when splice happens with large amount of removals/adds
		ObservableArray = function (length) {
			var beingConstructed = this && !REGEXP_GLOBAL_OBJECT.test(this) && !this.hasOwnProperty("length"),
				// If this is called as regular function (instead of constructor), work with a new instance
				self = beingConstructed ? [] : new ObservableArray();
			if (beingConstructed) {
				Observable.call(self);
				// Make ObservableArray marker not enumerable, configurable or writable
				defineProperty(self, observableArrayMarker, {value: 1});
				// Make those methods not enumerable
				for (var s in augmentedMethods) {
					defineProperty(self, s, {
						value: augmentedMethods[s],
						configurable: true,
						writable: true
					});
				}
			}
			if (typeof length === "number" && arguments.length === 1) {
				self.length = length;
			} else {
				EMPTY_ARRAY.push.apply(self, arguments);
			}
			return self;
		};

		/**
		 * @method module:decor/ObservableArray.test
		 * @param {Array} a The array to test.
		 * @returns {boolean} true if o is an instance of {@link module:decor/ObservableArray ObservableArray}.
		 */
		ObservableArray.test = function (a) {
			return a && a[observableArrayMarker];
		};
	})();

	/**
	 * @method module:decor/ObservableArray.canObserve
	 * @param {Array} a The array to test.
	 * @returns {boolean}
	 *     true if o can be observed with {@link module:decor/ObservableArray.observe ObservableArray.observe()}.
	 */
	ObservableArray.canObserve = ObservableArray.test;

	(function () {
		/**
		 * Adds and/or removes elements from an array
		 * and automatically emits a change record compatible
		 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
		 * @param {number} index Index at which to start changing the array.
		 * @param {number} removeCount [An integer indicating the number of old array elements to remove.
		 * @param {...Anything} [var_args] The elements to add to the array.
		 * @return {Array} An array containing the removed elements.
		 * @memberof module:decor/ObservableArray#
		 */
		function splice(index, removeCount) {
			/* jshint validthis: true */
			if (index < 0) {
				index = this.length + index;
			}
			var oldLength = this.length,
				changeRecord = {
					index: index,
					removed: this.slice(index, index + removeCount),
					addedCount: arguments.length - 2
				},
				result = EMPTY_ARRAY.splice.apply(this, arguments),
				lengthRecord = oldLength !== this.length && {
					type: "update",
					object: this,
					name: "length",
					oldValue: oldLength
				},
				notifier = Observable.getNotifier(this);
			notifier.performChange("splice", function () {
				lengthRecord && notifier.notify(lengthRecord);
				return changeRecord;
			});
			return result;
		}

		augmentedMethods = /** @lends module:decor/ObservableArray# */ {
			splice: splice,

			/**
			 * Sets a value and automatically emits change record(s)
			 * compatible with
			 * {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
			 * @param {string} name The property name.
			 * @param value The property value.
			 * @returns The value set.
			 */
			set: function (name, value) {
				var args;
				if (name === "length") {
					args = new Array(Math.max(value - this.length, 0));
					args.unshift(Math.min(this.length, value), Math.max(this.length - value, 0));
					splice.apply(this, args);
				} else if (!isNaN(name) && +name >= this.length) {
					args = new Array(name - this.length);
					args.push(value);
					args.unshift(this.length, 0);
					splice.apply(this, args);
				} else {
					Observable.prototype.set.call(this, name, value);
				}
				return value;
			},

			/**
			 * Removes the last element from an array
			 * and automatically emits a change record compatible with
			 * {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
			 * @returns The element removed.
			 */
			pop: function () {
				return splice.call(this, -1, 1)[0];
			},

			/**
			 * Adds one or more elements to the end of an array
			 * and automatically emits a change record compatible with
			 * {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
			 * @param {...Anything} var_args The elements to add to the end of the array.
			 * @returns The new length of the array.
			 */
			push: function () {
				var args = [this.length, 0];
				EMPTY_ARRAY.push.apply(args, arguments);
				splice.apply(this, args);
				return this.length;
			},

			/**
			 * Reverses the order of the elements of an array
			 * and automatically emits a splice type of change record.
			 * @returns {Array} The array itself.
			 */
			reverse: function () {
				var changeRecord = {
						type: "splice",
						object: this,
						index: 0,
						removed: this.slice(),
						addedCount: this.length
					},
					result = EMPTY_ARRAY.reverse.apply(this, arguments);
				// Treat this change as a splice instead of updates in each entry
				Observable.getNotifier(this).notify(changeRecord);
				return result;
			},

			/**
			 * Removes the first element from an array
			 * and automatically emits a change record compatible with
			 * {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
			 * @returns The element removed.
			 */
			shift: function () {
				return splice.call(this, 0, 1)[0];
			},

			/**
			 * Sorts the elements of an array in place
			 * and automatically emits a splice type of change record.
			 * @returns {Array} The array itself.
			 */
			sort: function () {
				var changeRecord = {
						type: "splice",
						object: this,
						index: 0,
						removed: this.slice(),
						addedCount: this.length
					},
					result = EMPTY_ARRAY.sort.apply(this, arguments);
				// Treat this change as a splice instead of updates in each entry
				Observable.getNotifier(this).notify(changeRecord);
				return result;
			},

			/**
			 * Adds one or more elements to the front of an array
			 * and automatically emits a change record compatible with
			 * {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
			 * @param {...Anything} var_args The elements to add to the front of the array.
			 * @returns The new length of the array.
			 */
			unshift: function () {
				var args = [0, 0];
				EMPTY_ARRAY.push.apply(args, arguments);
				splice.apply(this, args);
				return this.length;
			}
		};
	})();

	/**
	 * Observes an ObservableArray for changes.
	 * Internally calls {@link module:decor/Observable.observe Observable.observe()}
	 * observing for the following types of change records:
	 * [
	 *     "add",
	 *     "update",
	 *     "delete",
	 *     "splice"
	 * ]
	 * All change records will be converted to "splice" and are sorted by index and merged to smaller number
	 * of change records.
	 * @method
	 * @param {Object} observable The {@link module:decor/ObservableArray ObservableArray} to observe.
	 * @param {module:decor/Observable~ChangeCallback} callback The change callback.
	 * @returns {Handle} The handle to stop observing.
	 * @throws {TypeError} If the 1st argument is non-object or null.
	 */
	ObservableArray.observe = (function () {
		function intersect(start1, end1, start2, end2) {
			return end1 <= start2 ? end1 - start2 : // Adjacent or distant
				end2 <= start1 ? end2 - start1 : // Adjacent or distant
				Math.min(end1, end2) - Math.max(start1, start2); // Intersected or contained
		}
		function normalize(record) {
			return record.type !== "add" && record.type !== "update" ? record :
				{
					type: "splice",
					object: record.object,
					index: +record.name,
					removed: [record.oldValue],
					addedCount: 1
				};
		}
		function observeSpliceCallback(callback, records) {
			var merged = [];
			records.forEach(function (incoming) {
				incoming = normalize(incoming);
				var doneIncoming = false,
					indexAdjustment = 0;
				for (var i = 0; i < merged.length; ++i) {
					var entry = merged[i];
					entry.index += indexAdjustment;

					/* jshint maxlen:150 */
					var amount = intersect(entry.index, entry.index + entry.addedCount, incoming.index, incoming.index + incoming.removed.length);
					if (amount >= 0) {
						// Merge splices
						merged.splice(i--, 1);
						var removed,
							addedCount = entry.addedCount - amount + incoming.addedCount;
						if (entry.index < incoming.index) {
							removed = incoming.removed.slice(Math.max(amount, 0));
							EMPTY_ARRAY.unshift.apply(removed, entry.removed);
						} else {
							removed = incoming.removed.slice(0, amount > 0 ? entry.index - incoming.index : incoming.length);
							EMPTY_ARRAY.push.apply(removed, entry.removed);
							// Append happens when second splice's range contains first splice's range
							EMPTY_ARRAY.push.apply(removed, incoming.removed.slice(entry.index + entry.addedCount - incoming.index));
						}
						/* jshint maxlen:120 */
						if (removed.length === 0 && addedCount === 0) {
							doneIncoming = true;
						} else {
							incoming = {
								type: "splice",
								object: entry.object,
								index: Math.min(entry.index, incoming.index),
								removed: removed,
								addedCount: addedCount
							};
						}
						indexAdjustment -= entry.addedCount - entry.removed.length; // entry is subsumed by incoming
					} else if (incoming.index < entry.index) {
						// Insert the new splice
						var adjustment = incoming.addedCount - incoming.removed.length;
						entry.index += adjustment;
						indexAdjustment += adjustment;
						merged.splice(i++, 0, incoming);
						doneIncoming = true;
					}
				}
				if (!doneIncoming) {
					merged.push(incoming);
				}
			});
			if (merged.length > 0) {
				callback(merged);
			}
		}
		return function (observableArray, callback) {
			var h = Object.create(Observable.observe(observableArray,
				callback = observeSpliceCallback.bind(observableArray, callback), [
				"add",
				"update",
				"delete",
				"splice"
			]));
			h.deliver = Observable.deliverChangeRecords.bind(Observable, callback);
			return h;
		};
	})();

	return ObservableArray;
});
