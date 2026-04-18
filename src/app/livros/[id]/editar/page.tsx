import { notFound } from "next/navigation";

import { BookForm } from "@/components/book-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId < 1) notFound();

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { authors: true },
  });
  if (!book) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar livro</h1>
        <p className="mt-1 text-sm text-muted-foreground">{book.title}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <BookForm
          initial={{
            id: book.id,
            title: book.title,
            authors: book.authors.map((a) => a.name),
            year: book.year,
            genre: book.genre,
            description: book.description,
            coverUrl: book.coverUrl,
            status: book.status,
            owned: book.owned,
            initialRating: book.initialRating,
            pages: book.pages,
            pagesRead: book.pagesRead,
            finishedAt: book.finishedAt,
          }}
        />
      </div>
    </div>
  );
}
