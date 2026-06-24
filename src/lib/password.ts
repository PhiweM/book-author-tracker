// Node.js crypto — only import in route handlers, never in middleware
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${hash}.${salt}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [hash, salt] = stored.split(".");
    const incoming = scryptSync(password, salt, 64);
    return timingSafeEqual(incoming, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}
