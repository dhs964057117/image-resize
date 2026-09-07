// CutImage - Shared utilities and navigation controller
(function () {
  'use strict';

  // Format file size
  window.formatSize = function (bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Load an image file into an HTMLImageElement
  window.loadImage = function (file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Setup standard drag and drop zone
  window.setupDropzone = function (dropzoneId, fileId, callback) {
    var dropzone = document.getElementById(dropzoneId);
    var fileInput = document.getElementById(fileId);
    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      dropzone.addEventListener(ev, function () {
        dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function () {
        dropzone.classList.remove('drag-active');
      });
    });

    dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        callback(e.dataTransfer.files[0], e.dataTransfer.files);
      }
    });

    dropzone.addEventListener('click', function (e) {
      if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length > 0) {
        callback(e.target.files[0], e.target.files);
      }
    });
  };

  // Download canvas image
  window.downloadCanvas = function (canvas, filename, type, quality) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL(type || 'image/png', quality !== undefined ? quality : 0.92);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mobile navigation drawer initialization
  function initMobileMenu() {
    var btn = document.querySelector('button[aria-label="Open menu"]');
    var header = document.querySelector('header');
    if (!btn || !header) return;

    // Check if drawer already exists
    var existingDrawer = document.getElementById('mobile-nav-drawer');
    if (existingDrawer) return;

    var drawer = document.createElement('div');
    drawer.id = 'mobile-nav-drawer';
    drawer.className = 'md:hidden fixed inset-x-0 top-20 bg-surface-bright/95 backdrop-blur-md border-b border-outline-variant shadow-lg z-40 transition-all duration-300 opacity-0 -translate-y-4 pointer-events-none px-6 py-6';
    
    var navLinks = [
      { name: 'Compress', url: 'compress.html' },
      { name: 'Convert', url: 'convert.html' },
      { name: 'Crop', url: 'crop.html' },
      { name: 'Resize', url: 'resize.html' },
      { name: 'Favicon', url: 'favicon.html' },
      { name: 'Trace', url: 'trace.html' },
      { name: 'FAQ', url: 'faq.html' },
      { name: 'Privacy Policy', url: 'privacy.html' },
      { name: 'Terms of Service', url: 'terms.html' }
    ];

    var currentPath = window.location.pathname.split('/').pop() || 'index.html';

    var html = '<nav class="flex flex-col gap-3">';
    navLinks.forEach(function (link) {
      var isActive = currentPath === link.url;
      var activeClass = isActive 
        ? 'text-primary font-semibold bg-primary-fixed/40 px-3 py-2 rounded-lg' 
        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low px-3 py-2 rounded-lg transition-colors';
      html += '<a href="' + link.url + '" class="text-[16px] leading-[24px] ' + activeClass + '">' + link.name + '</a>';
    });
    html += '<div class="pt-4 border-t border-outline-variant"><a href="compress.html" class="block text-center bg-primary text-on-primary py-3 rounded-xl font-medium">Get Started Free</a></div>';
    html += '</nav>';

    drawer.innerHTML = html;
    header.appendChild(drawer);

    var isOpen = false;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen = !isOpen;
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        drawer.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
        drawer.classList.add('opacity-100', 'translate-y-0');
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      } else {
        drawer.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
        drawer.classList.remove('opacity-100', 'translate-y-0');
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      }
    });

    document.addEventListener('click', function (e) {
      if (isOpen && !drawer.contains(e.target) && !btn.contains(e.target)) {
        isOpen = false;
        btn.setAttribute('aria-expanded', 'false');
        drawer.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
        drawer.classList.remove('opacity-100', 'translate-y-0');
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      }
    });
  }

  // Safe Google AdSense helper
  function initAdSense() {
    try {
      var adUnits = document.querySelectorAll('.adsbygoogle');
      if (adUnits.length > 0 && typeof window.adsbygoogle !== 'undefined') {
        adUnits.forEach(function (ad) {
          if (!ad.getAttribute('data-adsbygoogle-status')) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        });
      }
    } catch (e) {
      // AdSense blocked by user or still initializing
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMobileMenu();
      initAdSense();
    });
  } else {
    initMobileMenu();
    initAdSense();
  }

})();
