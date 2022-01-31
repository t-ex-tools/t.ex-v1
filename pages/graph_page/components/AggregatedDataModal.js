var AggregatedDataModal = {
  aggDataModal: null,
  aggDataContainer: null,
  aggSearch: null,
  aggSearchResetBtn: null,
  aggSearchEnterBtn: null,
  reducedRequests: null,
  ctrlDetected: null,
  markInstance: null,

  load: function() {

    // initialize elements
    AggregatedDataModal.aggDataModal = new M.Modal(document.getElementById("aggregated-data"), {endingTop: "4%"});
    AggregatedDataModal.aggDataContainer = document.getElementById("agg-data-container");
    AggregatedDataModal.aggSearch = document.getElementById("agg-search");
    AggregatedDataModal.aggSearchResetBtn = document.getElementById("agg-search-reset-btn");
    AggregatedDataModal.aggSearchResetBtn = document.getElementById("agg-search-enter-btn");
    AggregatedDataModal.markInstance = new Mark("span.string");

    // handlers
    graph.selectAll("g.node-container").on("click.m", function(node) {
      setTimeout(function() {
        if (Bootstrap.selection === null) {
          AggregatedDataModal.reducedRequests = null
        } else {
          AggregatedDataModal.reducedRequests = AggregatedDataModal.reduceRequests(Bootstrap.selection);
          var trackingRatio = AggregatedDataModal.calculateTrackingRatio();
          document.getElementById("info-tracking-ratio").innerHTML = "You disclosed <b>" + trackingRatio.toFixed(2) + "%</b> of your browser history to this node.";
        }
      }, 100);
    });
  
    AggregatedDataModal.aggSearch.addEventListener("keyup", function (e) {
      e.preventDefault();
      if (e.keyCode === 13) {
        AggregatedDataModal.searchInAggFor(this.value);
        AggregatedDataModal.toggleAggResetBtn(true);
      }
      if ((e.keyCode === 91) || (e.keyCode === 18) || (e.keyCode === 17)) {
        AggregatedDataModal.ctrlDetected = false;
      }
    });
  
    AggregatedDataModal.aggSearch.addEventListener("keydown", function (e) {
      if ((e.keyCode === 91) || (e.keyCode === 18) || (e.keyCode === 17)) {
        AggregatedDataModal.ctrlDetected = true;
      }
      if ((e.keyCode === 8 || e.keyCode === 46) && AggregatedDataModal.ctrlDetected) {
        AggregatedDataModal.aggDataContainer.innerHTML = "";
        AggregatedDataModal.aggDataContainer.appendChild(AggregatedDataModal.renderAggData(AggregatedDataModal.reducedRequests));
        AggregatedDataModal.toggleAggResetBtn(false);
      }
    });
  
    AggregatedDataModal.aggSearchResetBtn.addEventListener("click", function (e) {
      AggregatedDataModal.searchInAggFor(AggregatedDataModal.aggSearch.value);
      AggregatedDataModal.toggleAggResetBtn(true);
    });
  
    AggregatedDataModal.aggSearchResetBtn.addEventListener("click", function (e) {
      AggregatedDataModal.aggSearch.value = "";
      AggregatedDataModal.aggDataContainer.innerHTML = "";
      AggregatedDataModal.aggDataContainer.appendChild(AggregatedDataModal.renderAggData(AggregatedDataModal.reducedRequests));
      AggregatedDataModal.toggleAggResetBtn(false);
    });
  },

  calculateTrackingRatio: function() {
    var reducedRequestsString = JSON.stringify(AggregatedDataModal.reducedRequests);
    var num = 0;
    for (var i=0; i < Bootstrap.browsingHistory.length; i++) {
      var url = new URL(Bootstrap.browsingHistory[i]);
  
      if (reducedRequestsString.indexOf(Bootstrap.browsingHistory[i]) > -1 ||
          reducedRequestsString.indexOf(encodeURIComponent(Bootstrap.browsingHistory[i])) > -1 ||
          (reducedRequestsString.indexOf(url.path) > -1 && typeof url.path !== "undefined")) {
            num += 1;
      }
    }
    return ((num / Bootstrap.browsingHistory.length) * 100);
  },

  toggleAggResetBtn: function(flag) {
    if (flag) {
      AggregatedDataModal.aggSearchResetBtn.style.display = "block";
    } else {
      AggregatedDataModal.aggSearchResetBtn.style.display = "none";
    }
  },

  searchInAggFor: function(token) {
    var keys = Object.keys(AggregatedDataModal.reducedRequests);
    var result = {};
    keys.filter(function(k) {
      return (JSON.stringify(AggregatedDataModal.reducedRequests[k]).indexOf(token) !== -1 || k.indexOf(token) !== -1);
    }).forEach(function(k) {
      result[k] = AggregatedDataModal.reducedRequests[k];
    });
    AggregatedDataModal.aggDataContainer.innerHTML = "";
    AggregatedDataModal.aggDataContainer.appendChild(AggregatedDataModal.renderAggData(result));
    setTimeout(function() {
      AggregatedDataModal.markInstance.markRegExp(new RegExp(AggregatedDataModal.escapeRegExp(token), "g"));
    });
  },

  escapeRegExp: function(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  },

  reduceRequests: function(node) {
    return node.requests.reduce(function(prev, v, i, array) {;
      var arr = [];
      var pre = [];

      if (Bootstrap.globalRequests[v].hasOwnProperty("parsedParams")) {
        arr.push(Bootstrap.globalRequests[v]["parsedParams"]);
        pre.push("Parameter.");
      }
      if (Bootstrap.globalRequests[v].hasOwnProperty("requestHeaders")) {
        arr.push(Bootstrap.globalRequests[v]["requestHeaders"]);
        pre.push("Header.");

        if (Bootstrap.globalRequests[v].requestHeaders.hasOwnProperty("Cookie")) {
          /*
          var cookie = Bootstrap.globalRequests[v].requestHeaders.Cookie
            .replace(" ", "")
            .split(";")
            .map(function(e) { return e.split("=")})
            .reduce(function(result, item, index) {
              result[item[0]] = item[1];
              return result;
            }, {});
          arr.push(cookie);
          */
          arr.push(Bootstrap.globalRequests[v].requestHeaders.Cookie);
          pre.push("Cookie.");
        }
      }
      if (Bootstrap.globalRequests[v].hasOwnProperty("bodyParams")) {
        if (typeof Bootstrap.globalRequests[v].bodyParams === "object") {
          arr.push(Bootstrap.globalRequests[v].bodyParams);
        } else {
          if (typeof Bootstrap.globalRequests[v].bodyParams === "string" &&
              Bootstrap.globalRequests[v].bodyParams.includes("=") &&
              Bootstrap.globalRequests[v].bodyParams.includes("&")) {
                Bootstrap.globalRequests[v].bodyParams = Bootstrap.globalRequests[v].bodyParams.split("&")
                .map(function(e) {
                  var tmp = e.split("=");
                  return {key: tmp[0], value: tmp[1]};
                });
          }
          arr.push({value: Bootstrap.globalRequests[v].bodyParams});
        }
        pre.push("BodyParam.");
      }
      if (Bootstrap.globalRequests[v].hasOwnProperty("formDataParams")) {
        var keys = Object.keys(Bootstrap.globalRequests[v].formDataParams);
        keys.forEach(function(k) {
          Bootstrap.globalRequests[v].formDataParams[k] = JSON.stringify(Bootstrap.globalRequests[v].formDataParams[k]);
        });
        arr.push(Bootstrap.globalRequests[v].formDataParams);
        pre.push("FormData.")
      }

      for (var z=0; z < arr.length; z++) {
        var objKeys = Object.keys(arr[z]);
        for (var i=0; i < objKeys.length; i++) {
          if (prev.hasOwnProperty(pre[z] + objKeys[i])) {
            var match = prev[pre[z] + objKeys[i]].filter(function(e) {
              return e.value === arr[z][objKeys[i]];
            });
            if (match.length === 0) {
              prev[pre[z] + objKeys[i]].push({
                value: arr[z][objKeys[i]],
                occurence: 1,
                of: node.requests.length
              });
            } else {
              match[0].occurence += 1;
            }
          } else {
            prev[pre[z] + objKeys[i]] = [{
              value: arr[z][objKeys[i]],
              occurence: 1,
              of: node.requests.length
            }];
          }
        }
      }

    return prev;
  }, {});
  },

  renderAggData: function(data) {
    return renderjson
    .set_show_by_default(true)
    .set_sort_objects(true)
    .set_icons('+', '-')
    (data);
  },

}