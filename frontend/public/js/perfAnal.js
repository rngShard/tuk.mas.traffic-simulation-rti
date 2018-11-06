class Analyzer {
    constructor(logs) {
        for (let i = 0; i < logs.length; i++) {
            if (logs[i]['type'] === "carAgents.log") {
                this.carAgentsLines = logs[i]['lines'];
            } else if (logs[i]['type'] === "plannerAgent.log") {
                this.plannerAgentLines = logs[i]['lines'];
            } else if (logs[i]['type'] === "events.log") {
                this.eventsLines = logs[i]['lines'];
            } else {
                console.warning("Encountered unhandled log-type...");
            }
        }
    }

    start() {
        let thiz = this;    // fml ... daym, those callbacks
        this._calcInternals(function() {
            let perfAnal = thiz._analysePerformance();
            console.log(perfAnal);
            toastr.success(`Performance Analysis done (see console output)`);
        })
    }

    _calcInternals(cb) {
        let thiz = this;
        this._setupCarAgents(function() {
            thiz._includePathing(function() {
                cb();
            });
        });
    }
    _setupCarAgents(cb) {
        let carAgents = {};
        for (let i = 0; i < this.carAgentsLines.length; i++) {
            let line = this.carAgentsLines[i],
                s = line.split(';'),
                carAgentId = s[2].trim(),
                action = s[1].trim().toUpperCase();
            if (action === "SPAWN") {
                carAgents[carAgentId] = {
                    agentType: s[4].trim(),
                    start: new Date(s[0].trim()).getTime(),
                    actualRoute: []
                };
            } else if (action === "ENTER" || action === "REACH") {
                carAgents[carAgentId]['actualRoute'].push(s[3].trim());
            } else if (action === "DESPAWN") {
                carAgents[carAgentId]['end'] = new Date(s[0].trim()).getTime();
                carAgents[carAgentId]['actualDuration'] = carAgents[carAgentId]['end'] - carAgents[carAgentId]['start'];
            }

            if (i === this.carAgentsLines.length - 1) {
                this.carAgents = carAgents;
                cb();
            }
        }
    }
    _includePathing(cb) {
        // class Graph {
        //     constructor(graphx) {
        //         this.nodes = graphx.nodes;
        //         this.links = graphx.links;
        //     }
        // }
        
        // $.get('http://localhost:3000/api/graph', function(res) {
        //     let graphx = res.payload,
        //         graph = new Graph(graphx);

        for (let i = 0; i < this.plannerAgentLines.length; i++) {
            let line = this.plannerAgentLines[i],
                s = line.split(';'),
                carAgentId = s[2].trim(),
                action = s[1].trim().toUpperCase();
            if (action === "INIT") {
                let routeTimes = s[4].trim().split(',');
                this.carAgents[carAgentId]['initRoute'] = s[3].trim().split(',');
                this.carAgents[carAgentId]['initRouteTimes'] = routeTimes;
                for (let sum=0, i=0; i < routeTimes.length; i++) {
                    sum += parseInt(routeTimes[i]);
                    if (i == routeTimes.length - 1)
                        this.carAgents[carAgentId]['initTravelTime'] = sum;
                }
            // } else if (action === "UPDATE") {
            //     // note: not inspected so far
            // } else if (action === "REROUTE") {
            //     // note: not inspected so far
            }

            if (i === this.plannerAgentLines.length - 1)
                cb();
        }
        // });
    }


    _analysePerformance() {
        return this.carAgents;
    }
}