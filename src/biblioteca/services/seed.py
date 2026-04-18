"""Popula o banco com dados de exemplo para demonstração."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.services import goals as goals_service

EXAMPLES: list[dict] = [
    {
        "title": "Dom Casmurro",
        "authors": ["Machado de Assis"],
        "year": 1899,
        "genre": "Ficção",
        "description": "Romance clássico brasileiro sobre ciúme e memória.",
        "pages": 256,
        "pages_read": 256,
        "status": BookStatus.LIDO.value,
        "initial_rating": 5,
    },
    {
        "title": "O Cortiço",
        "authors": ["Aluísio Azevedo"],
        "year": 1890,
        "genre": "Ficção",
        "description": "Retrato naturalista da vida em um cortiço no Rio de Janeiro.",
        "pages": 304,
        "pages_read": 150,
        "status": BookStatus.LENDO.value,
    },
    {
        "title": "Sapiens: Uma Breve História da Humanidade",
        "authors": ["Yuval Noah Harari"],
        "year": 2011,
        "genre": "Não-ficção",
        "description": "Panorama da história da espécie humana.",
        "pages": 464,
        "pages_read": 0,
        "status": BookStatus.TENHO.value,
    },
    {
        "title": "Steve Jobs",
        "authors": ["Walter Isaacson"],
        "year": 2011,
        "genre": "Biografia",
        "description": "Biografia autorizada do fundador da Apple.",
        "pages": 656,
        "pages_read": 656,
        "status": BookStatus.LIDO.value,
        "initial_rating": 4,
    },
    {
        "title": "Clean Code",
        "authors": ["Robert C. Martin"],
        "year": 2008,
        "genre": "Tecnologia",
        "description": "Práticas para escrever código limpo e sustentável.",
        "pages": 464,
        "pages_read": 120,
        "status": BookStatus.LENDO.value,
    },
    {
        "title": "O Hobbit",
        "authors": ["J. R. R. Tolkien"],
        "year": 1937,
        "genre": "Fantasia",
        "description": "A jornada de Bilbo Bolseiro até a Montanha Solitária.",
        "pages": 336,
        "pages_read": 0,
        "status": BookStatus.NAO_LIDO.value,
    },
    {
        "title": "O Pequeno Príncipe",
        "authors": ["Antoine de Saint-Exupéry"],
        "year": 1943,
        "genre": "Ficção",
        "description": "Fábula filosófica sobre amizade e cuidado.",
        "pages": 96,
        "pages_read": 96,
        "status": BookStatus.LIDO.value,
        "initial_rating": 5,
    },
]


def seed_database(session: Session, *, goal_year: int | None = None) -> dict:
    """Insere livros/metas de exemplo se o banco ainda estiver vazio.

    Retorna um dicionário resumindo o que foi criado.
    """
    existing = books_service.list_books(session)
    if existing:
        return {"created_books": 0, "created_goal": False}

    created: list[int] = []
    for example in EXAMPLES:
        data = books_service.BookInput(**example)
        book = books_service.create_book(session, data)
        created.append(book.id)

    year = goal_year or date.today().year
    goal = goals_service.upsert_goal(
        session, year, target_books=12, target_pages=4000
    )
    for book_id in created:
        goals_service.add_book_to_goal(session, goal.id, book_id)

    # Adiciona uma avaliação exemplar
    lido_id = next(
        (bid for bid, ex in zip(created, EXAMPLES) if ex["status"] == BookStatus.LIDO.value),
        None,
    )
    if lido_id is not None:
        books_service.add_review(
            session, lido_id, 5, "Leitura obrigatória da literatura brasileira."
        )

    return {"created_books": len(created), "created_goal": True}
