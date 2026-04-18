"use client";

import { X } from "lucide-react";
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
import {
  addBookToGoalAction,
  removeBookFromGoalAction,
} from "@/actions/goals";

type Option = { id: number; title: string; status: string };

export function GoalBookManager({
  year,
  selected,
  available,
}: {
  year: number;
  selected: Option[];
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

  function remove(id: number) {
    start(async () => {
      const res = await removeBookFromGoalAction(year, id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Livro removido da meta.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Adicionar livro à meta
          </label>
          <Select
            value={bookId}
            onValueChange={(v) => setBookId(v ?? "")}
          >
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

      {selected.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum livro associado à meta ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {selected.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
            >
              <span className="truncate">{b.title}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(b.id)}
                disabled={pending}
                className="text-destructive"
                aria-label="Remover da meta"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
