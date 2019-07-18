/* global module */
module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			src: [
				"**/*.js",
				"!{node_modules,out}/**/*.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},
		"jsdoc-amddcl": {
			docs: {
				files: [
					{
						args: [
							"-r"
						],
						src: [
							".",
							"./README.md",
							"./package.json"
						],
						packagePathFormat: "${name}/docs/api/${version}",
						includeEventsInTOC: "false"
					}
				]
			},
			export: {
				files: [
					{
						args: [
							"-X",
							"-r"
						],
						src: [
							".",
							"./README.md",
							"./package.json"
						],
						dest: "./out/doclets.json"
					}
				]
			}
		}
	});
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("jsdoc-amddcl");
	grunt.registerTask("jsdoc", "jsdoc-amddcl");
};
