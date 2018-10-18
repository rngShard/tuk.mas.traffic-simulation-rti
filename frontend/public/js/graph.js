let drawGraph = function() {
    document.getElementById('chart').innerHTML = '';
    let MAX_TICKS = 63;

    let w = $('#chart').width(),
        h = w/2;
        // fill = d3.schemeCategory10;
    
    let vis = d3.select("#chart")
      .append("svg:svg")
        .attr("width", $('#chart').width())
        .attr("height", $('#chart').width()/2)
    let loading = vis.append("text")
        .attr("dx", w/2+"px")
        .attr("dy", h/2+"px")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", 32)
        .attr("font-weight", "bold")
        .text("Simulating network. One moment please…");
    
    $.get('http://localhost:3000/api/graph', function(res) {
        graph = res.payload;
    
        let links = vis.selectAll("line.link")
            .data(graph.links)
          .enter().append("svg:line")
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        let nodes = vis.selectAll("g.node")
            .data(graph.nodes)
          .enter().append("svg:g")
            .attr("class", "node");
        nodes.append("svg:circle")
            .attr("r", 5);
    
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
            }
            counter++;
        });
    });
}




let updateGraph = function() {
    let newActive = $('#activeGraph').val();
    $.ajax({
        url: '/api/graph/setActive/'+newActive,
        type: 'PUT',
        success: function(res) {
            toastr.success(res.msg);
            drawGraph();
        }
    });
}

$(document).ready(function() {
    drawGraph();
});