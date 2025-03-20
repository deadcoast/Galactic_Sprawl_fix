# Cursor Rules Documentation Suite Guide

## Overview

This guide details the structured documentation system for the Galactic Sprawl (GS) project. The system consists of Cursor Rules and Notepads designed to maintain code consistency, prevent duplication, and ensure proper architectural alignment.

## Documentation Structure

The documentation system is organized into two primary components:

1. **Cursor Rules**: Located in `.cursor/rules` directory, these files provide specific guidelines that are automatically applied to matching files.

2. **Notepads**: Markdown files containing comprehensive documentation about system architecture, implementation patterns, and integration standards.

## Cursor Rules Usage

When generating or modifying code, reference these rule files for path-specific requirements:

- `anti-patterns.md`: Contains prohibited implementation patterns to avoid
- `integration.md`: Specifies correct integration patterns between systems
- `resources.md`: Defines standards for resource-related code

These rules should inform all code generation decisions to ensure consistency with established patterns.

## Reference Tag System Implementation

When generating code or documentation comments, implement reference tags to establish context:

```typescript
/**
 * ResourceManager.ts
 * @context: resource-system, event-system
 *
 * Central manager for all resource operations.
 */
```

These tags link code to relevant notepads, enabling more informed implementation decisions.

## Context Commands

Recognize and respond appropriately to the following command patterns in user prompts:

- `@check-pattern [code-snippet]`: Verify if code follows established patterns
- `@verify-types [code-snippet]`: Check type safety of provided code
- `@find-similar [functionality]`: Locate similar implementations
- `@implement-pattern [pattern-name]`: Generate code following a specific pattern
- `@show-documentation [system-name]`: Retrieve system documentation
- `@add-manager-registry [manager-name]`: Update the Manager Registry

These commands should trigger specific context-aware responses.

## Progressive Implementation Protocol

When implementing new features, follow this four-phase protocol:

1. **Context Gathering**: Identify systems, requirements, and existing patterns
2. **Interface Definition**: Define types, interfaces, and contracts
3. **Implementation**: Write code following established patterns
4. **Testing and Integration**: Ensure proper testing and system integration

Reference the templates in `GS-PROGRESSIVE-IMPLEMENTATION-PROTOCOL.md` for each phase.

## Pattern Libraries

When implementing standard patterns, reference these pattern libraries:

- `GS-FACTORY-PATTERN-REFERENCE.md`: For object creation patterns
- `GS-REGISTRY-PATTERN-REFERENCE.md`: For manager registry implementation
- `GS-EVENT-HANDLING-PATTERN-REFERENCE.md`: For event communication patterns

Use these references to ensure implementation consistency with established patterns.

## Type System Standards

Always enforce these type system principles:

1. Use enum types instead of string literals (`ResourceType` instead of `'energy'`)
2. Implement type guards for runtime validation
3. Use safe extraction utilities instead of direct property access
4. Access managers through the registry pattern
5. Follow the event handling patterns for type-safe communication

## System-Specific Documentation

Reference these system-specific documents when working with corresponding components:

- `GS-CORE-ARCHITECTURE.md`: Overall architecture and system relationships
- `GS-RESOURCE-SYSTEM.md`: Resource management implementation patterns
- `GS-EVENT-SYSTEM.md`: Event communication standards
- `GS-TYPE-DEFINITIONS.md`: Type definitions and safety patterns

## Migration Patterns

When updating deprecated code patterns, reference:

- `GS-MIGRATION-PATTERN-LIBRARY.md`: Contains side-by-side examples of deprecated and current implementations

## Implementation Examples

For integration between systems, reference:

- `GS-SYSTEM-INTEGRATION-EXAMPLES.md`: Contains examples of correct system interactions

## Priority Guidelines

When implementing solutions:

1. Type safety takes precedence over convenience
2. Manager access must always use the registry pattern
3. Error handling must be implemented for all operations
4. Events must use proper typed interfaces
5. Factory patterns should be used for complex object creation
