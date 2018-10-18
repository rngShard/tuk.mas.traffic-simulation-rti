const path = require('path');
const readline = require('readline');
const fs = require('fs');

const LOG_DIR_PATH = path.resolve('../sim_logs/');
const NUM_ASSOC_LOGS = 2;

module.exports = function() {
    this.activeGraph = 0;
    this.graphs = [     // TODO: read graphs from json-file
        {
            'directed': true,
            'graph': {
                'name': 'testGraph'
            },
            'links': [
                {'source': 0, 'target': 1, 'value':1},
                {'source': 1, 'target': 2, 'value':2},
                {'source': 2, 'target': 3, 'value':2},
                {'source': 3, 'target': 4, 'value':1},
                {'source': 0, 'target': 5, 'value':8},
                {'source': 2, 'target': 5, 'value':8},
                {'source': 3, 'target': 6, 'value':3},
                {'source': 4, 'target': 6, 'value':4},
                {'source': 5, 'target': 4, 'value':2}
            ],            
            'multigraph': false,
            'nodes': [
                {'id': 0},
                {'id': 1},
                {'id': 2},
                {'id': 3},
                {'id': 4},
                {'id': 5},
                {'id': 6}
            ]
        },
        {
            'directed': false,
            'graph': {
                'name': "Zachary's Karate Club"
            },
            'links': [
                {'source': 0, 'target': 1, 'value':1},
                {'source': 0, 'target': 2, 'value':1},
                {'source': 0, 'target': 3, 'value':1},
                {'source': 0, 'target': 4, 'value':1},
                {'source': 0, 'target': 5, 'value':1},
                {'source': 0, 'target': 6, 'value':1},
                {'source': 0, 'target': 7, 'value':1},
                {'source': 0, 'target': 8, 'value':1},
                {'source': 0, 'target': 10, 'value':1},
                {'source': 0, 'target': 11, 'value':1},
                {'source': 0, 'target': 12, 'value':1},
                {'source': 0, 'target': 13, 'value':1},
                {'source': 0, 'target': 17, 'value':1},
                {'source': 0, 'target': 19, 'value':1},
                {'source': 0, 'target': 21, 'value':1},
                {'source': 0, 'target': 31, 'value':1},
                {'source': 1, 'target': 2, 'value':1},
                {'source': 1, 'target': 3, 'value':1},
                {'source': 1, 'target': 7, 'value':1},
                {'source': 1, 'target': 13, 'value':1},
                {'source': 1, 'target': 17, 'value':1},
                {'source': 1, 'target': 19, 'value':1},
                {'source': 1, 'target': 21, 'value':1},
                {'source': 1, 'target': 30, 'value':1},
                {'source': 2, 'target': 3, 'value':1},
                {'source': 2, 'target': 32, 'value':1},
                {'source': 2, 'target': 7, 'value':1},
                {'source': 2, 'target': 8, 'value':1},
                {'source': 2, 'target': 9, 'value':1},
                {'source': 2, 'target': 13, 'value':1},
                {'source': 2, 'target': 27, 'value':1},
                {'source': 2, 'target': 28, 'value':1},
                {'source': 3, 'target': 7, 'value':1},
                {'source': 3, 'target': 12, 'value':1},
                {'source': 3, 'target': 13, 'value':1},
                {'source': 4, 'target': 10, 'value':1},
                {'source': 4, 'target': 6, 'value':1},
                {'source': 5, 'target': 16, 'value':1},
                {'source': 5, 'target': 10, 'value':1},
                {'source': 5, 'target': 6, 'value':1},
                {'source': 6, 'target': 16, 'value':1},
                {'source': 8, 'target': 32, 'value':1},
                {'source': 8, 'target': 30, 'value':1},
                {'source': 8, 'target': 33, 'value':1},
                {'source': 9, 'target': 33, 'value':1},
                {'source': 13, 'target': 33, 'value':1},
                {'source': 14, 'target': 32, 'value':1},
                {'source': 14, 'target': 33, 'value':1},
                {'source': 15, 'target': 32, 'value':1},
                {'source': 15, 'target': 33, 'value':1},
                {'source': 18, 'target': 32, 'value':1},
                {'source': 18, 'target': 33, 'value':1},
                {'source': 19, 'target': 33, 'value':1},
                {'source': 20, 'target': 32, 'value':1},
                {'source': 20, 'target': 33, 'value':1},
                {'source': 22, 'target': 32, 'value':1},
                {'source': 22, 'target': 33, 'value':1},
                {'source': 23, 'target': 32, 'value':1},
                {'source': 23, 'target': 25, 'value':1},
                {'source': 23, 'target': 27, 'value':1},
                {'source': 23, 'target': 29, 'value':1},
                {'source': 23, 'target': 33, 'value':1},
                {'source': 24, 'target': 25, 'value':1},
                {'source': 24, 'target': 27, 'value':1},
                {'source': 24, 'target': 31, 'value':1},
                {'source': 25, 'target': 31, 'value':1},
                {'source': 26, 'target': 33, 'value':1},
                {'source': 26, 'target': 29, 'value':1},
                {'source': 27, 'target': 33, 'value':1},
                {'source': 28, 'target': 33, 'value':1},
                {'source': 28, 'target': 31, 'value':1},
                {'source': 29, 'target': 32, 'value':1},
                {'source': 29, 'target': 33, 'value':1},
                {'source': 30, 'target': 33, 'value':1},
                {'source': 30, 'target': 32, 'value':1},
                {'source': 31, 'target': 33, 'value':1},
                {'source': 31, 'target': 32, 'value':1},
                {'source': 32, 'target': 33, 'value':1}
            ],
            'multigraph': false,
            'nodes': [
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 0, 'size': 16},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 1, 'size': 9},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 2, 'size': 10},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 3, 'size': 6},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 4, 'size': 3},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 5, 'size': 4},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 6, 'size': 4},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 7, 'size': 4},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 8, 'size': 5},
                {'club': 'Officer', 'color': 'orange', 'id': 9, 'size': 2},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 10, 'size': 3},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 11, 'size': 1},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 12, 'size': 2},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 13, 'size': 5},
                {'club': 'Officer', 'color': 'orange', 'id': 14, 'size': 2},
                {'club': 'Officer', 'color': 'orange', 'id': 15, 'size': 2},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 16, 'size': 2},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 17, 'size': 2},
                {'club': 'Officer', 'color': 'orange', 'id': 18, 'size': 2},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 19, 'size': 3},
                {'club': 'Officer', 'color': 'orange', 'id': 20, 'size': 2},
                {'club': 'Mr. Hi', 'color': 'purple', 'id': 21, 'size': 2},
                {'club': 'Officer', 'color': 'orange', 'id': 22, 'size': 2},
                {'club': 'Officer', 'color': 'orange', 'id': 23, 'size': 5},
                {'club': 'Officer', 'color': 'orange', 'id': 24, 'size': 3},
                {'club': 'Officer', 'color': 'orange', 'id': 25, 'size': 3},
                {'club': 'Officer', 'color': 'orange', 'id': 26, 'size': 2},
                {'club': 'Officer', 'color': 'orange', 'id': 27, 'size': 4},
                {'club': 'Officer', 'color': 'orange', 'id': 28, 'size': 3},
                {'club': 'Officer', 'color': 'orange', 'id': 29, 'size': 4},
                {'club': 'Officer', 'color': 'orange', 'id': 30, 'size': 4},
                {'club': 'Officer', 'color': 'orange', 'id': 31, 'size': 6},
                {'club': 'Officer', 'color': 'orange', 'id': 32, 'size': 12},
                {'club': 'Officer', 'color': 'orange', 'id': 33, 'size': 17}
            ]
        }
    ];

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
                    graphIdx: s[1],
                    type: s[2],
                    lines: lines
                });
            });
        });
    })
    this.getLogs = function() {
        return accumLogs;
    }
    this.getLogInfos = function() {
        let infos = [];
        for (i = 0; i < accumLogs.length; i++) {
            infos.push({
                id: accumLogs[i]['id'],
                graphIdx: accumLogs[i]['graphIdx']
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


    this.getGraph = function() {
        return this.graphs[this.activeGraph];
    };

    this.setActiveGraph = function(newActive) {     // Set activeGraph to new int-index of graphs-array
        this.activeGraph = newActive;
    };

    this.getAllGraphTitles = function() {
        let titles = [];
        for (i = 0; i < graphs.length; i++) {
            titles.push(graphs[i]['graph']['name']);
            if (i === graphs.length - 1)
                return titles;
        }
    }

    return this;
};