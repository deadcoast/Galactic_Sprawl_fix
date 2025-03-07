---
CODEBASE MAPPING INDEX
---

# Galactic Sprawl Codebase Mapping

This directory contains categorized mapping files for the Galactic Sprawl project. Each file contains detailed information about specific components, their locations, dependencies, and purposes.

## Categories

1. [Development Tools](./Development_Tools_References.md)

   - Linting and Code Quality
   - Testing Framework
   - Build Tools
   - Type Safety Improvements

2. [Core Systems](./Core_Systems_References.md)

   - Resource Management
   - Module Framework
   - Event System
   - Game State Management
   - Serialization
   - Worker Architecture

3. [Combat System](./Combat_System_References.md)

   - Combat Worker
   - Combat Types
   - Weapon Systems
   - Hazard Detection
   - Combat AI

4. [UI Components](./UI_References.md)

   - HUD Components
   - Menus
   - Dialogs
   - UI Hooks
   - Visualization

5. [Game Mechanics](./Game_Mechanics_References.md)

   - Exploration
   - Mining
   - Research
   - Ship Management
   - Economy

6. [Build Configuration](./Build_Configuration_References.md)
   - TypeScript Configuration
   - Vite Configuration
   - Dependency Management
   - Optimization Settings

## Usage Guidelines

- All paths are relative to project root
- Dependencies indicate direct relationships
- "Used By" indicates reverse dependencies
- All components should follow consistent naming
- Event systems should use centralized bus

## Maintenance

This mapping is maintained as a living document. When adding new components or modifying existing ones, please update the relevant category file.
