import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { booksToCsv, booksToJson } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const books = await prisma.book.findMany({
    include: { authors: true, reviews: true },
    orderBy: { title: "asc" },
  });

  if (format === "csv") {
    const csv = booksToCsv(books);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="biblioteca.csv"',
      },
    });
  }

  const json = booksToJson(books);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="biblioteca.json"',
    },
  });
}
