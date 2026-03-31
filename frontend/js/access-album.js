const BASE_URL = 'http://127.0.0.1:8000';

// ── Toggle password visibility ──
function toggleVisibility() {
    const input = document.getElementById('inputAccessCode');
    const iconShow = document.getElementById('iconShow');
    const iconHide = document.getElementById('iconHide');

    if (input.type === 'password') {
        input.type = 'text';
        iconShow.style.display = 'none';
        iconHide.style.display = 'block';
    } else {
        input.type = 'password';
        iconShow.style.display = 'block';
        iconHide.style.display = 'none';
    }
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

// ── Show error banner ──
function showError(msg) {
    const banner = document.getElementById('errorBanner');
    const text = document.getElementById('errorMsg');
    text.innerHTML = msg;
    banner.classList.add('show');
}

// ── Hide error banner ──
function hideError() {
    document.getElementById('errorBanner').classList.remove('show');
}

// ── Access Album — calls Django API ──
async function accessAlbum(e) {
    if (e) e.preventDefault();

    const nameInput = document.getElementById('inputAlbumName');
    const codeInput = document.getElementById('inputAccessCode');
    const name = nameInput.value.trim();
    const code = codeInput.value.trim();

    hideError();

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

    const btn = document.querySelector('.btn-submit');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Checking...';
    }

    try {
        const response = await fetch(`${BASE_URL}/api/album/access/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ album_name: name, password: code })
        });
        const data = await response.json();

        if (response.ok) {
            // Store album name for album-view page
            sessionStorage.setItem('albumName', name);

            // Show success overlay
            document.getElementById('confirmedAlbumName').textContent = name;
            document.getElementById('loginSuccessOverlay').classList.add('show');

            // Auto-redirect after 3 seconds
            setTimeout(() => {
                window.location.href = 'album-view.html';
            }, 3000);

        } else if (response.status === 404) {
            showError('<strong>Album not found.</strong> Please check the album name.');
        } else if (response.status === 401) {
            showError('<strong>Wrong password.</strong> Please check your access code.');
        } else {
            showError(data.error || '<strong>Something went wrong.</strong> Please try again.');
        }

    } catch (err) {
        showError('<strong>Cannot connect to server.</strong> Make sure the backend is running.');
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Access Album';
        }
    }
}

// ── Enter key support ──
document.addEventListener('DOMContentLoaded', function () {
    const nameInput = document.getElementById('inputAlbumName');
    const codeInput = document.getElementById('inputAccessCode');
    if (nameInput) nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') accessAlbum(); });
    if (codeInput) codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') accessAlbum(); });
});