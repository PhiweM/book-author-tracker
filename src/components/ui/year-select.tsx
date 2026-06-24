"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { READ_YEARS, PUBLISH_YEARS } from "@/lib/constants";

interface YearSelectProps {
  value: string;
  onChange: (v: string) => void;
  mode?: "read" | "publish";
  placeholder?: string;
}

export function YearSelect({ value, onChange, mode = "read", placeholder = "Year…" }: YearSelectProps) {
  const years = mode === "read" ? READ_YEARS : PUBLISH_YEARS;
  const numVal = value ? parseInt(value) : undefined;
  const isOutOfRange = numVal !== undefined && !years.includes(numVal);

  return (
    <Select
      value={value || ""}
      onValueChange={(v) => onChange(v === "" ? "" : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        <SelectItem value="">— None —</SelectItem>
        {isOutOfRange && numVal !== undefined && (
          <SelectItem value={String(numVal)}>{numVal}</SelectItem>
        )}
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
