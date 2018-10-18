let MAX_TICKS = 63;


let drawGraph = function() {
    document.getElementById('chart').innerHTML = '';

    let w = $('#chart').width(),
        h = w/2;
        // fill = d3.schemeCategory10;
    
    let svg = d3.select("#chart")
      .append("svg:svg")
        .attr("width", $('#chart').width())
        .attr("height", $('#chart').width()/2)
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
            }
            )
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
            }
            counter++;
        });
    });
}

let toggleNodeIdTexts = function() {
    // let texts = svg.selectAll("g.node")
    //     .data(graph.nodes)
    //   .enter()
    //     .append('text')
    //     .attr('dx', 42)
    //     .attr('dy', 42)
    //     .text(function(d) { return d.id; });

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
        }
    });
};
let toggleEnabledRunOpts = function(activeGraph) {
    $('#simulationRun').children().prop('disabled', function() {
        let allowedGraphIdx = parseInt($(this).attr('data-graph'));
        return !isNaN(allowedGraphIdx) && allowedGraphIdx !== parseInt(activeGraph);
    });
};

let runSimulation = function() {
    let selectedSim = $('#simulationRun').val();
    if (selectedSim === "None") {
        toastr.warning("Please select a Simulatin-run to start.");
    } else {
        // TODO: run simulation, visu in d3 / jQuery

        toastr.success(`Starting Simulation <${selectedSim}>`);
    }
};

$(document).ready(function() {
    drawGraph();
    toggleEnabledRunOpts(0);
});