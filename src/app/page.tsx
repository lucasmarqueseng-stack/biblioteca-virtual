import Link from "next/link";
import {
  BookmarkCheck,
  BookOpen,
  Library,
  PlusCircle,
  Target,
  TrendingUp,
} from "lucide-react";

import { BookCard } from "@/components/book-card";
import {
  GenreBarChart,
  StatusPieChart,
} from "@/components/charts/dashboard-charts";
import { EmptyState } from "@/components/empty-state";
import { GoalProgressCard } from "@/components/goal-progress-card";
import { MetricCard } from "@/components/metric-card";
import { buttonVariants } from "@/components/ui/button";
import {
  BOOK_STATUS,
  STATUS_ORDER,
  type BookStatus,
} from "@/lib/constants";
import { computeGoalProgress } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [books, goal, allGoals] = await Promise.all([
    prisma.book.findMany({
      include: { authors: true, reviews: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.readingGoal.findUnique({
      where: { year: currentYear },
      include: { books: true },
    }),
    prisma.readingGoal.findMany({
      select: { year: true },
      orderBy: { year: "desc" },
    }),
  ]);

  const totalBooks = books.length;
  const totalRead = books.filter((b) => b.status === BOOK_STATUS.LIDO).length;
  const totalReading = books.filter((b) => b.status === BOOK_STATUS.LENDO).length;
  const totalHave = books.filter((b) => b.owned).length;
  const totalPagesAcervo = books.reduce((acc, b) => acc + Math.max(b.pages, 0), 0);
  const totalPagesRead = books.reduce((acc, b) => {
    if (b.status === BOOK_STATUS.LIDO && b.pages > 0) return acc + b.pages;
    return acc + b.pagesRead;
  }, 0);

  const pctLidos = totalBooks > 0 ? Math.round((totalRead / totalBooks) * 100) : 0;
  const pctTenho = totalBooks > 0 ? Math.round((totalHave / totalBooks) * 100) : 0;

  const statusData = STATUS_ORDER.map<{ status: BookStatus; count: number }>(
    (status) => ({
      status,
      count: books.filter((b) => b.status === status).length,
    }),
  );

  const genreCounts: Record<string, number> = {};
  for (const b of books) {
    const g = (b.genre ?? "Sem gênero").trim() || "Sem gênero";
    genreCounts[g] = (genreCounts[g] ?? 0) + 1;
  }
  const genreData = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const recent = books.slice(0, 8);
  const goalProgress = goal ? computeGoalProgress(goal) : null;

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Biblioteca Virtual</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Boas-vindas de volta!
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Acompanhe seu acervo, marque o progresso da leitura, avalie livros
            concluídos e alcance suas metas anuais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/livros" className={buttonVariants({ variant: "outline" })}>
            <Library className="mr-1 h-4 w-4" />
            Ver biblioteca
          </Link>
          <Link href="/livros/novo" className={buttonVariants()}>
            <PlusCircle className="mr-1 h-4 w-4" />
            Novo livro
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Livros no acervo"
          value={totalBooks}
          hint={`${totalPagesAcervo.toLocaleString("pt-BR")} páginas no total`}
          icon={BookOpen}
          href="/livros"
        />
        <MetricCard
          label="Tenho"
          value={totalHave}
          hint={
            totalBooks > 0
              ? `${pctTenho}% do acervo`
              : "Na estante"
          }
          icon={BookmarkCheck}
          href="/livros?owned=1"
        />
        <MetricCard
          label="Lidos"
          value={totalRead}
          hint={
            totalBooks > 0
              ? `${pctLidos}% do acervo · ${totalReading} em leitura`
              : `${totalReading} em leitura`
          }
          icon={TrendingUp}
          tone="success"
          href="/livros?status=LIDO"
        />
        <MetricCard
          label="Páginas lidas"
          value={totalPagesRead.toLocaleString("pt-BR")}
          hint="Somatório histórico"
          icon={Library}
        />
        <MetricCard
          label="Meta de"
          value={goal ? goal.year : currentYear}
          hint={
            goal
              ? `${goal.targetBooks ?? 0} livros · ${(goal.targetPages ?? 0).toLocaleString("pt-BR")} páginas`
              : "Defina sua meta em /metas"
          }
          icon={Target}
          tone={goalProgress?.isBehind ? "warning" : "default"}
          href="/metas"
        />
      </section>

      {goalProgress ? (
        <section>
          <GoalProgressCard progress={goalProgress} />
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Status da coleção</h2>
          <StatusPieChart data={statusData} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Gêneros mais presentes</h2>
          <GenreBarChart data={genreData} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Últimos adicionados</h2>
          <Link
            href="/livros"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recent.map((book) => (
              <BookCard key={book.id} book={book} goals={allGoals} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
