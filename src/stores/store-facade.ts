import { IStoreFacade } from '../types';

/**
 * Store facade implementation that wraps Zustand stores
 */
export class StoreFacade<T = any> implements IStoreFacade<T> {
  private store: any;
  private listeners: Set<(state: T) => void> = new Set();

  constructor(store: any) {
    this.store = store;
  }

  /**
   * Get the current state
   */
  getState(): T {
    return this.store.getState();
  }

  /**
   * Set state (partial update)
   */
  setState(partial: Partial<T>): void {
    this.store.setState(partial);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener);
    
    // Subscribe to the store if it has a subscribe method
    let unsubscribe: (() => void) | undefined;
    if (typeof this.store.subscribe === 'function') {
      unsubscribe = this.store.subscribe((state: T) => {
        this.listeners.forEach(listener => listener(state));
      });
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  /**
   * Destroy the facade and clean up
   */
  destroy(): void {
    this.listeners.clear();
    if (typeof this.store.destroy === 'function') {
      this.store.destroy();
    }
  }

  /**
   * Get the underlying store (for advanced usage)
   */
  getStore(): any {
    return this.store;
  }
}

/**
 * Create a store facade from a Zustand store
 */
export function createStoreFacade<T>(store: any): IStoreFacade<T> {
  return new StoreFacade<T>(store);
}

/**
 * Create a store facade with custom methods
 */
export function createAdvancedStoreFacade<T>(
  store: any,
  customMethods?: Record<string, (...args: any[]) => any>
): IStoreFacade<T> & Record<string, any> {
  const facade = new StoreFacade<T>(store);
  
  if (customMethods) {
    Object.assign(facade, customMethods);
  }
  
  return facade as IStoreFacade<T> & Record<string, any>;
}
