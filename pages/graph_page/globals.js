var graph = null;
var simulation = null;
var nodes = [];
var edges = [];
var nodesHashes = [];
var edgesHashes = [];
var start = Date.now();
var selection = null;
var globalRequests = [];
var linkDistance = 0.75;
var nodeCharge = -0.25;
var rect = null;
var defaultRadius = 14;
var maxNumRequests = 200;
var browsingHistory = [];

var event = document.createEvent("Event");
event.initEvent("selectionChanged", true, true);

function domainName(hostname) {
  var tmp = hostname.split(".");
  return tmp[tmp.length-2] + "." + tmp[tmp.length-1];
}

function hashCode(s) {
  return s.split("").reduce(function(a, b) {
		a = ((a << 5) - a) + b.charCodeAt(0);
		return a & a;
	}, 0);
}

function colorScheme(d) {
  if (d.group === 1) {
    return "YellowGreen";
  } else {
    var sended = 0;
    var retrieved = 0;

    for (var i=0; i < edges.length; i++) {
      if (d.id === edges[i].source) {
        sended += 1;
      } else if (d.id === edges[i].target) {
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
