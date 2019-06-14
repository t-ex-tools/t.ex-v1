var Tabs = {
  allTabs: {},

  load: function() {
    // load tabs
    chrome.tabs.query({}, function(tabs) {
      for (var i=0; i < tabs.length; i++) {
        Tabs.allTabs[tabs[i].id] = tabs[i];
      }
    });

    // initialize listeners
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      Tabs.allTabs[tabId] = tab;
    });
  },
};

Tabs.load();