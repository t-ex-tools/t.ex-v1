var Settings = (() => {
  let saveBody = false;
  let checkSettingsInterval = 2500;

  let checkSettings = () => {
    scheduleWorker();
    chrome.storage.local.get("settingsBodyFormData", (result) => 
      Settings.shouldStoreBody(result.settingsBodyFormData || false));
  };

  let scheduleWorker = () => setTimeout(checkSettings, checkSettingsInterval);

  let load = (() => scheduleWorker())();

  return {
    getInterval: () => checkSettingsInterval,
    shouldStoreBody: (saveBody) => saveBody,
  };
})();