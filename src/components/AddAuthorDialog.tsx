"use client";
import React, { useState, useEffect } from "react";
import { Search, Loader2, BookOpen, CheckSquare, Square, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { searchByAuthor, type SearchResult } from "@/lib/googleBooksClient";
import type { Book, BookStatus } from "@/types/book";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/book";
import Image from "next/image";

interface AddAuthorDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export function AddAuthorDialog({ open, onClose, onAdd }: AddAuthorDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<BookStatus>("want_to_read");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery(""); setResults([]); setSelected(new Set()); setBulkStatus("want_to_read");
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchByAuthor(query);
        setResults(data);
        setSelected(new Set());
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleSave = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      for (const i of Array.from(selected)) {
        const r = results[i];
        await onAdd({
          title: r.title,
          author: r.author,
          publishYear: r.publishYear ?? null,
          pages: r.pages ?? null,
          isbn: r.isbn13 ?? r.isbn10 ?? r.isbn ?? null,
          coverUrl: r.coverUrl ?? null,
          genre: r.genre ?? null,
          publisher: r.publisher ?? null,
          description: r.description ?? null,
          language: r.language ?? "English",
          status: bulkStatus,
          yearRead: null,
          rating: null,
          notes: null,
          tags: null,
          category: r.category ?? null,
          readFormat: null,
          rereadCount: 0,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" /> Add Author's Books
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <input
              autoFocus
              className="w-full h-9 rounded-md border border-slate-300 px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Search author name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </div>
          </div>

          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <button onClick={toggleAll} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                  {selected.size === results.length
                    ? <CheckSquare className="h-3.5 w-3.5 text-slate-700" />
                    : <Square className="h-3.5 w-3.5" />}
                  {selected.size === results.length ? "Deselect all" : "Select all"}
                  <span className="ml-1 text-slate-400">({results.length} books found)</span>
                </button>
                <span className="font-medium text-slate-700">{selected.size} selected</span>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      selected.has(i) ? "bg-slate-50" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className={`shrink-0 w-4 h-4 rounded border transition-colors ${
                      selected.has(i)
                        ? "bg-slate-900 border-slate-900"
                        : "border-slate-300"
                    } flex items-center justify-center`}>
                      {selected.has(i) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {r.coverUrl ? (
                      <Image src={r.coverUrl} alt={r.title} width={32} height={46} className="rounded object-cover shrink-0" style={{ width: 32, height: 46 }} />
                    ) : (
                      <div className="w-8 rounded bg-slate-200 flex items-center justify-center shrink-0" style={{ height: 46 }}>
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 truncate">{r.author}</p>
                      <p className="text-xs text-slate-400">
                        {r.publishYear ?? "—"}{r.pages ? ` · ${r.pages} pages` : ""}{r.genre ? ` · ${r.genre}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Add selected as</label>
                  <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as BookStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(STATUS_LABELS) as [BookStatus, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          <Badge variant={STATUS_COLORS[val]} className="text-xs">{label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="self-end">
                  <Button
                    onClick={handleSave}
                    disabled={selected.size === 0 || saving}
                    className="whitespace-nowrap"
                  >
                    {saving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : `Add ${selected.size > 0 ? selected.size : ""} Book${selected.size !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </div>
            </>
          )}

          {results.length === 0 && query.trim().length >= 2 && !loading && (
            <p className="text-sm text-slate-500 text-center py-6">No books found for this author.</p>
          )}

          {query.trim().length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              Type an author's name to see their books.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
