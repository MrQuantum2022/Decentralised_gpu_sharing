/**
 * encrypt.ts
 * Client-side AES-256-GCM encryption using the Web Crypto API.
 * The raw key NEVER leaves the browser unencrypted.
 *
 * Flow:
 *  1. generateKey()       → CryptoKey (AES-256-GCM)
 *  2. encryptFile()       → { iv, ciphertext } as ArrayBuffer
 *  3. exportKey()         → raw key bytes (to wrap with backend pubkey before storage)
 *  4. wrapKeyForBackend() → RSA-OAEP wrapped key (send this to the server)
 */

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,        // extractable — we need to export it for wrapping
    ['encrypt', 'decrypt']
  )
}

export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
  const plaintext = await file.arrayBuffer()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  )
  return { iv, ciphertext }
}

export function buildEncryptedBlob(iv: Uint8Array, ciphertext: ArrayBuffer): Blob {
  // Prepend 12-byte IV to ciphertext so the worker app can extract it
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return new Blob([combined], { type: 'application/octet-stream' })
}

export async function exportRawKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key)
}

/**
 * Wraps the AES key with the backend's RSA-OAEP public key.
 * The wrapped key is safe to store in Supabase — only the backend
 * private key can unwrap it.
 *
 * @param rawKey  - raw AES key bytes from exportRawKey()
 * @param backendPubKeyPem - backend RSA public key in PEM format
 */
export async function wrapKeyForBackend(
  rawKey: ArrayBuffer,
  backendPubKeyPem: string
): Promise<string> {
  const pubKey = await importRsaPublicKey(backendPubKeyPem)
  const wrapped = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    pubKey,
    rawKey
  )
  // Base64-encode for storage
  return btoa(String.fromCharCode(...new Uint8Array(wrapped)))
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  // Convert literal \n strings to real newlines
  const normalized = pem.replace(/\\n/g, '\n')
  
  const pemBody = normalized
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')

  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
}