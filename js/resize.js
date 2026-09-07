// CutImage Resize
(function () {
  var curFile = null, origUrl = "", origW = 0, origH = 0;
  var mode = "scale", percent = 100, targetW = 0, targetH = 0;
  var lockAspect = true, resizing = false, errMsg = "";
  var results = []; // {id, file, resultBlob, resultSrc, width, height, resultSize}

  var PRESETS = [25, 50, 75, 100, 150, 200];

  var $ = function (id) { return document.getElementById(id); };
  var fileIn = $("resize-upload");
  if (!fileIn) return;

  // --- File Input ---
  fileIn.addEventListener("change", function (e) {
    if (e.target.files.length) loadFile(e.target.files[0]);
  });

  // Drag & drop on upload zone - traverse up to find the dropzone div
  var dz = fileIn;
  while (dz && !dz.classList.contains("border-dashed")) {
    dz = dz.parentElement;
  }
  if (!dz) dz = fileIn.parentElement.parentElement;
  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (ev) {
    dz.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); });
  });
  dz.addEventListener("drop", function (e) {
    if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
  });
  // Click on dropzone opens file picker
  dz.addEventListener("click", function (e) {
    if (e.target.tagName !== "LABEL" && e.target !== fileIn) {
      fileIn.click();
    }
  });

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    curFile = file;
    if (origUrl) URL.revokeObjectURL(origUrl);
    origUrl = URL.createObjectURL(file);
    errMsg = "";
    targetW = 0; targetH = 0;

    // Load image to get dimensions
    var img = new Image();
    img.onload = function () {
      origW = img.naturalWidth;
      origH = img.naturalHeight;
      targetW = origW;
      targetH = origH;
      percent = 100;
      // Rebuild UI
      buildEditor();
    };
    img.src = origUrl;
  }

  function buildEditor() {
    // Replace the upload zone with editor + preview
    var parent = dz.parentElement;
    dz.style.display = "none";

    // Remove old editor if exists
    var old = document.getElementById("rz-editor");
    if (old) old.remove();
    var oldR = document.getElementById("rz-results");
    if (oldR) oldR.remove();

    var wrap = document.createElement("div");
    wrap.id = "rz-editor";
    wrap.className = "w-full max-w-[1280px] px-4 md:px-8";
    wrap.innerHTML = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">' +
      // Settings panel
      '<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col justify-between">' +
        '<div class="space-y-8">' +
          '<div class="flex items-center justify-between border-b border-outline-variant pb-4"><h3 class="text-[20px] font-semibold leading-[28px]">Settings</h3><span class="material-symbols-outlined text-on-surface-variant">settings</span></div>' +
          '<div class="space-y-6">' +
            // Mode toggle
            '<div class="flex gap-2">' +
              '<button id="rz-scale-btn" class="px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all ' + (mode === "scale" ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary") + '">Scale</button>' +
              '<button id="rz-exact-btn" class="px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all ' + (mode === "exact" ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary") + '">Exact Dimensions</button>' +
            '</div>' +
            // Scale mode
            '<div id="rz-scale-panel"' + (mode === "scale" ? '' : ' style="display:none"') + '>' +
              '<div class="space-y-4 p-4 bg-surface-container-low rounded-lg">' +
                '<div><label class="text-[13px] font-semibold text-on-surface-variant block mb-2">Scale: ' + percent + '%</label>' +
                '<input type="range" id="rz-pct" min="10" max="300" value="' + percent + '" class="w-full accent-primary"/></div>' +
                '<div class="flex flex-wrap gap-2" id="rz-presets"></div>' +
              '</div>' +
            '</div>' +
            // Exact mode
            '<div id="rz-exact-panel"' + (mode === "exact" ? '' : ' style="display:none"') + '>' +
              '<div class="grid grid-cols-2 gap-4">' +
                '<div class="space-y-2"><label class="text-[14px] font-medium tracking-[0.7px] leading-[20px] text-on-surface-variant block">Width (px)</label>' +
                '<input type="number" id="rz-w" min="1" value="' + targetW + '" class="w-full h-12 bg-surface-container-low border border-outline-variant rounded-lg px-4 focus:ring-2 focus:ring-primary focus:outline-none text-[16px]"/></div>' +
                '<div class="space-y-2"><label class="text-[14px] font-medium tracking-[0.7px] leading-[20px] text-on-surface-variant block">Height (px)</label>' +
                '<input type="number" id="rz-h" min="1" value="' + targetH + '" class="w-full h-12 bg-surface-container-low border border-outline-variant rounded-lg px-4 focus:ring-2 focus:ring-primary focus:outline-none text-[16px]"/></div>' +
              '</div>' +
              '<div class="flex items-center justify-between p-4 bg-surface-container-low rounded-lg mt-4">' +
                '<div class="flex items-center gap-3"><span class="material-symbols-outlined text-primary">aspect_ratio</span><span class="text-[16px] leading-[24px]">Maintain aspect ratio</span></div>' +
                '<button id="rz-lock" class="w-12 h-6 rounded-full relative transition-colors ' + (lockAspect ? "bg-primary" : "bg-outline-variant") + '"><span class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ' + (lockAspect ? "left-[26px]" : "left-1") + '"></span></button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // Result size
          '<div id="rz-size-info" class="text-[13px] leading-[16px] text-on-surface-variant pt-2">Result size: <span class="font-semibold text-on-surface">' + targetW + ' x ' + targetH + ' px</span></div>' +
        '</div>' +
        // Resize button
        '<div class="space-y-4 mt-6">' +
          '<button id="rz-go" class="w-full bg-primary text-on-primary h-14 rounded-xl text-[18px] font-semibold leading-[28px] hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">Resize <span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">bolt</span></button>' +
          '<div id="rz-error" class="bg-error-container border border-error rounded-lg p-4 hidden"><p id="rz-errmsg" class="text-[13px] font-medium text-on-error-container"></p></div>' +
        '</div>' +
      '</div>' +
      // Preview panel
      '<div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col">' +
        '<div class="flex items-center justify-between border-b border-outline-variant pb-4 mb-6"><h3 class="text-[20px] font-semibold leading-[28px]">Preview</h3></div>' +
        '<div class="flex-1 flex flex-col items-center justify-center">' +
          '<div class="flex-1 flex items-center justify-center w-full"><img id="rz-preview" src="' + origUrl + '" alt="preview" class="max-w-full max-h-full object-contain rounded-lg"/></div>' +
          '<p id="rz-dims" class="text-[13px] text-on-surface-variant leading-[16px] mt-4">' + origW + ' x ' + origH + ' px</p>' +
        '</div>' +
      '</div>' +
    '</div>';

    parent.insertBefore(wrap, dz.nextSibling);

    // Init presets
    var presetsEl = $("rz-presets");
    PRESETS.forEach(function (p) {
      var b = document.createElement("button");
      b.className = "px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all " + (percent === p ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
      b.textContent = p + "%";
      b.addEventListener("click", function () {
        percent = p;
        updateScaleMode();
        updateSizeInfo();
      });
      presetsEl.appendChild(b);
    });

    // Mode buttons
    $("rz-scale-btn").addEventListener("click", function () { mode = "scale"; updateModeUI(); });
    $("rz-exact-btn").addEventListener("click", function () { mode = "exact"; updateModeUI(); });

    // Scale slider
    $("rz-pct").addEventListener("input", function () {
      percent = +this.value;
      updateScaleMode();
      updateSizeInfo();
    });

    // Exact inputs
    $("rz-w").addEventListener("input", function () {
      targetW = +this.value || 0;
      if (lockAspect && targetW > 0 && origW > 0) {
        targetH = Math.round(targetW * (origH / origW));
        $("rz-h").value = targetH;
      }
      updateSizeInfo();
    });
    $("rz-h").addEventListener("input", function () {
      targetH = +this.value || 0;
      if (lockAspect && targetH > 0 && origH > 0) {
        targetW = Math.round(targetH * (origW / origH));
        $("rz-w").value = targetW;
      }
      updateSizeInfo();
    });

    // Lock aspect
    $("rz-lock").addEventListener("click", function () {
      lockAspect = !lockAspect;
      this.className = "w-12 h-6 rounded-full relative transition-colors " + (lockAspect ? "bg-primary" : "bg-outline-variant");
      this.querySelector("span").className = "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform " + (lockAspect ? "left-[26px]" : "left-1");
    });

    // Resize button
    $("rz-go").addEventListener("click", doResize);

    updateSizeInfo();
  }

  function updateModeUI() {
    $("rz-scale-btn").className = "px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all " + (mode === "scale" ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
    $("rz-exact-btn").className = "px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all " + (mode === "exact" ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
    $("rz-scale-panel").style.display = mode === "scale" ? "" : "none";
    $("rz-exact-panel").style.display = mode === "exact" ? "" : "none";
    if (mode === "scale") {
      targetW = Math.round(percent / 100 * origW);
      targetH = Math.round(percent / 100 * origH);
    }
    updateSizeInfo();
  }

  function updateScaleMode() {
    targetW = Math.round(percent / 100 * origW);
    targetH = Math.round(percent / 100 * origH);
    // Update preset buttons
    var btns = $("rz-presets").querySelectorAll("button");
    btns.forEach(function (b, i) {
      b.className = "px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all " + (percent === PRESETS[i] ? "bg-primary-fixed text-primary border-primary" : "border-outline-variant text-on-surface-variant hover:border-primary");
    });
    // Update slider label
    var label = $("rz-pct").parentElement.querySelector("label");
    if (label) label.textContent = "Scale: " + percent + "%";
    // Update preview
    $("rz-preview").src = origUrl;
    $("rz-dims").textContent = origW + " x " + origH + " px";
  }

  function updateSizeInfo() {
    var el = $("rz-size-info");
    if (el) el.innerHTML = 'Result size: <span class="font-semibold text-on-surface">' + targetW + ' x ' + targetH + ' px</span>';
  }

  function doResize() {
    if (!curFile || resizing || targetW <= 0 || targetH <= 0) return;
    resizing = true;
    $("rz-error").className = "bg-error-container border border-error rounded-lg p-4 hidden";
    $("rz-go").disabled = true;
    $("rz-go").textContent = "Resizing...";

    var ext = (curFile.name.split(".").pop() || "png").toLowerCase();
    var mimeMap = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", bmp: "image/bmp" };
    var mime = mimeMap[ext] || "image/png";

    resizeImage(curFile, { width: targetW, height: targetH, format: mime })
      .then(function (blob) {
        var src = URL.createObjectURL(blob);
        var item = {
          id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
          file: curFile,
          resultBlob: blob,
          resultSrc: src,
          width: targetW,
          height: targetH,
          resultSize: blob.size
        };
        results.push(item);
        renderResults();
      })
      .catch(function (e) {
        $("rz-error").className = "bg-error-container border border-error rounded-lg p-4";
        $("rz-errmsg").textContent = e.message || "Resize failed";
      })
      .then(function () {
        resizing = false;
        $("rz-go").disabled = false;
        $("rz-go").innerHTML = 'Resize <span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">bolt</span>';
      });
  }

  async function resizeImage(file, opts) {
    var bmp = await createImageBitmap(file);
    var c = document.createElement("canvas");
    c.width = opts.width;
    c.height = opts.height;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Try createImageBitmap with resize first
    try {
      var resized = await createImageBitmap(file, {
        resizeWidth: opts.width,
        resizeHeight: opts.height,
        resizeQuality: "high"
      });
      ctx.drawImage(resized, 0, 0);
      resized.close();
    } catch (e) {
      // Fallback: progressive downscale
      progressiveDraw(ctx, bmp, opts.width, opts.height);
    }
    bmp.close();

    // Unsharp mask
    unsharpMask(ctx, opts.width, opts.height);

    // Output
    return new Promise(function (ok, no) {
      var q = (opts.format === "image/png") ? undefined : 0.88;
      c.toBlob(function (b) { b ? ok(b) : no(new Error("Resize failed")); }, opts.format, q);
    });
  }

  function progressiveDraw(ctx, img, tw, th) {
    var sw = img.naturalWidth || img.width;
    var sh = img.naturalHeight || img.height;
    if (sw <= tw * 2 && sh <= th * 2) {
      ctx.drawImage(img, 0, 0, tw, th);
      return;
    }
    var w = sw, h = sh, src = img;
    while (w > tw * 2 || h > th * 2) {
      w = Math.max(Math.round(w / 2), tw);
      h = Math.max(Math.round(h / 2), th);
      var tmp = document.createElement("canvas");
      tmp.width = w; tmp.height = h;
      var tctx = tmp.getContext("2d");
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = "high";
      tctx.drawImage(src, 0, 0, w, h);
      src = tmp;
    }
    ctx.drawImage(src, 0, 0, tw, th);
  }

  function unsharpMask(ctx, w, h) {
    var imageData = ctx.getImageData(0, 0, w, h);
    var data = imageData.data;
    var copy = new Uint8ClampedArray(data);
    var kernel = [1/16, 2/16, 1/16, 2/16, 0.25, 2/16, 1/16, 2/16, 1/16];
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idx = (y * w + x) * 4;
        var r = 0, g = 0, b = 0;
        for (var ky = -1; ky <= 1; ky++) {
          for (var kx = -1; kx <= 1; kx++) {
            var ki = ((y + ky) * w + (x + kx)) * 4;
            var kw = kernel[(ky + 1) * 3 + (kx + 1)];
            r += copy[ki] * kw;
            g += copy[ki + 1] * kw;
            b += copy[ki + 2] * kw;
          }
        }
        var dr = data[idx] - r;
        var dg = data[idx + 1] - g;
        var db = data[idx + 2] - b;
        data[idx] = Math.max(0, Math.min(255, data[idx] + 0.5 * dr));
        data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + 0.5 * dg));
        data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + 0.5 * db));
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // --- Results ---
  function renderResults() {
    var old = $("rz-results");
    if (old) old.remove();
    if (!results.length) return;

    var wrap = document.createElement("div");
    wrap.id = "rz-results";
    wrap.className = "w-full max-w-[1280px] px-4 md:px-8";

    // Header
    var hdr = '<div class="flex items-center justify-between pb-4 border-b border-[#c7c4d8]">' +
      '<h2 class="text-[24px] font-semibold text-[#1b1b24] leading-[32px]">Processed Images</h2>' +
      '<div class="flex gap-3 items-center">' +
        '<button id="rz-clearall" class="border border-[#c7c4d8] rounded-lg flex items-center gap-2 px-[17px] py-[9px] text-[14px] font-medium text-[#1b1b24] tracking-[0.7px] leading-[20px] hover:bg-gray-50 transition-colors">Clear All</button>' +
        '<button id="rz-dlall" class="bg-[#3525cd] rounded-lg flex items-center gap-2 py-[9px] px-6 text-[14px] font-medium text-white tracking-[0.7px] leading-[20px] hover:bg-[#2e1fb0] transition-colors">Download All (' + results.length + ')</button>' +
      '</div></div>';

    // Cards grid
    var cards = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    results.forEach(function (item) {
      cards += '<div class="backdrop-blur-[6px] bg-[rgba(255,255,255,0.8)] border border-[#c7c4d8] rounded-[12px] overflow-hidden flex flex-col">' +
        '<div class="bg-[#e4e1ee] relative overflow-hidden"><div class="aspect-[3/2] relative"><img src="' + item.resultSrc + '" alt="' + item.file.name + '" class="w-full h-full object-cover"/></div></div>' +
        '<div class="p-4 flex flex-col gap-3">' +
          '<p class="text-[16px] font-normal text-[#1b1b24] leading-[24px] truncate">' + item.file.name + '</p>' +
          '<div class="grid grid-cols-2 gap-x-2 gap-y-2">' +
            '<div><span class="text-[10px] font-bold text-[#777587] tracking-[1px] uppercase leading-[15px] block">DIMENSIONS</span><span class="text-[12px] font-bold text-[#3525cd] leading-[18px]">' + item.width + ' x ' + item.height + '</span></div>' +
            '<div class="text-right"><span class="text-[10px] font-bold text-[#777587] tracking-[1px] uppercase leading-[15px] block">SIZE</span><span class="text-[12px] font-bold text-[#3525cd] leading-[18px]">' + fmtSize(item.resultSize) + '</span></div>' +
            '<div class="col-span-2"><span class="text-[10px] font-bold text-[#777587] tracking-[1px] uppercase leading-[15px] block">ORIGINAL</span><span class="text-[12px] font-normal text-[#464555] leading-[18px]">' + fmtSize(item.file.size) + '</span></div>' +
          '</div>' +
          '<div class="flex gap-2 items-start">' +
            '<button class="rz-card-dl flex-1 bg-[#3525cd] rounded-lg flex items-center justify-center gap-1 py-[11.5px] text-[12px] font-bold text-white leading-[18px] hover:bg-[#2e1fb0] transition-colors">Download</button>' +
            '<button class="rz-card-rm border border-[#c7c4d8] rounded-lg flex items-center justify-center px-[9px] py-[13.5px] hover:bg-gray-50 transition-colors"><svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1 2.5H11" stroke="#1b1b24" stroke-width="1.5" stroke-linecap="round"/><path d="M2.5 2.5V11.5C2.5 12.3284 3.17157 13 4 13H8C8.82843 13 9.5 12.3284 9.5 11.5V2.5" stroke="#1b1b24" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
          '</div></div></div>';
    });
    cards += '</div>';

    wrap.innerHTML = hdr + cards;

    // Insert after editor
    var editor = $("rz-editor");
    if (editor) editor.parentElement.insertBefore(wrap, editor.nextSibling);
    else parent.insertBefore(wrap, dz.nextSibling);

    // Events
    $("rz-clearall").addEventListener("click", function () {
      results.forEach(function (r) { URL.revokeObjectURL(r.resultSrc); });
      results = [];
      renderResults();
    });
    $("rz-dlall").addEventListener("click", function () {
      results.forEach(function (r, i) {
        setTimeout(function () { dlResult(r); }, 300 * i);
      });
    });

    // Card buttons
    wrap.querySelectorAll(".rz-card-dl").forEach(function (btn, i) {
      btn.addEventListener("click", function () { dlResult(results[i]); });
    });
    wrap.querySelectorAll(".rz-card-rm").forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        URL.revokeObjectURL(results[i].resultSrc);
        results.splice(i, 1);
        renderResults();
      });
    });
  }

  function dlResult(item) {
    var ext = (item.file.name.split(".").pop() || "png");
    var a = document.createElement("a");
    a.href = item.resultSrc;
    a.download = "resized-" + item.width + "x" + item.height + "." + ext;
    a.click();
  }

  function fmtSize(b) {
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  }
})();
