export interface SearchResult {
  title: string;
  author: string;
  publishYear?: number;
  pages?: number;
  isbn13?: string;
  isbn10?: string;
  isbn?: string; // canonical (isbn13 preferred)
  coverUrl?: string;
  publisher?: string;
  genre?: string;    // comma-separated, e.g. "Mystery,Thriller"
  category?: string; // Fiction / Non-Fiction / Children's / Young Adult
  description?: string;
  language?: string;
}

const GENRE_LIST = [
  "Adventure","Biography","Business","Classic","Crime","Drama","Fantasy",
  "Graphic Novel","History","Horror","Humor","Literary Fiction","Memoir",
  "Mystery","Philosophy","Poetry","Psychology","Romance","Science",
  "Science Fiction","Self-Help","Short Stories","Spirituality","Thriller",
  "Travel","True Crime",
];

function inferFromCategories(cats: string[]): { category?: string; genre?: string } {
  const strings = cats.filter((c): c is string => typeof c === "string");
  const flat = strings.join(" ").toLowerCase();
  const parts = strings.flatMap((c) => c.split(/[/&]/).map((p) => p.trim())).filter(Boolean);

  let category: string | undefined;
  if (/juvenile fiction|children'?s/i.test(flat)) category = "Children's";
  else if (/young adult/i.test(flat)) category = "Young Adult";
  else if (/non.?fiction|nonfiction/i.test(flat)) category = "Non-Fiction";
  else if (/fiction/i.test(flat)) category = "Fiction";
  else if (/biography|history|science|business|self.help|psychology|philosophy|travel/i.test(flat)) category = "Non-Fiction";

  // Match genre list
  const matched: string[] = [];
  for (const g of GENRE_LIST) {
    if (parts.some((p) => p.toLowerCase() === g.toLowerCase() ||
      p.toLowerCase().replace(/\s*&\s*.*/, "").trim() === g.toLowerCase())) {
      if (!matched.includes(g)) matched.push(g);
    }
  }
  // Fallback: look for partial matches
  if (matched.length === 0) {
    for (const g of GENRE_LIST) {
      if (flat.includes(g.toLowerCase()) && !matched.includes(g)) matched.push(g);
    }
  }

  return { category, genre: matched.slice(0, 3).join(",") || undefined };
}

function parseVolume(item: Record<string, unknown>): SearchResult | null {
  const info = item.volumeInfo as Record<string, unknown> | undefined;
  if (!info) return null;

  const title = info.title as string | undefined;
  const authors = (info.authors as string[] | undefined) ?? [];
  if (!title || authors.length === 0) return null;

  const publishedDate = info.publishedDate as string | undefined;
  const publishYear = publishedDate ? parseInt(publishedDate.slice(0, 4)) : undefined;

  const ids = (info.industryIdentifiers as Array<{ type: string; identifier: string }> | undefined) ?? [];
  const isbn13 = ids.find((x) => x.type === "ISBN_13")?.identifier;
  const isbn10 = ids.find((x) => x.type === "ISBN_10")?.identifier;

  const imageLinks = info.imageLinks as Record<string, string> | undefined;
  let coverUrl = imageLinks?.thumbnail ?? imageLinks?.smallThumbnail;
  if (coverUrl) {
    coverUrl = coverUrl.replace(/^http:\/\//, "https://").replace("zoom=1", "zoom=2");
  }

  const categories = (info.categories as string[] | undefined) ?? [];
  const { category, genre } = inferFromCategories(categories);

  const description = info.description as string | undefined;
  const rawLang = info.language as string | undefined;
  const language = rawLang ? (rawLang === "en" ? "English" : rawLang) : undefined;

  return {
    title,
    author: authors.join(", "),
    publishYear: isNaN(publishYear!) ? undefined : publishYear,
    pages: info.pageCount as number | undefined,
    isbn13,
    isbn10,
    isbn: isbn13 ?? isbn10,
    coverUrl,
    publisher: info.publisher as string | undefined,
    genre,
    category,
    description,
    language,
  };
}

async function googleFetch(url: string): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.items as Record<string, unknown>[] | undefined) ?? [];
    return items.map(parseVolume).filter((x): x is SearchResult => x !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// Open Library search fallback (used when Google Books returns nothing)
async function openLibrarySearch(query: string, authorOnly = false): Promise<SearchResult[]> {
  try {
    const param = authorOnly ? `author=${encodeURIComponent(query)}` : `q=${encodeURIComponent(query)}`;
    const url = `https://openlibrary.org/search.json?${param}&limit=20&fields=title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,publisher,subject`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    const docs = (data.docs ?? []) as Record<string, unknown>[];
    return docs
      .filter((d) => d.title && (d.author_name as string[] | undefined)?.length)
      .map((d): SearchResult => {
        const isbns = (d.isbn as string[] | undefined) ?? [];
        const isbn13 = isbns.find((i) => i.length === 13);
        const isbn10 = isbns.find((i) => i.length === 10);
        const coverId = d.cover_i as number | undefined;
        const subjects = (d.subject as string[] | undefined) ?? [];
        const { category, genre } = inferFromCategories(subjects);
        const rawPages = d.number_of_pages_median as number | undefined;
        const rawYear = d.first_publish_year as number | undefined;
        return {
          title: d.title as string,
          author: ((d.author_name as string[] | undefined) ?? []).join(", "),
          publishYear: rawYear ? Math.floor(rawYear) : undefined,
          pages: rawPages ? Math.floor(rawPages) : undefined,
          isbn13,
          isbn10,
          isbn: isbn13 ?? isbn10 ?? isbns[0],
          coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined,
          publisher: ((d.publisher as string[] | undefined) ?? [])[0],
          genre,
          category,
        };
      });
  } catch {
    return [];
  }
}

export async function searchBooks(query: string): Promise<SearchResult[]> {
  const q = encodeURIComponent(query);
  const results = await googleFetch(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=20&printType=books&langRestrict=en`
  );
  if (results.length > 0) return results;
  return openLibrarySearch(query);
}

export async function searchByAuthor(author: string): Promise<SearchResult[]> {
  const q = encodeURIComponent(`inauthor:"${author}"`);
  const results = await googleFetch(
    `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=40&printType=books&orderBy=relevance`
  );
  if (results.length > 0) return results;
  return openLibrarySearch(author, true);
}

export async function searchByISBN(isbn: string): Promise<SearchResult | null> {
  const clean = isbn.replace(/[-\s]/g, "");
  const results = await googleFetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}&maxResults=1`
  );
  if (results.length > 0) return results[0];

  // Fallback: Open Library ISBN API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const key = `ISBN:${clean}`;
    const book = data[key];
    if (!book) return null;
    return {
      title: book.title,
      author: (book.authors ?? []).map((a: { name: string }) => a.name).join(", "),
      publishYear: book.publish_date ? parseInt(book.publish_date.slice(-4)) : undefined,
      pages: book.number_of_pages,
      isbn: clean,
      isbn13: clean.length === 13 ? clean : undefined,
      isbn10: clean.length === 10 ? clean : undefined,
      coverUrl: book.cover?.large ?? book.cover?.medium,
      publisher: (book.publishers ?? [])[0]?.name,
      genre: (book.subjects ?? [])[0]?.name?.split(" -- ")[0],
    };
  } catch {
    return null;
  }
}
