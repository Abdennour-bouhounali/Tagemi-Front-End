// Medical documents are served by an authenticated API endpoint, so they can't
// be opened with a plain link: fetch them with the token, then show the blob.

// Types the browser may render inline; anything else is downloaded so that an
// HTML/SVG file can never run in the app's origin.
const INLINE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const fetchProtectedFile = async (url, token) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(res.status === 403 ? 'غير مصرح لك بعرض هذا المستند' : 'تعذر تحميل المستند');
  }
  const blob = await res.blob();
  const type = (res.headers.get('Content-Type') || '').split(';')[0].trim();
  const safeType = INLINE_TYPES.includes(type) ? type : 'application/octet-stream';
  const disposition = res.headers.get('Content-Disposition') || '';
  const filename = (disposition.match(/filename="?([^";]+)"?/) || [])[1] || 'document';
  return { blob: new Blob([blob], { type: safeType }), inline: safeType !== 'application/octet-stream', filename };
};

const triggerDownload = (objectUrl, filename) => {
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const openProtectedFile = async (url, token) => {
  // Open the tab synchronously (inside the click) so popup blockers allow it
  const tab = window.open('', '_blank');
  try {
    const { blob, inline, filename } = await fetchProtectedFile(url, token);
    const objectUrl = URL.createObjectURL(blob);
    if (inline && tab) {
      tab.opener = null;
      tab.location.href = objectUrl;
    } else {
      if (tab) tab.close();
      triggerDownload(objectUrl, filename);
    }
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    if (tab) tab.close();
    alert(error.message);
  }
};

export const downloadProtectedFile = async (url, token, fallbackName) => {
  try {
    const { blob, filename } = await fetchProtectedFile(url, token);
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, filename || fallbackName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    alert(error.message);
  }
};
