var Settings = {
  saveBody: false,

  load: function() {
    setTimeout(Settings.checkSettings, 2500);
  },

  checkSettings: function() {
    setTimeout(Settings.checkSettings, 2500);

    chrome.storage.local.get("settingsBodyFormData", function(result) {
      if (result.hasOwnProperty("settingsBodyFormData")) {
        Settings.saveBody = result.settingsBodyFormData;
      }
    });
  }
}

Settings.load();