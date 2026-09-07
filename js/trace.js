// CutImage - Client-Side Image to Vector (SVG) Tracer
(function () {
  'use strict';

  var curFile = null;
  var curImg = null;
  var curMode = 'bw'; // 'bw' or 'color'
  var threshold = 128;
  var turdSize = 2;
  var svgOutput = '';

  var fileInput = document.getElementById('trace-upload');
  if (!fileInput) return;

  var uploadZone = fileInput.closest('.relative.bg-surface-container-lowest') || fileInput.parentElement.parentElement;
  var modeButtons = document.querySelectorAll('.lg\\:col-span-4 button');
  var thresholdInput = document.querySelector('input[type="range"][max="100"]');
  var turdInput = document.querySelector('input[type="range"][max="20"]');
  var thresholdValueSpan = thresholdInput ? thresholdInput.previousElementSibling.querySelector('span') : null;
  var turdValueSpan = turdInput ? turdInput.previousElementSibling.querySelector('span') : null;

  // Threshold slider
  if (thresholdInput) {
    thresholdInput.addEventListener('input', function () {
      var val = parseInt(this.value, 10);
      threshold = Math.round((val / 100) * 255);
      if (thresholdValueSpan) thresholdValueSpan.textContent = val + '%';
      if (curImg) traceImage();
    });
  }

  // Turd Size slider
  if (turdInput) {
    turdInput.addEventListener('input', function () {
      turdSize = parseInt(this.value, 10);
      if (turdValueSpan) turdValueSpan.textContent = turdSize;
      if (curImg) traceImage();
    });
  }

  // Mode buttons (B&W vs Color)
  if (modeButtons.length >= 2) {
    var bwBtn = modeButtons[0];
    var colorBtn = modeButtons[1];

    bwBtn.addEventListener('click', function () {
      curMode = 'bw';
      bwBtn.className = 'flex-1 py-2 text-center rounded-md text-[14px] font-medium leading-[20px] transition-all bg-surface-container-lowest shadow-sm text-primary';
      colorBtn.className = 'flex-1 py-2 text-center rounded-md text-[14px] font-medium leading-[20px] transition-all text-on-surface-variant hover:text-on-surface';
      if (curImg) traceImage();
    });

    colorBtn.addEventListener('click', function () {
      curMode = 'color';
      colorBtn.className = 'flex-1 py-2 text-center rounded-md text-[14px] font-medium leading-[20px] transition-all bg-surface-container-lowest shadow-sm text-primary';
      bwBtn.className = 'flex-1 py-2 text-center rounded-md text-[14px] font-medium leading-[20px] transition-all text-on-surface-variant hover:text-on-surface';
      if (curImg) traceImage();
    });
  }

  // Drag & drop setup
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (ev) {
    uploadZone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  uploadZone.addEventListener('dragenter', function () { uploadZone.classList.add('drag-active'); });
  uploadZone.addEventListener('dragover', function () { uploadZone.classList.add('drag-active'); });
  uploadZone.addEventListener('dragleave', function () { uploadZone.classList.remove('drag-active'); });
  uploadZone.addEventListener('drop', function (e) {
    uploadZone.classList.remove('drag-active');
    if (e.dataTransfer && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', function (e) {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    curFile = file;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        curImg = img;
        traceImage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Trace algorithm (Vector path extraction)
  function traceImage() {
    if (!curImg) return;

    // Limit max resolution for snappy real-time vectorization
    var maxDim = 800;
    var w = curImg.width;
    var h = curImg.height;
    if (w > maxDim || h > maxDim) {
      var scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(curImg, 0, 0, w, h);
    var imgData = ctx.getImageData(0, 0, w, h);
    var pixels = imgData.data;

    var pathsSvg = '';

    if (curMode === 'bw') {
      // Black & white scanline path generator with run-length horizontal span merging
      var step = Math.max(1, turdSize);
      var currentPath = '';

      for (var y = 0; y < h; y += step) {
        var inSpan = false;
        var spanStart = 0;
        for (var x = 0; x < w; x += step) {
          var idx = (y * w + x) * 4;
          var a = pixels[idx + 3];
          var brightness = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
          var isDark = a > 64 && brightness < threshold;

          if (isDark && !inSpan) {
            inSpan = true;
            spanStart = x;
          } else if (!isDark && inSpan) {
            inSpan = false;
            currentPath += 'M' + spanStart + ',' + y + 'h' + (x - spanStart) + 'v' + step + 'h-' + (x - spanStart) + 'Z ';
          }
        }
        if (inSpan) {
          currentPath += 'M' + spanStart + ',' + y + 'h' + (w - spanStart) + 'v' + step + 'h-' + (w - spanStart) + 'Z ';
        }
      }

      pathsSvg = '<path d="' + currentPath + '" fill="#1b1b24" fill-rule="evenodd"/>';
    } else {
      // Color mode: Quantized color palettes
      var step = Math.max(2, turdSize);
      var colorBuckets = {};

      for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
          var idx = (y * w + x) * 4;
          var a = pixels[idx + 3];
          if (a < 32) continue;

          // Quantize RGB to 4 bits per channel (4096 colors)
          var r = Math.round(pixels[idx] / 32) * 32;
          var g = Math.round(pixels[idx + 1] / 32) * 32;
          var b = Math.round(pixels[idx + 2] / 32) * 32;
          var hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

          if (!colorBuckets[hex]) colorBuckets[hex] = '';
          colorBuckets[hex] += 'M' + x + ',' + y + 'h' + step + 'v' + step + 'h-' + step + 'Z ';
        }
      }

      for (var color in colorBuckets) {
        pathsSvg += '<path d="' + colorBuckets[color] + '" fill="' + color + '"/>';
      }
    }

    svgOutput = '<?xml version="1.0" standalone="no"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + curImg.width + '" height="' + curImg.height + '">\n' +
      pathsSvg + '\n</svg>';

    renderResult(w, h);
  }

  function renderResult(w, h) {
    uploadZone.innerHTML = '';
    uploadZone.className = 'relative bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-6 shadow-sm';

    var container = document.createElement('div');
    container.className = 'flex flex-col gap-6';

    // Toolbar
    var toolbar = document.createElement('div');
    toolbar.className = 'flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant';
    toolbar.innerHTML = '<div class="flex items-center gap-3">' +
      '<span class="bg-success text-white text-[12px] font-bold px-2.5 py-1 rounded-full">SVG Ready</span>' +
      '<span class="text-[14px] text-on-surface-variant font-medium">' + curFile.name + ' (' + w + '×' + h + ')</span>' +
      '</div>' +
      '<div class="flex items-center gap-3">' +
      '<button id="trc-reupload" class="px-4 py-2 text-[14px] font-medium border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors">Change Image</button>' +
      '<button id="trc-dl" class="px-6 py-2 bg-primary text-on-primary text-[14px] font-semibold rounded-lg hover:bg-primary-container shadow-sm hover:shadow transition-all flex items-center gap-2">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
      'Download SVG' +
      '</button>' +
      '</div>';
    container.appendChild(toolbar);

    // Preview split
    var previewWrap = document.createElement('div');
    previewWrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';

    // Original preview
    var origCard = document.createElement('div');
    origCard.className = 'flex flex-col gap-2';
    origCard.innerHTML = '<div class="text-[12px] font-bold uppercase text-on-surface-variant tracking-[1px]">Original Bitmap</div>' +
      '<div class="border border-outline-variant rounded-xl p-4 bg-surface-container-low flex items-center justify-center min-h-[300px] overflow-hidden">' +
      '<img src="' + curImg.src + '" class="max-h-[340px] max-w-full object-contain rounded-lg"/>' +
      '</div>';

    // Vector preview
    var vecCard = document.createElement('div');
    vecCard.className = 'flex flex-col gap-2';
    vecCard.innerHTML = '<div class="text-[12px] font-bold uppercase text-primary tracking-[1px]">Vectorized SVG (Infinite Scale)</div>' +
      '<div class="border border-outline-variant rounded-xl p-4 bg-white flex items-center justify-center min-h-[300px] overflow-hidden" id="svg-preview-box">' +
      svgOutput +
      '</div>';

    previewWrap.appendChild(origCard);
    previewWrap.appendChild(vecCard);
    container.appendChild(previewWrap);

    uploadZone.appendChild(container);

    // Bind reupload
    document.getElementById('trc-reupload').addEventListener('click', function () {
      fileInput.value = '';
      uploadZone.className = 'relative bg-surface-container-lowest border border-outline-variant rounded-xl min-h-[320px] flex flex-col shadow-sm';
      uploadZone.innerHTML = '<div class="flex-1 relative flex items-center justify-center m-2 rounded-lg border-2 border-dashed border-outline-variant hover:bg-surface-container-low transition-colors">' +
        '<input type="file" id="trace-upload" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer"/>' +
        '<div class="text-center p-8 pointer-events-none">' +
        '<div class="w-20 h-20 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-6"><span class="material-symbols-outlined text-primary text-[40px]">cloud_upload</span></div>' +
        '<h2 class="text-[24px] font-semibold leading-[32px] mb-2">Drop your image here</h2>' +
        '<p class="text-[16px] leading-[24px] text-on-surface-variant">PNG, JPG, or WEBP (Max 10MB)</p>' +
        '</div></div>';
      fileInput = document.getElementById('trace-upload');
      fileInput.addEventListener('change', function (e) {
        if (e.target.files.length) handleFile(e.target.files[0]);
      });
    });

    // Bind download
    document.getElementById('trc-dl').addEventListener('click', function () {
      var blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var origName = curFile.name.replace(/\.[^/.]+$/, '');
      a.download = origName + '-vector.svg';
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
})();
