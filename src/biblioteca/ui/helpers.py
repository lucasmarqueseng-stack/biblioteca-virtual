"""Helpers compartilhados entre páginas do Streamlit."""

from __future__ import annotations

import base64
from pathlib import Path
from typing import Iterator

import streamlit as st
from sqlalchemy.orm import Session

from biblioteca.database import get_sessionmaker, init_db
from biblioteca.services import seed as seed_service

COVERS_DIR = Path(__file__).resolve().parents[3] / "data" / "covers"


def ensure_covers_dir() -> Path:
    COVERS_DIR.mkdir(parents=True, exist_ok=True)
    return COVERS_DIR


@st.cache_resource(show_spinner=False)
def _bootstrap() -> bool:
    """Cria tabelas e insere dados de exemplo na primeira execução."""
    init_db()
    ensure_covers_dir()
    SessionLocal = get_sessionmaker()
    with SessionLocal() as session:
        seed_service.seed_database(session)
        session.commit()
    return True


def bootstrap_app() -> None:
    _bootstrap()


def session() -> Iterator[Session]:
    """Retorna uma sessão do SQLAlchemy; caller é responsável por fechar via ``with``."""
    SessionLocal = get_sessionmaker()
    return SessionLocal()  # type: ignore[return-value]


def stars(rating: float | int | None) -> str:
    if rating is None:
        return "—"
    filled = int(round(float(rating)))
    filled = max(0, min(filled, 5))
    return "★" * filled + "☆" * (5 - filled)


def save_uploaded_cover(uploaded_file, book_title: str) -> str | None:
    """Persiste uma imagem enviada na pasta de capas e retorna o caminho relativo."""
    if uploaded_file is None:
        return None
    covers = ensure_covers_dir()
    safe = "".join(c if c.isalnum() else "_" for c in book_title)[:50] or "capa"
    # Mantém a extensão original quando possível
    suffix = Path(uploaded_file.name).suffix.lower() or ".png"
    target = covers / f"{safe}_{uploaded_file.size}{suffix}"
    with open(target, "wb") as fh:
        fh.write(uploaded_file.getbuffer())
    return str(target)


def render_cover(cover_path: str | None, *, width: int = 140) -> None:
    """Renderiza a capa em um ``st.image`` aceitando URL ou caminho local."""
    if not cover_path:
        st.markdown(
            f"<div style='width:{width}px;height:{int(width * 1.4)}px;"
            "background:#eee;display:flex;align-items:center;justify-content:center;"
            "border-radius:6px;color:#999;font-size:12px;'>sem capa</div>",
            unsafe_allow_html=True,
        )
        return
    try:
        if cover_path.startswith(("http://", "https://")):
            st.image(cover_path, width=width)
        else:
            path = Path(cover_path)
            if path.exists():
                st.image(str(path), width=width)
            else:
                st.caption("(capa indisponível)")
    except Exception:  # pragma: no cover - defensivo
        st.caption("(capa indisponível)")


def download_data_buttons(csv_text: str, json_text: str, *, basename: str = "biblioteca") -> None:
    col1, col2 = st.columns(2)
    with col1:
        st.download_button(
            "Exportar CSV",
            data=csv_text.encode("utf-8"),
            file_name=f"{basename}.csv",
            mime="text/csv",
            use_container_width=True,
        )
    with col2:
        st.download_button(
            "Exportar JSON",
            data=json_text.encode("utf-8"),
            file_name=f"{basename}.json",
            mime="application/json",
            use_container_width=True,
        )


def base64_image(path: Path) -> str:  # pragma: no cover - utilitário
    return base64.b64encode(path.read_bytes()).decode("utf-8")
