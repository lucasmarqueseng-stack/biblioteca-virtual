"""Formulário reutilizável para criar/editar livros."""

from __future__ import annotations

from datetime import date

import streamlit as st

from biblioteca.models import Book, BookStatus
from biblioteca.services import books as books_service
from biblioteca.ui import helpers as H
from biblioteca.utils import validators as V


def _form_defaults(book: Book | None) -> dict:
    if book is None:
        return {
            "title": "",
            "authors_text": "",
            "year": date.today().year,
            "genre": "",
            "description": "",
            "cover_url": "",
            "status": BookStatus.NAO_LIDO.value,
            "initial_rating": 0,
            "pages": 0,
            "pages_read": 0,
        }
    return {
        "title": book.title,
        "authors_text": "\n".join(a.name for a in book.authors),
        "year": book.year or date.today().year,
        "genre": book.genre or "",
        "description": book.description or "",
        "cover_url": book.cover_path or "",
        "status": book.status,
        "initial_rating": book.initial_rating or 0,
        "pages": book.pages,
        "pages_read": book.pages_read,
    }


def render_book_form(book: Book | None = None) -> None:
    defaults = _form_defaults(book)
    form_key = f"book_form_{book.id if book else 'new'}"

    with st.form(form_key, clear_on_submit=book is None):
        col1, col2 = st.columns(2)
        with col1:
            title = st.text_input("Título *", value=defaults["title"])
            authors_text = st.text_area(
                "Autores *",
                value=defaults["authors_text"],
                help="Um por linha ou separados por vírgula.",
            )
            year = st.number_input(
                "Ano de publicação",
                min_value=0,
                max_value=date.today().year + 1,
                value=int(defaults["year"]),
                step=1,
            )
            genre = st.text_input("Gênero/Tipo", value=defaults["genre"])
            status = st.selectbox(
                "Status",
                BookStatus.values(),
                index=BookStatus.values().index(defaults["status"]),
            )
        with col2:
            description = st.text_area(
                "Descrição/Resumo", value=defaults["description"], height=140
            )
            cover_url = st.text_input(
                "URL da capa (opcional)",
                value=defaults["cover_url"] if _looks_like_url(defaults["cover_url"]) else "",
                help="Se preferir enviar o arquivo, use o campo abaixo.",
            )
            uploaded = st.file_uploader(
                "Upload da capa (opcional)", type=["png", "jpg", "jpeg", "webp"]
            )
            pages = st.number_input(
                "Total de páginas",
                min_value=0,
                value=int(defaults["pages"]),
                step=1,
            )
            pages_read = st.number_input(
                "Páginas lidas",
                min_value=0,
                value=int(defaults["pages_read"]),
                step=1,
            )
            initial_rating = st.slider(
                "Classificação inicial (opcional)",
                min_value=0,
                max_value=5,
                value=int(defaults["initial_rating"]),
                help="0 significa sem classificação inicial.",
            )

        submitted = st.form_submit_button(
            "Salvar alterações" if book else "Adicionar livro",
            type="primary",
            use_container_width=True,
        )

    if not submitted:
        return

    cover_path = None
    if uploaded is not None:
        cover_path = H.save_uploaded_cover(uploaded, title or "capa")
    elif cover_url:
        cover_path = cover_url.strip()
    elif book is not None:
        cover_path = book.cover_path

    data = books_service.BookInput(
        title=title,
        authors=V.parse_authors_input(authors_text),
        year=int(year) if year else None,
        genre=genre,
        description=description,
        cover_path=cover_path,
        status=status,
        initial_rating=initial_rating if initial_rating > 0 else None,
        pages=int(pages),
        pages_read=int(pages_read),
    )

    try:
        with H.session() as s:
            if book is None:
                new_book = books_service.create_book(s, data)
                s.commit()
                st.success(f"Livro '{new_book.title}' adicionado com sucesso.")
                st.session_state["selected_book_id"] = new_book.id
            else:
                books_service.update_book(s, book.id, data)
                s.commit()
                st.success("Livro atualizado com sucesso.")
    except V.ValidationError as exc:
        st.error(str(exc))
    except Exception as exc:  # pragma: no cover - feedback ao usuário
        st.error(f"Não foi possível salvar o livro: {exc}")


def _looks_like_url(value: str) -> bool:
    return value.startswith(("http://", "https://"))
