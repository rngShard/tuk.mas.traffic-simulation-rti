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
                    start: new Date(s[0].trim()).getTime()
                };
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
        $.get('http://localhost:3000/api/graph', function(res) {
            let graphxData = res.payload;
            
            for (let i = 0; i < this.plannerAgentLines.length; i++) {
                let line = this.plannerAgentLines[i],
                    s = line.split(';'),
                    carAgentId = s[2].trim(),
                    action = s[1].trim().toUpperCase();
                if (action === "INIT") {
                    // TODO: calc init time bsaed on graphs only (no traffic in play), calc init time based in traffic
                } else if (action === "UPDATE") {
                    // TODO: time on update
                } else if (action === "REROUTE") {
                    // TODO: time on reroute with reroute-marker (as completely new path)
                }

                if (i === this.plannerAgentLines.length - 1)
                    cb();
            }
        });
    }


    _analysePerformance() {
        return this.carAgents;
    }
}