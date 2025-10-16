// Example: How to create a Zustand adapter in your project
// File: src/adapters/zustand-adapter.ts

import { create, StoreApi } from 'zustand';
import { IStateStore, IStoreFactory } from '@bookworm/service-store-sdk';

/**
 * Zustand adapter factory that implements IStoreFactory
 * Install: npm install zustand
 */
export class ZustandAdapter<TState, TActions> implements IStoreFactory<TState, TActions> {
  create(
    initialState: TState,
    actionsFactory: (
      set: (partial: Partial<TState & TActions> | ((s: TState & TActions) => Partial<TState & TActions>)) => void,
      get: () => TState & TActions
    ) => Partial<TActions>
  ): IStateStore<TState & TActions> {
    const zustandStore = create<TState & TActions>((set, get) => {
      const actions = actionsFactory(set, get);
      return {
        ...initialState,
        ...actions,
      } as TState & TActions;
    });

    // Adapt Zustand store to IStateStore interface
    return {
      getState: () => zustandStore.getState(),
      setState: (partial) => zustandStore.setState(partial),
      subscribe: (listener) => zustandStore.subscribe(listener),
      destroy: () => {
        // Zustand stores don't need explicit cleanup
      }
    };
  }
}

/**
 * Default Zustand adapter instance
 */
export const zustandAdapter = new ZustandAdapter();
