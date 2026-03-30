const BASE_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', function () {
    const albumName = sessionStorage.getItem('albumName');

    // If no album in session, redirect
    if (!albumName) {
        alert('No album found. Please access an album first.');
        window.location.href = 'access-album.html';
        return;
    }

    // Show album name if element exists
    const bannerEl = document.getElementById('searchAlbumName');
    if (bannerEl) bannerEl.textContent = albumName;

    // ── File input preview ──
    const queryInput = document.getElementById('queryImage');
    if (queryInput) {
        queryInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            const preview = document.getElementById('queryPreview');
            if (preview) {
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            }
        });
    }
});

// ── Run Face Search — calls Django API ──
async function searchFace() {
    const albumName = sessionStorage.getItem('albumName');
    const queryInput = document.getElementById('queryImage');

    if (!queryInput || !queryInput.files[0]) {
        alert('Please select a photo to search with.');
        return;
    }

    if (!albumName) {
        alert('No album found. Please access an album first.');
        window.location.href = 'access-album.html';
        return;
    }

    // Show loading state
    const btn = document.querySelector('button[onclick="searchFace()"]');
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Searching...';
    }

    if (resultsSection) resultsSection.style.display = 'none';

    // Build FormData — backend expects 'album_name' + 'query_image'
    const formData = new FormData();
    formData.append('album_name', albumName);
    formData.append('query_image', queryInput.files[0]);

    try {
        const response = await fetch(`${BASE_URL}/api/search/`, {
            method: 'POST',
            body: formData
            // NOTE: do NOT set Content-Type header — browser sets it automatically for FormData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Search failed. Please try again.');
            return;
        }

        const matches = data.matches || [];

        // Show results section
        if (resultsSection) resultsSection.style.display = '';

        if (matches.length === 0) {
            if (resultsGrid) resultsGrid.innerHTML = '';
            if (noResults) noResults.style.display = '';
            if (resultsCount) resultsCount.textContent = '0 matches found';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        if (resultsCount) resultsCount.textContent = `${matches.length} match(es) found`;

        // Render matched photos
        if (resultsGrid) {
            resultsGrid.innerHTML = '';

            matches.forEach(match => {
                const wrapper = document.createElement('div');
                wrapper.className = 'result-item';

                const img = document.createElement('img');
                img.src = match.image_url;
                img.alt = 'Matched photo';
                img.loading = 'lazy';

                const similarityBadge = document.createElement('div');
                similarityBadge.className = 'similarity-badge';
                similarityBadge.textContent = `${match.similarity}% match`;

                wrapper.appendChild(img);
                wrapper.appendChild(similarityBadge);
                resultsGrid.appendChild(wrapper);
            });
        }

    } catch (err) {
        alert('Cannot connect to server. Make sure the backend is running.');
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Search';
        }
    }
}