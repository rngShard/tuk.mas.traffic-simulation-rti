class Report {
    constructor(carAgents) {
        this.basicCarAgentInfo = carAgents;
        this.payload = {
            internalInfo: {},
            // agentObjs: [],
            // travelTimeObjs: [],
            // routeObjs: [],
            summary: {}
        };
    }

    getRawInfos() {
        return this.basicCarAgentInfo;
    }

    analyse(cb) {
        let thiz = this;
        this._analyzeInternalInfo(function() {
            thiz._combAnal(function() {
                cb();
            });
        });
    }

    getAnalysis() {
        return this.payload;
    }

    _analyzeInternalInfo(cb) {
        let keyset = Object.keys(this.basicCarAgentInfo);
        for (let i = 0; i < keyset.length; i++) {
            let key = keyset[i],
                info = this.basicCarAgentInfo[key];
            // let agentObj = {
            //     id: key,
            //     type: info.agentType
            // }, 
            let travelTimeObj = {
                initTravelTime: info.initTravelTime,
                actualTravelTime: info.actualTravelTime,
                travelTimeDiscrepancy: info.actualTravelTime - info.initTravelTime
            }, routeObj = {
                initRoute: info.initRoute,
                actualRoute: info.actualRoute
            };
            this.payload.internalInfo[key] = {
                id: key,
                type: info.agentType,
                travelTime: travelTimeObj,
                route: routeObj,
                numRerouted: info.numRerouted
            }
            // this.payload.agentObjs.push(agentObj);
            // this.payload.travelTimeObjs.push(travelTimeObj);
            // this.payload.routeObjs.push(routeObj);

            if (i === keyset.length - 1)
                cb();
        }
    }

    _combAnal(cb) {
        let travelTimeSumDiscr = 0, 
            travelTimesDiscrs = [];
            let localTimeDiscr = 0,
                cLocal = 0,
                travelTimesDiscrsLocal = [],
                globalTimeDiscr = 0,
                travelTimesDiscrsGlobal = [],
                cGlobal = 0;
        let numReroutedAtAll = 0,
            reroutes = [];
        
        let keyset = Object.keys(this.payload.internalInfo),
            numAgents = keyset.length;
        for (let i = 0; i < numAgents; i++) {
            let info = this.payload.internalInfo[keyset[i]];

            let discrepancy = info.travelTime.travelTimeDiscrepancy;
            travelTimeSumDiscr += discrepancy;
            travelTimesDiscrs.push(discrepancy);
            
            if (info.numRerouted > 0)
            numReroutedAtAll += 1;
            reroutes.push(info.numRerouted);

            if (info.type === 'local') {
                localTimeDiscr += info.travelTime.travelTimeDiscrepancy;
                travelTimesDiscrsLocal.push(info.travelTime.travelTimeDiscrepancy);
                cLocal += 1;
            } else if (info.type === 'global') {
                globalTimeDiscr += info.travelTime.travelTimeDiscrepancy;
                travelTimesDiscrsGlobal.push(info.travelTime.travelTimeDiscrepancy);
                cGlobal += 1;
            }

            if (i === numAgents - 1) {
                this.payload.summary = {
                    agentNum: numAgents,
                    agentNumLocal: cLocal,
                    agentNumGlobal: cGlobal,
                    travelTimeAvgDiscrepancy: travelTimeSumDiscr / numAgents,
                    travelTimeDiscrepancyLocal: localTimeDiscr / cLocal,
                    travelTimeDiscrepancyGlobal: globalTimeDiscr / cGlobal,
                    travelTimeDiscrepancies: travelTimesDiscrs,   // = travelTimesDiscrs.sort((a,b) => b - a);
                    travelTimeDiscrepanciesLocal: travelTimesDiscrsLocal,
                    travelTimeDiscrepanciesGlobal: travelTimesDiscrsGlobal,
                    howManyReroutedAtAll: numReroutedAtAll,
                    reroutes: reroutes
                };
                
                cb();
            }
        }
    }
}

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
            let report = new Report(thiz.carAgents);
            
            report.analyse(function() {
                let output = report.getAnalysis();
                
                // TODO: output to file too
                console.log("PerfAnalysis:", output);

                toastr.success("Performance Analysis done (see console output)");
            });            
        });
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
                    actualRoute: [],
                    numRerouted: 0
                };
            } else if (action === "ENTER" || action === "REACH") {
                carAgents[carAgentId]['actualRoute'].push(s[3].trim());
            } else if (action === "DESPAWN") {
                carAgents[carAgentId]['end'] = new Date(s[0].trim()).getTime();
                carAgents[carAgentId]['actualTravelTime'] = carAgents[carAgentId]['end'] - carAgents[carAgentId]['start'];
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
            } else if (action === "UPDATE") {
                // note: not inspected so far
            } else if (action === "REROUTE") {
                this.carAgents[carAgentId]['numRerouted'] += 1;
            }

            if (i === this.plannerAgentLines.length - 1)
                cb();
        }
        // });
    }
}