const GAS_URL = import.meta.env.VITE_GAS_API_URL || '';

const inFlightMap = new Map();
let writeEpoch = 0;

export function bumpWriteEpoch() {
  writeEpoch += 1;
  return writeEpoch;
}

export function getToken() {
  return localStorage.getItem('appshowcase_admin_token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('appshowcase_admin_token', token);
  } else {
    localStorage.removeItem('appshowcase_admin_token');
  }
}

/**
 * Mengirim request ke Google Apps Script Web App (/exec).
 * Menggunakan Content-Type text/plain;charset=utf-8 agar tidak memicu preflight CORS OPTIONS di GAS.
 */
export async function gasRequest(action, payload = {}, options = {}) {
  const { deduplicate = false, onSessionExpired = null } = options;

  if (!GAS_URL) {
    throw new Error('VITE_GAS_API_URL belum diatur di environment variable (.env / Vercel).');
  }

  const dedupKey = deduplicate ? `${action}:${JSON.stringify(payload)}` : null;
  if (dedupKey && inFlightMap.has(dedupKey)) {
    return inFlightMap.get(dedupKey);
  }

  const epochAtStart = writeEpoch;
  const body = JSON.stringify({
    action,
    token: getToken(),
    payload
  });

  const promise = (async () => {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();

      if (json && json.sesiHabis) {
        setToken('');
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
      }

      return { ...json, _stale: deduplicate && epochAtStart !== writeEpoch };
    } finally {
      if (dedupKey) {
        inFlightMap.delete(dedupKey);
      }
    }
  })();

  if (dedupKey) {
    inFlightMap.set(dedupKey, promise);
  }

  return promise;
}

export function formatRupiah(num) {
  const n = Number(num || 0);
  if (n <= 0) return 'Hubungi Kami';
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function buildWaLink(phone, text) {
  const cleanPhone = String(phone || '6281234567890').replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text || '');
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
