"use client";
import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Star, Trash2, Pencil, BookOpen, User, X, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/category-select";
import type { Book, BookStatus } from "@/types/book";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/book";
import { CATEGORIES } from "@/lib/constants";
import Image from "next/image";
import { EditBookDialog } from "./EditBookDialog";
import { AuthorTable } from "./AuthorTable";

interface BookTableProps {
  books: Book[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Book>) => Promise<void>;
}

const columnHelper = createColumnHelper<Book>();

function splitGenres(g: string | null | undefined): string[] {
  if (!g) return [];
  return g.split(",").map((s) => s.trim()).filter(Boolean);
}

export function BookTable({ books, onDelete, onUpdate }: BookTableProps) {
  const [view, setView] = useState<"books" | "authors">("books");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookStatus | "all">("all");
  const [genreFilter, setGenreFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Genre options derived from actual data (flatten comma-separated)
  const genreOptions = useMemo(
    () => [...new Set(books.flatMap((b) => splitGenres(b.genre)))].sort(),
    [books]
  );
  const authorOptions = useMemo(
    () => [...new Set(books.map((b) => b.author))].sort(),
    [books]
  );
  // Only show categories that actually appear in the library
  const categoryOptions = useMemo(
    () => CATEGORIES.filter((c) => books.some((b) => b.category === c)),
    [books]
  );

  const activeFilterCount = [genreFilter, categoryFilter, authorFilter, ratingFilter > 0 ? "r" : ""].filter(Boolean).length;

  const clearFilters = () => {
    setGenreFilter(""); setCategoryFilter(""); setAuthorFilter(""); setRatingFilter(0);
  };

  const filtered = useMemo(
    () =>
      books.filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (genreFilter && !splitGenres(b.genre).includes(genreFilter)) return false;
        if (categoryFilter && b.category !== categoryFilter) return false;
        if (authorFilter && b.author !== authorFilter) return false;
        if (ratingFilter > 0 && (b.rating ?? 0) < ratingFilter) return false;
        return true;
      }),
    [books, statusFilter, genreFilter, categoryFilter, authorFilter, ratingFilter]
  );

  // Columns hidden at each breakpoint — applied to both <th> and <td>
  const COL_HIDDEN: Record<string, string> = {
    author:          "hidden sm:table-cell",
    publishYear:     "hidden md:table-cell",
    rating:          "hidden md:table-cell",
    category_genre:  "hidden lg:table-cell",
    pages:           "hidden xl:table-cell",
    tags:            "hidden xl:table-cell",
    yearRead:        "hidden lg:table-cell",
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("coverUrl", {
        header: "",
        size: 52,
        cell: (info) => {
          const url = info.getValue();
          return url ? (
            <Image src={url} alt="cover" width={36} height={52} className="rounded object-cover" style={{ width: 36, height: 52 }} />
          ) : (
            <div className="w-9 rounded bg-slate-100 flex items-center justify-center" style={{ height: 52 }}>
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("title", {
        header: ({ column }) => <SortHeader column={column} label="Title" />,
        cell: (info) => (
          <div>
            <span className="font-medium text-slate-900">{info.getValue()}</span>
            {/* Show author inline on screens where Author column is hidden */}
            <p className="sm:hidden text-xs text-slate-500 mt-0.5">{info.row.original.author}</p>
          </div>
        ),
        size: 220,
      }),
      columnHelper.accessor("author", {
        header: ({ column }) => <SortHeader column={column} label="Author" />,
        cell: (info) => (
          <button
            className="text-slate-700 hover:text-slate-900 hover:underline text-left"
            onClick={() => setAuthorFilter(info.getValue() === authorFilter ? "" : info.getValue())}
          >
            {info.getValue()}
          </button>
        ),
        size: 170,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const s = info.getValue() as BookStatus;
          const { readFormat, rereadCount } = info.row.original;
          const readNum = (rereadCount ?? 0) + 1;
          const ordinal = readNum === 1 ? "1st" : readNum === 2 ? "2nd" : readNum === 3 ? "3rd" : `${readNum}th`;
          return (
            <div className="flex flex-col gap-0.5">
              <Badge variant={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Badge>
              <div className="flex items-center gap-1.5 flex-wrap">
                {readFormat && (
                  <span className="text-[10px] font-medium text-slate-500 capitalize">{readFormat}</span>
                )}
                {(rereadCount ?? 0) > 0 && (
                  <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 rounded-full px-1.5 py-0.5">
                    {ordinal} read
                  </span>
                )}
              </div>
            </div>
          );
        },
        size: 150,
      }),
      columnHelper.accessor("publishYear", {
        header: ({ column }) => <SortHeader column={column} label="Published" />,
        cell: (info) => <span className="text-slate-500">{info.getValue() ?? "—"}</span>,
        size: 90,
      }),
      columnHelper.accessor("rating", {
        header: ({ column }) => <SortHeader column={column} label="Rating" />,
        cell: (info) => {
          const r = info.getValue() ?? 0;
          return (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-3.5 w-3.5 ${n <= r ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
              ))}
            </div>
          );
        },
        size: 110,
      }),
      columnHelper.display({
        id: "category_genre",
        header: "Category / Genre",
        size: 180,
        cell: (info) => {
          const { category, genre } = info.row.original;
          const gs = splitGenres(genre);
          if (!category && gs.length === 0) return <span className="text-slate-400">—</span>;
          return (
            <div className="flex flex-col gap-0.5">
              {category && (
                <button onClick={() => setCategoryFilter(category === categoryFilter ? "" : category)}>
                  <CategoryBadge category={category} />
                </button>
              )}
              {gs.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {gs.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenreFilter(g === genreFilter ? "" : g)}
                      className={`text-xs rounded-full px-2 py-0.5 transition-colors ${
                        g === genreFilter
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("pages", {
        header: ({ column }) => <SortHeader column={column} label="Pages" />,
        cell: (info) => <span className="text-slate-500">{info.getValue() ?? "—"}</span>,
        size: 70,
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        cell: (info) => {
          const raw = info.getValue();
          if (!raw) return null;
          return (
            <div className="flex flex-wrap gap-1">
              {raw.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                <span key={t} className="inline-block bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs">{t}</span>
              ))}
            </div>
          );
        },
        size: 160,
        enableSorting: false,
      }),
      columnHelper.accessor("yearRead", {
        header: ({ column }) => <SortHeader column={column} label="Year Read" />,
        cell: (info) => {
          const yr = info.getValue();
          return yr
            ? <span className="font-medium text-emerald-700">{yr}</span>
            : <span className="text-slate-400">—</span>;
        },
        size: 90,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        size: 72,
        cell: (info) => (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingBook(info.row.original)}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(info.row.original.id)}
              className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      }),
    ],
    [onDelete, authorFilter, genreFilter, categoryFilter]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const statCounts = useMemo(() => {
    const counts: Record<string, number> = { all: books.length };
    books.forEach((b) => { counts[b.status] = (counts[b.status] ?? 0) + 1; });
    return counts;
  }, [books]);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: view toggle + status pills + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm text-sm">
          <button
            onClick={() => setView("books")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${
              view === "books" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Books
          </button>
          <button
            onClick={() => setView("authors")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${
              view === "authors" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User className="h-3.5 w-3.5" /> Authors
          </button>
        </div>

        {view === "books" && (
          <div className="flex flex-wrap gap-1.5">
            {(["all", "read", "reading", "want_to_read", "wishlist", "dnf"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s as BookStatus]}
                {statCounts[s] !== undefined && (
                  <span className="ml-1 opacity-70">({statCounts[s]})</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto">
          <input
            className="h-8 rounded-md border border-slate-300 px-3 text-sm w-36 sm:w-52 focus:outline-none focus:ring-2 focus:ring-slate-400"
            placeholder={view === "authors" ? "Search authors…" : "Search books…"}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: filter toggle + dropdowns (books view only) */}
      {view === "books" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
                filtersOpen || activeFilterCount > 0
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-white text-slate-900 rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {categoryFilter && <FilterChip label={categoryFilter} onRemove={() => setCategoryFilter("")} />}
                {genreFilter && <FilterChip label={genreFilter} onRemove={() => setGenreFilter("")} />}
                {authorFilter && <FilterChip label={authorFilter} onRemove={() => setAuthorFilter("")} />}
                {ratingFilter > 0 && <FilterChip label={`${ratingFilter}+ stars`} onRemove={() => setRatingFilter(0)} />}
                <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-700 underline transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {(activeFilterCount > 0 || statusFilter !== "all") && (
              <span className="ml-auto text-xs text-slate-400 shrink-0">
                {table.getRowModel().rows.length} result{table.getRowModel().rows.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {filtersOpen && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {categoryOptions.length > 0 && (
                <FilterSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} placeholder="Any category" />
              )}
              <FilterSelect label="Genre" value={genreFilter} onChange={setGenreFilter} options={genreOptions} placeholder="Any genre" />
              <FilterSelect label="Author" value={authorFilter} onChange={setAuthorFilter} options={authorOptions} placeholder="Any author" />
              <div className="relative">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(Number(e.target.value))}
                  className={`h-8 rounded-md border text-xs px-2.5 pr-7 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer ${
                    ratingFilter > 0 ? "border-amber-400 bg-amber-50 text-amber-800 font-medium" : "border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  <option value={0}>Any rating</option>
                  <option value={5}>★★★★★ only</option>
                  <option value={4}>★★★★ and up</option>
                  <option value={3}>★★★ and up</option>
                  <option value={2}>★★ and up</option>
                  <option value={1}>★ and up</option>
                </select>
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table / Author view */}
      {view === "authors" ? (
        <AuthorTable books={books} onDelete={onDelete} onUpdate={onUpdate} globalFilter={globalFilter} />
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 overflow-auto shadow-sm max-h-[65vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-slate-50 border-b border-slate-200">
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${COL_HIDDEN[header.column.id] ?? ""}`}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">
                        {activeFilterCount > 0 || statusFilter !== "all"
                          ? "No books match the current filters."
                          : "No books yet. Add your first one!"}
                      </p>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-xs text-slate-500 underline mt-1 hover:text-slate-700">
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={`px-3 py-2 align-middle ${COL_HIDDEN[cell.column.id] ?? ""}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
        </>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 rounded-md border text-xs px-2.5 pr-7 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer ${
          value ? "border-slate-700 bg-slate-900 text-white font-medium" : "border-slate-300 bg-white text-slate-600"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <div className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${value ? "text-white/60" : "text-slate-400"}`}>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs rounded-full px-2.5 py-0.5">
      {label}
      <button onClick={onRemove} className="hover:text-slate-300 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function SortHeader({ column, label }: {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: () => void };
  label: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button className="flex items-center gap-1 hover:text-slate-900 transition-colors" onClick={() => column.toggleSorting()}>
      {label}
      {sorted === "asc" ? <ArrowUp className="h-3 w-3" /> : sorted === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}
