"use client";
import React, { useMemo, useState } from "react";
import { BarChart3, TrendingUp, BookOpen } from "lucide-react";
import type { Book } from "@/types/book";
import { CURRENT_YEAR } from "@/lib/constants";

export function MetricsPanel({ books }: { books: Book[] }) {
  const [expanded, setExpanded] = useState(false);

  const readBooks = books.filter((b) => b.status === "read");

  const byYear = useMemo(() => {
    const map = new Map<number, number>();
    readBooks.forEach((b) => {
      if (b.yearRead) map.set(b.yearRead, (map.get(b.yearRead) ?? 0) + 1);
    });
    const years = Array.from(map.keys()).sort((a, b) => a - b);
    if (years.length === 0) return [];
    const first = Math.min(...years, CURRENT_YEAR - 4);
    const last = CURRENT_YEAR;
    const result = [];
    for (let y = first; y <= last; y++) {
      result.push({ year: y, count: map.get(y) ?? 0 });
    }
    return result.slice(-8);
  }, [readBooks]);

  const byGenre = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach((b) => {
      if (b.genre) {
        b.genre.split(",").map((g) => g.trim()).filter(Boolean).forEach((g) => {
          map.set(g, (map.get(g) ?? 0) + 1);
        });
      }
    });
    return Array.from(map.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [books]);

  const byAuthor = useMemo(() => {
    const map = new Map<string, number>();
    books.forEach((b) => map.set(b.author, (map.get(b.author) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [books]);

  const thisYear = readBooks.filter((b) => b.yearRead === CURRENT_YEAR).length;
  const lastYear = readBooks.filter((b) => b.yearRead === CURRENT_YEAR - 1).length;
  const trend = lastYear > 0 ? Math.round(((thisYear - lastYear) / lastYear) * 100) : null;

  const maxYearCount = Math.max(...byYear.map((y) => y.count), 1);
  const maxGenreCount = Math.max(...byGenre.map((g) => g.count), 1);
  const maxAuthorCount = Math.max(...byAuthor.map((a) => a.count), 1);

  if (books.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BarChart3 className="h-4 w-4 text-slate-500" />
          Reading Insights
          {thisYear > 0 && (
            <span className="text-xs font-normal text-slate-400 ml-1">
              {thisYear} book{thisYear !== 1 ? "s" : ""} this year
              {trend !== null && (
                <span className={trend >= 0 ? "text-emerald-500 ml-1" : "text-red-400 ml-1"}>
                  ({trend >= 0 ? "+" : ""}{trend}% vs last year)
                </span>
              )}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Books read per year */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Books Read per Year
            </h3>
            {byYear.length === 0 ? (
              <p className="text-xs text-slate-400">No reading history yet.</p>
            ) : (
              <div className="space-y-1.5">
                {byYear.map(({ year, count }) => (
                  <div key={year} className="flex items-center gap-2">
                    <span className={`text-xs w-10 text-right shrink-0 ${year === CURRENT_YEAR ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                      {year}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${year === CURRENT_YEAR ? "bg-emerald-500" : "bg-slate-400"}`}
                        style={{ width: `${(count / maxYearCount) * 100}%`, minWidth: count > 0 ? "1.5rem" : 0 }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-4 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Genre breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Top Genres
            </h3>
            {byGenre.length === 0 ? (
              <p className="text-xs text-slate-400">No genre data yet.</p>
            ) : (
              <div className="space-y-1.5">
                {byGenre.map(({ genre, count }) => (
                  <div key={genre} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-28 truncate shrink-0">{genre}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400 transition-all"
                        style={{ width: `${(count / maxGenreCount) * 100}%`, minWidth: "1.5rem" }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-4 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top authors */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Most Read Authors
            </h3>
            {byAuthor.length === 0 ? (
              <p className="text-xs text-slate-400">No authors yet.</p>
            ) : (
              <div className="space-y-1.5">
                {byAuthor.map(({ author, count }) => (
                  <div key={author} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-28 truncate shrink-0">{author}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${(count / maxAuthorCount) * 100}%`, minWidth: "1.5rem" }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-4 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
