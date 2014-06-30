// To run the test cases:
//     With node.js:
//         > cd /path/to/decor/
//         > grunt intern:node
//     With browser: http://yourserver/path/to/decor/node_modules/intern/client.html?config=tests/intern
define({
	loader: {
		baseUrl: typeof window !== "undefined" ? "../../.." : "..",
		packages: ["decor"]
	},

	useLoader: {
		"host-node": "dojo/dojo",
		"host-browser": "../../../requirejs/require.js"
	},

	proxyPort: 9000,

	proxyUrl: "http://localhost:9000/",

	capabilities: {
		"selenium-version": "2.37.0",
		"idle-timeout": 60
	},

	environments: [
		{browserName: "internet explorer", version: "9", platform: "Windows 7", name: "decor"},
		{browserName: "internet explorer", version: "10", platform: "Windows 8", name: "decor"},
		{browserName: "internet explorer", version: "11", platform: "Windows 8.1", name: "decor"},
		{browserName: "firefox", version: "25", platform: [/*"OS X 10.6",*/ "Linux", "Windows 7"], name: "decor"},
		{browserName: "chrome", version: "", platform: [/*"OS X 10.6", */ "Linux", "Windows 7"], name: "decor"},
		{browserName: "safari", version: "6", platform: "OS X 10.8", name: "decor"},
		{browserName: "safari", version: "7", platform: "OS X 10.9", name: "decor"},
		// {browserName: "android", platform: "Linux", version: "4.1", name: "decor"},
		// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.1", name: "decor"},
		// {browserName: "android", platform: "Linux", version: "4.1", name: "decor"},
		// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.0", name: "decor"},
		// {browserName: "android", platform: "Linux", version: "4.0", name: "decor"},
		// Non-empty selenium-version causes "browser failed to start" error for unknown reason
		{browserName: "iphone", platform: "OS X 10.9", version: "7",
			"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		{browserName: "ipad", platform: "OS X 10.9", version: "7",
			"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		// {browserName: "iphone", platform: "OS X 10.8", version: "6.0",
		//	"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		// {browserName: "ipad", platform: "OS X 10.8", version: "6.0",
		//	"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		{browserName: "iphone", platform: "OS X 10.8", version: "6.1",
			"device-orientation": "portrait", "selenium-version": "", name: "decor"},
		{browserName: "ipad", platform: "OS X 10.8", version: "6.1",
			"device-orientation": "portrait", "selenium-version": "", name: "decor"}
	],

	maxConcurrency: 3,

	useSauceConnect: true,

	webdriver: {
		host: "localhost",
		port: 4444
	},

	suites: ["decor/tests/unit/all"],

	excludeInstrumentation: /^((decor(\/|\\)(node_modules|tests))|requirejs|dcl)/
});
