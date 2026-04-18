// Busca metadados (capa, páginas, descrição, avaliação) em APIs públicas.
// Não requer API key. A Google Books API é preferida para pageCount/descrição;
// Open Library é usada como fallback, especialmente para capas.
//
// Estratégias para maximizar acerto:
// - Retry com backoff exponencial em 5xx/429/erros de rede.
// - Cascata de queries no Google (aspas → sem aspas → livre → só título).
// - Open Library: se busca com autor vier vazia, refaz sem autor.
// - Mapa curado de títulos PT→EN para clássicos sem edição em português na OL.
// - Validação de autor por similaridade para evitar matches falsos.

import { PT_TO_EN_TITLES } from "./title-translations";

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

// --- helpers ---------------------------------------------------------------

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(s: string): string {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function sanitize(s: string): string {
  return s.replace(/["']/g, "").trim();
}

/** Remove prefixos comuns que atrapalham o match (ex.: "D. ", subtítulos). */
function simplifyTitle(title: string): string {
  return title
    .replace(/^([A-Z]\.\s*)+/, "")
    .replace(/[:\-—–].*$/, "") // remove subtítulos depois de :, -, —, –
    .trim();
}

/**
 * Similaridade Jaccard sobre tokens normalizados. 1 = igual, 0 = disjunto.
 * Suficiente pra comparar autores ("J.R.R. Tolkien" vs "Tolkien, J.R.R.").
 */
function similarity(a: string, b: string): number {
  const A = new Set(normalize(a).split(" ").filter(Boolean));
  const B = new Set(normalize(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Verifica se algum dos autores retornados "parece" o autor buscado. */
function authorsMatch(
  wanted: string,
  candidates: readonly string[] | undefined,
): boolean {
  if (!wanted) return true;
  if (!candidates || candidates.length === 0) return false;
  const w = normalize(wanted);
  const lastName = w.split(" ").filter((t) => t.length > 2).pop() ?? "";
  for (const c of candidates) {
    const n = normalize(c);
    if (n === w) return true;
    if (lastName && n.includes(lastName)) return true;
    if (similarity(w, n) >= 0.5) return true;
  }
  return false;
}

async function fetchJson(url: string): Promise<unknown> {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [400, 900, 1800];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "BibliotecaVirtual/1.0 (educacional, sem uso comercial)",
          Accept: "application/json",
        },
      });
      if (res.ok) return await res.json();
      // 4xx "legítimo" (ex.: 400 inválido, 404 não encontrado) → não retry.
      if (
        res.status >= 400 &&
        res.status < 500 &&
        res.status !== 408 &&
        res.status !== 429
      ) {
        return null;
      }
      // 5xx / 408 / 429 → retry com backoff.
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
        continue;
      }
      return null;
    } catch {
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
        continue;
      }
      return null;
    }
  }
  return null;
}

// --- Google Books ----------------------------------------------------------

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

function pickGoogleMatch(
  items: GoogleBooksVolume[],
  normTitle: string,
  wantedAuthor: string,
): GoogleBooksVolume | null {
  const strong = items.find(
    (it) =>
      normalize(it.volumeInfo?.title ?? "").startsWith(normTitle) &&
      authorsMatch(wantedAuthor, it.volumeInfo?.authors),
  );
  if (strong) return strong;
  const byTitle = items.find((it) =>
    normalize(it.volumeInfo?.title ?? "").startsWith(normTitle),
  );
  if (byTitle) return byTitle;
  const byAuthor = items.find((it) =>
    authorsMatch(wantedAuthor, it.volumeInfo?.authors),
  );
  if (byAuthor) return byAuthor;
  return null;
}

function extractGoogle(
  match: GoogleBooksVolume,
): Omit<BookMetadata, "source"> {
  const info = match.volumeInfo ?? {};
  const pages =
    typeof info.pageCount === "number" && info.pageCount > 0
      ? info.pageCount
      : null;
  let coverUrl =
    info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;
  if (coverUrl && coverUrl.startsWith("http://")) {
    coverUrl = "https://" + coverUrl.slice(7);
  }
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
  return { coverUrl, pages, description, initialRating };
}

/** Variações de query Google Books, em ordem de precisão. */
function buildGoogleQueries(title: string, author: string): string[] {
  const t = sanitize(title);
  const a = sanitize(author);
  const queries: string[] = [];
  if (a) {
    queries.push(`intitle:"${t}"+inauthor:"${a}"`);
    queries.push(`intitle:${t}+inauthor:${a}`);
    queries.push(`${t} ${a}`);
  } else {
    queries.push(`intitle:"${t}"`);
    queries.push(`intitle:${t}`);
  }
  queries.push(t);
  return queries;
}

async function googleBooksSearch(
  title: string,
  author: string,
): Promise<BookMetadata> {
  const cleanTitle = sanitize(title);
  if (!cleanTitle) return EMPTY;
  const normTitle = normalize(cleanTitle);
  const queries = buildGoogleQueries(cleanTitle, author);

  for (const q of queries) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      q,
    )}&maxResults=5&printType=books`;
    const data = (await fetchJson(url)) as GoogleBooksResponse | null;
    if (!data || !data.items || data.items.length === 0) continue;
    const match = pickGoogleMatch(data.items, normTitle, author);
    if (!match) continue;
    const fields = extractGoogle(match);
    if (
      !fields.coverUrl &&
      !fields.pages &&
      !fields.description &&
      !fields.initialRating
    ) {
      continue;
    }
    return { ...fields, source: "google-books" };
  }
  return EMPTY;
}

export async function fetchFromGoogleBooks(
  title: string,
  author: string,
): Promise<BookMetadata> {
  const attempts: Array<[string, string]> = [];
  attempts.push([title, author]);
  const simple = simplifyTitle(title);
  if (simple && simple !== title) attempts.push([simple, author]);
  const english = PT_TO_EN_TITLES[normalize(title)];
  if (english) attempts.push([english, author]);

  for (const [t, a] of attempts) {
    const res = await googleBooksSearch(t, a);
    if (res.source) return res;
  }
  return EMPTY;
}

// --- Open Library ----------------------------------------------------------

type OpenLibrarySearchDoc = {
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number | null;
  cover_i?: number | null;
  cover_edition_key?: string | null;
  edition_key?: string[];
  key?: string;
  ratings_average?: number | null;
  first_sentence?: string[];
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

function pickOpenLibraryMatch(
  docs: OpenLibrarySearchDoc[],
  normTitle: string,
  wantedAuthor: string,
): OpenLibrarySearchDoc | null {
  const strong = docs.find(
    (d) =>
      normalize(d.title ?? "") === normTitle &&
      authorsMatch(wantedAuthor, d.author_name),
  );
  if (strong) return strong;
  const prefix = docs.find(
    (d) =>
      normalize(d.title ?? "").startsWith(normTitle) &&
      authorsMatch(wantedAuthor, d.author_name),
  );
  if (prefix) return prefix;
  const byAuthor = docs.find((d) => authorsMatch(wantedAuthor, d.author_name));
  if (byAuthor) return byAuthor;
  return docs.find((d) => normalize(d.title ?? "") === normTitle) ?? null;
}

async function openLibrarySearchOnce(
  title: string,
  author: string,
  opts: { withAuthor: boolean },
): Promise<BookMetadata> {
  const cleanTitle = sanitize(title);
  const cleanAuthor = sanitize(author);
  if (!cleanTitle) return EMPTY;
  const normTitle = normalize(cleanTitle);

  const params = new URLSearchParams({
    title: cleanTitle,
    limit: "10",
    fields:
      "title,author_name,number_of_pages_median,cover_i,cover_edition_key,edition_key,key,ratings_average,first_sentence",
  });
  if (opts.withAuthor && cleanAuthor) params.set("author", cleanAuthor);

  const data = (await fetchJson(
    `https://openlibrary.org/search.json?${params.toString()}`,
  )) as OpenLibrarySearchResponse | null;
  if (!data || !data.docs || data.docs.length === 0) return EMPTY;

  const match = pickOpenLibraryMatch(data.docs, normTitle, cleanAuthor);
  if (!match) return EMPTY;

  let coverUrl: string | null = match.cover_i
    ? `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`
    : null;
  if (!coverUrl && match.cover_edition_key) {
    coverUrl = `https://covers.openlibrary.org/b/olid/${match.cover_edition_key}-L.jpg`;
  }

  let pages =
    typeof match.number_of_pages_median === "number" &&
    match.number_of_pages_median > 0
      ? match.number_of_pages_median
      : null;

  if (!pages && match.edition_key && match.edition_key.length > 0) {
    pages = await fetchOpenLibraryEditionPages(match.edition_key[0]);
  }

  let description: string | null = null;
  if (match.key) {
    description = await fetchOpenLibraryWorkDescription(match.key);
  }
  if (!description && match.first_sentence && match.first_sentence.length > 0) {
    const sent = match.first_sentence[0];
    if (sent && sent.trim().length > 20) description = sent.trim().slice(0, 2000);
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

export async function fetchFromOpenLibrary(
  title: string,
  author: string,
): Promise<BookMetadata> {
  const attempts: Array<[string, string, boolean]> = [[title, author, true]];
  attempts.push([title, author, false]);
  const simple = simplifyTitle(title);
  if (simple && simple !== title) {
    attempts.push([simple, author, true]);
    attempts.push([simple, author, false]);
  }
  const english = PT_TO_EN_TITLES[normalize(title)];
  if (english) {
    attempts.push([english, author, true]);
    attempts.push([english, author, false]);
  }

  for (const [t, a, withAuthor] of attempts) {
    const res = await openLibrarySearchOnce(t, a, { withAuthor });
    if (res.source) return res;
  }
  return EMPTY;
}

// --- Combinação ------------------------------------------------------------

/**
 * Busca capa, páginas, descrição e avaliação combinando Google Books e Open
 * Library. Para cada campo usamos o primeiro valor não-nulo entre Google Books
 * e Open Library (nessa ordem). Não sobrescrevemos dados — o chamador ainda
 * aplica blank-only update.
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
