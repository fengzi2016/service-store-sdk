import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { ServiceContainer } from '../core/service-container';
import { ServiceRegistration, StoreRegistration, ServiceProviderProps } from '../types';
import { getServiceIdentifier } from '../decorators';
import { Logger } from '../utils/logger';

/**
 * Service container context
 */
const ServiceContainerContext = createContext<ServiceContainer | null>(null);

/**
 * Service provider component
 */
export function ServiceProvider({ children }: ServiceProviderProps) {
  const containerRef = useRef<ServiceContainer | null>(null);

  // Initialize container only once
  if (!containerRef.current) {
    containerRef.current = new ServiceContainer();
    
    // Auto-register all discovered services from registry
    containerRef.current.autoRegister();
    
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.dispose();
      }
    };
  }, []);

  return (
    <ServiceContainerContext.Provider value={containerRef.current}>
      {children}
    </ServiceContainerContext.Provider>
  );
}

/**
 * Hook to get the service container
 */
export function useContainer(): ServiceContainer {
  const container = useContext(ServiceContainerContext);
  if (!container) {
    throw new Error('useContainer must be used within a ServiceProvider');
  }
  return container;
}
console.log("new gyf3")
/**
 * Hook to get a service instance
 * Supports both class constructors and symbols as identifiers
 */
export function useService<T>(identifier: (new (...args: any[]) => T) | symbol | string): T {
  const container = useContainer();
  // If a class constructor is provided, map to its configured identifier (symbol) if available
  if (typeof identifier === 'function') {
    const metaId = getServiceIdentifier(identifier as any) as any;
    return container.get<T>((metaId || identifier) as any);
  }
  return container.get<T>(identifier as any);
}

/**
 * Hook to get the logger
 */
export function useLogger() {
  const container = useContainer();
  return container.get<any>((Logger as unknown) as new () => any);
}
