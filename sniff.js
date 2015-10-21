/**
 * This module sets has() flags based on the current browser:
 *
 * - `has("webkit")`, `has("chrome")`, `has("safari")`
 * - `has("mozilla")`, `has("ff")`
 * - `has("ie")`
 * - `has("ios")`
 * - `has("android")`
 * - `has("wp")`
 *
 * It returns the `has()` function.
 * @module decor/sniff
 */
define(["./features"], function (has) {
	/* jshint maxcomplexity:20 */

	if (has("host-browser")) {
		var n = navigator,
			dua = n.userAgent,
			dav = n.appVersion,
			tv = parseFloat(dav);


		// Platform detection
		has.add("mac", /Macintosh/.test(dav));
		if (dua.match(/(iPhone|iPod|iPad)/)) {
			var p = RegExp.$1.replace(/P/, "p");
			var v = dua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
			var os = parseFloat(v.replace(/_/, ".").replace(/_/g, ""));
			has.add(p, os);		// "iphone", "ipad" or "ipod"
			has.add("ios", os);
		}
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
		} else if (/Gecko/.test(dua)) {
			// Mozilla and firefox
			has.add("mozilla", tv);
			has.add("ff", parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1]) || undefined);
		}
	}

	return has;
});
