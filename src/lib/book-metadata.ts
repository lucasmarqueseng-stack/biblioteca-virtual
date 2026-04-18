// Busca metadados (capa + número de páginas) em APIs públicas.
// Não requer API key. A Google Books API é preferida para pageCount;
// Open Library é usada como fallback, especialmente para capas.

export type BookMetadata = {
  coverUrl: string | null;
  pages: number | null;
  description: string | null;
  initialRating: number | null;
  source: "google-books" | "open-library" | "combined" | null;
};

const EMPTY: BookMetadata = {
  coverUrl: null,
  pages: null,
  description: null,
  initialRating: null,
  source: null,
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeTitle(title: string): string {
  return stripDiacritics(title).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();
}

function sanitize(s: string): string {
  return s.replace(/["']/g, "").trim();
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": "BibliotecaVirtual/1.0 (educacional, sem uso comercial)",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type GoogleBooksVolume = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    description?: string;
    averageRating?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

type GoogleBooksResponse = {
  items?: GoogleBooksVolume[];
};

export async function fetchFromGoogleBooks(
  title: string,
  author: string,
): Promise<BookMetadata> {
  const cleanTitle = sanitize(title);
  const cleanAuthor = sanitize(author);
  if (!cleanTitle) return EMPTY;

  const q = `intitle:"${cleanTitle}"${
    cleanAuthor ? `+inauthor:"${cleanAuthor}"` : ""
  }`;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    q,
  )}&maxResults=3&printType=books`;

  const data = (await fetchJson(url)) as GoogleBooksResponse | null;
  if (!data || !data.items || data.items.length === 0) return EMPTY;

  const normQuery = normalizeTitle(cleanTitle);

  // Preferimos o primeiro item cujo título bate exatamente (sem diacríticos).
  // Se nenhum bater, usamos o primeiro item.
  const match =
    data.items.find(
      (item) =>
        normalizeTitle(item.volumeInfo?.title ?? "").startsWith(normQuery),
    ) ?? data.items[0];

  const info = match.volumeInfo ?? {};
  const pages =
    typeof info.pageCount === "number" && info.pageCount > 0
      ? info.pageCount
      : null;
  let coverUrl = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;
  // Google retorna http — usamos https para evitar mixed-content.
  if (coverUrl && coverUrl.startsWith("http://")) {
    coverUrl = "https://" + coverUrl.slice(7);
  }
  // Substitui o parâmetro zoom para obter uma imagem em maior resolução.
  if (coverUrl) {
    coverUrl = coverUrl.replace(/&zoom=\d+/, "&zoom=1").replace(/&edge=curl/, "");
  }
  const description =
    typeof info.description === "string" && info.description.trim().length > 0
      ? stripHtml(info.description).slice(0, 2000)
      : null;
  const initialRating =
    typeof info.averageRating === "number" && info.averageRating > 0
      ? Math.min(5, Math.max(1, Math.round(info.averageRating)))
      : null;
  if (!coverUrl && !pages && !description && !initialRating) return EMPTY;
  return { coverUrl, pages, description, initialRating, source: "google-books" };
}

type OpenLibrarySearchDoc = {
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number | null;
  cover_i?: number | null;
  edition_key?: string[];
  key?: string; // /works/OLxxxxW
  ratings_average?: number | null;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchDoc[];
};

type OpenLibraryEdition = {
  number_of_pages?: number;
  covers?: number[];
};

type OpenLibraryWork = {
  description?: string | { value?: string };
};

async function fetchOpenLibraryWorkDescription(
  workKey: string,
): Promise<string | null> {
  const data = (await fetchJson(
    `https://openlibrary.org${workKey}.json`,
  )) as OpenLibraryWork | null;
  if (!data?.description) return null;
  const raw =
    typeof data.description === "string"
      ? data.description
      : data.description.value ?? "";
  const clean = stripHtml(raw);
  return clean.length > 0 ? clean.slice(0, 2000) : null;
}

async function fetchOpenLibraryEditionPages(
  editionKey: string,
): Promise<number | null> {
  const data = (await fetchJson(
    `https://openlibrary.org/books/${editionKey}.json`,
  )) as OpenLibraryEdition | null;
  const pages = data?.number_of_pages;
  return typeof pages === "number" && pages > 0 ? pages : null;
}

export async function fetchFromOpenLibrary(
  title: string,
  author: string,
): Promise<BookMetadata> {
  const cleanTitle = sanitize(title);
  const cleanAuthor = sanitize(author);
  if (!cleanTitle) return EMPTY;

  const params = new URLSearchParams({
    title: cleanTitle,
    limit: "3",
    fields:
      "title,author_name,number_of_pages_median,cover_i,edition_key,key,ratings_average",
  });
  if (cleanAuthor) params.set("author", cleanAuthor);

  const data = (await fetchJson(
    `https://openlibrary.org/search.json?${params.toString()}`,
  )) as OpenLibrarySearchResponse | null;
  if (!data || !data.docs || data.docs.length === 0) return EMPTY;

  const normQuery = normalizeTitle(cleanTitle);
  const match =
    data.docs.find((d) => normalizeTitle(d.title ?? "") === normQuery) ??
    data.docs[0];

  const coverUrl = match.cover_i
    ? `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`
    : null;

  let pages =
    typeof match.number_of_pages_median === "number" &&
    match.number_of_pages_median > 0
      ? match.number_of_pages_median
      : null;

  // Fallback: tenta uma edição para pegar pageCount.
  if (!pages && match.edition_key && match.edition_key.length > 0) {
    pages = await fetchOpenLibraryEditionPages(match.edition_key[0]);
  }

  let description: string | null = null;
  if (match.key) {
    description = await fetchOpenLibraryWorkDescription(match.key);
  }

  const initialRating =
    typeof match.ratings_average === "number" && match.ratings_average > 0
      ? Math.min(5, Math.max(1, Math.round(match.ratings_average)))
      : null;

  if (!coverUrl && !pages && !description && !initialRating) return EMPTY;
  return {
    coverUrl,
    pages,
    description,
    initialRating,
    source: "open-library",
  };
}

/**
 * Busca capa, páginas, descrição e avaliação combinando Google Books e Open
 * Library. Para cada campo usamos o primeiro valor não-nulo entre Google Books
 * e Open Library (nessa ordem).
 */
export async function fetchBookMetadata(
  title: string,
  author: string,
): Promise<BookMetadata> {
  const [g, o] = await Promise.all([
    fetchFromGoogleBooks(title, author),
    fetchFromOpenLibrary(title, author),
  ]);
  const coverUrl = g.coverUrl ?? o.coverUrl ?? null;
  const pages = g.pages ?? o.pages ?? null;
  const description = g.description ?? o.description ?? null;
  const initialRating = g.initialRating ?? o.initialRating ?? null;
  if (!coverUrl && !pages && !description && !initialRating) return EMPTY;
  const source: BookMetadata["source"] =
    g.source && o.source ? "combined" : g.source ?? o.source ?? null;
  return { coverUrl, pages, description, initialRating, source };
}
