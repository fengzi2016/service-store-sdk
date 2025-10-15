/**
 * Core types and interfaces for the Service-Store SDK
 */

// Service identifier type - can be class constructor, string, or symbol
export type ServiceIdentifier<T = any> = (new (...args: any[]) => T) | string | symbol;

// Service interface
export interface IService {
  readonly serviceName: string;
  dispose?(): void;
}

// Logger interface
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Store facade interface
export interface IStoreFacade<T = any> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
  destroy?(): void;
}

// Service container interface
export interface IServiceContainer {
  bind<T>(identifier: ServiceIdentifier<T>): any;
  get<T>(identifier: ServiceIdentifier<T>): T;
  isBound<T>(identifier: ServiceIdentifier<T>): boolean;
  unbind<T>(identifier: ServiceIdentifier<T>): void;
  dispose(): void;
}

// Service registration
export interface ServiceRegistration<T = any> {
  identifier: ServiceIdentifier<T>;
  implementation: new (...args: any[]) => T;
}

// Store registration
export interface StoreRegistration<T = any> {
  identifier: ServiceIdentifier<T>;
  facade: IStoreFacade;
}

// Provider props
export interface ServiceProviderProps {
  children: React.ReactNode;
}

// Hook return types
export type UseServiceReturn<T> = T;
export type UseContainerReturn = IServiceContainer;
export type UseLoggerReturn = ILogger;

// Decorator types
export type ServiceDecorator = (identifier: ServiceIdentifier) => ClassDecorator;
export type InjectDecorator = (identifier: ServiceIdentifier) => ParameterDecorator;
export type InjectStoreDecorator = (identifier: ServiceIdentifier) => ParameterDecorator;
export type InjectLoggerDecorator = () => ParameterDecorator;

// Base service constructor
export interface BaseServiceConstructor {
  new (...args: any[]): IService;
}

// Store creator function type
export type StoreCreator<T> = (set: any, get: any) => T;

// Facade creator function
export type FacadeCreator<T> = (store: any) => IStoreFacade<T>;
