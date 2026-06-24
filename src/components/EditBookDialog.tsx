"use client";
import React, { useState } from "react";
import { Loader2, Star } from "lucide-react";
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
import { YearSelect } from "@/components/ui/year-select";
import { MultiGenreSelect, parseGenres, joinGenres } from "@/components/ui/multi-genre-select";
import { CategorySelect } from "@/components/ui/category-select";
import { READ_FORMATS } from "@/lib/constants";
import type { Book, BookStatus } from "@/types/book";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/book";

interface EditBookDialogProps {
  book: Book;
  onClose: () => void;
  onSave: (data: Partial<Book>) => Promise<void>;
}

function readOrdinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export function EditBookDialog({ book, onClose, onSave }: EditBookDialogProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    status: book.status as BookStatus,
    yearRead: book.yearRead?.toString() ?? "",
    rating: book.rating ?? 0,
    notes: book.notes ?? "",
    tags: book.tags ?? "",
    genres: parseGenres(book.genre),
    category: book.category ?? "",
    readFormat: book.readFormat ?? "",
    rereadCount: book.rereadCount ?? 0,
    pages: book.pages?.toString() ?? "",
    publishYear: book.publishYear?.toString() ?? "",
  });

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        title: form.title,
        author: form.author,
        status: form.status,
        yearRead: form.yearRead ? parseInt(form.yearRead) : null,
        rating: form.rating || null,
        notes: form.notes || null,
        tags: form.tags || null,
        genre: joinGenres(form.genres),
        category: form.category || null,
        readFormat: (form.status === "read" || form.status === "reading") ? form.readFormat || null : null,
        rereadCount: form.rereadCount,
        pages: form.pages ? parseInt(form.pages) : null,
        publishYear: form.publishYear ? parseInt(form.publishYear) : null,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={form.title} onChange={set("title")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Author</label>
            <input className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={form.author} onChange={set("author")} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
            <CategorySelect
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Genre</label>
            <MultiGenreSelect
              value={form.genres}
              onChange={(genres) => setForm((f) => ({ ...f, genres }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as BookStatus }))}>
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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Year Read</label>
              <YearSelect
                value={form.yearRead}
                onChange={(v) => setForm((f) => ({ ...f, yearRead: v }))}
                mode="read"
              />
            </div>
          </div>

          {(form.status === "read" || form.status === "reading") && (
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Format</label>
                <div className="flex gap-1.5">
                  {READ_FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setForm((fm) => ({ ...fm, readFormat: fm.readFormat === f.value ? "" : f.value }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.readFormat === f.value
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Times Read</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rereadCount: Math.max(0, f.rereadCount - 1) }))}
                    disabled={form.rereadCount === 0}
                    className="h-7 w-7 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-medium"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold text-slate-800 w-16 text-center">
                    {readOrdinal(form.rereadCount + 1)} read
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rereadCount: f.rereadCount + 1 }))}
                    className="h-7 w-7 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Published</label>
              <YearSelect
                value={form.publishYear}
                onChange={(v) => setForm((f) => ({ ...f, publishYear: v }))}
                mode="publish"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pages</label>
              <input type="number" className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={form.pages} onChange={set("pages")} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: f.rating === n ? 0 : n }))}
                  className={`transition-colors ${n <= form.rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
                >
                  <Star className="h-5 w-5" fill={n <= form.rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tags</label>
            <input className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="fiction, classic, favorite" value={form.tags} onChange={set("tags")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none" rows={3} value={form.notes} onChange={set("notes")} />
          </div>
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
