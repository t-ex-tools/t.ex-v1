var parent = document.getElementById("network");
parent.style.width = window.innerWidth;
parent.style.height = window.innerHeight;

function renderGraph(limit, privateKey, callback) {
  var crypt = new JSEncrypt({ default_key_size: 2048 });
  var encAesKey = null;
  var decAesKey = null;

  chrome.storage.local.get("lastId", function (result) {
    if (!result.hasOwnProperty("lastId")) {
      return;
    }
    crypt.setPrivateKey(privateKey);
    getChunks(result.lastId, [], limit, function (requests) {
      drawGraph(requests, callback);
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
}

function drawGraph(requests, callback) {  
  data = requests2graph(requests);  

  console.log("Total number of nodes is " + nodes.length);
  console.log("Total number of edges is " + edges.length);
  
  graph = createV4SelectableForceDirectedGraph(d3.select("#network"), data);
  document.getElementById("time-loading-indicator").style.visibility = "hidden";
  callback();

  graph.selectAll("rect").on("click.b", function (node) {
    selection = null;
  });
  graph.selectAll("g.node-container").on("click.b", function (node) {
    if (selection === node) {
      selection = null;
    } else {
      selection = node;
    }
  });
  graph.selectAll("g.node-container").on("dblclick", function (node) {
    chrome.tabs.create({ url: node.href });
  });

  console.log("Graph transformed after " + (Date.now() - start) / 1000 + "s");
}

function requests2graph(requests) {
  var oldLength = globalRequests.length;
  globalRequests = globalRequests.concat(requests);

  for (var i = oldLength; i < globalRequests.length; i++) {

    if (typeof requests[i] === "undefined" || (requests[i].hasOwnProperty("completed") && !requests[i].completed)) {
      continue;
    }

    var targetHash = hashCode(domainName(requests[i].hostname));
    var index = null;
    requests[i].id = i; //TODO: 
    if ((index = nodesHashes.indexOf(targetHash)) === -1) {
      var target = {
        name: domainName(requests[i].hostname),
        group: (requests[i].sourceUrl === null) ? 1 : 2,
        href: requests[i].href,
        "requests": [i]
      };
      target.id = nodes.length;
      nodes.push(target);
      nodesHashes.push(targetHash);
    } else {
      nodes[index].requests.push(i);
      if (requests[i].sourceUrl === null) {
        nodes[index].group = 1;
      }
    }

    if (requests[i].requestType === "main_frame") {
      if (browsingHistory.indexOf(requests[i].href) === -1) {
        browsingHistory.push(requests[i].href);
      }
    }

    if (typeof requests[i].sourceUrl === "undefined" ||
      requests[i].sourceUrl === null) {
      continue;
    }

    var sourceHash = hashCode(domainName(requests[i].sourceUrl.hostname));
    if ((index = nodesHashes.indexOf(sourceHash)) === -1) {
      var source = {
        name: requests[i].sourceUrl.hostname,
        group: 1,
        href: requests[i].sourceUrl.href,
        "requests": []
      };
      source.id = nodes.length;
      nodes.push(source);
      nodesHashes.push(sourceHash);
    }
    if ((index = edgesHashes.indexOf(sourceHash + targetHash)) === -1) {
      var edge = {
        source: nodesHashes.indexOf(sourceHash),
        target: nodesHashes.indexOf(targetHash),
        value: 1
      };
      edges.push(edge);
      edgesHashes.push(sourceHash + targetHash);
    } else {
      // TODO: maybe think about highlighting higher frequented edges
      // edges[index].value += 1;
    }
  }

  return {
    nodes: nodes,
    links: edges
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  //TODO: looks good, doesn't work
  if (message.hasOwnProperty("requests")) {
    var data = requests2graph(message.requests);
    if (graph !== null) {
      console.log("ready to update");
      graph.selectAll("circle").data(data.nodes);
      graph.selectAll("line").data(data.links);  
    }
  }
});
