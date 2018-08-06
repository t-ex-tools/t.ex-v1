var settingsView = null;
var settingsModal = null;
var settingsContent = null;
var deleteHistoryButton = null;
var deleteLoadingIndicator = null;
var deleteHistorySuccess = null;
var bodyFormDataCheckbox = null;
var faviconCheckbox = null;
var settingsExportBtn = null;
var keyPairBtn = null;
var keyPairLoadingIndicator = null;
var keyPairStatusOk = null;
var keyPairStatusErr = null;

function initSettings() {
  settingsView = document.getElementById("settings-view");
  settingsModal = new M.Modal(settingsView, {
    ready: function() {
      chrome.storage.local.get("settingsBodyFormData", function(result) {
        if (result.hasOwnProperty("settingsBodyFormData")) {
          bodyFormDataCheckbox.checked = result.settingsBodyFormData;
        } else {
          bodyFormDataCheckbox.checked = false;
        }
      });
      chrome.storage.local.get("settingsFavicon", function(result) {
        if (result.hasOwnProperty("settingsFavicon")) {
          faviconCheckbox.checked = result.settingsFavicon;
        } else {
          faviconCheckbox.checked = false;
        }
      });
      chrome.storage.local.get(["publicKey", "privateKey"], function(result) {
        if (result.hasOwnProperty("publicKey") && result.hasOwnProperty("privateKey")) {
          keyPairStatusOk.style.display = "block";
        } else {
          keyPairStatusErr.style.display = "block";
        }
      });
    },
    endingTop: "4%"
  });
  settingsContent = document.getElementById("settings-content");
  deleteHistoryButton = document.getElementById("delete-history-btn");
  deleteLoadingIndicator = document.getElementById("delete-loading-indicator");
  deleteHistorySuccess = document.getElementById("delete-history-success");
  bodyFormDataCheckbox = document.getElementById("body-form-data-checkbox");
  faviconCheckbox = document.getElementById("favicon-checkbox");
  settingsExportBtn = document.getElementById("settings-export-btn");
  keyPairBtn = document.getElementById("key-pair-btn");
  keyPairLoadingIndicator = document.getElementById("key-pair-loading-indicator");
  keyPairStatusOk = document.getElementById("key-pair-status-ok");
  keyPairStatusErr = document.getElementById("key-pair-status-err");

  deleteHistoryButton.addEventListener("click", function() {
    if (confirm("Are you sure? Seriously, we cannot undo it.")) {
      deleteHistoryButton.style.display = "none";
      deleteLoadingIndicator.style.display = "block";

      chrome.runtime.sendMessage({"delete": true});

      chrome.storage.local.clear(function() {
        deleteHistorySuccess.style.display = "block";
        deleteLoadingIndicator.style.display = "none";
        setTimeout(function() {
          deleteHistorySuccess.style.display = "none";
          deleteHistoryButton.style.display = "block";

          keyPairStatusErr.style.display = "block";
          keyPairStatusOk.style.display = "none";
        }, 2000);
      });
    }
  });

  bodyFormDataCheckbox.addEventListener("click", function() {
    chrome.storage.local.set({settingsBodyFormData: bodyFormDataCheckbox.checked}, function() {});
  });

  faviconCheckbox.addEventListener("click", function() {
    chrome.storage.local.set({settingsFavicon: faviconCheckbox.checked}, function() {});
  });

  settingsExportBtn.addEventListener("click", function() {
    chrome.tabs.create({url: chrome.extension.getURL("export_page/export.html")});
  });

  keyPairBtn.addEventListener("click", function() {
    chrome.storage.local.get(["publicKey", "privateKey"], function(result) {
      if (result.hasOwnProperty("publicKey") && result.hasOwnProperty("privateKey")) {
        alert("You already generated a key pair. Note: A key pair can only be generated once.")
      } else {
        passwordPrompt(function(userPassword) {
          keyPairBtn.style.display = "none";
          keyPairLoadingIndicator.style.display = "block";
          var crypt = new JSEncrypt({default_key_size: 2048});
          crypt.getKey();

          chrome.runtime.sendMessage({pubKey: crypt.getPublicKeyB64()});

          chrome.storage.local.set({
            publicKey: crypt.getPublicKeyB64(),
            privateKey: sjcl.encrypt(userPassword, crypt.getPrivateKeyB64())
          }, function(result) {
            keyPairBtn.style.display = "block";
            keyPairLoadingIndicator.style.display = "none";
            keyPairStatusErr.style.display = "none";
            keyPairStatusOk.style.display = "block";
          });
        });
      }
    });

  });
}
