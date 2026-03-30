/* --- FEATURE: SMOOTH SCROLL --- */
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});



// let accessCode = '';
if (document.getElementById('generatedCode')) {

    // ── Toggle visibility of the code input ──
    function toggleCodeVisibility() {
        const input = document.getElementById('generatedCode');
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    // ── Copy code from success card ──
    function copySuccessCode() {
        const code = document.getElementById('successCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.querySelector('.success-copy-btn');
            btn.style.color = '#2e7d32';
            setTimeout(() => btn.style.color = '', 1200);
        });
    }

    // ── Create Album ──
    function createAlbum() {
        const nameInput = document.getElementById('albumName');
        const codeInput = document.getElementById('generatedCode');
        const name = nameInput.value.trim();
        const code = codeInput.value.trim().toUpperCase();

        if (!name) {
            nameInput.focus();
            nameInput.style.borderColor = '#e53935';
            nameInput.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)';
            setTimeout(() => { nameInput.style.borderColor = ''; nameInput.style.boxShadow = ''; }, 2000);
            return;
        }

        if (!code) {
            codeInput.focus();
            codeInput.style.borderColor = '#e53935';
            codeInput.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)';
            setTimeout(() => { codeInput.style.borderColor = ''; codeInput.style.boxShadow = ''; }, 2000);
            return;
        }

        // Block duplicate album names
        const existingName = localStorage.getItem('albumName');
        if (existingName && existingName.trim().toLowerCase() === name.toLowerCase()) {
            nameInput.focus();
            nameInput.style.borderColor = '#e53935';
            nameInput.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)';
            setTimeout(() => { nameInput.style.borderColor = ''; nameInput.style.boxShadow = ''; }, 2000);
            alert('An album with this name already exists. Please choose a different name.');
            return;
        }

        // Populate success card
        document.getElementById('successAlbumName').textContent = name;
        document.getElementById('successCode').textContent = code;

        // Store so Page 4 can read it
        localStorage.setItem('albumName', name);
        localStorage.setItem('albumCode', code);

        // Show overlay
        document.getElementById('successOverlay').classList.add('show');
    }

    document.getElementById('albumName').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') createAlbum();
    });
}



// ════════════════════════════════════════
//  PAGE 3b — Upload Photos
// ════════════════════════════════════════
if (document.getElementById('dropZone')) {
 
    const MAX_PHOTOS = 100;
    let selectedFiles = []; // array of { file, objectURL }
 
    // ── On load: pull album name from localStorage ──
    (function init() {
        const name = localStorage.getItem('albumName') || '—';
        document.getElementById('bannerAlbumName').textContent = name;
    })();
 
    // ── Drop zone: click to open file picker ──
    const dropZone  = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
 
    dropZone.addEventListener('click', () => fileInput.click());
 
    fileInput.addEventListener('change', function () {
        addFiles(Array.from(this.files));
        this.value = ''; // reset so same files can be re-added after removal
    });
 
    // ── Drag & drop ──
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
 
    // ── Add files (respects 100 limit) ──
    function addFiles(files) {
        const limitWarning = document.getElementById('limitWarning');
        const remaining = MAX_PHOTOS - selectedFiles.length;
 
        if (remaining <= 0) {
            limitWarning.classList.add('show');
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
            limitWarning.classList.add('show');
        } else {
            limitWarning.classList.remove('show');
        }
 
        renderGrid();
    }
 
    // ── Render thumbnail grid ──
    function renderGrid() {
        const grid      = document.getElementById('thumbGrid');
        const countBar  = document.getElementById('photoCountBar');
        const countText = document.getElementById('photoCount');
 
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
            countBar.classList.add('visible');
            countText.textContent = selectedFiles.length;
        } else {
            countBar.classList.remove('visible');
            document.getElementById('limitWarning').classList.remove('show');
        }
    }
 
    // ── Remove single photo ──
    function removePhoto(index) {
        URL.revokeObjectURL(selectedFiles[index].objectURL);
        selectedFiles.splice(index, 1);
        document.getElementById('limitWarning').classList.remove('show');
        renderGrid();
    }
 
    // ── Clear all ──
    function clearAll() {
        selectedFiles.forEach(item => URL.revokeObjectURL(item.objectURL));
        selectedFiles = [];
        document.getElementById('limitWarning').classList.remove('show');
        renderGrid();
    }
 
    // ── Upload: save to localStorage & show success ──
    function uploadPhotos() {
        const name = localStorage.getItem('albumName') || '';
        const code = localStorage.getItem('albumCode') || '';
 
        const promises = selectedFiles.map(item => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(item.file);
            });
        });
 
        Promise.all(promises).then(function (base64Array) {
            let existing = [];
            try {
                existing = JSON.parse(localStorage.getItem('albumPhotos_' + name)) || [];
            } catch (e) { existing = []; }
 
            const combined = base64Array;
            try {
                localStorage.setItem('albumPhotos_' + name, JSON.stringify(combined));
            } catch (e) {
                alert('Storage limit reached. Try uploading fewer or smaller photos.');
                return;
            }
 
            document.getElementById('finalAlbumName').textContent  = name || '—';
            document.getElementById('finalAlbumCode').textContent  = code || '—';
            document.getElementById('finalPhotoCount').textContent = combined.length + ' photo(s)';
 
            document.getElementById('uploadSuccessOverlay').classList.add('show');
        });
    }
 
    // ── Copy access code from success overlay ──
    function copyFinalCode() {
        const code = document.getElementById('finalAlbumCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.querySelector('.code-copy-btn');
            btn.style.color = '#2e7d32';
            setTimeout(() => btn.style.color = '', 1200);
        });
    }
}
 

// -- PAGE 4 --

// ── Toggle password visibility ──
function toggleVisibility() {
    const input    = document.getElementById('inputAccessCode');
    const iconShow = document.getElementById('iconShow');
    const iconHide = document.getElementById('iconHide');
    if (input.type === 'password') {
        input.type = 'text';
        iconShow.style.display = 'none';
        iconHide.style.display = '';
    } else {
        input.type = 'password';
        iconShow.style.display = '';
        iconHide.style.display = 'none';
    }
}

// ── Flash field red briefly ──
function flashInvalid(el) {
    el.style.borderColor = '#e53935';
    el.style.boxShadow   = '0 0 0 3px rgba(229,57,53,0.1)';
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow   = '';
    }, 2000);
}

// ── Show error banner with shake ──
function showError(msg) {
    const banner = document.getElementById('errorBanner');
    const msgEl  = document.getElementById('errorMsg');
    msgEl.innerHTML = msg;
    banner.classList.remove('show');
    void banner.offsetWidth; // force reflow to re-trigger animation
    banner.classList.add('show');
}

// ── Main access logic ──
function accessAlbum() {
    const nameInput = document.getElementById('inputAlbumName');
    const codeInput = document.getElementById('inputAccessCode');
    const name      = nameInput.value.trim();
    const code      = codeInput.value.trim().toUpperCase();

    if (!name && !code) {
        flashInvalid(nameInput);
        flashInvalid(codeInput);
        showError('<strong>Both fields are required.</strong> Please enter your album name and access code.');
        return;
    }
    if (!name) {
        flashInvalid(nameInput);
        showError('<strong>Album name is required.</strong> Please enter the name of your album.');
        return;
    }
    if (!code) {
        flashInvalid(codeInput);
        showError('<strong>Access code is required.</strong> Please enter your private access code.');
        return;
    }

    // Check against localStorage
    const storedName = localStorage.getItem('albumName');
    const storedCode = localStorage.getItem('albumCode');

    const nameMatch = storedName && storedName.trim().toLowerCase() === name.toLowerCase();
    const codeMatch = storedCode && storedCode.trim().toUpperCase() === code;

    if (nameMatch && codeMatch) {
        sessionStorage.setItem('albumName', storedName);
        sessionStorage.setItem('albumCode', storedCode);
        document.getElementById('confirmedAlbumName').textContent = storedName;
        document.getElementById('loginSuccessOverlay').classList.add('show');
    } else {
        flashInvalid(nameInput);
        flashInvalid(codeInput);
        showError('<strong>Incorrect album name or access code.</strong> Please double-check and try again.');
    }
}

// ── Enter key support ──
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') accessAlbum();
});

// ════════════════════════════════════════
//  PAGE 4b — ALBUM VIEW & FACE FILTER
// ════════════════════════════════════════

// ── State ──
let albumPhotos  = [];      // array of base64 strings from localStorage
let refPhotoData = null;    // base64 of reference face
let matchedPhotos = [];     // subset of albumPhotos that "matched"
let selectedIndices = new Set();  // indices into matchedPhotos
let allSelected = false;

// ── Init: load album from sessionStorage / localStorage ──
(function init() {
    const name = sessionStorage.getItem('albumName') || localStorage.getItem('albumName') || '—';
    const code = sessionStorage.getItem('albumCode') || localStorage.getItem('albumCode') || '—';
    document.getElementById('bannerAlbumName').textContent = name;
    document.getElementById('bannerAlbumCode').textContent = code;

    // Load photos
    try {
        const raw = localStorage.getItem('albumPhotos_' + name);
        albumPhotos = raw ? JSON.parse(raw) : [];
    } catch (e) { albumPhotos = []; }

    renderAlbumGrid();
})();

// ── Enforce expiry: wipe album data if 24hrs passed ──
(function checkExpiry() {
    const name = sessionStorage.getItem('albumName') || localStorage.getItem('albumName');
    if (!name) return;

    const storageKey = 'albumCreatedAt_' + name;
    const createdAt = parseInt(localStorage.getItem(storageKey));
    if (!createdAt) return;

    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const expired = (Date.now() - createdAt) >= TWENTY_FOUR_HOURS;

    if (expired) {
        // Wipe all album data from localStorage
        localStorage.removeItem('albumPhotos_' + name);
        localStorage.removeItem('albumName');
        localStorage.removeItem('albumCode');
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem('albumName');
        sessionStorage.removeItem('albumCode');

        // Show expired message and block the page
        document.querySelector('.page4b-layout').style.display = 'none';
        document.querySelector('.album-info-bar').style.display = 'none';

        const msg = document.createElement('div');
        msg.style.cssText = `
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; min-height: 60vh; text-align: center;
            padding: 40px 24px; gap: 16px;
        `;
        msg.innerHTML = `
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#e53935"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
            <h2 style="font-family:'Outfit',sans-serif; font-size:24px; color:#1b2631;">
                Album Expired
            </h2>
            <p style="font-size:14px; color:#566573; max-width:340px; line-height:1.7;">
                This album has been automatically deleted after 24 hours. 
                All photos have been removed. No data is retained.
            </p>
            <a href="Page2.html" style="
                margin-top:8px; background:#2471a3; color:#fff;
                padding:12px 32px; border-radius:100px;
                text-decoration:none; font-weight:600; font-size:14px;
            ">Create a New Album</a>
        `;
        document.body.insertBefore(msg, document.querySelector('.note'));
    }
})();

// ── Render album preview grid ──
function renderAlbumGrid() {
    const grid  = document.getElementById('albumPreviewGrid');
    const empty = document.getElementById('albumEmpty');
    const badge = document.getElementById('albumPhotoCount');

    badge.textContent = albumPhotos.length + ' photo' + (albumPhotos.length !== 1 ? 's' : '');

    if (albumPhotos.length === 0) {
        grid.innerHTML = '';
        grid.appendChild(empty);
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = '';

    albumPhotos.forEach(function(src, i) {
        const wrap = document.createElement('div');
        wrap.className = 'album-thumb';
        wrap.title = 'Photo ' + (i + 1);
        wrap.onclick = function() { openLightbox(src, 'Photo ' + (i + 1) + ' of ' + albumPhotos.length); };

        const img = document.createElement('img');
        img.src = src;
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

// ── Expiry countdown ──
(function startExpiry() {
    const name = sessionStorage.getItem('albumName') || localStorage.getItem('albumName');
    if (!name) return;

    // Store creation time once, persist it
    const storageKey = 'albumCreatedAt_' + name;
    let createdAt = parseInt(localStorage.getItem(storageKey));
    if (!createdAt) {
        createdAt = Date.now();
        localStorage.setItem(storageKey, createdAt);
    }

    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const chip = document.getElementById('expiryChip');
    const display = document.getElementById('expiryCountdown');

    function update() {
        const elapsed = Date.now() - createdAt;
        const remaining = TWENTY_FOUR_HOURS - elapsed;

        if (remaining <= 0) {
            display.textContent = 'Expired';
            chip.style.background = '#fdecea';
            chip.style.borderColor = '#f5c6cb';
            chip.style.color = '#c0392b';
            return;
        }

        const h = Math.floor(remaining / (1000 * 60 * 60));
        const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((remaining % (1000 * 60)) / 1000);

        display.textContent =
            String(h).padStart(2, '0') + 'h ' +
            String(m).padStart(2, '0') + 'm ' +
            String(s).padStart(2, '0') + 's';

        // Turn chip red in last hour
        if (remaining < 60 * 60 * 1000) {
            chip.style.background = '#fdecea';
            chip.style.borderColor = '#f5c6cb';
            chip.style.color = '#c0392b';
        }

        setTimeout(update, 1000);
    }

    update();
})();

// ── Reference photo upload ──
const refZone  = document.getElementById('refUploadZone');
const refInput = document.getElementById('refFileInput');

refZone.addEventListener('click', function() { refInput.click(); });

refInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        loadRefPhoto(this.files[0]);
    }
});

refZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('drag-over');
});
refZone.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
refZone.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadRefPhoto(file);
});

function loadRefPhoto(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        refPhotoData = e.target.result;
        document.getElementById('refPreviewImg').src = refPhotoData;
        document.getElementById('refUploadZone').style.display  = 'none';
        document.getElementById('refPreviewWrap').classList.add('has-image');
        document.getElementById('btnFilter').disabled = (albumPhotos.length === 0);
    };
    reader.readAsDataURL(file);
}

function changeRefPhoto() {
    refPhotoData = null;
    document.getElementById('refPreviewImg').src = '';
    document.getElementById('refPreviewWrap').classList.remove('has-image');
    document.getElementById('refUploadZone').style.display = '';
    document.getElementById('btnFilter').disabled = true;
    refInput.value = '';
    // Hide results if shown
    document.getElementById('resultsSection').classList.remove('show');
}

// ── Run filter (simulated frontend face-match) ──
function runFilter() {
    if (!refPhotoData || albumPhotos.length === 0) return;

    // Disable button, show progress
    document.getElementById('btnFilter').disabled = true;
    const bar   = document.getElementById('processingBar');
    const fill  = document.getElementById('progressFill');
    const label = document.getElementById('processingLabel');
    const pct   = document.getElementById('processingPct');
    bar.classList.add('show');
    document.getElementById('resultsSection').classList.remove('show');

    let progress = 0;
    const total  = albumPhotos.length;
    const step   = 100 / total;
    const phases = [
        { at: 0,   text: 'Analysing reference face…' },
        { at: 20,  text: 'Scanning album photos…' },
        { at: 60,  text: 'Comparing facial features…' },
        { at: 85,  text: 'Finalising matches…' },
    ];

    const interval = setInterval(function() {
        progress = Math.min(progress + (step * 0.6 + Math.random() * step * 0.8), 100);
        fill.style.width = progress + '%';
        pct.textContent  = Math.round(progress) + '%';

        phases.forEach(function(p) {
            if (progress >= p.at) label.textContent = p.text;
        });

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(function() {
                bar.classList.remove('show');
                document.getElementById('btnFilter').disabled = false;
                fill.style.width = '0%';
                simulateMatches();
            }, 350);
        }
    }, 80);
}

// ── Simulate matching (frontend demo) ──
// In production this would call a face-recognition API.
// Here we randomly pick ~30-70% of photos as "matches" to demo the UI.
function simulateMatches() {
    matchedPhotos  = [];
    selectedIndices.clear();
    allSelected = false;

    // Deterministic-ish: use pixel sum of ref photo length as seed
    const seed = refPhotoData.length % 100;
    albumPhotos.forEach(function(photo, i) {
        // ~40-70% match rate
        if ((i * 37 + seed) % 10 < 6) {
            matchedPhotos.push({ src: photo, index: i });
        }
    });

    renderResults();
}

// ── Render results grid ──
function renderResults() {
    const section  = document.getElementById('resultsSection');
    const grid     = document.getElementById('resultsGrid');
    const noMatch  = document.getElementById('noMatches');
    const badge    = document.getElementById('matchCount');

    badge.textContent = matchedPhotos.length;
    section.classList.add('show');

    grid.innerHTML = '';
    noMatch.classList.remove('show');

    if (matchedPhotos.length === 0) {
        noMatch.classList.add('show');
        updateSelectionUI();
        return;
    }

    const confidenceLevels = ['98%', '95%', '93%', '91%', '88%', '85%'];

    matchedPhotos.forEach(function(item, i) {
        const wrap = document.createElement('div');
        wrap.className = 'result-thumb';
        wrap.dataset.index = i;

        const img = document.createElement('img');
        img.src    = item.src;
        img.alt    = 'Match ' + (i + 1);
        img.loading = 'lazy';

        const checkbox = document.createElement('div');
        checkbox.className = 'result-checkbox';
        checkbox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>`;

        const conf = document.createElement('div');
        conf.className = 'match-tag';
        conf.textContent = confidenceLevels[i % confidenceLevels.length];

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

        // Click: toggle select (short click) vs view (open lightbox via long press / dblclick)
        let pressTimer;
        wrap.addEventListener('mousedown', function() {
            pressTimer = setTimeout(function() {
                openLightbox(item.src, 'Match ' + (i + 1) + ' — confidence ' + conf.textContent);
            }, 400);
        });
        wrap.addEventListener('mouseup', function() { clearTimeout(pressTimer); });
        wrap.addEventListener('click', function() {
            clearTimeout(pressTimer);
            toggleSelect(i, wrap);
        });
        wrap.addEventListener('dblclick', function(e) {
            e.preventDefault();
            openLightbox(item.src, 'Match ' + (i + 1) + ' — confidence ' + conf.textContent);
        });
    });

    updateSelectionUI();
    // Smooth scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Toggle individual select ──
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

// ── Select / Deselect all ──
function toggleSelectAll() {
    const thumbs = document.querySelectorAll('.result-thumb');
    if (allSelected) {
        selectedIndices.clear();
        thumbs.forEach(function(el) { el.classList.remove('selected'); });
        allSelected = false;
    } else {
        matchedPhotos.forEach(function(_, i) { selectedIndices.add(i); });
        thumbs.forEach(function(el) { el.classList.add('selected'); });
        allSelected = true;
    }
    updateSelectionUI();
}

// ── Update count labels + button states ──
function updateSelectionUI() {
    const count = selectedIndices.size;
    document.getElementById('selectCountLabel').textContent =
        count === 0 ? 'Click photos to select' : count + ' selected';
    document.getElementById('btnDlSelected').disabled = count === 0;
    document.getElementById('btnSelectAll').textContent = allSelected ? 'Deselect All' : 'Select All';
    document.getElementById('btnDlAll').disabled = matchedPhotos.length === 0;
}

// ── Download selected photos ──
function downloadSelected() {
    selectedIndices.forEach(function(i) {
        downloadPhoto(matchedPhotos[i].src, 'faceseek_match_' + (i + 1) + '.jpg');
    });
}

// ── Download all matched photos ──
function downloadAll() {
    matchedPhotos.forEach(function(item, i) {
        setTimeout(function() {
            downloadPhoto(item.src, 'faceseek_match_' + (i + 1) + '.jpg');
        }, i * 120);
    });
}

// ── Trigger single file download ──
function downloadPhoto(dataUrl, filename) {
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


function openLightbox(src, caption) {
    document.getElementById('lightboxImg').src     = src;
    document.getElementById('lightboxCaption').textContent = caption || '';
    document.getElementById('lightbox').classList.add('show');
}

function closeLightbox(e) {
    if (!e || e.target === document.getElementById('lightbox') || 
        e.currentTarget === document.querySelector('.lightbox-close')) {
        document.getElementById('lightbox').classList.remove('show');
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') document.getElementById('lightbox').classList.remove('show');
});