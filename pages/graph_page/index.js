var GraphPage = {
  parent: null,

  load: function() {
    GraphPage.parent = document.getElementById("network");
    GraphPage.parent.style.width = window.innerWidth;
    GraphPage.parent.style.height = window.innerHeight;

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      //TODO: looks good, doesn't work
      if (message.hasOwnProperty("requests")) {
        var data = GraphPage.requests2graph(message.requests);
        if (graph !== null) {
          // console.log("ready to update");
          graph.selectAll("circle").data(data.nodes);
          graph.selectAll("line").data(data.links);  
        }
      }
    });    
  },

  renderGraph: function(limit, privateKey, callback) {
    var crypt = new JSEncrypt({ default_key_size: 2048 });
    var encAesKey = null;
    var decAesKey = null;
  
    chrome.storage.local.get("lastId", function (result) {
      if (!result.hasOwnProperty("lastId")) {
        return;
      }
      crypt.setPrivateKey(privateKey);
      getChunks(result.lastId, [], limit, function (requests) {
        GraphPage.drawGraph(requests, callback);
      });
    });
  
    function getChunks(id, requests, limit, callback) {
      chrome.storage.local.get(id + "", function (chunk) {
        if (chunk[id].lastId == null || (Number.parseInt(chunk[id].lastId) < (Date.now() - limit))) {
          callback(requests.concat(decryptChunk(chunk[id])));
        } else {
          return getChunks(chunk[id].lastId, requests.concat(decryptChunk(chunk[id])), limit, callback)
        }
      });
    }
  
    function decryptChunk(chunk) {
      if (encAesKey === null || encAesKey !== chunk.aesKey) {
        encAesKey = chunk.aesKey;
        decAesKey = crypt.decrypt(chunk.aesKey);
      }
      if (decAesKey == null)
        return;
      var reqs = sjcl.decrypt(decAesKey, chunk.requests);
      return JSON.parse(reqs);
    }
  },

  drawGraph: function(requests, callback) {
    data = GraphPage.requests2graph(requests);  

    console.log("Total number of nodes is " + Bootstrap.nodes.length);
    console.log("Total number of edges is " + Bootstrap.edges.length);
    
    graph = createV4SelectableForceDirectedGraph(d3.select("#network"), data);
    document.getElementById("time-loading-indicator").style.visibility = "hidden";
    callback();
  
    graph.selectAll("rect").on("click.b", function (node) {
      Bootstrap.selection = null;
    });
    graph.selectAll("g.node-container").on("click.b", function (node) {
      if (Bootstrap.selection === node) {
        Bootstrap.selection = null;
      } else {
        Bootstrap.selection = node;
      }
    });
    graph.selectAll("g.node-container").on("dblclick", function (node) {
      chrome.tabs.create({ url: node.href });
    });
  
    console.log("Graph transformed after " + (Date.now() - Bootstrap.start) / 1000 + "s");    
  },

  requests2graph: function(requests) {
    var oldLength = Bootstrap.globalRequests.length;
    Bootstrap.globalRequests = Bootstrap.globalRequests.concat(requests);
  
    for (var i = oldLength; i < Bootstrap.globalRequests.length; i++) {
  
      if (typeof requests[i] === "undefined" || (requests[i].hasOwnProperty("completed") && !requests[i].completed)) {
        continue;
      }
  
      var targetHash = Bootstrap.hashCode(Bootstrap.domainName(requests[i].hostname));
      var index = null;
      requests[i].id = i; //TODO: 
      if ((index = Bootstrap.nodesHashes.indexOf(targetHash)) === -1) {
        var target = {
          name: Bootstrap.domainName(requests[i].hostname),
          group: (requests[i].sourceUrl === null) ? 1 : 2,
          href: requests[i].href,
          "requests": [i]
        };
        target.id = Bootstrap.nodes.length;
        Bootstrap.nodes.push(target);
        Bootstrap.nodesHashes.push(targetHash);
      } else {
        Bootstrap.nodes[index].requests.push(i);
        if (requests[i].sourceUrl === null) {
          Bootstrap.nodes[index].group = 1;
        }
      }
  
      if (requests[i].requestType === "main_frame") {
        if (Bootstrap.browsingHistory.indexOf(requests[i].href) === -1) {
          Bootstrap.browsingHistory.push(requests[i].href);
        }
      }
  
      if (typeof requests[i].sourceUrl === "undefined" ||
        requests[i].sourceUrl === null) {
        continue;
      }
  
      var sourceHash = Bootstrap.hashCode(Bootstrap.domainName(requests[i].sourceUrl.hostname));
      if ((index = Bootstrap.nodesHashes.indexOf(sourceHash)) === -1) {
        var source = {
          name: requests[i].sourceUrl.hostname,
          group: 1,
          href: requests[i].sourceUrl.href,
          "requests": []
        };
        source.id = Bootstrap.nodes.length;
        Bootstrap.nodes.push(source);
        Bootstrap.nodesHashes.push(sourceHash);
      }
      if ((index = Bootstrap.edgesHashes.indexOf(sourceHash + targetHash)) === -1) {
        var edge = {
          source: Bootstrap.nodesHashes.indexOf(sourceHash),
          target: Bootstrap.nodesHashes.indexOf(targetHash),
          value: 1
        };
        Bootstrap.edges.push(edge);
        Bootstrap.edgesHashes.push(sourceHash + targetHash);
      } else {
        // TODO: maybe think about highlighting higher frequented edges
        // edges[index].value += 1;
      }
    }
  
    return {
      nodes: Bootstrap.nodes,
      links: Bootstrap.edges
    }
  },

  resetGraph: function() {
    Bootstrap.globalRequests = [];
    Bootstrap.graph = null;
    Bootstrap.nodes = [];
    Bootstrap.nodesHashes = [];
    Bootstrap.edges = [];
    Bootstrap.edgesHashes = [];
    Bootstrap.start = Date.now();    
  }
}
