"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

import { OWNED_LABEL } from "@/lib/constants";
import { setBookOwnedAction } from "@/actions/books";
import { cn } from "@/lib/utils";

export function BookOwnedToggle({
  bookId,
  owned,
}: {
  bookId: number;
  owned: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    const next = !owned;
    start(async () => {
      const res = await setBookOwnedAction(bookId, next);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(
          next ? `Marcado como "${OWNED_LABEL}".` : `Removido de "${OWNED_LABEL}".`,
        );
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={owned}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted",
        owned &&
          "border-sky-500/40 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 dark:text-sky-300",
        pending && "opacity-60",
      )}
    >
      <BookmarkCheck className="h-4 w-4" />
      {owned ? `Remover de "${OWNED_LABEL}"` : `Marcar como "${OWNED_LABEL}"`}
    </button>
  );
}
