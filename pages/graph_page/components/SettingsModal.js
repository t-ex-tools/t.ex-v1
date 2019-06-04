var SettingsModal = {
  settingsView: null,
  settingsModal: null,
  settingsContent: null,
  deleteHistoryBtn: null,
  deleteLoadingIndicator: null,
  deleteHistorySuccess: null,
  bodyFormDataCheckbox: null,
  faviconCheckbox: null,
  settingsExportBtn: null,
  keyPairBtn: null,
  keyPairLoadingIndicator: null,
  keyPairStatusSuccess: null,
  keyPairStatusError: null,

  load: function() {

    // views & container
    SettingsModal.settingsView = document.getElementById("settings-view");
    SettingsModal.settingsModal = new M.Modal(SettingsModal.settingsView, {ready: SettingsModal.modalReadyFunction, endingTop: "4%"});
    SettingsModal.settingsContent = document.getElementById("settings-content");
    
    // status elements
    SettingsModal.deleteHistorySuccess = document.getElementById("delete-history-success");
    SettingsModal.keyPairStatusSuccess = document.getElementById("key-pair-status-ok");
    SettingsModal.keyPairStatusError = document.getElementById("key-pair-status-err");

    // buttons & checkboxes
    SettingsModal.deleteHistoryBtn = document.getElementById("delete-history-btn");
    SettingsModal.bodyFormDataCheckbox = document.getElementById("body-form-data-checkbox");
    SettingsModal.faviconCheckbox = document.getElementById("favicon-checkbox");
    SettingsModal.settingsExportBtn = document.getElementById("settings-export-btn");
    SettingsModal.keyPairBtn = document.getElementById("key-pair-btn");

    // loading indicators
    SettingsModal.deleteLoadingIndicator = document.getElementById("delete-loading-indicator");
    SettingsModal.keyPairLoadingIndicator = document.getElementById("key-pair-loading-indicator");
  
    // click handler
    SettingsModal.deleteHistoryBtn.addEventListener("click", SettingsModal.showDeleteHistoryPrompt);
  
    SettingsModal.bodyFormDataCheckbox.addEventListener("click", function() {
      chrome.storage.local.set({settingsBodyFormData: SettingsModal.bodyFormDataCheckbox.checked}, function() {});
    });
  
    SettingsModal.faviconCheckbox.addEventListener("click", function() {
      chrome.storage.local.set({settingsFavicon: SettingsModal.faviconCheckbox.checked}, function() {});
    });
  
    SettingsModal.settingsExportBtn.addEventListener("click", function() {
      chrome.tabs.create({url: chrome.extension.getURL("pages/export_page/index.html")});
    });
  
    SettingsModal.keyPairBtn.addEventListener("click", SettingsModal.keyPairBtnClick);    
  },

  modalReadyFunction: function() {
    chrome.storage.local.get("settingsBodyFormData", function(result) {
      if (result.hasOwnProperty("settingsBodyFormData")) {
        SettingsModal.bodyFormDataCheckbox.checked = result.settingsBodyFormData;
      } else {
        SettingsModal.bodyFormDataCheckbox.checked = false;
      }
    });
    chrome.storage.local.get("settingsFavicon", function(result) {
      if (result.hasOwnProperty("settingsFavicon")) {
        SettingsModal.faviconCheckbox.checked = result.settingsFavicon;
      } else {
        SettingsModal.faviconCheckbox.checked = false;
      }
    });
    chrome.storage.local.get(["publicKey", "privateKey"], function(result) {
      if (result.hasOwnProperty("publicKey") && result.hasOwnProperty("privateKey")) {
        SettingsModal.keyPairStatusSuccess.style.display = "block";
      } else {
        SettingsModal.keyPairStatusError.style.display = "block";
      }
    });
  },

  showDeleteHistoryPrompt: function() {
    if (confirm("Are you sure? Seriously, we cannot undo it.")) {
      SettingsModal.deleteHistoryBtn.style.display = "none";
      SettingsModal.deleteLoadingIndicator.style.display = "block";

      chrome.runtime.sendMessage({"delete": true});

      chrome.storage.local.clear(function() {
        SettingsModal.deleteHistorySuccess.style.display = "block";
        SettingsModal.deleteLoadingIndicator.style.display = "none";
        setTimeout(function() {
          SettingsModal.deleteHistorySuccess.style.display = "none";
          SettingsModal.deleteHistoryBtn.style.display = "block";

          SettingsModal.keyPairStatusError.style.display = "block";
          SettingsModal.keyPairStatusSuccess.style.display = "none";
        }, 2000);
      });
    }
  },

  keyPairBtnClick: function() {
    chrome.storage.local.get(["publicKey", "privateKey"], function(result) {
      if (result.hasOwnProperty("publicKey") && result.hasOwnProperty("privateKey")) {
        alert("You already generated a key pair. Note: A key pair can only be generated once.")
      } else {
        PasswordModal.showPrompt(function(userPassword) {
          SettingsModal.keyPairBtn.style.display = "none";
          SettingsModal.keyPairLoadingIndicator.style.display = "block";
          var crypt = new JSEncrypt({default_key_size: 2048});
          crypt.getKey();

          chrome.runtime.sendMessage({pubKey: crypt.getPublicKeyB64()});

          chrome.storage.local.set({
            publicKey: crypt.getPublicKeyB64(),
            privateKey: sjcl.encrypt(userPassword, crypt.getPrivateKeyB64())
          }, function(result) {
            SettingsModal.keyPairBtn.style.display = "block";
            SettingsModal.keyPairLoadingIndicator.style.display = "none";
            SettingsModal.keyPairStatusError.style.display = "none";
            SettingsModal.keyPairStatusSuccess.style.display = "block";
          });
        });
      }
    });
  }
}