"use client";
import React from "react";
import { BookOpen, BookMarked, BookCheck, Heart, Star, Users, FileText } from "lucide-react";
import type { Book } from "@/types/book";

export function StatsBar({ books }: { books: Book[] }) {
  const read = books.filter((b) => b.status === "read").length;
  const reading = books.filter((b) => b.status === "reading").length;
  const want = books.filter((b) => b.status === "want_to_read").length;
  const wishlist = books.filter((b) => b.status === "wishlist").length;
  const authors = new Set(books.map((b) => b.author)).size;
  const totalPages = books
    .filter((b) => b.status === "read" && b.pages)
    .reduce((s, b) => s + (b.pages ?? 0), 0);
  const rated = books.filter((b) => b.rating !== null);
  const avgRating = rated.length
    ? (rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  const stats = [
    { label: "Read", value: read, Icon: BookCheck, color: "text-emerald-600 bg-emerald-50" },
    { label: "Reading", value: reading, Icon: BookOpen, color: "text-blue-600 bg-blue-50" },
    { label: "Want to Read", value: want, Icon: BookMarked, color: "text-amber-600 bg-amber-50" },
    { label: "Wishlist", value: wishlist, Icon: Heart, color: "text-purple-600 bg-purple-50" },
    { label: "Authors", value: authors, Icon: Users, color: "text-indigo-600 bg-indigo-50" },
    { label: "Pages Read", value: totalPages > 0 ? totalPages.toLocaleString() : "—", Icon: FileText, color: "text-teal-600 bg-teal-50" },
    { label: "Avg Rating", value: avgRating, Icon: Star, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {stats.map(({ label, value, Icon, color }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center gap-2.5">
          <div className={`rounded-lg p-1.5 shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
