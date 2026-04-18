"""Serviços para metas de leitura anuais e cálculo de progresso."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from biblioteca.models import Book, BookStatus, ReadingGoal
from biblioteca.services.books import get_book
from biblioteca.utils import validators as V


@dataclass
class GoalProgress:
    """Snapshot de progresso contra uma meta anual."""

    goal: ReadingGoal
    today: date
    books_finished: int
    pages_read: int
    total_target_pages: int
    days_left_in_year: int

    @property
    def year(self) -> int:
        return self.goal.year

    @property
    def book_completion(self) -> float:
        if not self.goal.target_books:
            return 0.0
        return min(self.books_finished / self.goal.target_books, 1.0)

    @property
    def page_completion(self) -> float:
        if not self.goal.target_pages:
            return 0.0
        return min(self.pages_read / self.goal.target_pages, 1.0)

    @property
    def pages_remaining(self) -> int:
        if not self.goal.target_pages:
            return max(self.total_target_pages - self.pages_read, 0)
        return max(self.goal.target_pages - self.pages_read, 0)

    @property
    def books_remaining(self) -> int:
        if not self.goal.target_books:
            return 0
        return max(self.goal.target_books - self.books_finished, 0)

    @property
    def pages_per_day_required(self) -> float:
        if self.pages_remaining <= 0:
            return 0.0
        days = max(self.days_left_in_year, 1)
        return round(self.pages_remaining / days, 2)

    @property
    def books_per_month_required(self) -> float:
        if self.books_remaining <= 0 or self.days_left_in_year <= 0:
            return 0.0
        months_left = max(self.days_left_in_year / 30.0, 1 / 30.0)
        return round(self.books_remaining / months_left, 2)

    @property
    def is_behind(self) -> bool:
        """Meta está atrasada se o progresso estiver significativamente abaixo do esperado.

        Usa uma tolerância de 5% para evitar falso-positivo no início do ano,
        quando naturalmente ainda não houve tempo para avançar.
        """
        days_in_year = 366 if _is_leap(self.year) else 365
        days_elapsed = days_in_year - self.days_left_in_year
        expected = days_elapsed / days_in_year if days_in_year else 0.0
        current = max(self.book_completion, self.page_completion)
        tolerance = 0.05
        return current + tolerance < expected and self.days_left_in_year > 0


def _is_leap(year: int) -> bool:
    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)


def days_left_in_year(today: date) -> int:
    """Dias restantes no ano (inclui hoje como dia disponível)."""
    last_day = date(today.year, 12, 31)
    return max((last_day - today).days + 1, 0)


def get_goal(session: Session, year: int) -> ReadingGoal | None:
    return session.execute(
        select(ReadingGoal).where(ReadingGoal.year == year)
    ).scalar_one_or_none()


def list_goals(session: Session) -> list[ReadingGoal]:
    return list(
        session.execute(select(ReadingGoal).order_by(ReadingGoal.year.desc())).scalars().all()
    )


def upsert_goal(
    session: Session,
    year: int,
    *,
    target_books: int | None,
    target_pages: int | None,
) -> ReadingGoal:
    tb, tp = V.validate_goal_targets(target_books, target_pages)
    goal = get_goal(session, year)
    if goal is None:
        goal = ReadingGoal(year=int(year), target_books=tb, target_pages=tp)
        session.add(goal)
    else:
        goal.target_books = tb
        goal.target_pages = tp
    session.flush()
    return goal


def delete_goal(session: Session, goal_id: int) -> None:
    goal = session.get(ReadingGoal, goal_id)
    if goal is None:
        raise ValueError(f"Meta id={goal_id} não encontrada.")
    session.delete(goal)
    session.flush()


def add_book_to_goal(session: Session, goal_id: int, book_id: int) -> ReadingGoal:
    goal = session.get(ReadingGoal, goal_id)
    if goal is None:
        raise ValueError(f"Meta id={goal_id} não encontrada.")
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    if book not in goal.books:
        goal.books.append(book)
    session.flush()
    return goal


def remove_book_from_goal(session: Session, goal_id: int, book_id: int) -> ReadingGoal:
    goal = session.get(ReadingGoal, goal_id)
    if goal is None:
        raise ValueError(f"Meta id={goal_id} não encontrada.")
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    if book in goal.books:
        goal.books.remove(book)
    session.flush()
    return goal


def compute_progress(
    goal: ReadingGoal, *, today: date | None = None
) -> GoalProgress:
    today = today or date.today()
    finished = [b for b in goal.books if b.status == BookStatus.LIDO.value]
    books_finished = len(finished)
    pages_read = sum(_book_pages_read(b) for b in goal.books)
    total_target_pages = sum(max(b.pages, 0) for b in goal.books)
    return GoalProgress(
        goal=goal,
        today=today,
        books_finished=books_finished,
        pages_read=pages_read,
        total_target_pages=total_target_pages,
        days_left_in_year=days_left_in_year(today),
    )


def _book_pages_read(book: Book) -> int:
    if book.status == BookStatus.LIDO.value and book.pages > 0:
        return book.pages
    return max(book.pages_read, 0)


def monthly_progress(goal: ReadingGoal) -> list[dict]:
    """Agrega páginas/livros finalizados por mês para o gráfico.

    Usa ``updated_at`` dos livros 'Lido' como proxy para a data de conclusão.
    """
    data = {month: {"mes": month, "livros": 0, "paginas": 0} for month in range(1, 13)}
    for book in goal.books:
        if book.status != BookStatus.LIDO.value:
            continue
        if book.updated_at is None or book.updated_at.year != goal.year:
            continue
        month = book.updated_at.month
        data[month]["livros"] += 1
        data[month]["paginas"] += max(book.pages, 0)
    return list(data.values())
