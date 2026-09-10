const encoder = new TextEncoder();
const SESSION_COOKIE = "navrixa_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getHmacKey() {
  const secret = Netlify.env.get("ADMIN_SESSION_SECRET");
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function passwordsMatch(candidate: string) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured");

  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);

  const a = new Uint8Array(candidateHash);
  const b = new Uint8Array(expectedHash);
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionCookie() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = String(expires);
  const key = await getHmacKey();
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  const token = `${payload}.${bytesToBase64Url(signature)}`;

  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdminRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  if (!token) return false;

  const [expiresRaw, signatureRaw] = token.split(".");
  const expires = Number(expiresRaw);
  if (!expiresRaw || !signatureRaw || !Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const key = await getHmacKey();
    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureRaw),
      encoder.encode(expiresRaw),
    );
  } catch {
    return false;
  }
}
