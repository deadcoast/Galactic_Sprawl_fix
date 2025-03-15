/**
 * @fileoverview Rule to enforce the use of enum resource types instead of string resource types
 * @author Galactic Sprawl Team
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
const noStringResourceTypes = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce the use of enum resource types instead of string resource types',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // no options
    messages: {
      useEnumResourceType: 'Use ResourceType enum instead of string literal for resource types',
    },
  },

  create(context) {
    // Skip checking in the ResourceTypeMigration.ts file
    const filename = context.getFilename();
    if (filename.includes('ResourceTypeMigration.ts')) {
      return {};
    }

    // String literals that represent resource types
    const resourceTypeStrings = [
      'minerals',
      'energy',
      'population',
      'research',
      'plasma',
      'gas',
      'exotic',
    ];

    // Mapping from string literals to enum values
    const stringToEnumMap = {
      minerals: 'ResourceType.MINERALS',
      energy: 'ResourceType.ENERGY',
      population: 'ResourceType.POPULATION',
      research: 'ResourceType.RESEARCH',
      plasma: 'ResourceType.PLASMA',
      gas: 'ResourceType.GAS',
      exotic: 'ResourceType.EXOTIC',
    };

    return {
      Literal(node) {
        // Check if the literal is a string and represents a resource type
        if (typeof node.value === 'string' && resourceTypeStrings.includes(node.value)) {
          // Check if the string is used as a property name in an object
          const parent = node.parent;
          if (parent && parent.type === 'Property' && parent.key === node) {
            // Skip if it's a property name
            return;
          }

          // Report the issue
          context.report({
            node,
            messageId: 'useEnumResourceType',
            fix(fixer) {
              // Suggest replacing the string with the enum value
              return fixer.replaceText(node, stringToEnumMap[node.value]);
            },
          });
        }
      },
    };
  },
};

export default noStringResourceTypes;
