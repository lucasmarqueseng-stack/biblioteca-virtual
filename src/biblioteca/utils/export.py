"""Exportação da lista de livros para CSV/JSON."""

from __future__ import annotations

import csv
import io
import json
from typing import Iterable

from biblioteca.models import Book


def _serialize_book(book: Book) -> dict:
    return {
        "id": book.id,
        "titulo": book.title,
        "autores": [a.name for a in book.authors],
        "ano": book.year,
        "genero": book.genre,
        "descricao": book.description,
        "capa": book.cover_path,
        "status": book.status,
        "classificacao_inicial": book.initial_rating,
        "paginas": book.pages,
        "paginas_lidas": book.pages_read,
        "avaliacao_media": book.average_rating,
        "total_avaliacoes": len(book.reviews),
    }


def books_to_json(books: Iterable[Book]) -> str:
    data = [_serialize_book(b) for b in books]
    return json.dumps(data, ensure_ascii=False, indent=2)


def books_to_csv(books: Iterable[Book]) -> str:
    rows = [_serialize_book(b) for b in books]
    buffer = io.StringIO()
    fieldnames = [
        "id",
        "titulo",
        "autores",
        "ano",
        "genero",
        "descricao",
        "status",
        "classificacao_inicial",
        "paginas",
        "paginas_lidas",
        "avaliacao_media",
        "total_avaliacoes",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        row = dict(row)
        row["autores"] = "; ".join(row["autores"])
        writer.writerow(row)
    return buffer.getvalue()
