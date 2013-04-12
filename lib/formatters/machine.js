/*jshint evil: false, strict: false, undef: true, white: false, plusplus:false, node:true */

var path = require('path');

module.exports = function() {

	return {
		testCaseStarted: function(testCase, file) {
			process.stdout.write(path.basename(file) + ' ');
		},
		testStarted: function(testCase, test, description) {
		},
		testFailed: function(testCase, test, err) {
			process.stdout.write('F');
		},
		testSucceeded: function(testCase, test, description) {
			process.stdout.write('.');
		},
		testCaseEnded: function(testCase, file, hasFailures) {
			process.stdout.write('\n');
		}
	};
};