"""Validadores de entrada de usuário."""

from __future__ import annotations

from datetime import date


class ValidationError(ValueError):
    """Erro de validação de campos do formulário."""


def _strip_or_empty(value: str | None) -> str:
    return (value or "").strip()


def validate_title(title: str | None) -> str:
    title = _strip_or_empty(title)
    if not title:
        raise ValidationError("O título é obrigatório.")
    if len(title) > 500:
        raise ValidationError("O título deve ter no máximo 500 caracteres.")
    return title


def validate_authors(authors: list[str] | None) -> list[str]:
    if not authors:
        raise ValidationError("Informe ao menos um autor.")
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in authors:
        name = _strip_or_empty(raw)
        if not name:
            continue
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(name)
    if not cleaned:
        raise ValidationError("Informe ao menos um autor.")
    return cleaned


def parse_authors_input(text: str | None) -> list[str]:
    """Aceita autores separados por vírgula ou nova linha."""
    text = _strip_or_empty(text)
    if not text:
        return []
    raw_parts: list[str] = []
    for line in text.splitlines():
        raw_parts.extend(line.split(","))
    return [p.strip() for p in raw_parts if p.strip()]


def validate_year(year: int | None) -> int | None:
    if year is None:
        return None
    current = date.today().year
    if year < 0 or year > current + 1:
        raise ValidationError(
            f"Ano de publicação inválido. Use um valor entre 0 e {current + 1}."
        )
    return int(year)


def validate_genre(genre: str | None) -> str | None:
    genre = _strip_or_empty(genre)
    return genre or None


def validate_rating(rating: int | None, required: bool = False) -> int | None:
    if rating is None:
        if required:
            raise ValidationError("A avaliação é obrigatória.")
        return None
    if not (1 <= int(rating) <= 5):
        raise ValidationError("A avaliação deve estar entre 1 e 5 estrelas.")
    return int(rating)


def validate_pages(pages: int | None) -> int:
    if pages is None:
        return 0
    if int(pages) < 0:
        raise ValidationError("O total de páginas não pode ser negativo.")
    return int(pages)


def validate_pages_read(pages_read: int | None, total_pages: int) -> int:
    if pages_read is None:
        return 0
    value = int(pages_read)
    if value < 0:
        raise ValidationError("Páginas lidas não podem ser negativas.")
    if total_pages > 0 and value > total_pages:
        raise ValidationError("Páginas lidas não podem exceder o total de páginas.")
    return value


def validate_status(status: str | None) -> str:
    from biblioteca.models import BookStatus

    status = _strip_or_empty(status)
    valid = BookStatus.values()
    if status not in valid:
        raise ValidationError(f"Status inválido. Valores permitidos: {', '.join(valid)}.")
    return status


def validate_goal_targets(
    target_books: int | None, target_pages: int | None
) -> tuple[int | None, int | None]:
    tb = int(target_books) if target_books not in (None, 0) else None
    tp = int(target_pages) if target_pages not in (None, 0) else None
    if tb is None and tp is None:
        raise ValidationError("Defina ao menos uma meta (livros ou páginas).")
    if tb is not None and tb < 0:
        raise ValidationError("A meta de livros não pode ser negativa.")
    if tp is not None and tp < 0:
        raise ValidationError("A meta de páginas não pode ser negativa.")
    return tb, tp
