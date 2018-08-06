chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.hasOwnProperty("data")) {
    var image = getImageAsData(sender.url, message.data, message.width, message.height);

    var imgObject = {
      sender: sender.url,
      image: image,
      timestamp: Date.now()
    };
    chrome.storage.local.get("fingerprints", function(result) {
      if (result.hasOwnProperty("fingerprints")) {
        chrome.storage.local.set({fingerprints: result.fingerprints.concat([imgObject])});
      } else {
        chrome.storage.local.set({fingerprints: [imgObject]});
      }
    });

    sendResponse({image: image, sender: sender});
  }
});

function getImageAsData(sender, data, width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  var imageData = ctx.createImageData(width, height);
  imageData.data.set(Uint8ClampedArray.from(data));
  ctx.putImageData(imageData, 0, 0);
  var image = canvas.toDataURL();
  return image;
}
