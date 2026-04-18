"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePagesReadAction } from "@/actions/books";

export function PagesReadInput({
  bookId,
  initial,
  total,
}: {
  bookId: number;
  initial: number;
  total: number;
}) {
  const [value, setValue] = useState<number>(initial);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await updatePagesReadAction(bookId, value);
      if (!res.ok) toast.error(res.error);
      else toast.success("Progresso atualizado.");
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground">
          Páginas lidas {total > 0 ? `/ ${total}` : ""}
        </label>
        <Input
          type="number"
          min={0}
          max={total > 0 ? total : undefined}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </div>
      <Button type="button" onClick={save} disabled={pending} size="sm">
        <Save className="mr-1 h-4 w-4" />
        {pending ? "..." : "Salvar"}
      </Button>
    </div>
  );
}
