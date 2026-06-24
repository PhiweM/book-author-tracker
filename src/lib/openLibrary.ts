export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  isbn?: string[];
  cover_i?: number;
  publisher?: string[];
  subject?: string[];
  language?: string[];
}

export interface SearchResult {
  title: string;
  author: string;
  publishYear?: number;
  pages?: number;
  isbn?: string;
  coverUrl?: string;
  publisher?: string;
  genre?: string;
  openLibraryKey: string;
}

export async function searchBooks(query: string): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encoded}&limit=20&fields=key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,publisher,subject,language`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  const docs: OpenLibraryBook[] = data.docs ?? [];

  return docs
    .filter((d) => d.title && d.author_name?.length)
    .map((d) => ({
      title: d.title,
      author: d.author_name?.join(", ") ?? "Unknown",
      publishYear: d.first_publish_year,
      pages: d.number_of_pages_median,
      isbn: d.isbn?.[0],
      coverUrl: d.cover_i
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : undefined,
      publisher: d.publisher?.[0],
      genre: d.subject?.[0],
      openLibraryKey: d.key,
    }));
}

export async function searchAuthors(authorName: string): Promise<SearchResult[]> {
  return searchBooks(`author:${authorName}`);
}
