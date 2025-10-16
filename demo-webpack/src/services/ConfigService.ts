import { Injectable, Inject, InjectLogger, BaseService, Logger } from '@bookworm/service-store-sdk';
import { ConfigStore } from '../stores/ConfigStore';
import { UserService } from './UserService';
import { CONFIG_SERVICE, CONFIG_STORE, USER_SERVICE } from '../tokens';

export interface IConfigService {
  getConfig(): { theme: string; language: string; apiUrl: string };
  updateConfig(newConfig: Partial<{ theme: string; language: string; apiUrl: string }>): Promise<boolean>;
  getTheme(): string;
  getLanguage(): string;
  getApiUrl(): string;
  isDarkMode(): boolean;
  resetToDefaults(): Promise<void>;
}


@Injectable({ identifier: CONFIG_SERVICE })
export class ConfigService extends BaseService implements IConfigService {
  constructor(
    @Inject(CONFIG_STORE) private configStore: ConfigStore,
    @Inject(USER_SERVICE) private userService: UserService,
    @InjectLogger() logger?: Logger,
  ) {
    super(logger);
  }

  getConfig() {
    return this.configStore.getState();
  }

  async updateConfig(newConfig: Partial<{ theme: string; language: string; apiUrl: string }>): Promise<boolean> {
    try {
      this._info('Updating config', { newConfig });

      // Validate config
      if (newConfig.apiUrl && !this.isValidUrl(newConfig.apiUrl)) {
        this._warn('Invalid API URL provided', { url: newConfig.apiUrl });
        return false;
      }

      // Check if user has permission to change API URL (circular dependency test!)
      if (newConfig.apiUrl && !this.userService.hasRole('admin')) {
        this._warn('User lacks permission to change API URL');
        return false;
      }

      // Update store
      this.configStore.setState(newConfig);

      // Log config change for audit
      const user = this.userService.getCurrentUser();
      this._info('Config updated successfully', {
        newConfig,
        updatedBy: user?.name || 'anonymous'
      });

      return true;
    } catch (error) {
      this._error('Config update failed', { error });
      return false;
    }
  }

  getTheme(): string {
    return this.getConfig().theme;
  }

  getLanguage(): string {
    return this.getConfig().language;
  }

  getApiUrl(): string {
    return this.getConfig().apiUrl;
  }

  isDarkMode(): boolean {
    return this.getTheme() === 'dark';
  }

  async resetToDefaults(): Promise<void> {
    const defaultConfig = { 
      theme: 'light', 
      language: 'en', 
      apiUrl: 'https://api.example.com' 
    };
    
    this._info('Resetting config to defaults');
    this.configStore.setState(defaultConfig);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
