import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getPool } from '../config/database.js';
let jwks;
function getJwks() {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error('NEON_AUTH_JWKS_URL is not configured');
  if (!jwks) jwks = createRemoteJWKSet(new URL(url));
  return jwks;
}
export async function requireIdentity(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const issuer = process.env.NEON_AUTH_ISSUER;
    if (!issuer) throw new Error('NEON_AUTH_ISSUER is not configured');
    const { payload } = await jwtVerify(token, getJwks(), { issuer });
    if (!payload.sub) return res.status(401).json({ error: 'Invalid identity token' });
    req.authIdentity = { subject: String(payload.sub), email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null, name: typeof payload.name === 'string' ? payload.name : null };
    return next();
  } catch (error) {
    if (error.code?.startsWith('ERR_JWT') || error.code?.startsWith('ERR_JWS') || error.code?.startsWith('ERR_JWKS')) return res.status(401).json({ error: 'Invalid or expired token' });
    return next(error);
  }
}
export async function requireAuth(req, res, next) {
  return requireIdentity(req, res, async (identityError) => {
    if (identityError) return next(identityError);
    try {
      const result = await getPool().query('SELECT id, auth_subject, email, full_name, role, is_active FROM app_users WHERE auth_subject = $1', [req.authIdentity.subject]);
      const user = result.rows[0];
      if (!user || !user.is_active) return res.status(403).json({ error: 'Account not authorized' });
      req.user = user;
      return next();
    } catch (error) { return next(error); }
  });
}
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    return next();
  };
}
