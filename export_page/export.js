chrome.storage.local.get(null, function(result) {
  document.body.innerHTML = JSON.stringify(result);
});
