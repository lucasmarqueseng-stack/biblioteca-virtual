import type { Book, ReadingGoal } from "@prisma/client";

import { BOOK_STATUS } from "@/lib/constants";

export type GoalWithBooks = ReadingGoal & { books: Book[] };

export type GoalProgress = {
  goal: GoalWithBooks;
  today: Date;
  booksFinished: number;
  pagesRead: number;
  totalTargetPages: number;
  daysLeftInYear: number;
  bookCompletion: number;
  pageCompletion: number;
  pagesRemaining: number;
  booksRemaining: number;
  pagesPerDayRequired: number;
  isBehind: boolean;
};

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysLeftInYear(today: Date): number {
  const last = new Date(today.getFullYear(), 11, 31);
  // inclui o próprio dia como "disponível"
  const ms = last.getTime() - today.getTime();
  return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1, 0);
}

function bookPagesRead(book: Book): number {
  if (book.status === BOOK_STATUS.LIDO && book.pages > 0) return book.pages;
  return Math.max(book.pagesRead, 0);
}

export function computeGoalProgress(
  goal: GoalWithBooks,
  today: Date = new Date(),
): GoalProgress {
  const booksFinished = goal.books.filter(
    (b) => b.status === BOOK_STATUS.LIDO,
  ).length;
  const pagesRead = goal.books.reduce((acc, b) => acc + bookPagesRead(b), 0);
  const totalTargetPages = goal.books.reduce(
    (acc, b) => acc + Math.max(b.pages, 0),
    0,
  );
  const days = daysLeftInYear(today);

  const bookCompletion = goal.targetBooks
    ? Math.min(booksFinished / goal.targetBooks, 1)
    : 0;
  const pageCompletion = goal.targetPages
    ? Math.min(pagesRead / goal.targetPages, 1)
    : 0;

  const pagesRemaining = goal.targetPages
    ? Math.max(goal.targetPages - pagesRead, 0)
    : Math.max(totalTargetPages - pagesRead, 0);

  const booksRemaining = goal.targetBooks
    ? Math.max(goal.targetBooks - booksFinished, 0)
    : 0;

  const pagesPerDayRequired =
    pagesRemaining > 0 ? Number((pagesRemaining / Math.max(days, 1)).toFixed(2)) : 0;

  const daysInYear = isLeap(goal.year) ? 366 : 365;
  const elapsed = daysInYear - days;
  const expected = daysInYear > 0 ? elapsed / daysInYear : 0;
  const current = Math.max(bookCompletion, pageCompletion);
  const tolerance = 0.05;
  const isBehind = current + tolerance < expected && days > 0;

  return {
    goal,
    today,
    booksFinished,
    pagesRead,
    totalTargetPages,
    daysLeftInYear: days,
    bookCompletion,
    pageCompletion,
    pagesRemaining,
    booksRemaining,
    pagesPerDayRequired,
    isBehind,
  };
}

/** Agrega livros concluídos por mês, usando `updatedAt` como proxy. */
export function monthlyProgress(goal: GoalWithBooks) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    label: [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ][i],
    livros: 0,
    paginas: 0,
  }));

  for (const book of goal.books) {
    if (book.status !== BOOK_STATUS.LIDO) continue;
    const dt = book.updatedAt;
    if (dt.getFullYear() !== goal.year) continue;
    const idx = dt.getMonth();
    months[idx].livros += 1;
    months[idx].paginas += Math.max(book.pages, 0);
  }

  let livrosAcum = 0;
  let paginasAcum = 0;
  return months.map((m) => {
    livrosAcum += m.livros;
    paginasAcum += m.paginas;
    return { ...m, livrosAcumulado: livrosAcum, paginasAcumulado: paginasAcum };
  });
}
