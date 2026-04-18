"""Modelos ORM da biblioteca virtual."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy import Column as _Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class BookStatus(str, Enum):
    """Status de leitura de um livro."""

    NAO_LIDO = "Não lido"
    LENDO = "Lendo"
    LIDO = "Lido"
    TENHO = "Tenho"

    @classmethod
    def values(cls) -> list[str]:
        return [s.value for s in cls]


# Tabela de associação N:N entre livros e autores
book_authors = Table(
    "book_authors",
    Base.metadata,
    _Column("book_id", ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    _Column("author_id", ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True),
)

# Tabela de associação N:N entre livros e metas de leitura
goal_books = Table(
    "goal_books",
    Base.metadata,
    _Column("goal_id", ForeignKey("reading_goals.id", ondelete="CASCADE"), primary_key=True),
    _Column("book_id", ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
)


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    books: Mapped[list[Book]] = relationship(
        "Book", secondary=book_authors, back_populates="authors"
    )

    def __repr__(self) -> str:  # pragma: no cover - debug
        return f"<Author id={self.id} name={self.name!r}>"


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    genre: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=BookStatus.NAO_LIDO.value, index=True
    )
    initial_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pages_read: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    authors: Mapped[list[Author]] = relationship(
        "Author", secondary=book_authors, back_populates="books", lazy="selectin"
    )
    reviews: Mapped[list[Review]] = relationship(
        "Review", back_populates="book", cascade="all, delete-orphan", lazy="selectin"
    )
    goals: Mapped[list[ReadingGoal]] = relationship(
        "ReadingGoal", secondary=goal_books, back_populates="books"
    )

    __table_args__ = (
        CheckConstraint(
            "initial_rating IS NULL OR (initial_rating BETWEEN 1 AND 5)",
            name="ck_book_initial_rating_range",
        ),
        CheckConstraint("pages >= 0", name="ck_book_pages_non_negative"),
        CheckConstraint("pages_read >= 0", name="ck_book_pages_read_non_negative"),
    )

    @property
    def authors_display(self) -> str:
        return ", ".join(a.name for a in self.authors) if self.authors else ""

    @property
    def average_rating(self) -> float | None:
        if not self.reviews:
            return None
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 2)

    @property
    def progress_ratio(self) -> float:
        """Fração lida (0.0 a 1.0). Retorna 0 se páginas for 0."""
        if self.pages <= 0:
            return 0.0
        return min(self.pages_read / self.pages, 1.0)

    def __repr__(self) -> str:  # pragma: no cover - debug
        return f"<Book id={self.id} title={self.title!r} status={self.status}>"


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    book: Mapped[Book] = relationship("Book", back_populates="reviews")

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating_range"),
    )

    def __repr__(self) -> str:  # pragma: no cover - debug
        return f"<Review id={self.id} book_id={self.book_id} rating={self.rating}>"


class ReadingGoal(Base):
    __tablename__ = "reading_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    target_books: Mapped[int | None] = mapped_column(Integer, nullable=True)
    target_pages: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    books: Mapped[list[Book]] = relationship(
        "Book", secondary=goal_books, back_populates="goals", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("year", name="uq_reading_goal_year"),
        CheckConstraint(
            "target_books IS NULL OR target_books >= 0", name="ck_goal_target_books"
        ),
        CheckConstraint(
            "target_pages IS NULL OR target_pages >= 0", name="ck_goal_target_pages"
        ),
    )

    def __repr__(self) -> str:  # pragma: no cover - debug
        return f"<ReadingGoal id={self.id} year={self.year}>"
