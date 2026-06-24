export type BookStatus = "read" | "reading" | "want_to_read" | "wishlist" | "dnf";

export const STATUS_LABELS: Record<BookStatus, string> = {
  read: "Read",
  reading: "Currently Reading",
  want_to_read: "To Read",
  wishlist: "Wish List",
  dnf: "Did Not Finish",
};

export const STATUS_COLORS: Record<BookStatus, "read" | "reading" | "want" | "wishlist" | "dnf"> = {
  read: "read",
  reading: "reading",
  want_to_read: "want",
  wishlist: "wishlist",
  dnf: "dnf",
};

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  publishYear: number | null;
  description: string | null;
  pages: number | null;
  genre: string | null;
  publisher: string | null;
  language: string | null;
  status: BookStatus;
  yearRead: number | null;
  rating: number | null;
  notes: string | null;
  tags: string | null;
  category: string | null;
  readFormat: string | null;
  rereadCount: number;
  createdAt: string;
  updatedAt: string;
}
