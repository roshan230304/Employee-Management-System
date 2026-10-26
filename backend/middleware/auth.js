const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authenticate(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication is required.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'employee-management-api',
      audience: 'employee-management-web'
    });
  } catch {
    res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api' });
    return res.status(401).json({ success: false, message: 'Your session is invalid or has expired. Please sign in again.' });
  }

  try {
    const [accounts] = await pool.query('SELECT role, employee_id FROM user_accounts WHERE id = ? LIMIT 1', [Number(payload.sub)]);
    if (!accounts[0]) {
      res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api' });
      return res.status(401).json({ success: false, message: 'This account no longer exists. Please sign in again.' });
    }
    req.user = {
      id: Number(payload.sub),
      role: accounts[0].role,
      employeeId: accounts[0].employee_id === null ? null : Number(accounts[0].employee_id)
    };
    return next();
  } catch (error) {
    console.error('[Auth] Session verification failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to verify your account right now.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
