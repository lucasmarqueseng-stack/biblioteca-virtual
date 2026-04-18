"""Testes de CRUD de livros e avaliações."""

from __future__ import annotations

import pytest

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.utils import validators as V


def _base_input(**overrides):
    defaults = dict(
        title="Livro Teste",
        authors=["Autor Um"],
        year=2020,
        genre="Ficção",
        description="Descrição curta",
        status=BookStatus.NAO_LIDO.value,
        pages=200,
        pages_read=0,
    )
    defaults.update(overrides)
    return books_service.BookInput(**defaults)


def test_create_and_list_book(db_session):
    book = books_service.create_book(db_session, _base_input())
    db_session.commit()
    assert book.id is not None
    assert book.authors_display == "Autor Um"

    results = books_service.list_books(db_session)
    assert len(results) == 1
    assert results[0].title == "Livro Teste"


def test_create_rejects_missing_title(db_session):
    with pytest.raises(V.ValidationError):
        books_service.create_book(db_session, _base_input(title=""))


def test_create_rejects_no_authors(db_session):
    with pytest.raises(V.ValidationError):
        books_service.create_book(db_session, _base_input(authors=[]))


def test_create_rejects_invalid_rating(db_session):
    with pytest.raises(V.ValidationError):
        books_service.create_book(db_session, _base_input(initial_rating=7))


def test_create_rejects_pages_read_over_total(db_session):
    with pytest.raises(V.ValidationError):
        books_service.create_book(db_session, _base_input(pages=100, pages_read=200))


def test_update_book_fields_and_authors(db_session):
    book = books_service.create_book(db_session, _base_input())
    db_session.commit()

    updated = books_service.update_book(
        db_session,
        book.id,
        _base_input(
            title="Livro Atualizado",
            authors=["Autor Um", "Autor Dois"],
            pages=300,
            pages_read=50,
        ),
    )
    db_session.commit()

    assert updated.title == "Livro Atualizado"
    assert {a.name for a in updated.authors} == {"Autor Um", "Autor Dois"}
    assert updated.pages == 300
    assert updated.pages_read == 50


def test_delete_book(db_session):
    book = books_service.create_book(db_session, _base_input())
    db_session.commit()
    books_service.delete_book(db_session, book.id)
    db_session.commit()
    assert books_service.list_books(db_session) == []


def test_set_status_updates_book(db_session):
    book = books_service.create_book(db_session, _base_input())
    db_session.commit()
    books_service.set_status(db_session, book.id, BookStatus.LENDO.value)
    db_session.commit()
    refreshed = books_service.get_book(db_session, book.id)
    assert refreshed.status == BookStatus.LENDO.value


def test_update_pages_read_validates_bounds(db_session):
    book = books_service.create_book(db_session, _base_input(pages=200))
    db_session.commit()
    books_service.update_pages_read(db_session, book.id, 150)
    db_session.commit()
    assert books_service.get_book(db_session, book.id).pages_read == 150
    with pytest.raises(V.ValidationError):
        books_service.update_pages_read(db_session, book.id, 500)


def test_review_requires_read_status(db_session):
    book = books_service.create_book(db_session, _base_input())
    db_session.commit()
    with pytest.raises(V.ValidationError):
        books_service.add_review(db_session, book.id, 5, "Ótimo")

    books_service.set_status(db_session, book.id, BookStatus.LIDO.value)
    db_session.commit()
    review = books_service.add_review(db_session, book.id, 4, "Gostei")
    db_session.commit()
    assert review.id is not None

    refreshed = books_service.get_book(db_session, book.id)
    assert refreshed.average_rating == 4.0


def test_review_rating_bounds(db_session):
    book = books_service.create_book(db_session, _base_input(status=BookStatus.LIDO.value))
    db_session.commit()
    with pytest.raises(V.ValidationError):
        books_service.add_review(db_session, book.id, 9)


def test_list_books_filters_and_search(db_session):
    books_service.create_book(
        db_session,
        _base_input(title="Alpha", authors=["Ana"], genre="Ficção"),
    )
    books_service.create_book(
        db_session,
        _base_input(
            title="Beta",
            authors=["Bia"],
            genre="Biografia",
            status=BookStatus.LIDO.value,
        ),
    )
    db_session.commit()

    assert len(books_service.list_books(db_session, status=BookStatus.LIDO.value)) == 1
    assert len(books_service.list_books(db_session, genre="Biografia")) == 1
    assert len(books_service.list_books(db_session, search="alp")) == 1
    assert len(books_service.list_books(db_session, search="Ana")) == 1
