var modal = null;
var timelineContainer = null;
var requestDetailsContainer = null;
var timeline = null;
var requestsWindow = 0;
var requestsMoreBtn = null;
var requestsBackBtn = null;
var allItems = null;

function initRequestsComponent() {
  modal = new M.Modal(document.getElementById("requests"), {endingTop: "4%"});
  timelineContainer = document.getElementById("requests-timeline");
  requestDetailsContainer = document.getElementById("requests-details");
  timeline = new vis.Timeline(timelineContainer, null, {
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

  requestsMoreBtn = document.getElementById("requests-more-btn");
  requestsBackBtn = document.getElementById("requests-back-btn");
  requestsMoreBtn.addEventListener("click", function() {
    requestsWindow += 1;
    slideWindow(requestsWindow);
  });
  requestsBackBtn.addEventListener("click", function() {
    requestsWindow -= 1;
    slideWindow(requestsWindow);
  });

  requestDetailsContainer.style.maxHeight = Math.ceil((window.innerHeight / 100) * 75) + "px";

  timeline.on("select", function(e) {
    requestDetailsContainer.innerHTML = "";
    var renderedRequest = renderRequest(globalRequests[e.items[0]]);
    if (renderedRequest !== null)
      requestDetailsContainer.appendChild(renderedRequest);
  });

  timeline.on("doubleClick", function(e) {
    chrome.tabs.create({url: "http://" + globalRequests[e.item].hostname + globalRequests[e.item].pathname});
  });

  document.getElementById("show-all-button").addEventListener("click", function(e) {
    if (selection == null) {
      return;
    }

    var windowStart = selection.requests.length - maxNumRequests;
    if (windowStart < 0) {
      windowStart = 0;
      requestsMoreBtn.classList.add("disabled");
    }
    requestsBackBtn.classList.add("disabled");

    // TODO: this is very costly
    selection.requests
      .sort(function(a, b) {
        return globalRequests[a].time - globalRequests[b].time;
      });
    allItems = selection.requests;

    var items = allItems.slice(windowStart, selection.requests.length)
      .map(function(index) {
        return {
          id: globalRequests[index].id,
          content: globalRequests[index].pathname,
          start: new Date(globalRequests[index].time),
        };
      });
    timeline.setOptions({
      min: new Date(items[0].start.getTime() - 43200000),
      max: new Date(items[items.length-1].start.getTime() + 43200000)
    })
    timeline.setItems(items);

    setTimeout(function() {
      timelineContainer.style.height = "100%";
      timeline.fit();
    }, 1000)
  });
}

function slideWindow(slidingWindow) {
  requestsBackBtn.classList.remove("disabled");
  requestsMoreBtn.classList.remove("disabled");

  var windowStart = selection.requests.length - ((slidingWindow + 1) * maxNumRequests);
  var windowEnd = selection.requests.length - (slidingWindow * maxNumRequests);
  if (windowStart < 0) {
    windowStart = 0;
    requestsMoreBtn.classList.add("disabled");
  }
  if (windowEnd <= 0) {
    return;
  }
  if (windowStart >= selection.requests.length) {
    return;
  }
  if (windowEnd >= selection.requests.length) {
    windowEnd = selection.requests.length;
    requestsBackBtn.classList.add("disabled");
  }
  var items = allItems.slice(windowStart, windowEnd)
    .map(function(index) {
      return {
        id: globalRequests[index].id,
        content: globalRequests[index].pathname,
        start: new Date(globalRequests[index].time),
      };
    });
  timeline.setOptions({
    min: new Date(items[0].start.getTime() - 43200000),
    max: new Date(items[items.length-1].start.getTime() + 43200000)
  })
  timeline.setItems(items);
  timeline.fit();
}

function renderRequest(item) {
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
      /*
      if (k === "Cookie") {
        newValue = v
          .replace(" ", "")
          .split(";")
          .map(function(e) { return e.split("=")})
          .reduce(function(result, item, index) {
            result[item[0]] = item[1];
            return result;
          }, {});
      }
      */
      if (k === "time") {
        newValue = new Date(v);
      }
      return newValue;
    })
    (tmpItem);
}
