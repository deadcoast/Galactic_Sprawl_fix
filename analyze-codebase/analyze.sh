#!/bin/bash

# Define colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Set up environment
OUTPUT_DIR="$(pwd)/output"
PROJECT_ROOT=$(cd .. && pwd)
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
CURRENT_RUN="$OUTPUT_DIR/$TIMESTAMP"

# Create output directory if it doesn't exist
mkdir -p "$CURRENT_RUN"

echo -e "${BLUE}Running codebase analysis...${RESET}"

# Create latest symlink
echo -e "${YELLOW}Creating/updating 'latest' link to point to $TIMESTAMP${RESET}"
# Remove existing symlink first to avoid EEXIST error
rm -f "$OUTPUT_DIR/latest"
ln -sf "$TIMESTAMP" "$OUTPUT_DIR/latest"

# Save the path to the current analysis run
echo "$TIMESTAMP" > "$OUTPUT_DIR/latest_run.txt"

# Create a fallback latest_copy directory just in case
mkdir -p "$OUTPUT_DIR/latest_copy"
cp -r "$CURRENT_RUN/"* "$OUTPUT_DIR/latest_copy/" 2>/dev/null || true
echo -e "${GREEN}Created latest_copy directory as fallback${RESET}"

# Run the analysis
echo -e "${BLUE}Starting codebase analysis...${RESET}"
node main.js --projectRoot="$PROJECT_ROOT" --outputDir="$CURRENT_RUN"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Analysis completed successfully!${RESET}"
  echo -e "${GREEN}Results available in: $CURRENT_RUN${RESET}"
  echo -e "${GREEN}View the report at: $CURRENT_RUN/index.html${RESET}"
else
  echo -e "${RED}Analysis failed with errors!${RESET}"
  echo -e "${RED}Check the logs for more information.${RESET}"
fi

# Generate consolidated report
echo -e "${BLUE}Generating technical report...${RESET}"
node consolidate.js --analysisDir="$CURRENT_RUN" --projectRoot="$PROJECT_ROOT"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Technical report generated successfully!${RESET}"
  echo -e "${GREEN}Report available at: $CURRENT_RUN/TECHNICAL_REPORT.md${RESET}"
else
  echo -e "${RED}Technical report generation failed!${RESET}"
fi

echo -e "${GREEN}Analysis complete. Results are in: $CURRENT_RUN${RESET}"
