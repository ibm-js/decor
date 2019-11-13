/**
 * This module sets has() flags based on the current browser and platform:
 *
 * - `has("webkit")`, `has("chrome")`, `has("safari")`
 * - `has("ff")`
 * - `has("ie")`, `has("edge")`
 * - `has("ios")`
 * - `has("android")`
 * - `has("wp")`
 * - `has("mac")`
 *
 * It returns the `has()` function.
 * @module decor/sniff
 */
define(["./features"], function (has) {
	/* jshint maxcomplexity:20 */

	if (has("host-browser")) {
		var n = navigator,
			dua = n.userAgent,
			dav = n.appVersion;

		// Special test for iOS 13.1+, to counteract misleading userAgent string.
		var ios13 = /Safari/.test(dua) && "ontouchstart" in document;

		// Platform detection
		has.add("mac", /Macintosh/.test(dav) && !ios13);
		has.add("ios", /iPhone|iPod|iPad/.test(dua) || ios13);
		has.add("android", parseFloat(dua.split("Android ")[1]) || undefined);
		has.add("msapp", parseFloat(dua.split("MSAppHost/")[1]) || undefined);
		has.add("wp", parseFloat(dua.split("Windows Phone ")[1]) || undefined);

		// Browser detection
		var version;
		if ((version = parseFloat(dua.split("Edge/")[1]))) {
			has.add("edge", version);
		} else if ((version = parseFloat(dua.split("WebKit/")[1]))) {
			has.add("webkit", version);
			has.add("chrome", parseFloat(dua.split("Chrome/")[1]) || undefined);
			has.add("safari", /Safari/.test(dav) && !has("chrome") && !has("android") ?
					parseFloat(dav.split("Version/")[1]) : undefined);
		} else if (/Trident/.test(dav)) {
			// IE8+
			has.add("ie", document.documentMode || parseFloat(dav.split("rv:")[1]));
		} else if ((version = parseFloat(dua.split("Firefox/")[1]))) {
			has.add("ff", version);
		}
	}

	return has;
});
