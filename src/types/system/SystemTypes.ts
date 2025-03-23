/**
 * System configuration options for system initialization and runtime behavior
 */
export interface SystemOptions {
  /**
   * Enable or disable debug mode for the system
   */
  debug?: boolean;
  
  /**
   * System-specific configuration parameters
   */
  config?: Record<string, unknown>;
  
  /**
   * System dependencies that must be loaded before this system
   */
  dependencies?: string[];
  
  /**
   * Auto-start system on initialization
   */
  autoStart?: boolean;
} 