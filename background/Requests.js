var Requests = (() => {
  let requestsQueue = [];
  let crypt = new JSEncrypt({default_key_size: 2048});
  let pubKey = null;
  let aesKey = null;
  let encAesKey = null;
  let updateInterval = 1000;

  let load = (() => {
    chrome.storage.local.get("publicKey", (result) => {
      if (result.hasOwnProperty("publicKey")) {
        Requests.setPubKey(result.publicKey);
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.hasOwnProperty("pubKey")) {
        Requests.setPubKey(message.pubKey);
      } else if (message.hasOwnProperty("delete")) {
        Requests.setPubKey(null);
      }
    });
  })();

  let scheduleWorker = (delay) => setTimeout(updateRequests, delay);

  let updateRequests = () => {
    scheduleWorker(updateInterval);

    if (pubKey === null || requestsQueue.length === 0) {
      return;
    }
    
    var requestsToUpdate = requestsQueue.filter((e) => e.complete);
    requestsQueue = requestsQueue.filter((e) => !e.complete);

    chrome.storage.local.get("lastId", (result) => {
      let chunk = {
        lastId: result.lastId || null,
        requests: sjcl.encrypt(aesKey, JSON.stringify(requestsToUpdate)),
        aesKey: encAesKey
      };
      let chunkWrap = {};
      let currentId = Date.now();
      chunkWrap[currentId] = chunk;
      chrome.storage.local.set(chunkWrap, () => {
        chrome.storage.local.set({lastId: currentId}, () => console.log(requestsToUpdate));
      });
    });

    chrome.runtime.sendMessage({requests: requestsToUpdate});
  };

  return {
    setPubKey: (publicKey) => {
      pubKey = publicKey;
      crypt.setPublicKey(publicKey);
      aesKey = Requests.generateRandomKey();
      encAesKey = crypt.encrypt(aesKey)
      scheduleWorker(0);
    },

    add: (request) => requestsQueue.push(request),
  
    dec2hex: (dec) => ("0" + dec.toString(16)).substr(-2),
  
    generateRandomKey: () => {
      var arr = new Uint8Array((12 || 40) / 2);
      window.crypto.getRandomValues(arr);
      return Array.from(arr, Requests.dec2hex).join("");
    }
  };
  
})();