import { ImportBooksForm } from "@/components/import-books-form";

export const metadata = {
  title: "Importar livros",
};

export default function ImportBooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar livros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Faça upload de uma planilha <code>.xlsx</code> para cadastrar vários
          livros de uma vez. Livros com título já existente são ignorados.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ImportBooksForm />
      </div>
    </div>
  );
}
