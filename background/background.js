var numberOfRequests = 0;

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId === 0) {
    numberOfRequests = 0;
  }
});

var background = {
  init: function() {
    var requestsQueue = [];
    var saveBody = false;
    var allTabs = {};
    chrome.tabs.query({}, function(tabs) {
      for (var i=0; i < tabs.length; i++) {
        allTabs[tabs[i].id] = tabs[i];
      }
    });
    var reqIdMap = {};
    var crypt = new JSEncrypt({default_key_size: 2048});
    var pubKey = "";
    var aesKey = "";
    var encAesKey = "";
    chrome.storage.local.get("publicKey", function(result) {
      if (result.hasOwnProperty("publicKey")) {
        crypt.setPublicKey(result.publicKey);
        pubKey = result.publicKey;
        aesKey = generateRandomKey();
        encAesKey = crypt.encrypt(aesKey);
        // encAesKey = aesKey;
      }
    });

    setTimeout(updateRequests, 10000);
    setTimeout(checkSettings, 2500);
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      allTabs[tabId] = tab;
    });

    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    	if (typeof reqIdMap[details.requestId] === "undefined") {
    		return;
    	}

    	reqIdMap[details.requestId]["requestHeaders"] = details.requestHeaders
    		.map(function(e) {
    			var tmp = [];
    			tmp[0] = e.name;
    			tmp[1] = e.value;
    			return tmp;
    		})
    		.reduce(function(result, item, index) {
          if (item[0] === "Cookie") {
            result[item[0]] = item[1]
              .replace(" ", "")
              .split(";")
              .map(function(e) { return e.split("=")})
              .reduce(function(result, item, index) {
                result[item[0]] = item[1];
                return result;
              }, {});
          } else {
            result[item[0]] = item[1];
          }
    			return result;
    		}, {});
      },
      {urls: ["http://*/*", "https://*/*"]},
      ["blocking", "requestHeaders"]
    );

    chrome.webRequest.onCompleted.addListener(function(details) {
      if (typeof reqIdMap[details.requestId] === "undefined" ||
          typeof reqIdMap[details.requestId].sourceUrl === "undefined") {
            return;
      }

      reqIdMap[details.requestId]["completed"] = true;
      //TODO: for some strange reason, sourceUrl can be undefined here
      requestsQueue.push(reqIdMap[details.requestId]);
      // delete reqIdMap[details.requestId];
      numberOfRequests += 1;
      // console.log(numberOfRequests);
    	},
      {urls: ["http://*/*", "https://*/*"]},
      ["responseHeaders"]
    );

    chrome.webRequest.onErrorOccurred.addListener(function(details) {
      //console.log("error");
    		if (typeof reqIdMap[details.requestId] === "undefined") {
    			return;
    		}

    	  reqIdMap[details.requestId]["completed"] = false;
    	  requestsQueue.push(reqIdMap[details.requestId]);
    	  //  delete reqIdMap[details.requestId];
    	},
      {urls: ["http://*/*", "https://*/*"]}
    );

    chrome.webRequest.onBeforeRequest.addListener(function(details) {
        if (!details.hasOwnProperty("url") || details.tabId < 0) {
          return;
        }
        reqIdMap[details.requestId] = {};
        var l = new URL(details.url);

        if (saveBody && details.hasOwnProperty("requestBody")) {
          if (details.requestBody.hasOwnProperty("raw") && details.requestBody.raw.length > 0) {
            if (details.requestBody.raw[0].hasOwnProperty("bytes")) {
              var params = arrayBufferToString(details.requestBody.raw[0].bytes);
              try {
                params = JSON.parse(params);
              } catch (err) {
                params = {raw: params};
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

        reqIdMap[details.requestId] = url2json(l);
        reqIdMap[details.requestId]["requestType"] = details.type;
        reqIdMap[details.requestId]["sourceUrl"] = null;
        if (details.type !== "main_frame") {
          if (typeof allTabs[details.tabId] === "undefined" ||
              allTabs[details.tabId].url.startsWith("chrome-extension")) {
                // console.log("hardError");
                delete reqIdMap[details.requestId];
          } else {
            if (details.hasOwnProperty("initiator") && details.initiator !== null && details.initiator !== "") {
              reqIdMap[details.requestId]["sourceUrl"] = url2json(new URL(details.initiator));
            } else {
              console.log(details.initiator);
            }
            getCompletedTabFromId(details.tabId, function(tab) {
              if (tab === null) {
                delete reqIdMap[details.requestId];
                return;
              }
      				if (typeof reqIdMap[details.requestId] === "undefined") {
      					return;
      				}
              reqIdMap[details.requestId]["sourceUrl"] = url2json(new URL(tab.url));
            });
          }
        }
      },
      {urls: ["http://*/*", "https://*/*"]},
      ["blocking", "requestBody"]
    );

    function updateRequests() {
      setTimeout(updateRequests, 10000);
      if (pubKey === "" || requestsQueue.length === 0) {
        return;
      }

      var requestsToUpdate = requestsQueue;
      requestsQueue = [];
      chrome.runtime.sendMessage({requests: requestsToUpdate});
      chrome.storage.local.get("lastId", function(result) {
        var chunk = {
          lastId: null,
          requests: sjcl.encrypt(aesKey, JSON.stringify(requestsToUpdate)),
          // requests: JSON.stringify(requestsToUpdate),
          aesKey: encAesKey
        }
        if (result.hasOwnProperty("lastId")) {
          chunk.lastId = result.lastId;
        }
        var obj = {};
        var currentId = Date.now();
        obj[currentId] = chunk;
        chrome.storage.local.set(obj, function() {
          chrome.storage.local.set({lastId: currentId}, null);
        });
      });
    }

    function checkSettings() {
      setTimeout(checkSettings, 2500);

      chrome.storage.local.get("settingsBodyFormData", function(result) {
        if (result.hasOwnProperty("settingsBodyFormData")) {
          saveBody = result.settingsBodyFormData;
        }
      });
    }

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.hasOwnProperty("pubKey")) {
        pubKey = message.pubKey;
        crypt.setPublicKey(message.pubKey)
        aesKey = generateRandomKey();
        encAesKey = crypt.encrypt(aesKey);
      } else if (message.hasOwnProperty("delete")) {
        pubKey = "";
      }
    });
  }
}

background.init();

function getCompletedTabFromId(tabId, callback) {
  try {
    chrome.tabs.get(tabId, function(tab) {
      if (chrome.runtime.lastError || typeof tab === "undefined") {
        return;
      } else if (tab.status === "loading") {
        getCompletedTabFromId(tabId, callback);
      } else {
        callback(tab);
      }
    });
  } catch (err) {
    if (err) {
      callback(null);
    }
  }
}

function url2json(l) {
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
}

function arrayBufferToString(buffer){
    return new TextDecoder("utf-8").decode(buffer);
}

// https://stackoverflow.com/a/27747377
function dec2hex(dec) {
  return ("0" + dec.toString(16)).substr(-2);
}

function generateRandomKey() {
  var arr = new Uint8Array((12 || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}
