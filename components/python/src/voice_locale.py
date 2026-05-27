"""
Locale helpers for Spanish-only voice sessions.
"""

from __future__ import annotations

import os
import re


def voice_locale() -> str:
    return (os.getenv("VOICE_LOCALE") or "es").strip().lower()


def is_spanish_only() -> bool:
    return voice_locale() in ("es", "es-es", "spanish", "español", "espanol")


# Errores frecuentes del STT inglés → español del menú
_PHRASE_FIXES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bthe\s+power\b", re.I), "de pavo"),
    (re.compile(r"\bde\s+power\b", re.I), "de pavo"),
    (re.compile(r"\bsandwich\s+the\s+power\b", re.I), "sándwich de pavo"),
    (re.compile(r"\bsandwich\s+de\s+power\b", re.I), "sándwich de pavo"),
    (re.compile(r"\bi\s+want\b", re.I), "quiero"),
    (re.compile(r"\bi\s+would\s+like\b", re.I), "me gustaría"),
    (re.compile(r"\bcan\s+i\s+have\b", re.I), "quiero"),
    (re.compile(r"\bplease\b", re.I), "por favor"),
    (re.compile(r"\bwith\b", re.I), "con"),
    (re.compile(r"\band\b", re.I), "y"),
    (re.compile(r"\btomato\b", re.I), "tomate"),
    (re.compile(r"\bturkey\b", re.I), "pavo"),
    (re.compile(r"\bchicken\b", re.I), "pollo"),
    (re.compile(r"\bpork\b", re.I), "cerdo"),
    (re.compile(r"\blettuce\b", re.I), "lechuga"),
    (re.compile(r"\bcheese\b", re.I), "queso"),
    (re.compile(r"\bbread\b", re.I), "pan"),
    (re.compile(r"\bmayo(nnaise)?\b", re.I), "mayonesa"),
    (re.compile(r"\bsandwich\b", re.I), "sándwich"),
    (re.compile(r"\border\b", re.I), "pedido"),
    (re.compile(r"\bconfirm\b", re.I), "confirmo"),
]


def normalize_spanish_transcript(text: str) -> str:
    """Corrige anglicismos del STT cuando el locale es español."""
    if not text or not is_spanish_only():
        return text
    out = text
    for pattern, replacement in _PHRASE_FIXES:
        out = pattern.sub(replacement, out)
    return out
