import 'reflect-metadata';
import { ServiceIdentifier } from '../types';
import { METADATA_KEYS } from '../types/constants';
import { DependencyRegistry } from '../core/registry';

/**
 * Service decorator - marks a class as a service with a specific identifier
 */
export function Service(identifier: ServiceIdentifier): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(METADATA_KEYS.SERVICE, identifier, target);
    return target;
  };
}

/**
 * Inject decorator - marks a parameter for dependency injection (unified for services and stores)
 */
export function Inject(identifier: ServiceIdentifier): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingTokens = Reflect.getMetadata(METADATA_KEYS.INJECT, target) || [];
    existingTokens[parameterIndex] = identifier;
    Reflect.defineMetadata(METADATA_KEYS.INJECT, existingTokens, target);
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
 */
export function InjectLogger(): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingTokens = Reflect.getMetadata(METADATA_KEYS.INJECT_LOGGER, target) || [];
    existingTokens[parameterIndex] = true;
    Reflect.defineMetadata(METADATA_KEYS.INJECT_LOGGER, existingTokens, target);
  };
}

/**
 * Get service identifier from a class
 */
export function getServiceIdentifier(target: any): ServiceIdentifier | undefined {
  return Reflect.getMetadata(METADATA_KEYS.SERVICE, target);
}

/**
 * Get inject tokens from a class
 */
export function getInjectTokens(target: any): ServiceIdentifier[] {
  return Reflect.getMetadata(METADATA_KEYS.INJECT, target) || [];
}

/**
 * Get inject store tokens from a class
 */
export function getInjectStoreTokens(target: any): ServiceIdentifier[] {
  return Reflect.getMetadata(METADATA_KEYS.INJECT_STORE, target) || [];
}

/**
 * Get inject logger tokens from a class
 */
export function getInjectLoggerTokens(target: any): boolean[] {
  return Reflect.getMetadata(METADATA_KEYS.INJECT_LOGGER, target) || [];
}

/**
 * Injectable decorator - auto-registers services without manual identifier
 */
export const Injectable = DependencyRegistry.getInstance().createInjectableDecorator();