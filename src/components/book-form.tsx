"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RatingStars } from "@/components/rating-stars";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import {
  createBookAction,
  updateBookAction,
  type ActionResult,
} from "@/actions/books";

type BookFormValues = {
  id?: number;
  title?: string;
  authors?: string[];
  year?: number | null;
  genre?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  status?: string;
  initialRating?: number | null;
  pages?: number;
  pagesRead?: number;
};

export function BookForm({ initial }: { initial?: BookFormValues }) {
  const router = useRouter();
  const isEdit = typeof initial?.id === "number";
  const action = isEdit
    ? updateBookAction.bind(null, initial!.id!)
    : createBookAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            placeholder="Ex.: Dom Casmurro"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="authors">Autores * (separados por vírgula)</Label>
          <Input
            id="authors"
            name="authors"
            required
            defaultValue={(initial?.authors ?? []).join(", ")}
            placeholder="Ex.: Machado de Assis, Clarice Lispector"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Ano de publicação</Label>
          <Input
            id="year"
            name="year"
            type="number"
            defaultValue={initial?.year ?? ""}
            placeholder="Ex.: 1899"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Gênero</Label>
          <Input
            id="genre"
            name="genre"
            defaultValue={initial?.genre ?? ""}
            placeholder="Ex.: Romance, Fantasia"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pages">Total de páginas</Label>
          <Input
            id="pages"
            name="pages"
            type="number"
            min={0}
            defaultValue={initial?.pages ?? 0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pagesRead">Páginas lidas</Label>
          <Input
            id="pagesRead"
            name="pagesRead"
            type="number"
            min={0}
            defaultValue={initial?.pagesRead ?? 0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={initial?.status ?? "NAO_LIDO"}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Classificação inicial</Label>
          <RatingStars
            value={initial?.initialRating ?? 0}
            name="initialRating"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="coverUrl">URL da capa</Label>
          <Input
            id="coverUrl"
            name="coverUrl"
            defaultValue={initial?.coverUrl ?? ""}
            placeholder="https://..."
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="description">Descrição / sinopse</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={initial?.description ?? ""}
            placeholder="Resumo, observações pessoais, etc."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Adicionar livro"}
        </Button>
      </div>
    </form>
  );
}
