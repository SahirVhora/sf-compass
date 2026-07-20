#!/usr/bin/env python3
"""Dependency-free structural checks for the SF Compass static site."""

from html.parser import HTMLParser
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parents[1]


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.assurance_stages = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        attributes = dict(attrs)
        if attributes.get("id"):
            self.ids.append(str(attributes["id"]))
        classes = set((attributes.get("class") or "").split())
        if "assurance-stage" in classes:
            self.assurance_stages += 1


def validate(path: Path) -> SiteParser:
    parser = SiteParser()
    parser.feed(path.read_text(encoding="utf-8"))
    duplicates = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
    assert not duplicates, f"{path.name}: duplicate IDs: {', '.join(duplicates)}"
    return parser


def main() -> int:
    index = validate(ROOT / "index.html")
    validate(ROOT / "findings.html")
    assert index.assurance_stages == 5, "Expected five transformation assurance stages"
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert "Transformation Assurance" in html
    assert "94 scenarios" in html
    print("PASS: HTML parsing, unique IDs, lifecycle and core content")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
