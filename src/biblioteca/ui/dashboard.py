"""Dashboard geral com visão agregada da biblioteca."""

from __future__ import annotations

from datetime import date

import pandas as pd
import plotly.express as px
import streamlit as st

from biblioteca.models import BookStatus
from biblioteca.services import books as books_service
from biblioteca.services import goals as goals_service
from biblioteca.ui import helpers as H


def render() -> None:
    st.title("📊 Dashboard")
    st.caption("Visão geral da sua biblioteca e progresso de leitura.")

    with H.session() as s:
        books = books_service.list_books(s)
        goal = goals_service.get_goal(s, date.today().year)
        progress = goals_service.compute_progress(goal) if goal else None

    if not books:
        st.info("Cadastre livros para ver o dashboard preenchido.")
        return

    total = len(books)
    lidos = sum(1 for b in books if b.status == BookStatus.LIDO.value)
    lendo = sum(1 for b in books if b.status == BookStatus.LENDO.value)
    tenho = sum(1 for b in books if b.status == BookStatus.TENHO.value)
    total_pages_read = sum(
        b.pages if b.status == BookStatus.LIDO.value else b.pages_read for b in books
    )

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Livros na biblioteca", total)
    c2.metric("Lidos", lidos)
    c3.metric("Lendo", lendo)
    c4.metric("Tenho (coleção)", tenho)
    c5.metric("Páginas lidas (total)", total_pages_read)

    # Gráfico: distribuição por status
    df_status = pd.DataFrame(
        [{"status": b.status} for b in books]
    )
    fig_status = px.pie(
        df_status,
        names="status",
        title="Distribuição por status",
        hole=0.4,
    )
    st.plotly_chart(fig_status, use_container_width=True)

    # Gráfico: livros por gênero
    df_genre = pd.DataFrame(
        [{"genero": b.genre or "Sem gênero"} for b in books]
    )
    genre_counts = (
        df_genre.groupby("genero").size().reset_index(name="quantidade").sort_values("quantidade")
    )
    fig_genre = px.bar(
        genre_counts,
        x="quantidade",
        y="genero",
        orientation="h",
        title="Livros por gênero",
        labels={"quantidade": "Quantidade", "genero": "Gênero"},
    )
    st.plotly_chart(fig_genre, use_container_width=True)

    st.divider()
    st.subheader("Meta do ano corrente")
    if progress is None:
        st.info("Nenhuma meta definida para o ano atual. Acesse a aba 'Metas'.")
        return

    c1, c2, c3 = st.columns(3)
    c1.metric(
        "Livros finalizados",
        progress.books_finished,
        f"meta: {progress.goal.target_books or '—'}",
    )
    c2.metric(
        "Páginas lidas",
        progress.pages_read,
        f"meta: {progress.goal.target_pages or '—'}",
    )
    c3.metric("Páginas/dia necessárias", progress.pages_per_day_required)

    if progress.is_behind:
        st.warning("Meta atrasada — considere aumentar o ritmo diário.")
    else:
        st.success("Meta dentro do ritmo esperado.")
