"""Testes da exportação CSV/JSON."""

from __future__ import annotations

import json

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.utils import export


def test_books_export_formats(db_session):
    data = books_service.BookInput(
        title="Exportar",
        authors=["Autor A", "Autor B"],
        year=2020,
        genre="Ficção",
        description="Resumo",
        status=BookStatus.LIDO.value,
        pages=100,
        pages_read=100,
        initial_rating=4,
    )
    books_service.create_book(db_session, data)
    db_session.commit()

    books = books_service.list_books(db_session)
    json_text = export.books_to_json(books)
    csv_text = export.books_to_csv(books)

    decoded = json.loads(json_text)
    assert decoded[0]["titulo"] == "Exportar"
    assert decoded[0]["autores"] == ["Autor A", "Autor B"]

    csv_lines = csv_text.strip().splitlines()
    assert csv_lines[0].startswith("id,titulo,autores")
    assert "Autor A; Autor B" in csv_lines[1]
