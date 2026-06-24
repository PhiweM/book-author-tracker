"use client";
import React, { useState } from "react";
import { Plus, BookOpen, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { AddBookDialog } from "@/components/AddBookDialog";
import { AddAuthorDialog } from "@/components/AddAuthorDialog";
import type { Book } from "@/types/book";

interface AddMenuProps {
  onAdd: (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export function AddMenu({ onAdd }: AddMenuProps) {
  const [bookOpen, setBookOpen] = useState(false);
  const [authorOpen, setAuthorOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium px-3.5 h-9 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            <Plus className="h-4 w-4" />
            Add
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Add to library</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setBookOpen(true)}>
            <BookOpen className="h-4 w-4 text-slate-500" />
            Add Book
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAuthorOpen(true)}>
            <User className="h-4 w-4 text-slate-500" />
            Add Author
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddBookDialog open={bookOpen} onClose={() => setBookOpen(false)} onAdd={onAdd} />
      <AddAuthorDialog open={authorOpen} onClose={() => setAuthorOpen(false)} onAdd={onAdd} />
    </>
  );
}
