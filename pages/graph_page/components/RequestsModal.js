var RequestsModal = {
  modal: null,
  timelineContainer: null,
  requestDetailsContainer: null,
  timeline: null,
  requestsWindow: 0,
  requestsMoreBtn: null,
  requestsBackBtn: null,
  allItems: null,  

  load: function() {

    // initialize elements & styling
    RequestsModal.modal = new M.Modal(document.getElementById("requests"), {endingTop: "4%"});
    RequestsModal.timelineContainer = document.getElementById("requests-timeline");
    RequestsModal.requestDetailsContainer = document.getElementById("requests-details");
    RequestsModal.requestDetailsContainer.style.maxHeight = Math.ceil((window.innerHeight / 100) * 75) + "px";
    RequestsModal.timeline = new vis.Timeline(RequestsModal.timelineContainer, null, {
      height: Math.ceil((window.innerHeight / 100) * 75),
      margin: {
        axis: 40,
        item: {
          horizontal: 1000,
          vertical: 30,
        },
      },
      zoomMin: 60000,
      zoomMax: 3600000
    });
    RequestsModal.requestsMoreBtn = document.getElementById("requests-more-btn");
    RequestsModal.requestsBackBtn = document.getElementById("requests-back-btn");
    

    // click handler
    RequestsModal.requestsMoreBtn.addEventListener("click", function() {
      RequestsModal.requestsWindow += 1;
      RequestsModal.slideWindow(RequestsModal.requestsWindow);
    });
    RequestsModal.requestsBackBtn.addEventListener("click", function() {
      RequestsModal.requestsWindow -= 1;
      RequestsModal.slideWindow(RequestsModal.requestsWindow);
    });
  
    RequestsModal.timeline.on("select", function(e) {
      RequestsModal.requestDetailsContainer.innerHTML = "";
      var renderedRequest = RequestsModal.renderRequest(Bootstrap.globalRequests[e.items[0]]);
      if (renderedRequest !== null)
        RequestsModal.requestDetailsContainer.appendChild(renderedRequest);
    });
  
    RequestsModal.timeline.on("doubleClick", function(e) {
      chrome.tabs.create({url: "http://" + Bootstrap.globalRequests[e.item].hostname + Bootstrap.globalRequests[e.item].pathname});
    });
  },

  slideWindow: function(slideWindow) {
    RequestsModal.requestsBackBtn.classList.remove("disabled");
    RequestsModal.requestsMoreBtn.classList.remove("disabled");
  
    var windowStart = Bootstrap.selection.requests.length - ((slideWindow + 1) * Bootstrap.maxNumRequests);
    var windowEnd = Bootstrap.selection.requests.length - (slideWindow * Bootstrap.maxNumRequests);
    if (windowStart < 0) {
      windowStart = 0;
      RequestsModal.requestsMoreBtn.classList.add("disabled");
    }
    if (windowEnd <= 0) {
      return;
    }
    if (windowStart >= Bootstrap.selection.requests.length) {
      return;
    }
    if (windowEnd >= Bootstrap.selection.requests.length) {
      windowEnd = Bootstrap.selection.requests.length;
      RequestsModal.requestsBackBtn.classList.add("disabled");
    }
    var items = RequestsModal.allItems.slice(windowStart, windowEnd)
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
    });
    RequestsModal.timeline.setItems(items);
    RequestsModal.timeline.fit();
  },

  renderRequest: function(item) {
    if (typeof item === "undefined" || item === null)
    return null;

    var blacklist = [
      "completed",
      "hash",
      "host",
      "href",
      "id",
      "origin",
      "password",
      "port",
      "protocol",
      "search",
      "searchParams",
      "sourceUrl",
      "toString",
      "username"
    ];

    var tmpItem = item;
    var tmpItemKeys = Object.keys(tmpItem);
    for (var i=0; i < tmpItemKeys.length; i++) {
      if (blacklist.indexOf(tmpItemKeys[i]) !== -1 ||
        (Object.keys(tmpItem[tmpItemKeys[i]]).length === 0 &&
          tmpItem[tmpItemKeys[i]].constructor === Object)) {
        delete tmpItem[tmpItemKeys[i]];
      }
    }

    return renderjson
      .set_show_by_default(true)
      .set_sort_objects(true)
      .set_icons('+', '-')
      .set_max_string_length(24)
      .set_replacer(function(k, v) {
        var newValue = v;
        if (k === "time") {
          newValue = new Date(v);
        }
        return newValue;
      })(tmpItem);    
  }
}