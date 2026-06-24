// JWT helpers using Web Crypto API — works in both Edge (middleware) and Node.js
function toB64url(arr: Uint8Array): string {
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toB64url(new Uint8Array(sig));
}

export async function createToken(userId: string, email: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=+$/, "");
  const payload = btoa(JSON.stringify({
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  })).replace(/=+$/, "");
  const sig = await hmacSign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${sig}`;
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const secret = process.env.AUTH_SECRET ?? "dev-secret-change-me";
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expected = await hmacSign(`${header}.${payload}`, secret);
    if (sig !== expected) return null;
    const { sub, email, exp } = JSON.parse(fromB64url(payload));
    if (Math.floor(Date.now() / 1000) > exp) return null;
    return { userId: sub, email };
  } catch {
    return null;
  }
}
