var fingerprintsContainer = document.getElementById("fingerprints-container");

chrome.storage.local.get("fingerprints", function(result) {
  if (!result.hasOwnProperty("fingerprints")) {
    return;
  }

  result.fingerprints.sort(function(a, b) {
    return b.timestamp - a.timestamp;
  }).forEach(function(elem) {
    var tr = window.document.createElement("tr");

    var senderCol = window.document.createElement("td");
    var senderLink = window.document.createElement("a");
    var url = new URL(elem.sender);
    senderLink.innerHTML = url.host;
    senderLink.href = url.href;
    senderLink.title = url.href;
    senderLink.target = "_blank";
    senderCol.appendChild(senderLink);
    tr.appendChild(senderCol);

    var dateCol = window.document.createElement("td");
    dateCol.innerHTML = new Date(elem.timestamp).toString();
    tr.appendChild(dateCol);

    var imageCol = window.document.createElement("td");
    var img = window.document.createElement("img");
    img.className = "responsive-img";
    img.src = elem.image;

    var imageLink = window.document.createElement("a");
    imageLink.appendChild(img);
    imageLink.addEventListener("click", function() {
      chrome.tabs.create({url: elem.image});
    });
    imageLink.title = url.host;
    imageLink.target = "_blank";
    imageLink.style.cursor = "pointer";

    tr.appendChild(imageLink);
    fingerprintsContainer.appendChild(tr);
  });
});
