"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { goalInputSchema } from "@/lib/validations";

type ActionResult = { ok: true } | { ok: false; error: string };

function parseNumberOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

export async function upsertGoalAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const year = parseNumberOrNull(formData.get("year"));
  const targetBooks = parseNumberOrNull(formData.get("targetBooks"));
  const targetPages = parseNumberOrNull(formData.get("targetPages"));
  const parsed = goalInputSchema.safeParse({ year, targetBooks, targetPages });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  await prisma.readingGoal.upsert({
    where: { year: parsed.data.year },
    create: {
      year: parsed.data.year,
      targetBooks: parsed.data.targetBooks ?? null,
      targetPages: parsed.data.targetPages ?? null,
    },
    update: {
      targetBooks: parsed.data.targetBooks ?? null,
      targetPages: parsed.data.targetPages ?? null,
    },
  });
  revalidatePath("/metas");
  revalidatePath("/");
  return { ok: true };
}

export async function addBookToGoalAction(
  year: number,
  bookId: number,
): Promise<ActionResult> {
  const goal = await prisma.readingGoal.findUnique({ where: { year } });
  if (!goal) return { ok: false, error: "Meta não encontrada." };
  await prisma.readingGoal.update({
    where: { id: goal.id },
    data: { books: { connect: { id: bookId } } },
  });
  revalidatePath("/metas");
  revalidatePath("/");
  return { ok: true };
}

export async function removeBookFromGoalAction(
  year: number,
  bookId: number,
): Promise<ActionResult> {
  const goal = await prisma.readingGoal.findUnique({ where: { year } });
  if (!goal) return { ok: false, error: "Meta não encontrada." };
  await prisma.readingGoal.update({
    where: { id: goal.id },
    data: { books: { disconnect: { id: bookId } } },
  });
  revalidatePath("/metas");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteGoalAction(year: number): Promise<ActionResult> {
  await prisma.readingGoal.deleteMany({ where: { year } });
  revalidatePath("/metas");
  revalidatePath("/");
  return { ok: true };
}
