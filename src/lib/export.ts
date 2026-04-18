import type { Author, Book, Review } from "@prisma/client";

export type BookForExport = Book & {
  authors: Author[];
  reviews: Review[];
};

function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / reviews.length).toFixed(2));
}

function serialize(book: BookForExport) {
  return {
    id: book.id,
    titulo: book.title,
    autores: book.authors.map((a) => a.name),
    ano: book.year,
    genero: book.genre,
    descricao: book.description,
    capa: book.coverUrl,
    status: book.status,
    tenho: book.owned,
    classificacao_inicial: book.initialRating,
    paginas: book.pages,
    paginas_lidas: book.pagesRead,
    concluido_em: book.finishedAt ? book.finishedAt.toISOString() : null,
    avaliacao_media: averageRating(book.reviews),
    total_avaliacoes: book.reviews.length,
  };
}

export function booksToJson(books: BookForExport[]): string {
  return JSON.stringify(books.map(serialize), null, 2);
}

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function booksToCsv(books: BookForExport[]): string {
  const headers = [
    "id",
    "titulo",
    "autores",
    "ano",
    "genero",
    "descricao",
    "status",
    "tenho",
    "classificacao_inicial",
    "paginas",
    "paginas_lidas",
    "concluido_em",
    "avaliacao_media",
    "total_avaliacoes",
  ];
  const lines = [headers.join(",")];
  for (const book of books) {
    const row = serialize(book);
    lines.push(
      headers.map((h) => escapeCsv((row as Record<string, unknown>)[h])).join(","),
    );
  }
  return lines.join("\n");
}
