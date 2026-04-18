import {
  MonthlyBooksChart,
  MonthlyPagesChart,
} from "@/components/charts/goal-charts";
import { YearHistoryCard } from "@/components/year-history-card";
import { GoalBookManager } from "@/components/goal-book-manager";
import { GoalForm } from "@/components/goal-form";
import { GoalProgressCard } from "@/components/goal-progress-card";
import { STATUS_LABELS } from "@/lib/constants";
import {
  computeGoalProgress,
  monthlyProgress,
  summarizeFinishedByYear,
} from "@/lib/goals";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      include: { books: true },
    }),
    prisma.book.findMany({ orderBy: { title: "asc" } }),
    prisma.book.findMany({
      where: { status: "LIDO" },
      orderBy: { finishedAt: "desc" },
    }),
  ]);
  const yearlySummaries = summarizeFinishedByYear(finishedBooks);

  const selectedIds = new Set(goal?.books.map((b) => b.id) ?? []);
  const available = allBooks
    .filter((b) => !selectedIds.has(b.id))
    .map((b) => ({ id: b.id, title: b.title, status: b.status }));
  const selected = (goal?.books ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    status: b.status,
  }));

  const progress = goal ? computeGoalProgress(goal) : null;
  const monthly = goal ? monthlyProgress(goal) : [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Metas de leitura</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina metas anuais, associe livros e acompanhe o ritmo de leitura.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Definir meta de {year}</h2>
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
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">
                Livros concluídos por mês
              </h2>
              <MonthlyBooksChart data={monthly} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Páginas por mês</h2>
              <MonthlyPagesChart data={monthly} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Livros associados à meta ({selected.length})
            </h2>
            <GoalBookManager
              year={year}
              selected={selected}
              available={available.map((b) => ({
                ...b,
                title: `${b.title} — ${STATUS_LABELS[b.status as keyof typeof STATUS_LABELS] ?? b.status}`,
              }))}
            />
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
          <h2 className="text-2xl font-bold tracking-tight">
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
