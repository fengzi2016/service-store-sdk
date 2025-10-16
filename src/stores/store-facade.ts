import { IStoreFacade } from '../types';

// Generic store abstraction
export interface IStateStore<T = unknown> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
  destroy?: () => void;
}

export interface IStoreFactory<TState, TActions> {
  create(
    initialState: TState,
    actionsFactory: (
      set: (partial: Partial<TState & TActions> | ((s: TState & TActions) => Partial<TState & TActions>)) => void,
      get: () => TState & TActions
    ) => Partial<TActions>
  ): IStateStore<TState & TActions>;
}

/**
 * Store facade implementation that wraps Zustand stores
 */
export class StoreFacade<T = unknown> implements IStoreFacade<T> {
  private store: IStateStore<T>;
  private listeners: Set<(state: T) => void> = new Set();

  constructor(store: IStateStore<T>) {
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
    unsubscribe = this.store.subscribe((state: T) => {
      this.listeners.forEach(listener => listener(state));
    });

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
  getStore(): IStateStore<T> {
    return this.store;
  }
}

/**
 * Create a store facade from any store that implements IStateStore
 */
export function createStoreFacade<T>(store: IStateStore<T>): IStoreFacade<T> {
  return new StoreFacade<T>(store);
}

/**
 * Create a store facade with custom methods
 */
export function createAdvancedStoreFacade<T>(
  store: IStateStore<T>,
  customMethods?: Record<string, (...args: unknown[]) => unknown>
): IStoreFacade<T> & Record<string, unknown> {
  const facade = new StoreFacade<T>(store);
  
  if (customMethods) {
    Object.assign(facade, customMethods);
  }
  
  return facade as unknown as IStoreFacade<T> & Record<string, unknown>;
}
