var InfoOverlay = {
  infoComponentContainer: null,
  infoCard: null,
  infoNeighbors: null,  
  collapsible: null,
  showAllBtn: null,
  showAggDataBtn: null,

  load: function() {

    // initialize elements
    InfoOverlay.infoComponentContainer = document.getElementById("info");
    InfoOverlay.infoCard = document.getElementById("info-card");
    InfoOverlay.infoNeighbors = document.getElementById("info-neighbors");
    InfoOverlay.collapsible = new M.Collapsible(document.getElementById("info-neighbors"), {
      onOpenEnd: function() {
        if (InfoOverlay.infoCard.offsetHeight > InfoOverlay.infoComponentContainer.offsetHeight) {
          InfoOverlay.infoComponentContainer.style.height = "95%";
          InfoOverlay.infoCard.style.height = "95%";
        }
      },
      onCloseEnd: function() {
        InfoOverlay.infoComponentContainer.style.height = "auto";
        InfoOverlay.infoCard.style.height = "auto";
      }
    });
    InfoOverlay.showAllBtn = document.getElementById("show-all-button");
    InfoOverlay.showAggDataBtn = document.getElementById("show-agg-data");

    // handlers
    graph.selectAll("g.node-container").on("click.c", function(node) {
      if (Bootstrap.selection === node) {
        InfoOverlay.infoComponentContainer.style.display = "none";
        InfoOverlay.collapsible.close(0);
        InfoOverlay.collapsible.close(1);
      } else {
        InfoOverlay.infoComponentContainer.style.display = "block";
      }
      InfoOverlay.renderInfo(node);
    });
  
    d3v4.select("#canvas-background").on("click.h", function() {
      InfoOverlay.infoComponentContainer.style.display = "none";
      InfoOverlay.collapsible.close(0);
      InfoOverlay.collapsible.close(1);
    });
  
    InfoOverlay.showAllBtn.addEventListener("click", function(e) {
      if (Bootstrap.selection == null) {
        return;
      }
  
      var windowStart = Bootstrap.selection.requests.length - maxNumRequests;
      if (windowStart < 0) {
        windowStart = 0;
        RequestsModal.requestsMoreBtn.classList.add("disabled");
      }
      RequestsModal.requestsBackBtn.classList.add("disabled");
  
      // TODO: this is very costly
      Bootstrap.selection.requests
        .sort(function(a, b) {
          return Bootstrap.globalRequests[a].time - Bootstrap.globalRequests[b].time;
        });
      RequestsModal.allItems = Bootstrap.selection.requests;
  
      var items = RequestsModal.allItems.slice(windowStart, Bootstrap.selection.requests.length)
        .map(function(index) {
          return {
            id: Bootstrap.globalRequests[index].id,
            content: Bootstrap.globalRequests[index].pathname,
            start: new Date(Bootstrap.globalRequests[index].time),
          };
        });
      RequestsModal.timeline.setOptions({
        min: new Date(items[0].start.getTime() - 43200000),
        max: new Date(items[items.length-1].start.getTime() + 43200000)
      })
      RequestsModal.timeline.setItems(items);
  
      setTimeout(function() {
        RequestsModal.timelineContainer.style.height = "100%";
        RequestsModal.timeline.fit();
      }, 1000)
    });

    InfoOverlay.showAggDataBtn.addEventListener("click", function(r) {
      if (Bootstrap.selection == null) {
        return;
      }
  
      AggregatedDataModal.aggDataContainer.innerHTML = "";
      AggregatedDataModal.aggDataContainer.appendChild(AggregatedDataModal.renderAggData(AggregatedDataModal.reducedRequests));
    });
  },

  showInfoToNode: function(node) {
    InfoOverlay.infoComponentContainer.style.display = "block";
    InfoOverlay.renderInfo(node);
  },

  renderInfo: function(node) {
    var url = InfoOverlay.url2json(new URL(node.href));
    var nodeName = document.getElementById("info-node-name");
    nodeName.href = url["protocol"] + "//" + Bootstrap.domainName(url["hostname"]);
    nodeName.title = nodeName.href;
    nodeName.innerHTML = Bootstrap.domainName(url["hostname"]);
  
    var nodeWhois = document.getElementById("info-node-whois");
    nodeWhois.href = "https://www.whois.com/whois/" + url["hostname"];
    nodeWhois.title = nodeWhois.href;
  
    var numReq = document.getElementById("info-num-req");
    numReq.innerHTML = node.requests.length;
  
    var neighbors = Bootstrap.edges.filter(function(edge) {
      return (node.id === edge.source.id || node.id === edge.target.id);
    });
  
    var nodeSentDataTo = neighbors
      .filter(function(edge) { return (node.id === edge.source.id); })
      .map(function(edge) {
        var neighborsRequests = Bootstrap.nodes[edge.target.index].requests.filter(function(reqId) {
          if (typeof Bootstrap.globalRequests[reqId].sourceUrl === "undefined" ||
              Bootstrap.globalRequests[reqId].sourceUrl === null) {
                return false;
          } else {
            var hash = Bootstrap.hashCode(Bootstrap.domainName(Bootstrap.globalRequests[reqId].sourceUrl.hostname));
            var index = Bootstrap.nodesHashes.indexOf(hash);
            return Bootstrap.nodes[index].id === node.id;
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
          if (typeof Bootstrap.globalRequests[reqId].sourceUrl === "undefined" ||
              Bootstrap.globalRequests[reqId].sourceUrl === null) {
                return false;
          } else {
            var hash = Bootstrap.hashCode(Bootstrap.domainName(Bootstrap.globalRequests[reqId].sourceUrl.hostname));
            var index = Bootstrap.nodesHashes.indexOf(hash);
            return Bootstrap.nodes[index].id === edge.source.id;
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
        link.innerHTML = Bootstrap.domainName(n.name);
        InfoOverlay.initInteraction(link, n);
  
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
        InfoOverlay.collapsible.close(0);
        InfoOverlay.collapsible.close(1);
      });
  
    nodeRetrievedDataFrom
      .map(function(n) {
        var link = document.createElement("a");
        link.className = "collection-item modal-trigger";
        link.href = "#requests";
        // link.href = "http://" + n;
        link.title = link.href;
        // link.target = "_blank";
        link.innerHTML = Bootstrap.domainName(n.name);
        InfoOverlay.initInteraction(link, n);
  
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
        InfoOverlay.collapsible.close(0);
        InfoOverlay.collapsible.close(1);
      });
  },

  initInteraction: function(link, n) {
    link.addEventListener("mouseover", function(domain, evt) {
      InfoOverlay.highlightNodeOnHover(domain, true);
    }.bind(null, Bootstrap.domainName(n.name)));
  
    link.addEventListener("mouseout", function(domain, evt) {
      InfoOverlay.highlightNodeOnHover(domain, false);
    }.bind(null, Bootstrap.domainName(n.name)));
  
    link.addEventListener("click", function(neighbor, evt) {
      neighbor.requests.sort(function(a, b) {
        return Bootstrap.globalRequests[a].time - Bootstrap.globalRequests[b].time;
      });
      RequestsModal.timeline.setItems(neighbor.requests.map(function(index) {
        return {
          id: Bootstrap.globalRequests[index].id,
          content: Bootstrap.globalRequests[index].pathname,
          start: new Date(Bootstrap.globalRequests[index].time),
        };
      }));
      RequestsModal.timeline.fit();
      graph.selectAll("g.node-container").filter(function(d) {
        return Bootstrap.domainName(d.name) === Bootstrap.domainName(neighbor.name);
      }).each(function(d) {
        // this.dispatchEvent(new Event("click"));
        InfoOverlay.highlightNodeOnHover(Bootstrap.domainName(neighbor.name), false);
      });
    }.bind(null, n));
  },

  highlightNodeOnHover: function(domain, flag) {
    graph.selectAll("g.node-container").filter(function(d) {
      return d.name === domain;
    }).each(function(d) {
      d3v4.select(this).select("circle").classed("search-result-highlighted", flag);
    });
  },

  url2json: function(l) {
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
  },

}