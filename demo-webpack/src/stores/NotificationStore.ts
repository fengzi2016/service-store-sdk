import { Injectable, StoreBase } from '@bookworm/service-store-sdk';
import { NOTIFICATION_STORE } from '../tokens';

type NotificationStoreState = {
  history: string[]
};

type NotificationStoreActions = {
  addNotification: (notification: string) => void;
  clearHistory: () => void
};

@Injectable({ identifier: NOTIFICATION_STORE })
export class NotificationStore extends StoreBase<NotificationStoreState, NotificationStoreActions> {
  constructor() {
    super(
      { history: [] },
      { persist: { key: 'NotificationStore', partialize: (s) => ({ history: s.history }) } }
    );
  }
  
  protected createActions(
    set: (partial: Partial<NotificationStoreState & NotificationStoreActions> | ((state: NotificationStoreState & NotificationStoreActions) => Partial<NotificationStoreState & NotificationStoreActions>)) => void,
    get: () => NotificationStoreState & NotificationStoreActions
  ) {
    return {
      addNotification: (notification: string) => {
        const state = get();
        set({ history: [...state.history, notification] });
        this._info('Notification added', { notification });
      },
      clearHistory: () => {
        set({ history: [] });
        this._info('Notification history cleared');
      },
    };
  }
}
