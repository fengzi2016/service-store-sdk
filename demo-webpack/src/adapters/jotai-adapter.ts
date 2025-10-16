// Example: How to create a Jotai adapter in your project
// File: src/adapters/jotai-adapter.ts

import { atom, createStore } from 'jotai';
import type { Getter, Setter } from 'jotai';
import { IStateStore, IStoreFactory } from '@bookworm/service-store-sdk';

/**
 * Jotai adapter factory that implements IStoreFactory
 * Install: npm install jotai
 */
export class JotaiAdapter<TState, TActions> implements IStoreFactory<TState, TActions> {
  create(
    initialState: TState,
    actionsFactory: (
      set: (partial: Partial<TState & TActions> | ((s: TState & TActions) => Partial<TState & TActions>)) => void,
      get: () => TState & TActions
    ) => Partial<TActions>
  ): IStateStore<TState & TActions> {
    // Create a Jotai store
    const jotaiStore = createStore();
    
    // Create the main atom
    const stateAtom = atom(initialState as TState & TActions);
    
    // Create actions ONCE to keep a stable reference across renders
    const actions = actionsFactory(
      (partial) => {
        const current = jotaiStore.get(stateAtom);
        if (typeof partial === 'function') {
          const newPartial = (partial as (s: TState & TActions) => Partial<TState & TActions>)(current);
          jotaiStore.set(stateAtom, { ...current, ...newPartial });
        } else {
          jotaiStore.set(stateAtom, { ...current, ...partial });
        }
      },
      () => jotaiStore.get(stateAtom)
    ) as Partial<TActions>;

    // Merge actions into the main state atom
    const combinedAtom = atom(
      (get: Getter) => {
        const state = get(stateAtom);
        // merge with stable actions reference to avoid re-creating functions
        return { ...state, ...actions } as TState & TActions;
      },
      (get: Getter, set: Setter, partial: Partial<TState & TActions>) => {
        const currentState = get(stateAtom);
        set(stateAtom, { ...currentState, ...partial });
      }
    );

    return {
      getState: () => jotaiStore.get(combinedAtom),
      setState: (partial) => {
        if (typeof partial === 'function') {
          const currentState = jotaiStore.get(combinedAtom);
          const newPartial = (partial as (s: TState & TActions) => Partial<TState & TActions>)(currentState);
          jotaiStore.set(combinedAtom, { ...currentState, ...newPartial });
        } else {
          const currentState = jotaiStore.get(combinedAtom);
          jotaiStore.set(combinedAtom, { ...currentState, ...partial });
        }
      },
      subscribe: (listener) => {
        let currentState = jotaiStore.get(combinedAtom);
        const unsubscribe = jotaiStore.sub(combinedAtom, () => {
          const newState = jotaiStore.get(combinedAtom);
          if (newState !== currentState) {
            currentState = newState;
            listener(newState);
          }
        });
        return unsubscribe;
      },
      destroy: () => {
        // Jotai stores don't need explicit cleanup
      }
    };
  }
}

/**
 * Default Jotai adapter instance
 */
export const jotaiAdapter = new JotaiAdapter();
