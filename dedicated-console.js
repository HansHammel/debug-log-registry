(function (module) {
    const cluster = require('cluster');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const extend = require('extend');
    const util = require('util');
    const caller = require('caller');

    let debugRegistry;

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

    function registerModule(moduleId) {
        moduleId = moduleId ? moduleId : caller();
        debugRegistry = loadDataSync();
        debugRegistry[moduleId] = debugRegistry[moduleId] ? debugRegistry[moduleId] : {debug: true, mute: false};
        if (debugRegistry[moduleId] && debugRegistry[moduleId].debug) {
            const logger = new console.Console(process.stdout, process.stderr);
            logger.id = moduleId;
            logger.count = [];
            logger.dummy = function () {
            };
            const methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
            'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
            'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',');
            let len = methods.length;
            logger.oldLog = [];
            for (let i = 0; i < len; i++) {
                logger.oldLog[methods[i]] = logger[methods[i]];
                (function (method) {
                    logger.count[method] = logger.count[method] ? logger.count[method] : 0;
                    if (logger.oldLog[method]) {
                        logger[method] = function () {
                            if (debugRegistry[logger.id] && debugRegistry[logger.id].debug) {
                                logger.count[method]++;
                                arguments.callee = arguments.callee.caller;
                                const newarr = Array.prototype.slice.apply(arguments);
                                newarr.unshift(logger.count[method] + ' ' + new Date().toISOString() + ' ' + os.hostname() + ' ' + (cluster.isMaster ? process.pid : cluster.worker.process.pid));
                                (typeof logger[method] === 'object' ? logger.oldLog[method].apply.call(logger.oldLog[method], logger, newarr) : logger.oldLog[method].apply(logger, newarr));
                            }
                        };
                    } else logger[method] = logger.dummy;
                })(methods[i]);
            }
            return logger;
        } else {
            return global.console;
        }
    }

    module.exports = registerModule;
})(module);