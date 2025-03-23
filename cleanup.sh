#!/bin/bash

# Script to clean up the old analysis directory and ensure the new one is ready

# Current directory path
CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Old directory (with typo in name)
OLD_DIR="$CURRENT_DIR/analze-code-base"

# New directory
NEW_DIR="$CURRENT_DIR/analyze-codebase"

# Make sure the new output directory exists
mkdir -p "$NEW_DIR/output"

# Copy any previous analysis reports to the new output directory
if [ -f "$OLD_DIR/codebase_analysis_report.json" ]; then
  cp "$OLD_DIR/codebase_analysis_report.json" "$NEW_DIR/output/"
  echo "Copied previous analysis report to new output directory"
fi

if [ -f "$OLD_DIR/duplicate_modules_report.json" ]; then
  cp "$OLD_DIR/duplicate_modules_report.json" "$NEW_DIR/output/"
  echo "Copied previous duplicate modules report to new output directory"
fi

if [ -f "$OLD_DIR/claude-report.md" ]; then
  cp "$OLD_DIR/claude-report.md" "$NEW_DIR/output/"
  echo "Copied Claude's report to new output directory"
fi

if [ -f "$OLD_DIR/TECHNICAL_REPORT.md" ]; then
  cp "$OLD_DIR/TECHNICAL_REPORT.md" "$NEW_DIR/output/"
  echo "Copied previous technical report to new output directory"
fi

# Ensure all scripts in the new directory are executable
chmod +x "$NEW_DIR"/*.sh
chmod +x "$NEW_DIR"/*.js

# Create a backup of the old directory
BACKUP_DIR="$CURRENT_DIR/analze-code-base-backup"
if [ -d "$OLD_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  cp -r "$OLD_DIR"/* "$BACKUP_DIR/"
  echo "Created backup of old analysis directory at $BACKUP_DIR"
fi

# Clean up the old directory
if [ -d "$OLD_DIR" ]; then
  echo "Would you like to remove the old 'analze-code-base' directory with the typo? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    rm -rf "$OLD_DIR"
    echo "Removed old directory with typo"
  else
    echo "Old directory kept intact"
  fi
fi

echo ""
echo "Cleanup complete!"
echo ""
echo "To run the analysis tools, use:"
echo "  cd $NEW_DIR"
echo "  ./analyze.sh"
echo ""
echo "This will analyze your codebase and provide recommendations for improvement."
