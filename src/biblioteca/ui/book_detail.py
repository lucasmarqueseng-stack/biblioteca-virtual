"""Página de detalhes de um livro específico."""

from __future__ import annotations

import streamlit as st

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.ui import helpers as H
from biblioteca.ui.book_form import render_book_form
from biblioteca.utils import validators as V


def _render_status_bar(book) -> None:
    st.subheader("Status de leitura")
    current = book.status
    new_status = st.radio(
        "Marcar como",
        BookStatus.values(),
        index=BookStatus.values().index(current),
        horizontal=True,
        key=f"status_{book.id}",
    )
    if new_status != current:
        if st.button("Atualizar status", key=f"update_status_{book.id}"):
            with H.session() as s:
                books_service.set_status(s, book.id, new_status)
                s.commit()
            st.success(f"Status atualizado para '{new_status}'.")
            st.rerun()

    if book.pages > 0:
        pages_read = st.number_input(
            "Páginas lidas",
            min_value=0,
            max_value=book.pages,
            value=book.pages_read,
            step=1,
            key=f"pages_read_{book.id}",
        )
        if st.button("Salvar páginas lidas", key=f"save_pages_{book.id}"):
            with H.session() as s:
                books_service.update_pages_read(s, book.id, int(pages_read))
                s.commit()
            st.success("Páginas lidas atualizadas.")
            st.rerun()


def _render_reviews(book) -> None:
    st.subheader("Avaliações")
    avg = book.average_rating
    if avg is not None:
        st.markdown(f"**Média:** {H.stars(avg)} ({avg}) — {len(book.reviews)} avaliação(ões)")
    else:
        st.info("Este livro ainda não possui avaliações.")

    for review in sorted(book.reviews, key=lambda r: r.created_at, reverse=True):
        with st.container(border=True):
            st.markdown(f"{H.stars(review.rating)} — *{review.created_at:%d/%m/%Y}*")
            if review.comment:
                st.write(review.comment)
            if st.button("Remover avaliação", key=f"del_review_{review.id}"):
                with H.session() as s:
                    books_service.delete_review(s, review.id)
                    s.commit()
                st.success("Avaliação removida.")
                st.rerun()

    st.divider()
    st.markdown("**Adicionar avaliação**")
    if book.status != BookStatus.LIDO.value:
        st.warning("Marque o livro como 'Lido' para poder avaliá-lo.")
        return
    with st.form(f"new_review_{book.id}", clear_on_submit=True):
        rating = st.slider("Nota", 1, 5, 5, key=f"rating_{book.id}")
        comment = st.text_area("Comentário (opcional)", key=f"comment_{book.id}")
        submit = st.form_submit_button("Publicar avaliação", type="primary")
    if submit:
        try:
            with H.session() as s:
                books_service.add_review(s, book.id, int(rating), comment)
                s.commit()
            st.success("Avaliação publicada.")
            st.rerun()
        except V.ValidationError as exc:
            st.error(str(exc))


def render() -> None:
    book_id = st.session_state.get("selected_book_id")
    if not book_id:
        st.info("Selecione um livro na página 'Biblioteca' para ver detalhes.")
        return

    with H.session() as s:
        book = books_service.get_book(s, int(book_id))
        if book is None:
            st.error("Livro não encontrado.")
            return
        # Força carga das relações antes de fechar a sessão
        _ = book.authors_display
        _ = book.average_rating
        _ = list(book.reviews)

    col_top_left, col_top_right = st.columns([3, 1])
    with col_top_left:
        st.title(book.title)
        st.caption(book.authors_display or "Autor desconhecido")
    with col_top_right:
        if st.button("◀ Voltar à biblioteca", use_container_width=True):
            st.session_state["nav_page"] = "Biblioteca"
            st.rerun()

    cover_col, details_col = st.columns([1, 3])
    with cover_col:
        H.render_cover(book.cover_path, width=180)
    with details_col:
        meta_lines = []
        if book.year:
            meta_lines.append(f"**Ano:** {book.year}")
        if book.genre:
            meta_lines.append(f"**Gênero:** {book.genre}")
        if book.initial_rating:
            meta_lines.append(f"**Classificação inicial:** {H.stars(book.initial_rating)}")
        if book.pages:
            meta_lines.append(f"**Páginas:** {book.pages_read}/{book.pages}")
        if meta_lines:
            st.markdown("  \n".join(meta_lines))
        if book.description:
            st.write(book.description)

    st.divider()
    _render_status_bar(book)

    st.divider()
    _render_reviews(book)

    st.divider()
    with st.expander("Editar livro"):
        render_book_form(book)

    st.divider()
    with st.expander("Remover livro"):
        st.warning(
            "Esta ação é permanente. Digite o título exato para confirmar.",
            icon="⚠️",
        )
        confirm = st.text_input("Confirmar digitando o título", key=f"confirm_delete_{book.id}")
        if st.button("Remover permanentemente", type="secondary", key=f"delete_{book.id}"):
            if confirm.strip() != book.title:
                st.error("Título digitado não confere. Exclusão cancelada.")
            else:
                with H.session() as s:
                    books_service.delete_book(s, book.id)
                    s.commit()
                st.success("Livro removido.")
                st.session_state.pop("selected_book_id", None)
                st.session_state["nav_page"] = "Biblioteca"
                st.rerun()
