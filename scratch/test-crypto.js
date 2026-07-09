import { pbkdf2 as nodePbkdf2 } from 'node:crypto';

const textEncoder = new TextEncoder();
const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_BITS = 256;

function base64FromBytes(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function bytesFromBase64(base64) {
  const normalized = String(base64 || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function nodeHash(password, saltBase64) {
  const salt = bytesFromBase64(saltBase64);
  const passwordBytes = textEncoder.encode(password);

  const derived = await new Promise((resolve, reject) => {
    nodePbkdf2(
      passwordBytes,
      salt,
      PASSWORD_HASH_ITERATIONS,
      PASSWORD_HASH_BITS / 8,
      'sha256',
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
  return Buffer.from(derived).toString('base64');
}

async function webHash(password, saltBase64) {
  const salt = bytesFromBase64(saltBase64);
  const passwordBytes = textEncoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    PASSWORD_HASH_BITS
  );

  return base64FromBytes(new Uint8Array(derivedBits));
}

const salt = "c29tZSBzYWx0IHZhbHVl";
const pwd = "mySecurePassword123";

const h1 = await nodeHash(pwd, salt);
const h2 = await webHash(pwd, salt);

console.log("Node Hash:", h1);
console.log("Web Hash :", h2);
console.log("Matches  :", h1 === h2);
