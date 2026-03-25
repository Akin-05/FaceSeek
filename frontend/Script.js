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

// ── Generate a unique code on page load ──
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const accessCode = generateCode();
document.getElementById('generatedCode').textContent = accessCode;

// ── Copy code from main form ──
function copyCode() {
    navigator.clipboard.writeText(accessCode).then(() => {
        const toast = document.getElementById('copyToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1600);
    });
}

// ── Copy code from success card ──
function copySuccessCode() {
    navigator.clipboard.writeText(accessCode).then(() => {
        const btn = document.querySelector('.success-copy-btn');
        btn.style.color = '#2e7d32';
        setTimeout(() => btn.style.color = '', 1200);
    });
}

// ── Create Album ──
function createAlbum() {
    const nameInput = document.getElementById('albumName');
    const name = nameInput.value.trim();

    if (!name) {
        nameInput.focus();
        nameInput.style.borderColor = '#e53935';
        nameInput.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)';
        setTimeout(() => {
            nameInput.style.borderColor = '';
            nameInput.style.boxShadow = '';
        }, 2000);
        return;
    }

    // Populate success card
    document.getElementById('successAlbumName').textContent = name;
    document.getElementById('successCode').textContent = accessCode;

    // Store in sessionStorage so Page 4 can read it
    sessionStorage.setItem('albumName', name);
    sessionStorage.setItem('albumCode', accessCode);

    // Show overlay
    document.getElementById('successOverlay').classList.add('show');
}

// ── Shake input on invalid ──
document.getElementById('albumName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') createAlbum();
});
