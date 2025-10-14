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
  constructor() {
    this.container = new Container();
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
    // Bind default logger
    this.container.bind<ILogger>(Symbol.for('Logger')).to(Logger).inSingletonScope();
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
    return this.container.get<T>(identifier);
  }

  /**
   * Check if a service is bound
   */
  isBound(identifier: ServiceIdentifier): boolean {
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
    const binding = this.bind<T>(identifier).to(implementation);
    
    if (scope === 'singleton') {
      binding.inSingletonScope();
    } else {
      binding.inTransientScope();
    }

    // Setup constructor injection
    this.setupConstructorInjection(implementation);
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
    const injectTokens = getInjectTokens(implementation);
    const injectStoreTokens = getInjectStoreTokens(implementation);
    const injectLoggerTokens = getInjectLoggerTokens(implementation);

    if (injectTokens.length > 0 || injectStoreTokens.length > 0 || injectLoggerTokens.length > 0) {
      // Use decorator metadata to setup injection
      this.container.bind(implementation).toSelf().whenTargetNamed('constructor');
    }
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
        dependencies[i] = this.get<ILogger>(Symbol.for('Logger'));
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
   */
  public autoRegister(): void {
    const registry = this.getDependencyRegistry();
    const dependencies = registry.getDependencies();
    
    dependencies.forEach((metadata, identifier) => {
      if (!this.isBound(identifier)) {
        const binding = this.bind(identifier as any).to(metadata.implementation);
        
        if (metadata.singleton) {
          binding.inSingletonScope();
        } else {
          binding.inTransientScope();
        }
        
        // Setup constructor injection
        this.setupConstructorInjection(metadata.implementation);
      }
    });
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
