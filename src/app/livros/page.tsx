import Link from "next/link";
import { Download, FileJson, PlusCircle } from "lucide-react";

import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BOOK_ORDER_OPTIONS,
  STATUS_LABELS,
  STATUS_ORDER,
  type BookOrderKey,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  genre?: string;
  order?: BookOrderKey;
}>;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const genre = params.genre ?? "";
  const order: BookOrderKey = (params.order as BookOrderKey) || "recent";

  const where: {
    AND: Array<Record<string, unknown>>;
  } = { AND: [] };
  if (q)
    where.AND.push({
      OR: [
        { title: { contains: q } },
        { authors: { some: { name: { contains: q } } } },
      ],
    });
  if (status && status !== "all") where.AND.push({ status });
  if (genre && genre !== "all") where.AND.push({ genre });

  const orderBy =
    order === "title-asc"
      ? { title: "asc" as const }
      : order === "year-desc"
        ? { year: "desc" as const }
        : order === "year-asc"
          ? { year: "asc" as const }
          : order === "rating-desc"
            ? { initialRating: "desc" as const }
            : { updatedAt: "desc" as const };

  const [books, allGenres] = await Promise.all([
    prisma.book.findMany({
      where,
      include: { authors: true, reviews: true },
      orderBy,
    }),
    prisma.book.findMany({
      distinct: ["genre"],
      select: { genre: true },
      where: { genre: { not: null } },
    }),
  ]);

  const genres = Array.from(
    new Set(
      allGenres
        .map((g) => (g.genre ?? "").trim())
        .filter((g): g is string => Boolean(g)),
    ),
  ).sort();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {books.length}{" "}
            {books.length === 1 ? "livro encontrado" : "livros encontrados"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/api/export?format=csv"
            className={buttonVariants({ variant: "outline" })}
          >
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Link>
          <Link
            href="/api/export?format=json"
            className={buttonVariants({ variant: "outline" })}
          >
            <FileJson className="mr-1 h-4 w-4" />
            JSON
          </Link>
          <Link href="/livros/novo" className={buttonVariants()}>
            <PlusCircle className="mr-1 h-4 w-4" />
            Novo livro
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-4"
      >
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Buscar por título ou autor
          </label>
          <Input
            name="q"
            defaultValue={q}
            placeholder="Ex.: Machado, Dom Casmurro"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select name="status" defaultValue={status}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Gênero
          </label>
          <Select name="genre" defaultValue={genre}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {genres.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Ordenar por
          </label>
          <Select name="order" defaultValue={order}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOK_ORDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-1">
          <button
            type="submit"
            className={buttonVariants({ className: "w-full" })}
          >
            Filtrar
          </button>
        </div>
      </form>

      {books.length === 0 ? (
        <EmptyState
          title="Nenhum livro encontrado"
          description="Ajuste os filtros ou adicione um novo livro à sua coleção."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
