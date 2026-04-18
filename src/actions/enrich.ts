"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { fetchBookMetadata } from "@/lib/book-metadata";

export type EnrichResult = {
  ok: true;
  processed: number;
  updatedCover: number;
  updatedPages: number;
  noMatch: number;
  errors: number;
};

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Aplica o update apenas se os campos alvo ainda estão "em branco" no banco
 * (coverUrl=null / pages=0), usando `updateMany` com a cláusula de guarda.
 * Isso evita TOCTOU: mesmo que o usuário tenha editado o livro manualmente
 * entre a leitura inicial e a hora de gravar, nunca sobrescrevemos o valor
 * que ele acabou de definir.
 */
async function applyBlankOnlyUpdate(
  bookId: number,
  coverUrl: string | null,
  pages: number | null,
): Promise<{ wroteCover: boolean; wrotePages: boolean }> {
  let wroteCover = false;
  let wrotePages = false;

  if (coverUrl) {
    const res = await prisma.book.updateMany({
      where: { id: bookId, coverUrl: null },
      data: { coverUrl },
    });
    wroteCover = res.count > 0;
  }
  if (pages) {
    const res = await prisma.book.updateMany({
      where: { id: bookId, pages: 0 },
      data: { pages },
    });
    wrotePages = res.count > 0;
  }
  return { wroteCover, wrotePages };
}

/**
 * Enriquece livros que estão sem capa OU sem páginas, buscando essas informações
 * em APIs públicas (Google Books + Open Library). Não sobrescreve dados já
 * existentes — só preenche os campos em branco, com garantia contra race
 * conditions via `updateMany` condicional.
 */
export async function enrichBooksAction(): Promise<EnrichResult> {
  const targets = await prisma.book.findMany({
    where: {
      OR: [{ coverUrl: null }, { pages: 0 }],
    },
    include: { authors: { take: 1 } },
    orderBy: { id: "asc" },
  });

  let updatedCover = 0;
  let updatedPages = 0;
  let noMatch = 0;
  let errors = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (book) => {
        const author = book.authors[0]?.name ?? "";
        try {
          const meta = await fetchBookMetadata(book.title, author);
          if (!meta.coverUrl && !meta.pages) {
            noMatch++;
            return;
          }
          const { wroteCover, wrotePages } = await applyBlankOnlyUpdate(
            book.id,
            meta.coverUrl,
            meta.pages,
          );
          if (wroteCover) updatedCover++;
          if (wrotePages) updatedPages++;
        } catch {
          errors++;
        }
      }),
    );

    if (i + BATCH_SIZE < targets.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath("/metas");

  return {
    ok: true,
    processed: targets.length,
    updatedCover,
    updatedPages,
    noMatch,
    errors,
  };
}

/** Enriquece um único livro (usado ao criar/editar manualmente). */
export async function enrichSingleBookAction(
  bookId: number,
): Promise<EnrichResult> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { authors: { take: 1 } },
  });
  if (!book) {
    return {
      ok: true,
      processed: 0,
      updatedCover: 0,
      updatedPages: 0,
      noMatch: 0,
      errors: 0,
    };
  }
  const author = book.authors[0]?.name ?? "";
  const meta = await fetchBookMetadata(book.title, author);
  const { wroteCover, wrotePages } = await applyBlankOnlyUpdate(
    bookId,
    meta.coverUrl,
    meta.pages,
  );
  const updatedCover = wroteCover ? 1 : 0;
  const updatedPages = wrotePages ? 1 : 0;
  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath(`/livros/${bookId}`);
  return {
    ok: true,
    processed: 1,
    updatedCover,
    updatedPages,
    noMatch: updatedCover + updatedPages === 0 ? 1 : 0,
    errors: 0,
  };
}
