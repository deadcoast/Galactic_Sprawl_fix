# Reference Tags Sheet

======================================================================
GALACTIC SPRAWL (GS) - REFERENCE TAGS SYSTEM
======================================================================

------------------------------ OVERVIEW ------------------------------

Reference tags help Cursor.AI understand code context, enabling more
accurate suggestions and completions.

------------------------- REFERENCE TAG FORMAT ----------------------

BASIC REFERENCE TAG:
// @context: system-name

MULTIPLE SYSTEM REFERENCES:
// @context: resource-system, event-system

SPECIFIC COMPONENT REFERENCES:
// @context: resource-system.threshold

------------------------ AVAILABLE SYSTEM REFERENCES ----------------

CORE SYSTEMS:
architecture-core - Overall architecture and relationships
type-definitions - Core type definitions and type safety
event-system - Event handling and communication
resource-system - Resource management and flow
factory-system - Object creation patterns
registry-system - Manager and service registry
entity-pooling - Entity pooling and optimization

MANAGER SYSTEMS:
manager-registry - Manager access patterns
resource-manager - Resource management
module-manager - Module lifecycle management
faction-manager - Faction behavior and relationships
combat-manager - Combat mechanics and calculations
exploration-manager - Exploration and discovery

UI SYSTEMS:
component-library - UI component patterns
visualization-system - Data visualization
shader-system - WebGL shader management

-------------------------- USAGE GUIDELINES -------------------------

FILE HEADERS:
/\*\*

- ResourceManager.ts
- @context: resource-system, event-system
-
- Central manager for all resource operations.
  \*/

FUNCTION/METHOD CONTEXT:
// @context: event-system
private setupEventListeners(): void {
// Event subscription implementation
}

COMPONENT CONTEXT:
/\*\*

- @context: resource-system, component-library
  \*/
  export function ResourceDisplay({ resourceType }) {
  // Component implementation
  }

IMPLEMENTATION REFERENCES:
// @context: manager-registry.singleton-pattern
export class CustomManager {
// Implementation should follow singleton pattern
}

----------------------------- BENEFITS ------------------------------

1. Improved Context Awareness: AI accesses relevant docs based on tags
2. Consistent Implementation: Tags ensure established patterns
3. Better Code Generation: AI generates more accurate code
4. Documentation Integration: Tags connect code to broader docs
5. # Pattern Enforcement: Tags signal which patterns to apply
