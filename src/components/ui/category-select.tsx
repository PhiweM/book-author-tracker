"use client";
import React from "react";
import { CATEGORIES } from "@/lib/constants";

interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

const COLOR: Record<string, string> = {
  "Fiction":      "bg-blue-50 border-blue-200 text-blue-800",
  "Non-Fiction":  "bg-amber-50 border-amber-200 text-amber-800",
  "Children's":   "bg-green-50 border-green-200 text-green-800",
  "Young Adult":  "bg-purple-50 border-purple-200 text-purple-800",
};

export function CategorySelect({ value, onChange, className }: CategorySelectProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(value === cat ? "" : cat)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            value === cat
              ? COLOR[cat] ?? "bg-slate-900 border-slate-900 text-white"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category) return null;
  const color = COLOR[category] ?? "bg-slate-100 border-slate-200 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${color}`}>
      {category}
    </span>
  );
}
