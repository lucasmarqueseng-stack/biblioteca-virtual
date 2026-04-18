"""Configuração global do pytest: cria um banco SQLite em memória para cada teste."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


@pytest.fixture()
def db_session():
    """Retorna uma sessão SQLAlchemy ligada a um banco SQLite em memória."""
    os.environ["BIBLIOTECA_DB_URL"] = "sqlite:///:memory:"

    from biblioteca import database
    from biblioteca.database import get_sessionmaker, init_db

    database.reset_engine()
    init_db()
    SessionLocal = get_sessionmaker()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        database.reset_engine()
        os.environ.pop("BIBLIOTECA_DB_URL", None)
