import { BookForm } from "@/components/book-form";

export const metadata = {
  title: "Novo livro",
};

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Adicionar livro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre um novo livro em sua biblioteca virtual.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <BookForm />
      </div>
    </div>
  );
}
