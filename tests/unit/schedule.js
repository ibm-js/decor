define(function (require) {
	"use strict";

	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var schedule = require("decor/schedule");

	var handles = [];

	registerSuite("schedule", {
		"afterEach": function () {
			for (var handle = null; (handle = handles.shift());) {
				handle.remove();
			}
		},

		tests: {
			"Schedule a task at end of microtask": function () {
				var endedMicrotask,
					dfd = this.async(1000),
					h = schedule(dfd.callback(function () {
						assert.isTrue(endedMicrotask);
					}));
				handles.push(h);
				endedMicrotask = true;
			},

			"Removing a scheduled task": function () {
				var dfd = this.async(1000),
					h = schedule(dfd.rejectOnError(function () {
						throw new Error("This task should never be executed.");
					}));
				handles.push(h);
				h.remove();
				setTimeout(dfd.callback(function () {
				}), 100);
			},

			"Scheduling another task in schedule callback": function () {
				var dfd = this.async(1000);
				handles.push(schedule(dfd.rejectOnError(function () {
					handles.push(schedule(dfd.callback(function () {
					})));
				})));
			},

			"Scheduling same task in schedule callback": function () {
				var count = 0,
					dfd = this.async(1000),
					cb = dfd.rejectOnError(function () {
						if (count++ === 0) {
							handles.push(schedule(cb));
						} else {
							dfd.resolve(1);
						}
					});
				handles.push(schedule(cb));
			},

			"Running same callback twice": function () {
				var count = 0,
					dfd = this.async(1000),
					cb = dfd.rejectOnError(function () {
						count++;
					});
				handles.push(schedule(cb));
				handles.push(schedule(cb));
				setTimeout(dfd.callback(function () {
					assert.strictEqual(count, 2);
				}), 100);
			},

			"Schedule multiple tasks at once": function () {
				var log = [];
				schedule(function () {
					log.push("a");

					// Check that throwing an error doesn't interrupt the next callback;
					throw new Error("Intentional exception for testing");
				});
				schedule(function () {
					log.push("b");
				});
				var dfd = this.async(1000);
				setTimeout(dfd.callback(function () {
					assert.deepEqual(log, ["a", "b"]);
				}), 10);
			}
		}
	});
});
