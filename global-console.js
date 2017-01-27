(function (module) {
    const cluster = require('cluster');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const extend = require('extend');
    const util = require('util');
    const caller = require('caller'); // better perf than caller-id

    let debugRegistry = loadDataSync();

//save on proces exit
    function exitHandler(err) {
        if (err) console.error(err);
        debugRegistry = debugRegistry ? debugRegistry : {};
        // needs to be blocking therfore use a sync function otherwise the process will exit without writing
        fs.writeFileSync(path.join(path.dirname(require.main.filename), "debug.json"), JSON.stringify(debugRegistry, null, 2));
    }

    process.on('exit', exitHandler);
//catches ctrl+c event
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);

    function loadData(cb) {
        fs.readFile(path.join(path.dirname(require.main.filename), "debug.json"), 'utf8', function (err, data) {
            if (err) cb(err, data);
            else {
                data = JSON.parse(data);
                cb(null, data);
            }
        });
    }

    function loadDataSync() {
        return JSON.parse(fs.readFileSync(path.join(path.dirname(require.main.filename), "debug.json")));
    }

    function syncData(cb) {
        loadData(function (err, data) {
            if (err) cb(err);
            else {
                debugRegistry = debugRegistry ? extend(debugRegistry, data) : (data ? data : {});
                saveData(function (err) {
                    if (err) cb(err);
                });
            }
        });
    }

    function saveData(cb) {
        fs.writeFile(path.join(path.dirname(require.main.filename), "debug.json"), JSON.stringify(debugRegistry, null, 2), function (err) {
            if (err) cb(err);
            else cb(null);
        });
    }

//a damn neat console wrapper inspired by Paul Irish
    (function (console) {
        const count = [];
        //let empty = {};
        const dummy = function () {
        };
        //let properties = 'memory'.split(',');
        const methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
        'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
        'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',');
        //while (prop = properties.pop()) con[prop] = con[prop] || empty;
        const len = methods.length;
        const oldLog = [];
        for (let i = 0; i < len; i++) {
            oldLog[methods[i]] = console[methods[i]];
            (function (method) {
                count[method] = 0;
                if (oldLog[method]) {
                    console[method] = function () {
                        const moduleId = caller();
                        debugRegistry[moduleId] = debugRegistry[moduleId] ? debugRegistry[moduleId] : {
                                debug: true,
                                mute: false
                            };
                        if (debugRegistry[moduleId] && debugRegistry[moduleId].debug) {
                            count[method]++;
                            arguments.callee = arguments.callee.caller;
                            const newarr = Array.prototype.slice.apply(arguments);
                            newarr.unshift(count[method] + ' ' + new Date().toISOString() + ' ' + os.hostname() + ' ' + (cluster.isMaster ? process.pid : cluster.worker.process.pid));
                            (typeof console[method] === 'object' ? oldLog[method].apply.call(oldLog[method], console, newarr) : oldLog[method].apply(console, newarr));
                        }
                    };
                } else console[method] = dummy;
            })(methods[i]);
        }
    })(global.console || {});
})(module);

