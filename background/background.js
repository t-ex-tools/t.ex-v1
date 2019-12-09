window.addEventListener("background:requests:stored", (e) => console.log(e));

var Background = (() => {
  const urlFilter = {urls: ["http://*/*", "https://*/*"]};
  let requests = {};

  let load = (() => {

    chrome.webRequest
      .onBeforeRequest
        .addListener((details) => {
          if (details.tabId < 0) {
            return;
          }

          Background.getCompletedTabFromId(details.tabId, (tab) => {
            if (!Settings.shouldStoreBody() && details.hasOwnProperty("requestBody")) {
              delete details.requestBody;
            }

            details.source = tab.url;
            details.complete = true;

            window.dispatchEvent(new CustomEvent("background:main:onRequest", {detail: {request: details}}));
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

    window.dispatchEvent(new CustomEvent("background:main:loaded", {detail: {}}));
    return () => true;
  })();

  let pushToQueue = (details, success) => {
    Background.setRequest(details.requestId, {success: success});
    Requests.add(Background.getRequest(details.requestId));
    delete Background.getRequest(details.requestId);
  };

  return {
    isLoaded: () => load(),

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