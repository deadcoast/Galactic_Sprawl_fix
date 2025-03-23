#!/bin/bash

# Galactic Sprawl Codebase Analyzer Setup Script
echo "Setting up Galactic Sprawl Codebase Analyzer..."

# Make analyze.sh executable if it exists
if [ -f "analyze.sh" ]; then
  chmod +x analyze.sh
  echo "✓ Made analyze.sh executable"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo "
Setup complete! You can now use the codebase analyzer with the following commands:

  npm run analyze      # Run full codebase analysis
  npm run report       # Generate reports from existing analysis data
  npm run consolidate  # Consolidate duplicated components
  npm run help         # Display help information

For more information, see the README.md file.
"
