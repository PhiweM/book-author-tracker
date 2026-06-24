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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const docs = data.docs ?? [];
    return docs
      .filter((d: Record<string, unknown>) => d.title && (d.author_name as string[])?.length)
      .map((d: Record<string, unknown>) => ({
        title: d.title as string,
        author: ((d.author_name as string[]) ?? []).join(", "),
        publishYear: d.first_publish_year as number | undefined,
        pages: d.number_of_pages_median as number | undefined,
        isbn: ((d.isbn as string[]) ?? [])[0],
        coverUrl: d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : undefined,
        publisher: ((d.publisher as string[]) ?? [])[0],
        genre: ((d.subject as string[]) ?? [])[0],
        openLibraryKey: d.key as string,
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchAuthors(authorName: string): Promise<SearchResult[]> {
  return searchBooks(`author:${authorName}`);
}
