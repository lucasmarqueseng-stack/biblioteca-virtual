"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setFinishedAtAction } from "@/actions/books";
import { cn } from "@/lib/utils";

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FinishedAtEditor({
  bookId,
  value,
}: {
  bookId: number;
  value: Date | string | null | undefined;
}) {
  const router = useRouter();
  const initial = toDateInput(value);
  const [draft, setDraft] = useState(initial);
  const [pending, start] = useTransition();

  function save() {
    if (!draft) {
      toast.error("Informe uma data válida.");
      return;
    }
    const [y, m, d] = draft.split("-").map((s) => Number(s));
    const dt = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (Number.isNaN(dt.getTime())) {
      toast.error("Data inválida.");
      return;
    }
    start(async () => {
      const res = await setFinishedAtAction(bookId, dt);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success("Data de término atualizada.");
        router.refresh();
      }
    });
  }

  const dirty = draft !== initial;

  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">
        Data de término
      </div>
      <div className="mt-1 flex gap-2">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          max={toDateInput(new Date())}
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className={cn(
            "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90",
            (pending || !dirty) && "opacity-50",
          )}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
