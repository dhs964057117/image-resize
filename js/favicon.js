// CutImage Favicon Generator
(function () {
  var curFile = null, origUrl = "";
  var selectedSizes = new Set([16, 32, 48]);
  var rounded = false, bgColor = "";
  var generated = []; // [{size, blob}]
  var previewUrls = new Map();
  var generating = false, downloading = false;

  var SIZES = [16, 32, 48, 64, 128, 256];

  var $ = function (id) { return document.getElementById(id); };
  var fileIn = $("favicon-upload");
  if (!fileIn) return;

  // --- Upload ---
  var dz = fileIn.closest("div[class*='border-dashed']") || fileIn.parentElement.parentElement;
  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); });
  });
  dz.addEventListener("drop", function (e) {
    if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dz.addEventListener("click", function (e) {
    if (e.target.tagName !== "LABEL" && e.target !== fileIn) fileIn.click();
  });
  fileIn.addEventListener("change", function (e) {
    if (e.target.files.length) loadFile(e.target.files[0]);
  });

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    curFile = file;
    if (origUrl) URL.revokeObjectURL(origUrl);
    origUrl = URL.createObjectURL(file);
    generated = [];
    previewUrls.forEach(function (u) { URL.revokeObjectURL(u); });
    previewUrls = new Map();
    buildLoadedUI();
  }

  function buildLoadedUI() {
    // Remove old loaded UI
    var old = document.getElementById("fv-loaded");
    if (old) old.remove();

    // Find the upload container and insert after it
    var parent = dz.parentElement;

    var wrap = document.createElement("div");
    wrap.id = "fv-loaded";
    wrap.className = "w-full max-w-[896px] mx-margin-x-sm md:mx-margin-x mt-6 space-y-6";

    // File info
    var fileInfo = document.createElement("div");
    fileInfo.className = "bg-surface-container-lowest border border-outline-variant rounded-xl p-5";
    fileInfo.innerHTML = '<div class="flex items-center gap-3">' +
      '<div class="bg-secondary-container rounded-full w-10 h-10 flex items-center justify-center text-primary"><span class="material-symbols-outlined">description</span></div>' +
      '<div><p class="text-[15px] font-semibold leading-[20px]">' + curFile.name + '</p>' +
      '<p class="text-[13px] leading-[16px] text-on-surface-variant">' + (curFile.size / 1024).toFixed(1) + ' KB</p></div></div>';

    // Settings
    var settings = document.createElement("div");
    settings.className = "bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-5";

    // Size selection
    var sizeLabel = document.createElement("label");
    sizeLabel.className = "text-[13px] font-semibold text-on-surface-variant block";
    sizeLabel.textContent = "Select Sizes";

    var sizeBtns = document.createElement("div");
    sizeBtns.className = "flex flex-wrap gap-2";
    SIZES.forEach(function (s) {
      var b = document.createElement("button");
      b.className = "px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all " +
        (selectedSizes.has(s) ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
      b.textContent = s + "x" + s;
      b.addEventListener("click", function () {
        if (selectedSizes.has(s)) selectedSizes.delete(s); else selectedSizes.add(s);
        b.className = "px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all " +
          (selectedSizes.has(s) ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
      });
      sizeBtns.appendChild(b);
    });

    // Options row
    var opts = document.createElement("div");
    opts.className = "flex flex-wrap items-center gap-4 pt-2";
    opts.innerHTML = '<label class="flex items-center gap-2 text-[13px] font-semibold text-on-surface-variant cursor-pointer">' +
      '<input type="checkbox" id="fv-rounded" class="accent-primary w-4 h-4"/> Rounded corners</label>' +
      '<div class="flex items-center gap-2"><label class="text-[13px] font-semibold text-on-surface-variant">Background:</label>' +
      '<input type="color" id="fv-bgcolor" value="#ffffff" class="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-surface-container-lowest"/></div>' +
      '<button id="fv-transparent" class="px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all bg-primary-fixed text-primary border-primary">Transparent</button>';

    // Generate button
    var genBtn = document.createElement("button");
    genBtn.id = "fv-generate";
    genBtn.className = "w-full py-3 rounded-xl text-white text-[15px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg bg-primary hover:bg-primary-container";
    genBtn.textContent = "Generate";

    // Error
    var errDiv = document.createElement("div");
    errDiv.id = "fv-error";
    errDiv.className = "bg-error-container border border-error rounded-lg p-4 hidden";
    errDiv.innerHTML = '<p id="fv-errmsg" class="text-[13px] font-medium text-on-error-container"></p>';

    // Results
    var resDiv = document.createElement("div");
    resDiv.id = "fv-results";
    resDiv.className = "hidden";

    settings.appendChild(sizeLabel);
    settings.appendChild(sizeBtns);
    settings.appendChild(opts);
    settings.appendChild(genBtn);
    settings.appendChild(errDiv);

    wrap.appendChild(fileInfo);
    wrap.appendChild(settings);
    wrap.appendChild(resDiv);

    parent.insertBefore(wrap, dz.nextSibling);

    // Events
    $("fv-rounded").addEventListener("change", function () { rounded = this.checked; });
    $("fv-bgcolor").addEventListener("input", function () { bgColor = this.value; $("fv-transparent").className = "px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all border-outline-variant text-on-surface-variant hover:border-primary"; });
    $("fv-transparent").addEventListener("click", function () {
      bgColor = "";
      $("fv-bgcolor").value = "#ffffff";
      this.className = "px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all bg-primary-fixed text-primary border-primary";
    });
    $("fv-bgcolor").addEventListener("input", function () {
      $("fv-transparent").className = "px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all border-outline-variant text-on-surface-variant hover:border-primary";
    });
    genBtn.addEventListener("click", doGenerate);
  }

  function doGenerate() {
    if (!curFile || generating || selectedSizes.size === 0) return;
    generating = true;
    $("fv-error").className = "bg-error-container border border-error rounded-lg p-4 hidden";
    $("fv-generate").disabled = true;
    $("fv-generate").textContent = "Generating...";

    generateFavicons(curFile, Array.from(selectedSizes).sort(function (a, b) { return a - b; }), rounded, bgColor)
      .then(function (items) {
        generated = items;
        // Revoke old preview URLs
        previewUrls.forEach(function (u) { URL.revokeObjectURL(u); });
        previewUrls = new Map();
        items.forEach(function (item) {
          previewUrls.set(item.size, URL.createObjectURL(item.blob));
        });
        renderResults();
      })
      .catch(function (e) {
        $("fv-error").className = "bg-error-container border border-error rounded-lg p-4";
        $("fv-errmsg").textContent = e.message || "Generation failed";
      })
      .then(function () {
        generating = false;
        $("fv-generate").disabled = false;
        $("fv-generate").textContent = "Generate";
      });
  }

  async function generateFavicon(srcFile, sizes, round, bgColorVal) {
    var img = await new Promise(function (ok, no) {
      var i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = function () { no(new Error("Failed to load image")); };
      i.src = URL.createObjectURL(srcFile);
    });

    var results = [];
    var hasBg = bgColorVal.length > 0;

    for (var idx = 0; idx < sizes.length; idx++) {
      var size = sizes[idx];
      var c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      var ctx = c.getContext("2d");

      // Fill background
      if (hasBg) {
        ctx.fillStyle = bgColorVal;
        ctx.fillRect(0, 0, size, size);
      }

      // Clip to rounded corners
      if (round) {
        var r = 0.2 * size;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();
      }

      // Draw image centered and cropped to square
      var minDim = Math.min(img.width, img.height);
      var sx = (img.width - minDim) / 2;
      var sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      var blob = await new Promise(function (ok, no) {
        c.toBlob(function (b) { b ? ok(b) : no(new Error("Failed to create favicon at " + size + "x" + size)); }, "image/png");
      });

      results.push({ size: size, blob: blob });
    }

    URL.revokeObjectURL(img.src);
    return results;
  }

  function renderResults() {
    var resEl = $("fv-results");
    if (!generated.length) { resEl.className = "hidden"; return; }
    resEl.className = "bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4";

    var hdr = '<div class="flex items-center justify-between">' +
      '<h4 class="text-[18px] font-semibold leading-[28px]">Generated Favicons</h4>' +
      '<button id="fv-dlall" class="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download All (' + generated.length + ')</button></div>';

    var grid = '<div class="grid grid-cols-3 sm:grid-cols-6 gap-3">';
    generated.forEach(function (item) {
      var url = previewUrls.get(item.size) || "";
      var fname = item.size === 16 ? "favicon-16x16.ico" : "favicon-" + item.size + "x" + item.size + ".png";
      grid += '<div class="bg-surface-container-low rounded-xl p-3 text-center flex flex-col items-center gap-2">' +
        '<div class="flex items-center justify-center rounded-lg" style="width:80px;height:80px"><img src="' + url + '" alt="' + item.size + 'x' + item.size + '" style="width:' + item.size + 'px;height:' + item.size + 'px"/></div>' +
        '<span class="text-[12px] font-semibold text-on-surface-variant">' + item.size + 'x' + item.size + '</span>' +
        '<span class="text-[10px] text-outline">' + (item.blob.size / 1024).toFixed(1) + ' KB</span>' +
        '<button class="fv-dl-btn mt-1 w-full py-1.5 rounded-lg text-[12px] font-semibold transition-all bg-primary text-white hover:opacity-90" data-idx="' + idx + '">Download</button>' +
        '</div>';
    });
    grid += '</div>';

    resEl.innerHTML = hdr + grid;

    // Events
    $("fv-dlall").addEventListener("click", downloadAll);
    resEl.querySelectorAll(".fv-dl-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = +this.dataset.idx;
        downloadSingle(generated[i]);
      });
    });
  }

  function downloadSingle(item) {
    var fname = item.size === 16 ? "favicon-16x16.ico" : "favicon-" + item.size + "x" + item.size + ".png";
    var url = URL.createObjectURL(item.blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fname;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  function downloadAll() {
    if (downloading) return;
    downloading = true;
    var i = 0;
    function next() {
      if (i >= generated.length) { downloading = false; return; }
      downloadSingle(generated[i]);
      i++;
      setTimeout(next, 300);
    }
    next();
  }
})();
