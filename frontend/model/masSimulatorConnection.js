const path = require('path');
const readline = require('readline');
const fs = require('fs');

const LOG_DIR_PATH = path.resolve('../data/sim_logs/');
const NUM_ASSOC_LOGS = 2;
const GRAPH_DIR_PATH = path.resolve('../data/graphs/');

module.exports = function() {

    /* Graphs */

    let graphs = {},
        activeGraph = undefined;
    fs.readdir(GRAPH_DIR_PATH, (err, files) => {
        activeGraph = files[0].substring(0, files[0].length-5);
        files.forEach(fileName => {
            let graphName = fileName.substring(0, fileName.length-5),
                json = JSON.parse(fs.readFileSync(GRAPH_DIR_PATH+'/'+fileName));
            
            graphs[graphName] = json;
        });
    });

    this.getAllGraphs = function() {
        return graphs;
    };

    this.getGraph = function() {
        return graphs[activeGraph];
    };

    this.getActiveGraph = function() {
        return activeGraph;
    };

    this.setActiveGraph = function(newActive) {     // Set activeGraph to new int-index of graphs-array
        activeGraph = newActive;
    };

    this.getAllGraphTitles = function() {
        return Object.keys(graphs);
    }


    /* Logs */

    let accumLogs = [];
    let readLogLines = function(logFileName, array) {
        let rl = readline.createInterface({
            input: fs.createReadStream(LOG_DIR_PATH+'/'+logFileName),
            crlfDelay: Infinity
        });
        rl.on('line', (line) => { array.push(line); });
    };
    fs.readdir(LOG_DIR_PATH, (err, files) => {
        files.forEach(logFileName => {
            let lines = [],
                rl = readline.createInterface({
                input: fs.createReadStream(LOG_DIR_PATH+'/'+logFileName),
                crlfDelay: Infinity
            });
            rl.on('line', (line) => { lines.push(line); });
            rl.on('close', function() {
                let s = logFileName.split('-');
                accumLogs.push({
                    id: s[0],
                    graphName: s[1],
                    type: s[2],
                    lines: lines
                });
            });
        });
    });

    this.getLogs = function() {
        return accumLogs;
    }

    this.getLogInfos = function() {
        let infos = [];
        for (i = 0; i < accumLogs.length; i++) {
            infos.push({
                id: accumLogs[i]['id'],
                graphName: accumLogs[i]['graphName']
            });
            for (j=0; j<NUM_ASSOC_LOGS-1; j++) { i++ }  // not very nice ... `i+=NUM_ASSOC_LOGS` instead of `i++` in for loop wouldn't work though
            if (i >= accumLogs.length - 1) {
                return infos;
            }
        }
    }

    this.getSimulationLogs = function(logId) {   // get logs of specified single simulation-run
        let assocLogs = [];
        for (i = 0; i < accumLogs.length; i++) {
            let log = accumLogs[i];
            if (log['id'] === logId) { assocLogs.push(log); }
            if (i >= accumLogs.length-1) {
                return assocLogs;
            }
        }
    };


    return this;
};