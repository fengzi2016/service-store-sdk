import { Injectable, DIStore } from '@bookworm/service-store-sdk';
import { CONFIG_STORE } from '../tokens';

type ConfigStoreState = {
  theme: string;
  language: string;
  apiUrl: string
};

type ConfigStoreActions = {
  updateConfig: (config: Partial<ConfigStoreState>) => void
};

@Injectable({ identifier: CONFIG_STORE })
export class ConfigStore extends DIStore<ConfigStoreState, ConfigStoreActions> {
  constructor() {
    super(
      { theme: 'light', language: 'en', apiUrl: 'https://api.example.com' },
      { persist: { key: 'ConfigStore', partialize: (s) => ({ theme: s.theme, language: s.language, apiUrl: s.apiUrl }) } }
    );
  }
  
  protected createActions(
    set: (partial: Partial<ConfigStoreState & ConfigStoreActions> | ((state: ConfigStoreState & ConfigStoreActions) => Partial<ConfigStoreState & ConfigStoreActions>)) => void,
    get: () => ConfigStoreState & ConfigStoreActions
  ) {
    return {
      updateConfig: (newConfig: Partial<ConfigStoreState>) => {
        set({ ...newConfig });
        this._info('Config updated', { config: get() });
      },
    };
  }
}
