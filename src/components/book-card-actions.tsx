"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookmarkCheck, Check, MoreVertical, Star, Target } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RatingStars } from "@/components/rating-stars";
import { BOOK_STATUS, STATUS_LABELS } from "@/lib/constants";
import {
  rateBookAction,
  setBookStatusAction,
} from "@/actions/books";
import { addBookToGoalAction } from "@/actions/goals";
import { cn } from "@/lib/utils";

type GoalOption = { year: number };

export function BookCardActions({
  bookId,
  status,
  initialRating,
  goals,
}: {
  bookId: number;
  status: string;
  initialRating: number | null;
  goals: GoalOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(initialRating ?? 0);

  function runStatus(next: string, successMsg: string) {
    start(async () => {
      const res = await setBookStatusAction(bookId, next);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(successMsg);
        router.refresh();
      }
    });
  }

  function toggleTenho() {
    const next = status === BOOK_STATUS.TENHO ? BOOK_STATUS.NAO_LIDO : BOOK_STATUS.TENHO;
    runStatus(
      next,
      next === BOOK_STATUS.TENHO
        ? "Marcado como “Tenho”."
        : "Removido de “Tenho”.",
    );
  }

  function toggleLido() {
    const next = status === BOOK_STATUS.LIDO ? BOOK_STATUS.NAO_LIDO : BOOK_STATUS.LIDO;
    runStatus(
      next,
      next === BOOK_STATUS.LIDO
        ? "Livro marcado como lido!"
        : "Marcado como não lido.",
    );
  }

  function saveRating() {
    start(async () => {
      const res = await rateBookAction(bookId, draftRating);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(
          draftRating === 0
            ? "Avaliação removida."
            : `Avaliado com ${draftRating} estrela${draftRating > 1 ? "s" : ""}.`,
        );
        setRateOpen(false);
        router.refresh();
      }
    });
  }

  function addToGoal(year: number) {
    start(async () => {
      const res = await addBookToGoalAction(year, bookId);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(`Adicionado à meta ${year}.`);
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTenho}
          disabled={pending}
          title={
            status === BOOK_STATUS.TENHO
              ? `Remover de "${STATUS_LABELS.TENHO}"`
              : `Marcar como "${STATUS_LABELS.TENHO}"`
          }
          aria-label="Alternar Tenho"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted",
            status === BOOK_STATUS.TENHO &&
              "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
            pending && "opacity-50",
          )}
        >
          <BookmarkCheck className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleLido}
          disabled={pending}
          title={
            status === BOOK_STATUS.LIDO
              ? `Remover de "${STATUS_LABELS.LIDO}"`
              : `Marcar como "${STATUS_LABELS.LIDO}"`
          }
          aria-label="Alternar Lido"
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted",
            status === BOOK_STATUS.LIDO &&
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            pending && "opacity-50",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            aria-label="Mais ações"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setDraftRating(initialRating ?? 0);
                setRateOpen(true);
              }}
            >
              <Star className="mr-2 h-4 w-4 text-amber-400" />
              Avaliar
            </DropdownMenuItem>
            {goals.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5" />
                  Adicionar à meta
                </DropdownMenuLabel>
                {goals.map((g) => (
                  <DropdownMenuItem
                    key={g.year}
                    onSelect={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      addToGoal(g.year);
                    }}
                  >
                    Meta {g.year}
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {rateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setRateOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Avaliar este livro</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha de 1 a 5 estrelas. Clique na mesma estrela para limpar.
            </p>
            <div className="mt-4 flex justify-center">
              <RatingStars
                value={draftRating}
                size="lg"
                onChange={setDraftRating}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRateOpen(false)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveRating}
                disabled={pending}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
