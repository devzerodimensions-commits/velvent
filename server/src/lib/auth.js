import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// ES module imports all run before any statement in the file that imports us,
// so index.js calling dotenv.config() is too late for the check below. db.js
// loads its own config for the same reason.
dotenv.config();

// A guessable secret would let anyone mint an admin token, so production has to
// supply a real one. Development falls back so the store still starts.
const SECRET = process.env.JWT_SECRET
  || (process.env.NODE_ENV === 'production' ? null : 'velvent-dev-secret-change-me');

if (!SECRET) {
  console.error('\n[velvent] JWT_SECRET is not set. Refusing to start in production — set it in the Render dashboard.\n');
  process.exit(1);
}

const EXPIRES = '30d';

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: EXPIRES });

function readToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Attaches req.user when a valid token is present; never blocks. */
export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch { /* ignore bad tokens */ }
  }
  next();
}

export function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access only.' });
    next();
  });
}
