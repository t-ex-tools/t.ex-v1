var Background = (() => {
  const urlFilter = {urls: ["http://*/*", "https://*/*"]};
  let requests = {};

  load = (() => {

    chrome.webRequest
      .onBeforeRequest
        .addListener((details) => {
          if (details.tabId < 0) {
            return;
          }

          Background.getCompletedTabFromId(details.tabId, (tab) => {
            if (!Settings.saveBody && details.hasOwnProperty("requestBody")) {
              delete details.requestBody;
            }

            details.source = tab.url;
            details.complete = true;

            Background.setRequest(details.requestId, details);
          });
        },
        urlFilter,
        ["requestBody"]);    

    chrome.webRequest
      .onBeforeSendHeaders
        .addListener((details) => 
          Background.setRequest(details.requestId, {requestHeaders: details.requestHeaders}),
        urlFilter, 
        ["requestHeaders", "extraHeaders"]);

    chrome.webRequest
      .onCompleted
        .addListener((details) => pushToQueue(details, true),
        urlFilter);

    chrome.webRequest
      .onErrorOccurred
        .addListener((details) => pushToQueue(details, false),
        urlFilter);

  })();

  pushToQueue = (details, success) => {
    Background.setRequest(details.requestId, {success: success});
    Requests.requestsQueue.push(Background.getRequest(details.requestId));
    delete Background.getRequest(details.requestId);
  };

  return {
    getRequests: () => requests,

    getRequest: (requestId) => requests[requestId],

    setRequest: (requestId, obj) => requests[requestId] = Object.assign(requests[requestId] || {}, obj),

    getCompletedTabFromId: (tabId, callback) => {
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
  }
})();