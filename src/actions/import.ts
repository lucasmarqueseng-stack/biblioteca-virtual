"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  buildDescription,
  parseXlsxBuffer,
  type ImportRow,
} from "@/lib/import-xlsx";

export type ImportResult =
  | {
      ok: true;
      created: number;
      skippedDuplicates: number;
      skippedInvalid: number;
      total: number;
      errors: Array<{ line: number; title: string; reason: string }>;
    }
  | { ok: false; error: string };

async function resolveAuthorIds(names: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const existing = await prisma.author.findFirst({
      where: { name: { equals: trimmed } },
    });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    try {
      const created = await prisma.author.create({ data: { name: trimmed } });
      ids.push(created.id);
    } catch {
      // race on @unique name — refetch
      const again = await prisma.author.findFirst({
        where: { name: { equals: trimmed } },
      });
      if (again) ids.push(again.id);
    }
  }
  return ids;
}

export async function importBooksAction(
  formData: FormData,
): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Nenhum arquivo foi enviado." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Arquivo muito grande (máx. 10 MB)." };
  }

  const buf = await file.arrayBuffer();
  const parsed = parseXlsxBuffer(buf);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const valid: ImportRow[] = [];
  const errors: Array<{ line: number; title: string; reason: string }> = [];
  for (const row of parsed.rows) {
    if (row.error) {
      errors.push({ line: row.line, title: row.title, reason: row.error });
      continue;
    }
    valid.push(row);
  }

  // existing titles (case-insensitive) — SQLite default is case-insensitive for ASCII,
  // mas fazemos em JS para ser seguro.
  const existingBooks = await prisma.book.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(
    existingBooks.map((b) => b.title.trim().toLowerCase()),
  );

  let created = 0;
  let skippedDuplicates = 0;

  for (const row of valid) {
    const key = row.title.trim().toLowerCase();
    if (existingTitles.has(key)) {
      skippedDuplicates++;
      continue;
    }

    const authorIds = await resolveAuthorIds(row.authors);
    if (authorIds.length === 0) {
      errors.push({
        line: row.line,
        title: row.title,
        reason: "Autor não pôde ser resolvido.",
      });
      continue;
    }

    const description = buildDescription(row);

    try {
      await prisma.book.create({
        data: {
          title: row.title,
          year: row.year,
          genre: row.genre,
          description,
          status: row.status,
          pages: 0,
          pagesRead: 0,
          authors: { connect: authorIds.map((id) => ({ id })) },
        },
      });
      created++;
      existingTitles.add(key);
    } catch (err) {
      errors.push({
        line: row.line,
        title: row.title,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/livros");
  revalidatePath("/metas");

  return {
    ok: true,
    created,
    skippedDuplicates,
    skippedInvalid: errors.length,
    total: parsed.rows.length,
    errors,
  };
}

// Usada pelo cliente só pra preview — não grava nada.
export async function previewBooksImportAction(
  formData: FormData,
): Promise<
  | { ok: true; rows: ImportRow[] }
  | { ok: false; error: string }
> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Nenhum arquivo foi enviado." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Arquivo muito grande (máx. 10 MB)." };
  }
  const buf = await file.arrayBuffer();
  const parsed = parseXlsxBuffer(buf);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, rows: parsed.rows };
}
