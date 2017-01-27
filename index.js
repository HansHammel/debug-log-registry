const cluster = require('cluster');
const os = require('os');
const path = require('path');
const fs = require('fs');
const extend = require('extend');
const util = require('util');
const caller = require('caller'); // better perf than caller-id

let debugRegistry;

function exitHandler(err) {
    if (err) console.error(err);
    debugRegistry = debugRegistry ? debugRegistry : {};
    // needs to be blocking therfore use a sync function otherwise the process will exit without writing
    fs.writeFileSync(path.join(path.dirname(require.main.filename), "debug.json"), JSON.stringify(debugRegistry, null, 2));
}

//do something when app is closing
process.on('exit', exitHandler);
//catches ctrl+c event
process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

//catches uncaught exceptions
//process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

//a damn neat console wrapper inspired by Paul Irish
(function (con) {
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
                    if (debugRegistry[moduleId] && debugRegistry[moduleId].debug) {
                        count[method]++;


                        //this.history = console.history || []; // store logs to an array for reference
                        //this.history.push(arguments);
                        // DO MESSAGE HERE.

                        //oldLog[method].apply(console, arguments);
                        arguments.callee = arguments.callee.caller;

                        const newarr = Array.prototype.slice.apply(arguments);
                        newarr.unshift(count[method] + ' ' + new Date().toISOString() + ' ' + os.hostname() + ' ' + (cluster.isMaster ? process.pid : cluster.worker.process.pid));


                        //newarr.unshift(arguments.calle.caller);


                        //newarr.unshift(module.parent.filename);

                        //(typeof console[method] === 'object' ? oldLog[method].apply.call(oldLog[method], console, newarr) : oldLog[method].apply(console, newarr));
                        //socket.send([method, util.inspect(newarr, { showHidden: true, depth: null, breakLength: Infinity })]);


                        (typeof console[method] === 'object' ? oldLog[method].apply.call(oldLog[method], console, newarr) : oldLog[method].apply(console, newarr));
                        //socket.send([method, JSON.stringify(newarr, null, null)]);
                        ////socket.send([method, JSON.stringify(arguments, null, null)]);
                    }
                };
            } else console[method] = dummy;
        })(methods[i]);
    }
})(this.console = global.console || {});


function loadData(cb) {
    fs.readFile(path.join(path.dirname(require.main.filename), "debug.json"), 'utf8', function (err, data) {
        //if (err) throw err;
        if (err) {
            //console.log(err);
            data = {};
            //cb(new Error('Could not write '+(path.join(path.dirname(require.main.filename),"debug.json"))),null);
            cb(err, data);
        } else {
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
        if (err) {
            //debugRegistry = debugRegistry ? extend(debugRegistry,data) : data ? data : {};
            //console.log(err);
            cb(err);
        } else {
            debugRegistry = debugRegistry ? extend(debugRegistry, data) : (data ? data : {});
            saveData(function (err) {
                if (err) {
                    //debugRegistry = debugRegistry ? extend(debugRegistry,data) : data ? data : {};
                    cb(err);
                } else {
                }
            });
        }
    });
}

function saveData(cb) {
    //debugRegistry = debugRegistry ? extend(debugRegistry,data) : data ? data : {};
    //for (var i = 0, len = global.__debugRegistry.length; i < len; i++) {	}
    //var name = module.parent ? module.parent.filename : module.filename;
    //var name = moduleId;
    //debugRegistry[name] = debugRegistry[name] ? debugRegistry[name] : { debug: true };

    fs.writeFile(path.join(path.dirname(require.main.filename), "debug.json"), JSON.stringify(debugRegistry, null, 2), function (err) {
        if (err) {
            //console.log(err);
            cb(err);
        } else {

            cb(null);
        }
    });
}

function registerModule(moduleId) {



    //debugRegistry = debugRegistry ? debugRegistry : {};
    /*
     loadData(function(err,data) {
     if (err) throw err;
     else {
     debugRegistry = debugRegistry ? extend(debugRegistry, data) : (data ? data : {});
     console.log(debugRegistry);
     debugRegistry[moduleId] = debugRegistry[moduleId] ? debugRegistry[moduleId] : { debug: true };

     }
     });
     */
    const data = loadDataSync();
    //debugRegistry = debugRegistry ? extend(debugRegistry, data) : (data ? data : {});
    debugRegistry = loadDataSync();
    debugRegistry[moduleId] = debugRegistry[moduleId] ? debugRegistry[moduleId] : {debug: true, mute: false};

    if (false && debugRegistry[moduleId] && debugRegistry[moduleId].debug) {

        const logger = new console.Console(process.stdout, process.stderr);

        logger.id = moduleId;
        //logger.newarr = [];
        logger.count = [];
        //let empty = {};
        logger.dummy = function () {
        };
        //let properties = 'memory'.split(',');
        logger.methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
        'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
        'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',');
        //while (prop = properties.pop()) con[prop] = con[prop] || empty;

        logger.len = logger.methods.length;
        for (let i = 0; i < logger.len; i++) {

            (function (method) {
                logger.count[method] = 0;
                logger.oldLog = logger[method];
                if (logger.oldLog) {
                    logger[method] = function () {
                        moduleId = moduleId ? moduleId : caller();
                        if (debugRegistry[moduleId] && debugRegistry[moduleId].debug) {
                            logger.count[method]++;
                            //this.history = console.history || []; // store logs to an array for reference
                            //this.history.push(arguments);
                            // DO MESSAGE HERE.

                            //oldLog.apply(console, arguments);
                            arguments.callee = arguments.callee.caller;
                            //logger.newarr.length = 0
                            //logger.newarr = [].slice.call(arguments);

                            /*
                             logger.newarr = [];
                             logger.newarr.push(logger.count[method]);
                             logger.newarr.push(new Date().toISOString());
                             logger.newarr.push(os.hostname());
                             logger.newarr.push(cluster.isMaster ? process.pid : cluster.worker.process.pid);
                             Array.prototype.push.apply(logger.newarr, Array.prototype.slice.apply(arguments));
                             */

                            /*
                             logger.newarr = Array.prototype.slice.apply(arguments);
                             logger.newarr.unshift(cluster.isMaster ? process.pid : cluster.worker.process.pid);
                             logger.newarr.unshift(os.hostname());
                             logger.newarr.unshift(new Date().toISOString());
                             logger.newarr.unshift(logger.count[method]);
                             */

                            logger.newarr = Array.prototype.slice.apply(arguments);
                            logger.newarr.unshift(logger.count[method] + ' ' + new Date().toISOString() + ' ' + os.hostname() + ' ' + (cluster.isMaster ? process.pid : cluster.worker.process.pid));

                            //newarr.unshift(this.caller);


                            //newarr.unshift(module.parent.filename);

                            //(typeof console[method] === 'object' ? oldLog.apply.call(oldLog, console, newarr) : oldLog.apply(console, newarr));
                            //socket.send([method, util.inspect(newarr, { showHidden: true, depth: null, breakLength: Infinity })]);


                            (typeof logger[method] === 'object' ? logger.oldLog.apply.call(logger.oldLog, logger, logger.newarr) : logger.oldLog.apply(logger, logger.newarr));
                            //socket.send([method, JSON.stringify(newarr, null, null)]);
                            ////socket.send([method, JSON.stringify(arguments, null, null)]);
                        }
                    };
                } else logger[method] = logger.dummy;
            })(logger.methods[i]);
        }

        return logger;
    } else {
        return global.console;
    }

}

module.exports = registerModule;

/*
 console.log(module.filename); // full filepath - better
 console.log(module.id); // is . from within main script otherwise full filepath within modules
 console.dir(module.parent ? module.parent.id : undefined);  //undefined form within main script, '.' from within a fist level module, full path otherwise
 console.dir(require.main.id); // is always '.' from within main script and modules
 console.log(__filename); //full filepath of the file where it is used
 console.log(__dirname); //filedir of the file where it is used
 console.log(path.resolve(__dirname)); // saver?
 console.log(path.dirname(__filename)); // get filedir
 console.log(path.basename(__filename)); //get filename only
 console.log(require.main.filename) // entripoint full filepath
 console.log(path.dirname(require.main.filename)) // entripoint filedir - fails with launchers like pm2 or tests with e.g. mocha
 console.log(process.cwd()); // CWD
 console.dir(require.main.paths); // local modules search path
 console.dir(module.globalPaths); // not that this is always undefined al it is the local module
 console.dir(require('module').globalPaths); // global modules search path causewe require the global module

 //console.log(util.inspect(arguments.callee, { showHidden: true, depth: null }));
 //console.log(util.inspect(arguments.callee.caller, { showHidden: true, depth: null }));

 //console.log(arguments.callee.caller.arguments[1].main.filename);
 //console.log(moduleId);

 var appDir = path.dirname(require.main.filename); //
 global.appRoot = path.resolve(__dirname); //alternative is to put this in the main script (entrypoint)
 console.log(appDir)
 */

//require.main.id //
