import { createAuthClient } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
if (!authUrl) console.warn('VITE_NEON_AUTH_URL is not configured');
export const authClient = createAuthClient(authUrl);

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
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
    tokenResult = await withTimeout(authClient.token(), 'Délai dépassé pendant la récupération du jeton de session. Vérifiez la connexion à Neon Auth puis reconnectez-vous.');
  } catch (error) {
    throw new Error(error.message || 'Impossible de récupérer le jeton de session.');
  }
  const { data, error } = tokenResult || {};
  if (error || !data?.token) throw new Error('Session expirée. Veuillez vous reconnecter.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Erreur API (${response.status})`);
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`Délai dépassé : le serveur SDMON ne répond pas pour ${path}. Vérifiez l'API et sa connexion à la base Neon.`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export { apiBase };
