// analysis/reactAnalyzer.js
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import fs from 'fs';

export async function analyzeReactComponents(filePaths) {
  try {
    const results = filePaths
      .filter(file => file.endsWith('.jsx') || file.endsWith('.tsx'))
      .map(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentInfo = {
          file,
          props: [],
          hooks: [],
          stateVariables: [],
          renderComplexity: 0,
          conditionalRendering: 0
        };
        
        try {
          const ast = parse(content, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript']
          });
          
          traverse(ast, {
            // Extract props from function params or class props
            FunctionDeclaration(traversePath) {
              if (traversePath.node.params.length > 0) {
                // Extract props from destructured object pattern
                const props = traversePath.node.params[0];
                if (props.type === 'ObjectPattern') {
                  props.properties.forEach(prop => {
                    if (prop.key) {
                      componentInfo.props.push(prop.key.name);
                    }
                  });
                }
              }
            },
            
            // Find hook usage
            CallExpression(traversePath) {
              if (traversePath.node.callee.type === 'Identifier' && 
                  traversePath.node.callee.name.startsWith('use')) {
                componentInfo.hooks.push(traversePath.node.callee.name);
              }
            },
            
            // Count conditional rendering
            ConditionalExpression(traversePath) {
              // Increment counter for conditional rendering (ternary expressions)
              componentInfo.conditionalRendering++;
              
              // Calculate complexity based on nesting level
              if (traversePath.parent && traversePath.parent.type === 'ConditionalExpression') {
                // Nested ternary expressions make code harder to read
                componentInfo.renderComplexity += 2;
              } else {
                componentInfo.renderComplexity += 1;
              }
            },
            
            LogicalExpression(traversePath) {
              if (traversePath.node.operator === '&&') {
                // Increment counter for conditional rendering (logical &&)
                componentInfo.conditionalRendering++;
                
                // Check if this is part of JSX to identify conditional rendering
                let currentPath = traversePath;
                while (currentPath.parent) {
                  if (currentPath.parent.type && currentPath.parent.type.includes('JSX')) {
                    componentInfo.renderComplexity += 1;
                    break;
                  }
                  currentPath = currentPath.parentPath;
                }
              }
            }
          });
          
          return componentInfo;
        } catch (error) {
          return { file, error: error.message };
        }
      });
    
    return results;
  } catch (error) {
    throw new Error(`Error in React component analysis: ${error.message}`);
  }
}