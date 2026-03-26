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