var loadingIndicator = document.getElementById("loading-indicator");
var text = document.getElementById("text");

initPassword();

chrome.storage.local.get("privateKey", function(result) {
  if (result.hasOwnProperty("privateKey")) {
    var privateKey = decryptPrivateKey(result.privateKey, function(privateKey) {
      exportData(Date.now(), privateKey, function() {});
    });
  }
});

function decryptPrivateKey(encPrivateKey, callback) {
  var userPassword = passwordPrompt(function(userPassword) {
    var pk = sjcl.decrypt(userPassword, encPrivateKey);
    callback(pk);
  });
}

function exportData(limit, privateKey, callback) {
  var crypt = new JSEncrypt({default_key_size: 2048});
  var encAesKey = null;
  var decAesKey = null;

  chrome.storage.local.get("lastId", function(result) {
    if (!result.hasOwnProperty("lastId")) {
      return;
    }
    crypt.setPrivateKey(privateKey);
    getChunks(result.lastId, [], limit, function(requests) {
      drawData(requests, callback);
    });
  });

  function getChunks(id, requests, limit, callback) {
    chrome.storage.local.get(id + "", function(chunk) {
      if (chunk[id].lastId == null || (Number.parseInt(chunk[id].lastId) < (Date.now() - limit))) {
        callback(requests.concat(decryptChunk(chunk[id])));
      } else {
        return getChunks(chunk[id].lastId, requests.concat(decryptChunk(chunk[id])), limit, callback)
      }
    });
  }

  function decryptChunk(chunk) {
    if (encAesKey === null || encAesKey !== chunk.aesKey) {
      encAesKey = chunk.aesKey;
      decAesKey = crypt.decrypt(chunk.aesKey);
    }
    if (decAesKey == null)
      return;
    var reqs = sjcl.decrypt(decAesKey, chunk.requests);
    return JSON.parse(reqs);
  }
}

function drawData(requests, callback) {
  var blob = new Blob([JSON.stringify(requests)], {type: "application/json"});
  var url = URL.createObjectURL(blob);
  chrome.downloads.download({url: url});
  loadingIndicator.style.display = "none";
  text.innerHTML = "Download started!"
}
