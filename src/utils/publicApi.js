import { API_BASE_URL } from '../config/environment';

// Public-site data helpers. The activity categories are needed by the navbar, the footer and
// several pages at once, so they are fetched once per page load and shared.
let typesPromise = null;

export function fetchTypes() {
    if (!typesPromise) {
        typesPromise = fetch(`${API_BASE_URL}/api/types`, { headers: { Accept: 'application/json' } })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
            .catch((err) => {
                typesPromise = null; // let the next caller retry
                throw err;
            });
    }
    return typesPromise;
}

// Media paths come back relative to the storage disk ("activities/..."), or already prefixed.
export function mediaUrl(url) {
    if (!url) return '/tagemi_consept.webp';
    const clean = url.replace(/^\/+/, '');
    return clean.startsWith('storage/') ? `${API_BASE_URL}/${clean}` : `${API_BASE_URL}/storage/${clean}`;
}

export function typeImageUrl(type) {
    return type?.image_url ? `${API_BASE_URL}/${type.image_url.replace(/^\/+/, '')}` : '/tagemi_consept.webp';
}
