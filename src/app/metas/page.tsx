import {
  MonthlyBooksChart,
  MonthlyPagesChart,
} from "@/components/charts/goal-charts";
import { YearHistoryCard } from "@/components/year-history-card";
import { GoalBookAdder } from "@/components/goal-book-manager";
import { GoalBookGrid } from "@/components/goal-book-grid";
import { GoalForm } from "@/components/goal-form";
import { GoalProgressCard } from "@/components/goal-progress-card";
import { BOOK_STATUS, STATUS_LABELS, type BookStatus } from "@/lib/constants";
import {
  computeGoalProgress,
  monthlyProgress,
  summarizeFinishedByYear,
} from "@/lib/goals";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Ordem de exibição pedida: primeiro os que estou lendo, depois os que preciso
 * ler (não lidos) e, por fim, os que já finalizei.
 */
const GOAL_STATUS_ORDER: Record<BookStatus, number> = {
  [BOOK_STATUS.LENDO]: 0,
  [BOOK_STATUS.NAO_LIDO]: 1,
  [BOOK_STATUS.LIDO]: 2,
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.ano) || new Date().getFullYear();

  const [goal, allBooks, finishedBooks] = await Promise.all([
    prisma.readingGoal.findUnique({
      where: { year },
      include: {
        books: {
          include: { authors: true, reviews: true },
        },
      },
    }),
    prisma.book.findMany({ orderBy: { title: "asc" } }),
    prisma.book.findMany({
      where: { status: "LIDO" },
      include: { authors: true, reviews: true },
      orderBy: { finishedAt: "desc" },
    }),
  ]);
  const yearlySummaries = summarizeFinishedByYear(finishedBooks);

  const selectedIds = new Set(goal?.books.map((b) => b.id) ?? []);
  const available = allBooks
    .filter((b) => !selectedIds.has(b.id))
    .map((b) => ({ id: b.id, title: b.title, status: b.status }));
  const selectedBooks = [...(goal?.books ?? [])].sort((a, b) => {
    const oa = GOAL_STATUS_ORDER[a.status as BookStatus] ?? 99;
    const ob = GOAL_STATUS_ORDER[b.status as BookStatus] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  const progress = goal ? computeGoalProgress(goal) : null;
  const monthly = goal ? monthlyProgress(goal) : [];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
          Hábitos
        </p>
        <h1 className="font-heading mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Metas de leitura
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Defina metas anuais, associe livros e acompanhe o ritmo de leitura.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgba(74,40,26,0.04)]">
        <h2 className="font-heading mb-4 text-xl font-semibold tracking-tight">
          Definir meta de {year}
        </h2>
        <GoalForm
          year={year}
          targetBooks={goal?.targetBooks ?? null}
          targetPages={goal?.targetPages ?? null}
        />
      </div>

      {progress ? (
        <>
          <GoalProgressCard progress={progress} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgba(74,40,26,0.04)]">
              <h2 className="font-heading mb-3 text-xl font-semibold tracking-tight">
                Livros concluídos por mês
              </h2>
              <MonthlyBooksChart data={monthly} />
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgba(74,40,26,0.04)]">
              <h2 className="font-heading mb-3 text-xl font-semibold tracking-tight">
                Páginas por mês
              </h2>
              <MonthlyPagesChart data={monthly} />
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-[0_1px_2px_rgba(74,40,26,0.04)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Livros associados à meta ({selectedBooks.length})
                </h2>
                <p className="mt-1 text-xs italic text-muted-foreground">
                  Ordenados por: lendo → a ler → lidos.
                </p>
              </div>
              <GoalBookAdder
                year={year}
                available={available.map((b) => ({
                  ...b,
                  title: `${b.title} — ${STATUS_LABELS[b.status as keyof typeof STATUS_LABELS] ?? b.status}`,
                }))}
              />
            </div>
            <GoalBookGrid year={year} books={selectedBooks} />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma meta cadastrada para {year}. Use o formulário acima para
            começar.
          </p>
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Histórico por ano
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Total de livros lidos em cada mês e páginas acumuladas por ano.
            Baseado na data &ldquo;Concluído em&rdquo; de cada livro marcado como
            lido.
          </p>
        </div>
        {yearlySummaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum livro concluído ainda. Marque livros como &ldquo;Lido&rdquo;
              para começar a construir seu histórico.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {yearlySummaries.map((s) => (
              <YearHistoryCard key={s.year} summary={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
