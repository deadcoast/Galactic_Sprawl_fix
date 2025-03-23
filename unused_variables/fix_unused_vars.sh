#!/bin/bash
# Auto-generated script to help fix unused variables
# Usage: ./fix_unused_vars.sh [module_name]

if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Usage: ./fix_unused_vars.sh [module_name]"
  echo "Without arguments, shows the list of available modules."
  exit 0
fi

PROJECT_ROOT="/Users/deadcoast/CursorProjects/Galactic_Sprawl/"
FIXES_DIR="/Users/deadcoast/fixes/"

# List available modules
modules=( $(ls $FIXES_DIR | grep "^fix_" | sed 's/fix_\(.*\)\.md/\1/') )

if [ -z "$1" ]; then
  echo "Available modules to fix:"
  for module in "${modules[@]}"; do
    echo "  $module"
  done
  exit 0
fi

# Open the specific module fix guide
module_file="${FIXES_DIR}/fix_$1.md"
if [ -f "$module_file" ]; then
  echo "Opening fix guide for module: $1"
  open "$module_file"
else
  echo "Error: Module '$1' not found"
  echo "Available modules:"
  for module in "${modules[@]}"; do
    echo "  $module"
  done
  exit 1
fi
