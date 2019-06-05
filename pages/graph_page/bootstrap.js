var Bootstrap = {
  graph: null,
  simulation: null,
  nodes: [],
  edges: [],
  nodesHashes: [],
  edgesHashes: [],
  start: Date.now(),
  selection: null,
  globalRequests: [],
  linkDistance: 0.75,
  nodeCharge: -0.25,
  rect: null,
  defaultRadius: 14,
  maxNumRequests: 200,
  browsingHistory: [],
  event: null,

  load: function() {
    Bootstrap.event = document.createEvent("Event");
    Bootstrap.event.initEvent("selectionChanged", true, true);

    PasswordModal.load();
    TimeSelectOverlay.load();
    SearchBar.load();
    RequestsModal.load();
    SettingsModal.load();
    GraphPage.load();

    chrome.storage.local.get("privateKey", function(result) {
      if (result.hasOwnProperty("privateKey")) {
        document.getElementById("time-loading-indicator").style.visibility = "visible";
        Bootstrap.decryptPrivateKey(result.privateKey, function(privateKey) {
          GraphPage.renderGraph(1000 * 60 * 60 * 24, privateKey, function() {
            InfoOverlay.load();
            AggregatedDataModal.load();
          });
        });
      }
    });
  },

  decryptPrivateKey: function(encPrivateKey, callback) {
    PasswordModal.showPrompt(function(userPassword) {
      var pk = sjcl.decrypt(userPassword, encPrivateKey);
      callback(pk);
    });
  },

  domainName: function(hostname) {
    var tmp = hostname.split(".");
    return tmp[tmp.length-2] + "." + tmp[tmp.length-1];
  },

  hashCode: function(s) {
    return s.split("").reduce(function(a, b) {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);  
  },

  colorScheme: function(d) {
    if (d.group === 1) {
      return "YellowGreen";
    } else {
      var sended = 0;
      var retrieved = 0;
  
      for (var i=0; i < Bootstrap.edges.length; i++) {
        if (d.id === Bootstrap.edges[i].source) {
          sended += 1;
        } else if (d.id === Bootstrap.edges[i].target) {
          retrieved += 1;
        }
      }
  
      if ((sended < retrieved) && (retrieved > 2)) {
        return "OrangeRed";
      } else {
        return "Wheat";
      }
    }
  }
}

Bootstrap.load();
