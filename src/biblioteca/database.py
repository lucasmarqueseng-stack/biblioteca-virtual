"""Configuração do banco de dados SQLAlchemy.

O caminho do banco pode ser sobrescrito pela variável de ambiente ``BIBLIOTECA_DB_URL``,
útil para testes (ex.: ``sqlite:///:memory:``) ou para apontar para um PostgreSQL.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "biblioteca.db"


def _build_default_url() -> str:
    return f"sqlite:///{DEFAULT_DB_PATH}"


def get_database_url() -> str:
    """Retorna a URL do banco, priorizando a variável de ambiente."""
    return os.environ.get("BIBLIOTECA_DB_URL", _build_default_url())


_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    """Cria (se necessário) e retorna o engine SQLAlchemy em uso."""
    global _engine, _SessionLocal
    if _engine is None:
        url = get_database_url()
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        _engine = create_engine(url, future=True, connect_args=connect_args)
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def get_sessionmaker() -> sessionmaker[Session]:
    """Retorna o sessionmaker configurado (inicializa o engine se preciso)."""
    get_engine()
    assert _SessionLocal is not None
    return _SessionLocal


def init_db() -> None:
    """Cria todas as tabelas declaradas nos modelos."""
    from biblioteca.models import Base  # import tardio evita ciclo

    engine = get_engine()
    Base.metadata.create_all(engine)


def reset_engine() -> None:
    """Descarta o engine atual (útil em testes que trocam a URL)."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _SessionLocal = None


@contextmanager
def session_scope() -> Iterator[Session]:
    """Context manager que faz commit/rollback automático."""
    SessionLocal = get_sessionmaker()
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
