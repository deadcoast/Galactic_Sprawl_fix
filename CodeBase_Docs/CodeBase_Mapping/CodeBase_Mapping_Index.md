---
CODEBASE MAPPING INDEX
---

# Galactic Sprawl Codebase Mapping

This document serves as the main index for the Galactic Sprawl project codebase mapping. The detailed mapping has been categorized into separate files for better organization and maintainability.

## Project Mapping Guidelines

- All paths are relative to project root
- Dependencies indicate direct relationships
- "Used By" indicates reverse dependencies
- All components should follow consistent naming
- Event systems should use centralized bus

## Categories

1. [Development Tools](./Categories/Development_Tools_References.md)

   - Linting and Code Quality
   - Testing Framework
   - Type Safety Improvements

2. [Core Systems](./Categories/Core_Systems_References.md)

   - Resource Management
   - Module Framework
   - Event System
   - State Management
   - UI Framework
   - Faction Ship System
   - VPR View
   - Civilization Sprawl View

3. [Combat System](./Categories/Combat_System_References.md)

   - Combat Worker
   - Combat Type Conversion Utilities
   - Combat System Components

4. [UI Components](./Categories/UI_References.md)

   - HUD Components
   - Menus
   - Dialogs
   - UI Hooks
   - Visualization

5. [Game Mechanics](./Categories/Game_Mechanics_References.md)

   - Exploration
   - Mining
   - Research
   - Ship Management
   - Economy

6. [Build Configuration](./Categories/Build_Configuration_References.md)

   - TypeScript Configuration
   - Vite Configuration

7. [Testing Framework](./Categories/Testing_Framework_References.md)

   - Unit Tests
   - Component Tests
   - Integration Tests
   - End-to-End Tests

8. [Ship System](./Categories/Ship_System_References.md)

   - Ship Configuration
   - Ship Type Relationships
   - Ship Implementation Details
   - Ship Formation System
   - AI Integration
   - Ship Hangar System
   - Player Ship System

9. [Resource Management](./Categories/Resource_Management_References.md)

   - Core Components
   - Resource Type Definitions
   - Resource Utilities
   - Resource Type Relationships
   - Resource Tracking Flow
   - Resource Management Events
   - Resource Management Hooks
   - Resource Management UI Components

10. [Resource Tracking](./Categories/Resource_Tracking_References.md)

    - Core Resource Tracking Types
    - Resource Serialization Interfaces
    - Type Relationships
    - Resource Tracking Flow
    - Resource Tracking Components
    - Resource Tracking Hooks
    - Resource Tracking Events
    - Resource Tracking Integration

11. [Effect System](./Categories/Effect_System_References.md)

    - Core Effect Types
    - Effect Utilities
    - Components Using Effects
    - Effect System Integration
    - Effect Type Relationships
    - Effect Creation Flow
    - Effect System Dependencies
    - Effect System Components
    - Effect System Hooks
    - Effect System Events

12. [Combat Type Conversion](./Categories/Combat_Type_Conversion_References.md)

    - Core Type Conversion Utilities
    - Combat System Components
    - Type Relationships
    - Conversion Flow
    - Type Conversion Implementation
    - Type Conversion Usage
    - Type Conversion Testing
    - Type Conversion Benefits

13. [Automation System](./Categories/Automation_System_References.md)

    - Core Components
    - Automation Routines
    - Automation System Architecture
    - Automation System Events
    - Automation System Integration
    - Automation System Configuration
    - Automation System Testing

14. [Project Phase](./Categories/Project_Phase_References.md)
    - Project Mapping Guidelines
    - Development Phases
    - Development Workflow
    - Project Structure
    - Coding Standards
    - Version Control
    - Documentation
    - Performance Considerations
    - Security Considerations
    - Accessibility Considerations

## Maintenance

This mapping is maintained as a living document. When adding new components or modifying existing ones, please update the relevant category file. The original comprehensive mapping file has been preserved for reference but is being gradually migrated to this categorized structure.

**IMPORTANT: This file has been restructured into separate category files for better organization and maintainability.**

Please refer to the [CodeBase Mapping Index](./CodeBase_Mapping_Index.md) for the complete documentation.

## Available Category References

1. [Development Tools References](./Categories/Development_Tools_References.md)

   - Contains information about development tools, linting configuration, and testing utilities

2. [Core Systems References](./Categories/Core_Systems_References.md)

   - Contains information about core system architecture, including resource management, module framework, and event systems

3. [Combat System References](./Categories/Combat_System_References.md)

   - Contains information about combat system architecture, including combat worker, type conversion utilities, and combat components

4. [Build Configuration References](./Categories/Build_Configuration_References.md)

   - Contains information about build configuration, including TypeScript configuration and Vite configuration

5. [UI References](./Categories/UI_References.md)

   - Contains information about UI components, view system architecture, and visualization components

6. [Game Mechanics References](./Categories/Game_Mechanics_References.md)

   - Contains information about game modules architecture, state management, faction ship system, resource management system, and automation system

7. [Testing Framework References](./Categories/Testing_Framework_References.md)

   - Contains information about unit tests, component tests, integration tests, and end-to-end tests

8. [Ship System References](./Categories/Ship_System_References.md)

   - Contains information about ship configuration, ship type relationships, ship implementation details, ship formation system, AI integration, and player ship system

9. [Resource Management References](./Categories/Resource_Management_References.md)

   - Contains information about resource management system implementation, resource type definitions, resource utilities, resource tracking flow, and resource management UI components

10. [Resource Tracking References](./Categories/Resource_Tracking_References.md)

    - Contains information about resource tracking system implementation, resource serialization interfaces, type relationships, resource tracking flow, and resource tracking integration

11. [Effect System References](./Categories/Effect_System_References.md)

    - Contains information about effect system implementation, core effect types, effect utilities, components using effects, effect system integration, and effect system events

12. [Combat Type Conversion References](./Categories/Combat_Type_Conversion_References.md)

    - Contains information about combat system type conversion utilities, combat system components, type relationships, conversion flow, and type conversion implementation

13. [Automation System References](./Categories/Automation_System_References.md)

    - Contains information about automation system implementation, core components, automation routines, system architecture, events, integration, and testing

14. [Project Phase References](./Categories/Project_Phase_References.md)

    - Contains information about project mapping guidelines, development phases, workflow, structure, coding standards, and best practices

## Maintenance Guidelines

When updating the codebase:

1. Add new components or systems to the appropriate category file
2. Update existing documentation to reflect changes in the codebase
3. Maintain consistent formatting and organization within each category file
4. If a new category is needed, create a new file and update the index

This file is kept for historical reference but is no longer actively maintained. All updates should be made to the appropriate category files.
