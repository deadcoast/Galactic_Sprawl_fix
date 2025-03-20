#!/bin/bash

# analyze_error_patterns.sh
#
# Purpose: Analyze TypeScript error patterns and generate statistics
# on the most frequent types of errors. Features:
#   1. Identify common error patterns
#   2. Generate statistics on most frequent error types
#   3. Provide recommendations for which fixes to run first
#   4. Generate visualizations of error distribution
#
# Usage: ./analyze_error_patterns.sh [options]
#
# Options:
#   --target=<path>       Target file or directory (default: src/)
#   --output=<path>       Output directory for reports (default: ../Analysis/Combined/)
#   --format=<format>     Output format (text|json|html) (default: text)
#   --visualization       Generate visualization charts (requires gnuplot)
#
# Created: Based on Future_Advancements.md tasklist

# Set strict mode
set -euo pipefail

# Default values
TARGET="src/"
OUTPUT_DIR="../Analysis/Combined"
FORMAT="text"
VISUALIZATION=false

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --target=*)
      TARGET="${arg#*=}"
      ;;
    --output=*)
      OUTPUT_DIR="${arg#*=}"
      ;;
    --format=*)
      FORMAT="${arg#*=}"
      ;;
    --visualization)
      VISUALIZATION=true
      ;;
    --help)
      echo "Usage: ./analyze_error_patterns.sh [options]"
      echo ""
      echo "Options:"
      echo "  --target=<path>       Target file or directory (default: src/)"
      echo "  --output=<path>       Output directory for reports (default: ../Analysis/Combined/)"
      echo "  --format=<format>     Output format (text|json|html) (default: text)"
      echo "  --visualization       Generate visualization charts (requires gnuplot)"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Use --help for usage information."
      exit 1
      ;;
  esac
done

# Make sure the target exists
if [ ! -e "$TARGET" ]; then
  echo "Error: Target not found: $TARGET"
  exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Create a timestamp for the report
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$OUTPUT_DIR/error_analysis_$TIMESTAMP"

echo "=== Error Pattern Analysis ==="
echo "Target:     $TARGET"
echo "Output:     $OUTPUT_DIR"
echo "Format:     $FORMAT"

# Function to run TypeScript compiler for error checking
run_typescript_check() {
  echo "Running TypeScript compiler to collect errors..."
  
  # Create a temporary directory for the output
  local temp_file=$(mktemp)
  
  # Run TypeScript compiler with noEmit to just check for errors
  if [ -d "$TARGET" ]; then
    # Use find to locate all TypeScript files
    find "$TARGET" -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 tsc --noEmit --skipLibCheck 2> "$temp_file" || true
  else
    # Process a single file
    tsc --noEmit --skipLibCheck "$TARGET" 2> "$temp_file" || true
  fi
  
  # Return the path to the temporary file with errors
  echo "$temp_file"
}

# Function to analyze error patterns
analyze_errors() {
  local error_file="$1"
  
  echo "Analyzing error patterns..."
  
  # Count total errors
  local total_errors=$(grep -c "error TS" "$error_file" || echo "0")
  echo "Total errors found: $total_errors"
  
  # Extract and count error types
  declare -A error_counts
  declare -A error_descriptions
  
  # If no errors found, exit early
  if [ "$total_errors" -eq 0 ]; then
    echo "No errors found. Nothing to analyze."
    return
  fi
  
  # Process each error line
  while IFS= read -r line; do
    # Extract error code
    local error_code=$(echo "$line" | grep -oE "TS[0-9]+" | head -1)
    
    if [ -n "$error_code" ]; then
      # Extract error description
      local error_desc=$(echo "$line" | sed -E 's/.*error [^ ]+ //g' | cut -d':' -f1)
      
      # Count this error type
      if [ -n "${error_counts[$error_code]:-}" ]; then
        error_counts["$error_code"]=$((error_counts["$error_code"] + 1))
      else
        error_counts["$error_code"]=1
        error_descriptions["$error_code"]="$error_desc"
      fi
    fi
  done < <(grep "error TS" "$error_file")
  
  # Group error codes by categories
  declare -A category_counts
  
  # Initialize categories
  category_counts["ResourceType"]=0
  category_counts["TypeSafety"]=0
  category_counts["NullSafety"]=0
  category_counts["UnusedVars"]=0
  category_counts["Other"]=0
  
  # Process each error code and assign to category
  for error_code in "${!error_counts[@]}"; do
    local count=${error_counts["$error_code"]}
    local desc=${error_descriptions["$error_code"]}
    
    # Categorize by examining the error description
    if [[ "$desc" == *"ResourceType"* ]] || [[ "$desc" == *"resource type"* ]]; then
      category_counts["ResourceType"]=$((category_counts["ResourceType"] + count))
    elif [[ "$desc" == *"null"* ]] || [[ "$desc" == *"undefined"* ]]; then
      category_counts["NullSafety"]=$((category_counts["NullSafety"] + count))
    elif [[ "$desc" == *"any"* ]] || [[ "$desc" == *"type"* ]]; then
      category_counts["TypeSafety"]=$((category_counts["TypeSafety"] + count))
    elif [[ "$desc" == *"unused"* ]] || [[ "$desc" == *"never used"* ]]; then
      category_counts["UnusedVars"]=$((category_counts["UnusedVars"] + count))
    else
      category_counts["Other"]=$((category_counts["Other"] + count))
    fi
  done
  
  # Generate output based on format
  case "$FORMAT" in
    "text")
      # Text format report
      {
        echo "=== Error Analysis Report ==="
        echo "Date: $(date)"
        echo "Target: $TARGET"
        echo "Total errors: $total_errors"
        echo ""
        echo "=== Error Categories ==="
        
        # Sort categories by count
        for category in $(
          for cat in "${!category_counts[@]}"; do
            echo "$cat ${category_counts[$cat]}"
          done | sort -rn -k2 | cut -d' ' -f1
        ); do
          local count=${category_counts["$category"]}
          local percentage=$((count * 100 / total_errors))
          echo "- $category: $count errors ($percentage%)"
        done
        
        echo ""
        echo "=== Top Error Codes ==="
        
        # Sort error codes by count
        local i=0
        for error_code in $(
          for code in "${!error_counts[@]}"; do
            echo "$code ${error_counts[$code]}"
          done | sort -rn -k2 | cut -d' ' -f1
        ); do
          i=$((i + 1))
          if [ $i -le 10 ]; then  # Show top 10
            local count=${error_counts["$error_code"]}
            local desc=${error_descriptions["$error_code"]}
            local percentage=$((count * 100 / total_errors))
            echo "- $error_code ($count, $percentage%): $desc"
          fi
        done
        
        echo ""
        echo "=== Recommended Fix Strategy ==="
        
        # Determine which fix to run first based on error counts
        local highest_category=""
        local highest_count=0
        
        for category in "ResourceType" "TypeSafety" "NullSafety"; do
          if [ "${category_counts[$category]:-0}" -gt "$highest_count" ]; then
            highest_count=${category_counts[$category]}
            highest_category=$category
          fi
        done
        
        # Map category to fix script
        case "$highest_category" in
          "ResourceType")
            echo "1. Run fix_resource_types_advanced.sh first (addresses ${category_counts["ResourceType"]} errors)"
            ;;
          "TypeSafety")
            echo "1. Run fix_type_safety.sh first (addresses ${category_counts["TypeSafety"]} errors)"
            ;;
          "NullSafety")
            echo "1. Run fix_null_safety.sh first (addresses ${category_counts["NullSafety"]} errors)"
            ;;
          *)
            echo "1. No clear recommendation based on error patterns"
            ;;
        esac
        
        # Add advice on what to run second
        for category in "ResourceType" "TypeSafety" "NullSafety"; do
          if [ "$category" != "$highest_category" ]; then
            # Find the second highest
            if [ "${category_counts[$category]:-0}" -gt "${category_counts["second"]:-0}" ]; then
              second_category="$category"
            fi
          fi
        done
        
        # Map category to fix script
        case "${second_category:-}" in
          "ResourceType")
            echo "2. Then run fix_resource_types_advanced.sh (addresses ${category_counts["ResourceType"]} errors)"
            ;;
          "TypeSafety")
            echo "2. Then run fix_type_safety.sh (addresses ${category_counts["TypeSafety"]} errors)"
            ;;
          "NullSafety")
            echo "2. Then run fix_null_safety.sh (addresses ${category_counts["NullSafety"]} errors)"
            ;;
        esac
        
        echo ""
        echo "=== Detailed Error List ==="
        
        # List the top 20 error files by frequency
        echo "Top 20 files with most errors:"
        grep "error TS" "$error_file" | grep -oE "[^:]+:[0-9]+" | sort | uniq -c | sort -rn | head -20
        
      } > "${REPORT_FILE}.txt"
      
      echo "Text report generated: ${REPORT_FILE}.txt"
      ;;
      
    "json")
      # JSON format report
      {
        echo "{"
        echo "  \"report\": {"
        echo "    \"date\": \"$(date)\","
        echo "    \"target\": \"$TARGET\","
        echo "    \"total_errors\": $total_errors,"
        echo "    \"categories\": ["
        
        # Categories
        local first_category=true
        for category in "${!category_counts[@]}"; do
          if [ "$first_category" = true ]; then
            first_category=false
          else
            echo ","
          fi
          
          local count=${category_counts["$category"]}
          local percentage=$((count * 100 / total_errors))
          echo "      {"
          echo "        \"name\": \"$category\","
          echo "        \"count\": $count,"
          echo "        \"percentage\": $percentage"
          echo -n "      }"
        done
        echo ""
        echo "    ],"
        
        # Top errors
        echo "    \"top_errors\": ["
        local first_error=true
        for error_code in $(
          for code in "${!error_counts[@]}"; do
            echo "$code ${error_counts[$code]}"
          done | sort -rn -k2 | cut -d' ' -f1 | head -10
        ); do
          if [ "$first_error" = true ]; then
            first_error=false
          else
            echo ","
          fi
          
          local count=${error_counts["$error_code"]}
          local desc=${error_descriptions["$error_code"]}
          local percentage=$((count * 100 / total_errors))
          echo "      {"
          echo "        \"code\": \"$error_code\","
          echo "        \"description\": \"${desc//\"/\\\"}\","
          echo "        \"count\": $count,"
          echo "        \"percentage\": $percentage"
          echo -n "      }"
        done
        echo ""
        echo "    ]"
        echo "  }"
        echo "}"
      } > "${REPORT_FILE}.json"
      
      echo "JSON report generated: ${REPORT_FILE}.json"
      ;;
      
    "html")
      # HTML format report
      {
        echo "<!DOCTYPE html>"
        echo "<html>"
        echo "<head>"
        echo "  <title>Error Analysis Report</title>"
        echo "  <style>"
        echo "    body { font-family: Arial, sans-serif; margin: 40px; }"
        echo "    h1 { color: #333; }"
        echo "    .chart { margin: 20px 0; width: 600px; height: 300px; }"
        echo "    .category { margin-bottom: 10px; }"
        echo "    .bar { background-color: #4285f4; height: 20px; }"
        echo "    .label { display: inline-block; width: 150px; }"
        echo "    .count { display: inline-block; width: 80px; text-align: right; }"
        echo "    .error-code { font-family: monospace; }"
        echo "  </style>"
        echo "</head>"
        echo "<body>"
        echo "  <h1>Error Analysis Report</h1>"
        echo "  <p><strong>Date:</strong> $(date)</p>"
        echo "  <p><strong>Target:</strong> $TARGET</p>"
        echo "  <p><strong>Total errors:</strong> $total_errors</p>"
        
        echo "  <h2>Error Categories</h2>"
        echo "  <div class=\"chart\">"
        
        # Sort categories by count
        for category in $(
          for cat in "${!category_counts[@]}"; do
            echo "$cat ${category_counts[$cat]}"
          done | sort -rn -k2 | cut -d' ' -f1
        ); do
          local count=${category_counts["$category"]}
          local percentage=$((count * 100 / total_errors))
          local bar_width=$percentage
          
          echo "    <div class=\"category\">"
          echo "      <span class=\"label\">$category</span>"
          echo "      <span class=\"count\">$count</span>"
          echo "      <div class=\"bar\" style=\"width: ${bar_width}%;\"></div>"
          echo "      <span>$percentage%</span>"
          echo "    </div>"
        done
        
        echo "  </div>"
        
        echo "  <h2>Top Error Codes</h2>"
        echo "  <table border=\"1\" cellpadding=\"5\" cellspacing=\"0\">"
        echo "    <tr><th>Error Code</th><th>Count</th><th>Percentage</th><th>Description</th></tr>"
        
        # List top 10 error codes
        for error_code in $(
          for code in "${!error_counts[@]}"; do
            echo "$code ${error_counts[$code]}"
          done | sort -rn -k2 | cut -d' ' -f1 | head -10
        ); do
          local count=${error_counts["$error_code"]}
          local desc=${error_descriptions["$error_code"]}
          local percentage=$((count * 100 / total_errors))
          
          echo "    <tr>"
          echo "      <td class=\"error-code\">$error_code</td>"
          echo "      <td align=\"right\">$count</td>"
          echo "      <td align=\"right\">$percentage%</td>"
          echo "      <td>$desc</td>"
          echo "    </tr>"
        done
        
        echo "  </table>"
        
        echo "  <h2>Recommended Fix Strategy</h2>"
        echo "  <ol>"
        
        # Determine which fix to run first based on error counts
        local highest_category=""
        local highest_count=0
        
        for category in "ResourceType" "TypeSafety" "NullSafety"; do
          if [ "${category_counts[$category]:-0}" -gt "$highest_count" ]; then
            highest_count=${category_counts[$category]}
            highest_category=$category
          fi
        done
        
        # Map category to fix script
        case "$highest_category" in
          "ResourceType")
            echo "    <li>Run <code>fix_resource_types_advanced.sh</code> first (addresses ${category_counts["ResourceType"]} errors)</li>"
            ;;
          "TypeSafety")
            echo "    <li>Run <code>fix_type_safety.sh</code> first (addresses ${category_counts["TypeSafety"]} errors)</li>"
            ;;
          "NullSafety")
            echo "    <li>Run <code>fix_null_safety.sh</code> first (addresses ${category_counts["NullSafety"]} errors)</li>"
            ;;
          *)
            echo "    <li>No clear recommendation based on error patterns</li>"
            ;;
        esac
        
        echo "  </ol>"
        
        echo "</body>"
        echo "</html>"
      } > "${REPORT_FILE}.html"
      
      echo "HTML report generated: ${REPORT_FILE}.html"
      ;;
      
    *)
      echo "Error: Unsupported output format: $FORMAT"
      exit 1
      ;;
  esac
  
  # Generate data file for visualization
  if [ "$VISUALIZATION" = true ]; then
    echo "Generating visualization data..."
    
    # Create data file for pie chart
    {
      for category in "${!category_counts[@]}"; do
        echo "$category ${category_counts[$category]}"
      done
    } > "${REPORT_FILE}_categories.dat"
    
    # Create data file for bar chart of top errors
    {
      local i=0
      for error_code in $(
        for code in "${!error_counts[@]}"; do
          echo "$code ${error_counts[$code]}"
        done | sort -rn -k2 | cut -d' ' -f1
      ); do
        i=$((i + 1))
        if [ $i -le 10 ]; then
          echo "$error_code ${error_counts[$error_code]}"
        fi
      done
    } > "${REPORT_FILE}_top_errors.dat"
    
    # Check if gnuplot is available
    if command -v gnuplot >/dev/null 2>&1; then
      # Generate pie chart
      {
        echo "set terminal png size 800,600"
        echo "set output '${REPORT_FILE}_pie.png'"
        echo "set title 'Error Categories'"
        echo "set style data histogram"
        echo "set style fill solid border -1"
        echo "set xtics rotate by -45"
        echo "plot '${REPORT_FILE}_categories.dat' using 2:xtic(1) title 'Error Count' with boxes"
      } | gnuplot
      
      # Generate bar chart
      {
        echo "set terminal png size 800,600"
        echo "set output '${REPORT_FILE}_bar.png'"
        echo "set title 'Top Error Codes'"
        echo "set style data histogram"
        echo "set style fill solid border -1"
        echo "set xtics rotate by -45"
        echo "plot '${REPORT_FILE}_top_errors.dat' using 2:xtic(1) title 'Error Count' with boxes"
      } | gnuplot
      
      echo "Visualizations generated:"
      echo "  ${REPORT_FILE}_pie.png"
      echo "  ${REPORT_FILE}_bar.png"
    else
      echo "Warning: gnuplot not found. Visualization generation skipped."
      echo "Raw data files are available at:"
      echo "  ${REPORT_FILE}_categories.dat"
      echo "  ${REPORT_FILE}_top_errors.dat"
    fi
  fi
}

# Main execution
echo "Running TypeScript error analysis..."
ERROR_FILE=$(run_typescript_check)
analyze_errors "$ERROR_FILE"
rm -f "$ERROR_FILE"  # Clean up temporary file

echo "=== Error Pattern Analysis Completed ===" 