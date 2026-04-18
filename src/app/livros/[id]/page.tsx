import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  Edit3,
  Library,
  Star,
} from "lucide-react";

import { BookOwnedToggle } from "@/components/book-owned-toggle";
import { BookStatusSelect } from "@/components/book-status-select";
import { DeleteBookDialog } from "@/components/delete-book-dialog";
import { DeleteReviewButton } from "@/components/delete-review-button";
import { FinishedAtEditor } from "@/components/finished-at-editor";
import { PagesReadInput } from "@/components/pages-read-input";
import { RatingStars } from "@/components/rating-stars";
import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BOOK_STATUS,
  OWNED_BADGE_CLASS,
  OWNED_LABEL,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId < 1) notFound();

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      authors: true,
      reviews: { orderBy: { createdAt: "desc" } },
      goals: true,
    },
  });
  if (!book) notFound();

  const averageRating =
    book.reviews.length > 0
      ? book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length
      : null;

  const progressPct =
    book.pages > 0 ? Math.round((book.pagesRead / book.pages) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/livros"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← voltar para a biblioteca
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/livros/${book.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Edit3 className="mr-1 h-4 w-4" />
            Editar
          </Link>
          <DeleteBookDialog bookId={book.id} title={book.title} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg dark:from-slate-800 dark:to-slate-900">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={`Capa de ${book.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="w-full space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground">
              Status atual
            </div>
            <BookStatusSelect bookId={book.id} value={book.status} />
            <BookOwnedToggle bookId={book.id} owned={book.owned} />
            {book.status === BOOK_STATUS.LIDO ? (
              <FinishedAtEditor bookId={book.id} value={book.finishedAt} />
            ) : null}
            {book.pages > 0 ? (
              <>
                <PagesReadInput
                  bookId={book.id}
                  initial={book.pagesRead}
                  total={book.pages}
                />
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={book.status} />
              {book.owned ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    OWNED_BADGE_CLASS,
                  )}
                >
                  {OWNED_LABEL}
                </span>
              ) : null}
              {book.genre ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <Library className="h-3 w-3" />
                  {book.genre}
                </span>
              ) : null}
              {book.year ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {book.year}
                </span>
              ) : null}
              {book.status === BOOK_STATUS.LIDO && book.finishedAt ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <CalendarCheck2 className="h-3 w-3" />
                  Concluído em{" "}
                  {new Date(book.finishedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {book.authors.map((a) => a.name).join(", ") || "Autoria desconhecida"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Classificação inicial
              </div>
              <RatingStars value={book.initialRating ?? 0} readOnly />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Avaliação média
              </div>
              {averageRating != null ? (
                <div className="flex items-center gap-2">
                  <RatingStars value={averageRating} readOnly />
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({book.reviews.length})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem avaliações</p>
              )}
            </div>
          </div>

          {book.description ? (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Sinopse</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {book.description}
              </p>
            </div>
          ) : null}

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Star className="h-5 w-5 text-amber-400" />
              Avaliações
            </h2>
            {book.status === BOOK_STATUS.LIDO ? (
              <div className="mb-4 rounded-2xl border border-border bg-card p-4">
                <ReviewForm bookId={book.id} />
              </div>
            ) : (
              <p className="mb-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Marque o livro como &quot;Lido&quot; para escrever uma avaliação.
              </p>
            )}

            {book.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma avaliação registrada ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {book.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <RatingStars value={r.rating} readOnly size="sm" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <DeleteReviewButton reviewId={r.id} bookId={book.id} />
                    </div>
                    {r.comment ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {r.comment}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
