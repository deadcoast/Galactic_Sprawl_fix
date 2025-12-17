"""flip - Image file cleaner and organizer CLI tool."""

import os
import random
import string
from pathlib import Path

import click
from PIL import Image

SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"}


def generate_random_name(length: int = 12) -> str:
    """Generate a random numeric string."""
    return "".join(random.choices(string.digits, k=length))


def strip_metadata(image_path: Path, output_path: Path) -> None:
    """Strip all metadata from an image and save to output path."""
    with Image.open(image_path) as img:
        # Create a new image without metadata
        data = list(img.getdata())
        clean_img = Image.new(img.mode, img.size)
        clean_img.putdata(data)

        # Preserve format
        fmt = img.format or image_path.suffix[1:].upper()
        if fmt == "JPG":
            fmt = "JPEG"

        clean_img.save(output_path, format=fmt)


def is_image_file(path: Path) -> bool:
    """Check if file is a supported image format."""
    return path.suffix.lower() in SUPPORTED_FORMATS


@click.command()
@click.argument("directory", type=click.Path(exists=True, file_okay=False, path_type=Path))
@click.option("--recursive", "-r", is_flag=True, help="Process subdirectories recursively")
@click.option("--dry-run", "-n", is_flag=True, help="Show what would be done without making changes")
@click.option("--output", "-o", type=click.Path(path_type=Path), help="Output directory (default: in-place)")
@click.option("--length", "-l", default=12, help="Length of random numeric filename (default: 12)")
def flip(directory: Path, recursive: bool, dry_run: bool, output: Path | None, length: int) -> None:
    """Clean and organize image files.

    Strips metadata and renames files with random numeric strings.
    """
    # Collect image files
    if recursive:
        images = [p for p in directory.rglob("*") if p.is_file() and is_image_file(p)]
    else:
        images = [p for p in directory.iterdir() if p.is_file() and is_image_file(p)]

    if not images:
        click.echo("No image files found.")
        return

    click.echo(f"Found {len(images)} image(s)")

    # Set output directory
    out_dir = output or directory
    if output and not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    # Track used names to avoid collisions
    used_names: set[str] = set()

    for img_path in images:
        # Generate unique random name
        while True:
            new_name = generate_random_name(length)
            if new_name not in used_names:
                used_names.add(new_name)
                break

        new_filename = f"{new_name}{img_path.suffix.lower()}"
        new_path = out_dir / new_filename

        if dry_run:
            click.echo(f"  {img_path.name} -> {new_filename}")
        else:
            try:
                strip_metadata(img_path, new_path)
                # Remove original if processing in-place and path changed
                if output is None and new_path != img_path:
                    img_path.unlink()
                click.echo(f"  ✓ {img_path.name} -> {new_filename}")
            except Exception as e:
                click.echo(f"  ✗ {img_path.name}: {e}", err=True)

    if dry_run:
        click.echo("\n(dry run - no changes made)")
    else:
        click.echo(f"\nProcessed {len(images)} image(s)")


def main():
    flip()


if __name__ == "__main__":
    main()
