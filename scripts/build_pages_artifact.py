#!/usr/bin/env python3
"""Create and validate the minimal public GitHub Pages artifact."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"
PUBLIC_FILES = (
    "index.html",
    "findings.html",
    "_headers",
    "favicon.svg",
    "preview.png",
    "preview.svg",
    "robots.txt",
    "sitemap.xml",
)
REQUIRED_FILES = ("index.html", "findings.html")
FORBIDDEN_SUFFIXES = {".db", ".md", ".py", ".toml", ".yaml", ".yml"}


def build() -> None:
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    for name in PUBLIC_FILES:
        source = ROOT / name
        if source.is_file():
            shutil.copy2(source, OUT / name)


def validate() -> None:
    missing = [name for name in REQUIRED_FILES if not (OUT / name).is_file()]
    if missing:
        raise SystemExit("Missing required public files: " + ", ".join(missing))
    forbidden = [path.relative_to(OUT) for path in OUT.rglob("*") if path.suffix in FORBIDDEN_SUFFIXES]
    if forbidden:
        raise SystemExit("Forbidden artifact files: " + ", ".join(map(str, forbidden)))
    print(f"Pages artifact valid: {sum(path.is_file() for path in OUT.rglob('*'))} files")


if __name__ == "__main__":
    build()
    validate()
