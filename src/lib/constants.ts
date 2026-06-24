// Top-level category: Fiction vs Non-Fiction split
export const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Children's",
  "Young Adult",
] as const;
export type BookCategory = (typeof CATEGORIES)[number];

// Specific genres — the "what kind" within the category
export const GENRES = [
  "Adventure",
  "Biography",
  "Business",
  "Classic",
  "Crime",
  "Drama",
  "Fantasy",
  "Graphic Novel",
  "History",
  "Horror",
  "Humor",
  "Literary Fiction",
  "Memoir",
  "Mystery",
  "Philosophy",
  "Poetry",
  "Psychology",
  "Romance",
  "Science",
  "Science Fiction",
  "Self-Help",
  "Short Stories",
  "Spirituality",
  "Thriller",
  "Travel",
  "True Crime",
] as const;

export const READ_FORMATS = [
  { value: "physical", label: "Physical" },
  { value: "audiobook", label: "Audiobook" },
  { value: "ebook", label: "E-Book" },
] as const;
export type ReadFormat = (typeof READ_FORMATS)[number]["value"];

export const CURRENT_YEAR = new Date().getFullYear();

export const READ_YEARS = Array.from(
  { length: CURRENT_YEAR - 1950 + 1 },
  (_, i) => CURRENT_YEAR - i
);

export const PUBLISH_YEARS = Array.from(
  { length: CURRENT_YEAR - 1800 + 1 },
  (_, i) => CURRENT_YEAR - i
);
