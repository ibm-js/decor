// Test file to run infrastructure tests from a browser
// Run using http://localhost/decor/node_modules/intern/client.html?config=tests/intern-browser

define([
	"./intern"
], function (intern) {

	// relative to client.html
	intern.loader.baseUrl = "../../..";

	return intern;
});
