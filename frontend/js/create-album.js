const BASE_URL = 'http://127.0.0.1:8000';

// ── Toggle password visibility ──
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

// ── Flash field red briefly ──
function flashInvalid(el) {
    el.style.borderColor = '#e53935';
    el.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)';
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
    }, 2000);
}

// ── Create Album — calls Django API ──
async function createAlbum() {
    const nameInput = document.getElementById('albumName');
    const codeInput = document.getElementById('generatedCode');
    const name = nameInput.value.trim();
    const code = codeInput.value.trim();

    // Validate inputs
    if (!name) {
        flashInvalid(nameInput);
        nameInput.focus();
        return;
    }

    if (!code) {
        flashInvalid(codeInput);
        codeInput.focus();
        return;
    }

    if (code.length < 8) {
        flashInvalid(codeInput);
        alert('Password must be at least 8 characters.');
        return;
    }

    // Show loading state
    const btn = document.querySelector('.create-btn') || document.querySelector('button[onclick="createAlbum()"]');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating...';
    }

    try {
        const response = await fetch(`${BASE_URL}/api/album/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ album_name: name, password: code })
        });

        const data = await response.json();

        if (response.ok) {
            // Store album name so upload-photos page can use it
            sessionStorage.setItem('albumName', name);

            // Populate and show success overlay
            document.getElementById('successAlbumName').textContent = name;
            document.getElementById('successCode').textContent = code;
            document.getElementById('successOverlay').classList.add('show');
        } else {
            // Show error from backend (e.g. "Album name already taken")
            alert(data.error || 'Failed to create album. Please try again.');
        }
    } catch (err) {
        alert('Cannot connect to server. Make sure the backend is running.');
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Create Album';
        }
    }
}

// ── Enter key support ──
document.addEventListener('DOMContentLoaded', function () {
    const nameInput = document.getElementById('albumName');
    const codeInput = document.getElementById('generatedCode');

    if (nameInput) nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') createAlbum(); });
    if (codeInput) codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') createAlbum(); });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});