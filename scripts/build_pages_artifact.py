#!/usr/bin/env python3
"""Create the minimal public GitHub Pages artifact for SF Compass."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"
FILES = ("index.html", "findings.html", "_headers", ".nojekyll", "favicon.svg", "preview.png", "preview.svg", "robots.txt", "sitemap.xml")
FORBIDDEN_PARTS = {".github", "scripts", "tests", "docs"}
FORBIDDEN_SUFFIXES = {".py", ".md", ".db", ".toml", ".yaml", ".yml"}

def build() -> None:
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    for name in FILES:
        source = ROOT / name
        if source.exists(): shutil.copy2(source, OUT / name)

def check() -> None:
    if not OUT.is_dir(): raise SystemExit("Artifact missing: run without --check first")
    bad = [p.relative_to(OUT) for p in OUT.rglob("*") if any(part in FORBIDDEN_PARTS for part in p.relative_to(OUT).parts) or p.suffix in FORBIDDEN_SUFFIXES]
    if bad: raise SystemExit("Forbidden artifact files: " + ", ".join(map(str, bad)))
    required = [OUT / "index.html", OUT / "findings.html"]
    missing = [str(p.relative_to(OUT)) for p in required if not p.is_file()]
    if missing: raise SystemExit("Missing required public files: " + ", ".join(missing))
    print(f"Pages artifact valid: {sum(1 for p in OUT.rglob('*') if p.is_file())} files")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check: check()
    else: build(); check()
