//var console = require('./index.js')(module.filename);
//var console = require('./index.js')();
//var console = require('./dedicated-console.js')(module.filename);
//var console = require('./dedicated-console.js')(); //12% slower
require('./global-console.js'); //41% slower

let os = require('os');
let cluster = require('cluster');
const time = process.hrtime();
let count = 0;
while (count < 100000) {
    count++;
    //console.log(count+' '+new Date().toISOString()+' '+os.hostname()+' '+(cluster.isMaster ? process.pid : cluster.worker.process.pid),'no');
    console.log('no');
}
const diff = process.hrtime(time);
let sec = ((diff[0] * 1e9 + diff[1]) / 1e9).toFixed(3);
let ops = (count / sec).toFixed(3);
console.log(`Benchmark took ${sec} seconds or ${diff[0] * 1e9 + diff[1]} nanoseconds`);
console.log(`Performed ${ops} operations per second`);

