"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addBookToGoalAction } from "@/actions/goals";

type Option = { id: number; title: string; status: string };

export function GoalBookAdder({
  year,
  available,
}: {
  year: number;
  available: Option[];
}) {
  const [bookId, setBookId] = useState<string>("");
  const [pending, start] = useTransition();

  function add() {
    if (!bookId) return;
    const id = Number(bookId);
    start(async () => {
      const res = await addBookToGoalAction(year, id);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Livro adicionado à meta.");
        setBookId("");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Adicionar livro à meta
        </label>
        <Select value={bookId} onValueChange={(v) => setBookId(v ?? "")}>
          <SelectTrigger className="w-full sm:w-[320px]">
            <SelectValue placeholder="Escolha um livro da biblioteca" />
          </SelectTrigger>
          <SelectContent>
            {available.length === 0 ? (
              <SelectItem value="__empty__" disabled>
                Sem livros disponíveis
              </SelectItem>
            ) : (
              available.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={add} disabled={pending || !bookId}>
        Adicionar
      </Button>
    </div>
  );
}
