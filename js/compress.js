// CutImage Compress
(function () {
  var files = [];
  var quality = 80;
  var format = "webp";
  var targetKB = "";
  var pvItem = null;
  var viewMode = "side";

  var MIME = { jpeg: "image/jpeg", webp: "image/webp", png: "image/png", avif: "image/avif", gif: "image/gif" };
  var EXT = { jpeg: "jpg", webp: "webp", png: "png", avif: "avif", gif: "gif" };
  var FMTS = ["jpeg", "webp", "png", "avif", "gif"];
  var LBL = { jpeg: "JPEG", webp: "WebP (Highly Optimized)", png: "PNG", avif: "AVIF", gif: "GIF" };

  var el = function (id) { return document.getElementById(id); };
  var dropzone = el("dropzone");
  var fileIn = el("file-upload");
  if (!dropzone || !fileIn) return;

  // --- Drag & Drop ---
  ["dragenter", "dragover", "dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); });
  });
  ["dragenter", "dragover"].forEach(function (ev) {
    dropzone.addEventListener(ev, function () { dropzone.style.borderColor = "#3525cd"; dropzone.style.background = "rgba(53,37,205,0.03)"; });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function () { dropzone.style.borderColor = ""; dropzone.style.background = ""; });
  });
  dropzone.addEventListener("drop", function (e) { addFiles(e.dataTransfer.files); });
  dropzone.addEventListener("click", function (e) { if (e.target.tagName !== "LABEL") fileIn.click(); });
  fileIn.addEventListener("change", function (e) { addFiles(e.target.files); e.target.value = ""; });

  // --- Format menu ---
  var fmtBtn = el("fmt-btn");
  var fmtMenu = el("fmt-menu");
  var fmtLabel = el("fmt-label");
  var fmtWrap = el("fmt-wrap");
  FMTS.forEach(function (f) {
    var b = document.createElement("button");
    b.className = "w-full text-left px-[17px] py-3 text-[14px] tracking-[0.7px] leading-[20px] transition-colors hover:bg-[#f5f2ff] " + (f === format ? "bg-[#f5f2ff] text-[#3525cd] font-semibold" : "text-[#1b1b24] font-medium");
    b.textContent = LBL[f];
    b.dataset.f = f;
    b.addEventListener("click", function () { setFmt(f); });
    fmtMenu.appendChild(b);
  });
  fmtBtn.addEventListener("click", function (e) { e.stopPropagation(); fmtMenu.classList.toggle("hidden"); });
  document.addEventListener("click", function (e) { if (!fmtWrap.contains(e.target)) fmtMenu.classList.add("hidden"); });

  function setFmt(f) {
    format = f;
    fmtLabel.textContent = LBL[f];
    fmtMenu.querySelectorAll("button").forEach(function (b) {
      b.className = "w-full text-left px-[17px] py-3 text-[14px] tracking-[0.7px] leading-[20px] transition-colors hover:bg-[#f5f2ff] " + (b.dataset.f === f ? "bg-[#f5f2ff] text-[#3525cd] font-semibold" : "text-[#1b1b24] font-medium");
    });
    fmtMenu.classList.add("hidden");
  }

  // --- Quality slider ---
  var qR = el("q-range"), qV = el("q-val"), qT = el("q-thumb"), qF = el("q-fill");
  qR.addEventListener("input", function () {
    quality = +qR.value;
    qV.textContent = quality + "%";
    qT.style.left = "calc(" + quality + "% - 9px)";
    qF.style.width = quality + "%";
  });

  // --- Target size ---
  el("target-kb").addEventListener("input", function () { targetKB = this.value; });

  // --- Buttons ---
  el("btn-compress").addEventListener("click", compressAll);
  el("btn-clear").addEventListener("click", clearAll);
  el("btn-clearall").addEventListener("click", clearAll);
  el("btn-dlall").addEventListener("click", dlAll);
  el("modal-x").addEventListener("click", closePv);
  el("modal").addEventListener("click", function (e) { if (e.target.id === "modal") closePv(); });
  el("v-side").addEventListener("click", function () { viewMode = "side"; updViewBtns(); renderPv(); });
  el("v-split").addEventListener("click", function () { viewMode = "split"; updViewBtns(); renderPv(); });

  // --- File management ---
  function addFiles(list) {
    var arr = Array.from(list).filter(function (f) { return f.type.startsWith("image/"); });
    var max = Math.max(0, 100 - files.length);
    if (arr.length > max) arr = arr.slice(0, max);
    arr.forEach(function (file) {
      files.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 10), file: file, src: URL.createObjectURL(file), status: "pending", blob: null, rsrc: "" });
    });
    showUI();
    renderCards();
  }

  function showUI() {
    var has = files.length > 0;
    el("settings-panel").classList.toggle("hidden", !has);
    el("results-hdr").classList.toggle("hidden", !has);
    el("cards-wrap").classList.toggle("hidden", !has);
  }

  function clearAll() {
    files.forEach(function (f) { URL.revokeObjectURL(f.src); if (f.rsrc) URL.revokeObjectURL(f.rsrc); });
    files = [];
    el("cards").innerHTML = "";
    showUI();
    el("stats").classList.add("hidden");
    el("btn-dlall").classList.add("hidden");
  }

  function rmFile(id) {
    var i = files.findIndex(function (f) { return f.id === id; });
    if (i >= 0) { URL.revokeObjectURL(files[i].src); if (files[i].rsrc) URL.revokeObjectURL(files[i].rsrc); files.splice(i, 1); }
    renderCards();
    showUI();
    updStats();
  }

  // --- Render cards ---
  function renderCards() {
    var c = el("cards");
    c.innerHTML = "";
    files.forEach(function (item) {
      var d = document.createElement("div");
      d.className = "backdrop-blur-[6px] bg-[rgba(255,255,255,0.8)] border border-[#c7c4d8] rounded-[12px] overflow-hidden flex flex-col";

      var spinner = "";
      if (item.status === "busy") spinner = '<div class="absolute inset-0 bg-black/30 flex items-center justify-center"><svg class="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>';

      var info;
      if (item.status === "done" && item.blob) {
        var sv = ((1 - item.blob.size / item.file.size) * 100).toFixed(1);
        info = '<div class="grid grid-cols-2 gap-x-2 gap-y-2"><div><span class="text-[10px] font-bold text-[#777587] tracking-[1px] uppercase leading-[15px] block">Compressed</span><span class="text-[12px] font-bold text-[#3525cd] leading-[18px]">' + fmtSize(item.blob.size) + '</span></div><div class="text-right"><span class="text-[10px] font-bold text-[#777587] tracking-[1px] uppercase leading-[15px] block">Saved</span><span class="text-[12px] font-bold text-[#3525cd] leading-[18px]">' + sv + '%</span></div><div><span class="text-[10px] font-bold text-[#777587] tracking-[1px] uppercase leading-[15px] block">Original</span><span class="text-[12px] font-normal text-[#464555] leading-[18px]">' + fmtSize(item.file.size) + '</span></div></div>';
      } else {
        info = '<div><span class="text-[12px] font-normal text-[#464555] leading-[18px]">' + fmtSize(item.file.size) + '</span></div>';
      }

      var btns = '<div class="flex gap-2 items-start">';
      if (item.status === "done" && item.blob) {
        btns += '<button class="_dl flex-1 border border-[#c7c4d8] rounded-lg flex items-center justify-center gap-1 py-[11.5px] text-[12px] font-bold text-[#1b1b24] leading-[18px] hover:bg-gray-50 transition-colors">Download</button>';
        btns += '<button class="_pv flex-1 bg-[#3525cd] rounded-lg flex items-center justify-center gap-1 py-[11.5px] text-[12px] font-bold text-white leading-[18px] hover:bg-[#2e1fb0] transition-colors">Preview</button>';
      }
      btns += '<button class="_rm border border-[#c7c4d8] rounded-lg flex items-center justify-center px-[9px] py-[13.5px] hover:bg-gray-50 transition-colors"><svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1 2.5H11" stroke="#1b1b24" stroke-width="1.5" stroke-linecap="round"/><path d="M2.5 2.5V11.5C2.5 12.3284 3.17157 13 4 13H8C8.82843 13 9.5 12.3284 9.5 11.5V2.5" stroke="#1b1b24" stroke-width="1.5" stroke-linecap="round"/></svg></button>';
      btns += '</div>';

      var errMsg = "";
      if (item.status === "err" && item.err) errMsg = '<div class="bg-red-50 border border-red-200 rounded-lg p-3"><p class="text-[11px] text-red-600 font-medium">' + item.err + '</p></div>';

      d.innerHTML =
        '<div class="bg-[#e4e1ee] relative overflow-hidden">' +
          '<div class="aspect-[3/2] relative"><img src="' + item.src + '" alt="" class="w-full h-full object-cover"/></div>' +
          '<div class="absolute top-3 right-3 backdrop-blur-[2px] bg-[rgba(53,37,205,0.9)] rounded-[4px] px-2 py-0.5"><span class="text-[10px] font-bold text-white tracking-[0.5px] uppercase leading-[15px]">' + format.toUpperCase() + '</span></div>' +
          spinner +
        '</div>' +
        '<div class="p-4 flex flex-col gap-3">' +
          '<p class="text-[16px] font-normal text-[#1b1b24] leading-[24px] truncate">' + item.file.name + '</p>' +
          info + btns + errMsg +
        '</div>';

      d.querySelector("._rm").addEventListener("click", function () { rmFile(item.id); });
      var dlBtn = d.querySelector("._dl");
      if (dlBtn) dlBtn.addEventListener("click", function () { dlFile(item); });
      var pvBtn = d.querySelector("._pv");
      if (pvBtn) pvBtn.addEventListener("click", function () { openPv(item); });
      c.appendChild(d);
    });
    updStats();
  }

  function updStats() {
    var done = files.filter(function (f) { return f.status === "done"; });
    if (!done.length) { el("stats").classList.add("hidden"); el("btn-dlall").classList.add("hidden"); return; }
    el("stats").classList.remove("hidden");
    el("btn-dlall").classList.remove("hidden");
    var orig = done.reduce(function (s, f) { return s + f.file.size; }, 0);
    var comp = done.reduce(function (s, f) { return s + (f.blob ? f.blob.size : 0); }, 0);
    var sv = orig > 0 ? ((1 - comp / orig) * 100).toFixed(1) : 0;
    el("st-comp").textContent = fmtSize(comp);
    el("st-save").textContent = sv + "%";
    el("st-orig").textContent = fmtSize(orig);
  }

  // --- Compression ---
  function compressAll() {
    var pending = files.filter(function (f) { return f.status !== "done"; });
    if (!pending.length) return;
    el("btn-compress").disabled = true;
    var queue = pending.slice();
    var workers = [];
    for (var i = 0; i < Math.min(3, queue.length); i++) {
      workers.push(runWorker(queue));
    }
    Promise.all(workers).then(function () { el("btn-compress").disabled = false; });
  }

  function runWorker(queue) {
    function next() {
      if (!queue.length) return Promise.resolve();
      var item = queue.shift();
      return compOne(item).then(next);
    }
    return next();
  }

  function compOne(item) {
    item.status = "busy";
    renderCards();
    return doCompress(item.file, { quality: quality, format: format, targetKB: targetKB ? +targetKB : null })
      .then(function (blob) {
        item.status = "done";
        item.blob = blob;
        item.rsrc = URL.createObjectURL(blob);
      })
      .catch(function (e) {
        item.status = "err";
        item.err = e.message || "Failed";
      })
      .then(function () { renderCards(); });
  }

  function doCompress(file, opts) {
    return createImageBitmap(file).then(function (bmp) {
      var c = document.createElement("canvas");
      c.width = bmp.width;
      c.height = bmp.height;
      c.getContext("2d").drawImage(bmp, 0, 0);
      bmp.close();
      var mime = MIME[opts.format] || "image/png";
      if (opts.targetKB && (opts.format === "jpeg" || opts.format === "webp")) {
        return binarySearch(c, mime, opts.targetKB);
      }
      return toBlob(c, mime, opts.quality);
    });
  }

  function binarySearch(c, mime, target) {
    var lo = 1, hi = 100;
    function step() {
      if (lo >= hi) return toBlob(c, mime, lo);
      var mid = Math.round((lo + hi) / 2);
      return toBlob(c, mime, mid).then(function (b) {
        if (b.size / 1024 > target) hi = mid - 1; else lo = mid + 1;
        return step();
      });
    }
    return step();
  }

  function toBlob(c, mime, q) {
    return new Promise(function (ok, no) {
      c.toBlob(function (b) { b ? ok(b) : no(new Error("Compression failed")); }, mime, q / 100);
    });
  }

  // --- Download ---
  function dlFile(item) {
    if (!item.blob) return;
    var a = document.createElement("a");
    a.href = item.rsrc;
    a.download = item.file.name.replace(/\.[^.]+$/, "") + "." + EXT[format];
    a.click();
  }

  function dlAll() {
    files.filter(function (f) { return f.status === "done" && f.blob; }).forEach(function (f, i) {
      setTimeout(function () { dlFile(f); }, 300 * i);
    });
  }

  // --- Preview ---
  function openPv(item) {
    pvItem = item;
    el("modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    renderPv();
  }

  function closePv() {
    el("modal").classList.add("hidden");
    document.body.style.overflow = "";
    pvItem = null;
  }

  function updViewBtns() {
    el("v-side").className = "px-4 py-2 rounded-md text-[16px] leading-[24px] transition-all " + (viewMode === "side" ? "bg-white text-[#3525cd] shadow-sm" : "text-[#444749]");
    el("v-split").className = "px-4 py-2 rounded-md text-[16px] leading-[24px] transition-all " + (viewMode === "split" ? "bg-white text-[#3525cd] shadow-sm" : "text-[#444749]");
  }

  function renderPv() {
    if (!pvItem || !pvItem.rsrc) return;
    var sv = ((1 - pvItem.blob.size / pvItem.file.size) * 100).toFixed(1);
    var body = el("pv-body");

    if (viewMode === "side") {
      renderSideBySide(body, sv);
    } else {
      renderSplit(body);
    }
  }

  function renderSideBySide(body, sv) {
    var wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;gap:24px;flex-wrap:wrap;";

    // Original
    var left = document.createElement("div");
    left.style.cssText = "flex:1;min-width:280px;display:flex;flex-direction:column;gap:12px;";
    var origBox = document.createElement("div");
    origBox.style.cssText = "background:#e4e1ee;border:1px solid #c7c4d8;border-radius:8px;overflow:hidden;position:relative;aspect-ratio:4/3;";
    var origImg = document.createElement("img");
    origImg.src = pvItem.src;
    origImg.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
    var origLbl = document.createElement("div");
    origLbl.style.cssText = "position:absolute;top:12px;left:12px;background:#302f39;border-radius:8px;padding:4px 8px;";
    origLbl.innerHTML = '<span style="font-size:10px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase">Original</span>';
    origBox.appendChild(origImg);
    origBox.appendChild(origLbl);
    var origName = document.createElement("p");
    origName.style.cssText = "font-size:16px;font-weight:500;color:#1b1b24;line-height:24px;word-break:break-all;";
    origName.textContent = pvItem.file.name;
    left.appendChild(origBox);
    left.appendChild(origName);

    // Compressed
    var right = document.createElement("div");
    right.style.cssText = "flex:1;min-width:280px;display:flex;flex-direction:column;gap:12px;";
    var compBox = document.createElement("div");
    compBox.style.cssText = "background:#e4e1ee;border:1px solid rgba(79,70,229,0.3);border-radius:8px;overflow:hidden;position:relative;aspect-ratio:4/3;";
    var compImg = document.createElement("img");
    compImg.src = pvItem.rsrc;
    compImg.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
    var compLbl = document.createElement("div");
    compLbl.style.cssText = "position:absolute;top:12px;right:12px;background:#4f46e5;border-radius:8px;padding:4px 8px;";
    compLbl.innerHTML = '<span style="font-size:10px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase">Compressed</span>';
    compBox.appendChild(compImg);
    compBox.appendChild(compLbl);
    var compInfo = document.createElement("div");
    compInfo.style.cssText = "display:flex;align-items:center;justify-content:space-between;";
    compInfo.innerHTML = '<p style="font-size:16px;color:#464555;line-height:24px">Optimization Output</p><span style="font-size:12px;font-weight:700;color:#3525cd">↓ ' + sv + '%</span>';
    var compName = document.createElement("p");
    compName.style.cssText = "font-size:16px;font-weight:500;color:#1b1b24;line-height:24px;word-break:break-all;";
    compName.textContent = "Optimized " + pvItem.file.name;
    right.appendChild(compBox);
    right.appendChild(compInfo);
    right.appendChild(compName);

    wrap.appendChild(left);
    wrap.appendChild(right);
    body.innerHTML = "";
    body.appendChild(wrap);
  }

  function renderSplit(body) {
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;overflow:hidden;cursor:ew-resize;user-select:none;-webkit-user-select:none;border-radius:8px;border:1px solid #c7c4d8;background:#e4e1ee;aspect-ratio:4/3;width:100%;";

    var compLayer = document.createElement("div");
    compLayer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;";
    var compImg = document.createElement("img");
    compImg.src = pvItem.rsrc;
    compImg.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
    compImg.draggable = false;
    compLayer.appendChild(compImg);

    var origLayer = document.createElement("div");
    origLayer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;clip-path:inset(0 50% 0 0);";
    var origImg = document.createElement("img");
    origImg.src = pvItem.src;
    origImg.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;";
    origImg.draggable = false;
    origLayer.appendChild(origImg);

    var lblO = document.createElement("div");
    lblO.style.cssText = "position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:9999px;font-size:10px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:1px;z-index:5;pointer-events:none;background:rgba(27,27,36,0.6);";
    lblO.textContent = "Original";

    var lblC = document.createElement("div");
    lblC.style.cssText = "position:absolute;top:12px;right:12px;padding:4px 10px;border-radius:9999px;font-size:10px;font-weight:700;color:white;text-transform:uppercase;letter-spacing:1px;z-index:5;pointer-events:none;background:rgba(53,37,205,0.8);";
    lblC.textContent = "Compressed";

    var divider = document.createElement("div");
    divider.style.cssText = "position:absolute;top:0;bottom:0;width:3px;background:#4f46e5;z-index:10;left:50%;pointer-events:none;";

    var handle = document.createElement("div");
    handle.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px;border-radius:50%;background:#4f46e5;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:11;pointer-events:none;";
    handle.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="9 18 3 12 9 6"/><polyline points="15 18 21 12 15 6"/></svg>';

    wrap.appendChild(compLayer);
    wrap.appendChild(origLayer);
    wrap.appendChild(lblO);
    wrap.appendChild(lblC);
    wrap.appendChild(divider);
    wrap.appendChild(handle);
    body.innerHTML = "";
    body.appendChild(wrap);

    // Drag
    var dragging = false;
    function setPos(pct) {
      pct = Math.max(2, Math.min(98, pct));
      origLayer.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
      divider.style.left = pct + "%";
      handle.style.left = pct + "%";
    }
    function move(clientX) {
      var r = wrap.getBoundingClientRect();
      setPos(((clientX - r.left) / r.width) * 100);
    }
    wrap.addEventListener("mousedown", function (e) { dragging = true; move(e.clientX); e.preventDefault(); });
    document.addEventListener("mousemove", function (e) { if (dragging) move(e.clientX); });
    document.addEventListener("mouseup", function () { dragging = false; });
    wrap.addEventListener("touchstart", function (e) { dragging = true; move(e.touches[0].clientX); }, { passive: true });
    document.addEventListener("touchmove", function (e) { if (dragging) { move(e.touches[0].clientX); e.preventDefault(); } }, { passive: false });
    document.addEventListener("touchend", function () { dragging = false; });
  }

  function fmtSize(b) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(2) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }
})();
