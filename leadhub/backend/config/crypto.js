// Lightweight AES-256-GCM helper used to encrypt sensitive fields
// (SMTP password, API keys) before they are saved to MongoDB.
// Set ENCRYPTION_KEY in .env to a 32-byte value (any long random string works,
// it is hashed down to 32 bytes below).
const crypto = require('crypto');

const RAW_KEY = process.env.ENCRYPTION_KEY || 'leadhub_dev_key_change_me_in_prod';
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payload) {
  if (!payload) return '';
  try {
    const buf = Buffer.from(payload, 'base64');
    if (buf.length <= 28) return payload;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (err) {
    return payload;
  }
}

module.exports = { encrypt, decrypt };
