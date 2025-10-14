import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { ServiceContainer } from '../core/service-container';
import { ServiceRegistration, StoreRegistration, ServiceProviderProps } from '../types';

/**
 * Service container context
 */
const ServiceContainerContext = createContext<ServiceContainer | null>(null);

/**
 * Service provider component
 */
export function ServiceProvider({ services, stores, children }: ServiceProviderProps) {
  const containerRef = useRef<ServiceContainer | null>(null);

  // Initialize container only once
  if (!containerRef.current) {
    containerRef.current = new ServiceContainer();
    
    // Auto-register all discovered services from registry
    containerRef.current.autoRegister();
    
    // Register stores first (manual registration takes precedence)
    stores.forEach(({ identifier, facade }) => {
      containerRef.current!.registerStore(identifier, facade);
    });

    // Register services (manual registration takes precedence)
    services.forEach(({ identifier, implementation }) => {
      containerRef.current!.registerService(identifier, implementation);
    });
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

/**
 * Hook to get a service instance
 */
export function useService<T>(identifier: string | symbol | (new (...args: any[]) => T)): T {
  const container = useContainer();
  
  // If identifier is a class constructor, use it directly
  if (typeof identifier === 'function') {
    return container.get<T>(identifier as any);
  }
  
  return container.get<T>(identifier);
}

/**
 * Hook to get the logger
 */
export function useLogger() {
  const container = useContainer();
  return container.get<any>(Symbol.for('Logger'));
}
