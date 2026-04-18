"""Página 'Biblioteca' - lista, filtra, cria e edita livros."""

from __future__ import annotations

import streamlit as st

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.ui import helpers as H
from biblioteca.ui.book_form import render_book_form
from biblioteca.utils import export


def _current_filters() -> dict:
    col_search, col_status, col_genre, col_order = st.columns([3, 2, 2, 2])
    with col_search:
        search = st.text_input(
            "Buscar por título ou autor", value=st.session_state.get("books_search", "")
        )
    with col_status:
        status_options = ["Todos", *BookStatus.values()]
        status = st.selectbox("Status", status_options, index=0, key="books_status_filter")
    with col_genre:
        with H.session() as s:
            genres = books_service.list_genres(s)
        genre_options = ["Todos", *genres]
        genre = st.selectbox("Gênero", genre_options, index=0, key="books_genre_filter")
    with col_order:
        order = st.selectbox(
            "Ordenar por",
            ["title", "year_desc", "year_asc", "rating_desc"],
            format_func=lambda v: {
                "title": "Título (A-Z)",
                "year_desc": "Ano (mais recente)",
                "year_asc": "Ano (mais antigo)",
                "rating_desc": "Classificação inicial (maior)",
            }[v],
            key="books_order_filter",
        )

    return {
        "search": search.strip() or None,
        "status": None if status == "Todos" else status,
        "genre": None if genre == "Todos" else genre,
        "order_by": order,
    }


def _render_book_card(book, *, on_select) -> None:
    container = st.container(border=True)
    with container:
        cover_col, info_col, action_col = st.columns([1, 4, 2])
        with cover_col:
            H.render_cover(book.cover_path, width=110)
        with info_col:
            st.markdown(f"### {book.title}")
            st.caption(book.authors_display or "Autor desconhecido")
            meta_bits = []
            if book.year:
                meta_bits.append(str(book.year))
            if book.genre:
                meta_bits.append(book.genre)
            if meta_bits:
                st.write(" • ".join(meta_bits))
            status_badge = f"**Status:** {book.status}"
            avg = book.average_rating
            avg_text = f" | **Avaliação:** {H.stars(avg)} ({avg})" if avg is not None else ""
            st.markdown(status_badge + avg_text)
            if book.pages:
                st.progress(
                    book.progress_ratio,
                    text=f"{book.pages_read}/{book.pages} páginas lidas",
                )
            if book.description:
                st.write(book.description[:220] + ("…" if len(book.description) > 220 else ""))
        with action_col:
            if st.button("Ver detalhes", key=f"detail_{book.id}", use_container_width=True):
                on_select(book.id)
            st.write("")


def render() -> None:
    st.title("📚 Minha Biblioteca")
    st.caption("Gerencie sua coleção pessoal de livros.")

    filters = _current_filters()

    with H.session() as s:
        books = books_service.list_books(s, **filters)
        csv_text = export.books_to_csv(books)
        json_text = export.books_to_json(books)

    top_l, top_r = st.columns([3, 2])
    with top_l:
        st.write(f"**{len(books)}** livro(s) encontrado(s).")
    with top_r:
        H.download_data_buttons(csv_text, json_text)

    def _select(book_id: int) -> None:
        st.session_state["selected_book_id"] = book_id
        st.session_state["nav_page"] = "Detalhes do livro"
        st.rerun()

    st.divider()
    if not books:
        st.info("Nenhum livro cadastrado ainda. Use a aba 'Adicionar livro' para começar.")
        return

    for book in books:
        _render_book_card(book, on_select=_select)


def render_new_book() -> None:
    st.title("➕ Adicionar livro")
    render_book_form()
