const BASE_URL = 'http://127.0.0.1:8000';

const MAX_PHOTOS = 100;
let selectedFiles = []; // array of { file, objectURL }

document.addEventListener('DOMContentLoaded', function () {

    // ── On load: pull album name from sessionStorage ──
    const albumName = sessionStorage.getItem('albumName') || '—';
    const bannerEl = document.getElementById('bannerAlbumName');
    if (bannerEl) bannerEl.textContent = albumName;

    // If no album name, redirect back to create-album page
    if (!sessionStorage.getItem('albumName')) {
        alert('No album found. Please create an album first.');
        window.location.href = 'create-album.html';
        return;
    }

    // ── Drop zone setup ──
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function () {
        addFiles(Array.from(this.files));
        this.value = ''; // reset so same files can be re-selected
    });

    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function () {
        this.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(droppedFiles);
    });
});

// ── Add files (respects 100 limit) ──
function addFiles(files) {
    const limitWarning = document.getElementById('limitWarning');
    const remaining = MAX_PHOTOS - selectedFiles.length;

    if (remaining <= 0) {
        if (limitWarning) limitWarning.classList.add('show');
        return;
    }

    let trimmed = false;
    if (files.length > remaining) {
        files = files.slice(0, remaining);
        trimmed = true;
    }

    files.forEach(file => {
        selectedFiles.push({ file, objectURL: URL.createObjectURL(file) });
    });

    if (trimmed) {
        if (limitWarning) limitWarning.classList.add('show');
    } else {
        if (limitWarning) limitWarning.classList.remove('show');
    }

    renderGrid();
}

// ── Render thumbnail grid ──
function renderGrid() {
    const grid = document.getElementById('thumbGrid');
    const countBar = document.getElementById('photoCountBar');
    const countText = document.getElementById('photoCount');

    if (!grid) return;

    grid.innerHTML = '';

    selectedFiles.forEach(function (item, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'thumb-item';

        const img = document.createElement('img');
        img.src = item.objectURL;
        img.alt = item.file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'thumb-remove';
        removeBtn.title = 'Remove photo';
        removeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>`;
        removeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            removePhoto(index);
        });

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        grid.appendChild(wrapper);
    });

    if (selectedFiles.length > 0) {
        if (countBar) countBar.classList.add('visible');
        if (countText) countText.textContent = selectedFiles.length;
    } else {
        if (countBar) countBar.classList.remove('visible');
        const limitWarning = document.getElementById('limitWarning');
        if (limitWarning) limitWarning.classList.remove('show');
    }
}

// ── Remove single photo ──
function removePhoto(index) {
    URL.revokeObjectURL(selectedFiles[index].objectURL);
    selectedFiles.splice(index, 1);
    const limitWarning = document.getElementById('limitWarning');
    if (limitWarning) limitWarning.classList.remove('show');
    renderGrid();
}

// ── Clear all ──
function clearAll() {
    selectedFiles.forEach(item => URL.revokeObjectURL(item.objectURL));
    selectedFiles = [];
    const limitWarning = document.getElementById('limitWarning');
    if (limitWarning) limitWarning.classList.remove('show');
    renderGrid();
}

// ── Upload: send to Django API ──
async function uploadPhotos() {
    const albumName = sessionStorage.getItem('albumName');

    if (!albumName) {
        alert('No album found. Please create an album first.');
        window.location.href = 'create-album.html';
        return;
    }

    if (selectedFiles.length === 0) {
        alert('Please select at least one photo to upload.');
        return;
    }

    // Show loading state
    const btn = document.querySelector('button[onclick="uploadPhotos()"]');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Uploading...';
    }

    // Build FormData — backend expects 'album_name' + 'images' (multiple files)
    const formData = new FormData();
    formData.append('album_name', albumName);
    selectedFiles.forEach(item => {
        formData.append('images', item.file);
    });

    try {
        const response = await fetch(`${BASE_URL}/api/photos/upload/`, {
            method: 'POST',
            body: formData
            // NOTE: do NOT set Content-Type header — browser sets it automatically with boundary for FormData
        });

        const data = await response.json();

        if (response.ok) {
            // Show success overlay
            document.getElementById('finalAlbumName').textContent = albumName;
            document.getElementById('finalPhotoCount').textContent = data.uploaded + ' photo(s)';

            if (data.no_face_detected && data.no_face_detected.length > 0) {
                document.getElementById('finalPhotoCount').textContent +=
                    ` (${data.no_face_detected.length} had no face detected)`;
            }

            document.getElementById('uploadSuccessOverlay').classList.add('show');

            // Clean up object URLs
            selectedFiles.forEach(item => URL.revokeObjectURL(item.objectURL));
            selectedFiles = [];
            renderGrid();
        } else {
            alert(data.error || 'Upload failed. Please try again.');
        }
    } catch (err) {
        alert('Cannot connect to server. Make sure the backend is running.');
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Upload Photos';
        }
    }
}