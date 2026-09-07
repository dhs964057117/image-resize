// Shared utilities for all CutImage pages
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function loadImage(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onload = function() { resolve(img); };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function setupDropzone(dropzoneId, fileId, callback) {
    var dropzone = document.getElementById(dropzoneId);
    var fileInput = document.getElementById(fileId);
    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(ev) {
        dropzone.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); });
    });
    ['dragenter', 'dragover'].forEach(function(ev) {
        dropzone.addEventListener(ev, function() { dropzone.classList.add('drag-active'); });
    });
    ['dragleave', 'drop'].forEach(function(ev) {
        dropzone.addEventListener(ev, function() { dropzone.classList.remove('drag-active'); });
    });
    dropzone.addEventListener('drop', function(e) {
        if (e.dataTransfer.files.length > 0) callback(e.dataTransfer.files[0]);
    });
    dropzone.addEventListener('click', function(e) {
        if (e.target.tagName !== 'LABEL') fileInput.click();
    });
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) callback(e.target.files[0]);
    });
}

function downloadCanvas(canvas, filename, type) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL(type);
    link.click();
}
