import { BaseService } from '../core/base-service';
import { useSyncExternalStore } from 'react';
import { IStoreFacade } from '../types';
import { IStateStore, IStoreFactory } from './store-facade';
import { create } from 'zustand';

/**
 * DI Store base class that combines service lifecycle with Zustand store functionality
 */
type PersistOptions<T> = {
  key: string;
  partialize?: (state: T) => Partial<T>;
  storage?: Storage;
};

type StoreOptions<TState, TActions> = {
  persist?: PersistOptions<TState & TActions>;
  storeFactory?: IStoreFactory<TState, TActions>;
};

// Global store factory configuration
let globalStoreFactory: IStoreFactory<unknown, unknown> | null = null;

/**
 * Set the global store factory for all DIStore instances
 */
export function setGlobalStoreFactory<TState, TActions>(factory: IStoreFactory<TState, TActions>): void {
  globalStoreFactory = factory as IStoreFactory<unknown, unknown>;
}

/**
 * Get the current global store factory
 */
export function getGlobalStoreFactory(): IStoreFactory<unknown, unknown> | null {
  return globalStoreFactory;
}

export abstract class StoreBase<TState = unknown, TActions = unknown> extends BaseService {
  private store: IStateStore<TState & TActions>;
  private facade: IStoreFacade<TState & TActions>;
  private persist?: PersistOptions<TState & TActions>;

  constructor(initialState: TState, options?: StoreOptions<TState, TActions>) {
    super();
    this.persist = options?.persist as PersistOptions<TState & TActions> | undefined;

    // Load persisted state (if enabled)
    let bootState = initialState as TState & Partial<TActions>;
    if (this.persist) {
      const storage = this.persist.storage || window.localStorage;
      try {
        const raw = storage.getItem(this.persist.key);
        if (raw) {
          const persisted = JSON.parse(raw) as Partial<TState>;
          bootState = { ...bootState, ...persisted };
        }
      } catch {}
    }
    
    // Create Zustand store with the initial state and actions
    // Use adapter factory if provided; otherwise fallback to Zustand
    const factory = options?.storeFactory || globalStoreFactory;
    
    if (factory) {
      this.store = (factory as IStoreFactory<TState, TActions>).create(
        bootState as TState,
        (set, get) => this.createActions(set, get)
      );
    } else {
      const zustandStore = create<TState & TActions>((set, get) => {
        const actions = this.createActions(set, get);
        return {
          ...bootState,
          ...actions,
        } as TState & TActions;
      });
      // Adapt Zustand store to IStateStore
      this.store = {
        getState: () => zustandStore.getState(),
        setState: (partial) => zustandStore.setState(partial),
        subscribe: (listener) => zustandStore.subscribe(listener),
      };
    }

    // Create facade for the store
    this.facade = this.createFacade();
  }

  /**
   * Create actions for the store
   * Override this method to define store actions
   */
  protected abstract createActions(
    set: (
      partial:
        | Partial<TState & TActions>
        | ((state: TState & TActions) => Partial<TState & TActions>)
    ) => void,
    get: () => TState & TActions
  ): Partial<TActions>;

  /**
   * Create store facade
   */
  private createFacade(): IStoreFacade<TState & TActions> {
    return {
      getState: () => this.store.getState(),
      setState: (partial: Partial<TState & TActions>) => this.store.setState(partial),
      subscribe: (listener: (state: TState & TActions) => void) => {
        return this.store.subscribe(listener);
      },
      destroy: () => {
        this.dispose();
      }
    };
  }

  /**
   * Get the store facade
   */
  public getFacade(): IStoreFacade<TState & TActions> {
    return this.facade;
  }

  /**
   * Get the underlying store (for advanced usage)
   */
  public getStore(): IStateStore<TState & TActions> {
    return this.store;
  }

  /**
   * Use store hook - returns a selector function
   */
  public useStore<U>(selector: (state: TState & TActions) => U): U {
    const subscribe = (onStoreChange: () => void) => this.store.subscribe(() => onStoreChange());
    // getSnapshot must return a cached/raw snapshot to avoid infinite loops
    const getSnapshot = () => this.store.getState();
    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return selector(state);
  }

  /**
   * Get current state
   */
  public getState(): TState & TActions {
    return this.store.getState();
  }

  /**
   * Set state
   */
  public setState(partial: Partial<TState & TActions>): void {
    this.store.setState(partial);
    // Persist after each state update (if enabled)
    if (this.persist) {
      const storage = this.persist.storage || window.localStorage;
      try {
        const state: TState & TActions = this.store.getState();
        const toSave = this.persist.partialize ? this.persist.partialize(state) : state;
        storage.setItem(this.persist.key, JSON.stringify(toSave));
      } catch {}
    }
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: TState & TActions) => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Compute a derived value from the current state without subscribing
   */
  public getComputed<U>(selector: (state: TState & TActions) => U): U {
    return selector(this.store.getState());
  }

  /**
   * Override dispose to clean up store
   */
  public dispose(): void {
    if (this.facade && typeof this.facade.destroy === 'function') {
      this.facade.destroy();
    }
    super.dispose();
  }
}


