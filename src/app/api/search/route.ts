import { NextRequest, NextResponse } from "next/server";
import { searchBooks, searchAuthors } from "@/lib/openLibrary";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "book";

  if (!query.trim()) return NextResponse.json([]);

  try {
    const results =
      type === "author" ? await searchAuthors(query) : await searchBooks(query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
