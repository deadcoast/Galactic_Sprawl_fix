import * as React from "react";
import { useEffect, useState } from 'react';
import { z } from 'zod';
import {
  ConfigItem,
  ConfigValidationError,
  createConfigItem,
  createConfigManager,
  createFeatureFlag,
  FeatureFlag,
  FeatureStatus,
  useFeatureFlag,
  useTypedConfig,
} from '../../../types/config/TypeSafeConfig';

// Create schema definitions for our config items
const themeSchema = z.enum(['light', 'dark', 'system']);
const pageSizeSchema = z.number().int().min(5).max(100);
const apiEndpointSchema = z.string().url();
const cacheTTLSchema = z.number().int().min(0).max(86400);
const loggingLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);
const notificationSchema = z.object({
  enabled: z.boolean(),
  sound: z.boolean().optional(),
  desktop: z.boolean().optional(),
  frequency: z.enum(['immediately', 'batched', 'daily']).optional(),
});

// Define our config items with schemas
const configItems = [
  createConfigItem('theme', themeSchema, 'system', {
    name: 'Theme',
    description: 'Application color theme',
    category: 'appearance',
    tags: ['ui', 'appearance'],
  }),
  createConfigItem('pageSize', pageSizeSchema, 20, {
    name: 'Page Size',
    description: 'Number of items to display per page',
    category: 'appearance',
    tags: ['ui', 'pagination'],
  }),
  createConfigItem('apiEndpoint', apiEndpointSchema, 'https://api.example.com/v1', {
    name: 'API Endpoint',
    description: 'Base URL for API requests',
    category: 'api',
    tags: ['api', 'connection'],
  }),
  createConfigItem('cacheTTL', cacheTTLSchema, 3600, {
    name: 'Cache TTL',
    description: 'Time to live for cached data in seconds',
    category: 'performance',
    tags: ['cache', 'performance'],
  }),
  createConfigItem('loggingLevel', loggingLevelSchema, 'info', {
    name: 'Logging Level',
    description: 'Minimum level for log messages',
    category: 'debugging',
    tags: ['logs', 'debugging'],
  }),
  createConfigItem(
    'notifications',
    notificationSchema,
    { enabled: true, sound: true, frequency: 'immediately' },
    {
      name: 'Notifications',
      description: 'Notification settings',
      category: 'notifications',
      tags: ['notifications', 'alerts'],
    }
  ),
];

// Define feature flags
const featureFlags = [
  createFeatureFlag('newDashboard', false, {
    name: 'New Dashboard',
    description: 'Enable the new dashboard interface',
    status: FeatureStatus.PREVIEW,
    targeting: {
      userRoles: ['admin', 'beta-tester'],
      percentageRollout: 20,
    },
  }),
  createFeatureFlag('advancedCharts', false, {
    name: 'Advanced Charts',
    description: 'Enable advanced chart visualizations',
    status: FeatureStatus.EXPERIMENTAL,
    targeting: {
      userRoles: ['admin', 'data-analyst'],
      environments: ['development', 'staging'],
    },
  }),
  createFeatureFlag('bulkOperations', true, {
    name: 'Bulk Operations',
    description: 'Enable bulk operations in list views',
    status: FeatureStatus.ENABLED,
  }),
  createFeatureFlag('aiSuggestions', false, {
    name: 'AI Suggestions',
    description: 'Enable AI-powered suggestions',
    status: FeatureStatus.BETA,
    targeting: {
      percentageRollout: 10,
      dateRange: {
        start: '2023-06-01',
        end: '2023-12-31',
      },
    },
  }),
  createFeatureFlag('legacyExport', true, {
    name: 'Legacy Export',
    description: 'Enable legacy export functionality',
    status: FeatureStatus.DEPRECATED,
  }),
];

// Define categories
const categories = [
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Visual appearance settings',
    items: [],
  },
  {
    id: 'api',
    name: 'API',
    description: 'API connection settings',
    items: [],
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Performance optimization settings',
    items: [],
  },
  {
    id: 'debugging',
    name: 'Debugging',
    description: 'Debugging and logging settings',
    items: [],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Notification settings',
    items: [],
  },
];

// Create a shared config manager instance
const configManager = createConfigManager({
  validateOnAccess: true,
  logErrors: true,
  onValidationError: errors => {
    console.warn('Config validation errors:', errors);
  },
  onConfigChange: (key, newValue, oldValue) => {
    console.warn(`Config changed: ${key}`, { oldValue, newValue });
  },
});

// Initialize the config manager
categories.forEach(category => configManager.registerCategory(category));
configManager.registerConfigs(configItems);
featureFlags.forEach(flag => configManager.registerFeature(flag));

// User roles for demo
const userRoles = ['user', 'admin', 'beta-tester', 'data-analyst'];
const environments = ['development', 'staging', 'production'];

const TypeSafeConfigDemo: React.FC = () => {
  const [validationErrors, setValidationErrors] = useState<ConfigValidationError[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');
  const [userId, setUserId] = useState<string>('user-123');
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [featureValues, setFeatureValues] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('appearance');
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [exportedConfig, setExportedConfig] = useState('');

  // Set user context whenever role, environment, or user ID changes
  useEffect(() => {
    configManager.setUserContext({
      role: selectedRole,
      environment: selectedEnvironment,
      id: userId,
    });

    // Update feature values
    setFeatureValues(configManager.exportFeatures());
  }, [selectedRole, selectedEnvironment, userId]);

  // Initial load of config values
  useEffect(() => {
    setConfigValues(configManager.exportConfig());
  }, []);

  // Handle config item selection
  const handleSelectConfig = (item: ConfigItem) => {
    setSelectedConfig(item);
    // Get current value and set as edit value
    const value = configManager.get(item.key);
    setEditValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  };

  // Handle value change
  const handleSaveValue = () => {
    if (!selectedConfig) return;

    // Parse the value based on the schema type
    let parsedValue: unknown;
    try {
      if (selectedConfig.schema instanceof z.ZodObject) {
        parsedValue = JSON.parse(editValue);
      } else if (selectedConfig.schema instanceof z.ZodNumber) {
        parsedValue = Number(editValue);
      } else if (selectedConfig.schema instanceof z.ZodBoolean) {
        parsedValue = editValue === 'true';
      } else {
        parsedValue = editValue;
      }

      // Update the config
      const result = configManager.set(selectedConfig.key, parsedValue);
      if (!result.valid) {
        setValidationErrors(result.errors);
      } else {
        setValidationErrors([]);
        setConfigValues(configManager.exportConfig());
      }
    } catch (err) {
      setValidationErrors([
        {
          key: selectedConfig.key,
          message: 'Invalid format: ' + (err instanceof Error ? err.message : String(err)),
        },
      ]);
    }
  };

  // Export config
  const handleExport = () => {
    const config = {
      settings: configManager.exportConfig(),
      features: configManager.exportFeatures(),
    };
    setExportedConfig(JSON.stringify(config, null, 2));
    setShowExport(true);
  };

  // Import config
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content);

        if (config.settings) {
          const result = configManager.importConfig(config.settings);
          if (!result.valid) {
            setValidationErrors(result.errors);
          } else {
            setValidationErrors([]);
            setConfigValues(configManager.exportConfig());
            setFeatureValues(configManager.exportFeatures());
          }
        }
      } catch (err) {
        setValidationErrors([
          {
            key: 'import',
            message: 'Invalid import file: ' + (err instanceof Error ? err.message : String(err)),
          },
        ]);
      }
    };
    reader.readAsText(file);
  };

  // Render feature flag status display
  const renderFeatureStatus = (flag: FeatureFlag) => {
    const isEnabled = featureValues[flag.key] || false;
    return (
      <div className={`feature-flag ${isEnabled ? 'enabled' : 'disabled'}`} key={flag.key}>
        <h4>{flag.name}</h4>
        <div className="feature-status">
          <span className={`status-badge ${flag.status.toLowerCase()}`}>{flag.status}</span>
          <span className={`enabled-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
            {isEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
        <p>{flag.description}</p>
        {flag.targeting && (
          <div className="targeting-info">
            {flag.targeting.userRoles && (
              <div className="targeting-detail">
                <span>Roles:</span> {flag.targeting.userRoles.join(', ')}
              </div>
            )}
            {flag.targeting.environments && (
              <div className="targeting-detail">
                <span>Environments:</span> {flag.targeting.environments.join(', ')}
              </div>
            )}
            {flag.targeting.percentageRollout !== undefined && (
              <div className="targeting-detail">
                <span>Rollout:</span> {flag.targeting.percentageRollout}%
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Example usage of the type-safe hooks
  const theme = useTypedConfig<typeof themeSchema>(configManager, 'theme', 'system');
  const pageSize = useTypedConfig<typeof pageSizeSchema>(configManager, 'pageSize', 20);
  const newDashboardEnabled = useFeatureFlag(configManager, 'newDashboard');

  return (
    <div className={`config-demo theme-${theme}`}>
      <h1>Type-Safe Configuration Demo</h1>

      <div className="demo-layout">
        <aside className="sidebar">
          <div className="user-context">
            <h3>User Context</h3>
            <div className="form-group">
              <label htmlFor="user-id">User ID:</label>
              <input
                id="user-id"
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-role">User Role:</label>
              <select
                id="user-role"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
              >
                {userRoles.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="environment">Environment:</label>
              <select
                id="environment"
                value={selectedEnvironment}
                onChange={e => setSelectedEnvironment(e.target.value)}
              >
                {environments.map(env => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="categories">
            <h3>Categories</h3>
            <ul>
              {categories.map(category => (
                <li
                  key={category.id}
                  className={selectedCategory === category.id ? 'active' : ''}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="actions">
            <button onClick={handleExport}>Export Configuration</button>
            <div className="import-container">
              <label htmlFor="import-file" className="import-label">
                Import Configuration
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="import-input"
              />
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="config-section">
            <h2>Configuration</h2>

            <div className="config-items">
              {configItems
                .filter(item => item.category === selectedCategory)
                .map(item => (
                  <div
                    key={item.key}
                    className={`config-item ${selectedConfig?.key === item.key ? 'selected' : ''}`}
                    onClick={() => handleSelectConfig(item)}
                  >
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <div className="config-value">
                      {typeof configValues[item.key] === 'object'
                        ? JSON.stringify(configValues[item.key])
                        : String(configValues[item.key])}
                    </div>
                    <div className="config-tags">
                      {item.tags?.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {selectedConfig && (
            <div className="config-editor">
              <h3>Edit {selectedConfig.name}</h3>

              <div className="editor-form">
                <div className="form-group">
                  <label htmlFor="config-value">Value:</label>
                  {selectedConfig.schema instanceof z.ZodObject ? (
                    <textarea
                      id="config-value"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      rows={10}
                    />
                  ) : selectedConfig.schema instanceof z.ZodEnum ? (
                    <select
                      id="config-value"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                    >
                      {(selectedConfig.schema as any)._def.values.map((val: string) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="config-value"
                      type={selectedConfig.schema instanceof z.ZodNumber ? 'number' : 'text'}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                    />
                  )}
                </div>

                <div className="editor-actions">
                  <button onClick={handleSaveValue}>Save</button>
                  <button onClick={() => setSelectedConfig(null)}>Cancel</button>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="validation-errors">
                  <h4>Validation Errors</h4>
                  <ul>
                    {validationErrors.map((error, index) => (
                      <li key={index}>
                        {error.key}: {error.message}
                        {error.path && <span> (Path: {error.path.join('.')})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="feature-section">
            <h2>Feature Flags</h2>
            <div className="feature-grid">
              {featureFlags.map(flag => renderFeatureStatus(flag))}
            </div>
          </div>

          <div className="demo-output">
            <h2>Active Configuration Demo</h2>
            <div className="output-example">
              <div className="example-item">
                <h4>Theme Setting</h4>
                <div className="example-value">{theme}</div>
                <div className="example-code">
                  <pre>
                    useTypedConfig&lt;typeof themeSchema&gt;(configManager, 'theme', 'system')
                  </pre>
                </div>
              </div>

              <div className="example-item">
                <h4>Page Size Setting</h4>
                <div className="example-value">{pageSize}</div>
                <div className="example-code">
                  <pre>
                    useTypedConfig&lt;typeof pageSizeSchema&gt;(configManager, 'pageSize', 20)
                  </pre>
                </div>
              </div>

              <div className="example-item">
                <h4>New Dashboard Feature Flag</h4>
                <div className="example-value">{newDashboardEnabled ? 'Enabled' : 'Disabled'}</div>
                <div className="example-code">
                  <pre>useFeatureFlag(configManager, 'newDashboard')</pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showExport && (
        <div className="modal-overlay">
          <div className="export-modal">
            <h3>Exported Configuration</h3>
            <pre className="export-content">{exportedConfig}</pre>
            <div className="modal-actions">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportedConfig);
                  alert('Copied to clipboard!');
                }}
              >
                Copy to Clipboard
              </button>
              <button onClick={() => setShowExport(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .config-demo {
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .theme-dark {
          background-color: #1e1e1e;
          color: #f0f0f0;
        }

        .theme-light {
          background-color: #ffffff;
          color: #333333;
        }

        .demo-layout {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }

        .sidebar {
          width: 250px;
          flex-shrink: 0;
        }

        .main-content {
          flex: 1;
        }

        .user-context,
        .categories,
        .actions {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .theme-dark .user-context,
        .theme-dark .categories,
        .theme-dark .actions {
          background-color: #2a2a2a;
        }

        h1,
        h2,
        h3,
        h4 {
          margin-top: 0;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .theme-dark input,
        .theme-dark select,
        .theme-dark textarea {
          background-color: #333;
          border-color: #555;
          color: #f0f0f0;
        }

        button {
          padding: 8px 16px;
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-right: 10px;
          transition: background-color 0.2s;
        }

        button:hover {
          background-color: #3a5ce5;
        }

        .categories ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .categories li {
          padding: 8px 12px;
          margin-bottom: 5px;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .categories li:hover {
          background-color: #eaeaea;
        }

        .theme-dark .categories li:hover {
          background-color: #3a3a3a;
        }

        .categories li.active {
          background-color: #4a6cf7;
          color: white;
        }

        .config-section,
        .feature-section,
        .demo-output {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .theme-dark .config-section,
        .theme-dark .feature-section,
        .theme-dark .demo-output {
          background-color: #2a2a2a;
        }

        .config-items {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .config-item {
          background-color: white;
          border-radius: 6px;
          padding: 15px;
          cursor: pointer;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .theme-dark .config-item {
          background-color: #333;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .config-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .theme-dark .config-item:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
        }

        .config-item.selected {
          border: 2px solid #4a6cf7;
          box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.3);
        }

        .config-item h4 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .config-item p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }

        .theme-dark .config-item p {
          color: #aaa;
        }

        .config-value {
          margin-top: 10px;
          padding: 8px;
          background-color: #f8f8f8;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .theme-dark .config-value {
          background-color: #222;
        }

        .config-tags {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .tag {
          font-size: 12px;
          padding: 3px 6px;
          background-color: #e7e7e7;
          border-radius: 12px;
          color: #666;
        }

        .theme-dark .tag {
          background-color: #444;
          color: #ddd;
        }

        .config-editor {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .theme-dark .config-editor {
          background-color: #333;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .editor-actions {
          margin-top: 15px;
        }

        .validation-errors {
          margin-top: 15px;
          padding: 15px;
          background-color: #f7e6e6;
          border-left: 4px solid #d93838;
          border-radius: 4px;
        }

        .theme-dark .validation-errors {
          background-color: #3a2a2a;
          border-left-color: #d93838;
        }

        .validation-errors h4 {
          margin-top: 0;
          color: #d93838;
        }

        .validation-errors ul {
          margin: 0;
          padding-left: 20px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .feature-flag {
          background-color: white;
          border-radius: 6px;
          padding: 15px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .theme-dark .feature-flag {
          background-color: #333;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .feature-status {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .status-badge,
        .enabled-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: a10px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-badge.enabled {
          background-color: #4caf50;
          color: white;
        }

        .status-badge.disabled {
          background-color: #f44336;
          color: white;
        }

        .status-badge.preview {
          background-color: #ff9800;
          color: white;
        }

        .status-badge.experimental {
          background-color: #9c27b0;
          color: white;
        }

        .status-badge.beta {
          background-color: #2196f3;
          color: white;
        }

        .status-badge.deprecated {
          background-color: #795548;
          color: white;
        }

        .enabled-badge.enabled {
          background-color: #4caf50;
          color: white;
        }

        .enabled-badge.disabled {
          background-color: #f44336;
          color: white;
        }

        .targeting-info {
          margin-top: 10px;
          font-size: 14px;
          padding: 10px;
          background-color: #f8f8f8;
          border-radius: 4px;
        }

        .theme-dark .targeting-info {
          background-color: #222;
        }

        .targeting-detail {
          margin-bottom: 5px;
        }

        .targeting-detail span {
          font-weight: bold;
          margin-right: 5px;
        }

        .demo-output {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
        }

        .theme-dark .demo-output {
          background-color: #333;
        }

        .output-example {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .example-item {
          flex: 1;
          min-width: 200px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 6px;
        }

        .theme-dark .example-item {
          background-color: #222;
        }

        .example-value {
          font-size: 20px;
          font-weight: bold;
          margin: 10px 0;
        }

        .example-code {
          margin-top: 10px;
          padding: 10px;
          background-color: #eaeaea;
          border-radius: 4px;
          overflow-x: auto;
        }

        .theme-dark .example-code {
          background-color: #1a1a1a;
        }

        pre {
          margin: 0;
          font-family: monospace;
          font-size: 13px;
          overflow-x: auto;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .export-modal {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .theme-dark .export-modal {
          background-color: #333;
        }

        .export-content {
          flex: 1;
          overflow: auto;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 4px;
          margin: 15px 0;
          font-family: monospace;
          white-space: pre-wrap;
        }

        .theme-dark .export-content {
          background-color: #222;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }

        .import-container {
          position: relative;
          margin-top: 10px;
        }

        .import-label {
          display: inline-block;
          padding: 8px 16px;
          background-color: #4a6cf7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .import-label:hover {
          background-color: #3a5ce5;
        }

        .import-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }
      `}</style>
    </div>
  );
};

export default TypeSafeConfigDemo;
