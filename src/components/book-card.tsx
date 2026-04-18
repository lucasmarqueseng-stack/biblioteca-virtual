import Link from "next/link";
import { BookOpen } from "lucide-react";

import type { Author, Book, Review } from "@prisma/client";

import { RatingStars } from "@/components/rating-stars";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

type BookCardBook = Book & { authors: Author[]; reviews: Review[] };

export function BookCard({ book }: { book: BookCardBook }) {
  const averageRating =
    book.reviews.length > 0
      ? book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length
      : book.initialRating ?? 0;

  const progress =
    book.pages > 0 ? Math.min(book.pagesRead / book.pages, 1) : 0;

  return (
    <Link
      href={`/livros/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
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
        <div className="absolute left-2 top-2">
          <StatusBadge status={book.status} />
        </div>
        {book.pages > 0 && progress > 0 && progress < 1 ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.authors.map((a) => a.name).join(", ") || "—"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <RatingStars value={averageRating} size="sm" readOnly />
          <span
            className={cn(
              "text-xs",
              book.year ? "text-muted-foreground" : "text-transparent",
            )}
          >
            {book.year ?? "0"}
          </span>
        </div>
      </div>
    </Link>
  );
}
