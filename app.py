"""Ponto de entrada da aplicação Streamlit para a Biblioteca Virtual."""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

# Garante que ``src/`` esteja no PYTHONPATH mesmo quando executado via ``streamlit run``.
SRC_DIR = Path(__file__).resolve().parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from biblioteca.ui import book_detail, books_page, dashboard, goals_page  # noqa: E402
from biblioteca.ui.helpers import bootstrap_app  # noqa: E402

PAGES = {
    "Dashboard": dashboard.render,
    "Biblioteca": books_page.render,
    "Adicionar livro": books_page.render_new_book,
    "Detalhes do livro": book_detail.render,
    "Metas de leitura": goals_page.render,
}


def main() -> None:
    st.set_page_config(
        page_title="Biblioteca Virtual",
        page_icon="📚",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    bootstrap_app()

    if "nav_page" not in st.session_state:
        st.session_state["nav_page"] = "Dashboard"

    with st.sidebar:
        st.title("📚 Biblioteca Virtual")
        st.caption("Sua coleção pessoal de leituras")
        pages = list(PAGES.keys())
        current = st.session_state["nav_page"]
        if current not in pages:
            current = pages[0]
        selected = st.radio(
            "Navegação",
            pages,
            index=pages.index(current),
            key="nav_radio",
        )
        if selected != current:
            st.session_state["nav_page"] = selected
            st.rerun()

        st.divider()
        st.caption(
            "Desenvolvido em Python + Streamlit. "
            "Os dados ficam em um banco SQLite local (`biblioteca.db`)."
        )

    PAGES[st.session_state["nav_page"]]()


if __name__ == "__main__":
    main()
