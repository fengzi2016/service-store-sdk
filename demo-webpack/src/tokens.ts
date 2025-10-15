/**
 * Service tokens for dependency injection
 * Using Symbol.for() creates global symbols that work across module boundaries
 */

// Service tokens
export const USER_SERVICE = Symbol.for('UserService');
export const NOTIFICATION_SERVICE = Symbol.for('NotificationService');
export const CONFIG_SERVICE = Symbol.for('ConfigService');
export const LOGGER = Symbol.for('Logger');

// Store tokens
export const USER_STORE = Symbol.for('UserStore');
export const THEME_STORE = Symbol.for('ThemeStore');
export const APP_STORE = Symbol.for('AppStore');
export const NOTIFICATION_STORE = Symbol.for('NotificationStore');
export const CONFIG_STORE = Symbol.for('ConfigStore');
