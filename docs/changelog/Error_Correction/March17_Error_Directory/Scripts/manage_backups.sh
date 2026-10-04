#!/bin/bash

# manage_backups.sh
#
# Purpose: Manage and organize backup directories
#   1. List existing backups
#   2. Clean up old backups (optional)
#   3. Archive backups (optional)
#
# Usage: ./manage_backups.sh [--clean=<days>] [--archive]

# Set strict mode
set -euo pipefail

# Parse arguments
CLEAN_DAYS=0
ARCHIVE=false
BACKUPS_DIR="../Fixes/Backups"

for arg in "$@"; do
  case "$arg" in
    --clean=*)
      CLEAN_DAYS="${arg#*=}"
      ;;
    --archive)
      ARCHIVE=true
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./manage_backups.sh [--clean=<days>] [--archive]"
      exit 1
      ;;
  esac
done

# Make sure the backups directory exists
if [ ! -d "$BACKUPS_DIR" ]; then
  echo "Error: Backups directory not found: $BACKUPS_DIR"
  exit 1
fi

# Function to list backups
list_backups() {
  echo "=== Existing Backups ==="
  echo "Location: $BACKUPS_DIR"
  echo ""
  
  # Count total backups
  local count=$(find "$BACKUPS_DIR" -type d -mindepth 1 | wc -l | tr -d '[:space:]')
  echo "Total backup directories: $count"
  echo ""
  
  # List backup directories sorted by date
  echo "Backup directories (newest first):"
  find "$BACKUPS_DIR" -type d -mindepth 1 | sort -r | while read dir; do
    # Count files in this backup
    local file_count=$(find "$dir" -type f | wc -l | tr -d '[:space:]')
    echo "- $(basename "$dir") ($file_count files)"
  done
}

# Function to clean old backups
clean_old_backups() {
  local days=$1
  echo "=== Cleaning Backups Older Than $days Days ==="
  
  # Find and remove old backup directories
  local old_dirs=$(find "$BACKUPS_DIR" -type d -mindepth 1 -mtime +$days)
  if [ -z "$old_dirs" ]; then
    echo "No backups older than $days days found."
    return
  fi
  
  echo "The following backup directories will be removed:"
  echo "$old_dirs"
  echo ""
  
  # Ask for confirmation
  read -p "Are you sure you want to delete these directories? (y/n) " confirm
  if [ "$confirm" != "y" ]; then
    echo "Operation cancelled."
    return
  fi
  
  # Remove the directories
  echo "$old_dirs" | xargs rm -rf
  echo "Old backups have been removed."
}

# Function to archive backups
archive_backups() {
  echo "=== Archiving Backups ==="
  local archive_name="backups_$(date +"%Y-%m-%d").tar.gz"
  local archive_path="$BACKUPS_DIR/../$archive_name"
  
  echo "Creating archive: $archive_name"
  tar -czf "$archive_path" -C "$BACKUPS_DIR/.." "Backups"
  
  echo "Archive created: $archive_path"
  echo "Would you like to remove the original backup directories? (y/n)"
  read -p "> " confirm
  if [ "$confirm" = "y" ]; then
    rm -rf "$BACKUPS_DIR"/*
    echo "Original backup directories removed."
  fi
}

# Main execution
list_backups

# Clean old backups if requested
if [ "$CLEAN_DAYS" -gt 0 ]; then
  clean_old_backups "$CLEAN_DAYS"
fi

# Archive backups if requested
if [ "$ARCHIVE" = true ]; then
  archive_backups
fi

echo "=== Backup Management Completed ===" 