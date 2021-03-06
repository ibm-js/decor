/** @module decor/schedule */
define(["./features"], function (has) {
	"use strict";

	/**
	 * Calls a function at the end of microtask.
	 * @function module:decor/schedule
	 * @param {Function} callback The function to call at the end of microtask.
	 */

	var inFlight,
		SCHEDULEID_PREFIX = "_schedule",
		seq = 0,
		callbacks = {},
		pseudoDiv = document.createElement("div");
	function runCallbacks() {
		var anyWorkDone;
		do {
			anyWorkDone = false;
			for (var id in callbacks) {
				var callback = callbacks[id];
				delete callbacks[id];
				try {
					callback();
				} catch (e) {
					// An error in one callback shouldn't prevent the others from running.
					console.error("decor/schedule: exception", e, "in callback", callback);
				}
				anyWorkDone = true;
			}
		} while (anyWorkDone);
		inFlight = false;
	}

	pseudoDiv.id = 0;
	new MutationObserver(runCallbacks).observe(pseudoDiv, {attributes: true});

	return function (callback) {
		var id = SCHEDULEID_PREFIX + seq++;
		callbacks[id] = callback;
		if (!inFlight) {
			++pseudoDiv.id;
			inFlight = true;
		}
		return {
			remove: function () {
				delete callbacks[id];
			}
		};
	};
});
