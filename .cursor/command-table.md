# Galactic Sprawl Cursor.AI Command Cheatsheet

## Pattern Verification Commands

| Command                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `@check-pattern [code]` | Verifies if code follows established project patterns           |
| `@verify-types [code]`  | Checks if code uses proper type definitions and safety patterns |

## Implementation Assistance Commands

| Command                                      | Purpose                                              |
| -------------------------------------------- | ---------------------------------------------------- |
| `@find-similar [functionality]`              | Locates similar implementations in the codebase      |
| `@implement-pattern [pattern-name] [params]` | Generates code for a specific implementation pattern |
| `@refactor-to-pattern [pattern-name] [code]` | Refactors provided code to follow a specific pattern |

## Navigation Commands

| Command                             | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `@show-documentation [system-name]` | Retrieves documentation for a specific system          |
| `@show-interface [type-name]`       | Displays the interface definition for a specified type |

## Type System Commands

| Command                               | Purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `@convert-to-enum [enum-type] [code]` | Converts string literals to corresponding enum types |
| `@add-type-guards [code]`             | Adds appropriate type guards to the provided code    |

## Integration Commands

| Command                                | Purpose                                               |
| -------------------------------------- | ----------------------------------------------------- |
| `@integrate-with [system] [component]` | Generates code to integrate with a specific system    |
| `@add-manager-registry [manager-name]` | Updates the Manager Registry with a new manager class |

## Reference Tags System

```typescript
/**
 * @context: system-name, other-system
 */
```

Links code to relevant documentation for better AI assistance

## Document Reference Guide

| Document                                    | Purpose                                       |
| ------------------------------------------- | --------------------------------------------- |
| `GS-CORE-ARCHITECTURE.md`                   | Overall system architecture and relationships |
| `GS-RESOURCE-SYSTEM.md`                     | Resource management implementation details    |
| `GS-EVENT-SYSTEM.md`                        | Event system communication standards          |
| `GS-TYPE-DEFINITIONS.md`                    | Type definitions and safety patterns          |
| `GS-FACTORY-PATTERN-REFERENCE.md`           | Object creation patterns                      |
| `GS-REGISTRY-PATTERN-REFERENCE.md`          | Manager registry implementations              |
| `GS-EVENT-HANDLING-PATTERN-REFERENCE.md`    | Event handling patterns                       |
| `GS-SYSTEM-INTEGRATION-EXAMPLES.md`         | Examples of system interactions               |
| `GS-MIGRATION-PATTERN-LIBRARY.md`           | Deprecated vs. current implementations        |
| `GS-PROGRESSIVE-IMPLEMENTATION-PROTOCOL.md` | 4-phase implementation protocol               |
| `GS-REFERENCE-TAGS-SYSTEM.md`               | Documentation reference system                |
| `GS-CONTEXT-COMMANDS.md`                    | Command reference for AI interaction          |
