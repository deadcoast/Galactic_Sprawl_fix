#!/usr/bin/env python3
"""
Down-Only Directory Tree (Rich powered)

• No CLI arguments – just drop it in a folder and run.
• Recurses only into sub-folders of the folder it lives in.
• Writes `directory_tree.txt` in the same folder.

Author: Space Muck Team (simplified by ChatGPT)
"""

import sys
from fnmatch import fnmatch
from pathlib import Path

# ---------- optional dependency handling ----------
try:
    from rich.console import Console
    from rich.tree import Tree
except ImportError:
    print("Rich not found. Installing …")
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "rich"])
    from rich.console import Console
    from rich.tree import Tree

# ---------- configuration ----------
DEFAULT_IGNORE = {
    "__pycache__",
    ".git",
}

OUTPUT_FILENAME = "directory_tree.txt"
# ------------------------------------


def should_ignore(path: Path) -> bool:
    """Return True if *path* should be skipped."""
    name = path.name
    return any(pattern == name or fnmatch(name, pattern) for pattern in DEFAULT_IGNORE)


def add_entries(directory: Path, branch: Tree) -> None:
    """Recursively add sub-directories / files to the Rich tree."""
    try:
        entries = sorted(
            (p for p in directory.iterdir() if not should_ignore(p)),
            key=lambda p: (not p.is_dir(), p.name.lower()),
        )
    except PermissionError:
        return

    for entry in entries:
        if entry.is_dir():
            sub_branch = branch.add(f"[bold blue]{entry.name}/[/]")
            add_entries(entry, sub_branch)
        else:
            branch.add(f"[green]{entry.name}[/]")


def main() -> None:
    start_dir = Path(__file__).resolve().parent  # only look **downwards**
    console = Console(record=True)

    root = Tree(f"[bold yellow]{start_dir.name}/[/]")
    add_entries(start_dir, root)

    console.print(root)

    out_file = start_dir / OUTPUT_FILENAME
    out_file.write_text(console.export_text(), encoding="utf-8")
    print(f"Directory tree saved to {out_file}")


if __name__ == "__main__":
    main()
