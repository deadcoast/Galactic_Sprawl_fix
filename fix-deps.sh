#!/bin/bash

# Create backup of original package.json
cp package.json package.json.backup

# Replace with fixed package.json
cp package.json.fixed package.json

# Remove old installation
rm -rf node_modules package-lock.json

# Install dependencies with legacy-peer-deps flag
npm install --legacy-peer-deps

# Install eslint with legacy-peer-deps flag
npm install eslint --legacy-peer-deps

echo "Installation complete. If you still encounter issues, run: npm install <package-name> --legacy-peer-deps"