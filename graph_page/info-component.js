var infoComponentContainer = null;
var infoCard = null;
var infoNeighbors = null;
var collapsible = new M.Collapsible(document.getElementById("info-neighbors"), {
  onOpenEnd: function() {
    if (infoCard.offsetHeight > infoComponentContainer.offsetHeight) {
      infoComponentContainer.style.height = "95%";
      infoCard.style.height = "95%";
    }
  },
  onCloseEnd: function() {
    infoComponentContainer.style.height = "auto";
    infoCard.style.height = "auto";
  }
});

function initInfoComponent() {
  infoComponentContainer = document.getElementById("info");
  infoCard = document.getElementById("info-card");
  infoNeighbors = document.getElementById("info-neighbors");

  graph.selectAll("g.node-container").on("click.c", function(node) {
    if (selection === node) {
      infoComponentContainer.style.display = "none";
      collapsible.close(0);
      collapsible.close(1);
    } else {
      infoComponentContainer.style.display = "block";
    }
    renderInfo(node);
  });

  d3v4.select("#canvas-background").on("click.h", function() {
    infoComponentContainer.style.display = "none";
    collapsible.close(0);
    collapsible.close(1);
  });
}

function showInfoToNode(node) {
  infoComponentContainer.style.display = "block";
  renderInfo(node);
}

function renderInfo(node) {
  var url = url2json(new URL(node.href));
  var nodeName = document.getElementById("info-node-name");
  nodeName.href = url["protocol"] + "//" + domainName(url["hostname"]);
  nodeName.title = nodeName.href;
  nodeName.innerHTML = domainName(url["hostname"]);

  var nodeWhois = document.getElementById("info-node-whois");
  nodeWhois.href = "https://www.whois.com/whois/" + url["hostname"];
  nodeWhois.title = nodeWhois.href;

  var numReq = document.getElementById("info-num-req");
  numReq.innerHTML = node.requests.length;

  var neighbors = edges.filter(function(edge) {
    return (node.id === edge.source.id || node.id === edge.target.id);
  });

  var nodeSentDataTo = neighbors
    .filter(function(edge) { return (node.id === edge.source.id); })
    .map(function(edge) {
      var neighborsRequests = nodes[edge.target.index].requests.filter(function(reqId) {
        if (typeof globalRequests[reqId].sourceUrl === "undefined" ||
            globalRequests[reqId].sourceUrl === null) {
              return false;
        } else {
					var hash = hashCode(domainName(globalRequests[reqId].sourceUrl.hostname));
					var index = nodesHashes.indexOf(hash);
					return nodes[index].id === node.id;
        }
      });
      return {
				name: edge.target.name,
				requests: neighborsRequests
			};
    });
  var nodeRetrievedDataFrom = neighbors
    .filter(function(edge) { return (node.id === edge.target.id); })
    .map(function(edge) {
			var neighborsRequests = edge.target.requests.filter(function(reqId) {
        if (typeof globalRequests[reqId].sourceUrl === "undefined" ||
            globalRequests[reqId].sourceUrl === null) {
              return false;
        } else {
		      var hash = hashCode(domainName(globalRequests[reqId].sourceUrl.hostname));
			    var index = nodesHashes.indexOf(hash);
			    return nodes[index].id === edge.source.id;
        }
			});
			return {
				name: edge.source.name,
				requests: neighborsRequests
			};
		});

  var sentToNum = document.getElementById("sent-to-num");
  sentToNum.innerHTML = "This page sent data to the&nbsp;<b>" + nodeSentDataTo.length + "</b>&nbsp;page(s).";

  var retrievedFromNum = document.getElementById("retrieved-from-num");
  retrievedFromNum.innerHTML = "This page retrieved data from the&nbsp;<b>" + nodeRetrievedDataFrom.length + "</b>&nbsp;page(s)."

  var infoSentTo = document.getElementById("info-sent-to");
  var infoRetrievedFrom = document.getElementById("info-retrieved-from");
  infoSentTo.innerHTML = "";
  infoRetrievedFrom.innerHTML = "";

  nodeSentDataTo
    .map(function(n) {
      var link = document.createElement("a");
      link.className = "collection-item modal-trigger";
      link.href = "#requests";
      // link.href = "http://" + n;
      link.title = link.href;
      // link.target = "_blank";
      link.innerHTML = domainName(n.name);
      initInteraction(link, n);

      var whoisLink = document.createElement("a");
      whoisLink.className = "secondary-content";
      whoisLink.href = "https://www.whois.com/whois/" + n.name;
      whoisLink.title = whoisLink.href;
      whoisLink.target = "_blank";
      whoisLink.innerHTML = "[?]";

      link.appendChild(whoisLink);

      return link;
    }).forEach(function(e) {
      infoSentTo.appendChild(e);
      collapsible.close(0);
      collapsible.close(1);
    });

  nodeRetrievedDataFrom
    .map(function(n) {
      var link = document.createElement("a");
      link.className = "collection-item modal-trigger";
      link.href = "#requests";
      // link.href = "http://" + n;
      link.title = link.href;
      // link.target = "_blank";
      link.innerHTML = domainName(n.name);
      initInteraction(link, n);

      var whoisLink = document.createElement("a");
      whoisLink.className = "secondary-content";
      whoisLink.href = "https://www.whois.com/whois/" + n.name;
      whoisLink.title = whoisLink.href;
      whoisLink.target = "_blank";
      whoisLink.innerHTML = "[?]";

      link.appendChild(whoisLink);

      return link;
    }).forEach(function(e) {
      infoRetrievedFrom.appendChild(e);
      collapsible.close(0);
      collapsible.close(1);
    });
}

function initInteraction(link, n) {

  link.addEventListener("mouseover", function(domain, evt) {
    highlightNodeOnHover(domain, true);
  }.bind(null, domainName(n.name)));

  link.addEventListener("mouseout", function(domain, evt) {
    highlightNodeOnHover(domain, false);
  }.bind(null, domainName(n.name)));

  link.addEventListener("click", function(neighbor, evt) {
		neighbor.requests.sort(function(a, b) {
			return globalRequests[a].time - globalRequests[b].time;
		});
		timeline.setItems(neighbor.requests.map(function(index) {
			return {
				id: globalRequests[index].id,
				content: globalRequests[index].pathname,
				start: new Date(globalRequests[index].time),
			};
		}));
		timeline.fit();
    graph.selectAll("g.node-container").filter(function(d) {
      return domainName(d.name) === domainName(neighbor.name);
    }).each(function(d) {
      // this.dispatchEvent(new Event("click"));
      highlightNodeOnHover(domainName(neighbor.name), false);
    });
  }.bind(null, n));
}

function highlightNodeOnHover(domain, flag) {
  graph.selectAll("g.node-container").filter(function(d) {
    return d.name === domain;
  }).each(function(d) {
    d3v4.select(this).select("circle").classed("search-result-highlighted", flag);
  });
}

function url2json(l) {
  var r = {};
  l.parsedParams = {};
  l.time = Date.now();
  for (var pair of l.searchParams.entries()) {
    l.parsedParams[pair[0]] = pair[1];
  }
  for (key in l) {
    r[key] = l[key];
  }
  return r;
}
