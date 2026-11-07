import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/security.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentification requise.' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: 'Session invalide ou expirée.' });
  }
}
