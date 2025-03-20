#!/bin/bash
###############################################################################
# Comprehensive Resource Type Fixes Script
#
# This script fixes various resource type issues across the codebase.
# Each section is organized into its own function. The logic in each
# function is preserved exactly as in the original script.
#
# Usage: Run this script from the root of your project.
###############################################################################

# Section 1: Fix specific files with resourceType issues
fix_specific_files_resourceType() {
  echo "Fixing specific files with resourceType issues..."

  # Fix ExplorationHub.tsx
  echo "Fixing src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx"
  sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx

  # Fix ExplorationWindow.tsx
  echo "Fixing src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx"
  sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx

  # Fix MineralProcessingCentre.tsx
  echo "Fixing src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx"
  sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx

  # Fix MiningWindow.tsx
  echo "Fixing src/components/buildings/modules/MiningHub/MiningWindow.tsx"
  sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx
  sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx

  # Fix type definitions
  echo "Fixing type definitions in problematic files"
  sed -i '' 's/resourceType: string/resourceType: ResourceType/g' src/components/buildings/modules/ExplorationHub/ExplorationHub.tsx
  sed -i '' 's/resourceType: string/resourceType: ResourceType/g' src/components/buildings/modules/ExplorationHub/ExplorationWindow.tsx
  sed -i '' 's/resourceType: string/resourceType: ResourceType/g' src/components/buildings/modules/MiningHub/MineralProcessingCentre.tsx
  sed -i '' 's/resourceType: string/resourceType: ResourceType/g' src/components/buildings/modules/MiningHub/MiningWindow.tsx

  echo "Specific file fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 2: Add ResourceType imports where missing
add_ResourceType_imports() {
  echo "Adding ResourceType imports to files that need it..."

  while read -r LINE; do
    FILE=$(echo "$LINE" | awk '{print $1}')
    
    echo "Processing $FILE..."
    
    if grep -q "import.*ResourceType.*from '.*ResourceTypes'" "$FILE"; then
      echo "  Already has ResourceType import, skipping."
      continue
    fi
    
    DEPTH=$(echo "$FILE" | tr -cd '/' | wc -c)
    REL_PATH=""
    for ((i=1; i<DEPTH; i++)); do
      REL_PATH="../$REL_PATH"
    done
    
    if grep -q "^import " "$FILE"; then
      LAST_IMPORT_LINE=$(grep -n "^import " "$FILE" | tail -1 | cut -d: -f1)
      sed -i '' "${LAST_IMPORT_LINE}a\\
import { ResourceType } from '${REL_PATH}types/resources/ResourceTypes';" "$FILE"
      echo "  Added ResourceType import after line $LAST_IMPORT_LINE"
    else
      sed -i '' "1i\\
import { ResourceType } from '${REL_PATH}types/resources/ResourceTypes';" "$FILE"
      echo "  Added ResourceType import at the beginning of the file"
    fi
  done < resource_type_errors.txt

  echo "Import additions complete. Run TypeScript compiler to verify fixes."
}

# Section 3: Fix duplicate React imports
fix_duplicate_react_imports() {
  echo "Fixing duplicate React imports..."
  find src -name "*.tsx" | while read -r file; do
    if grep -q "import \* as React from [\"']react[\"']" "$file" && grep -q "import React from [\"']react[\"']" "$file"; then
      echo "Removing duplicate React import in $file"
      sed -i '' '/import React from [\"']react[\"'];/d' "$file"
    fi
  done
  echo "Duplicate React import fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 4: Fix syntax errors in import statements with extra semicolons
fix_import_syntax_extra_semicolons() {
  echo "Fixing syntax errors in import statements with extra semicolons..."
  find src -name "*.tsx" | while read -r file; do
    if grep -q "import.*;;.*from" "$file"; then
      echo "Processing $file..."
      sed -i '' 's/\([a-zA-Z0-9_]\);;\([^"'\'']*from\)/\1\2/g' "$file"
      echo "  Fixed import statements in $file"
    fi
    
    if grep -q "import.*,.*,.*from" "$file"; then
      echo "Processing $file for comma issues..."
      sed -i '' 's/\([a-zA-Z0-9_]\),\s*\([,}]\)/\1\2/g' "$file"
      echo "  Fixed comma issues in $file"
    fi
  done
  echo "Import syntax error fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 5: Fix syntax errors in import statements (combining React imports)
fix_import_statements() {
  echo "Fixing syntax errors in import statements..."
  find src -name "*.tsx" | while read -r file; do
    if grep -q "import \* as React from 'react';" "$file" && grep -q "import { .* } from 'react'" "$file"; then
      echo "Processing $file..."
      named_imports=$(grep "import { .* } from 'react'" "$file" | sed -E 's/import \{ (.*) \} from '\''react'\''/\1/')
      sed -i '' "/import { .* } from 'react'/d" "$file"
      sed -i '' "s/import \* as React from 'react';/import * as React from 'react';\nimport { $named_imports } from 'react';/" "$file"
      echo "  Fixed import statements in $file"
    fi
  done
  echo "Import syntax fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 6: Update imports from StandardizedResourceTypes.ts to ResourceTypes.ts
update_standardized_imports() {
  echo "Updating imports from StandardizedResourceTypes.ts to ResourceTypes.ts..."
  FILES=$(grep -l "from '.*StandardizedResourceTypes'" src/ --include="*.ts" --include="*.tsx")
  for FILE in $FILES; do
    echo "Updating $FILE..."
    sed -i '' 's/from \(.*\)StandardizedResourceTypes/from \1ResourceTypes/g' "$FILE"
    if grep -q "ResourceType as EnumResourceType" "$FILE"; then
      sed -i '' 's/ResourceType as EnumResourceType/ResourceType/g' "$FILE"
    fi
  done
  echo "Import updates completed. Please run the TypeScript compiler to verify fixes."
}

# Section 7: Fix JSX configuration issues and React imports in TSX files
fix_jsx_configuration() {
  echo "Fixing JSX configuration issues..."
  if [ ! -f "tsconfig.json" ]; then
    echo "Error: tsconfig.json not found!"
    exit 1
  fi
  if grep -q '"jsx":' tsconfig.json; then
    sed -i '' 's/"jsx": "[^"]*"/"jsx": "react-jsx"/g' tsconfig.json
    echo "Updated jsx setting to react-jsx"
  else
    sed -i '' '/"compilerOptions": {/a\
    "jsx": "react-jsx",
  ' tsconfig.json
    echo "Added jsx setting as react-jsx"
  fi
  if grep -q '"esModuleInterop":' tsconfig.json; then
    sed -i '' 's/"esModuleInterop": false/"esModuleInterop": true/g' tsconfig.json
    echo "Updated esModuleInterop to true"
  else
    sed -i '' '/"compilerOptions": {/a\
    "esModuleInterop": true,
  ' tsconfig.json
    echo "Added esModuleInterop as true"
  fi

  echo "Fixing React imports in TSX files..."
  find src -name "*.tsx" | while read -r file; do
    echo "Processing $file..."
    if grep -q "import React" "$file"; then
      if grep -q "import React from 'react'" "$file"; then
        echo "  React import is already correct in $file"
      else
        sed -i '' 's/import \* as React from .react.;/import React from "react";/g' "$file"
        sed -i '' 's/import { React } from .react.;/import React from "react";/g' "$file"
        echo "  Fixed React import in $file"
      fi
    else
      sed -i '' '1s/^/import React from "react";\n/' "$file"
      echo "  Added React import to $file"
    fi
    
    if grep -q "import { ResourceVisualization } from" "$file"; then
      sed -i '' 's/import { ResourceVisualization } from/import ResourceVisualization from/g' "$file"
      echo "  Fixed ResourceVisualization import in $file"
    fi
  done

  echo "JSX configuration fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 8: Fix object literals and variable assignments with string resourceType values
fix_object_literals_resourceType() {
  echo "Fixing object literals with string resourceType..."
  find src -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
    if [[ "$file" == *"ResourceTypes.ts" ]]; then
      continue
    fi

    if grep -q "resourceType: ['\"]" "$file"; then
      echo "  Fixing object literals in $file"
      sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' "$file"
      sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' "$file"
      sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' "$file"
      sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' "$file"
      sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' "$file"
      sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' "$file"
      sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' "$file"
      sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' "$file"
      sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' "$file"
      sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' "$file"
      sed -i '' "s/resourceType: 'MINERALS'/resourceType: ResourceType.MINERALS/g" "$file"
      sed -i '' "s/resourceType: 'ENERGY'/resourceType: ResourceType.ENERGY/g" "$file"
      sed -i '' "s/resourceType: 'POPULATION'/resourceType: ResourceType.POPULATION/g" "$file"
      sed -i '' "s/resourceType: 'FOOD'/resourceType: ResourceType.FOOD/g" "$file"
      sed -i '' "s/resourceType: 'WATER'/resourceType: ResourceType.WATER/g" "$file"
      sed -i '' "s/resourceType: 'OXYGEN'/resourceType: ResourceType.OXYGEN/g" "$file"
      sed -i '' "s/resourceType: 'RESEARCH'/resourceType: ResourceType.RESEARCH/g" "$file"
      sed -i '' "s/resourceType: 'METALS'/resourceType: ResourceType.METALS/g" "$file"
      sed -i '' "s/resourceType: 'RARE_METALS'/resourceType: ResourceType.RARE_METALS/g" "$file"
      sed -i '' "s/resourceType: 'EXOTIC_MATTER'/resourceType: ResourceType.EXOTIC_MATTER/g" "$file"
      if ! grep -q "import.*ResourceType.*from" "$file"; then
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/types/resources/ResourceTypes.ts', os.path.dirname('$file')))")
        sed -i '' '1s/^/import { ResourceType } from "'"$rel_path"'";\n/' "$file"
      fi
    fi
    
    if grep -q "resourceType: string" "$file"; then
      echo "  Fixing type definitions in $file"
      sed -i '' 's/resourceType: string/resourceType: ResourceType/g' "$file"
      if ! grep -q "import.*ResourceType.*from" "$file"; then
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/types/resources/ResourceTypes.ts', os.path.dirname('$file')))")
        sed -i '' '1s/^/import { ResourceType } from "'"$rel_path"'";\n/' "$file"
      fi
    fi
    
    if grep -q "resourceType = ['\"]" "$file"; then
      echo "  Fixing variable assignments in $file"
      sed -i '' 's/resourceType = "MINERALS"/resourceType = ResourceType.MINERALS/g' "$file"
      sed -i '' 's/resourceType = "ENERGY"/resourceType = ResourceType.ENERGY/g' "$file"
      sed -i '' 's/resourceType = "POPULATION"/resourceType = ResourceType.POPULATION/g' "$file"
      sed -i '' 's/resourceType = "FOOD"/resourceType = ResourceType.FOOD/g' "$file"
      sed -i '' 's/resourceType = "WATER"/resourceType = ResourceType.WATER/g' "$file"
      sed -i '' 's/resourceType = "OXYGEN"/resourceType = ResourceType.OXYGEN/g' "$file"
      sed -i '' 's/resourceType = "RESEARCH"/resourceType = ResourceType.RESEARCH/g' "$file"
      sed -i '' 's/resourceType = "METALS"/resourceType = ResourceType.METALS/g' "$file"
      sed -i '' 's/resourceType = "RARE_METALS"/resourceType = ResourceType.RARE_METALS/g' "$file"
      sed -i '' 's/resourceType = "EXOTIC_MATTER"/resourceType = ResourceType.EXOTIC_MATTER/g' "$file"
      sed -i '' "s/resourceType = 'MINERALS'/resourceType = ResourceType.MINERALS/g" "$file"
      sed -i '' "s/resourceType = 'ENERGY'/resourceType = ResourceType.ENERGY/g" "$file"
      sed -i '' "s/resourceType = 'POPULATION'/resourceType = ResourceType.POPULATION/g" "$file"
      sed -i '' "s/resourceType = 'FOOD'/resourceType = ResourceType.FOOD/g" "$file"
      sed -i '' "s/resourceType = 'WATER'/resourceType = ResourceType.WATER/g" "$file"
      sed -i '' "s/resourceType = 'OXYGEN'/resourceType = ResourceType.OXYGEN/g" "$file"
      sed -i '' "s/resourceType = 'RESEARCH'/resourceType = ResourceType.RESEARCH/g" "$file"
      sed -i '' "s/resourceType = 'METALS'/resourceType = ResourceType.METALS/g" "$file"
      sed -i '' "s/resourceType = 'RARE_METALS'/resourceType = ResourceType.RARE_METALS/g" "$file"
      sed -i '' "s/resourceType = 'EXOTIC_MATTER'/resourceType = ResourceType.EXOTIC_MATTER/g" "$file"
    fi
  done
  echo "Object literal fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 9: Update React imports to use namespace import style
update_react_namespace_import() {
  echo "Updating React imports to use namespace import style..."
  find src -name "*.tsx" | while read -r file; do
    echo "Processing $file..."
    if grep -q "import React from 'react'" "$file"; then
      sed -i '' 's/import React from '\''react'\''/import * as React from '\''react'\''/' "$file"
      echo "  Updated default import in $file"
    fi
    if grep -q "import React, { .* } from 'react'" "$file"; then
      named_imports=$(grep "import React, { .* } from 'react'" "$file" | sed -E 's/import React, \{ (.*) \} from '\''react'\''/\1/')
      sed -i '' "s/import React, { .* } from 'react'/import * as React from 'react';\nimport { $named_imports } from 'react'/" "$file"
      echo "  Updated mixed import in $file"
    fi
    if ! grep -q "import.*React.*from 'react'" "$file" && grep -q "<[A-Z]" "$file"; then
      sed -i '' '1s/^/import * as React from '\''react'\'';\n/' "$file"
      echo "  Added React import to $file"
    fi
  done
  echo "React import updates completed. Please run the TypeScript compiler to verify the changes."
}

# Section 10: Fix remaining import syntax errors
fix_remaining_import_syntax_errors() {
  echo "Fixing remaining import syntax errors..."
  find src -name "*.tsx" | while read -r file; do
    if grep -q "import.*{.*;" "$file"; then
      echo "Fixing semicolons in import curly braces in $file"
      sed -i '' -E 's/import \* as React from .react.;/import * as React from "react";/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*); \}/import { \1 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*); ([^}]*) \}/import { \1, \2 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3, \4 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*), ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3, \4, \5 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3, \4, \5, \6 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3, \4, \5, \6, \7 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3, \4, \5, \6, \7, \8 }/g' "$file"
      sed -i '' -E 's/import \{ ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*), ([^}]*); ([^}]*) \}/import { \1, \2, \3, \4, \5, \6, \7, \8, \9 }/g' "$file"
    fi

    if grep -q "import \* as React from 'react'" "$file" && grep -q "import React from [\"']react[\"']" "$file"; then
      echo "Removing duplicate React import in $file"
      sed -i '' '/import React from [\"']react[\"'];/d' "$file"
    fi
  done
  echo "Remaining import syntax error fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 11: Fix import paths for ResourceType and ResourceTypeConverter
fix_import_paths_resourceType_converter() {
  echo "Fixing import paths for ResourceType and ResourceTypeConverter..."
  resource_type_path="src/types/resources/ResourceTypes.ts"
  resource_converter_path="src/utils/ResourceTypeConverter.ts"

  if [ ! -f "$resource_type_path" ]; then
    echo "Error: ResourceTypes.ts not found at $resource_type_path!"
    exit 1
  fi

  if [ ! -f "$resource_converter_path" ]; then
    echo "Error: ResourceTypeConverter.ts not found at $resource_converter_path!"
    exit 1
  fi

  resource_type_import_path=$(echo "$resource_type_path" | sed 's/^src\///' | sed 's/\.ts$//')
  resource_converter_import_path=$(echo "$resource_converter_path" | sed 's/^src\///' | sed 's/\.ts$//')

  echo "ResourceType import path: $resource_type_import_path"
  echo "ResourceTypeConverter import path: $resource_converter_import_path"

  find src -name "*.ts" -o -name "*.tsx" | while read -r file; do
    if [[ "$file" == "$resource_type_path" || "$file" == "$resource_converter_path" ]]; then
      continue
    fi
    
    if grep -q "import.*ResourceType.*from" "$file" || grep -q "import.*\(stringToResourceType\|resourceTypeToString\).*from" "$file"; then
      echo "Processing $file..."
      file_dir=$(dirname "$file" | sed 's/^src\///')
      resource_type_rel_path=$(node -e "console.log(require('path').relative('$file_dir', '$resource_type_import_path').replace(/\\\\/g, '/') || '.')")
      if [[ "$resource_type_rel_path" != /* ]]; then
        if [[ "$resource_type_rel_path" != ./* ]]; then
          resource_type_rel_path="./$resource_type_rel_path"
        fi
      fi
      
      resource_converter_rel_path=$(node -e "console.log(require('path').relative('$file_dir', '$resource_converter_import_path').replace(/\\\\/g, '/') || '.')")
      if [[ "$resource_converter_rel_path" != /* ]]; then
        if [[ "$resource_converter_rel_path" != ./* ]]; then
          resource_converter_rel_path="./$resource_converter_rel_path"
        fi
      fi
      
      if grep -q "import.*ResourceType.*from" "$file"; then
        echo "  Fixing ResourceType import in $file"
        sed -i '' "s|import.*ResourceType.*from [\"'][^\"']*[\"']|import { ResourceType } from \"$resource_type_rel_path\"|" "$file"
      fi
      
      if grep -q "import.*\(stringToResourceType\|resourceTypeToString\).*from" "$file"; then
        echo "  Fixing ResourceTypeConverter import in $file"
        sed -i '' "s|import.*\(stringToResourceType\|resourceTypeToString\).*from [\"'][^\"']*[\"']|import { stringToResourceType, resourceTypeToString } from \"$resource_converter_rel_path\"|" "$file"
      fi
    fi
  done
  echo "Import path fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 12: Fix ResourceTypeMigration.ts and update references
fix_resource_type_migration() {
  echo "Fixing ResourceTypeMigration.ts and updating references..."
  if [ ! -f "src/utils/resources/ResourceTypeMigration.ts" ]; then
    echo "Error: ResourceTypeMigration.ts not found!"
    exit 1
  fi

  echo "Finding files that import from ResourceTypeMigration.ts..."
  files_to_update=$(grep -l "from ['\"].*ResourceTypeMigration['\"]" --include="*.ts" --include="*.tsx" src/)
  for file in $files_to_update; do
    echo "Updating imports in $file..."
    if grep -q "ResourceTypeConverter" "$file"; then
      echo "  File uses ResourceTypeConverter, updating to use ResourceTypeMigration functions..."
      sed -i '' 's/ResourceTypeConverter\.isEnumResourceType/isEnumResourceType/g' "$file"
      sed -i '' 's/ResourceTypeConverter\.isStringResourceType/isStringResourceType/g' "$file"
      sed -i '' 's/ResourceTypeConverter\.ensureEnumResourceType/ensureEnumResourceType/g' "$file"
      sed -i '' 's/ResourceTypeConverter\.ensureStringResourceType/ensureStringResourceType/g' "$file"
      
      if ! grep -q "import.*isEnumResourceType.*from" "$file" && grep -q "isEnumResourceType" "$file"; then
        file_dir=$(dirname "$file")
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/utils/resources/ResourceTypeMigration.ts', '$file_dir'))")
        sed -i '' "s/import { ResourceType } from/import { isEnumResourceType } from \"$rel_path\";\nimport { ResourceType } from/g" "$file"
      fi
      
      if ! grep -q "import.*ensureEnumResourceType.*from" "$file" && grep -q "ensureEnumResourceType" "$file"; then
        file_dir=$(dirname "$file")
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/utils/resources/ResourceTypeMigration.ts', '$file_dir'))")
        sed -i '' "s/import { ResourceType } from/import { ensureEnumResourceType } from \"$rel_path\";\nimport { ResourceType } from/g" "$file"
      fi
      
      if ! grep -q "import.*isStringResourceType.*from" "$file" && grep -q "isStringResourceType" "$file"; then
        file_dir=$(dirname "$file")
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/utils/resources/ResourceTypeMigration.ts', '$file_dir'))")
        sed -i '' "s/import { ResourceType } from/import { isStringResourceType } from \"$rel_path\";\nimport { ResourceType } from/g" "$file"
      fi
      
      if ! grep -q "import.*ensureStringResourceType.*from" "$file" && grep -q "ensureStringResourceType" "$file"; then
        file_dir=$(dirname "$file")
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/utils/resources/ResourceTypeMigration.ts', '$file_dir'))")
        sed -i '' "s/import { ResourceType } from/import { ensureStringResourceType } from \"$rel_path\";\nimport { ResourceType } from/g" "$file"
      fi
    fi
  done

  if [ -f "src/scripts/update_resource_types.sh" ]; then
    echo "Updating master script to include fix_resource_type_migration.sh..."
    if ! grep -q "fix_resource_type_migration.sh" "src/scripts/update_resource_types.sh"; then
      sed -i '' '/chmod +x src\/scripts\/fix_specific_files.sh/a\\nchmod +x src\/scripts\/fix_resource_type_migration.sh' "src/scripts/update_resource_types.sh"
      sed -i '' '/Step 7: Fixing specific files with remaining issues/a\\n# Step 8: Fixing ResourceTypeMigration.ts and updating references\necho "Step 8: Fixing ResourceTypeMigration.ts and updating references..."\n.\/src\/scripts\/fix_resource_type_migration.sh' "src/scripts/update_resource_types.sh"
      sed -i '' 's/Step 8: Running TypeScript compiler/Step 9: Running TypeScript compiler/g' "src/scripts/update_resource_types.sh"
    fi
  fi

  echo "ResourceTypeMigration.ts fixes completed. Please run the TypeScript compiler to verify the changes."
}

# Section 13: Fix instances where string is used instead of ResourceType
fix_string_resourceType_usage() {
  echo "Fixing instances where string is used instead of ResourceType..."
  find src -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
    if [[ "$file" == *"ResourceTypes.ts" ]]; then
      continue
    fi

    if grep -q "resourceType: string" "$file"; then
      echo "  Fixing resourceType in $file"
      sed -i '' 's/resourceType: string/resourceType: ResourceType/g' "$file"
      if ! grep -q "import.*ResourceType.*from" "$file"; then
        rel_path=$(python -c "import os.path; print(os.path.relpath('src/types/resources/ResourceTypes.ts', os.path.dirname('$file')))")
        sed -i '' '1s/^/import { ResourceType } from "'"$rel_path"'";\n/' "$file"
      fi
    fi
    
    if grep -q "resourceType: ['\"]" "$file"; then
      echo "  Fixing string literals in $file"
      sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' "$file"
      sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' "$file"
      sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' "$file"
      sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' "$file"
      sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' "$file"
      sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' "$file"
      sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' "$file"
      sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' "$file"
      sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' "$file"
      sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' "$file"
      sed -i '' "s/resourceType: 'MINERALS'/resourceType: ResourceType.MINERALS/g" "$file"
      sed -i '' "s/resourceType: 'ENERGY'/resourceType: ResourceType.ENERGY/g" "$file"
      sed -i '' "s/resourceType: 'POPULATION'/resourceType: ResourceType.POPULATION/g" "$file"
      sed -i '' "s/resourceType: 'FOOD'/resourceType: ResourceType.FOOD/g" "$file"
      sed -i '' "s/resourceType: 'WATER'/resourceType: ResourceType.WATER/g" "$file"
      sed -i '' "s/resourceType: 'OXYGEN'/resourceType: ResourceType.OXYGEN/g" "$file"
      sed -i '' "s/resourceType: 'RESEARCH'/resourceType: ResourceType.RESEARCH/g" "$file"
      sed -i '' "s/resourceType: 'METALS'/resourceType: ResourceType.METALS/g" "$file"
      sed -i '' "s/resourceType: 'RARE_METALS'/resourceType: ResourceType.RARE_METALS/g" "$file"
      sed -i '' "s/resourceType: 'EXOTIC_MATTER'/resourceType: ResourceType.EXOTIC_MATTER/g" "$file"
    fi
    
    if grep -q "resourceType: ['\"][A-Z_]*['\"]" "$file"; then
      echo "  Fixing array/object literals in $file"
      sed -i '' 's/resourceType: "MINERALS"/resourceType: ResourceType.MINERALS/g' "$file"
      sed -i '' 's/resourceType: "ENERGY"/resourceType: ResourceType.ENERGY/g' "$file"
      sed -i '' 's/resourceType: "POPULATION"/resourceType: ResourceType.POPULATION/g' "$file"
      sed -i '' 's/resourceType: "FOOD"/resourceType: ResourceType.FOOD/g' "$file"
      sed -i '' 's/resourceType: "WATER"/resourceType: ResourceType.WATER/g' "$file"
      sed -i '' 's/resourceType: "OXYGEN"/resourceType: ResourceType.OXYGEN/g' "$file"
      sed -i '' 's/resourceType: "RESEARCH"/resourceType: ResourceType.RESEARCH/g' "$file"
      sed -i '' 's/resourceType: "METALS"/resourceType: ResourceType.METALS/g' "$file"
      sed -i '' 's/resourceType: "RARE_METALS"/resourceType: ResourceType.RARE_METALS/g' "$file"
      sed -i '' 's/resourceType: "EXOTIC_MATTER"/resourceType: ResourceType.EXOTIC_MATTER/g' "$file"
      sed -i '' "s/resourceType: 'MINERALS'/resourceType: ResourceType.MINERALS/g" "$file"
      sed -i '' "s/resourceType: 'ENERGY'/resourceType: ResourceType.ENERGY/g" "$file"
      sed -i '' "s/resourceType: 'POPULATION'/resourceType: ResourceType.POPULATION/g" "$file"
      sed -i '' "s/resourceType: 'FOOD'/resourceType: ResourceType.FOOD/g" "$file"
      sed -i '' "s/resourceType: 'WATER'/resourceType: ResourceType.WATER/g" "$file"
      sed -i '' "s/resourceType: 'OXYGEN'/resourceType: ResourceType.OXYGEN/g" "$file"
      sed -i '' "s/resourceType: 'RESEARCH'/resourceType: ResourceType.RESEARCH/g" "$file"
      sed -i '' "s/resourceType: 'METALS'/resourceType: ResourceType.METALS/g" "$file"
      sed -i '' "s/resourceType: 'RARE_METALS'/resourceType: ResourceType.RARE_METALS/g" "$file"
      sed -i '' "s/resourceType: 'EXOTIC_MATTER'/resourceType: ResourceType.EXOTIC_MATTER/g" "$file"
    fi
  done
  echo "String to ResourceType enum conversion completed. Please run the TypeScript compiler to verify the changes."
}

# Section 14: Comprehensive Resource Types Fixes
comprehensive_resource_types() {
  echo "Fix Resource Types - Comprehensive Script"
  echo "Fixing ResourceTypeMigration.ts imports..."
  if grep -q "ResourceTypeString" "src/utils/resources/ResourceTypeMigration.ts"; then
    echo "ResourceTypeString import already exists"
  else
    sed -i '' 's/import { ResourceType } from/import { ResourceType, ResourceTypeString } from/g' src/utils/resources/ResourceTypeMigration.ts
    echo "Added ResourceTypeString import to ResourceTypeMigration.ts"
  fi

  echo "Fixing files that use ResourceTypeMigration..."
  grep -l "ResourceTypeMigration" $(find src -name "*.tsx" -o -name "*.ts") | while read -r file; do
    if grep -q "ensureStringResourceType" "$file"; then
      echo "File $file already imports ensureStringResourceType"
    else
      if grep -q "ensureStringResourceType" "$file"; then
        sed -i '' '/import.*ResourceTypeMigration/s/$/\, ensureStringResourceType/' "$file"
        echo "Added ensureStringResourceType import to $file"
      fi
    fi
    
    if grep -q "isEnumResourceType" "$file"; then
      echo "File $file already imports isEnumResourceType"
    else
      if grep -q "isEnumResourceType" "$file"; then
        sed -i '' '/import.*ResourceTypeMigration/s/$/\, isEnumResourceType/' "$file"
        echo "Added isEnumResourceType import to $file"
      fi
    fi
  done

  echo "Fixing ResourceDiscoverySystem.tsx..."
  sed -i '' '/import.*ensureStringResourceType.*from.*ResourceTypeMigration/!b;n;/import.*ensureStringResourceType.*from.*ResourceTypeMigration/d' src/components/exploration/ResourceDiscoverySystem.tsx

  echo "Fixing ResourceMappingVisualization.tsx..."
  if [ -f "src/components/visualization/ResourceMappingVisualization.tsx" ]; then
    if ! grep -q "import { ensureStringResourceType, isEnumResourceType } from" "src/components/visualization/ResourceMappingVisualization.tsx"; then
      sed -i '' '/import.*ResourceTypeConverter/a\\
import { ensureStringResourceType, isEnumResourceType } from "../../utils/resources/ResourceTypeMigration";' "src/components/visualization/ResourceMappingVisualization.tsx"
      echo "Added ResourceTypeMigration imports to ResourceMappingVisualization.tsx"
    fi
    
    sed -i '' 's/ResourceTypeConverter\.ensureStringResourceType/ensureStringResourceType/g' "src/components/visualization/ResourceMappingVisualization.tsx"
    sed -i '' 's/ResourceTypeConverter\.isEnumResourceType/isEnumResourceType/g' "src/components/visualization/ResourceMappingVisualization.tsx"
    echo "Updated ResourceTypeConverter calls in ResourceMappingVisualization.tsx"
  fi

  echo "Running TypeScript compiler to check for errors..."
  npx tsc --noEmit

  echo "Resource type fixes completed!"
}

# Section 15: Fix ResourceVisualization component
fix_resource_visualization() {
  echo "Fixing ResourceVisualization component..."
  resource_type_path="src/types/resources/ResourceTypes.ts"
  if [ ! -f "$resource_type_path" ]; then
    echo "Error: ResourceTypes.ts not found at $resource_type_path!"
    exit 1
  fi

  resource_viz_file=$(find src -name "ResourceVisualization.tsx" | head -n 1)
  if [ -z "$resource_viz_file" ]; then
    echo "Error: ResourceVisualization.tsx not found!"
    exit 1
  fi

  echo "Found ResourceVisualization at: $resource_viz_file"
  sed -i '' 's/resourceType: string/resourceType: ResourceType/g' "$resource_viz_file"
  find src -name "*.tsx" | while read -r file; do
    if grep -q "<ResourceVisualization\s*/>" "$file" || grep -q "<ResourceVisualization\s*>" "$file"; then
      echo "Fixing ResourceVisualization usage in $file"
      sed -i '' 's/<ResourceVisualization\s*\/>/<ResourceVisualization resourceType={ResourceType.MINERALS} amount={0} \/>/g' "$file"
      sed -i '' 's/<ResourceVisualization\s*>/<ResourceVisualization resourceType={ResourceType.MINERALS} amount={0}>/g' "$file"
    fi
  done

  if ! grep -q "import.*ResourceType.*from" "$resource_viz_file"; then
    echo "Adding ResourceType import to $resource_viz_file"
    file_dir=$(dirname "$resource_viz_file" | sed 's/^src\///')
    resource_type_import_path=$(echo "$resource_type_path" | sed 's/^src\///' | sed 's/\.ts$//')
    resource_type_rel_path=$(node -e "console.log(require('path').relative('$file_dir', '$resource_type_import_path').replace(/\\\\/g, '/') || '.')")
    if [[ "$resource_type_rel_path" != /* ]]; then
      if [[ "$resource_type_rel_path" != ./* ]]; then
        resource_type_rel_path="./$resource_type_rel_path"
      fi
    fi
    sed -i '' "1s|^|import { ResourceType } from \"$resource_type_rel_path\";\n|" "$resource_viz_file"
  fi

  echo "ResourceVisualization component fixes completed."
}

# Section 16: Update component props to use ResourceType enum
update_component_props() {
  echo "Updating component props to use ResourceType enum..."
  resource_type_path="./src/types/resources/ResourceTypes.ts"
  if [ ! -f "$resource_type_path" ]; then
    echo "Error: ResourceTypes.ts not found at $resource_type_path!"
    exit 1
  fi

  find ./src -name "*.tsx" -o -name "*.ts" | xargs grep -l "resourceType: string" | while read -r file; do
    echo "Updating $file"
    sed -i '' 's/resourceType: string/resourceType: ResourceType/g' "$file"
    if ! grep -q "import { ResourceType } from " "$file"; then
      file_dir=$(dirname "$file" | sed 's/^\.\/src\///')
      resource_type_import_path=$(echo "$resource_type_path" | sed 's/^\.\/src\///' | sed 's/\.ts$//')
      resource_type_rel_path=$(node -e "console.log(require('path').relative('$file_dir', '$resource_type_import_path').replace(/\\\\/g, '/') || '.')")
      if [[ "$resource_type_rel_path" != /* ]]; then
        if [[ "$resource_type_rel_path" != ./* ]]; then
          resource_type_rel_path="./$resource_type_rel_path"
        fi
      fi
      echo "Adding ResourceType import to $file"
      sed -i '' "1s/^/import { ResourceType } from \"$resource_type_rel_path\";\n/" "$file"
    fi
  done

  echo "Component props update completed. Please run the TypeScript compiler to verify the changes."
}

# Section 17: Update resource managers to use the ResourceType enum
update_resource_managers() {
  echo "Updating resource managers to use the ResourceType enum..."
  RESOURCE_MANAGERS=(
    "src/managers/resource/ResourceFlowManager.ts"
    "src/managers/resource/ResourceStorageManager.ts"
    "src/managers/resource/ResourceTransferManager.tsx"
  )

  for FILE in "${RESOURCE_MANAGERS[@]}"; do
    echo "Processing $FILE..."
    if [ ! -f "$FILE" ]; then
      echo "  File not found, skipping."
      continue
    fi

    if grep -q "import.*ResourceTypeConverter" "$FILE"; then
      echo "  Already imports ResourceTypeConverter, skipping import addition."
    else
      FIRST_IMPORT_LINE=$(grep -n "^import " "$FILE" | head -1 | cut -d: -f1)
      if [ -n "$FIRST_IMPORT_LINE" ]; then
        sed -i '' "${FIRST_IMPORT_LINE}a\\
import { ensureEnumResourceType, toEnumResourceType, migrateObjectKeys, migrateArrayResourceTypes } from '../../utils/ResourceTypeConverter';" "$FILE"
        echo "  Added ResourceTypeConverter import after line $FIRST_IMPORT_LINE"
      else
        sed -i '' "1i\\
import { ensureEnumResourceType, toEnumResourceType, migrateObjectKeys, migrateArrayResourceTypes } from '../../utils/ResourceTypeConverter';" "$FILE"
        echo "  Added ResourceTypeConverter import at the beginning of the file"
      fi
    fi

    if grep -q "import.*ResourceType.*from '.*ResourceTypes'" "$FILE"; then
      echo "  Already imports ResourceType, skipping import addition."
    else
      FIRST_IMPORT_LINE=$(grep -n "^import " "$FILE" | head -1 | cut -d: -f1)
      if [ -n "$FIRST_IMPORT_LINE" ]; then
        sed -i '' "${FIRST_IMPORT_LINE}a\\
import { ResourceType } from '../../types/resources/ResourceTypes';" "$FILE"
        echo "  Added ResourceType import after line $FIRST_IMPORT_LINE"
      else
        sed -i '' "1i\\
import { ResourceType } from '../../types/resources/ResourceTypes';" "$FILE"
        echo "  Added ResourceType import at the beginning of the file"
      fi
    fi

    sed -i '' 's/resourceType: string/resourceType: ResourceType | string/g' "$FILE"
    sed -i '' '/resourceType: ResourceType | string/ {
    n
    s/^  {/  {\
    resourceType = ensureEnumResourceType(resourceType);/
  }' "$FILE"
    sed -i '' 's/resources\[resourceType\]/resources[resourceType as ResourceType]/g' "$FILE"
    sed -i '' 's/this\.resources\[resourceType\]/this.resources[resourceType as ResourceType]/g' "$FILE"
    sed -i '' "s/'minerals'/ResourceType.MINERALS/g" "$FILE"
    sed -i '' "s/'energy'/ResourceType.ENERGY/g" "$FILE"
    sed -i '' "s/'population'/ResourceType.POPULATION/g" "$FILE"
    sed -i '' "s/'research'/ResourceType.RESEARCH/g" "$FILE"
    sed -i '' "s/'plasma'/ResourceType.PLASMA/g" "$FILE"
    sed -i '' "s/'gas'/ResourceType.GAS/g" "$FILE"
    sed -i '' "s/'exotic'/ResourceType.EXOTIC/g" "$FILE"
    echo "  Updated $FILE to use ResourceType enum"
  done

  echo "Resource manager updates complete. Please run the TypeScript compiler to verify fixes."
}

# Section 18: Update resource type references to use enum values
update_resource_type_references() {
  echo "Updating resource type references to use enum values..."
  resource_types=("minerals:MINERALS" "energy:ENERGY" "research:RESEARCH" "population:POPULATION" "food:FOOD" "water:WATER" "gas:GAS" "exotic:EXOTIC" "organic:ORGANIC")
  resource_type_path="./src/types/resources/ResourceTypes.ts"
  if [ ! -f "$resource_type_path" ]; then
    echo "Error: ResourceTypes.ts not found at $resource_type_path!"
    exit 1
  fi

  find ./src -name "*.ts" -o -name "*.tsx" | while read -r file; do
    echo "Processing $file..."
    if [[ "$file" == "$resource_type_path" || "$file" == *"ResourceTypeConverter.ts"* ]]; then
      echo "  Skipping enum definition file: $file"
      continue
    fi

    if grep -q "ResourceType" "$file" || grep -q "resourceType" "$file"; then
      echo "  File uses ResourceType: $file"
      file_dir=$(dirname "$file" | sed 's/^\.\/src\///')
      resource_type_import_path=$(echo "$resource_type_path" | sed 's/^\.\/src\///' | sed 's/\.ts$//')
      resource_type_rel_path=$(node -e "console.log(require('path').relative('$file_dir', '$resource_type_import_path').replace(/\\\\/g, '/') || '.')")
      if [[ "$resource_type_rel_path" != /* ]]; then
        if [[ "$resource_type_rel_path" != ./* ]]; then
          resource_type_rel_path="./$resource_type_rel_path"
        fi
      fi

      if ! grep -q "import.*ResourceType.*from" "$file"; then
        echo "  Adding ResourceType import to $file"
        sed -i '' "1s|^|import { ResourceType } from \"$resource_type_rel_path\";\n|" "$file"
      fi

      for resource_type in "${resource_types[@]}"; do
        key="${resource_type%%:*}"
        value="${resource_type##*:}"
        sed -i '' "s/\([^a-zA-Z0-9_]\)$key:/\1$value:/g" "$file"
        sed -i '' "s/\['$key'\]/[ResourceType.$value]/g" "$file"
        sed -i '' "s/\[\"$key\"\]/[ResourceType.$value]/g" "$file"
        sed -i '' "s/resourceType === '$key'/resourceType === ResourceType.$value/g" "$file"
        sed -i '' "s/resourceType === \"$key\"/resourceType === ResourceType.$value/g" "$file"
        sed -i '' "s/: '$key'/: ResourceType.$value/g" "$file"
        sed -i '' "s/: \"$key\"/: ResourceType.$value/g" "$file"
      done

      sed -i '' "s/\(stringToResourceType\|resourceTypeToString\)('\([^']*\)')/\1(\"\2\")/g" "$file"
    fi
  done

  echo "Resource type reference updates completed. Please run the TypeScript compiler to verify the changes."
}

# Section 19: Comprehensive update process (calls other scripts)
comprehensive_update_process() {
  echo "Starting comprehensive resource type update process..."
  cd ..
  chmod +x scripts/update_resource_type_references.sh
  chmod +x scripts/update_component_props.sh
  chmod +x scripts/fix_resource_type_imports.sh
  chmod +x scripts/fix_resource_visualization.sh
  chmod +x scripts/fix_resource_type_strings.sh
  chmod +x scripts/fix_object_literals.sh
  chmod +x scripts/fix_specific_files.sh
  chmod +x scripts/fix_resource_type_migration.sh

  echo "Step 1: Updating resource type references..."
  scripts/update_resource_type_references.sh

  echo "Step 2: Updating component props..."
  scripts/update_component_props.sh

  echo "Step 3: Fixing import paths..."
  scripts/fix_resource_type_imports.sh

  echo "Step 4: Fixing ResourceVisualization component..."
  scripts/fix_resource_visualization.sh

  echo "Step 5: Fixing string to ResourceType enum conversion..."
  scripts/fix_resource_type_strings.sh

  echo "Step 6: Fixing object literals with string resourceType..."
  scripts/fix_object_literals.sh

  echo "Step 7: Fixing specific files with remaining issues..."
  scripts/fix_specific_files.sh

  echo "Step 8: Fixing ResourceTypeMigration.ts and updating references..."
  scripts/fix_resource_type_migration.sh

  echo "Step 9: Running TypeScript compiler to check for errors..."
  npx tsc --noEmit | grep -c "error TS" || echo "0"

  echo "Resource type update process completed."
  echo "Please review the changes and fix any remaining TypeScript errors manually."
}

# Section 20: Update UI components to use the ResourceType enum
update_ui_components() {
  echo "Updating UI components to use the ResourceType enum..."
  UI_COMPONENTS=(
    "src/components/ui/ResourceVisualization.tsx"
    "src/components/ui/ResourceVisualizationEnhanced.tsx"
    "src/components/ui/resource/ResourceFlowDiagram.tsx"
    "src/components/exploration/ResourceDiscoveryDemo.tsx"
    "src/components/exploration/visualizations/AnalysisVisualization.tsx"
  )

  for FILE in "${UI_COMPONENTS[@]}"; do
    echo "Processing $FILE..."
    if [ ! -f "$FILE" ]; then
      echo "  File not found, skipping."
      continue
    fi
    
    if grep -q "import.*ResourceTypeConverter" "$FILE"; then
      echo "  Already imports ResourceTypeConverter, skipping import addition."
    else
      FIRST_IMPORT_LINE=$(grep -n "^import " "$FILE" | head -1 | cut -d: -f1)
      if [ -n "$FIRST_IMPORT_LINE" ]; then
        sed -i '' "${FIRST_IMPORT_LINE}a\\
import { ensureEnumResourceType, toEnumResourceType } from '../../../utils/ResourceTypeConverter';" "$FILE"
        echo "  Added ResourceTypeConverter import after line $FIRST_IMPORT_LINE"
      else
        sed -i '' "1i\\
import { ensureEnumResourceType, toEnumResourceType } from '../../../utils/ResourceTypeConverter';" "$FILE"
        echo "  Added ResourceTypeConverter import at the beginning of the file"
      fi
    fi
    
    if grep -q "import.*ResourceType.*from '.*ResourceTypes'" "$FILE"; then
      echo "  Already imports ResourceType, skipping import addition."
    else
      FIRST_IMPORT_LINE=$(grep -n "^import " "$FILE" | head -1 | cut -d: -f1)
      if [ -n "$FIRST_IMPORT_LINE" ]; then
        sed -i '' "${FIRST_IMPORT_LINE}a\\
import { ResourceType } from '../../../types/resources/ResourceTypes';" "$FILE"
        echo "  Added ResourceType import after line $FIRST_IMPORT_LINE"
      else
        sed -i '' "1i\\
import { ResourceType } from '../../../types/resources/ResourceTypes';" "$FILE"
        echo "  Added ResourceType import at the beginning of the file"
      fi
    fi
    
    DEPTH=$(echo "$FILE" | tr -cd '/' | wc -c)
    if [ "$DEPTH" -eq 2 ]; then
      sed -i '' 's|from "../../../utils/ResourceTypeConverter"|from "../../utils/ResourceTypeConverter"|g' "$FILE"
      sed -i '' 's|from "../../../types/resources/ResourceTypes"|from "../../types/resources/ResourceTypes"|g' "$FILE"
    elif [ "$DEPTH" -eq 3 ]; then
      :
    elif [ "$DEPTH" -eq 4 ]; then
      sed -i '' 's|from "../../../utils/ResourceTypeConverter"|from "../../../../utils/ResourceTypeConverter"|g' "$FILE"
      sed -i '' 's|from "../../../types/resources/ResourceTypes"|from "../../../../types/resources/ResourceTypes"|g' "$FILE"
    fi
    
    sed -i '' 's/resourceType: string/resourceType: ResourceType | string/g' "$FILE"
    sed -i '' 's/type: string/type: ResourceType | string/g' "$FILE"
    sed -i '' '/resourceType: ResourceType | string/ {
    n
    s/^  {/  {\
    resourceType = ensureEnumResourceType(resourceType);/
  }' "$FILE"
    sed -i '' '/type: ResourceType | string/ {
    n
    s/^  {/  {\
    type = ensureEnumResourceType(type);/
  }' "$FILE"
    sed -i '' "s/'minerals'/ResourceType.MINERALS/g" "$FILE"
    sed -i '' "s/'energy'/ResourceType.ENERGY/g" "$FILE"
    sed -i '' "s/'population'/ResourceType.POPULATION/g" "$FILE"
    sed -i '' "s/'research'/ResourceType.RESEARCH/g" "$FILE"
    sed -i '' "s/'plasma'/ResourceType.PLASMA/g" "$FILE"
    sed -i '' "s/'gas'/ResourceType.GAS/g" "$FILE"
    sed -i '' "s/'exotic'/ResourceType.EXOTIC/g" "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .minerals.:/case ResourceType.MINERALS:/g' "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .energy.:/case ResourceType.ENERGY:/g' "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .population.:/case ResourceType.POPULATION:/g' "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .research.:/case ResourceType.RESEARCH:/g' "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .plasma.:/case ResourceType.PLASMA:/g' "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .gas.:/case ResourceType.GAS:/g' "$FILE"
    sed -i '' '/switch.*resourceType/,/}/ s/case .exotic.:/case ResourceType.EXOTIC:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .minerals.:/case ResourceType.MINERALS:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .energy.:/case ResourceType.ENERGY:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .population.:/case ResourceType.POPULATION:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .research.:/case ResourceType.RESEARCH:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .plasma.:/case ResourceType.PLASMA:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .gas.:/case ResourceType.GAS:/g' "$FILE"
    sed -i '' '/switch.*type/,/}/ s/case .exotic.:/case ResourceType.EXOTIC:/g' "$FILE"
    echo "  Updated $FILE to use ResourceType enum"
  done

  echo "UI component updates complete. Please run the TypeScript compiler to verify fixes."
}

###############################################################################
# Main Execution
###############################################################################
fix_specific_files_resourceType
add_ResourceType_imports
fix_duplicate_react_imports
fix_import_syntax_extra_semicolons
fix_import_statements
update_standardized_imports
fix_jsx_configuration
fix_object_literals_resourceType
update_react_namespace_import
fix_remaining_import_syntax_errors
fix_import_paths_resourceType_converter
fix_resource_type_migration
fix_string_resourceType_usage
comprehensive_resource_types
fix_resource_visualization
update_component_props
update_resource_managers
update_resource_type_references
comprehensive_update_process
update_ui_components
