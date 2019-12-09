var Settings = (() => {
  let storeBody = false;
  let checkSettingsInterval = 2500;

  let checkSettings = () => {
    scheduleWorker();
    chrome.storage.local.get("settingsBodyFormData", (result) => 
      Settings.shouldStoreBody(result.settingsBodyFormData || false));
  };

  let scheduleWorker = () => setTimeout(checkSettings, checkSettingsInterval);

  let load = (() => {
    scheduleWorker();
    window.dispatchEvent(new CustomEvent("background:settings:loaded", {detail: {}}));
    return () => true;
  })();

  return {
    isLoaded: () => load(),
    getInterval: () => checkSettingsInterval,
    shouldStoreBody: () => storeBody,
  };
})();