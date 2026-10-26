const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api',
  maxAge: 8 * 60 * 60 * 1000
};

function publicAccount(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    employeeId: row.employee_id,
    employee: row.employee_id ? {
      id: row.employee_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      department: row.department,
      salary: row.salary === null ? null : Number(row.salary)
    } : null
  };
}

async function login(req, res) {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() || username.trim().length > 150 ||
      typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.username, a.password_hash, a.role, a.employee_id,
              e.name, e.email, e.phone, e.department, CAST(e.salary AS DOUBLE) AS salary
       FROM user_accounts a
       LEFT JOIN employees e ON e.id = a.employee_id
       WHERE a.username = ?
       LIMIT 1`,
      [username.trim().toLowerCase()]
    );
    const account = rows[0];
    const valid = account && await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(account.id),
      expiresIn: '8h',
      issuer: 'employee-management-api',
      audience: 'employee-management-web'
    });
    res.cookie('access_token', token, COOKIE_OPTIONS);
    return res.status(200).json({ success: true, data: publicAccount(account) });
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to sign in right now.' });
  }
}

function logout(req, res) {
  res.clearCookie('access_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api'
  });
  return res.status(200).json({ success: true, message: 'Signed out successfully.' });
}

async function me(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.username, a.role, a.employee_id,
              e.name, e.email, e.phone, e.department, CAST(e.salary AS DOUBLE) AS salary
       FROM user_accounts a
       LEFT JOIN employees e ON e.id = a.employee_id
       WHERE a.id = ?
       LIMIT 1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(401).json({ success: false, message: 'Account no longer exists.' });
    return res.status(200).json({ success: true, data: publicAccount(rows[0]) });
  } catch (error) {
    console.error('[Auth] Session lookup failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to load your account.' });
  }
}

module.exports = { login, logout, me };
