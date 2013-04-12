/*jshint evil: false, strict: false, undef: true, white: false, plusplus:false, node:true */

var Container = require('container').Container;
var async = require('async');
var TestCase = require('./testcase');

function createDiContainer(diFile, customSettings) {
	var container = new Container();
	if(diFile) {
		require(diFile)(container);
	}
	if(typeof customSettings === 'object') {
		Object.keys(customSettings).forEach(function(key) {
			container.add(key, customSettings[key]);
		});
	}
	return container;
}

function loadHelpers(helperFiles, container, callback) {
	async.map(helperFiles, function(file, done) {
		container.create(file, done);
	}, callback);
}

function runTestCase(testFile, helpers, formatter, timeout, callback) {
	var testCase = new TestCase(helpers, formatter, timeout, testFile);
	formatter.testCaseStarted(testCase, testFile);
	require(testFile)(testCase);
	testCase.run(function(err) {
		formatter.testCaseEnded(testCase, testFile, !!err);
		callback(err, testCase.testCount());
	});
}

function runTestCases(helperFiles, diFile, testFiles, formatterFile, timeout, customSettings, callback) {
	var container = createDiContainer(diFile, customSettings);
	container.create(formatterFile, function(err, formatter) {
		container.add('formatter', formatter);
		formatter.runStarted(testFiles.length);
		if(err) {
			return callback(err);
		}
		loadHelpers(helperFiles, container, function(err, helpers) {
			if(err) {
				return callback(err);
			}

			var failures = 0;
			var totalTestCount = 0;

			async.eachSeries(testFiles, function(testFile, done) {
				runTestCase(testFile, helpers, formatter, timeout, function(err, testCount) {
					totalTestCount += testCount;
					if(err) {
						++failures;
					}
					done();
				});
			}, function(err) {
				formatter.runEnded(testFiles.length, failures, totalTestCount);
				return callback(err, failures !== 0);
			});
		});
	});
}

module.exports = {
	runTestCases: runTestCases
};