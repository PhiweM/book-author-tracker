import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const books = await prisma.book.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const book = await prisma.book.create({ data: { ...body, userId: user.userId } });
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error("POST /api/books:", err);
    return NextResponse.json({ error: "Failed to save book" }, { status: 500 });
  }
}
