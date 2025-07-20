const pool = require('../config/db');

async function createUser({ id, phone, passwordHash, otp }) {
  const query = `
    INSERT INTO users(id, phone, password_hash, otp_code, otp_expires)
    VALUES($1, $2, $3, $4, NOW() + ($5 || ' seconds')::interval)
  `;
  await pool.query(query, [id, phone, passwordHash, otp.code, process.env.OTP_EXPIRY]);
}

async function getUserByPhone(phone) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE phone = $1`, [phone]
  );
  return rows[0];
}

async function verifyOtp(phone, code) {
  const { rows } = await pool.query(
    `SELECT id, otp_expires FROM users WHERE phone = $1 AND otp_code = $2`, [phone, code]
  );
  if (rows.length === 0) return null;
  const expires = new Date(rows[0].otp_expires);
  if (expires < new Date()) return null;
  return rows[0].id;
}

module.exports = { createUser, getUserByPhone, verifyOtp };
