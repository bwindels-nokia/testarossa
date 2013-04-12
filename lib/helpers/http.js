/*jshint evil: false, strict: false, undef: true, white: false, plusplus:false, node:true */

var assert = require('assert');
var _ = require('underscore');
var upp = require('upperscore');

module.exports = function(requestLib_optional, protocol, host, port, rootPath, headers_optional) {

	var requestLib = requestLib_optional || require('request');
	var defaultHeaders = mapLowerCaseHeaders(headers_optional || {});

	function getContentType(contentType) {
		if(!contentType) {
			return;
		}
		if(contentType.indexOf(';')) {
			return contentType.split(';')[0].trim();
		}
		return contentType;
	}

	var bodyDecoders = {
		'application/json': JSON.parse
	};

	function createUrl(path) {
		return (protocol || 'http') + '://' + host + ':' + port + rootPath + path;
	}

	function mapLowerCaseHeaders(headers) {
		var lowerCaseHeaders = {};
		Object.keys(headers).forEach(function(headerName) {
			lowerCaseHeaders[headerName.toLowerCase()] = headers[headerName];
		});
		return lowerCaseHeaders;
	}

	function prepareHeaders(headers, evaluate) {
		if(headers) {
			headers = evaluate(headers);
			headers = mapLowerCaseHeaders(headers);
			headers = upp.mapObject(headers, evaluate);
			headers = _.extend({}, defaultHeaders, headers);
			return headers;
		} else {
			return defaultHeaders;
		}
	}

	function createTestConditions(conditions, evaluate) {
		return function(response, body) {
			var parsedBody;

			conditions = evaluate(conditions);
			conditions = upp.mapObject(conditions, evaluate);

			if(conditions.status) {
				assert.strictEqual(response.statusCode, conditions.status, 'the response status code did not match');
			}
			//do an object comparison if we can, so whitespace and property order in json don't make the assert fail
			if(typeof conditions.body === 'object') {
				var contentType = getContentType(response.headers['content-type']);
				if(bodyDecoders.hasOwnProperty(contentType)) {
					parsedBody = bodyDecoders[contentType](body);
					assert.deepEqual(parsedBody, conditions.body, 'the response body did not match');
				} else {
					throw new Error('The http helper cannot decode '+contentType+' responses, pass a string instead of an object to match the body with');
				}
			}
			else if(typeof conditions.body === 'string') {
				assert.strictEqual(body, conditions.body, 'the response body did not match');
			}
		};
	}
	
	function createRequestOptions(method, path, body, headers, callback) {
		if(arguments.length === 3) {
			callback = body;
			body = null;
		} else if(arguments.length === 4) {
			callback = headers;
			headers = null;
		}
		var evaluate = this.evaluate.bind(this);
		if(typeof callback === 'object') {
			var testConditions = callback;
			callback = createTestConditions(testConditions, evaluate);
		}

		headers = prepareHeaders(headers, evaluate);

		var requestOptions = {
			method: method,
			url: createUrl(evaluate(path)),
			headers: headers
		};

		if(body) {
			body = evaluate(body);
			if(Buffer.isBuffer(body)) {
				if(!headers.hasOwnProperty('content-type')) {
					requestOptions.headers['content-type'] = 'application/octet-stream';
				}
				if(!headers.hasOwnProperty('content-length')) {
					requestOptions.headers['content-length'] = body.length;
				}
				requestOptions.body = body;
			}
			else if(typeof body === 'object') {
				if(!headers.hasOwnProperty('content-type')) {
					requestOptions.headers['content-type'] = 'application/json';
				}
				if(!headers.hasOwnProperty('content-length')) {
					requestOptions.headers['content-length'] = Buffer.byteLength(body);
				}
				requestOptions.body = JSON.stringify(body);
			}
			else {
				requestOptions.body = body;
			}
		}
		requestOptions.callback = callback;
		return requestOptions;
	}

	function addHttpTest(method, path, body, headers, callback) {
		var requestArgs = arguments;
		var httpTest = function(done) {
			var requestOptions = createRequestOptions.apply(this, requestArgs);
			callback = requestOptions.callback;
			delete requestOptions.callback;

			this.lastRequest = requestOptions;
			this.lastResponse = null;

			requestLib(requestOptions, function(err, response, body) {
				if(err) {
					throw err;
				}
				this.lastResponse = _.extend({body: body}, response);
				if(callback) {
					callback(response, body);
				}
				done();
			}.bind(this));
		};
		var description = method.toUpperCase() + ' ' + rootPath + path;
		return this.add(description, httpTest);
	}

	return {
		extendTestCase: function(testCase) {
			['get', 'head', 'post', 'put', 'delete', 'trace', 'options', 'connect', 'patch'].forEach(function(method) {
				//special case since delete is a javascript keyword
				if(method === 'delete') {
					testCase.del = addHttpTest.bind(testCase, method);
				}
				testCase[method] = addHttpTest.bind(testCase, method);
			});
		},
		extendError: function(testCase, err) {
			err.request = testCase.lastRequest;
			err.response = testCase.lastResponse;
		}
	};
};