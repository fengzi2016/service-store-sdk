import { IStateStore, IStoreFactory } from './store-facade';

/**
 * Simple JavaScript adapter factory that implements IStoreFactory
 * Uses a basic event emitter pattern for state management
 * This is the default adapter with no external dependencies
 */
export class SimpleAdapter<TState, TActions> implements IStoreFactory<TState, TActions> {
  create(
    initialState: TState,
    actionsFactory: (
      set: (partial: Partial<TState & TActions> | ((s: TState & TActions) => Partial<TState & TActions>)) => void,
      get: () => TState & TActions
    ) => Partial<TActions>
  ): IStateStore<TState & TActions> {
    let state = initialState as TState & TActions;
    const listeners = new Set<(state: TState & TActions) => void>();

    // Create actions
    const actions = actionsFactory(
      (partial: Partial<TState & TActions> | ((s: TState & TActions) => Partial<TState & TActions>)) => {
        if (typeof partial === 'function') {
          state = { ...state, ...partial(state) };
        } else {
          state = { ...state, ...partial };
        }
        // Notify all listeners
        listeners.forEach(listener => listener(state));
      },
      () => state
    );

    // Merge actions into state
    state = { ...state, ...actions };

    return {
      getState: () => state,
      setState: (partial: Partial<TState & TActions>) => {
        state = { ...state, ...partial };
        // Notify all listeners
        listeners.forEach(listener => listener(state));
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      destroy: () => {
        listeners.clear();
      }
    };
  }
}

/**
 * Default Simple adapter instance
 */
export const simpleAdapter = new SimpleAdapter();
