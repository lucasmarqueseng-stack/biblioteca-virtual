export const BOOK_STATUS = {
  NAO_LIDO: "NAO_LIDO",
  LENDO: "LENDO",
  LIDO: "LIDO",
  TENHO: "TENHO",
} as const;

export type BookStatus = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS];

export const STATUS_LABELS: Record<BookStatus, string> = {
  NAO_LIDO: "Não lido",
  LENDO: "Lendo",
  LIDO: "Lido",
  TENHO: "Tenho",
};

export const STATUS_BADGE_CLASSES: Record<BookStatus, string> = {
  NAO_LIDO: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  LENDO: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  LIDO: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  TENHO: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
};

export const STATUS_ORDER: BookStatus[] = ["NAO_LIDO", "LENDO", "LIDO", "TENHO"];

export const BOOK_ORDER_OPTIONS = [
  { value: "title-asc", label: "Título (A-Z)" },
  { value: "year-desc", label: "Ano (mais recente)" },
  { value: "year-asc", label: "Ano (mais antigo)" },
  { value: "rating-desc", label: "Classificação (maior)" },
  { value: "recent", label: "Adicionado recentemente" },
] as const;

export type BookOrderKey = (typeof BOOK_ORDER_OPTIONS)[number]["value"];
