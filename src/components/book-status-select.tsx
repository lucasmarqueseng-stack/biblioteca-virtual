"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type BookStatus,
} from "@/lib/constants";
import { setBookStatusAction } from "@/actions/books";

export function BookStatusSelect({
  bookId,
  value,
}: {
  bookId: number;
  value: string;
}) {
  const [pending, start] = useTransition();

  function onChange(next: string | null) {
    if (!next) return;
    start(async () => {
      const res = await setBookStatusAction(bookId, next);
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success("Status atualizado.");
      }
    });
  }

  const currentLabel =
    (value as BookStatus) in STATUS_LABELS
      ? STATUS_LABELS[value as BookStatus]
      : "Selecionar";

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-[160px]">
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
