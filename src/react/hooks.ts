import { useCallback, useEffect, useRef, useState } from 'react';
import { useContainer } from './context';
import { ServiceIdentifier, IStoreFacade } from '../types';
import { DIStore } from '../stores/di-store';

/**
 * Hook to subscribe to store changes
 */
export function useStore<T>(identifier: ServiceIdentifier): [T, (partial: Partial<T>) => void] {
  const container = useContainer();
  const store = container.get<IStoreFacade<T>>(identifier);
  const [state, setState] = useState<T>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);

  const setStoreState = useCallback((partial: Partial<T>) => {
    store.setState(partial);
  }, [store]);

  return [state, setStoreState];
}

/**
 * Hook to get store state without subscription
 */
export function useStoreState<T>(identifier: ServiceIdentifier): T {
  const container = useContainer();
  const store = container.get<IStoreFacade<T>>(identifier);
  return store.getState();
}

/**
 * Hook to get store setter function
 */
export function useStoreSetter<T>(identifier: ServiceIdentifier): (partial: Partial<T>) => void {
  const container = useContainer();
  const store = container.get<IStoreFacade<T>>(identifier);
  
  return useCallback((partial: Partial<T>) => {
    store.setState(partial);
  }, [store]);
}

/**
 * Hook to create a service instance with manual dependency injection
 */
export function useServiceInstance<T>(
  implementation: new (...args: any[]) => T,
  ...args: any[]
): T {
  const container = useContainer();
  const instanceRef = useRef<T | null>(null);

  if (!instanceRef.current) {
    instanceRef.current = container.createServiceInstance(implementation, ...args);
  }

  useEffect(() => {
    return () => {
      if (instanceRef.current && typeof (instanceRef.current as any).dispose === 'function') {
        (instanceRef.current as any).dispose();
      }
    };
  }, []);

  return instanceRef.current;
}

/**
 * Hook to check if a service is bound
 */
export function useIsServiceBound(identifier: ServiceIdentifier): boolean {
  const container = useContainer();
  return container.isBound(identifier);
}

/**
 * Hook to get all bound service identifiers
 */
export function useBoundServices(): ServiceIdentifier[] {
  const container = useContainer();
  const [services, setServices] = useState<ServiceIdentifier[]>([]);

  useEffect(() => {
    setServices(container.getBoundIdentifiers());
  }, [container]);

  return services;
}

/**
 * Hook to use a DIStore with selector
 */
export function useDIStore<TStore extends DIStore<any, any>, TSelected>(
  storeIdentifier: ServiceIdentifier,
  selector: (state: ReturnType<TStore['getState']>) => TSelected
): TSelected {
  const container = useContainer();
  const store = container.get<TStore>(storeIdentifier);
  
  const [selected, setSelected] = useState<TSelected>(() => 
    selector(store.getState())
  );

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      setSelected(selector(state));
    });
    return unsubscribe;
  }, [store, selector]);

  return selected;
}
