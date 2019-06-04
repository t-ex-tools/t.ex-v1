var SearchBar = {
  controlsContainer: null,
  searchField: null,
  searchBtn: null,
  searchResetBtn: null,
  searchResultsCard: null,
  searchResultsList: null,
  searchCollapsible: null,
  foundInNum: null,
  foundNodesList: null,
  ctrlKeyDetected: false,

  load: function() {

    // elements
    SearchBar.controlsContainer = document.getElementById("controls");
    SearchBar.searchField = document.getElementById("search-field");
    SearchBar.searchBtn = document.getElementById("search-enter-btn");
    SearchBar.searchResetBtn = document.getElementById("search-reset-btn");
    SearchBar.searchResultsCard = document.getElementById("search-results-card");
    SearchBar.searchResultsList = document.getElementById("search-results-list");
    SearchBar.searchCollapsible = new M.Collapsible(SearchBar.searchResultsList, {onOpenEnd: SearchBar.collapsibleOnOpenEnd});
    SearchBar.foundInNum = document.getElementById("found-in-num");
    SearchBar.foundNodesList = document.getElementById("found-nodes-list");
  
    // key and click listener
    SearchBar.searchField.addEventListener("keyup", SearchBar.searchBarKeyUp);
    SearchBar.searchField.addEventListener("keydown", SearchBar.searchBarKeyDown);  
    SearchBar.searchBtn.addEventListener("click", function (e) {
      SearchBar.searchFor(SearchBar.searchField.value);
      SearchBar.toggleSearchResetBtn(true);
    });
    SearchBar.searchResetBtn.addEventListener("click", SearchBar.resetSearch);
  },

  searchBarKeyUp: function (e) {
    event.preventDefault();
    if (e.keyCode === 13) {
      SearchBar.searchFor(this.value);
      SearchBar.toggleSearchResetBtn(true);
    }
    if ((e.keyCode === 91) || (e.keyCode === 18) || (e.keyCode === 17)) {
      SearchBar.ctrlKeyDetected = false;
    }
  },

  searchBarKeyDown: function (e) {
    if ((e.keyCode === 91) || (e.keyCode === 18) || (e.keyCode === 17)) {
      SearchBar.ctrlKeyDetected = true;
    }
    if ((e.keyCode === 8 || e.keyCode === 46) && SearchBar.ctrlKeyDetected) {
      SearchBar.resetSearch();
    }
  },

  resetSearch: function() {
    Bootstrap.nodes.forEach(function(d) {
      d3v4.select(d3v4.selectAll("circle")["_groups"][0][d.index]).classed("search-result", false);
    });
    SearchBar.searchField.value = "";
    SearchBar.toggleSearchResetBtn(false);
  },

  toggleSearchResetBtn: function(show) {
    SearchBar.searchCollapsible.close(0);
    if (show) {
      SearchBar.searchResetBtn.style.display = "block";
      SearchBar.searchResultsCard.style.display = "block";
      SearchBar.searchCollapsible.open(0);
    } else {
      SearchBar.searchResetBtn.style.display = "none";
      SearchBar.searchResultsCard.style.display = "none";
      SearchBar.controlsContainer.style.height = "auto";
      SearchBar.searchResultsCard.style.height = "auto";
    }
  },

  searchFor: function(keyword) {
    var results = Bootstrap.nodes.filter(function(d) {
      d3v4.select(d3v4.selectAll("circle")["_groups"][0][d.index]).classed("search-result", false);
      return (JSON.stringify(d).indexOf(keyword) !== -1);
    }).map(function(d) {
      return SearchBar.findIn(d, keyword);
    }).filter(function(d) {
      if (d.length > 0)
        d3v4.select(d3v4.selectAll("circle")["_groups"][0][d[0].index]).classed("search-result", true);
      return d.length > 0;
    }).sort(function(a, b) {
      return b.length - a.length;
    });
  
    SearchBar.foundInNum.innerHTML = "Keyword&nbsp;<b>" + keyword + "</b>&nbsp;found in&nbsp;<b>" + results.length + "</b>&nbsp;nodes.";
    SearchBar.foundNodesList.innerHTML = "";
  
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
        SearchBar.highlightNode(element, true);
      }.bind(null, e));
      link.addEventListener("mouseout", function(element, evt) {
        SearchBar.highlightNode(element, false);
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
      SearchBar.foundNodesList.appendChild(e);
    });    
  },

  highlightNode: function(element, flag) {
    graph.selectAll("g.node-container").filter(function(d) {
      return d.name === element.node;
    }).each(function(d) {
      d3v4.select(this).select("circle").classed("search-result-highlighted", flag);
    });
  },

  findIn: function(d, keyword) {
    var results = [];

    for (var i=0; i < d.requests.length; i++) {
      var meta = [];
      var toAdd = false;
  
      if (Bootstrap.globalRequests[d.requests[i]].host.indexOf(keyword) !== -1) {
        meta.push("URL");
        toAdd = true;
      }
      if (Bootstrap.globalRequests[d.requests[i]].search.indexOf(keyword) !== -1) {
        meta.push("Parameter");
        toAdd = true;
      }
      if (Bootstrap.globalRequests[d.requests[i]].hasOwnProperty("requestHeaders") &&
          JSON.stringify(Bootstrap.globalRequests[d.requests[i]].requestHeaders).indexOf(keyword) !== -1) {
        meta.push("Header");
        toAdd = true;
      }
      if (toAdd) {
        results.push({node: d.name, index: d.index, foundIn: meta, request: Bootstrap.globalRequests[d.requests[i]]});
      }
    }
    return results;
  },

  collapsibleOnOpenEnd: function() {
    if (SearchBar.searchResultsCard.offsetHeight > SearchBar.controlsContainer.offsetHeight) {
      SearchBar.controlsContainer.style.height = "90%";
      SearchBar.searchResultsCard.style.height = "90%";
    }
  },
  
}
