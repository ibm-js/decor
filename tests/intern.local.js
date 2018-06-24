define(["./intern"], function (intern) {
	intern.tunnel = "NullTunnel";
	intern.tunnelOptions = {
		hostname: "localhost",
		port: 4444
	};

	// Uncomment this line (and modify machine name) for testing against VM.
	// intern.proxyUrl = "http://mac.local:9000";

	intern.environments = [
		{ browserName: "chrome" }
	];

	intern.maxConcurrency = 1;

	return intern;
});
