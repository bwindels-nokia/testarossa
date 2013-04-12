#!/usr/bin/env node
var program = require('commander');
var parser = require('./parse-cli');

program
  .version('0.0.1')
  .usage('[options] <test files ...>')
  .option('--depfile [path]', 'Path to dependency definition file')
  .option('--helpers [list]', 'List of helpers', parser.parseList)
  .option('-f, --formatter [file]', 'symbolic name or path to formatter file')
  .option('--timeout [ms]', 'amount of ms to wait before killing a test, defaults to 30000', parseInt)
  .option('--set [key=value,...]', 'dictionary for passing settings to the formatter or helpers', parser.parseDictionary)
  .parse(process.argv);

var timeout = typeof program.timeout === 'number' ? program.timeout : 30000;
var helperFiles = (program.helpers || []).map(parser.normalizeHelper);
var depFile = parser.normalizeFile(program.depfile);
var testFiles = (program.args || []).map(parser.normalizeFile);
var formatterFile = parser.normalizeFormatter(program.formatter || 'console');

var runTestCases = require('./run').runTestCases;

runTestCases(helperFiles, depFile, testFiles, formatterFile, timeout, program.set, function(err, hasFailures) {
	if(err) {
		console.log('initialization error:', err);
	}
	process.exit(hasFailures ? 1 : 0);
});