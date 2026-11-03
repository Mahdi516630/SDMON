import { createAuthClient } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
if (!authUrl) console.warn('VITE_NEON_AUTH_URL is not configured');
export const authClient = createAuthClient(authUrl);

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function api(path, options = {}) {
  const { data, error } = await authClient.token();
  if (error || !data?.token) throw new Error('Session expirée. Veuillez vous reconnecter.');
  const response = await fetch(`${apiBase}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Erreur API (${response.status})`);
  return body;
}

export { apiBase };
