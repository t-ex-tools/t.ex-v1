PasswordModal.load();

chrome.storage.local.get("privateKey", function(result) {
  if (result.hasOwnProperty("privateKey")) {
    document.getElementById("time-loading-indicator").style.visibility = "visible";
    var privateKey = decryptPrivateKey(result.privateKey, function(privateKey) {
      renderGraph(1000 * 60 * 60 * 24, privateKey, function() {
        InfoOverlay.load();
        AggregatedDataModal.load();
      });
    });
  }

});

TimeSelectOverlay.load();
SearchBar.load();
RequestsModal.load();
SettingsModal.load();

function decryptPrivateKey(encPrivateKey, callback) {
  var userPassword = PasswordModal.showPrompt(function(userPassword) {
    var pk = sjcl.decrypt(userPassword, encPrivateKey);
    callback(pk);
  });
}
