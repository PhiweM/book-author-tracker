"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut } from "lucide-react";
import { BookTable } from "@/components/BookTable";
import { AddMenu } from "@/components/AddMenu";
import { StatsBar } from "@/components/StatsBar";
import { MetricsPanel } from "@/components/MetricsPanel";
import type { Book } from "@/types/book";

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    const res = await fetch("/api/books");
    const data = await res.json();
    setBooks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleAdd = async (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? "Failed to save book");
    }
    const newBook = await res.json();
    setBooks((prev) => [newBook, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this book from your library?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdate = async (id: string, data: Partial<Book>) => {
    const res = await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? "Failed to update book");
    }
    const updated = await res.json();
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-slate-900 p-1.5">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              BookTracker
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <AddMenu onAdd={handleAdd} />
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <StatsBar books={books} />
        <MetricsPanel books={books} />

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <div className="text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 animate-pulse" />
              <p className="text-sm">Loading your library…</p>
            </div>
          </div>
        ) : (
          <BookTable books={books} onDelete={handleDelete} onUpdate={handleUpdate} />
        )}
      </main>
    </div>
  );
}
