import * as XLSX from "xlsx";

import { BOOK_STATUS, type BookStatus } from "@/lib/constants";

export type ImportRow = {
  line: number;
  title: string;
  authors: string[];
  year: number | null;
  language: string | null;
  genre: string | null;
  status: BookStatus;
  owned: boolean; // "Tenho"
  read: boolean; // "Li"
  error?: string;
};

const HEADER_ALIASES: Record<string, string[]> = {
  title: ["título", "titulo", "title", "nome"],
  authors: ["autor", "autores", "author", "authors"],
  year: ["ano", "ano de publicação", "ano de publicacao", "year"],
  language: ["idioma", "language", "lang"],
  genre: ["gênero", "genero", "categoria", "genre", "category"],
  has: ["tenho", "possuo", "have", "owned"],
  read: ["li", "lido", "read"],
};

function normalize(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findHeaderIndex(headers: unknown[], key: keyof typeof HEADER_ALIASES) {
  const norm = headers.map((h) => normalize(h));
  const aliases = HEADER_ALIASES[key].map(normalize);
  for (let i = 0; i < norm.length; i++) {
    if (aliases.includes(norm[i])) return i;
  }
  return -1;
}

function parseYearCell(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const n = Math.trunc(v);
    if (n > 0 && n < 4000) return n;
    return null;
  }
  const s = String(v).trim();
  const match = s.match(/-?\d{1,4}/);
  if (!match) return null;
  const n = Number(match[0]);
  if (!Number.isFinite(n) || n <= 0 || n >= 4000) return null;
  return n;
}

function parseYesNo(v: unknown): boolean {
  const s = normalize(v);
  return (
    s === "s" ||
    s === "sim" ||
    s === "y" ||
    s === "yes" ||
    s === "true" ||
    s === "1"
  );
}

function parseAuthorsCell(v: unknown): string[] {
  if (v == null) return [];
  const s = String(v).trim();
  if (!s) return [];
  const parts = s
    .split(/[,;\n]|\s+&\s+|\s+e\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const k = p.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

export type ParseResult =
  | { ok: true; rows: ImportRow[]; headersMissing: string[] }
  | { ok: false; error: string };

export function parseXlsxBuffer(buf: ArrayBuffer): ParseResult {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "array" });
  } catch (err) {
    return {
      ok: false,
      error: `Não foi possível ler o arquivo: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  if (wb.SheetNames.length === 0) {
    return { ok: false, error: "Planilha sem abas." };
  }
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: null,
  });
  if (raw.length < 2) {
    return { ok: false, error: "A planilha não tem dados (mínimo 1 cabeçalho + 1 linha)." };
  }

  const headers = raw[0];
  const idx = {
    title: findHeaderIndex(headers, "title"),
    authors: findHeaderIndex(headers, "authors"),
    year: findHeaderIndex(headers, "year"),
    language: findHeaderIndex(headers, "language"),
    genre: findHeaderIndex(headers, "genre"),
    has: findHeaderIndex(headers, "has"),
    read: findHeaderIndex(headers, "read"),
  };
  const headersMissing: string[] = [];
  if (idx.title === -1) headersMissing.push("Título");
  if (idx.authors === -1) headersMissing.push("Autor");
  if (headersMissing.length > 0) {
    return {
      ok: false,
      error: `Colunas obrigatórias não encontradas: ${headersMissing.join(", ")}. Esperado "Título" e "Autor".`,
    };
  }

  const rows: ImportRow[] = [];
  for (let r = 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row) continue;
    const title = String(row[idx.title] ?? "").trim();
    const authors = idx.authors >= 0 ? parseAuthorsCell(row[idx.authors]) : [];
    const year = idx.year >= 0 ? parseYearCell(row[idx.year]) : null;
    const language =
      idx.language >= 0 && row[idx.language] != null
        ? String(row[idx.language]).trim() || null
        : null;
    const genre =
      idx.genre >= 0 && row[idx.genre] != null
        ? String(row[idx.genre]).trim() || null
        : null;
    const owned = idx.has >= 0 ? parseYesNo(row[idx.has]) : false;
    const read = idx.read >= 0 ? parseYesNo(row[idx.read]) : false;

    const status: BookStatus = read ? BOOK_STATUS.LIDO : BOOK_STATUS.NAO_LIDO;

    const item: ImportRow = {
      line: r + 1,
      title,
      authors,
      year,
      language,
      genre,
      status,
      owned,
      read,
    };
    if (!title) item.error = "Título vazio.";
    else if (authors.length === 0) item.error = "Autor vazio.";

    rows.push(item);
  }

  return { ok: true, rows, headersMissing: [] };
}

export function buildDescription(row: ImportRow): string | null {
  const parts: string[] = [];
  if (row.language) parts.push(`Idioma: ${row.language}`);
  return parts.length > 0 ? parts.join("\n") : null;
}
