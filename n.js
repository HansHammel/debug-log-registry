//var console = require('./index.js')(module.filename);
//require('./global-module.js')(module.filename);
require('./global-console.js');
const util = require('util');
const m = require('./m.js');

console.log('i');
function o() {
    console.log(util.inspect(arguments.callee, {showHidden: true, depth: null}));
    console.log(util.inspect(arguments.callee.caller, {showHidden: true, depth: null}));
}
//o();
m.h();