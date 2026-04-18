import { AlertTriangle, BookOpen, CalendarDays, Target } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { GoalProgress } from "@/lib/goals";

export function GoalProgressCard({ progress }: { progress: GoalProgress }) {
  const {
    goal,
    booksFinished,
    pagesRead,
    daysLeftInYear,
    pagesPerDayRequired,
    isBehind,
  } = progress;

  const bookPct = Math.round(progress.bookCompletion * 100);
  const pagePct = Math.round(progress.pageCompletion * 100);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Meta de {goal.year}</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe seu progresso anual
          </p>
        </div>
        {isBehind ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ritmo abaixo do esperado
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
            No ritmo certo
          </span>
        )}
      </div>

      {goal.targetBooks ? (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <BookOpen className="h-4 w-4 text-primary" /> Livros
            </span>
            <span className="text-muted-foreground">
              {booksFinished} / {goal.targetBooks} ({bookPct}%)
            </span>
          </div>
          <Progress value={bookPct} />
        </div>
      ) : null}

      {goal.targetPages ? (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <Target className="h-4 w-4 text-primary" /> Páginas
            </span>
            <span className="text-muted-foreground">
              {pagesRead.toLocaleString("pt-BR")} /{" "}
              {goal.targetPages.toLocaleString("pt-BR")} ({pagePct}%)
            </span>
          </div>
          <Progress value={pagePct} />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4" /> Dias restantes no ano
          </div>
          <div className="mt-1 text-2xl font-semibold">{daysLeftInYear}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-4 w-4" /> Páginas/dia para bater a meta
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {pagesPerDayRequired.toLocaleString("pt-BR")}
          </div>
        </div>
      </div>
    </div>
  );
}
