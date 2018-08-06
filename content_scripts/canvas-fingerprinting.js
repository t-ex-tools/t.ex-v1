// Ninhydrin or Ninhidrina, Violett
function canvasFingerprinting() {
	var standardToBlob = HTMLCanvasElement.prototype.toBlob;
	var standardToDataURL = HTMLCanvasElement.prototype.toDataURL;
	var standardGetImageData = CanvasRenderingContext2D.prototype.getImageData;

  var standardCreateElement = Document.prototype.createElement;
  var standardCreateElementNS = Document.prototype.createElementNS;
  var standardGetElementById = Document.prototype.getElementById;
  var standardGetElementsByName = Document.prototype.getElementsByName;
  var standardGetElementsByClassName = Document.prototype.getElementsByClassName;
  var standardGetElementsByTagName = Document.prototype.getElementsByTagName;
  var standardGetElementsByTagNameNS = Document.prototype.getElementsByTagNameNS;

  var originalCanvasMethods = [
    standardToBlob,
    standardToDataURL,
    standardGetImageData
  ];
  var canvasMethodsToOverride = [
    "toBlob",
    "toDataURL",
    "getImageData"
  ];

  var originalDocumentMethods = [
    standardCreateElement,
    standardCreateElementNS,
    standardGetElementById,
    standardGetElementsByName,
    standardGetElementsByClassName,
    standardGetElementsByTagName,
    standardGetElementsByTagNameNS
  ];
  var documentMethodsToOverride = [
    "createElement",
    "createElementNS",
    "getElementById",
    "getElementsByName",
    "getElementsByClassName",
    "getElementsByTagName",
    "getElementsByTagNameNS"
  ];

  overrideDocumentMethods();
  overrideCanvasMethods(null);

  function overrideCanvasMethods(element) {
    for (var i=0; i < canvasMethodsToOverride.length; i++) {
      var root;
      if (canvasMethodsToOverride[i] === "getImageData") {
        if (element === null) {
          root = CanvasRenderingContext2D;
        } else {
					try {
						root = element.CanvasRenderingContext2D;
					} catch (err) {
						emitAccessError("error, no access to iframe");
						return;
					}
        }
      } else {
        if (element === null) {
          root = HTMLCanvasElement;
        } else {
					try {
						root = element.HTMLCanvasElement;
					} catch (err) {
						emitAccessError("error, no access to iframe");
						return;
					}
        }
      }

      overrideCanvasMethod(i);
    }

    function overrideCanvasMethod(loopIndex) {
      Object.defineProperty(root.prototype, canvasMethodsToOverride[loopIndex], {
        value: function () {
          var width;
          var height;
          var context;
          var imageData;

          if (canvasMethodsToOverride[loopIndex] !== "getImageData") {
            width = this.width;
            height = this.height;
            context = this.getContext("2d");
            try {
              imageData = context.getImageData(0, 0, width, height);
            } catch (err) {
              return "";
            }
          } else {
            imageData = standardGetImageData.apply(this, arguments);
            width = imageData.width;
            height = imageData.height;
          }

					var image = imageData;
					emitFingerprint(image);

          var array = new Uint8Array(4);
          window.crypto.getRandomValues(array);

          for (var j=0; j < height; j++) {
            for (var k=0; k < width; k++) {
              var index = ((j * (width * 4)) + (k * 4));
              imageData.data[index + 0] = imageData.data[index + 0] + noise(array[0]);
              imageData.data[index + 1] = imageData.data[index + 1] + noise(array[1]);
              imageData.data[index + 2] = imageData.data[index + 2] + noise(array[2]);
              imageData.data[index + 3] = imageData.data[index + 3] + noise(array[3]);
            }
          }

          if (canvasMethodsToOverride[loopIndex] !== "getImageData") {
            context.putImageData(imageData, 0, 0);
            return originalCanvasMethods[loopIndex].apply(this, arguments);
          } else {
            return imageData;
          }
        }
      });
    }
  }

  function overrideDocumentMethods() {
    for (var i=0; i < documentMethodsToOverride.length; i++) {
      overrideDocumentMethod(i);
    }

    function overrideDocumentMethod(loopIndex) {
      Object.defineProperty(Document.prototype, documentMethodsToOverride[loopIndex], {
        value: function () {
          var element = originalDocumentMethods[loopIndex].apply(this, arguments);
          if (element === null) {
            return null;
          }

          if (Object.prototype.toString.call(element) === "[object HTMLCollection]" ||
            Object.prototype.toString.call(element) === "[object NodeList]") {
            for (var j=0; j < element.length; j++) {
              inject(element[j]);
            }
          } else {
            inject(element);
          }
          return element;
        }
      });
    }
  }

  function inject(element) {
    if (element.tagName.toUpperCase() === "IFRAME" && element.contentWindow) {
      overrideCanvasMethods(element.contentWindow);
    }
  }

  function noise(value) {
    return (Math.round(Math.random()) * 2 - 1) * (value % 2);
  }

	function emitFingerprint(imageData) {
		window.dispatchEvent(new CustomEvent("fingerprint", {detail: imageData}));
	}

	function emitAccessError(message) {
		window.dispatchEvent(new CustomEvent("accessError", {detail: message}));
	}
}

var fingerprintsArray = [];

window.addEventListener("fingerprint", function (fingerprint) {
	chrome.runtime.sendMessage({
		data: Array.from(fingerprint.detail.data),
		width: fingerprint.detail.width,
		height: fingerprint.detail.height
	}, function(image) {
		if (image.hasOwnProperty("image")) {
			var container = document.getElementById("fingerprints");
			if (container === null) {
				fingerprintsArray.push(image.image);
			} else {
				var imgElement = createImgElement(image.image);
				container.appendChild(imgElement);
			}
		}
	});
});

window.addEventListener("accessError", function (message) {
	chrome.runtime.sendMessage({
		message: message.detail,
		iframeContent: message.currentTarget.elem.parentNode.outerHTML
	});
});

var containerShown = false;

window.addEventListener("DOMContentLoaded", function() {
	var container = window.document.createElement("div");
	container.id = "fingerprints";
	container.style.display = "none";
	container.style.position = "fixed";
	container.style.width = "25%";
	container.style.height = "85%";
	container.style.bottom = "30px";
	container.style.right = "0px";
	// container.style.background = "#00FF00";
	container.style.background = "#565656";
	container.style.border = "1px solid white";
	container.style.padding = "20px";
	container.style.overflow = "scroll";
	container.style.zIndex = 999999999;

	var showHideBtn = window.document.createElement("a");
	showHideBtn.innerHTML = "Show fingerprints";
	// showHideBtn.style.color = "white";
	showHideBtn.style.position = "fixed";
	showHideBtn.style.bottom = "10px";
	showHideBtn.style.right = "10px";
	showHideBtn.style.zIndex = 999999999;
	showHideBtn.style.cursor = "pointer";
	showHideBtn.addEventListener("click", function() {
		containerShown = !containerShown;
		showHideBtn.innerHTML = (containerShown) ? "Hide fingerprints" : "Show fingerprints";
		container.style.display = (containerShown) ? "block" : "none";
	});
	window.document.body.appendChild(showHideBtn);
	window.document.body.appendChild(container);

	for (var i=0; i < fingerprintsArray.length; i++) {
		var imgElement = createImgElement(fingerprintsArray[i]);
		container.appendChild(imgElement);
	}
});

function createImgElement(image) {
	var imgElement = window.document.createElement("img");
	imgElement.src = image;
	return imgElement;
}
