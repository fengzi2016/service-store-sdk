import { BaseService } from '../core/base-service';
import { IStoreFacade } from '../types';
import { create } from 'zustand';

/**
 * DI Store base class that combines service lifecycle with Zustand store functionality
 */
export abstract class DIStore<TState = any, TActions = any> extends BaseService {
  private store: any;
  private facade: IStoreFacade<TState & TActions>;

  constructor(initialState: TState) {
    super();
    
    // Create Zustand store with the initial state and actions
    this.store = create<TState & TActions>((set, get) => {
      const actions = this.createActions(set, get);
      return {
        ...initialState,
        ...actions,
      } as TState & TActions;
    });

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
   * Get the underlying Zustand store
   */
  public getStore(): any {
    return this.store;
  }

  /**
   * Use store hook - returns a selector function
   */
  public useStore<U>(selector: (state: TState & TActions) => U): U {
    return this.store(selector);
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
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: TState & TActions) => void): () => void {
    return this.store.subscribe(listener);
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
