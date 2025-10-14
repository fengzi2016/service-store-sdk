/**
 * Common service identifiers and constants
 */

// Service identifiers
export const TYPES = {
  // Core services
  Logger: Symbol.for('Logger'),
  ServiceContainer: Symbol.for('ServiceContainer'),
  
  // Example services (commonly used)
  UserService: Symbol.for('UserService'),
  ChatService: Symbol.for('ChatService'),
  SessionService: Symbol.for('SessionService'),
  ChatActionsService: Symbol.for('ChatActionsService'),
  
  // Store identifiers
  UserStore: Symbol.for('UserStore'),
  ChatStore: Symbol.for('ChatStore'),
  SessionStore: Symbol.for('SessionStore'),
} as const;

// Metadata keys for decorators
export const METADATA_KEYS = {
  SERVICE: 'service:identifier',
  INJECT: 'inject:identifier',
  INJECT_STORE: 'inject:store:identifier',
  INJECT_LOGGER: 'inject:logger',
} as const;

// Default logger configuration
export const DEFAULT_LOGGER_CONFIG = {
  level: 'info' as const,
  context: 'ServiceStoreSDK',
} as const;
