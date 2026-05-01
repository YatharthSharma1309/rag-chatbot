import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";

function deriveKey(): Buffer {
  const secret = process.env.USER_SETTINGS_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 24) {
    throw new Error(
      "USER_SETTINGS_ENCRYPTION_KEY must be set (use a long random string, e.g. openssl rand -base64 32)",
    );
  }
  return createHash("sha256").update(secret).digest();
}

/** Returns base64(iv + authTag + ciphertext) */
export function encryptOpenRouterKey(plain: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptOpenRouterKey(blob: string): string {
  const key = deriveKey();
  const buf = Buffer.from(blob, "base64");
  if (buf.length < 28) throw new Error("Invalid encrypted payload");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
