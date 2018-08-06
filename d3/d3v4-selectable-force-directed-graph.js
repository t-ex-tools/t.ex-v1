var favSetting = false;
checkFavSetting();
setTimeout(checkFavSetting, 2500);

function checkFavSetting() {
  setTimeout(checkFavSetting, 2500);

  chrome.storage.local.get("settingsFavicon", function(result) {
    if (result.hasOwnProperty("settingsFavicon")) {
      favSetting = result.settingsFavicon;
    }
  });
}

function createV4SelectableForceDirectedGraph(svg, graph) {
  // if both d3v3 and d3v4 are loaded, we"ll assume
  // that d3v4 is called d3v4, otherwise we"ll assume
  // that d3v4 is the default (d3)
  if (typeof d3v4 == "undefined")
  d3v4 = d3;

  let parentWidth = d3v4.select("svg").node().parentNode.clientWidth;
  let parentHeight = d3v4.select("svg").node().parentNode.clientHeight;

  var svg = d3v4.select("svg")
  .attr("width", parentWidth)
  .attr("height", parentHeight)

  // remove any previous graphs
  svg.selectAll(".g-main").remove();

  var gMain = svg.append("g")
  .classed("g-main", true);

  rect = gMain.append("rect")
  .attr("id", "canvas-background")
  .attr("width", parentWidth)
  .attr("height", parentHeight)
  .style("fill", "white")

  var gDraw = gMain.append("g");

  var zoom = d3v4.zoom()
  .on("zoom", zoomed)

  gMain.call(zoom).on("dblclick.zoom", null);

  function zoomed() {
    gDraw.attr("transform", d3v4.event.transform);
  }

  var color = d3v4.scaleOrdinal(d3v4.schemeCategory20);

  if (! ("links" in graph)) {
    console.log("Graph is missing links");
    return;
  }

  var nodes = {};
  for (var i=0; i < graph.nodes.length; i++) {
    nodes[graph.nodes[i].id] = graph.nodes[i];
    graph.nodes[i].weight = 1.01;
  }

  // the brush needs to go before the nodes so that it doesn"t
  // get called when the mouse is over a node
  var gBrushHolder = gDraw.append("g");
  var gBrush = null;

  var link = gDraw.append("g")
  .attr("class", "link")
  .selectAll("line")
  .data(graph.links)
  .enter().append("line")
  .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
  .attr("stroke", "grey")
  .attr("opacity", 0.6);

  var node = gDraw.append("g")
  .attr("class", "node")
  .selectAll("g")
  .data(graph.nodes)
  .enter()
  .append("g")
  .attr("class", "node-container")
  /*
  .call(d3v4.drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended))
  */

  node
  .append("circle")
  .attr("fill", function(d) { return colorScheme(d); })
  .attr("r", defaultRadius)
  .append("title")
  .text(function(d) {
    if ("name" in d)
    return d.name;
    else
    return d.id;
  });

  if (!favSetting) {
		node.append("image")
		.attr("xlink:href", function(d) {
			return "../images/" + domainName(d.name) + ".png";
		})
		.on("error", function(d) {
			d3.selectAll("g.node-container")
			.filter(function(e) {
				return e.name === d.name;
			})
			.select("image")
			.attr("xlink:href", "../images/1rx.io.png");
		})
		.attr("x", -8)
		.attr("y", -8)
		.attr("width", 16)
		.attr("height", 16);
	} else {
		node.append("image")
		.attr("xlink:href", function(d) {
			var dName = domainName(d.name);
			chrome.storage.local.get(dName, function(tNode, result) {
				if (result.hasOwnProperty(dName)) {
					d3.select(tNode).attr("xlink:href", result[dName]);
				} else {
					var xhr = new XMLHttpRequest();
					xhr.responseType = "blob";
					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4) {
							var obj = {};
							var reader = new FileReader();
							reader.readAsDataURL(xhr.response);
							reader.onloadend = function() {
								obj[dName] = reader.result;
								d3.select(tNode).attr("xlink:href", reader.result);
								chrome.storage.local.set(obj, function() {});
							};
						}
					}
					xhr.open("GET", "https://s2.googleusercontent.com/s2/favicons?domain_url=" + domainName(d.name), true);
					xhr.send();
				}
			}.bind(null, this));
		})
		.attr("x", -8)
		.attr("y", -8)
		.attr("width", 16)
		.attr("height", 16);
	}

  node.append("text")
  .attr("id", function(d) {
    return "text-" + d.name;
  })
  .attr("class", "node-label")
  .attr("dx", 16)
  .attr("dy", ".35em")
  .attr("stroke", "white")
  .attr("stroke-width", 0.3)
  .attr("style", "display: none; font-weight: 800; font-size: 12pt")
  .text(function(d) { return d.name });

  var selection = null;

  rect.on("click.a", function() {
    node.each(function(d) {
      d.selected = false;
      d.previouslySelected = false;
      deselectNodes();
    });
    selection = null;
  });

  node.on("click.a", function(d) {
    if (selection !== null)
      showLabel(selection, false);

    deselectNodes();
    if (selection === d) {
      selection = null;
    } else {
      showLabel(d, true);
      selectNode(d);
      selection = d;
    }
  });

  node.on("mouseover", function(d) {
    showLabel(d, true);

    if (selection != null)
    return;

    selectNode(d);
  });

  node.on("mouseout", function(d) {
    if (selection !== d)
      showLabel(d, false);
    if (selection != null)
      return;

    deselectNodes();
  });

  function showLabel(d, flag) {
    var id = "text-" + d.name;
    var label = document.getElementById(id);
    label.style.display = (flag) ? "block" : "none";

    var d3Label = d3v4.selectAll("g.node-container").filter(function(d) {
      return this.childNodes[2].id === id;
    })
    d3Label.raise();
  }

  function selectNode(d) {
    d3v4.selectAll("circle").filter(function(n) {
        return d.id === n.id;
      }
    ).classed("selected", true);

    link.each(function(l) {
      var neighbor = null;

      if (l.source.id === d.id) {
        neighbor = l.target;
      } else if (l.target.id == d.id) {
        neighbor = l.source;
      }

      if (neighbor === null) {
        return;
      }

      d3v4.selectAll("circle").select(function(c, i) {
        if (neighbor.id === c.id) {
          d3v4.select(this).classed("selected", true);
        }
      });

    });

    link.attr("stroke", function(l) {
      if (d === l.source || d === l.target) {
        return "orange";
      } else {
        return "grey";
      }
    });
  }

  function deselectNodes() {
    d3v4.selectAll("circle").each(function(c, i) {
      d3v4.select(this).classed("selected", false)
    });
    d3v4.selectAll("text").each(function(c, i) {
      d3v4.select(this).attr("fill", "black")
    });

    link.attr("stroke", "grey");
    link.attr("stroke-width", 1);
  }

  var simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink().id(function(d) { return d.index }).distance(100 * linkDistance))
    .force("collide",d3.forceCollide(function(d) { return 20; }).iterations(1))
    .force("charge", d3.forceManyBody().strength(parentWidth * nodeCharge))
    .force("center", d3.forceCenter(parentWidth / 2, parentHeight / 2))
    .force("y", d3.forceY(0))
    .force("x", d3.forceX(0))

  simulation.nodes(graph.nodes).on("tick", ticked);
  // simulation.nodes(graph.nodes).on("end", ticked);
  simulation.force("link").links(graph.links);

  function ticked() {
    link.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});
  }

  var texts = [""];

  svg.selectAll("text")
    .data(texts)
    .enter()
    .append("text")
    .attr("x", 900)
    .attr("y", function(d,i) { return 470 + i * 18; })
    .text(function(d) { return d; });

  return svg;
};
