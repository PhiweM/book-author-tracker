"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRES } from "@/lib/constants";

interface GenreSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function GenreSelect({ value, onChange, placeholder = "Select genre…" }: GenreSelectProps) {
  const knownGenres = GENRES as readonly string[];
  const isCustom = value && !knownGenres.includes(value);

  return (
    <div className="space-y-1">
      <Select
        value={isCustom ? "__custom__" : value || ""}
        onValueChange={(v) => {
          if (v !== "__custom__") onChange(v === "" ? "" : v);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {isCustom ? value : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="">— None —</SelectItem>
          {knownGenres.map((g) => (
            <SelectItem key={g} value={g}>{g}</SelectItem>
          ))}
          {isCustom && (
            <SelectItem value="__custom__">{value} (custom)</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
