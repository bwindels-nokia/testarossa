/*jshint evil: false, strict: false, undef: true, white: false, plusplus:false, node:true */

var domain = require('domain');
var async = require('async');
var _ = require('underscore');

function TestCase(helpers, formatter, timeout, file) {
	this.file = file;
	this.tests = [];
	//object used to pass arguments between test cases
	this.formatter = formatter;
	this.helpers = helpers;
	this.timeout = timeout;
	helpers.forEach(function(helper) {
		helper.extendTestCase(this);
	}, this);
}

function extendError(err) {
	this.helpers.forEach(function(h) {
		if(typeof h.extendError === 'function') {
			h.extendError(this, err);
		}
	}, this);
}

function runTest(test, done) {
	done = _.once(done);

	var d = domain.create();
	d.on('error', done);

	setTimeout(function() {
		d.dispose();
		done(new Error('callback was not called in the test, timed out after ' + this.timeout + ' ms'));
	}.bind(this), this.timeout);


	d.run(function() {

		test.call(this, function(err) {
			done(err);
		}.bind(this));

	}.bind(this));
}

function getLineFromFileInStack(file, stack) {
	var lines = stack.split('\n');
	var line = lines.filter(function(line) {
		return line.indexOf(file) !== -1;
	}, this)[0];
	if(!line) {
		return;
	}
	var start = line.indexOf('(');
	var end = line.lastIndexOf(')');
	return line.substring(start + 1, end);
}

TestCase.prototype = {
	add: function(description, fn) {
		fn.line = getLineFromFileInStack(this.file, new Error().stack);
		fn.description = description;
		this.tests.push(fn);
		return this;
	},
	property: function(name) {
		var parts = name.split('.');
		return {
			evaluate: function(root) {
				return parts.reduce(function(localRoot, part) {
					return localRoot[part];
				}, root);
			}
		};
	},
	evaluate: function(value) {
		if(typeof value === 'object' && typeof value.evaluate === 'function' && value.evaluate.length === 1) {
			return value.evaluate(this);
		}
		return value;
	},
	run: function(callback) {
		var index = 0;
		async.eachSeries(this.tests, function(test, done) {
			++index;
			this.formatter.testStarted(this, test, test.description, index);
			runTest.call(this, test, function(err) {
				if(err) {
					extendError.call(this, err);
					this.formatter.testFailed(this, test, err, index);
				} else {
					this.formatter.testSucceeded(this, test, test.description, index);
				}
				done(err);
			}.bind(this));
		}.bind(this), callback);
	},
	testCount: function() {
		return this.tests.length;
	}
};

module.exports = TestCase;