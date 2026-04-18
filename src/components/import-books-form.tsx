"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/constants";
import type { ImportRow } from "@/lib/import-xlsx";
import {
  importBooksAction,
  previewBooksImportAction,
  type ImportResult,
} from "@/actions/import";

type Stage = "idle" | "preview" | "importing" | "done";

export function ImportBooksForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setStage("idle");
    setRows([]);
    setFile(null);
    setError(null);
    setResult(null);
  }

  async function handleFile(selected: File) {
    setError(null);
    setFile(selected);
    const fd = new FormData();
    fd.append("file", selected);
    startTransition(async () => {
      const res = await previewBooksImportAction(fd);
      if (!res.ok) {
        setError(res.error);
        setStage("idle");
        return;
      }
      setRows(res.rows);
      setStage("preview");
    });
  }

  async function handleImport() {
    if (!file) return;
    setStage("importing");
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await importBooksAction(fd);
      setResult(res);
      if (!res.ok) {
        setError(res.error);
        setStage("preview");
        toast.error(res.error);
        return;
      }
      setStage("done");
      toast.success(
        `Importação concluída: ${res.created} livros adicionados.`,
      );
      router.refresh();
    });
  }

  if (stage === "done" && result?.ok) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
          <div className="space-y-1">
            <p className="font-medium text-emerald-900 dark:text-emerald-200">
              Importação concluída
            </p>
            <ul className="text-emerald-800/90 dark:text-emerald-200/90">
              <li>{result.created} livros criados</li>
              <li>
                {result.skippedDuplicates} duplicados ignorados (título já
                existente)
              </li>
              <li>{result.skippedInvalid} linhas com erro</li>
              <li className="text-muted-foreground">
                Total de linhas na planilha: {result.total}
              </li>
            </ul>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Linhas com erro:</p>
            <ul className="space-y-1">
              {result.errors.slice(0, 20).map((e) => (
                <li key={`${e.line}-${e.title}`} className="text-muted-foreground">
                  Linha {e.line} — {e.title || "(sem título)"}: {e.reason}
                </li>
              ))}
              {result.errors.length > 20 && (
                <li className="text-muted-foreground">
                  ...e mais {result.errors.length - 20} erros.
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => router.push("/livros")}>Ver biblioteca</Button>
          <Button variant="outline" onClick={reset}>
            Importar outra planilha
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "preview") {
    const validCount = rows.filter((r) => !r.error).length;
    const errorCount = rows.length - validCount;
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 flex-none text-primary" />
          <div className="space-y-1">
            <p className="font-medium">
              {file?.name ?? "Arquivo"} — {rows.length} linhas
            </p>
            <p className="text-muted-foreground">
              {validCount} válidas · {errorCount} com erro
            </p>
            <p className="text-muted-foreground">
              Livros já cadastrados (mesmo título) serão pulados automaticamente.
            </p>
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Linha</th>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Autor</th>
                <th className="px-3 py-2 text-left">Ano</th>
                <th className="px-3 py-2 text-left">Gênero</th>
                <th className="px-3 py-2 text-left">Idioma</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((row) => (
                <tr
                  key={`${row.line}-${row.title}`}
                  className={
                    row.error
                      ? "border-t border-border bg-destructive/10"
                      : "border-t border-border"
                  }
                >
                  <td className="px-3 py-2 text-muted-foreground">{row.line}</td>
                  <td className="px-3 py-2">{row.title || "—"}</td>
                  <td className="px-3 py-2">{row.authors.join(", ") || "—"}</td>
                  <td className="px-3 py-2">{row.year ?? "—"}</td>
                  <td className="px-3 py-2">{row.genre ?? "—"}</td>
                  <td className="px-3 py-2">{row.language ?? "—"}</td>
                  <td className="px-3 py-2">
                    {row.error ? (
                      <span className="text-destructive">{row.error}</span>
                    ) : (
                      STATUS_LABELS[row.status]
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 200 && (
            <p className="border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Exibindo primeiras 200 linhas. Todas serão importadas ao confirmar.
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleImport}
            disabled={validCount === 0 || pending}
          >
            {pending ? "Importando..." : `Importar ${validCount} livros`}
          </Button>
          <Button variant="outline" onClick={reset} disabled={pending}>
            Escolher outro arquivo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="xlsx-file"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-10 text-center transition hover:border-primary/60 hover:bg-muted/40"
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            Clique para selecionar um arquivo .xlsx
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Colunas reconhecidas: Título, Autor, Ano de Publicação, Idioma,
            Gênero, Tenho (S/N), Li (S/N).
          </p>
        </div>
        <input
          id="xlsx-file"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </label>
      {pending && (
        <p className="text-sm text-muted-foreground">Lendo planilha...</p>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
