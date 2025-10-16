/**
 * @refly/service-store-sdk
 * A unified Service->Store SDK that combines the best of both Refly and iCube architectures
 */

// Core exports
export { BaseService } from './core/base-service';
export { ServiceContainer } from './core/service-container';

// Decorators
export {
  Service,
  Inject,
  InjectStore,
  InjectLogger,
  Injectable,
  getServiceIdentifier,
  getInjectTokens,
  getInjectStoreTokens,
  getInjectLoggerTokens,
} from './decorators';

// React integration
export {
  ServiceProvider,
  useContainer,
  useService,
  useLogger,
} from './react/context';


// Store utilities
export {
  StoreFacade,
  createStoreFacade,
  createAdvancedStoreFacade,
  IStateStore,
  IStoreFactory,
} from './stores/store-facade';

export {
  StoreBase,
  setGlobalStoreFactory,
  getGlobalStoreFactory,
} from './stores/di-store';



// Logger
export {
  Logger,
  NoOpLogger,
  createLogger,
  LogLevel,
} from './utils/logger';

// Types
export type {
  ServiceIdentifier,
  IService,
  ILogger,
  IStoreFacade,
  IServiceContainer,
  ServiceRegistration,
  StoreRegistration,
  ServiceProviderProps,
  UseServiceReturn,
  UseContainerReturn,
  UseLoggerReturn,
  ServiceDecorator,
  InjectDecorator,
  InjectStoreDecorator,
  InjectLoggerDecorator,
  BaseServiceConstructor,
  StoreCreator,
  FacadeCreator,
} from './types';

// Constants
export { TYPES, METADATA_KEYS, DEFAULT_LOGGER_CONFIG } from './types/constants';

// Re-export reflect-metadata for decorator support
import 'reflect-metadata';
