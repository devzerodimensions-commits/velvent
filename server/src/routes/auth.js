import { Router } from 'express';
import { query } from '../db.js';
import { ah, isEmail, isPhone, isPincode, validate } from '../lib/helpers.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../lib/auth.js';

const router = Router();
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

router.post('/register', ah(async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  const errors = validate({
    name: [name, (v) => String(v || '').trim().length >= 2, 'Please enter your name.'],
    email: [email, isEmail, 'Please enter a valid email address.'],
    password: [password, (v) => String(v || '').length >= 6, 'Password must be at least 6 characters.'],
  });
  if (errors) return res.status(400).json({ error: 'Please check the form.', errors });

  const exists = await query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (exists.rowCount) return res.status(409).json({ error: 'An account with this email already exists.' });

  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, LOWER($2), $3, $4) RETURNING *`,
    [String(name).trim(), email, phone || null, await hashPassword(password)],
  );
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
}));

router.post('/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email || '']);
  const user = rows[0];
  if (!user || !(await verifyPassword(String(password || ''), user.password_hash))) {
    return res.status(401).json({ error: 'That email and password do not match.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, ah(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
  res.json(publicUser(rows[0]));
}));

router.put('/me', requireAuth, ah(async (req, res) => {
  const { name, phone } = req.body || {};
  const { rows } = await query(
    `UPDATE users SET name = COALESCE($2, name), phone = COALESCE($3, phone)
      WHERE id = $1 RETURNING *`,
    [req.user.id, name?.trim() || null, phone || null],
  );
  res.json(publicUser(rows[0]));
}));

router.put('/me/password', requireAuth, ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (String(newPassword || '').length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!(await verifyPassword(String(currentPassword || ''), rows[0].password_hash))) {
    return res.status(401).json({ error: 'Your current password is not correct.' });
  }
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [req.user.id, await hashPassword(newPassword)]);
  res.json({ ok: true });
}));

/* ---------------------------------------------------------------- addresses */

router.get('/addresses', requireAuth, ah(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC',
    [req.user.id],
  );
  res.json(rows);
}));

router.post('/addresses', requireAuth, ah(async (req, res) => {
  const a = req.body || {};
  const errors = validate({
    full_name: [a.full_name, (v) => String(v || '').trim().length >= 2, 'Enter the full name.'],
    phone: [a.phone, isPhone, 'Enter a valid 10-digit mobile number.'],
    line1: [a.line1, (v) => String(v || '').trim().length >= 4, 'Enter the address.'],
    city: [a.city, (v) => String(v || '').trim().length >= 2, 'Enter the city.'],
    state: [a.state, (v) => String(v || '').trim().length >= 2, 'Enter the state.'],
    pincode: [a.pincode, isPincode, 'Enter a valid 6-digit PIN code.'],
  });
  if (errors) return res.status(400).json({ error: 'Please check the address.', errors });

  if (a.is_default) await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
  const { rows } = await query(
    `INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, state, pincode, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, a.label || 'Home', a.full_name.trim(), a.phone, a.line1.trim(),
     a.line2 || null, a.city.trim(), a.state.trim(), a.pincode, !!a.is_default],
  );
  res.status(201).json(rows[0]);
}));

router.delete('/addresses/:id', requireAuth, ah(async (req, res) => {
  await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

/* ----------------------------------------------------------------- wishlist */

router.get('/wishlist', requireAuth, ah(async (req, res) => {
  const { rows } = await query(
    `SELECT p.id, p.slug, p.name, p.mrp, p.sale_price,
            (SELECT url FROM product_images pi WHERE pi.product_id = p.id
              ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url
       FROM wishlist w JOIN products p ON p.id = w.product_id
      WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [req.user.id],
  );
  res.json(rows);
}));

router.post('/wishlist/:productId', requireAuth, ah(async (req, res) => {
  await query(
    'INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.user.id, req.params.productId],
  );
  res.json({ ok: true });
}));

router.delete('/wishlist/:productId', requireAuth, ah(async (req, res) => {
  await query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
  res.json({ ok: true });
}));

export default router;
