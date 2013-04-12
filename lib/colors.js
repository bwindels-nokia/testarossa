var styles = {
    //styles
    'bold'      : ['\x1B[1m',  '\x1B[22m'],
    'italic'    : ['\x1B[3m',  '\x1B[23m'],
    'underline' : ['\x1B[4m',  '\x1B[24m'],
    'inverse'   : ['\x1B[7m',  '\x1B[27m'],
    'strikethrough' : ['\x1B[9m',  '\x1B[29m'],
    //grayscale
    'white'     : ['\x1B[37m', '\x1B[39m'],
    'grey'      : ['\x1B[90m', '\x1B[39m'],
    'black'     : ['\x1B[30m', '\x1B[39m'],
    //colors
    'blue'      : ['\x1B[34m', '\x1B[39m'],
    'cyan'      : ['\x1B[36m', '\x1B[39m'],
    'green'     : ['\x1B[32m', '\x1B[39m'],
    'magenta'   : ['\x1B[35m', '\x1B[39m'],
    'red'       : ['\x1B[31m', '\x1B[39m'],
    'yellow'    : ['\x1B[33m', '\x1B[39m']
};

var style = {};
Object.keys(styles).forEach(function(type) {
    style[type] = function style(str) {
        return styles[type][0] + str + styles[type][1];
    };
});

module.exports = style;