// CutImage Convert - builds UI dynamically to match original React output
(function () {
  var curFile = null, origUrl = "", resultBlob = null, resultUrl = "";
  var fmt = "WebP", quality = 90, busy = false;
  var MIME = { PNG: "image/png", JPEG: "image/jpeg", WebP: "image/webp", GIF: "image/gif", BMP: "image/bmp", AVIF: "image/avif", "JPEG XL": "image/jxl" };
  var EXT = { PNG: "png", JPEG: "jpg", WebP: "webp", GIF: "gif", BMP: "bmp", AVIF: "avif", "JPEG XL": "jxl" };
  var QFMTS = ["JPEG", "WebP"];
  var ALLFMTS = ["PNG", "JPEG", "WebP", "GIF", "BMP", "AVIF", "JPEG XL"];

  var $ = function (id) { return document.getElementById(id); };
  var dz = $("file-upload");
  if (!dz) return;
  var dropzone = dz.parentElement;

  // Find the upload container (the div with glass-card that holds the dropzone)
  var uploadContainer = dz.closest("div[class*='glass-card']") || dz.parentElement.parentElement;

  // Drag & drop on the whole upload area
  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (ev) {
    uploadContainer.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); });
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    uploadContainer.addEventListener(ev, function () { uploadContainer.classList.add("drag-active"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    uploadContainer.addEventListener(ev, function () { uploadContainer.classList.remove("drag-active"); });
  });
  uploadContainer.addEventListener("drop", function (e) { if (e.dataTransfer.files.length) onFile(e.dataTransfer.files[0]); });
  uploadContainer.addEventListener("click", function (e) { if (e.target.tagName !== "LABEL") dz.click(); });
  dz.addEventListener("change", function (e) { if (e.target.files.length) onFile(e.target.files[0]); });

  function onFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    curFile = file;
    if (origUrl) URL.revokeObjectURL(origUrl);
    origUrl = URL.createObjectURL(file);
    resultBlob = null;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = "";
    // Hide upload zone, show loaded state
    uploadContainer.style.display = "none";
    buildLoadedUI();
  }

  function buildLoadedUI() {
    // Remove old loaded UI if exists
    var old = document.getElementById("cv-loaded");
    if (old) old.remove();
    var oldR = document.getElementById("cv-results");
    if (oldR) oldR.remove();

    var wrap = document.createElement("div");
    wrap.id = "cv-loaded";
    wrap.style.cssText = "width:100%;max-width:896px;margin:0 auto;padding:0 16px;";

    // File info bar
    var fileInfo = document.createElement("div");
    fileInfo.style.cssText = "width:100%;background:white;border:1px solid #c7c4d8;border-radius:12px;padding:20px;margin-bottom:0;";
    fileInfo.innerHTML = '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="background:#e2dfff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>' +
      '<div style="flex:1;min-width:0"><p style="font-size:15px;font-weight:600;color:#1b1b24;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0">' + curFile.name + '</p><p style="font-size:13px;color:#464555;margin:2px 0 0">' + (curFile.size / 1024).toFixed(1) + ' KB</p></div>' +
      '<button id="cv-change" style="font-size:13px;font-weight:500;color:#3525cd;background:none;border:none;cursor:pointer;flex-shrink:0">Change File</button></div>';

    // Format selector bar
    var fmtBar = document.createElement("div");
    fmtBar.style.cssText = "background:#f0ecf9;border:1px solid #c7c4d8;border-radius:12px;padding:24px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:0;";
    var fmtLeft = document.createElement("div");
    fmtLeft.style.cssText = "display:flex;align-items:center;gap:16px;";
    fmtLeft.innerHTML = '<span style="font-size:14px;color:#464555;line-height:20px">Select Format</span>' +
      '<select id="cv-fmt" style="background:white;border:1px solid #c7c4d8;border-radius:8px;padding:8px 16px;font-size:16px;color:#1b1b24;outline:none">' +
      ALLFMTS.map(function (f) { return '<option value="' + f + '"' + (f === fmt ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>';
    var fmtRight = document.createElement("div");
    fmtRight.style.cssText = "display:flex;align-items:center;gap:24px;";
    fmtRight.innerHTML = '<div style="display:flex;align-items:center">' +
      '<div style="width:32px;height:32px;background:#e2dfff;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:-8px;z-index:3"><span style="font-size:10px;font-weight:600;color:#1b1b24">PNG</span></div>' +
      '<div style="width:32px;height:32px;background:#e0e3e5;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:-8px;z-index:2"><span style="font-size:10px;font-weight:600;color:#1b1b24">WEBP</span></div>' +
      '<div style="width:32px;height:32px;background:#e4e1ee;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:1"><span style="font-size:10px;font-weight:600;color:#1b1b24">+3</span></div></div>' +
      '<span style="font-size:14px;font-style:italic;font-weight:500;color:#464555;white-space:nowrap">Local processing</span>';
    fmtBar.appendChild(fmtLeft);
    fmtBar.appendChild(fmtRight);

    // Quality + convert
    var settings = document.createElement("div");
    settings.style.cssText = "background:white;border:1px solid #c7c4d8;border-radius:12px;padding:24px;margin-top:0;";
    settings.innerHTML = '<div id="cv-qrow"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="font-size:13px;font-weight:600;color:#464555">Quality</label><span id="cv-qval" style="font-size:15px;font-weight:700;color:#4f46e5">90%</span></div>' +
      '<input type="range" id="cv-qrange" min="1" max="100" value="90" style="width:100%"></div>' +
      '<div id="cv-err" style="display:none;background:#ffdad6;border:1px solid rgba(186,26,26,0.2);border-radius:8px;padding:16px;margin-top:16px"><p id="cv-errmsg" style="font-size:13px;color:#93000a;font-weight:500"></p></div>' +
      '<button id="cv-convert" style="width:100%;padding:12px;border-radius:12px;background:#4f46e5;color:white;font-size:15px;font-weight:600;border:none;cursor:pointer;margin-top:16px;transition:all 0.15s">Convert</button>';

    wrap.appendChild(fileInfo);
    wrap.appendChild(fmtBar);
    wrap.appendChild(settings);

    // Insert after the upload container's parent
    var parent = uploadContainer.parentElement;
    parent.insertBefore(wrap, uploadContainer.nextSibling);

    // Events
    $("cv-change").addEventListener("click", function () {
      wrap.remove();
      var oldR = document.getElementById("cv-results");
      if (oldR) oldR.remove();
      uploadContainer.style.display = "";
      curFile = null;
      if (origUrl) URL.revokeObjectURL(origUrl);
      origUrl = "";
      dz.value = "";
    });

    $("cv-fmt").addEventListener("change", function () {
      fmt = this.value;
      $("cv-qrow").style.display = QFMTS.indexOf(fmt) >= 0 ? "" : "none";
    });

    $("cv-qrange").addEventListener("input", function () {
      quality = +this.value;
      $("cv-qval").textContent = quality + "%";
      this.style.background = "linear-gradient(to right, #4f46e5 " + quality + "%, #e0e3e5 " + quality + "%)";
    });
    $("cv-qrange").style.background = "linear-gradient(to right, #4f46e5 90%, #e0e3e5 90%)";

    $("cv-convert").addEventListener("click", doConvert);
  }

  function doConvert() {
    if (!curFile || busy) return;
    busy = true;
    $("cv-err").style.display = "none";
    $("cv-convert").disabled = true;
    $("cv-convert").textContent = "Converting...";

    convertImage(curFile, { format: fmt, quality: quality })
      .then(function (blob) {
        resultBlob = blob;
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = URL.createObjectURL(blob);
        buildResults();
      })
      .catch(function (e) {
        $("cv-err").style.display = "block";
        $("cv-errmsg").textContent = e.message || "Conversion failed";
      })
      .then(function () {
        busy = false;
        $("cv-convert").disabled = false;
        $("cv-convert").textContent = "Convert";
      });
  }

  function convertImage(file, opts) {
    return createImageBitmap(file).then(function (bmp) {
      var c = document.createElement("canvas");
      c.width = bmp.width;
      c.height = bmp.height;
      c.getContext("2d").drawImage(bmp, 0, 0);
      bmp.close();
      var mime = MIME[opts.format] || "image/png";
      var q = (opts.format === "JPEG" || opts.format === "WebP") ? opts.quality / 100 : undefined;
      return new Promise(function (ok, no) {
        c.toBlob(function (b) { b ? ok(b) : no(new Error("Conversion failed")); }, mime, q);
      });
    });
  }

  function buildResults() {
    var old = document.getElementById("cv-results");
    if (old) old.remove();

    var wrap = document.createElement("div");
    wrap.id = "cv-results";
    wrap.style.cssText = "width:100%;max-width:896px;margin:32px auto 0;padding:0 16px;";

    var saved = ((1 - resultBlob.size / curFile.size) * 100).toFixed(0);
    var qText = QFMTS.indexOf(fmt) >= 0 ? quality + "% Quality" : "Max Quality";

    wrap.innerHTML = '<div style="background:white;border:1px solid #c7c4d8;border-radius:12px;overflow:hidden">' +
      '<div style="border-bottom:1px solid #c7c4d8;padding:24px"><div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">' +
        '<div style="flex:1;min-width:280px;display:flex;flex-direction:column;gap:8px;align-items:center">' +
          '<span style="font-size:14px;font-weight:500;color:#464555;letter-spacing:0.7px;line-height:20px">Original (' + curFile.name.split(".").pop().toUpperCase() + ')</span>' +
          '<div style="width:100%;background:#f0ecf9;border:1px solid #c7c4d8;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:72px 0"><img src="' + origUrl + '" alt="original" style="max-width:100%;max-height:100%;object-fit:contain"/></div>' +
          '<div style="display:flex;justify-content:space-between;width:100%"><span style="font-size:12px;color:#464555;line-height:16px">' + (curFile.size / 1024 / 1024).toFixed(1) + ' MB</span><span style="font-size:12px;font-weight:700;color:#1b1b24;line-height:16px">' + qText + '</span></div>' +
        '</div>' +
        '<div style="flex:1;min-width:280px;display:flex;flex-direction:column;gap:8px;align-items:center">' +
          '<span style="font-size:14px;font-weight:500;color:#3525cd;letter-spacing:0.7px;line-height:20px">Converted (' + fmt + ')</span>' +
          '<div style="width:100%;background:#f0ecf9;border:1px solid rgba(79,70,229,0.3);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:72px 0"><img src="' + resultUrl + '" alt="converted" style="max-width:100%;max-height:100%;object-fit:contain"/></div>' +
          '<div style="display:flex;justify-content:space-between;width:100%"><span style="font-size:12px;font-weight:700;color:#3525cd;line-height:16px">' + (resultBlob.size / 1024).toFixed(1) + ' KB <span style="color:#c3c0ff;font-weight:400">(-' + saved + '%)</span></span><span style="font-size:12px;color:#464555;line-height:16px">' + qText + '</span></div>' +
        '</div>' +
      '</div></div>' +
      '<div style="display:flex;justify-content:center;padding:24px"><button id="cv-dl" style="background:#3525cd;display:flex;align-items:center;gap:8px;padding:8px 24px;border-radius:9999px;font-size:14px;font-weight:500;color:white;letter-spacing:0.7px;line-height:20px;border:none;cursor:pointer;transition:all 0.15s"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Download</button></div></div>';

    // Insert after loaded UI
    var loaded = $("cv-loaded");
    if (loaded) loaded.parentElement.insertBefore(wrap, loaded.nextSibling);

    $("cv-dl").addEventListener("click", function () {
      var ext = EXT[fmt] || "png";
      var a = document.createElement("a");
      a.href = resultUrl;
      a.download = curFile.name.replace(/\.[^.]+$/, "") + "." + ext;
      a.click();
    });
  }
})();
