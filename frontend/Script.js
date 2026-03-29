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
 
            const combined = existing.concat(base64Array);
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