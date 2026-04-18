"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookmarkCheck, Check, MoreVertical, Star, Target } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RatingStars } from "@/components/rating-stars";
import { BOOK_STATUS, OWNED_LABEL, STATUS_LABELS } from "@/lib/constants";
import {
  rateBookAction,
  setBookOwnedAction,
  setBookStatusAction,
} from "@/actions/books";
import { addBookToGoalAction } from "@/actions/goals";
import { cn } from "@/lib/utils";

type GoalOption = { year: number };

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookCardActions({
  bookId,
  status,
  owned,
  initialRating,
  goals,
}: {
  bookId: number;
  status: string;
  owned: boolean;
  initialRating: number | null;
  goals: GoalOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rateOpen, setRateOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(initialRating ?? 0);
  const [draftDate, setDraftDate] = useState<string>(todayIso());

  function toggleOwned() {
    const next = !owned;
    start(async () => {
      const res = await setBookOwnedAction(bookId, next);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(
          next ? "Marcado como “Tenho”." : "Removido de “Tenho”.",
        );
        router.refresh();
      }
    });
  }

  function toggleLido() {
    if (status === BOOK_STATUS.LIDO) {
      start(async () => {
        const res = await setBookStatusAction(bookId, BOOK_STATUS.NAO_LIDO);
        if (!res.ok) {
          toast.error(res.error);
        } else {
          toast.success("Marcado como não lido.");
          router.refresh();
        }
      });
    } else {
      setDraftDate(todayIso());
      setDateOpen(true);
    }
  }

  function confirmLido() {
    const [y, m, d] = draftDate.split("-").map((s) => Number(s));
    const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (Number.isNaN(dt.getTime())) {
      toast.error("Data inválida.");
      return;
    }
    start(async () => {
      const res = await setBookStatusAction(bookId, BOOK_STATUS.LIDO, dt);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success("Livro marcado como lido!");
        setDateOpen(false);
        router.refresh();
      }
    });
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
          onClick={toggleOwned}
          disabled={pending}
          title={
            owned
              ? `Remover de "${OWNED_LABEL}"`
              : `Marcar como "${OWNED_LABEL}"`
          }
          aria-label="Alternar Tenho"
          aria-pressed={owned}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted",
            owned &&
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
          aria-pressed={status === BOOK_STATUS.LIDO}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted",
            status === BOOK_STATUS.LIDO &&
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            pending && "opacity-50",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Mais ações"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => {
                setTimeout(() => {
                  setDraftRating(initialRating ?? 0);
                  setRateOpen(true);
                }, 0);
              }}
            >
              <Star className="mr-2 h-4 w-4 text-amber-400" />
              Avaliar
            </DropdownMenuItem>
            {goals.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" />
                    Adicionar à meta
                  </DropdownMenuLabel>
                  {goals.map((g) => (
                    <DropdownMenuItem
                      key={g.year}
                      onClick={() => {
                        setTimeout(() => addToGoal(g.year), 0);
                      }}
                    >
                      Meta {g.year}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
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

      {dateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={() => setDateOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">
              Quando você terminou de ler?
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Essa data vai alimentar o histórico mensal/anual.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Data de término
              </label>
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                max={todayIso()}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDateOpen(false)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmLido}
                disabled={pending}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
