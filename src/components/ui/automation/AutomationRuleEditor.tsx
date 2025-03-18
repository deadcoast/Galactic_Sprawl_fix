import { ResourceType } from "./../../../types/resources/ResourceTypes";
import * as React from "react";
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AutomationAction,
  AutomationActionType,
  AutomationCondition,
  AutomationConditionType,
  AutomationRule,
} from '../../../managers/game/AutomationManager';
import './AutomationRuleEditor.css';

interface AutomationRuleEditorProps {
  rule?: AutomationRule;
  moduleId: string;
  onSave: (rule: AutomationRule) => void;
  onCancel: () => void;
}

// Define node types for the editor
type NodeType = 'condition' | 'action' | 'start' | 'end';

// Define the node interface for our visual editor
interface EditorNode {
  id: string;
  type: NodeType;
  data: AutomationCondition | AutomationAction | null;
  position: { x: number; y: number };
  connectedTo: string[];
}

// Factory functions for creating editor nodes
const createConditionNode = (
  condition: AutomationCondition,
  position: { x: number; y: number }
): EditorNode => ({
  id: condition.id || `condition-${uuidv4()}`,
  type: 'condition',
  data: { ...condition, id: condition.id || `condition-${uuidv4()}` },
  position,
  connectedTo: [],
});

const createActionNode = (
  action: AutomationAction,
  position: { x: number; y: number }
): EditorNode => ({
  id: action.id || `action-${uuidv4()}`,
  type: 'action',
  data: { ...action, id: action.id || `action-${uuidv4()}` },
  position,
  connectedTo: [],
});

// Blank templates for new nodes
const blankCondition: AutomationCondition = {
  type: 'RESOURCE_ABOVE',
  target: '',
  value: { amount: 0 },
  id: '',
};

const blankAction: AutomationAction = {
  type: 'ACTIVATE_MODULE',
  target: '',
  id: '',
};

const AutomationRuleEditor: React.FC<AutomationRuleEditorProps> = ({
  rule,
  moduleId,
  onSave,
  onCancel,
}) => {
  // Editor state
  const [ruleName, setRuleName] = useState(rule?.name || 'New Rule');
  const [ruleInterval, setRuleInterval] = useState(rule?.interval || 60000);
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [conditionPanelOpen, setConditionPanelOpen] = useState(false);
  const [actionPanelOpen, setActionPanelOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<EditorNode | null>(null);

  // Initialize editor with existing rule
  useEffect(() => {
    if (rule) {
      // Create initial start node
      const startNode: EditorNode = {
        id: 'start',
        type: 'start',
        data: null,
        position: { x: 100, y: 200 },
        connectedTo: [],
      };

      // Create nodes from rule data
      const conditionNodes = rule.conditions.map((condition, index) =>
        createConditionNode(condition, { x: 250, y: 100 + index * 150 })
      );

      const actionNodes = rule.actions.map((action, index) =>
        createActionNode(action, { x: 500, y: 100 + index * 150 })
      );

      // Setup connections
      if (conditionNodes.length > 0) {
        startNode.connectedTo = [conditionNodes[0].id];
        for (let i = 0; i < conditionNodes.length - 1; i++) {
          conditionNodes[i].connectedTo = [conditionNodes[i + 1].id];
        }

        if (actionNodes.length > 0) {
          conditionNodes[conditionNodes.length - 1].connectedTo = [actionNodes[0].id];

          for (let i = 0; i < actionNodes.length - 1; i++) {
            if (actionNodes[i].data) {
              // Manually create connections for next actions
              const actionData = actionNodes[i].data as AutomationAction;
              if (actionData.nextActions && actionData.nextActions.length > 0) {
                const nextIds = actionData.nextActions.map(a => a.id ?? '').filter(id => id);
                actionNodes[i].connectedTo = nextIds;
              } else {
                actionNodes[i].connectedTo = [actionNodes[i + 1].id];
              }
            }
          }
        }
      } else if (actionNodes.length > 0) {
        startNode.connectedTo = [actionNodes[0].id];

        for (let i = 0; i < actionNodes.length - 1; i++) {
          actionNodes[i].connectedTo = [actionNodes[i + 1].id];
        }
      }

      // End node
      const endNode: EditorNode = {
        id: 'end',
        type: 'end',
        data: null,
        position: { x: 700, y: 200 },
        connectedTo: [],
      };

      // Connect last action to end
      if (actionNodes.length > 0) {
        actionNodes[actionNodes.length - 1].connectedTo = [endNode.id];
      } else if (conditionNodes.length > 0) {
        conditionNodes[conditionNodes.length - 1].connectedTo = [endNode.id];
      } else {
        startNode.connectedTo = [endNode.id];
      }

      // Set all nodes
      setNodes([startNode, ...conditionNodes, ...actionNodes, endNode]);
    } else {
      // Create fresh rule with start and end nodes
      const startNode: EditorNode = {
        id: 'start',
        type: 'start',
        data: null,
        position: { x: 100, y: 200 },
        connectedTo: [],
      };

      const endNode: EditorNode = {
        id: 'end',
        type: 'end',
        data: null,
        position: { x: 700, y: 200 },
        connectedTo: [],
      };

      startNode.connectedTo = [endNode.id];

      setNodes([startNode, endNode]);
    }
  }, [rule]);

  // Function to add a new node
  const addNode = (type: 'condition' | 'action', position: { x: number; y: number }) => {
    const newNode =
      type === 'condition'
        ? createConditionNode({ ...blankCondition }, position)
        : createActionNode({ ...blankAction }, position);

    setNodes(prev => [...prev, newNode]);
    return newNode;
  };

  // Function to handle starting a drag operation
  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();

    setIsDragging(true);
    setSelectedNode(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      dragItemRef.current = node;

      // Calculate offset
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Function to handle drag movement
  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !dragItemRef.current || !canvasRef.current) {
      return;
    }

    // Calculate new position
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    setNodes(prev =>
      prev.map(node =>
        node.id === dragItemRef.current?.id ? { ...node, position: { x, y } } : node
      )
    );
  };

  // Function to handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    dragItemRef.current = null;
  };

  // Function to handle connection creation
  const handleConnectionStart = (nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
  };

  // Function to handle connection end
  const handleConnectionEnd = (nodeId: string) => {
    if (!isConnecting || !connectionStart || connectionStart === nodeId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Create the connection
    setNodes(prev =>
      prev.map(node =>
        node.id === connectionStart ? { ...node, connectedTo: [...node.connectedTo, nodeId] } : node
      )
    );

    setIsConnecting(false);
    setConnectionStart(null);
  };

  // Function to handle node deletion
  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'end') {
      return;
    }

    setNodes(prev => {
      // Remove node
      const filteredNodes = prev.filter(node => node.id !== nodeId);

      // Remove connections to this node
      return filteredNodes.map(node => ({
        ...node,
        connectedTo: node.connectedTo.filter(id => id !== nodeId),
      }));
    });

    setSelectedNode(null);
  };

  // Function to handle node selection
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  };

  // Function to convert editor nodes back to a rule
  const buildRuleFromNodes = (): AutomationRule => {
    const conditions: AutomationCondition[] = [];
    const actions: AutomationAction[] = [];

    // Extract conditions and actions
    nodes.forEach(node => {
      if (node.type === 'condition' && node.data) {
        conditions.push(node.data as AutomationCondition);
      } else if (node.type === 'action' && node.data) {
        actions.push(node.data as AutomationAction);
      }
    });

    // Build action chains
    nodes.forEach(node => {
      if (node.type === 'action' && node.data && node.connectedTo.length > 0) {
        const actionData = node.data as AutomationAction;

        // Find connected actions
        const nextActions: AutomationAction[] = [];
        node.connectedTo.forEach(connectedId => {
          const connectedNode = nodes.find(n => n.id === connectedId);
          if (connectedNode && connectedNode.type === 'action' && connectedNode.data) {
            nextActions.push(connectedNode.data as AutomationAction);
          }
        });

        if (nextActions.length > 0) {
          actionData.nextActions = nextActions;
        }
      }
    });

    return {
      id: rule?.id || `rule-${uuidv4()}`,
      moduleId,
      name: ruleName,
      enabled: rule?.enabled || false,
      conditions,
      actions,
      interval: ruleInterval,
      lastRun: rule?.lastRun,
    };
  };

  // Function to handle rule save
  const handleSave = () => {
    const newRule = buildRuleFromNodes();
    onSave(newRule);
  };

  // Render the editor interface
  return (
    <div className="automation-rule-editor">
      <div className="automation-rule-editor__header">
        <div className="automation-rule-editor__title">
          <input
            type="text"
            value={ruleName}
            onChange={e => setRuleName(e.target.value)}
            placeholder="Rule Name"
            className="automation-rule-editor__title-input"
          />
        </div>

        <div className="automation-rule-editor__interval">
          <label>Interval (ms):</label>
          <input
            type="number"
            value={ruleInterval}
            onChange={e => setRuleInterval(Number(e.target.value))}
            min="1000"
            step="1000"
          />
        </div>
      </div>

      <div className="automation-rule-editor__toolbar">
        <button
          className="automation-rule-editor__add-condition"
          onClick={() => setConditionPanelOpen(!conditionPanelOpen)}
        >
          Add Condition
        </button>
        <button
          className="automation-rule-editor__add-action"
          onClick={() => setActionPanelOpen(!actionPanelOpen)}
        >
          Add Action
        </button>
      </div>

      {conditionPanelOpen && (
        <div className="automation-rule-editor__condition-panel">
          <h3>Add Condition</h3>
          <div className="automation-rule-editor__condition-options">
            {Object.values([
              'RESOURCE_ABOVE',
              'RESOURCE_BELOW',
              'MODULE_ACTIVE',
              'RESOURCE_RATIO',
              'MULTIPLE_RESOURCES',
            ]).map(type => (
              <div
                key={type}
                className="automation-rule-editor__condition-option"
                onClick={() => {
                  const position = { x: 250, y: 200 };
                  addNode('condition', position);
                  setConditionPanelOpen(false);
                }}
              >
                {type.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {actionPanelOpen && (
        <div className="automation-rule-editor__action-panel">
          <h3>Add Action</h3>
          <div className="automation-rule-editor__action-options">
            {Object.values([
              'ACTIVATE_MODULE',
              'DEACTIVATE_MODULE',
              'TRANSFER_RESOURCES',
              'PRODUCE_RESOURCES',
              'CONSUME_RESOURCES',
            ]).map(type => (
              <div
                key={type}
                className="automation-rule-editor__action-option"
                onClick={() => {
                  const position = { x: 500, y: 200 };
                  addNode('action', position);
                  setActionPanelOpen(false);
                }}
              >
                {type.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        className="automation-rule-editor__canvas"
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
      >
        {/* Render the connections between nodes */}
        <svg className="automation-rule-editor__connections">
          {nodes.map(node =>
            node.connectedTo.map(toId => {
              const toNode = nodes.find(n => n.id === toId);
              if (!toNode) {
                return null;
              }

              return (
                <line
                  key={`${node.id}-${toId}`}
                  x1={node.position.x + 100} // Adjust based on node size
                  y1={node.position.y + 50}
                  x2={toNode.position.x}
                  y2={toNode.position.y + 50}
                  stroke="#666"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })
          )}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
        </svg>

        {/* Render the nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`automation-rule-editor__node automation-rule-editor__node--${node.type} ${
              selectedNode === node.id ? 'automation-rule-editor__node--selected' : ''
            }`}
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
            }}
            onMouseDown={e => handleDragStart(e, node.id)}
            onClick={() => handleNodeSelect(node.id)}
          >
            <div className="automation-rule-editor__node-header">
              {node.type === 'condition' && 'Condition'}
              {node.type === 'action' && 'Action'}
              {node.type === 'start' && 'Start'}
              {node.type === 'end' && 'End'}

              {node.type !== 'start' && node.type !== 'end' && (
                <button
                  className="automation-rule-editor__node-delete"
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteNode(node.id);
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="automation-rule-editor__node-content">
              {node.type === 'condition' && node.data && (
                <div className="automation-rule-editor__condition-node">
                  <div>{(node.data as AutomationCondition).type.replace(/_/g, ' ')}</div>
                  {(node.data as AutomationCondition).target && (
                    <div>Target: {(node.data as AutomationCondition).target}</div>
                  )}
                </div>
              )}

              {node.type === 'action' && node.data && (
                <div className="automation-rule-editor__action-node">
                  <div>{(node.data as AutomationAction).type.replace(/_/g, ' ')}</div>
                  {(node.data as AutomationAction).target && (
                    <div>Target: {(node.data as AutomationAction).target}</div>
                  )}
                </div>
              )}
            </div>

            <div className="automation-rule-editor__node-connectors">
              <div
                className="automation-rule-editor__connector automation-rule-editor__connector--output"
                onClick={e => {
                  e.stopPropagation();
                  handleConnectionStart(node.id);
                }}
              />

              <div
                className={`automation-rule-editor__connector automation-rule-editor__connector--input ${
                  isConnecting && connectionStart !== node.id
                    ? 'automation-rule-editor__connector--active'
                    : ''
                }`}
                onClick={e => {
                  e.stopPropagation();
                  handleConnectionEnd(node.id);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Node details panel for the selected node */}
      {selectedNode && (
        <div className="automation-rule-editor__details-panel">
          <NodeDetailsPanel
            node={nodes.find(n => n.id === selectedNode)!}
            onUpdate={updatedData => {
              setNodes(prev =>
                prev.map(node => (node.id === selectedNode ? { ...node, data: updatedData } : node))
              );
            }}
          />
        </div>
      )}

      <div className="automation-rule-editor__actions">
        <button className="automation-rule-editor__cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="automation-rule-editor__save" onClick={handleSave}>
          Save Rule
        </button>
      </div>
    </div>
  );
};

// Component for editing node details
interface NodeDetailsPanelProps {
  node: EditorNode;
  onUpdate: (data: AutomationCondition | AutomationAction | null) => void;
}

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ node, onUpdate }) => {
  if (!node.data) {
    return null;
  }

  if (node.type === 'condition') {
    const condition = node.data as AutomationCondition;

    return (
      <div className="node-details-panel">
        <h3>Condition Details</h3>

        <div className="form-group">
          <label>Condition Type</label>
          <select
            value={condition.type}
            onChange={e => {
              onUpdate({
                ...condition,
                type: e.target.value as AutomationConditionType,
                // Reset value to ensure type safety
                value:
                  e.target.value === 'RESOURCE_ABOVE' || e.target.value === 'RESOURCE_BELOW'
                    ? { amount: 0 }
                    : undefined,
              });
            }}
          >
            {[
              'RESOURCE_ABOVE',
              'RESOURCE_BELOW',
              'MODULE_ACTIVE',
              'MODULE_INACTIVE',
              'TIME_ELAPSED',
              'STATUS_EQUALS',
              'RESOURCE_RATIO',
              'MULTIPLE_RESOURCES',
              'COMPLEX_EVENT',
              'PERIODIC',
              'COMPOUND',
            ].map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {(condition.type === 'RESOURCE_ABOVE' || condition.type === 'RESOURCE_BELOW') && (
          <>
            <div className="form-group">
              <label>Resource Type</label>
              <select
                value={condition.target ?? ''}
                onChange={e => {
                  onUpdate({
                    ...condition,
                    target: e.target.value,
                  });
                }}
              >
                <option value="">Select Resource</option>
                {[ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.POPULATION, ResourceType.RESEARCH].map(resource => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                value={
                  typeof condition.value === 'object' && 'amount' in condition.value
                    ? condition.value.amount
                    : 0
                }
                onChange={e => {
                  onUpdate({
                    ...condition,
                    value: { amount: Number(e.target.value) },
                  });
                }}
                min="0"
              />
            </div>
          </>
        )}

        {(condition.type === 'MODULE_ACTIVE' || condition.type === 'MODULE_INACTIVE') && (
          <div className="form-group">
            <label>Module ID</label>
            <input
              type="text"
              value={condition.target ?? ''}
              onChange={e => {
                onUpdate({
                  ...condition,
                  target: e.target.value,
                });
              }}
              placeholder="Enter module ID"
            />
          </div>
        )}

        {/* Add other condition type editors here */}
      </div>
    );
  }

  if (node.type === 'action') {
    const action = node.data as AutomationAction;

    return (
      <div className="node-details-panel">
        <h3>Action Details</h3>

        <div className="form-group">
          <label>Action Type</label>
          <select
            value={action.type}
            onChange={e => {
              onUpdate({
                ...action,
                type: e.target.value as AutomationActionType,
              });
            }}
          >
            {[
              'ACTIVATE_MODULE',
              'DEACTIVATE_MODULE',
              'TRANSFER_RESOURCES',
              'PRODUCE_RESOURCES',
              'CONSUME_RESOURCES',
              'UPGRADE_MODULE',
              'EMIT_EVENT',
            ].map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {(action.type === 'ACTIVATE_MODULE' ||
          action.type === 'DEACTIVATE_MODULE' ||
          action.type === 'UPGRADE_MODULE') && (
          <div className="form-group">
            <label>Module ID</label>
            <input
              type="text"
              value={action.target ?? ''}
              onChange={e => {
                onUpdate({
                  ...action,
                  target: e.target.value,
                });
              }}
              placeholder="Enter module ID"
            />
          </div>
        )}

        {(action.type === 'PRODUCE_RESOURCES' || action.type === 'CONSUME_RESOURCES') && (
          <>
            <div className="form-group">
              <label>Resource Type</label>
              <select
                value={action.target ?? ''}
                onChange={e => {
                  onUpdate({
                    ...action,
                    target: e.target.value,
                  });
                }}
              >
                <option value="">Select Resource</option>
                {[ResourceType.MINERALS, ResourceType.ENERGY, ResourceType.POPULATION, ResourceType.RESEARCH].map(resource => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                value={
                  typeof action.value === 'object' && 'amount' in action.value
                    ? action.value.amount
                    : typeof action.value === 'number'
                      ? action.value
                      : 0
                }
                onChange={e => {
                  onUpdate({
                    ...action,
                    value: { amount: Number(e.target.value) },
                  });
                }}
                min="0"
              />
            </div>
          </>
        )}

        {/* Add other action type editors here */}

        <div className="form-group">
          <label>Delay (ms)</label>
          <input
            type="number"
            value={action.delay ?? 0}
            onChange={e => {
              onUpdate({
                ...action,
                delay: Number(e.target.value),
              });
            }}
            min="0"
            step="100"
          />
        </div>
      </div>
    );
  }

  return null;
};

export default AutomationRuleEditor;
