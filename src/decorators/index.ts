import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { ServiceIdentifier } from '../types';
import { METADATA_KEYS } from '../types/constants';
import { DependencyRegistry } from '../core/registry';
import { Logger } from '../utils/logger';

/**
 * Service decorator - marks a class as a service with a specific identifier
 * @deprecated Use @Injectable() instead
 */
export function Service(identifier: ServiceIdentifier): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(METADATA_KEYS.SERVICE, identifier, target);
    return target;
  };
}

/**
 * Inject decorator - marks a parameter for dependency injection
 * Defers Inversify's @inject to avoid circular dependency at decoration time
 */
export function Inject(identifier: ServiceIdentifier): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store the identifier in our own metadata first
    // We'll apply Inversify's @inject later in @Injectable
    console.log("gyf Inject", identifier)
    const lazyInjects = Reflect.getMetadata(METADATA_KEYS.INJECT, target) || [];
    lazyInjects[parameterIndex] = identifier;
    Reflect.defineMetadata(METADATA_KEYS.INJECT, lazyInjects, target);
  };
}

/**
 * InjectStore decorator - deprecated, use Inject instead
 * @deprecated Use Inject instead
 */
export function InjectStore(identifier: ServiceIdentifier): ParameterDecorator {
  return Inject(identifier);
}

/**
 * InjectLogger decorator - marks a parameter for logger injection
 * This is a custom feature that injects the Logger service
 */
export function InjectLogger(): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store Logger identifier in our own metadata (consistent with @Inject)
    const lazyInjects = Reflect.getMetadata(METADATA_KEYS.INJECT, target) || [];
    lazyInjects[parameterIndex] = Logger;
    Reflect.defineMetadata(METADATA_KEYS.INJECT, lazyInjects, target);
  };
}

/**
 * Get service identifier from a class
 */
export function getServiceIdentifier(target: any): ServiceIdentifier | undefined {
  return Reflect.getMetadata(METADATA_KEYS.SERVICE, target);
}

/**
 * Get inject tokens from a class (legacy support)
 */
export function getInjectTokens(target: any): ServiceIdentifier[] {
  return Reflect.getMetadata(METADATA_KEYS.INJECT, target) || [];
}

/**
 * Get inject store tokens from a class (legacy support)
 */
export function getInjectStoreTokens(target: any): ServiceIdentifier[] {
  return Reflect.getMetadata(METADATA_KEYS.INJECT_STORE, target) || [];
}

/**
 * Get inject logger tokens from a class (legacy support)
 */
export function getInjectLoggerTokens(target: any): boolean[] {
  return Reflect.getMetadata(METADATA_KEYS.INJECT_LOGGER, target) || [];
}

/**
 * Injectable decorator - auto-registers services and applies Inversify's @injectable
 * This is a wrapper that combines auto-registration with Inversify's native decorator
 */
export const Injectable = DependencyRegistry.getInstance().createInjectableDecorator();