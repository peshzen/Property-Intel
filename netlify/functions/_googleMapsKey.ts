import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const IV_LENGTH = 12;

type KeyStatus = 'not_connected' | 'connected' | 'connection_failed';

export function maskGoogleMapsKey(key: string): string {
  if (key.length <= 8) return `${key.slice(0, 2)}****`;
  return `${key.slice(0, 6)}${'*'.repeat(Math.max(8, key.length - 10))}${key.slice(-4)}`;
}

function deriveAesKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function encryptGoogleMapsKey(key: string, secret?: string): string {
  const normalized = key.trim();
  if (!normalized) throw new Error('Google Maps API key cannot be empty.');
  if (!secret) throw new Error('GOOGLE_API_KEY_ENCRYPTION_SECRET is required to store Google Maps API keys.');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', deriveAesKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptGoogleMapsKey(payload?: string | null, secret?: string): string | null {
  if (!payload) return null;
  if (!payload.startsWith('enc:') || !secret) return null;
  const [, ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) return null;
  const decipher = createDecipheriv('aes-256-gcm', deriveAesKey(secret), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

export type { KeyStatus };
