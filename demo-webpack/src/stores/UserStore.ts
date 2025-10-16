import { Injectable, StoreBase } from '@bookworm/service-store-sdk';
import { USER_STORE } from '../tokens';

type UserStoreState = {
  user: { id: string; name: string; email: string; role?: string } | null;
  loading: boolean
};

type UserStoreActions = {
  setUser: (user: { id: string; name: string; email: string; role?: string } | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void
};

@Injectable({ identifier: USER_STORE })
export class UserStore extends StoreBase<UserStoreState, UserStoreActions> {
  constructor() { 
    super(
      { user: null, loading: false },
      { persist: { key: 'UserStore', partialize: (s) => ({ user: s.user }) } }
    ); 
  }
  
  protected createActions(
    set: (partial: Partial<UserStoreState & UserStoreActions> | ((state: UserStoreState & UserStoreActions) => Partial<UserStoreState & UserStoreActions>)) => void,
    get: () => UserStoreState & UserStoreActions
  ) {
    return {
      setUser: (user: { id: string; name: string; email: string; role?: string } | null) => { 
        set({ user }); 
        this._info('User set in store', { user }); 
      },
      setLoading: (loading: boolean) => { 
        set({ loading }); 
        this._debug('Loading state changed', { loading }); 
      },
      clearUser: () => { 
        set({ user: null }); 
        this._info('User cleared from store'); 
      },
    };
  }

  // Computed properties
  public isLoggedIn(): boolean {
    return this.getComputed(s => !!s.user);
  }

  public isAdmin(): boolean {
    return this.getComputed(s => s.user?.role === 'admin');
  }

  public userName(): string | undefined {
    return this.getComputed(s => s.user?.name);
  }
}
