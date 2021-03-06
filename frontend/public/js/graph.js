let MAX_TICKS = 63,
    SVG = undefined;
var simulation = undefined,
    analyzer = undefined;
 
class Animation {
    constructor() {}

    /* take agentIds as param to assign colors for agents. */
    setCarAgents(carAgents) {
        this.carAgents = {};
        for (let [id, attrs] of Object.entries(carAgents)) {
            let rand = Math.random() * .7 + .3;
            this.carAgents[id] = {
                stroke: attrs.type === "LOCAL" ? 'red' : attrs.type === "GLOBAL" ? 'green' : 'blue',
                color: d3.interpolateBlues(rand),   // ((Math.random()+1)/2) ?
                interpolVal: rand
            }
        }
    }

    setAgentPaths(agentPaths) {
        this.agentPaths = agentPaths;
    }

    animateCarAgent(carAgentEvent) {
        switch (carAgentEvent.type) {
            case "SPAWN":
                this._drawStaticCarAgent(carAgentEvent.agentId, carAgentEvent.startNodeId);
                break;
            case "ENTER":
                this._drawDynamicCarAgent(carAgentEvent.agentId, carAgentEvent.startNodeId, carAgentEvent.endNodeId, carAgentEvent.travelTime);
                break;
            case "REACH":
                this._drawStaticCarAgent(carAgentEvent.agentId, carAgentEvent.endNodeId);
                break;
            case "DESPAWN":
                this._purgeCarAgent(carAgentEvent.agentId);
                break;
            default:
                console.warning("Trying to animate unexpected carAgent type !!");
                break;
        }
    }

    animateGodlyEvent(routeNodePairStrings, factor) {
        let color = d3.interpolateReds(factor);
        routeNodePairStrings.forEach(function(pairStrings) {
            let s = pairStrings.substring(1,pairStrings.length-1).split('-'),
                node1 = s[0],
                node2 = s[1];
            ['line-'+node1+'-'+node2, 'line-'+node2+'-'+node1].forEach(function(possibleLineId) {
                let linkStrokeWidthOld = $('#'+possibleLineId).css('stroke-width');
                // let linkStrokeColorOld = $('#'+possibleLineId).css('stroke');
                if (!d3.select('#'+possibleLineId).empty()) {
                    $('#circle'+node1).css('fill', color);
                    $('#circle'+node2).css('fill', color);
                    $('#'+possibleLineId)
                        .css('stroke', color)
                        .css('stroke-width', 4);
                    setTimeout(function() {
                        $('#circle'+node1).css('fill', 'black');
                        $('#circle'+node2).css('fill', 'black');
                        $('#'+possibleLineId).css('stroke-width', linkStrokeWidthOld);
                    }, 500);
                }
            });
        });
    }

    animateAgentPath(agentId, ts) {
        let newPathNodes = this.agentPaths[agentId][ts]['routeNodes'],
            action = this.agentPaths[agentId][ts]['action'],
            newColors = {
                INIT: d3.interpolateBlues(this.carAgents[agentId].interpolVal),
                REROUTE: d3.interpolateGreens(this.carAgents[agentId].interpolVal)
            }, newSize = {
                INIT: "10px",
                REROUTE: "15px"
            };
        newPathNodes.forEach(function(nodeId) {
            let c = $('#circle'+nodeId).css('fill'),
                r = $('#circle'+nodeId).css('r');
            $('#circle'+nodeId)
                .css('fill', newColors[action])
                .css('r',  newSize[action]);
            setTimeout(function() {
                $('#circle'+nodeId)
                    .css('fill', c)
                    .css('r', r);
            }, 500);
        });
    }

    purgeAllAnimation() {
        let thiz = this;
        Object.keys(this.carAgents).forEach(function(agentId) {
            thiz._purgeCarAgent(agentId);
        });
    }

    _drawStaticCarAgent(carAgentId, nodeId) {
        this._purgeCarAgent(carAgentId);
        let nodeCircle = d3.select('#circle'+nodeId),
            transformString = nodeCircle.attr('transform'),
            s = transformString.substring(10, transformString.length - 1).split(','),
            x = s[0],
            y = s[1];
        this._drawAgentCircle(carAgentId, x, y);
    }
    _drawDynamicCarAgent(carAgentId, startNodeId, endNodeId, travelTime) {
        this._purgeCarAgent(carAgentId);
        
        let startCoordTransStr = d3.select('#circle'+startNodeId).attr('transform'),
            startCoordSplit = startCoordTransStr.substring(10, startCoordTransStr.length - 1).split(','),
            startX = startCoordSplit[0],
            startY = startCoordSplit[1];
        let endCoordTransStr = d3.select('#circle'+endNodeId).attr('transform'),
            endCoordSplit = endCoordTransStr.substring(10, endCoordTransStr.length - 1).split(','),
            endX = endCoordSplit[0],
            endY = endCoordSplit[1];

        let t = d3.transition()
            .duration(travelTime)
            .ease(d3.easeLinear);
        
        let circle = this._drawAgentCircle(carAgentId, startX, startY)
            .transition(t)
                .attr('cx', endX)
                .attr('cy', endY);
    }
    _purgeCarAgent(carAgentId) {
        d3.select('#agent'+carAgentId).remove();
    }

    _drawAgentCircle(carAgentId, x, y) {
        return SVG.append("circle")
            .attr('id', "agent"+carAgentId)
            .attr('cx', x)
            .attr('cy', y)
            .attr('fill', this.carAgents[carAgentId].color)
            .attr('stroke', this.carAgents[carAgentId].stroke)
            .attr('stroke-width', 3)
            .attr('r', 8)
    }
}

class carAgentEvent {
    constructor(line) {
        let s = line.split(';');

        this.ts = new Date(s[0].trim()).getTime();
        this.type = s[1].trim().toUpperCase();
        this.agentId = s[2].trim();
        switch (this.type) {
            case "SPAWN":
                this.startNodeId = s[3].trim();
                this.agentType = s[4].trim();
                break;
            case "ENTER":
                this.startNodeId = s[3].trim();
                this.endNodeId = s[4].trim();
                this.travelTime = s[5].trim();
                break;
            case "REACH":
                this.endNodeId = s[3].trim();
                break;
            case "DESPAWN":
                break;
            default:
            console.warning("Trying to create unexpected carAgent type !!");
                break;
        }
    }
}

/* Uses dict-type of lists ({"000":"LOCAL", "001":"GLOBAL"}) */
class Simulation {
    constructor(logs) {
        this.running = false;
        this.animation = new Animation();
        for (let i = 0; i < logs.length; i++) {
            if (logs[i]['type'] === "carAgents.log") {
                this.carAgentsEvents = logs[i]['lines'];
                this.animation.setCarAgents(this._extractCarAgents(logs[i]['lines']));
            } else if (logs[i]['type'] === "plannerAgent.log") {
                this.plannerAgentPaths = logs[i]['lines'];
                this.animation.setAgentPaths(this._extractAgentPaths(logs[i]['lines']));
            } else if (logs[i]['type'] === "events.log") {
                this.godlyEvents = logs[i]['lines'];
            } else {
                console.warning("Encountered unhandled log-type...");
            }
        }
    }

    _extractCarAgents(logLines) {
        let carAgents = {};
        for (let i = 0; i < logLines.length; i++) {
            let s = logLines[i].split(';');
            if (s[1].trim() === "SPAWN") {
                let agentId = s[2].trim(),
                    agentType = s[4].trim();
                carAgents[agentId] = {
                    type: agentType
                };
            }
            if (i >= logLines.length-1) { return carAgents; }
        }
    }

    _extractAgentPaths(logLines) {
        let agentPaths = {};
        for (let i = 0; i < logLines.length; i++) {
            let s = logLines[i].split(';');
            let agentId = s[2].trim(),
                ts = new Date(s[0].trim()).getTime();
            if (s[1].trim() === "INIT") {
                agentPaths[agentId] = {};
            }
            agentPaths[agentId][ts] = {
                action: s[1].trim().toUpperCase(),
                routeNodes: s[3].trim().split(',')
                // routeLinkValues: s[4].trim().split(',')
            }
            if (i >= logLines.length-1) { return agentPaths; }
        }
    }

    /* Start Simulation run with animations
     * 
     * Animations are assynchronously queued by timeouts according to time differences to init time.
     * - FOR NOW only traverse carAgents.log. TODO: traverse planner and query most current event and so on 
     */
    start() {
        this.running = true;
        let initTsString = this.carAgentsEvents[0].split(';')[0].trim();
        let initTimeMs = new Date(initTsString).getTime();
        // careful: initialTime is set to first entry ts in `carAgents.log` (!!!)
        
        /* animate carAgent spawns, movements etc. */
        for (let i = 0; i < this.carAgentsEvents.length; i++) {
            let line = this.carAgentsEvents[i],
                cae = new carAgentEvent(line),
                thiz = this;
            setTimeout(function() {
                if (thiz.running) {
                    thiz.animation.animateCarAgent(cae);
                }
            }, cae.ts - initTimeMs);
        }

        /* animate global (godly) events */
        for (let i = 0; i < this.godlyEvents.length; i++) {
            let line = this.godlyEvents[i],
                s = line.split(';');
            let ts = new Date(s[0].trim()).getTime(),
                routeNodePairStrings = s[1].trim().split(','),
                factor = s[2].trim();
            let thiz = this;
            setTimeout(function() {
                if (thiz.running) {
                    thiz.animation.animateGodlyEvent(routeNodePairStrings, factor);
                }
            }, ts - initTimeMs);
        }
        
        /* animate agent-path INIT and REROUTE */
        for (let i = 0; i < this.plannerAgentPaths.length; i++) {
            let line = this.plannerAgentPaths[i],
                s = line.split(';');
            let ts = new Date(s[0].trim()).getTime(),
                agentId = s[2].trim();
            let thiz = this;
            setTimeout(function() {
                if (thiz.running) {
                    thiz.animation.animateAgentPath(agentId, ts);
                }
            }, ts - initTimeMs);
        }                
    }

    stop() {
        this.animation.purgeAllAnimation();
        this.running = false;
    }
}


let drawGraph = function() {
    $('[data-toggle="tooltip"]').tooltip('hide');
    document.getElementById('chart').innerHTML = '';
    $('#btnRun').prop('disabled', true);

    let w = $('#chart').width(),
        h = w/2;
    
    let svg = d3.select("#chart")
      .append("svg:svg")
        .attr("width", $('#chart').width())
        .attr("height", $('#chart').width()/2);
    SVG = svg;
    let loading = svg.append("text")
        .attr("dx", w/2+"px")
        .attr("dy", h/2+"px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", 32)
        .attr("font-weight", "bold")
        .text("Expanding network. One moment please…");
    
    $.get('http://localhost:3000/api/graph', function(res) {
        let graph = res.payload;
    
        let links = svg.selectAll("line.link")
            .data(graph.links)
          .enter().append("svg:line")
            .attr('id', function(d) { return 'line-'+d.source+'-'+d.target; })
            .attr('title', function(d) { return d.value; })
            .attr('data-toggle', 'tooltip')
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        let radius = 5,
            nodes = svg.selectAll("g.node")
            .data(graph.nodes)
          .enter().append("svg:g")
            .attr("class", "node")
            .on('mouseover', function(d,i) {
                $("#circle"+i).attr({      // jQuery, as d3 wouldn't work properly
                    fill: "grey",
                    r: radius * 1.5
                });
            })
            .on('mouseout', function(d, i) {
                $("#circle"+i).attr({
                    fill: "black",
                    r: radius
                });
            })
          .append("svg:circle")
            .attr('id', function(d) { return 'circle'+d.id; })
            .attr("r", radius)
            .attr('title', function(d) { return d.id; })
            .attr('data-toggle', 'tooltip');        
    
        let sim = d3.forceSimulation(graph.nodes)
            .force("charge", d3.forceManyBody().strength(-100))
            .force("link", d3.forceLink(graph.links)
                             .distance(function(d) {return d.value;})
                             .strength(.1))
            .force("center", d3.forceCenter(w/2,h/2))
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
        
        let counter = 0;
        sim.on("tick", function() {
            links.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
    
            if (counter > MAX_TICKS) {
                loading.remove();
                nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
                sim.stop()
                $('[data-toggle="tooltip"]').tooltip();
                $('#btnRun').prop('disabled', false);
            }
            counter++;
        });
    });
}

let toggleNodeIdTexts = function() {
    let texts = svg.selectAll("g.node")
        .data(graph.nodes)
      .enter()
        .append('text')
        .attr('dx', 42)
        .attr('dy', 42)
        .text(function(d) { return d.id; });
}




let updateGraph = function() {
    let newActive = $('#activeGraph').val();
    $.ajax({
        url: '/api/graph/setActive/'+newActive,
        type: 'PUT',
        success: function(res) {
            toastr.info(res.msg);
            drawGraph();
            $('#simulationRun').val("None");
            toggleEnabledRunOpts(newActive);
            loadLogs();
        }
    });
};
let toggleEnabledRunOpts = function(activeGraph) {
    $('#simulationRun').children().prop('disabled', function() {
        let allowedGraphName = $(this).attr('data-graph');
        return allowedGraphName !== undefined && allowedGraphName !== activeGraph;
    });
};

var retrievedLogs = [];
let loadLogs = function() {
    $('#carAgentsDOTlog').val('');
    $('#plannerAgentDOTlog').val('');
    $('#eventsDOTlog').val('');
    retrievedLogs = [];

    let selectedSim = $('#simulationRun').val();    // selectedSimi <==> logId
    if (selectedSim !== "None") {   
        $.get('http://localhost:3000/api/logs/'+selectedSim, function(res) {
            let logs = res.payload;

            if (logs.length === 0) { console.error('ERROR: loadLogs did not retrieve actual logs !!'); }  // shouldn't happen
            logs.forEach(function(log) {
                $(`#${log['type'].replace('.','DOT')}`).val(log['lines'].join('\n'));
            });

            retrievedLogs = logs;
            toastr.info(`Logs loaded for simulation <${selectedSim}>`);
        });
    }
};
let runSimulation = function() {
    let selectedSim = $('#simulationRun').val();
    if (selectedSim === "None") {
        toastr.warning("Please select a Simulatin-run to start.");
    } else {
        $('select').prop('disabled', true);
        $('#btnRun').prop('disabled', true);
        $('#btnStop').prop('disabled', false);

        simulation = new Simulation(retrievedLogs);
        simulation.start();

        toastr.success(`Starting Simulation <${selectedSim}>`);
        
        analyzer = new Analyzer(retrievedLogs);
        analyzer.start();
    }
};
let stopSimulation = function() {
    $('select').prop('disabled', false);
    $('#btnRun').prop('disabled', false);
    $('#btnStop').prop('disabled', true);

    simulation.stop();

    toastr.error(`Simulation <${$('#simulationRun').val()}> stopped.`);
};

$(document).ready(function() {
    drawGraph();
    toggleEnabledRunOpts(0);
});