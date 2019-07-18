define(function (require) {
	"use strict";

	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;
	var has = require("decor/sniff");

	registerSuite("sniff", {
		sniff: function () {
			assert(has("chrome") || has("safari") || has("ff") || has("ie") ||
				has("ios") || has("android") || has("wp") ||
				!has("host-browser"),
			"one browser's flag is set, or on node");
		}
	});
});
