var Requests = {
  requestsQueue: [],

  crypt: new JSEncrypt({default_key_size: 2048}),
  pubKey: null,
  aesKey: null,
  encAesKey: null,

  updateInterval: 10000,

  load: function() {
    
    // initialize scheduled task
    setTimeout(Requests.updateRequests, Requests.updateInterval);

    // get public key
    chrome.storage.local.get("publicKey", function(result) {
      if (result.hasOwnProperty("publicKey")) {
        Requests.crypt.setPublicKey(result.publicKey);
        Requests.pubKey = result.publicKey;
        Requests.aesKey = Requests.generateRandomKey();
        Requests.encAesKey = Requests.crypt.encrypt(Requests.aesKey);
      }
    });

    // listen for key pair generation
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.hasOwnProperty("pubKey")) {
        Requests.pubKey = message.pubKey;
        Requests.crypt.setPublicKey(message.pubKey)
        Requests.aesKey = Requests.generateRandomKey();
        Requests.encAesKey = Requests.crypt.encrypt(Requests.aesKey);
      } else if (message.hasOwnProperty("delete")) {
        Requests.pubKey = "";
      }
    });
  },

  updateRequests: function() {
    setTimeout(Requests.updateRequests, Requests.updateInterval);
    if (Requests.pubKey === null || Requests.requestsQueue.length === 0) {
      return;
    }
    
    var requestsToUpdate = Requests.requestsQueue;
    Requests.requestsQueue = [];
    chrome.runtime.sendMessage({requests: requestsToUpdate});
    chrome.storage.local.get("lastId", function(result) {
      var chunk = {
        lastId: null,
        requests: sjcl.encrypt(Requests.aesKey, JSON.stringify(requestsToUpdate)),
        aesKey: Requests.encAesKey
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
  },

  // https://stackoverflow.com/a/27747377
  dec2hex: function(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  },

  generateRandomKey: function() {
    var arr = new Uint8Array((12 || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, Requests.dec2hex).join("");
  }  
}

Requests.load();