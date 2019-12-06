var Tabs = (() => {
  let tabs = {};

  let load = (() => {
    chrome.tabs.query({}, (tabs) => tabs.forEach((e) => Tabs.add(e)))
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => Tabs.add(tab));
  })();

  return {
    add: (tab) => tabs[tab.id] = tab,
  }    
})();

