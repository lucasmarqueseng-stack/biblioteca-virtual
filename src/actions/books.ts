"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { BOOK_STATUS } from "@/lib/constants";
import { bookInputSchema, parseAuthors } from "@/lib/validations";

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0): number {
  const n = parseNumber(value);
  if (n == null) return fallback;
  return Math.trunc(n);
}

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

function buildFromFormData(formData: FormData) {
  const authors = parseAuthors(String(formData.get("authors") ?? ""));
  const initialRating = parseNumber(formData.get("initialRating"));
  const year = parseNumber(formData.get("year"));
  return {
    title: String(formData.get("title") ?? ""),
    authors,
    year: year != null ? Math.trunc(year) : null,
    genre: (String(formData.get("genre") ?? "").trim() || null) as string | null,
    description:
      (String(formData.get("description") ?? "").trim() || null) as string | null,
    coverUrl:
      (String(formData.get("coverUrl") ?? "").trim() || null) as string | null,
    status: (String(formData.get("status") ?? "NAO_LIDO") ||
      "NAO_LIDO") as string,
    initialRating: initialRating != null ? Math.trunc(initialRating) : null,
    pages: parseInteger(formData.get("pages"), 0),
    pagesRead: parseInteger(formData.get("pagesRead"), 0),
  };
}

async function connectAuthors(authorNames: string[]) {
  if (authorNames.length === 0) return [];
  return Promise.all(
    authorNames.map(async (name) => {
      const trimmed = name.trim();
      const existing = await prisma.author.findFirst({
        where: { name: { equals: trimmed } },
      });
      if (existing) return { id: existing.id };
      const created = await prisma.author.create({ data: { name: trimmed } });
      return { id: created.id };
    }),
  );
}

export async function createBookAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = buildFromFormData(formData);
  const parsed = bookInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (parsed.data.pages > 0 && parsed.data.pagesRead > parsed.data.pages) {
    return {
      ok: false,
      error: "Páginas lidas não podem ser maiores que o total de páginas.",
    };
  }
  const authorConnects = await connectAuthors(parsed.data.authors);

  const book = await prisma.book.create({
    data: {
      title: parsed.data.title,
      year: parsed.data.year ?? null,
      genre: parsed.data.genre ?? null,
      description: parsed.data.description ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
      status: parsed.data.status,
      initialRating: parsed.data.initialRating ?? null,
      pages: parsed.data.pages,
      pagesRead: parsed.data.pagesRead,
      authors: { connect: authorConnects },
    },
  });

  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath("/metas");
  redirect(`/livros/${book.id}`);
}

export async function updateBookAction(
  id: number,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = buildFromFormData(formData);
  const parsed = bookInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  if (parsed.data.pages > 0 && parsed.data.pagesRead > parsed.data.pages) {
    return {
      ok: false,
      error: "Páginas lidas não podem ser maiores que o total de páginas.",
    };
  }
  const authorConnects = await connectAuthors(parsed.data.authors);

  await prisma.book.update({
    where: { id },
    data: {
      title: parsed.data.title,
      year: parsed.data.year ?? null,
      genre: parsed.data.genre ?? null,
      description: parsed.data.description ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
      status: parsed.data.status,
      initialRating: parsed.data.initialRating ?? null,
      pages: parsed.data.pages,
      pagesRead: parsed.data.pagesRead,
      authors: { set: authorConnects },
    },
  });

  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath(`/livros/${id}`);
  revalidatePath("/metas");
  redirect(`/livros/${id}`);
}

export async function deleteBookAction(id: number): Promise<void> {
  await prisma.book.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath("/metas");
  redirect("/livros");
}

export async function setBookStatusAction(
  id: number,
  status: string,
): Promise<ActionResult> {
  const valid = Object.values(BOOK_STATUS);
  if (!valid.includes(status as (typeof valid)[number])) {
    return { ok: false, error: "Status inválido." };
  }
  const book = await prisma.book.update({
    where: { id },
    data: {
      status,
      ...(status === BOOK_STATUS.LIDO
        ? { pagesRead: { set: undefined } }
        : {}),
    },
  });

  if (status === BOOK_STATUS.LIDO && book.pages > 0) {
    await prisma.book.update({
      where: { id },
      data: { pagesRead: book.pages },
    });
  }

  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath(`/livros/${id}`);
  revalidatePath("/metas");
  return { ok: true };
}

export async function updatePagesReadAction(
  id: number,
  pagesRead: number,
): Promise<ActionResult> {
  if (!Number.isFinite(pagesRead) || pagesRead < 0) {
    return { ok: false, error: "Número de páginas inválido." };
  }
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return { ok: false, error: "Livro não encontrado." };
  const capped = Math.min(Math.trunc(pagesRead), book.pages || pagesRead);
  await prisma.book.update({
    where: { id },
    data: { pagesRead: capped },
  });

  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath(`/livros/${id}`);
  revalidatePath("/metas");
  return { ok: true };
}
