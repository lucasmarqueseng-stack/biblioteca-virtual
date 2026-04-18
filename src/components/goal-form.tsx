"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertGoalAction } from "@/actions/goals";

type ActionResult = { ok: true } | { ok: false; error: string };

export function GoalForm({
  year,
  targetBooks,
  targetPages,
}: {
  year: number;
  targetBooks?: number | null;
  targetPages?: number | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    upsertGoalAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Meta salva.");
    else toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="year">Ano</Label>
        <Input
          id="year"
          name="year"
          type="number"
          required
          defaultValue={year}
          min={1900}
          max={3000}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="targetBooks">Meta de livros</Label>
        <Input
          id="targetBooks"
          name="targetBooks"
          type="number"
          defaultValue={targetBooks ?? ""}
          min={0}
          placeholder="Ex.: 12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="targetPages">Meta de páginas</Label>
        <Input
          id="targetPages"
          name="targetPages"
          type="number"
          defaultValue={targetPages ?? ""}
          min={0}
          placeholder="Ex.: 4000"
        />
      </div>
      <div className="sm:col-span-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar meta"}
        </Button>
      </div>
    </form>
  );
}
