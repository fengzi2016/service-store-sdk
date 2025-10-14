import React from 'react';
import {
  ServiceProvider,
  useService,
  Injectable,
  Inject,
  InjectLogger,
  BaseService,
  DIStore,
} from '../index';

// 定义服务接口
interface IUserService {
  getCurrentUser(): string;
  setCurrentUser(user: string): void;
}

interface IConfigService {
  getConfig(): { theme: string; language: string };
  updateConfig(config: { theme: string; language: string }): void;
}

// 自动注册的服务 - 无需手动指定标识符
@Injectable()
export class UserService extends BaseService implements IUserService {
  private currentUser: string = '';

  constructor(@InjectLogger() logger?: any) {
    super(logger);
  }

  getCurrentUser(): string {
    return this.currentUser;
  }

  setCurrentUser(user: string): void {
    this.currentUser = user;
    this._info('User updated', { user });
  }
}

@Injectable()
export class ConfigService extends BaseService implements IConfigService {
  private config = { theme: 'light', language: 'en' };

  constructor(@InjectLogger() logger?: any) {
    super(logger);
  }

  getConfig() {
    return this.config;
  }

  updateConfig(newConfig: { theme: string; language: string }): void {
    this.config = newConfig;
    this._info('Config updated', { config: newConfig });
  }
}

// 依赖其他服务的服务
@Injectable()
export class AppService extends BaseService {
  constructor(
    @Inject(UserService) private userService: IUserService,
    @Inject(ConfigService) private configService: IConfigService,
    @InjectLogger() logger?: any
  ) {
    super(logger);
  }

  initializeApp(): void {
    this._info('Initializing app');
    this.userService.setCurrentUser('John Doe');
    this.configService.updateConfig({ theme: 'dark', language: 'zh-CN' });
  }

  getAppInfo() {
    return {
      user: this.userService.getCurrentUser(),
      config: this.configService.getConfig(),
    };
  }
}

// DIStore 示例
interface AppStoreState {
  isInitialized: boolean;
  appInfo: any;
}

interface AppStoreActions {
  setInitialized: (initialized: boolean) => void;
  setAppInfo: (info: any) => void;
}

@Injectable()
export class AppStore extends DIStore<AppStoreState, AppStoreActions> {
  constructor() {
    super({
      isInitialized: false,
      appInfo: null,
    });
  }

  protected createActions(
    set: (partial: Partial<AppStoreState & AppStoreActions> | ((state: AppStoreState & AppStoreActions) => Partial<AppStoreState & AppStoreActions>)) => void,
    get: () => AppStoreState & AppStoreActions
  ) {
    return {
      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
        this._info('App initialization status changed', { initialized });
      },
      setAppInfo: (info: any) => {
        set({ appInfo: info });
        this._info('App info updated', { info });
      },
    };
  }
}

// 使用自动注册的组件
function AutoInjectableDemo() {
  // 直接使用类构造函数获取服务
  const userService = useService<IUserService>(UserService);
  const configService = useService<IConfigService>(ConfigService);
  const appService = useService<AppService>(AppService);
  const appStore = useService<AppStore>(AppStore);

  const handleInitialize = () => {
    appService.initializeApp();
    const appInfo = appService.getAppInfo();
    
    appStore.setState({
      isInitialized: true,
      appInfo,
    });
  };

  const handleUpdateUser = () => {
    userService.setCurrentUser('Jane Doe');
    const appInfo = appService.getAppInfo();
    appStore.setState({ appInfo });
  };

  const handleUpdateConfig = () => {
    configService.updateConfig({ theme: 'light', language: 'en' });
    const appInfo = appService.getAppInfo();
    appStore.setState({ appInfo });
  };

  const appState = appStore.useStore((s: any) => s);

  return (
    <div>
      <h2>Auto Injectable Demo</h2>
      
      <div>
        <h3>Services</h3>
        <p>Current User: {userService.getCurrentUser() || 'Not set'}</p>
        <p>Config: {JSON.stringify(configService.getConfig())}</p>
      </div>

      <div>
        <h3>Store State</h3>
        <p>Initialized: {appState.isInitialized ? 'Yes' : 'No'}</p>
        <p>App Info: {JSON.stringify(appState.appInfo)}</p>
      </div>

      <div>
        <h3>Actions</h3>
        <button onClick={handleInitialize}>Initialize App</button>
        <button onClick={handleUpdateUser}>Update User</button>
        <button onClick={handleUpdateConfig}>Update Config</button>
      </div>
    </div>
  );
}

// App 组件 - 无需手动注册服务
function App() {
  return (
    <ServiceProvider services={[]} stores={[]}>
      <AutoInjectableDemo />
    </ServiceProvider>
  );
}

export default App;
