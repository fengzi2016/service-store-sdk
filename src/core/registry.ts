import 'reflect-metadata';
import { injectable } from 'inversify';
import { ServiceIdentifier } from '../types';
import { METADATA_KEYS } from '../types/constants';

export type Constructor<T = any> = new (...args: any[]) => T;

export interface ServiceMetadata {
    identifier: ServiceIdentifier;
    implementation: Constructor;
    singleton: boolean;
}
export interface InjectableOptions {
    identifier?: string | symbol | Constructor<any>;
    singleton?: boolean;
}

export class DependencyRegistry {
  private static instance: DependencyRegistry;
  private dependencies: Map<ServiceIdentifier, ServiceMetadata> = new Map();
  private constructor() {}

  public static getInstance(): DependencyRegistry {
    if (!DependencyRegistry.instance) {
      DependencyRegistry.instance = new DependencyRegistry();
    }
    return DependencyRegistry.instance;
  }

  registerDependency<T>(identifier: ServiceIdentifier<T>, implementation: Constructor<T>, singleton: boolean = true) {
    this.dependencies.set(identifier, {
        identifier,
        implementation,
        singleton
    });
  }

  getDependencies() {
    return this.dependencies;
  }

  createInjectableDecorator() {
    const that = this;
    return function Injectable(options: InjectableOptions = {}) {
        return function<T extends Constructor> (target: T): T | void {
           // Register in our registry for auto-registration
           const identifier = options.identifier ?? target;
  
           that.registerDependency(identifier, target, options.singleton ?? true);

           // Persist identifier metadata for class→token mapping at resolve time
           Reflect.defineMetadata(METADATA_KEYS.SERVICE, identifier, target);

           // Apply Inversify's @injectable decorator
           injectable()(target);

           return target;
        }
    }
  }
}