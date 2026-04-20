"use client";

import Link from "next/link";
import { BookOpen, ChevronDown, Library } from "lucide-react";
import { useState } from "react";

import { RatingStars } from "@/components/rating-stars";
import type { BookWithAuthors, MonthSummary, YearSummary } from "@/lib/goals";
import { cn } from "@/lib/utils";

export function YearHistoryCard({ summary }: { summary: YearSummary }) {
  const maxMonth = summary.months.reduce(
    (m, cur) => (cur.livros > m ? cur.livros : m),
    0,
  );
  const monthsWithBooks = summary.months.filter((m) => m.livros > 0);
  const [openMonth, setOpenMonth] = useState<number | null>(null);
  const [showAllYear, setShowAllYear] = useState(false);

  function toggleMonth(mes: number) {
    setShowAllYear(false);
    setOpenMonth((prev) => (prev === mes ? null : mes));
  }

  const allYearBooks = summary.months
    .flatMap((m) => m.books)
    .sort((a, b) => {
      const da = (a.finishedAt ?? a.updatedAt)?.getTime?.() ?? 0;
      const db = (b.finishedAt ?? b.updatedAt)?.getTime?.() ?? 0;
      return db - da;
    });

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgba(74,40,26,0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-heading text-3xl font-semibold tracking-tight">
            {summary.year}
          </h3>
          <p className="text-xs italic text-muted-foreground">
            {summary.totalBooks}{" "}
            {summary.totalBooks === 1 ? "livro lido" : "livros lidos"} no ano
          </p>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Livros no ano
            </div>
            <div className="font-heading text-2xl font-semibold tracking-tight">
              {summary.totalBooks}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <Library className="h-3.5 w-3.5" />
              Páginas no ano
            </div>
            <div className="font-heading text-2xl font-semibold tracking-tight">
              {summary.totalPages.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {summary.months.map((m) => {
          const pct =
            maxMonth > 0 ? Math.round((m.livros / maxMonth) * 100) : 0;
          const hasBooks = m.livros > 0;
          const isOpen = !showAllYear && openMonth === m.mes;
          return (
            <button
              key={m.mes}
              type="button"
              onClick={() => hasBooks && toggleMonth(m.mes)}
              disabled={!hasBooks}
              aria-expanded={isOpen}
              aria-controls={`year-${summary.year}-books`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md p-1 transition",
                hasBooks
                  ? "cursor-pointer hover:bg-muted/60"
                  : "cursor-default",
                isOpen && "bg-muted ring-1 ring-primary/40",
              )}
              title={
                hasBooks
                  ? `${m.label}: ${m.livros} ${m.livros === 1 ? "livro" : "livros"} · ${m.paginas.toLocaleString("pt-BR")} páginas — clique para ver`
                  : `${m.label}: nenhum livro lido`
              }
            >
              <div className="relative flex h-16 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all",
                    hasBooks
                      ? isOpen
                        ? "bg-primary"
                        : "bg-primary/70 hover:bg-primary"
                      : "bg-muted/50",
                  )}
                  style={{ height: `${Math.max(pct, hasBooks ? 8 : 3)}%` }}
                />
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {m.label}
              </div>
              <div
                className={cn(
                  "text-xs font-semibold",
                  !hasBooks && "text-muted-foreground/50",
                )}
              >
                {m.livros}
              </div>
            </button>
          );
        })}
      </div>

      {monthsWithBooks.length > 0 ? (
        <div id={`year-${summary.year}-books`} className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs italic text-muted-foreground">
              {showAllYear || openMonth !== null
                ? "Clique em outro mês para trocar, ou feche abaixo."
                : "Clique em um mês acima para ver os livros lidos."}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowAllYear((v) => !v);
                setOpenMonth(null);
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition",
                showAllYear
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {showAllYear ? "Ocultar todos" : "Ver todos os livros do ano"}
            </button>
          </div>

          {showAllYear ? (
            <YearBooksGrid
              year={summary.year}
              books={allYearBooks}
              onClose={() => setShowAllYear(false)}
            />
          ) : openMonth !== null ? (
            (() => {
              const month = summary.months.find((m) => m.mes === openMonth);
              if (!month) return null;
              return (
                <MonthBooks
                  month={month}
                  year={summary.year}
                  onClose={() => setOpenMonth(null)}
                />
              );
            })()
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MonthBooks({
  month,
  year,
  onClose,
}: {
  month: MonthSummary;
  year: number;
  onClose: () => void;
}) {
  const monthName = MONTH_FULL[month.mes - 1];
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 className="font-heading text-base font-semibold tracking-tight">
            {monthName} de {year}
          </h4>
          <p className="text-xs italic text-muted-foreground">
            {month.livros}{" "}
            {month.livros === 1 ? "livro concluído" : "livros concluídos"} ·{" "}
            {month.paginas.toLocaleString("pt-BR")} páginas
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          Fechar
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {month.books.map((b) => (
          <MonthBookItem key={b.id} book={b} showDay />
        ))}
      </ul>
    </div>
  );
}

function YearBooksGrid({
  year,
  books,
  onClose,
}: {
  year: number;
  books: BookWithAuthors[];
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h4 className="font-heading text-base font-semibold tracking-tight">
            Todos os livros lidos em {year}
          </h4>
          <p className="text-xs italic text-muted-foreground">
            {books.length} {books.length === 1 ? "livro" : "livros"} · ordem:
            mais recente primeiro
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          Fechar
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {books.map((b) => (
          <MonthBookItem key={b.id} book={b} showMonth />
        ))}
      </ul>
    </div>
  );
}

function MonthBookItem({
  book,
  showDay = false,
  showMonth = false,
}: {
  book: BookWithAuthors;
  showDay?: boolean;
  showMonth?: boolean;
}) {
  const average =
    book.reviews.length > 0
      ? book.reviews.reduce((acc, r) => acc + r.rating, 0) /
        book.reviews.length
      : book.initialRating ?? 0;
  const finishedAt = book.finishedAt ?? book.updatedAt;
  const dateLabel = finishedAt
    ? new Date(finishedAt).toLocaleDateString("pt-BR", {
        day: showDay ? "2-digit" : undefined,
        month: "short",
      })
    : null;
  return (
    <li>
      <Link
        href={`/livros/${book.id}`}
        className="group flex gap-3 rounded-lg border border-border/60 bg-card p-2 transition hover:border-primary/40 hover:shadow-[0_2px_8px_-2px_rgba(74,40,26,0.1)]"
      >
        <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-sm bg-gradient-to-br from-[oklch(0.92_0.03_80)] to-[oklch(0.84_0.05_70)]">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="font-heading line-clamp-2 text-sm font-semibold leading-snug tracking-tight group-hover:underline">
            {book.title}
          </div>
          <div className="line-clamp-1 text-xs italic text-muted-foreground">
            {book.authors.map((a) => a.name).join(", ") || "—"}
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <RatingStars value={average} size="sm" readOnly />
            {(showDay || showMonth) && dateLabel ? (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {dateLabel}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}

const MONTH_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
