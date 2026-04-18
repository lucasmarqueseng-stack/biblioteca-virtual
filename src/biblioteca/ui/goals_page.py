"""Página de Metas de Leitura."""

from __future__ import annotations

from datetime import date

import pandas as pd
import plotly.express as px
import streamlit as st

from biblioteca.services import books as books_service
from biblioteca.services import goals as goals_service
from biblioteca.ui import helpers as H
from biblioteca.utils import validators as V


def _render_goal_form() -> None:
    st.subheader("Definir / atualizar meta anual")
    with st.form("goal_form"):
        col1, col2, col3 = st.columns(3)
        with col1:
            year = st.number_input(
                "Ano", min_value=1900, max_value=3000, value=date.today().year, step=1
            )
        with col2:
            target_books = st.number_input(
                "Meta de livros", min_value=0, value=12, step=1
            )
        with col3:
            target_pages = st.number_input(
                "Meta de páginas", min_value=0, value=4000, step=100
            )
        submit = st.form_submit_button("Salvar meta", type="primary")
    if submit:
        try:
            with H.session() as s:
                goals_service.upsert_goal(
                    s,
                    int(year),
                    target_books=int(target_books) or None,
                    target_pages=int(target_pages) or None,
                )
                s.commit()
            st.success("Meta salva com sucesso.")
            st.rerun()
        except V.ValidationError as exc:
            st.error(str(exc))


def _render_goal_books(goal) -> None:
    st.subheader("Livros associados à meta")

    with H.session() as s:
        library = books_service.list_books(s)

    selected_ids = {b.id for b in goal.books}
    library_map = {b.id: b for b in library}
    available = [b for b in library if b.id not in selected_ids]
    current = [b for b in library if b.id in selected_ids]

    col_left, col_right = st.columns(2)
    with col_left:
        st.markdown("**Adicionar livro à meta**")
        if not available:
            st.caption("Todos os livros já estão associados.")
        else:
            add_id = st.selectbox(
                "Selecione um livro",
                options=[b.id for b in available],
                format_func=lambda bid: f"{library_map[bid].title} ({library_map[bid].authors_display})",
                key="goal_add_book",
            )
            if st.button("Adicionar à meta", key="goal_add_btn"):
                with H.session() as s:
                    goals_service.add_book_to_goal(s, goal.id, int(add_id))
                    s.commit()
                st.rerun()

    with col_right:
        st.markdown("**Remover livro da meta**")
        if not current:
            st.caption("Nenhum livro associado ainda.")
        else:
            remove_id = st.selectbox(
                "Selecione um livro",
                options=[b.id for b in current],
                format_func=lambda bid: f"{library_map[bid].title} ({library_map[bid].authors_display})",
                key="goal_remove_book",
            )
            if st.button("Remover da meta", key="goal_remove_btn"):
                with H.session() as s:
                    goals_service.remove_book_from_goal(s, goal.id, int(remove_id))
                    s.commit()
                st.rerun()


def _render_progress(goal) -> None:
    progress = goals_service.compute_progress(goal)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Livros finalizados", progress.books_finished, f"meta: {goal.target_books or '—'}")
    c2.metric("Páginas lidas", progress.pages_read, f"meta: {goal.target_pages or '—'}")
    c3.metric("Dias restantes no ano", progress.days_left_in_year)
    c4.metric(
        "Páginas/dia necessárias",
        progress.pages_per_day_required,
        help="Com base nas páginas restantes da meta e dias restantes do ano.",
    )

    if goal.target_books:
        st.progress(progress.book_completion, text=f"Livros: {progress.book_completion:.0%}")
    if goal.target_pages:
        st.progress(progress.page_completion, text=f"Páginas: {progress.page_completion:.0%}")

    if progress.is_behind:
        st.warning(
            f"Atenção: progresso está abaixo do esperado pelo calendário. "
            f"Faltam {progress.pages_remaining} páginas e {progress.books_remaining} livro(s)."
        )

    # Gráfico mensal
    monthly = goals_service.monthly_progress(goal)
    df = pd.DataFrame(monthly)
    df["mes_label"] = df["mes"].apply(
        lambda m: [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez",
        ][m - 1]
    )
    df["livros_acumulado"] = df["livros"].cumsum()
    df["paginas_acumulado"] = df["paginas"].cumsum()

    tab_livros, tab_paginas = st.tabs(["Livros por mês", "Páginas acumuladas"])
    with tab_livros:
        fig = px.bar(
            df,
            x="mes_label",
            y="livros",
            labels={"mes_label": "Mês", "livros": "Livros finalizados"},
            title=f"Livros finalizados em {goal.year}",
        )
        st.plotly_chart(fig, use_container_width=True)
    with tab_paginas:
        fig = px.line(
            df,
            x="mes_label",
            y="paginas_acumulado",
            markers=True,
            labels={"mes_label": "Mês", "paginas_acumulado": "Páginas acumuladas"},
            title=f"Progresso acumulado de páginas em {goal.year}",
        )
        st.plotly_chart(fig, use_container_width=True)


def render() -> None:
    st.title("🎯 Metas de Leitura")
    st.caption("Defina metas anuais e acompanhe o progresso.")

    _render_goal_form()

    st.divider()
    with H.session() as s:
        goals = goals_service.list_goals(s)

    if not goals:
        st.info("Nenhuma meta cadastrada. Use o formulário acima para criar a primeira.")
        return

    years = [g.year for g in goals]
    selected_year = st.selectbox("Ano da meta", years, index=0)
    goal = next(g for g in goals if g.year == selected_year)

    _render_progress(goal)

    st.divider()
    _render_goal_books(goal)

    st.divider()
    with st.expander("Remover meta"):
        if st.button(f"Remover meta de {goal.year}", type="secondary"):
            with H.session() as s:
                goals_service.delete_goal(s, goal.id)
                s.commit()
            st.success("Meta removida.")
            st.rerun()
