import { createAuthClient } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
if (!authUrl) console.warn('VITE_NEON_AUTH_URL is not configured');
export const authClient = createAuthClient(authUrl);

// VITE_API_BASE_URL must be the API origin (or an origin ending in /api/v1).\n// Normalize it so api() never produces /api/v1/api/v1/... .\nconst configuredApiBase = (import.meta.env.VITE_API_BASE_URL || 'https://sdmon-app-api-dev.onrender.com').trim().replace(/\\/$/, '');\nconst apiBase = configuredApiBase.replace(/\\/api\\/v1$/i, '');
const REQUEST_TIMEOUT_MS = 12000;

function withTimeout(promise, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), REQUEST_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

export async function api(path, options = {}) {
  let tokenResult;
  try {
    // Neon Auth exposes getJWTToken() for obtaining the JWT used by our API.
    tokenResult = await withTimeout(
      authClient.getJWTToken(),
      'Délai dépassé pendant la récupération du jeton Neon Auth. Rechargez la page puis reconnectez-vous.'
    );
  } catch (error) {
    throw new Error(error.message || 'Impossible de récupérer le jeton Neon Auth.');
  }

  const token = typeof tokenResult === 'string' ? tokenResult : null;

  if (tokenResult?.error) {
    throw new Error(tokenResult.error.message || 'La session Neon Auth est invalide. Veuillez vous reconnecter.');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('Aucun jeton JWT valide fourni par Neon Auth. Déconnectez-vous puis reconnectez-vous.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${body.error || `Erreur API (${response.status})`} — ${response.status} sur ${apiBase}/api/v1${path}`);
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`Délai dépassé : le serveur SDMON ne répond pas pour ${path}. Vérifiez l'API et sa connexion à la base Neon.`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export { apiBase };
