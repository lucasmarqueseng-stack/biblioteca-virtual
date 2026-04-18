"""Serviços de CRUD e consulta de livros."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from biblioteca.models import Author, Book, BookStatus, Review
from biblioteca.utils import validators as V


@dataclass
class BookInput:
    """Dados brutos recebidos do formulário para criar/editar um livro."""

    title: str
    authors: list[str] = field(default_factory=list)
    year: int | None = None
    genre: str | None = None
    description: str | None = None
    cover_path: str | None = None
    status: str = BookStatus.NAO_LIDO.value
    initial_rating: int | None = None
    pages: int = 0
    pages_read: int = 0


def _get_or_create_authors(session: Session, names: Iterable[str]) -> list[Author]:
    authors: list[Author] = []
    for name in names:
        existing = session.execute(select(Author).where(Author.name == name)).scalar_one_or_none()
        if existing is None:
            existing = Author(name=name)
            session.add(existing)
            session.flush()
        authors.append(existing)
    return authors


def _apply_validations(data: BookInput) -> BookInput:
    title = V.validate_title(data.title)
    authors = V.validate_authors(data.authors)
    year = V.validate_year(data.year)
    genre = V.validate_genre(data.genre)
    status = V.validate_status(data.status)
    initial_rating = V.validate_rating(data.initial_rating)
    pages = V.validate_pages(data.pages)
    pages_read = V.validate_pages_read(data.pages_read, pages)
    return BookInput(
        title=title,
        authors=authors,
        year=year,
        genre=genre,
        description=(data.description or "").strip() or None,
        cover_path=(data.cover_path or "").strip() or None,
        status=status,
        initial_rating=initial_rating,
        pages=pages,
        pages_read=pages_read,
    )


def create_book(session: Session, data: BookInput) -> Book:
    clean = _apply_validations(data)
    book = Book(
        title=clean.title,
        year=clean.year,
        genre=clean.genre,
        description=clean.description,
        cover_path=clean.cover_path,
        status=clean.status,
        initial_rating=clean.initial_rating,
        pages=clean.pages,
        pages_read=clean.pages_read,
    )
    book.authors = _get_or_create_authors(session, clean.authors)
    session.add(book)
    session.flush()
    return book


def update_book(session: Session, book_id: int, data: BookInput) -> Book:
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    clean = _apply_validations(data)
    book.title = clean.title
    book.year = clean.year
    book.genre = clean.genre
    book.description = clean.description
    book.cover_path = clean.cover_path
    book.status = clean.status
    book.initial_rating = clean.initial_rating
    book.pages = clean.pages
    book.pages_read = clean.pages_read
    book.authors = _get_or_create_authors(session, clean.authors)
    session.flush()
    return book


def delete_book(session: Session, book_id: int) -> None:
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    session.delete(book)
    session.flush()


def get_book(session: Session, book_id: int) -> Book | None:
    return session.get(Book, book_id)


def list_books(
    session: Session,
    *,
    status: str | None = None,
    genre: str | None = None,
    search: str | None = None,
    order_by: str = "title",
) -> list[Book]:
    stmt = select(Book)
    if status:
        stmt = stmt.where(Book.status == status)
    if genre:
        stmt = stmt.where(Book.genre == genre)
    if search:
        pattern = f"%{search.strip().lower()}%"
        stmt = (
            stmt.outerjoin(Book.authors)
            .where(
                or_(
                    Book.title.ilike(pattern),
                    Author.name.ilike(pattern),
                )
            )
            .distinct()
        )

    if order_by == "year_desc":
        stmt = stmt.order_by(Book.year.desc().nullslast(), Book.title)
    elif order_by == "year_asc":
        stmt = stmt.order_by(Book.year.asc().nullsfirst(), Book.title)
    elif order_by == "rating_desc":
        stmt = stmt.order_by(Book.initial_rating.desc().nullslast(), Book.title)
    else:
        stmt = stmt.order_by(Book.title)

    return list(session.execute(stmt).scalars().unique().all())


def list_genres(session: Session) -> list[str]:
    rows = session.execute(select(Book.genre).where(Book.genre.is_not(None)).distinct()).all()
    return sorted({r[0] for r in rows if r[0]})


def set_status(session: Session, book_id: int, status: str) -> Book:
    status = V.validate_status(status)
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    book.status = status
    session.flush()
    return book


def update_pages_read(session: Session, book_id: int, pages_read: int) -> Book:
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    book.pages_read = V.validate_pages_read(pages_read, book.pages)
    session.flush()
    return book


def add_review(
    session: Session, book_id: int, rating: int, comment: str | None = None
) -> Review:
    book = get_book(session, book_id)
    if book is None:
        raise ValueError(f"Livro id={book_id} não encontrado.")
    if book.status != BookStatus.LIDO.value:
        raise V.ValidationError("Apenas livros marcados como 'Lido' podem receber avaliações.")
    clean_rating = V.validate_rating(rating, required=True)
    assert clean_rating is not None
    review = Review(
        book_id=book.id,
        rating=clean_rating,
        comment=(comment or "").strip() or None,
    )
    session.add(review)
    session.flush()
    return review


def delete_review(session: Session, review_id: int) -> None:
    review = session.get(Review, review_id)
    if review is None:
        raise ValueError(f"Avaliação id={review_id} não encontrada.")
    session.delete(review)
    session.flush()
