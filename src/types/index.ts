/**
 * Core types and interfaces for the Service-Store SDK
 */

// Service identifier type
export type ServiceIdentifier = string | symbol | (new (...args: any[]) => any);

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
  bind<T>(identifier: ServiceIdentifier): any;
  get<T>(identifier: ServiceIdentifier): T;
  isBound(identifier: ServiceIdentifier): boolean;
  unbind(identifier: ServiceIdentifier): void;
  dispose(): void;
}

// Service registration
export interface ServiceRegistration {
  identifier: ServiceIdentifier;
  implementation: new (...args: any[]) => any;
}

// Store registration
export interface StoreRegistration {
  identifier: ServiceIdentifier;
  facade: IStoreFacade;
}

// Provider props
export interface ServiceProviderProps {
  services: ServiceRegistration[];
  stores: StoreRegistration[];
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
