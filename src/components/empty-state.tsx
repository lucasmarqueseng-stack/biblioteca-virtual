import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  title = "Nenhum livro encontrado",
  description = "Adicione o primeiro livro à sua biblioteca.",
  actionHref = "/livros/novo",
  actionLabel = "Adicionar livro",
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BookOpen className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      <Link href={actionHref} className={buttonVariants({ className: "mt-5" })}>
        <Plus className="mr-1 h-4 w-4" />
        {actionLabel}
      </Link>
    </div>
  );
}
