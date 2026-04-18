import Link from "next/link";
import { BookmarkCheck, BookOpen } from "lucide-react";

import type { Author, Book, Review } from "@prisma/client";

import { BookCardActions } from "@/components/book-card-actions";
import { RatingStars } from "@/components/rating-stars";
import { StatusBadge } from "@/components/status-badge";
import { OWNED_BADGE_CLASS, OWNED_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BookCardBook = Book & { authors: Author[]; reviews: Review[] };
type GoalOption = { year: number };

export function BookCard({
  book,
  goals = [],
}: {
  book: BookCardBook;
  goals?: GoalOption[];
}) {
  const averageRating =
    book.reviews.length > 0
      ? book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length
      : book.initialRating ?? 0;

  const progress =
    book.pages > 0 ? Math.min(book.pagesRead / book.pages, 1) : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(74,40,26,0.04),0_4px_16px_-6px_rgba(74,40,26,0.08)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_12px_-2px_rgba(74,40,26,0.12),0_10px_24px_-8px_rgba(74,40,26,0.18)]">
      <Link
        href={`/livros/${book.id}`}
        aria-label={`Abrir detalhes de ${book.title}`}
        className="relative block aspect-[2/3] overflow-hidden bg-gradient-to-br from-[oklch(0.92_0.03_80)] to-[oklch(0.84_0.05_70)]"
      >
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={`Capa de ${book.title}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <StatusBadge status={book.status} />
          {book.owned ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                OWNED_BADGE_CLASS,
              )}
              title={OWNED_LABEL}
            >
              <BookmarkCheck className="h-3 w-3" />
              {OWNED_LABEL}
            </span>
          ) : null}
        </div>
        {book.pages > 0 && progress > 0 && progress < 1 ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <Link
          href={`/livros/${book.id}`}
          className="font-heading line-clamp-2 text-[0.95rem] font-semibold leading-snug tracking-tight hover:underline"
        >
          {book.title}
        </Link>
        <p className="line-clamp-1 text-xs italic text-muted-foreground">
          {book.authors.map((a) => a.name).join(", ") || "—"}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <RatingStars value={averageRating} size="sm" readOnly />
          <span
            className={cn(
              "font-heading text-xs",
              book.year ? "text-muted-foreground" : "text-transparent",
            )}
          >
            {book.year ?? "0"}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-end">
          <BookCardActions
            bookId={book.id}
            status={book.status}
            owned={book.owned}
            initialRating={book.initialRating}
            goals={goals}
          />
        </div>
      </div>
    </div>
  );
}
