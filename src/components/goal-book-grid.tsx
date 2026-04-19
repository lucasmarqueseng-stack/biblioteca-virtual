"use client";

import { X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import type { Author, Book, Review } from "@prisma/client";

import { BookCard } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { removeBookFromGoalAction } from "@/actions/goals";

type BookWithRels = Book & { authors: Author[]; reviews: Review[] };

export function GoalBookGrid({
  year,
  books,
}: {
  year: number;
  books: BookWithRels[];
}) {
  const [pending, start] = useTransition();

  function remove(bookId: number) {
    start(async () => {
      const res = await removeBookFromGoalAction(year, bookId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Livro removido da meta.");
    });
  }

  if (books.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum livro associado à meta ainda. Use o seletor acima para adicionar.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {books.map((book) => (
        <div key={book.id} className="flex flex-col gap-2">
          <BookCard book={book} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => remove(book.id)}
            disabled={pending}
            className="h-auto self-end px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
            aria-label={`Remover ${book.title} da meta`}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Remover da meta
          </Button>
        </div>
      ))}
    </div>
  );
}
