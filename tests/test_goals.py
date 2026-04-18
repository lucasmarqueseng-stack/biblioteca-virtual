"""Testes das metas de leitura e cálculos de progresso."""

from __future__ import annotations

from datetime import date

import pytest

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.services import goals as goals_service
from biblioteca.utils import validators as V


def _make_book(session, *, title="Livro", pages=100, pages_read=0, status=BookStatus.NAO_LIDO.value):
    data = books_service.BookInput(
        title=title,
        authors=["Autor"],
        year=2024,
        genre="Ficção",
        status=status,
        pages=pages,
        pages_read=pages_read,
    )
    return books_service.create_book(session, data)


def test_upsert_goal_creates_and_updates(db_session):
    goal = goals_service.upsert_goal(db_session, 2025, target_books=12, target_pages=3000)
    db_session.commit()
    assert goal.target_books == 12
    assert goal.target_pages == 3000

    updated = goals_service.upsert_goal(db_session, 2025, target_books=20, target_pages=None)
    db_session.commit()
    assert updated.id == goal.id
    assert updated.target_books == 20
    assert updated.target_pages is None


def test_upsert_goal_rejects_all_zero(db_session):
    with pytest.raises(V.ValidationError):
        goals_service.upsert_goal(db_session, 2025, target_books=None, target_pages=None)


def test_days_left_in_year():
    assert goals_service.days_left_in_year(date(2025, 12, 31)) == 1
    assert goals_service.days_left_in_year(date(2024, 1, 1)) == 366  # leap year
    assert goals_service.days_left_in_year(date(2025, 1, 1)) == 365


def test_add_and_remove_book_from_goal(db_session):
    goal = goals_service.upsert_goal(db_session, 2025, target_books=5, target_pages=None)
    book = _make_book(db_session)
    db_session.commit()

    goals_service.add_book_to_goal(db_session, goal.id, book.id)
    db_session.commit()
    assert book in goals_service.get_goal(db_session, 2025).books

    goals_service.remove_book_from_goal(db_session, goal.id, book.id)
    db_session.commit()
    assert book not in goals_service.get_goal(db_session, 2025).books


def test_compute_progress_counts_finished_and_pages(db_session):
    goal = goals_service.upsert_goal(db_session, 2025, target_books=5, target_pages=500)
    b1 = _make_book(db_session, title="A", pages=200, status=BookStatus.LIDO.value)
    b2 = _make_book(db_session, title="B", pages=300, pages_read=120, status=BookStatus.LENDO.value)
    b3 = _make_book(db_session, title="C", pages=150, pages_read=0)
    db_session.commit()
    for book in (b1, b2, b3):
        goals_service.add_book_to_goal(db_session, goal.id, book.id)
    db_session.commit()

    progress = goals_service.compute_progress(goal, today=date(2025, 7, 1))
    assert progress.books_finished == 1
    # b1 (lido) conta 200 + b2 (lendo) 120 + b3 0
    assert progress.pages_read == 320
    assert progress.pages_remaining == 180
    assert progress.days_left_in_year == 184
    assert progress.pages_per_day_required == pytest.approx(180 / 184, rel=1e-2)


def test_progress_is_behind_flag(db_session):
    goal = goals_service.upsert_goal(db_session, 2025, target_books=12, target_pages=None)
    # nenhum livro finalizado perto do fim do ano
    progress = goals_service.compute_progress(goal, today=date(2025, 11, 1))
    assert progress.is_behind is True

    goal_ok = goals_service.upsert_goal(db_session, 2026, target_books=12, target_pages=None)
    # início do ano: não está atrasado
    progress_ok = goals_service.compute_progress(goal_ok, today=date(2026, 1, 2))
    assert progress_ok.is_behind is False
