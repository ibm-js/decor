define(["intern",
	"intern!object",
	"intern/dojo/node!leadfoot/helpers/pollUntil",
	"intern/chai!assert",
	"require",
], function (intern, registerSuite, pollUntil, assert, require) {
	var PAGE = "./sniff.html";

	registerSuite({
		name: "Sniff tests",
		setup: function () {},

		"Checking browser and platform sniffing": function () {
			this.timeout = intern.config.TEST_TIMEOUT;
			var remote = this.remote;
			return remote
				.get(require.toUrl(PAGE))
				.then(pollUntil("return ('ready' in window && ready) ? true : null;", [],
						intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL))
				.execute("return _has")
				.then(function (has) {
					function shouldDetectOnly(expected) {
						Object.keys(has).forEach(function (browser) {
							if (expected.indexOf(browser) > -1) {
								assert.ok(has[browser], "detected " + browser + " as expected");
							} else {
								assert.notOk(has[browser], "didn't detect " + browser + " as expected");
							}
						});
					}

					var browserName = remote.environmentType.browserName,
						platform = remote.environmentType.platform,
						deviceName = remote.environmentType.deviceName;

					switch (browserName) {
					case "chrome":
						shouldDetectOnly(["chrome", "webkit"]);
						break;
					case "internet explorer":
						shouldDetectOnly(["ie"]);
						break;
					case "firefox":
						shouldDetectOnly(["ff", "mozilla"]);
						break;
					case "safari":
						switch (platform) {
						case "MAC":
							shouldDetectOnly(["safari", "webkit", "mac"]);
							break;
						}
						break;
					case "iOS":
						switch (deviceName) {
						case "iPad Simulator":
							shouldDetectOnly(["safari", "webkit", "ios", "ipad"]);
							break;
						case "iPhone Simulator":
							shouldDetectOnly(["safari", "webkit", "ios", "iphone"]);
							break;
						}
						break;

					}
				})
				.end();
		},
	});
});
