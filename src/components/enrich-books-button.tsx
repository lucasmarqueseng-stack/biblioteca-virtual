"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { enrichBooksAction, type EnrichResult } from "@/actions/enrich";

export function EnrichBooksButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<EnrichResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      toast.info(
        "Buscando metadados no Google Books e Open Library...",
        { duration: 4000 },
      );
      const res = await enrichBooksAction();
      setLastResult(res);
      if (res.processed === 0) {
        toast.success("Todos os livros já têm metadados completos.");
        return;
      }
      const parts: string[] = [];
      if (res.updatedCover > 0) parts.push(`${res.updatedCover} capas`);
      if (res.updatedPages > 0) parts.push(`${res.updatedPages} páginas`);
      if (res.updatedDescription > 0)
        parts.push(`${res.updatedDescription} sinopses`);
      if (res.updatedRating > 0) parts.push(`${res.updatedRating} avaliações`);
      if (parts.length === 0) {
        toast.warning(
          `Nenhum metadado encontrado nos ${res.processed} livros processados.`,
        );
      } else {
        toast.success(`Atualizados: ${parts.join(" · ")}`);
      }
      if (res.notMatchedTitles.length > 0) {
        const sample = res.notMatchedTitles.slice(0, 4).join(", ");
        const suffix =
          res.notMatchedTitles.length > 4
            ? `, +${res.notMatchedTitles.length - 4} outros`
            : "";
        toast.info(`Sem match: ${sample}${suffix}`, { duration: 8000 });
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleClick} disabled={pending} variant="outline">
        <Sparkles className="mr-1 h-4 w-4" />
        {pending ? "Buscando..." : "Preencher metadados"}
      </Button>
      {lastResult && !pending && (
        <span className="text-xs text-muted-foreground">
          {lastResult.updatedCover} capas · {lastResult.updatedPages} páginas ·{" "}
          {lastResult.updatedDescription} sinopses ·{" "}
          {lastResult.updatedRating} avaliações
          {lastResult.noMatch > 0 ? ` · ${lastResult.noMatch} sem match` : ""}
        </span>
      )}
    </div>
  );
}
