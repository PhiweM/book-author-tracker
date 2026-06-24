"use client";
import React, { useState, useEffect } from "react";
import { Search, BookOpen, User, Loader2, Star, Hash } from "lucide-react";
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
import { searchBooks, searchByAuthor, searchByISBN, type SearchResult } from "@/lib/googleBooksClient";
import type { Book, BookStatus } from "@/types/book";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/book";
import Image from "next/image";

interface AddBookDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

type SearchMode = "book" | "author" | "isbn";

export function AddBookDialog({ open, onClose, onAdd }: AddBookDialogProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>("book");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isbnResult, setIsbnResult] = useState<SearchResult | null | "notfound">(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // Per-book metadata (editable after selection)
  const [status, setStatus] = useState<BookStatus>("want_to_read");
  const [yearRead, setYearRead] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [category, setCategory] = useState("");

  const [readFormat, setReadFormat] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ title: "", author: "", publishYear: "" });

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  // When a book is selected from results, pre-fill genre/category
  useEffect(() => {
    if (selected) {
      setGenres(parseGenres(selected.genre));
      setCategory(selected.category ?? "");
    }
  }, [selected]);

  // Unified debounced search for all three modes
  useEffect(() => {
    if (searchMode === "isbn") {
      const clean = query.replace(/[-\s]/g, "");
      if (clean.length !== 10 && clean.length !== 13) {
        setIsbnResult(null);
        return;
      }
      setLoading(true);
      setIsbnResult(null);
      const timer = setTimeout(async () => {
        try {
          const result = await searchByISBN(clean);
          setIsbnResult(result ?? "notfound");
        } finally { setLoading(false); }
      }, 400);
      return () => clearTimeout(timer);
    }

    // book or author mode
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = searchMode === "author"
          ? await searchByAuthor(query)
          : await searchBooks(query);
        setResults(data);
      } finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchMode]);

  const handleSave = async () => {
    if (!selected && !manualMode) return;
    setSaving(true);
    setSaveError(null);
    try {
      const base = manualMode
        ? {
            title: manual.title,
            author: manual.author,
            publishYear: manual.publishYear ? parseInt(manual.publishYear) : null,
            isbn: null, coverUrl: null, description: null,
            pages: null, publisher: null, language: "English",
          }
        : {
            title: selected!.title,
            author: selected!.author,
            publishYear: selected!.publishYear ?? null,
            pages: selected!.pages ?? null,
            isbn: selected!.isbn13 ?? selected!.isbn10 ?? null,
            coverUrl: selected!.coverUrl ?? null,
            publisher: selected!.publisher ?? null,
            description: selected!.description ?? null,
            language: selected!.language ?? "English",
          };

      await onAdd({
        ...base,
        genre: joinGenres(genres),
        category: category || null,
        status,
        readFormat: (status === "read" || status === "reading") ? readFormat || null : null,
        rereadCount: 0,
        yearRead: yearRead ? parseInt(yearRead) : null,
        rating: rating || null,
        notes: notes || null,
        tags: tags || null,
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save book");
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setQuery(""); setResults([]); setSelected(null); setIsbnResult(null);
    setSearchMode("book"); setStatus("want_to_read"); setYearRead(""); setRating(0);
    setNotes(""); setTags(""); setGenres([]); setCategory(""); setReadFormat("");
    setManualMode(false); setManual({ title: "", author: "", publishYear: "" }); setSaveError(null);
  };

  const switchMode = (m: SearchMode) => { setSearchMode(m); setQuery(""); setResults([]); setIsbnResult(null); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add a Book</DialogTitle>
        </DialogHeader>

        {!selected && !manualMode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm shrink-0">
                <ModeBtn active={searchMode === "book"} onClick={() => switchMode("book")} icon={<BookOpen className="h-3.5 w-3.5" />} label="Title" />
                <ModeBtn active={searchMode === "author"} onClick={() => switchMode("author")} icon={<User className="h-3.5 w-3.5" />} label="Author" />
                <ModeBtn active={searchMode === "isbn"} onClick={() => switchMode("isbn")} icon={<Hash className="h-3.5 w-3.5" />} label="ISBN" />
              </div>
              <div className="relative flex-1">
                <input
                  autoFocus
                  className="w-full h-9 rounded-md border border-slate-300 px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder={searchMode === "isbn" ? "Enter ISBN-10 or ISBN-13…" : searchMode === "author" ? "Author name…" : "Title, author, keyword…"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {searchMode === "isbn" && (
              <p className="text-xs text-slate-400 -mt-1">ISBN-13: 978-XXXXXXXXXX &nbsp;·&nbsp; ISBN-10: XXXXXXXXXX (dashes optional)</p>
            )}

            {searchMode === "isbn" && isbnResult && (
              isbnResult === "notfound"
                ? <p className="text-sm text-slate-500 text-center py-4">No book found for that ISBN. <button className="underline" onClick={() => setManualMode(true)}>Add manually</button></p>
                : <div className="rounded-lg border border-slate-200 overflow-hidden"><BookResultRow result={isbnResult} onSelect={setSelected} /></div>
            )}

            {searchMode !== "isbn" && (
              <>
                {query.trim().length === 1 && <p className="text-xs text-slate-400 text-center py-1">Keep typing…</p>}
                {results.length > 0 && (
                  <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {results.map((r, i) => <BookResultRow key={i} result={r} onSelect={setSelected} />)}
                  </div>
                )}
                {results.length === 0 && query.trim().length >= 2 && !loading && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No results. <button className="underline" onClick={() => setManualMode(true)}>Add manually</button>
                  </p>
                )}
              </>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setManualMode(true)}>Add manually instead</Button>
            </div>
          </div>

        ) : manualMode ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Enter book details manually</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  value={manual.title} onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Author *</label>
                <input className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  value={manual.author} onChange={(e) => setManual((m) => ({ ...m, author: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Published Year</label>
                <YearSelect mode="publish" value={manual.publishYear} onChange={(v) => setManual((m) => ({ ...m, publishYear: v }))} />
              </div>
            </div>
            <CategoryAndGenre category={category} setCategory={setCategory} genres={genres} setGenres={setGenres} />
            <StatusAndMeta status={status} setStatus={setStatus} readFormat={readFormat} setReadFormat={setReadFormat}
              yearRead={yearRead} setYearRead={setYearRead} rating={rating} setRating={setRating}
              notes={notes} setNotes={setNotes} tags={tags} setTags={setTags} />
            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</p>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setManualMode(false)}>Back to search</Button>
              <Button onClick={handleSave} disabled={!manual.title || !manual.author || saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Book"}
              </Button>
            </div>
          </div>

        ) : (
          <div className="space-y-4">
            {/* Selected book preview */}
            <div className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              {selected?.coverUrl ? (
                <Image src={selected.coverUrl} alt={selected.title} width={56} height={80}
                  className="rounded object-cover shrink-0" style={{ width: 56, height: 80 }} unoptimized />
              ) : (
                <div className="w-14 h-20 rounded bg-slate-200 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{selected?.title}</p>
                <p className="text-sm text-slate-600">{selected?.author}</p>
                <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 mt-1">
                  {selected?.publishYear && <span>{selected.publishYear}</span>}
                  {selected?.pages && <span>{selected.pages} pages</span>}
                  {selected?.isbn13 && <span className="font-mono">ISBN {selected.isbn13}</span>}
                  {!selected?.isbn13 && selected?.isbn10 && <span className="font-mono">ISBN {selected.isbn10}</span>}
                  {selected?.publisher && <span>{selected.publisher}</span>}
                </div>
                {selected?.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{selected.description}</p>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 self-start text-xs underline shrink-0">Change</button>
            </div>

            <CategoryAndGenre category={category} setCategory={setCategory} genres={genres} setGenres={setGenres} />
            <StatusAndMeta status={status} setStatus={setStatus} readFormat={readFormat} setReadFormat={setReadFormat}
              yearRead={yearRead} setYearRead={setYearRead} rating={rating} setRating={setRating}
              notes={notes} setNotes={setNotes} tags={tags} setTags={setTags} />

            {saveError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Book"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${active ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
      {icon} {label}
    </button>
  );
}

function BookResultRow({ result, onSelect }: { result: SearchResult; onSelect: (r: SearchResult) => void }) {
  return (
    <button onClick={() => onSelect(result)}
      className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 transition-colors">
      {result.coverUrl ? (
        <Image src={result.coverUrl} alt={result.title} width={36} height={52}
          className="rounded object-cover shrink-0" style={{ width: 36, height: 52 }} unoptimized />
      ) : (
        <div className="w-9 rounded bg-slate-200 flex items-center justify-center shrink-0" style={{ height: 52 }}>
          <BookOpen className="h-4 w-4 text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{result.title}</p>
        <p className="text-xs text-slate-500 truncate">{result.author}</p>
        <div className="flex flex-wrap gap-x-2 text-xs text-slate-400 mt-0.5">
          {result.publishYear && <span>{result.publishYear}</span>}
          {result.pages && <span>{result.pages}p</span>}
          {result.category && <span className="text-slate-500">{result.category}</span>}
          {result.genre && <span>{result.genre.split(",").slice(0, 2).join(" · ")}</span>}
          {result.isbn13 && <span className="font-mono">ISBN {result.isbn13}</span>}
        </div>
      </div>
    </button>
  );
}

function CategoryAndGenre({ category, setCategory, genres, setGenres }: {
  category: string; setCategory: (v: string) => void;
  genres: string[]; setGenres: (v: string[]) => void;
}) {
  return (
    <div className="space-y-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
        <CategorySelect value={category} onChange={setCategory} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Genre</label>
        <MultiGenreSelect value={genres} onChange={setGenres} />
      </div>
    </div>
  );
}

function StatusAndMeta({ status, setStatus, readFormat, setReadFormat, yearRead, setYearRead, rating, setRating, notes, setNotes, tags, setTags }: {
  status: BookStatus; setStatus: (s: BookStatus) => void;
  readFormat: string; setReadFormat: (f: string) => void;
  yearRead: string; setYearRead: (y: string) => void;
  rating: number; setRating: (r: number) => void;
  notes: string; setNotes: (n: string) => void;
  tags: string; setTags: (t: string) => void;
}) {
  const showFormat = status === "read" || status === "reading";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status *</label>
          <Select value={status} onValueChange={(v) => setStatus(v as BookStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as [BookStatus, string][]).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  <Badge variant={STATUS_COLORS[val]} className="text-xs">{label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(status === "read" || status === "dnf") && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Year Read</label>
            <YearSelect value={yearRead} onChange={setYearRead} mode="read" placeholder={String(new Date().getFullYear())} />
          </div>
        )}
      </div>
      {showFormat && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Format</label>
          <div className="flex gap-1.5">
            {READ_FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setReadFormat(readFormat === f.value ? "" : f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  readFormat === f.value
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(rating === n ? 0 : n)}
              className={`transition-colors ${n <= rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}>
              <Star className="h-5 w-5" fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tags <span className="text-slate-400 font-normal">(personal labels: gifted, re-read, book-club…)</span></label>
        <input className="w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="gifted, re-read, book-club" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
        <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
          rows={2} placeholder="Your thoughts…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </div>
  );
}
