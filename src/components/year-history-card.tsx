import { BookOpen, Library } from "lucide-react";

import type { YearSummary } from "@/lib/goals";
import { cn } from "@/lib/utils";

export function YearHistoryCard({ summary }: { summary: YearSummary }) {
  const maxMonth = summary.months.reduce(
    (m, cur) => (cur.livros > m ? cur.livros : m),
    0,
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{summary.year}</h3>
          <p className="text-xs text-muted-foreground">
            {summary.totalBooks}{" "}
            {summary.totalBooks === 1 ? "livro lido" : "livros lidos"} no ano
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Livros no ano
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {summary.totalBooks}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              <Library className="h-3.5 w-3.5" />
              Páginas no ano
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {summary.totalPages.toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {summary.months.map((m) => {
          const pct =
            maxMonth > 0 ? Math.round((m.livros / maxMonth) * 100) : 0;
          return (
            <div
              key={m.mes}
              className="flex flex-col items-center gap-1"
              title={`${m.label}: ${m.livros} livros · ${m.paginas.toLocaleString("pt-BR")} páginas`}
            >
              <div className="relative flex h-16 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all",
                    m.livros > 0
                      ? "bg-primary/70 hover:bg-primary"
                      : "bg-muted/50",
                  )}
                  style={{ height: `${Math.max(pct, m.livros > 0 ? 8 : 3)}%` }}
                />
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {m.label}
              </div>
              <div
                className={cn(
                  "text-xs font-semibold",
                  m.livros === 0 && "text-muted-foreground/50",
                )}
              >
                {m.livros}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
