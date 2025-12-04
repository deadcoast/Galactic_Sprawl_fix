#!/usr/bin/env python3
"""
Hierarchical Index Generator (ordered, Markdown-friendly)

Drop this script into any directory and run it:

    python make_index.py

It produces `directory_index.md` beside the script with lines like

    [.docs]
    - [.docs](changelog)
    - -- [changelog](CodeBase_Modules)
    - --- [CodeBase_Modules](Initial_Integration)
    - ---- [Initial_Integration](01_Core)
    - ---- [01_Core](Core_Components_References.md)
    …

Configuration knobs (`IGNORE_DIRS`, `IGNORE_FILES`, `OUTPUT_NAME`) are
at the top – edit as needed.

Author: Space Muck Team  (updated by ChatGPT 2025-06-05)
"""

from pathlib import Path
from fnmatch import fnmatch

# ── CONFIG ─────────────────────────────────────────────────────────────────────
IGNORE_DIRS = {"__pycache__", ".git", ".hg", ".svn"}
IGNORE_FILES = {".ds_store"}
OUTPUT_NAME = "directory_index.md"
# ───────────────────────────────────────────────────────────────────────────────


def should_skip(name: str, skip_set: set[str]) -> bool:
    """True if *name* matches any item (case-insensitive) in *skip_set*."""
    lname = name.lower()
    return lname in skip_set or any(fnmatch(lname, pat) for pat in skip_set)


def dash_prefix(depth: int) -> str:
    """
    Convert a nesting depth (root = 0) to the required dash pattern.

        depth 0 → ""               (root line)
        depth 1 → "- "
        depth 2 → "- -- "
        depth n → "- " + "-"*n + " "
    """
    if depth == 0:
        return ""
    return "- " if depth == 1 else "- " + "-" * depth + " "


def build_index(parent: Path, depth: int, lines: list[str]) -> None:
    """
    Depth-first walk that mirrors the visual Rich-tree order:
    • Directories first (alphabetical, case-insensitive)
    • Then files (alphabetical, case-insensitive)
    """
    # 1️⃣ Collect children, skipping ignored names
    try:
        dirs = sorted(
            [p for p in parent.iterdir() if p.is_dir() and not should_skip(p.name, IGNORE_DIRS)],
            key=lambda p: p.name.lower(),
        )
        files = sorted(
            [p for p in parent.iterdir() if p.is_file() and not should_skip(p.name, IGNORE_FILES)],
            key=lambda p: p.name.lower(),
        )
    except PermissionError:
        return  # skip unreadable directories

    # 2️⃣ Output a line for every child (dirs then files) **except** root itself
    for child in dirs + files:
        prefix = dash_prefix(depth + 1)
        lines.append(f"{prefix}[{parent.name}]({child.name})")

        # Recurse into sub-directories
        if child.is_dir():
            build_index(child, depth + 1, lines)


def main() -> None:
    root = Path(__file__).resolve().parent  # never wander outside this folder
    lines = [f"[{root.name}]"]             # root line, no dash

    build_index(root, 0, lines)            # depth 0 = root itself

    out_path = root / OUTPUT_NAME
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Created {out_path.name} with {len(lines)} lines (ordered index).")


if __name__ == "__main__":
    main()
