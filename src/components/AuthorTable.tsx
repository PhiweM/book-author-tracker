"use client";
import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, BookOpen, Star, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { Book, BookStatus } from "@/types/book";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/book";
import { EditBookDialog } from "./EditBookDialog";

interface AuthorGroup {
  name: string;
  books: Book[];
  readCount: number;
  totalCount: number;
  avgRating: number | null;
  genres: string[];
  latestRead: number | null;
}

interface AuthorTableProps {
  books: Book[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Book>) => Promise<void>;
  globalFilter: string;
}

export function AuthorTable({ books, onDelete, onUpdate, globalFilter }: AuthorTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const authors = useMemo<AuthorGroup[]>(() => {
    const map = new Map<string, Book[]>();
    books.forEach((b) => {
      const key = b.author;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return Array.from(map.entries())
      .map(([name, bs]) => {
        const readBooks = bs.filter((b) => b.status === "read");
        const rated = bs.filter((b) => b.rating !== null);
        const genres = [...new Set(bs.flatMap((b) => b.genre ? b.genre.split(",").map((g) => g.trim()).filter(Boolean) : []))];
        const readYears = readBooks.map((b) => b.yearRead).filter(Boolean) as number[];
        return {
          name,
          books: bs,
          readCount: readBooks.length,
          totalCount: bs.length,
          avgRating: rated.length
            ? Math.round((rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length) * 10) / 10
            : null,
          genres,
          latestRead: readYears.length ? Math.max(...readYears) : null,
        };
      })
      .filter((a) =>
        !globalFilter ||
        a.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        a.books.some((b) => b.title.toLowerCase().includes(globalFilter.toLowerCase()))
      )
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [books, globalFilter]);

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  return (
    <div className="rounded-xl border border-slate-200 overflow-auto shadow-sm max-h-[65vh]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-8" />
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Author</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Books</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Read</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">Last Read</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Avg Rating</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Genres</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {authors.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No authors yet.</p>
              </td>
            </tr>
          ) : (
            authors.map((author) => (
              <React.Fragment key={author.name}>
                <tr
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => toggle(author.name)}
                >
                  <td className="px-3 py-2.5 text-slate-400">
                    {expanded.has(author.name)
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{author.name}</td>
                  <td className="px-3 py-2.5 text-slate-600">{author.totalCount}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-emerald-700 font-medium">{author.readCount}</span>
                    <span className="text-slate-400 text-xs"> / {author.totalCount}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{author.latestRead ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {author.avgRating !== null ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-slate-700 font-medium">{author.avgRating}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {author.genres.slice(0, 3).map((g) => (
                        <span key={g} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{g}</span>
                      ))}
                    </div>
                  </td>
                </tr>

                {expanded.has(author.name) && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="bg-slate-50/60 border-t border-slate-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="pl-10 pr-3 py-2 text-left text-xs font-medium text-slate-400 w-14" />
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Title</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-36">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-24">Year Read</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-24">Published</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-28">Rating</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 w-20" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {author.books
                              .slice()
                              .sort((a, b) => (b.yearRead ?? 0) - (a.yearRead ?? 0))
                              .map((book) => (
                                <tr key={book.id} className="group hover:bg-white transition-colors">
                                  <td className="pl-10 pr-3 py-2">
                                    {book.coverUrl ? (
                                      <Image src={book.coverUrl} alt={book.title} width={28} height={40} className="rounded object-cover" style={{ width: 28, height: 40 }} />
                                    ) : (
                                      <div className="w-7 h-10 rounded bg-slate-200 flex items-center justify-center">
                                        <BookOpen className="h-3 w-3 text-slate-400" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 font-medium text-slate-800">{book.title}</td>
                                  <td className="px-3 py-2">
                                    <Badge variant={STATUS_COLORS[book.status as BookStatus]}>
                                      {STATUS_LABELS[book.status as BookStatus]}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {book.yearRead
                                      ? <span className="font-medium text-emerald-700">{book.yearRead}</span>
                                      : <span className="text-slate-400">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-slate-500">{book.publishYear ?? "—"}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <Star key={n} className={`h-3 w-3 ${n <= (book.rating ?? 0) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setEditingBook(book); }}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
                                        className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {editingBook && (
        <EditBookDialog
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={async (data) => {
            await onUpdate(editingBook.id, data);
            setEditingBook(null);
          }}
        />
      )}
    </div>
  );
}
