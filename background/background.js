var Background = {
  request: {},

  load: function () {

    chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
      if (typeof Background.request[details.requestId] === "undefined") {
        return;
      }

      Background.request[details.requestId]["requestHeaders"] = details.requestHeaders
        .map(function (e) {
          return [e.name, e.value];
        })
        .reduce(function (result, item, index) {
          if (item[0] === "Cookie") {
            result[item[0]] = item[1]
              .replace(" ", "")
              .split(";")
              .map(function (e) { return e.split("=") })
              .reduce(function (result, item, index) {
                result[item[0]] = item[1];
                return result;
              }, {});
          } else {
            result[item[0]] = item[1];
          }
          return result;
        }, {});
    },
      { urls: ["http://*/*", "https://*/*"] },
      ["blocking", "requestHeaders", "extraHeaders"]
    );

    chrome.webRequest.onBeforeRequest.addListener(function (details) {
      if (!details.hasOwnProperty("url") || details.tabId < 0) {
        return;
      }

      Background.request[details.requestId] = {};
      Background.request[details.requestId] = Background.url2json(new URL(details.url));
      Background.request[details.requestId]["gtimeStamp"] = details.timeStamp;
      Background.request[details.requestId]["initiator"] = details.initiator;
      Background.request[details.requestId]["frameId"] = details.frameId;
      Background.request[details.requestId]["httpMethod"] = details.method;
      Background.request[details.requestId]["requestType"] = details.type;
      Background.request[details.requestId]["sourceUrl"] = null;      

      if (Settings.saveBody && details.hasOwnProperty("requestBody")) {
        if (details.requestBody.hasOwnProperty("raw") && details.requestBody.raw.length > 0) {
          if (details.requestBody.raw[0].hasOwnProperty("bytes")) {
            var params = Background.arrayBufferToString(details.requestBody.raw[0].bytes);
            try {
              params = JSON.parse(params);
            } catch (err) {
              params = { raw: params };
            } finally {
              l.bodyParams = params;
            }
          }
        } else {
          if (details.requestBody.hasOwnProperty("formData")) {
            l.formDataParams = details.requestBody.formData;
          }
        }
      }

      if (details.type !== "main_frame") {
        if (typeof Tabs.allTabs[details.tabId] === "undefined" ||
          Tabs.allTabs[details.tabId].url.startsWith("chrome-extension")) {
          delete Background.request[details.requestId];
        } else {
          if (details.hasOwnProperty("initiator") && details.initiator !== null && details.initiator !== "") {
            Background.request[details.requestId]["sourceUrl"] = Background.url2json(new URL(details.initiator));
          }
          Background.getCompletedTabFromId(details.tabId, function (tab) {
            if (tab === null) {
              delete Background.request[details.requestId];
              return;
            }
            if (typeof Background.request[details.requestId] === "undefined") {
              return;
            }
            Background.request[details.requestId]["sourceUrl"] = Background.url2json(new URL(tab.url));
          });
        }
      }
    },
      { urls: ["http://*/*", "https://*/*"] },
      ["blocking", "requestBody"]
    );

    chrome.webRequest.onCompleted.addListener(function (details) {
      if (typeof Background.request[details.requestId] === "undefined" ||
        typeof Background.request[details.requestId].sourceUrl === "undefined") {
        return;
      }

      Background.request[details.requestId]["completed"] = true;
      Requests.requestsQueue.push(Background.request[details.requestId]);
      delete Background.request[details.requestId];

    },
      { urls: ["http://*/*", "https://*/*"] },
      ["responseHeaders"]
    );

    chrome.webRequest.onErrorOccurred.addListener(function (details) {
      if (typeof Background.request[details.requestId] === "undefined") {
        return;
      }

      Background.request[details.requestId]["completed"] = false;
      Requests.requestsQueue.push(Background.request[details.requestId]);
      delete Background.request[details.requestId];
    },
      { urls: ["http://*/*", "https://*/*"] }
    );


  },

  getCompletedTabFromId: function (tabId, callback) {
    try {
      chrome.tabs.get(tabId, function (tab) {
        if (chrome.runtime.lastError || typeof tab === "undefined") {
          return;
        } else if (tab.status === "loading") {
          Background.getCompletedTabFromId(tabId, callback);
        } else {
          callback(tab);
        }
      });
    } catch (err) {
      if (err) {
        callback(null);
      }
    }
  },

  url2json: function (l) {
    var blacklist = ["searchParams", "toJSON", "toString"];
    var r = {};
    l.parsedParams = {};
    l.time = Date.now();
    for (var pair of l.searchParams.entries()) {
      l.parsedParams[pair[0]] = pair[1];
    }
    for (key in l) {
      if (blacklist.indexOf(key) === -1) {
        r[key] = l[key];
      }
    }
    return r;
  },

  arrayBufferToString: function (buffer) {
    return new TextDecoder("utf-8").decode(buffer);
  },
};

Background.load();