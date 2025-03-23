#!/usr/bin/env python3
"""
Fix unused variables script for Galactic_Sprawl project.
Parses the ESLint report and generates implementation-ready fixes.
"""
import json
import os
import sys
from collections import defaultdict

# Configuration
REPORT_PATH = '/Users/deadcoast/CursorProjects/Galactic_Sprawl/fresh-eslint-report.json'
PROJECT_ROOT = '/Users/deadcoast/CursorProjects/Galactic_Sprawl/'
OUTPUT_DIR = '/Users/deadcoast/fixes/'

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

def read_eslint_report(file_path):
    """Read and parse the ESLint JSON report."""
    with open(file_path, 'r') as f:
        return json.load(f)

def get_relative_path(path):
    """Convert absolute path to project-relative path."""
    return path.replace(PROJECT_ROOT, '')

def categorize_unused_vars(report):
    """Extract and categorize unused variables from the ESLint report."""
    by_module = defaultdict(list)
    by_type = defaultdict(list)
    by_file = defaultdict(list)
    
    # Extract relevant data
    for file_report in report:
        abs_path = file_report["filePath"]
        rel_path = get_relative_path(abs_path)
        
        # Extract module name (first directory in path)
        parts = rel_path.split('/')
        module = parts[0] if parts else 'misc'
        if module == 'src' and len(parts) > 1:
            module = parts[1]
        
        # Find all unused variable messages
        for msg in file_report.get("messages", []):
            if msg.get("ruleId") == "@typescript-eslint/no-unused-vars":
                # Extract variable name from the message
                var_name = None
                message = msg.get("message", "")
                if "'" in message:
                    var_name = message.split("'")[1]
                
                # Determine type of issue
                var_type = "unknown"
                if "is defined but never used" in message:
                    var_type = "defined"
                elif "is assigned a value but never used" in message:
                    var_type = "assigned"
                
                # Add to collections
                issue = {
                    "file": rel_path,
                    "line": msg.get("line"),
                    "column": msg.get("column"),
                    "name": var_name,
                    "message": message,
                    "type": var_type
                }
                
                by_module[module].append(issue)
                by_type[var_type].append(issue)
                by_file[rel_path].append(issue)
    
    return {
        "by_module": by_module,
        "by_type": by_type,
        "by_file": by_file,
        "total": sum(len(issues) for issues in by_file.values())
    }

def generate_todo_list(categorized_data):
    """Generate a prioritized TODO markdown file."""
    todo_content = "# Unused Variables Fix Plan\n\n"
    todo_content += f"**Total unused variables: {categorized_data['total']}**\n\n"
    
    # Add module statistics
    todo_content += "## By Module\n\n"
    sorted_modules = sorted(categorized_data["by_module"].items(), 
                           key=lambda x: len(x[1]), reverse=True)
    
    for module, issues in sorted_modules:
        todo_content += f"- {module}: {len(issues)}\n"
    
    # Add type statistics
    todo_content += "\n## By Type\n\n"
    for type_name, issues in categorized_data["by_type"].items():
        todo_content += f"- {type_name}: {len(issues)}\n"
        
    # Add top 10 files
    todo_content += "\n## Top 10 Files to Fix\n\n"
    sorted_files = sorted(categorized_data["by_file"].items(), 
                         key=lambda x: len(x[1]), reverse=True)[:10]
    
    for file_path, issues in sorted_files:
        todo_content += f"- {file_path}: {len(issues)} variables\n"
    
    return todo_content

def generate_module_fixes(module_name, issues, categorized_data):
    """Generate implementation plan for a specific module."""
    content = f"# Unused Variables in '{module_name}' Module\n\n"
    
    # Group by file
    files = defaultdict(list)
    for issue in issues:
        files[issue["file"]].append(issue)
    
    # Sort files by number of issues
    sorted_files = sorted(files.items(), key=lambda x: len(x[1]), reverse=True)
    
    # Add implementation suggestions
    for file_path, file_issues in sorted_files:
        content += f"## {file_path}\n\n"
        content += f"Total unused variables: {len(file_issues)}\n\n"
        
        for issue in file_issues:
            var_name = issue["name"]
            line = issue["line"]
            line_info = f"Line {line}"
            var_type = issue["type"]
            
            # Suggest implementation approach based on type and naming
            if var_name.startswith('_'):
                content += f"- `{var_name}` ({line_info}): Already prefixed with underscore, consider using in code or removing\n"
            elif var_type == "defined":
                content += f"- `{var_name}` ({line_info}): Parameter defined but unused, prefix with underscore or remove\n"
            elif var_type == "assigned":
                content += f"- `{var_name}` ({line_info}): Variable assigned but unused, implement usage or prefix with underscore\n"
            else:
                content += f"- `{var_name}` ({line_info}): {issue['message']}\n"
                
        content += "\n"
    
    return content

def main():
    """Main entry point for the script."""
    try:
        # Read and process report
        report = read_eslint_report(REPORT_PATH)
        categorized = categorize_unused_vars(report)
        
        # Generate main TODO list
        todo_content = generate_todo_list(categorized)
        with open(os.path.join(OUTPUT_DIR, "unused_vars_todo.md"), 'w') as f:
            f.write(todo_content)
        
        # Generate module-specific plans
        for module, issues in categorized["by_module"].items():
            module_content = generate_module_fixes(module, issues, categorized)
            module_file = f"fix_{module.replace('/', '_')}.md"
            with open(os.path.join(OUTPUT_DIR, module_file), 'w') as f:
                f.write(module_content)
        
        # Generate fix-all script
        fix_script = """#!/bin/bash
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
modules=( $(ls $FIXES_DIR | grep "^fix_" | sed 's/fix_\\(.*\\)\\.md/\\1/') )

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
"""
        with open(os.path.join(OUTPUT_DIR, "fix_unused_vars.sh"), 'w') as f:
            f.write(fix_script)
        os.chmod(os.path.join(OUTPUT_DIR, "fix_unused_vars.sh"), 0o755)
        
        print(f"Generated fix plans in {OUTPUT_DIR}")
        print(f"Total unused variables: {categorized['total']}")
        print("Run ./fix_unused_vars.sh to see available modules")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
