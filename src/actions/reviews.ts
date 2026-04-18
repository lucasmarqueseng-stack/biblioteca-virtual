"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { BOOK_STATUS } from "@/lib/constants";
import { reviewInputSchema } from "@/lib/validations";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function addReviewAction(
  bookId: number,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();
  const parsed = reviewInputSchema.safeParse({
    bookId,
    rating,
    comment: comment || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return { ok: false, error: "Livro não encontrado." };
  if (book.status !== BOOK_STATUS.LIDO) {
    return {
      ok: false,
      error: "Só é possível avaliar livros marcados como \"Lido\".",
    };
  }

  await prisma.review.create({
    data: {
      bookId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  });

  revalidatePath(`/livros/${bookId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteReviewAction(
  reviewId: number,
  bookId: number,
): Promise<ActionResult> {
  await prisma.review.delete({ where: { id: reviewId } });
  revalidatePath(`/livros/${bookId}`);
  revalidatePath("/");
  return { ok: true };
}
