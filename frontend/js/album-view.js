const BASE_URL = 'http://127.0.0.1:8000';

// ── State ──
let albumPhotos   = [];       // array of { id, image_url, uploaded_at } from API
let matchedPhotos = [];       // subset that matched the search
let selectedIndices = new Set();
let allSelected = false;

// ════════════════════════════════════════
//  INIT — load album photos from API
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function () {
    const albumName = sessionStorage.getItem('albumName');

    // If no album in session, redirect
    if (!albumName) {
        alert('No album found. Please access an album first.');
        window.location.href = 'access-album.html';
        return;
    }

    // Show album name in banner
    const bannerName = document.getElementById('bannerAlbumName');
    if (bannerName) bannerName.textContent = albumName;

    // Load photos from backend
    await loadAlbumPhotos(albumName);

    // Set up reference photo upload zone
    setupRefUpload();
});

// ── Load all photos from Django API ──
async function loadAlbumPhotos(albumName) {
    const grid  = document.getElementById('albumPreviewGrid');
    const badge = document.getElementById('albumPhotoCount');

    if (grid) grid.innerHTML = '<p style="color:#888;padding:1rem;">Loading photos...</p>';

    try {
        const response = await fetch(`${BASE_URL}/api/photos/${encodeURIComponent(albumName)}/`);
        const data = await response.json();

        if (!response.ok) {
            if (grid) grid.innerHTML = `<p style="color:#e53935;">Error: ${data.error || 'Failed to load photos.'}</p>`;
            return;
        }

        albumPhotos = data.photos || [];

        if (badge) badge.textContent = albumPhotos.length + ' photo' + (albumPhotos.length !== 1 ? 's' : '');

        renderAlbumGrid();

    } catch (err) {
        if (grid) grid.innerHTML = '<p style="color:#e53935;">Cannot connect to server. Make sure the backend is running.</p>';
        console.error(err);
    }
}

// ── Render album preview grid ──
function renderAlbumGrid() {
    const grid  = document.getElementById('albumPreviewGrid');
    const empty = document.getElementById('albumEmpty');

    if (!grid) return;

    if (albumPhotos.length === 0) {
        grid.innerHTML = '';
        if (empty) { grid.appendChild(empty); empty.style.display = 'block'; }
        return;
    }

    if (empty) empty.style.display = 'none';
    grid.innerHTML = '';

    albumPhotos.forEach(function (photo, i) {
        const wrap = document.createElement('div');
        wrap.className = 'album-thumb';
        wrap.title = 'Photo ' + (i + 1);
        wrap.onclick = function () { openLightbox(photo.image_url, 'Photo ' + (i + 1) + ' of ' + albumPhotos.length); };

        const img = document.createElement('img');
        img.src = photo.image_url;
        img.alt = 'Photo ' + (i + 1);
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'album-thumb-overlay';
        overlay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;

        wrap.appendChild(img);
        wrap.appendChild(overlay);
        grid.appendChild(wrap);
    });
}

// ════════════════════════════════════════
//  REFERENCE PHOTO UPLOAD
// ════════════════════════════════════════
let refFile = null; // actual File object — sent directly to the API

function setupRefUpload() {
    const refZone  = document.getElementById('refUploadZone');
    const refInput = document.getElementById('refFileInput');

    if (!refZone || !refInput) return;

    refZone.addEventListener('click', function () { refInput.click(); });

    refInput.addEventListener('change', function () {
        if (this.files && this.files[0]) loadRefPhoto(this.files[0]);
    });

    refZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    refZone.addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
    refZone.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadRefPhoto(file);
    });
}

function loadRefPhoto(file) {
    refFile = file; // store the File object for sending to API

    const previewImg  = document.getElementById('refPreviewImg');
    const refZone     = document.getElementById('refUploadZone');
    const previewWrap = document.getElementById('refPreviewWrap');
    const btnFilter   = document.getElementById('btnFilter');

    if (previewImg)  previewImg.src = URL.createObjectURL(file);
    if (refZone)     refZone.style.display = 'none';
    if (previewWrap) previewWrap.classList.add('has-image');
    if (btnFilter)   btnFilter.disabled = (albumPhotos.length === 0);
}

function changeRefPhoto() {
    refFile = null;

    const previewImg  = document.getElementById('refPreviewImg');
    const refZone     = document.getElementById('refUploadZone');
    const previewWrap = document.getElementById('refPreviewWrap');
    const btnFilter   = document.getElementById('btnFilter');
    const refInput    = document.getElementById('refFileInput');

    if (previewImg)  previewImg.src = '';
    if (refZone)     refZone.style.display = '';
    if (previewWrap) previewWrap.classList.remove('has-image');
    if (btnFilter)   btnFilter.disabled = true;
    if (refInput)    refInput.value = '';

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) resultsSection.classList.remove('show');
}

// ════════════════════════════════════════
//  FACE SEARCH — calls Django API
// ════════════════════════════════════════
async function runFilter() {
    const albumName = sessionStorage.getItem('albumName');

    if (!refFile) { alert('Please upload a reference photo first.'); return; }
    if (albumPhotos.length === 0) { alert('This album has no photos to search through.'); return; }

    const btnFilter = document.getElementById('btnFilter');
    const bar       = document.getElementById('processingBar');
    const fill      = document.getElementById('progressFill');
    const label     = document.getElementById('processingLabel');
    const pct       = document.getElementById('processingPct');

    if (btnFilter) btnFilter.disabled = true;
    if (bar)       bar.classList.add('show');

    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) resultsSection.classList.remove('show');

    // Animate progress bar while waiting for API response
    let progress = 0;
    const phases = [
        { at: 0,  text: 'Analysing reference face…' },
        { at: 30, text: 'Scanning album photos…' },
        { at: 60, text: 'Comparing facial features…' },
        { at: 85, text: 'Finalising matches…' },
    ];
    const interval = setInterval(function () {
        progress = Math.min(progress + Math.random() * 4, 90);
        if (fill)  fill.style.width = progress + '%';
        if (pct)   pct.textContent  = Math.round(progress) + '%';
        phases.forEach(p => { if (progress >= p.at && label) label.textContent = p.text; });
    }, 150);

    // Send to Django API
    const formData = new FormData();
    formData.append('album_name', albumName);
    formData.append('query_image', refFile);

    try {
        const response = await fetch(`${BASE_URL}/api/search/`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Complete the progress bar
        clearInterval(interval);
        if (fill)  fill.style.width = '100%';
        if (pct)   pct.textContent  = '100%';
        if (label) label.textContent = 'Done!';

        await new Promise(r => setTimeout(r, 400));

        if (bar)  bar.classList.remove('show');
        if (fill) fill.style.width = '0%';

        if (!response.ok) {
            alert(data.error || 'Search failed. Please try again.');
            return;
        }

        matchedPhotos = data.matches || [];
        selectedIndices.clear();
        allSelected = false;

        renderResults();

    } catch (err) {
        clearInterval(interval);
        if (bar) bar.classList.remove('show');
        alert('Cannot connect to server. Make sure the backend is running.');
        console.error(err);
    } finally {
        if (btnFilter) btnFilter.disabled = false;
    }
}

// ── Render results grid ──
function renderResults() {
    const section = document.getElementById('resultsSection');
    const grid    = document.getElementById('resultsGrid');
    const noMatch = document.getElementById('noMatches');
    const badge   = document.getElementById('matchCount');

    if (badge)   badge.textContent = matchedPhotos.length;
    if (section) section.classList.add('show');
    if (grid)    grid.innerHTML = '';
    if (noMatch) noMatch.classList.remove('show');

    if (matchedPhotos.length === 0) {
        if (noMatch) noMatch.classList.add('show');
        updateSelectionUI();
        return;
    }

    matchedPhotos.forEach(function (match, i) {
        const wrap = document.createElement('div');
        wrap.className = 'result-thumb';
        wrap.dataset.index = i;

        const img = document.createElement('img');
        img.src     = match.image_url;
        img.alt     = 'Match ' + (i + 1);
        img.loading = 'lazy';

        const checkbox = document.createElement('div');
        checkbox.className = 'result-checkbox';
        checkbox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>`;

        const conf = document.createElement('div');
        conf.className = 'match-tag';
        conf.textContent = match.similarity + '%'; // real similarity score from API

        const viewIcon = document.createElement('div');
        viewIcon.className = 'result-view-icon';
        viewIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;

        wrap.appendChild(img);
        wrap.appendChild(checkbox);
        wrap.appendChild(conf);
        wrap.appendChild(viewIcon);
        grid.appendChild(wrap);

        // Short click = select, double click = lightbox
        let pressTimer;
        wrap.addEventListener('mousedown', function () {
            pressTimer = setTimeout(function () {
                openLightbox(match.image_url, 'Match ' + (i + 1) + ' — ' + match.similarity + '% match');
            }, 400);
        });
        wrap.addEventListener('mouseup', function () { clearTimeout(pressTimer); });
        wrap.addEventListener('click', function () {
            clearTimeout(pressTimer);
            toggleSelect(i, wrap);
        });
        wrap.addEventListener('dblclick', function (e) {
            e.preventDefault();
            openLightbox(match.image_url, 'Match ' + (i + 1) + ' — ' + match.similarity + '% match');
        });
    });

    updateSelectionUI();
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ════════════════════════════════════════
//  SELECTION & DOWNLOAD
// ════════════════════════════════════════
function toggleSelect(i, el) {
    if (selectedIndices.has(i)) {
        selectedIndices.delete(i);
        el.classList.remove('selected');
    } else {
        selectedIndices.add(i);
        el.classList.add('selected');
    }
    allSelected = selectedIndices.size === matchedPhotos.length;
    updateSelectionUI();
}

function toggleSelectAll() {
    const thumbs = document.querySelectorAll('.result-thumb');
    if (allSelected) {
        selectedIndices.clear();
        thumbs.forEach(el => el.classList.remove('selected'));
        allSelected = false;
    } else {
        matchedPhotos.forEach((_, i) => selectedIndices.add(i));
        thumbs.forEach(el => el.classList.add('selected'));
        allSelected = true;
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    const count        = selectedIndices.size;
    const countLabel   = document.getElementById('selectCountLabel');
    const btnDlSel     = document.getElementById('btnDlSelected');
    const btnSelectAll = document.getElementById('btnSelectAll');
    const btnDlAll     = document.getElementById('btnDlAll');

    if (countLabel)   countLabel.textContent   = count === 0 ? 'Click photos to select' : count + ' selected';
    if (btnDlSel)     btnDlSel.disabled        = count === 0;
    if (btnSelectAll) btnSelectAll.textContent = allSelected ? 'Deselect All' : 'Select All';
    if (btnDlAll)     btnDlAll.disabled        = matchedPhotos.length === 0;
}

// Download selected photos
function downloadSelected() {
    selectedIndices.forEach(function (i) {
        downloadFromUrl(matchedPhotos[i].image_url, 'faceseek_match_' + (i + 1) + '.jpg');
    });
}

// Download all matched photos
function downloadAll() {
    matchedPhotos.forEach(function (match, i) {
        setTimeout(function () {
            downloadFromUrl(match.image_url, 'faceseek_match_' + (i + 1) + '.jpg');
        }, i * 150);
    });
}

// Fetch image from backend URL and trigger browser download
async function downloadFromUrl(url, filename) {
    try {
        const response  = await fetch(url);
        const blob      = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href     = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    } catch (err) {
        console.error('Download failed:', err);
    }
}

// ════════════════════════════════════════
//  LIGHTBOX
// ════════════════════════════════════════
function openLightbox(src, caption) {
    const lightboxImg     = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightbox        = document.getElementById('lightbox');

    if (lightboxImg)     lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    if (lightbox)        lightbox.classList.add('show');
}

function closeLightbox(e) {
    const lightbox = document.getElementById('lightbox');
    if (!e || e.target === lightbox || e.currentTarget === document.querySelector('.lightbox-close')) {
        if (lightbox) lightbox.classList.remove('show');
    }
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) lightbox.classList.remove('show');
    }
});