// To run the test cases:
//     With node.js:
//         > cd /path/to/decor/
//         > grunt intern:node
//     With browser: http://yourserver/path/to/decor/node_modules/intern/client.html?config=tests/intern
define({

	proxyPort: 9000,

	proxyUrl: "http://127.0.0.1:9000/",

	environments: [
		{ browserName: "internet explorer", version: "11", platform: "Windows 8.1",
			requireWindowFocus: "true", name : "decor"},
		{ browserName: "internet explorer", version: "10", platform: "Windows 8",
			requireWindowFocus: "true", name : "decor"},
		{ browserName: "internet explorer", version: "9", platform: "Windows 7" },
		{ browserName: "firefox", version: "31", platform: [ /*"OS X 10.6", "Linux",*/ "Windows 7" ],
			name : "decor"},
		{ browserName: "chrome", version: "32", platform: [ /*"OS X 10.6", "Linux", */ "Windows 7" ],
			name : "decor"},
		{ browserName: "safari", version: "7", platform: [ "OS X 10.9" ], name : "decor"}
		//{browserName: "safari", version: "6", platform: "OS X 10.8", name: "decor"},
		// {browserName: "android", platform: "Linux", version: "4.1", name: "decor"},
		// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.1", name: "decor"},
		// {browserName: "android", platform: "Linux", version: "4.1", name: "decor"},
		// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.0", name: "decor"},
		// {browserName: "android", platform: "Linux", version: "4.0", name: "decor"},
		// Non-empty selenium-version causes "browser failed to start" error for unknown reason
		//{browserName: "iphone", platform: "OS X 10.9", version: "7",
			//"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		//{browserName: "ipad", platform: "OS X 10.9", version: "7",
			//"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		// {browserName: "iphone", platform: "OS X 10.8", version: "6.0",
		//	"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		// {browserName: "ipad", platform: "OS X 10.8", version: "6.0",
		//	"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		//{browserName: "iphone", platform: "OS X 10.8", version: "6.1",
			//"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		//{browserName: "ipad", platform: "OS X 10.8", version: "6.1",
			//"device-orientation": "portrait", "selenium-version": "", name: "decor"}
	],

	maxConcurrency: 3,
	tunnel: "SauceLabsTunnel",

	// Maximum duration of a test, in milliseconds
	TEST_TIMEOUT: 300000, // 5 minutes
	
	// Maximum time to wait for someting (pollUntil, etc...)
	WAIT_TIMEOUT: 180000, // 3 minutes
	
	// Interval between two polling request, in milliseconds (for pollUntil)
	POLL_INTERVAL: 500, // 0.5 seconds

	loader: {
		baseUrl: typeof window !== "undefined" ? "../../.." : "..",
		packages: ["decor"]
	},

	useLoader: {
		"host-node": "requirejs",
		"host-browser": "../../../requirejs/require.js"
	},

	suites: ["decor/tests/unit/all"],
	functionalSuites: ["decor/tests/functional/all"],

	excludeInstrumentation: /^((decor(\/|\\)(node_modules|tests))|dojo|requirejs|dcl)/
});
