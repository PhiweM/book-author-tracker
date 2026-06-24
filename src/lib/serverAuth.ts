// Server-side helper for route handlers (uses next/headers, NOT edge-compatible)
import { cookies } from "next/headers";
import { verifyToken } from "./session";

export async function getCurrentUser(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return verifyToken(session);
}
