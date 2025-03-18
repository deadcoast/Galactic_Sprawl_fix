#!/bin/bash

# This is a pointer script that redirects to the canonical version
# The main script is now located in:
# CodeBase_Docs/changelog/Error_Correction/March17_Error_Directory/Scripts/Fixes/ResourceTools/fix_resources.sh

echo "This script has been moved to CodeBase_Docs/changelog/Error_Correction/March17_Error_Directory/Scripts/Fixes/ResourceTools/"
echo "Running from the canonical location..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." &> /dev/null && pwd)"
CANONICAL_SCRIPT="$PROJECT_ROOT/CodeBase_Docs/changelog/Error_Correction/March17_Error_Directory/Scripts/Fixes/ResourceTools/fix_resources.sh"

if [ ! -f "$CANONICAL_SCRIPT" ]; then
  echo "Error: Canonical script not found at: $CANONICAL_SCRIPT"
  exit 1
fi

# Pass all arguments to the canonical script
"$CANONICAL_SCRIPT" "$@"
