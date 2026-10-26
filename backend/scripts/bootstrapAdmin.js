require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function bootstrapAdmin() {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || username.length > 150) {
    throw new Error('Set ADMIN_USERNAME (up to 150 characters) in backend/.env.');
  }
  if (!password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set ADMIN_PASSWORD to a unique value of at least 12 characters and no more than 72 UTF-8 bytes in backend/.env.');
  }
  try {
    await pool.verifyDatabaseSchema();
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.query(
        'SELECT id FROM user_accounts WHERE username = ? LIMIT 1',
        [username]
      );
      if (existing.length) {
        throw new Error(`An account named "${username}" already exists; no password was changed. Sign in with the existing account or use an authenticated password-reset workflow.`);
      }
      const hash = await bcrypt.hash(password, 12);
      await connection.query(
        `INSERT INTO user_accounts (username, password_hash, role, employee_id)
         VALUES (?, ?, 'admin', NULL)`,
        [username, hash]
      );
      console.log(`Administrator account "${username}" created.`);
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`An account named "${username}" already exists; no password was changed.`);
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error('MySQL rejected the configured credentials. Check DB_USER and DB_PASSWORD in backend/.env.');
    }
    if (error.code === 'ER_BAD_DB_ERROR') {
      throw new Error(`MySQL database "${process.env.DB_NAME || 'react_db'}" is unavailable. Check DB_NAME in backend/.env.`);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('Cannot reach MySQL. Start MySQL and check DB_HOST and DB_PORT in backend/.env.');
    }
    throw error;
  }
}

bootstrapAdmin().catch(async (error) => {
  console.error('[Admin Bootstrap Error]', error.message);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
