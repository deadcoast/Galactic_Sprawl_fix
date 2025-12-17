# flip

Image file cleaner CLI tool. Strips metadata and renames files with random numbers.

## Install

```bash
uv pip install -e .
```

## Usage

```bash
# Process images in a directory (in-place)
flip /path/to/images

# Dry run - preview changes without modifying files
flip /path/to/images --dry-run

# Process recursively
flip /path/to/images --recursive

# Output to a different directory
flip /path/to/images --output /path/to/output

# Custom filename length (default: 12)
flip /path/to/images --length 8
```

## Run with uv

```bash
uv run flip /path/to/images
```

## Options

- `-r, --recursive` - Process subdirectories recursively
- `-n, --dry-run` - Preview changes without modifying files
- `-o, --output` - Output directory (default: in-place)
- `-l, --length` - Length of random numeric filename (default: 12)
