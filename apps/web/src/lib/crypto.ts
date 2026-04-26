import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGO = "aes-256-gcm";
const KEY_ENV = "LLM_ENCRYPTION_KEY";

function getDerivedKey(): Buffer {
  const raw = process.env[KEY_ENV];
  if (!raw) throw new Error(`${KEY_ENV} environment variable is not set`);
  // Derive a fixed 32-byte key from whatever the env var contains
  return createHash("sha256").update(raw).digest();
}

/** Encrypt a plaintext string. Returns { ciphertext, iv } both base64-encoded. */
export function encryptKey(plaintext: string): { ciphertext: string; iv: string } {
  const key = getDerivedKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Prepend auth tag (16 bytes) to ciphertext so we can verify on decrypt
  const combined = Buffer.concat([tag, encrypted]);
  return {
    ciphertext: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

/** Decrypt a base64 ciphertext+iv pair back to the plaintext API key. */
export function decryptKey(ciphertext: string, iv: string): string {
  const key = getDerivedKey();
  const combined = Buffer.from(ciphertext, "base64");
  const ivBuf = Buffer.from(iv, "base64");
  const tag = combined.subarray(0, 16);
  const encrypted = combined.subarray(16);
  const decipher = createDecipheriv(ALGO, key, ivBuf);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
