// CutImage Crop
(function () {
  var cropper = null;
  var curFile = null;
  var curAspect = null;
  var curRotation = 0;
  var origImgUrl = "";

  var RATIOS = [
    { label: "Free", value: null },
    { label: "1:1", value: 1 },
    { label: "16:9", value: 16 / 9 },
    { label: "3:2", value: 1.5 },
    { label: "4:3", value: 4 / 3 },
    { label: "5:4", value: 5 / 4 },
    { label: "9:16", value: 9 / 16 }
  ];

  var fileIn = document.getElementById("crop-upload");
  if (!fileIn) return;
  var rightPanel = fileIn.closest("div").parentElement;
  var aside = document.querySelector("aside");

  fileIn.addEventListener("change", function (e) {
    if (e.target.files.length) loadFile(e.target.files[0]);
  });

  var uploadZone = fileIn.closest("div[class*='border-dashed']") || fileIn.closest("div").parentElement;
  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (ev) {
    uploadZone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); });
  });
  uploadZone.addEventListener("drop", function (e) {
    if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
  });

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    curFile = file;
    curRotation = 0;
    origImgUrl = URL.createObjectURL(file);
    showCropper(origImgUrl);
  }

  // Rotate the original image and return a new data URL
  function rotateImage(srcUrl, degrees, callback) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas");
      var rad = degrees * Math.PI / 180;
      var absDeg = Math.abs(degrees) % 360;
      var swap = (absDeg === 90 || absDeg === 270);
      c.width = swap ? img.height : img.width;
      c.height = swap ? img.width : img.height;
      var ctx = c.getContext("2d");
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      callback(c.toDataURL("image/png"));
    };
    img.src = srcUrl;
  }

  function showCropper(imgUrl) {
    rightPanel.innerHTML = "";

    var wrap = document.createElement("div");
    wrap.className = "flex flex-col gap-6";

    var cropBox = document.createElement("div");
    cropBox.className = "relative w-full h-[500px] rounded-2xl overflow-hidden bg-surface-container-high border border-outline-variant";
    var img = document.createElement("img");
    img.id = "cr-img";
    img.src = imgUrl;
    img.style.cssText = "max-width:100%;display:block;";
    cropBox.appendChild(img);
    wrap.appendChild(cropBox);

    var bar = document.createElement("div");
    bar.className = "flex justify-between items-center p-4 bg-surface-container rounded-xl";
    bar.innerHTML = '<div class="flex gap-6"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-on-surface-variant">zoom_in</span><input type="range" id="cr-zoom" min="1" max="3" step="0.1" value="1" class="w-24 accent-primary"/></div></div>' +
      '<div class="flex gap-4"><button id="cr-reset" class="px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors text-[14px] font-medium leading-[20px]">Reset</button>' +
      '<button id="cr-dl" class="px-6 py-2 bg-primary text-on-primary rounded-lg hover:shadow-lg transition-all text-[14px] font-medium leading-[20px]">Download</button></div>';
    wrap.appendChild(bar);

    var errDiv = document.createElement("div");
    errDiv.id = "cr-error";
    errDiv.className = "bg-error-container border border-error rounded-lg p-4 hidden";
    errDiv.innerHTML = '<p id="cr-errmsg" class="text-[13px] font-medium text-on-error-container"></p>';
    wrap.appendChild(errDiv);

    var resDiv = document.createElement("div");
    resDiv.id = "cr-result";
    resDiv.className = "bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4 hidden";
    wrap.appendChild(resDiv);

    rightPanel.appendChild(wrap);

    cropper = new Cropper(img, {
      aspectRatio: curAspect || NaN,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 0.8,
      responsive: true,
      background: false
    });

    document.getElementById("cr-zoom").addEventListener("input", function () {
      if (cropper) cropper.zoomTo(+this.value);
    });

    document.getElementById("cr-reset").addEventListener("click", function () {
      curRotation = 0;
      curAspect = null;
      highlightRatio();
      showCropper(origImgUrl);
    });

    document.getElementById("cr-dl").addEventListener("click", doCrop);
  }

  function reinitCropper(imgUrl) {
    if (cropper) { cropper.destroy(); cropper = null; }
    var img = document.getElementById("cr-img");
    if (!img) return;
    img.src = imgUrl;
    cropper = new Cropper(img, {
      aspectRatio: curAspect || NaN,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 0.8,
      responsive: true,
      background: false
    });
    // Restore zoom
    var z = document.getElementById("cr-zoom");
    if (z) cropper.zoomTo(+z.value);
  }

  function doCrop() {
    if (!cropper) return;
    var errEl = document.getElementById("cr-error");
    var resEl = document.getElementById("cr-result");
    errEl.className = "bg-error-container border border-error rounded-lg p-4 hidden";

    try {
      var canvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: "high" });
      if (!canvas) throw new Error("Crop failed");
      canvas.toBlob(function (blob) {
        if (!blob) { showErr("Crop failed"); return; }
        var url = URL.createObjectURL(blob);
        resEl.className = "bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4";
        resEl.innerHTML = '<h4 class="text-[18px] font-semibold leading-[28px]">Cropped Result</h4>' +
          '<img src="' + url + '" alt="cropped" class="max-w-full rounded-xl"/>' +
          '<button id="cr-dl2" class="px-6 py-3 rounded-xl text-white text-[15px] font-semibold transition-all hover:shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center gap-2">Download</button>';
        document.getElementById("cr-dl2").addEventListener("click", function () {
          var a = document.createElement("a");
          a.href = url;
          a.download = "cropped-" + (curFile ? curFile.name : "image.png");
          a.click();
        });
      }, "image/png");
    } catch (e) { showErr(e.message || "Crop failed"); }
  }

  function showErr(msg) {
    var el = document.getElementById("cr-error");
    el.className = "bg-error-container border border-error rounded-lg p-4";
    document.getElementById("cr-errmsg").textContent = msg;
  }

  // --- Sidebar: Aspect Ratio ---
  function initRatios() {
    if (!aside) return;
    var ratioGrid = aside.querySelector("div.grid");
    if (!ratioGrid) return;
    var btns = ratioGrid.querySelectorAll("button");
    btns.forEach(function (btn) {
      var spans = btn.querySelectorAll("span");
      var text = spans.length > 1 ? spans[spans.length - 1].textContent.trim() : btn.textContent.trim();
      var r = RATIOS.find(function (x) { return x.label === text; });
      if (r) {
        btn.addEventListener("click", function () {
          curAspect = r.value;
          if (cropper) cropper.setAspectRatio(r.value || NaN);
          highlightRatio();
        });
      }
    });
  }

  function highlightRatio() {
    if (!aside) return;
    var ratioGrid = aside.querySelector("div.grid");
    if (!ratioGrid) return;
    var btns = ratioGrid.querySelectorAll("button");
    btns.forEach(function (btn) {
      var spans = btn.querySelectorAll("span");
      var text = spans.length > 1 ? spans[spans.length - 1].textContent.trim() : btn.textContent.trim();
      var r = RATIOS.find(function (x) { return x.label === text; });
      if (r) {
        var active = curAspect === r.value;
        btn.className = "flex items-center gap-2 p-3 rounded-lg border transition-colors " +
          (active ? "bg-primary-fixed text-on-primary-fixed border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
      }
    });
  }

  // --- Sidebar: Rotate ---
  function initRotate() {
    if (!aside) return;
    var btns = aside.querySelectorAll("button[title]");
    btns.forEach(function (btn) {
      var t = btn.getAttribute("title");
      if (t === "Rotate Left") {
        btn.addEventListener("click", function () {
          curRotation = (curRotation - 90 + 360) % 360;
          rotateImage(origImgUrl, curRotation, function (newUrl) {
            showCropper(newUrl);
          });
        });
      }
      if (t === "Rotate Right") {
        btn.addEventListener("click", function () {
          curRotation = (curRotation + 90) % 360;
          rotateImage(origImgUrl, curRotation, function (newUrl) {
            showCropper(newUrl);
          });
        });
      }
      if (t === "Flip Horizontal") {
        btn.addEventListener("click", function () {
          curRotation = (curRotation + 180) % 360;
          rotateImage(origImgUrl, curRotation, function (newUrl) {
            showCropper(newUrl);
          });
        });
      }
    });
  }

  // --- Sidebar: Apply Crop ---
  function initApplyCrop() {
    if (!aside) return;
    var btns = aside.querySelectorAll("button");
    btns.forEach(function (btn) {
      if (btn.textContent.trim().includes("Apply Crop")) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.addEventListener("click", doCrop);
      }
    });
  }

  setTimeout(function () {
    initRatios();
    initRotate();
    initApplyCrop();
  }, 200);
})();
