/*jshint evil: false, strict: false, undef: true, white: false, plusplus:false, node:true */

var path = require('path');
var assert = require('assert');

function list(val) {
	return val.split(',');
}

function parseDictionary(str) {
	var parts = str.split(',');
	var obj = {};
	parts.forEach(function(part) {
		assert(part.indexOf('=') === part.lastIndexOf('=') !== -1, '--set format is key=value,...');
		var keyValue = part.split('=');
		obj[keyValue[0]] = keyValue[1];
	});
	return obj;
}

function createNormalizer(relativeBasePath) {
	return function (pathName) {
		if(!pathName) {
			return;
		}
		if(pathName.charAt(0) === '/') {
			return pathName;
		}
		else if(pathName.charAt(0) === '.') {
			return path.join(process.cwd(), pathName);
		}
		else {
			return path.join(__dirname, relativeBasePath, pathName);
		}
	};
}

function normalizeFile(pathName) {
	if(!pathName) {
		return pathName;
	}
	if(pathName.charAt(0) !== '/') {
		return path.join(process.cwd(), pathName);
	}
	return pathName;
}

var normalizeHelper = createNormalizer('/../lib/helpers');
var normalizeFormatter = createNormalizer('/../lib/formatters');

module.exports = {
	normalizeFormatter: normalizeFormatter,
	normalizeHelper: normalizeHelper,
	normalizeFile: normalizeFile,
	parseList: list,
	parseDictionary: parseDictionary
};