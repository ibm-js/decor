define(["requirejs-dplugins/has"], function (has) {
	has.add("console-api", typeof console !== "undefined");
	has.add("host-browser", typeof window !== "undefined");
	has.add("object-is-api", !!Object.is);
	return has;
});
