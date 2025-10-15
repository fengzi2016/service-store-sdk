import { Container } from 'inversify';
import { IServiceContainer, ServiceIdentifier, IStoreFacade, ILogger } from '../types';
import { Logger } from '../utils/logger';
import { 
  getServiceIdentifier, 
  getInjectTokens, 
  getInjectStoreTokens, 
  getInjectLoggerTokens 
} from '../decorators';
import { DependencyRegistry } from './registry';

/**
 * Service container implementation based on Inversify
 */
export class ServiceContainer implements IServiceContainer {
  private container: Container;
  private disposed: boolean = false;
  private static instance: ServiceContainer;
  private instantiating: Set<any> = new Set(); // Track services being instantiated

  constructor() {
    // Create container with options to handle circular dependencies
    this.container = new Container({
      defaultScope: 'Singleton',
      autoBindInjectable: false,
      skipBaseClassChecks: true
    });
    this.setupDefaultServices();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }


  private dependencyRegistry?: DependencyRegistry;
  getDependencyRegistry(): DependencyRegistry {
    if (!this.dependencyRegistry) {
      this.dependencyRegistry = DependencyRegistry.getInstance();
    }
    return this.dependencyRegistry;
  }
  /**
   * Setup default services like logger
   */
  private setupDefaultServices(): void {
    // Bind default logger using class constructor as identifier
    this.container.bind<ILogger>(Logger).to(Logger).inSingletonScope();
  }

  initialize(): void {
    
  }

  /**
   * Bind a service implementation
   */
  bind<T>(identifier: ServiceIdentifier): any {
    if (this.disposed) {
      throw new Error('Container has been disposed');
    }
    return this.container.bind<T>(identifier);
  }

  /**
   * Get a service instance
   */
  get<T>(identifier: ServiceIdentifier): T {
    if (this.disposed) {
      throw new Error('Container has been disposed');
    }
    // Map class constructor to configured identifier (symbol) if present
    let mapped: any = identifier as any;
    if (typeof identifier === 'function') {
      const metaId = getServiceIdentifier(identifier as any) as any;
      mapped = metaId || identifier;
    }
    return this.container.get<T>(mapped);
  }

  /**
   * Check if a service is bound
   */
  isBound<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.container.isBound(identifier);
  }

  /**
   * Unbind a service
   */
  unbind(identifier: ServiceIdentifier): void {
    if (this.container.isBound(identifier)) {
      this.container.unbind(identifier);
    }
  }

  /**
   * Register a service class with automatic dependency injection
   */
  registerService<T>(
    identifier: ServiceIdentifier,
    implementation: new (...args: any[]) => T,
    scope: 'singleton' | 'transient' = 'singleton'
  ): void {
    // Bind via our factory that performs decorator-based constructor injection
    const binding = this.bind<T>(identifier).toDynamicValue(() => {
      return this.createServiceInstance<T>(implementation);
    });
    if (scope === 'singleton') {
      binding.inSingletonScope();
    }
  }

  /**
   * Register a store facade
   */
  registerStore<T>(
    identifier: ServiceIdentifier,
    facade: IStoreFacade<T>
  ): void {
    this.bind<IStoreFacade<T>>(identifier).toConstantValue(facade);
  }

  /**
   * Register a constant value
   */
  registerConstant<T>(
    identifier: ServiceIdentifier,
    value: T
  ): void {
    this.bind<T>(identifier).toConstantValue(value);
  }

  /**
   * Setup constructor injection for a service class
   */
  private setupConstructorInjection<T>(implementation: new (...args: any[]) => T): void {
    
  }

  /**
   * Create a service instance with manual dependency injection
   */
  createServiceInstance<T>(
    implementation: new (...args: any[]) => T,
    ...args: any[]
  ): T {
    const injectTokens = getInjectTokens(implementation);
    const injectStoreTokens = getInjectStoreTokens(implementation);
    const injectLoggerTokens = getInjectLoggerTokens(implementation);

    const dependencies: any[] = [];

    // Resolve dependencies in order
    for (let i = 0; i < Math.max(injectTokens.length, injectStoreTokens.length, injectLoggerTokens.length); i++) {
      if (injectTokens[i]) {
        dependencies[i] = this.get(injectTokens[i]);
      } else if (injectStoreTokens[i]) {
        dependencies[i] = this.get(injectStoreTokens[i]);
      } else if (injectLoggerTokens[i]) {
        dependencies[i] = this.get<ILogger>(Logger);
      } else if (args[i] !== undefined) {
        dependencies[i] = args[i];
      }
    }

    return new implementation(...dependencies);
  }

  /**
   * Get all bound identifiers
   */
  getBoundIdentifiers(): ServiceIdentifier[] {
    // Note: This is a simplified implementation
    // In a real scenario, you might need to track bound services manually
    return [];
  }

  /**
   * Auto-register all discovered services from registry
   * Uses custom instantiation to handle circular dependencies
   */
  public autoRegister(): void {
    const registry = this.getDependencyRegistry();
    const dependencies = registry.getDependencies();
    // First pass: register all services with custom factory
    dependencies.forEach((metadata) => {
      const identifier = metadata.identifier;
      const implementation = metadata.implementation;

      // Primary binding (token or ctor) → factory
      const hasBinding = this.isBound(identifier);
      const binder: any = hasBinding ? (this.container as any).rebind.bind(this.container) : this.bind.bind(this);
      const binding = binder(identifier).toDynamicValue(() => this.manuallyInstantiate(implementation));
      if (metadata.singleton) {
        binding.inSingletonScope();
      } else {
        binding.inTransientScope();
      }

      
    });
  }

  /**
   * Manually instantiate a class with dependency injection, handling circular dependencies
   */
  private manuallyInstantiate<T>(implementation: new (...args: any[]) => T): T {
    const { METADATA_KEYS } = require('../types/constants');
    const { Logger } = require('../utils/logger');
    // Check if we're already instantiating this class (circular dependency detected)
    if (this.instantiating.has(implementation)) {
      // Circular dependency detected: return a lazy proxy that resolves on demand
      const inferredId = getServiceIdentifier(implementation) || implementation;
      return this.createLazyProxy(inferredId);
    }

    // Mark as being instantiated
    this.instantiating.add(implementation);

    try {
      // Get injection metadata from our custom decorator
      const lazyInjects = Reflect.getMetadata(METADATA_KEYS.INJECT, implementation) || [];

      // Get Inversify's parameter types to know total parameter count
      const paramTypes = Reflect.getMetadata('design:paramtypes', implementation) || [];

      // Resolve dependencies
      const dependencies: any[] = [];

      // Process each parameter
      for (let index = 0; index < paramTypes.length; index++) {
        let identifier = lazyInjects[index];
        const paramType = paramTypes[index];

        // If identifier is undefined but we have type info, use the type as identifier
        if (!identifier && paramType && paramType !== Object) {
          identifier = paramType;
        }

        // Check if this is a Logger parameter
        if (identifier === Logger || paramType === Logger || paramType?.name === 'Logger') {
          // Logger injection - always resolve directly since it's registered at startup
          try {
            const loggerInstance = this.get(Logger);
            dependencies[index] = loggerInstance;
          } catch (error: any) {
            // Fallback to NoOpLogger
            dependencies[index] = new (require('../utils/logger').NoOpLogger)();
          }
        } else if (identifier) {
          // This is a @Inject decorated parameter (or inferred from type)
          if (this.instantiating.has(identifier)) {
            // Circular dependency! Use lazy proxy
            dependencies[index] = this.createLazyProxy(identifier);
          } else {
            try {
              // Try to get the dependency normally
              dependencies[index] = this.get(identifier);
            } catch (error: any) {
              // If we can't get it yet, use a lazy proxy
              dependencies[index] = this.createLazyProxy(identifier);
            }
          }
        } else {
          dependencies[index] = undefined;
        }
      }

      // Instantiate with dependencies
      const instance = new implementation(...dependencies);

      return instance;
    } finally {
      // Remove from instantiating set
      this.instantiating.delete(implementation);
    }
  }

  /**
   * Create a lazy proxy that resolves on first property access
   * Uses a deferred resolution pattern to handle circular dependencies
   */
  private createLazyProxy(identifier: any): any {
    const self = this;
    const state = {
      instance: null as any,
      resolved: false,
      attempting: false
    };

    // Create a deferred getter that will be called when the instance is actually needed
    const getInstance = () => {
      if (state.resolved && state.instance) {
        return state.instance;
      }

      if (state.attempting) {
        return null;
      }

      state.attempting = true;

      try {
        // Check if still instantiating - if so, we need to defer
        if (self.instantiating.has(identifier)) {
          state.attempting = false;
          return null;  // Return null instead of throwing
        }

        // Now safe to resolve via our mapped resolver (supports class→token)
        state.instance = self.get(identifier);
        console.log("gyf state.instance", identifier, state.instance)
        state.resolved = true;
        return state.instance;
      } catch (error: any) {
        return null;
      } finally {
        state.attempting = false;
      }
    };

    // Create the proxy - use empty function as target to make it callable
    const handler = {
      get(target: any, prop: string | symbol) {
        // Handle special properties that should not trigger resolution
        if (prop === 'constructor' || prop === 'then' || prop === Symbol.toStringTag ||
            prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
          return undefined;
        }

        // Get the actual instance
        const instance = getInstance();

        if (!instance) {
          // Return a function that will retry
          return function (...args: any[]) {
            const inst = getInstance();
            if (!inst) {
              throw new Error(`Cannot access ${String(prop)} on ${identifier?.name}: instance not resolved`);
            }
            const method = inst[prop];
            if (typeof method === 'function') {
              return method.apply(inst, args);
            }
            return method;
          };
        }

        const value = instance[prop];

        if (typeof value === 'function') {
          return value.bind(instance);
        }
        return value;
      },

    };

    const proxy = new Proxy({}, handler);
    return proxy;
  }

  /**
   * Dispose the container and clean up resources
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    // Note: In a real implementation, you would track and dispose services
    // For now, we'll just unbind all services

    this.container.unbindAll();
    this.disposed = true;
  }

  /**
   * Check if container is disposed
   */
  get isDisposed(): boolean {
    return this.disposed;
  }
}
