var controlsContainer = null;
var timeLimitationSelectElement = null;
var timeLimitationSelect = null;
var searchField = null;
var searchResetBtn = null;

var searchResultsCard = null;
var searchResultsList = null;
var searchCollapsible = null;
var foundInNum = null;
var foundNodesList = null;
var ctrlKeyDetected = false;

function initControls() {
  controlsContainer = document.getElementById("controls");
  timeLimitationSelectElement = document.getElementById("time-limitation-select");
  timeLimitationSelect = new M.Select(timeLimitationSelectElement, {});
  searchField = document.getElementById("search-field");
  searchResetBtn = document.getElementById("search-reset-btn");

  searchResultsCard = document.getElementById("search-results-card");
  searchResultsList = document.getElementById("search-results-list");
  searchCollapsible = new M.Collapsible(searchResultsList, {
    onOpenEnd: function() {
      if (searchResultsCard.offsetHeight > controlsContainer.offsetHeight) {
        controlsContainer.style.height = "90%";
        searchResultsCard.style.height = "90%";
      }
    }
  });
  foundInNum = document.getElementById("found-in-num");
  foundNodesList = document.getElementById("found-nodes-list");

  searchField.addEventListener("keyup", function (e) {
    event.preventDefault();
    if (e.keyCode === 13) {
      searchFor(this.value);
      toggleSearchResetBtn(true);
    }
    if ((e.keyCode === 91) || (e.keyCode === 18) || (e.keyCode === 17)) {
      ctrlKeyDetected = false;
    }
  });

  searchField.addEventListener("keydown", function (e) {
    if ((e.keyCode === 91) || (e.keyCode === 18) || (e.keyCode === 17)) {
      ctrlKeyDetected = true;
    }
    if ((e.keyCode === 8 || e.keyCode === 46) && ctrlKeyDetected) {
      resetSearch();
    }
  });

  document.getElementById("search-enter-btn").addEventListener("click", function (e) {
    searchFor(searchField.value);
    toggleSearchResetBtn(true);
  });

  document.getElementById("search-reset-btn").addEventListener("click", resetSearch);

  timeLimitationSelectElement.addEventListener("change", function (e) {

    chrome.storage.local.get("privateKey", function(result) {
      if (result.hasOwnProperty("privateKey")) {
        decryptPrivateKey(result.privateKey, function(privateKey) {
          var hours = timeLimitationSelectElement.options[timeLimitationSelectElement.selectedIndex].value;
          var limit = timeLimitationSelectElement.options[timeLimitationSelectElement.selectedIndex].value * 60 * 60 * 1000;
          document.getElementById("time-loading-indicator").style.visibility = "visible";

          graph = null;
          nodes = [];
          edges = [];
          start = Date.now();
          renderGraph(limit, privateKey, function() {
            initInfoComponent();
            initAggDataComponent();
          });
        });
      }
    });
  });
}

function resetSearch() {
  nodes.forEach(function(d) {
    d3v4.select(d3v4.selectAll("circle")["_groups"][0][d.index]).classed("search-result", false);
  });
  searchField.value = "";
  toggleSearchResetBtn(false);
}

function toggleSearchResetBtn(show) {
  searchCollapsible.close(0);
  if (show) {
    searchResetBtn.style.display = "block";
    searchResultsCard.style.display = "block";
    searchCollapsible.open(0);
  } else {
    searchResetBtn.style.display = "none";
    searchResultsCard.style.display = "none";
    controlsContainer.style.height = "auto";
    searchResultsCard.style.height = "auto";
  }
}

function searchFor(keyword) {
  var results = nodes.filter(function(d) {
    d3v4.select(d3v4.selectAll("circle")["_groups"][0][d.index]).classed("search-result", false);
    return (JSON.stringify(d).indexOf(keyword) !== -1);
  }).map(function(d) {
    return findIn(d, keyword);
  }).filter(function(d) {
    if (d.length > 0)
      d3v4.select(d3v4.selectAll("circle")["_groups"][0][d[0].index]).classed("search-result", true);
    return d.length > 0;
  }).sort(function(a, b) {
    return b.length - a.length;
  });

  foundInNum.innerHTML = "Keyword&nbsp;<b>" + keyword + "</b>&nbsp;found in&nbsp;<b>" + results.length + "</b>&nbsp;nodes.";
  foundNodesList.innerHTML = "";

  results
  .map(function(e) {
    var metaFoundIn = [];
    for (var i=0; i < e.length; i++) {
      for (var j=0; j < e[i].foundIn.length; j++) {
        if (metaFoundIn.indexOf(e[i].foundIn[j]) === -1) {
          metaFoundIn.push(e[i].foundIn[j]);
        }
      }
    }
    return {node: e[0].node, foundIn: metaFoundIn, hits: e.length};
  })
  .map(function(e) {
    var link = document.createElement("a");
    link.href = "#";
    link.className = "collection-item search-result-link";
    link.innerHTML = "At&nbsp;<b>" + e.node + "</b>&nbsp;used in&nbsp;<b>" + e.foundIn.toString().replace(/,/g, ", ") + "</b>&nbsp;(<b>" + e.hits + "</b>&nbsp;requests).";
    link.addEventListener("mouseover", function(element, evt) {
      highlightNode(element, true);
    }.bind(null, e));
    link.addEventListener("mouseout", function(element, evt) {
      highlightNode(element, false);
    }.bind(null, e));
    link.addEventListener("click", function(element, evt) {
      var nodeContainer = graph.selectAll("g.node-container").filter(function(d) {
        return d.name === element.node;
      }).each(function(d) {
        this.dispatchEvent(new Event("click"));
      });
    }.bind(null, e));

    return link;
  }).forEach(function(e) {
    foundNodesList.appendChild(e);
  });
}

function highlightNode(element, flag) {
  graph.selectAll("g.node-container").filter(function(d) {
    return d.name === element.node;
  }).each(function(d) {
    d3v4.select(this).select("circle").classed("search-result-highlighted", flag);
  });
}

function findIn(d, keyword) {
  var results = [];

  for (var i=0; i < d.requests.length; i++) {
    var meta = [];
    var toAdd = false;

    if (globalRequests[d.requests[i]].host.indexOf(keyword) !== -1) {
      meta.push("URL");
      toAdd = true;
    }
    if (globalRequests[d.requests[i]].search.indexOf(keyword) !== -1) {
      meta.push("Parameter");
      toAdd = true;
    }
    if (globalRequests[d.requests[i]].hasOwnProperty("requestHeaders") &&
        JSON.stringify(globalRequests[d.requests[i]].requestHeaders).indexOf(keyword) !== -1) {
      meta.push("Header");
      toAdd = true;
    }
    if (toAdd) {
      results.push({node: d.name, index: d.index, foundIn: meta, request: globalRequests[d.requests[i]]});
    }
  }
  return results;
}
