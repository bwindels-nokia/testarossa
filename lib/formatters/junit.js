/*jshint evil: false, strict: false, undef: true, white: false, plusplus:false, node:true */

var path = require('path');

/* usage
* cd /vagrant/prototypes/systests/test
* ../../../tests/system/node_modules/testarossa/lib/cli.js --depfile container.js --helpers http,./reset-helper.js -f junit ./test-post.js --set savepath=/vagrant/reports
file saved to: /vagrant/reports/test-test-post.js.xml
*/

var testInfos = [];
var savePath;

function getElapsedTime (startTime, endTime) {
    return (endTime - startTime)/1000;
}

function getISODateString(d) {
    function pad(n) { return n < 10 ? '0'+n : n; }

    return d.getFullYear() + '-' +
        pad(d.getMonth()+1) + '-' +
        pad(d.getDate()) + 'T' +
        pad(d.getHours()) + ':' +
        pad(d.getMinutes()) + ':' +
        pad(d.getSeconds());
}

function escapeInvalidXmlChars(str) {
    return str.replace(/\&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/\>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/\'/g, "&apos;");
}

function writeFile(filename, text) {
    try {
        var fs = require("fs");
        var fd = fs.openSync(filename, "w");
        fs.writeSync(fd, text, 0);
        fs.closeSync(fd);
        console.log("file saved to: " + filename);
        return;
    } catch (g) {
        console.log(g);
    }
}

function reportResults(testInfo, file, duration){
    var fileName = "test-" + path.basename(file) + ".xml";
    var output = '<?xml version="1.0" encoding="UTF-8" ?>';
    output += "\n<testsuites>";
    testInfo.forEach(function(result) {
        output += '\n<testsuite name="' + result.classname + '" errors="0" tests="1';
        if(result.failure) {
            output += '" failures="1';
        } else {
            output += '" failures="0';
        }
        output += '" time="' + result.duration + '" timestamp="' + getISODateString(result.startTime) + '">';
        output += '\n<testcase classname="' + result.name + '" name="' + result.classname + '" errors="0" tests="1';
        if(result.failure) {
            output += '" failures="1';
        } else {
            output += '" failures="0';
        }
        output += '" time="' + result.duration + '" timestamp="' + getISODateString(result.startTime) + '">';
        if(result.failure) {
            output += '\n<failure>';
            output += result.failure;
            output += '\n</failure>';
        }
        output += "\n</testcase>\n</testsuite>";
    });
    output += "\n</testsuites>";
    writeFile(savePath + "/" + fileName , output);
}

module.exports = function(savepath) {
    savePath = savepath || '.';

    return {
        runStarted: function(testCaseCount) {

        },
        testCaseStarted: function(testCase, file) {
            testCase.startTime = new Date();
            testInfos = [];
        },
        testStarted: function(testCase, test, description, index) {
            test.startTime = new Date();
            testInfos[index] = {
                startTime: test.startTime,
                classname: escapeInvalidXmlChars(description),
                name: escapeInvalidXmlChars(description) + "test - " + index
            };
        },
        testFailed: function(testCase, test, err, index) {
            var endTime = new Date();
            testInfos[index].duration = getElapsedTime(test.startTime, endTime);
            testInfos[index].failure = escapeInvalidXmlChars(err.message);
        },
        testSucceeded: function(testCase, test, description, index) {
            var endTime = new Date();
            testInfos[index].duration = getElapsedTime(test.startTime, endTime);
        },
        testCaseEnded: function(testCase, file, hasFailures) {
            var endTime = new Date();
            var elapsed = getElapsedTime(testCase.startTime, endTime);
            reportResults(testInfos, file, elapsed);
        },
        runEnded: function(testCaseCount, failureCount) {
            //process.stdout.write('ran ' + testCaseCount + ' test cases ');
            if(failureCount === 0) {
                //console.log('successfully');
            } else {
                //console.log('with ' + failureCount + ' of them failing');
            }
        }
    };
};