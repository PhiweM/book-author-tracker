"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";
import { GENRES } from "@/lib/constants";

interface MultiGenreSelectProps {
  value: string[];
  onChange: (genres: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function MultiGenreSelect({ value, onChange, className, placeholder = "Select genres…" }: MultiGenreSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggle = (genre: string) => {
    if (value.includes(genre)) {
      onChange(value.filter((g) => g !== genre));
    } else {
      onChange([...value, genre]);
    }
  };

  // All genres to show: predefined list + any custom values already selected
  const allGenres = [...new Set([...GENRES, ...value])];

  return (
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-9 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-left flex items-start gap-2 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
      >
        <span className="flex-1 flex flex-wrap gap-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-slate-400 py-0.5">{placeholder}</span>
          ) : (
            value.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-0.5 bg-slate-100 rounded-full px-2 py-0.5 text-xs text-slate-700"
              >
                {g}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(g); }}
                  className="hover:text-red-500 transition-colors ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 mt-0.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
          {value.length > 0 && (
            <div className="px-3 py-1.5 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">{value.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
          {allGenres.map((genre) => {
            const checked = value.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggle(genre)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  checked ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "bg-slate-900 border-slate-900" : "border-slate-300"
                  }`}
                >
                  {checked && <Check className="h-2.5 w-2.5 text-white" />}
                </span>
                {genre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper: parse comma-separated genre string → array
export function parseGenres(genre: string | null | undefined): string[] {
  if (!genre) return [];
  return genre.split(",").map((g) => g.trim()).filter(Boolean);
}

// Helper: array → comma-separated string for storage
export function joinGenres(genres: string[]): string | null {
  const s = genres.join(",");
  return s || null;
}
