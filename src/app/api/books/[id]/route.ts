import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || book.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.book.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/books/[id]:", err);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || book.userId !== user.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
