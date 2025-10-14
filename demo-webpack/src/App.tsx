import React from 'react';
import {
  ServiceProvider,
  useService,
  Injectable,
  Inject,
  InjectLogger,
  BaseService,
  DIStore,
  useDIStore,
} from '@bookworm/service-store-sdk';

@Injectable()
export class UserService extends BaseService {
  currentUser: { id: string; name: string; email: string } | null = null;
  constructor(@InjectLogger() logger?: any) { super(logger); }
  getCurrentUser() { return this.currentUser; }
  setCurrentUser(user: { id: string; name: string; email: string } | null) {
    this.currentUser = user;
    this._info('User updated', { user });
  }
  isLoggedIn() { return this.currentUser !== null; }
}

@Injectable()
export class ConfigService extends BaseService {
  config = { theme: 'light', language: 'en', apiUrl: 'https://api.example.com' };
  constructor(@InjectLogger() logger?: any) { super(logger); }
  getConfig() { return this.config; }
  updateConfig(newConfig: Partial<{ theme: string; language: string; apiUrl: string }>) {
    this.config = { ...this.config, ...newConfig };
    this._info('Config updated', { config: this.config });
  }
}

@Injectable()
export class NotificationService extends BaseService {
  private history: string[] = [];
  constructor(
    @Inject(UserService) private userService: UserService,
    @Inject(ConfigService) private configService: ConfigService,
    @InjectLogger() logger?: any
  ) { super(logger); }
  sendNotification(message: string) {
    const user = this.userService.getCurrentUser();
    const config = this.configService.getConfig();
    if (user) {
      const fullMessage = `[${config.language}] ${user.name}: ${message}`;
      this.history.push(fullMessage);
      this._info('Notification sent', { message: fullMessage });
    } else {
      this._warn('Cannot send notification: user not logged in');
    }
  }
  getNotificationHistory() { return [...this.history]; }
}

type UserStoreState = { user: { id: string; name: string; email: string } | null; loading: boolean };
type UserStoreActions = { setUser: (user: { id: string; name: string; email: string } | null) => void; setLoading: (loading: boolean) => void; clearUser: () => void };

@Injectable()
export class UserStore extends DIStore<UserStoreState, UserStoreActions> {
  constructor() { super({ user: null, loading: false }); }
  protected createActions(
    set: (partial: Partial<UserStoreState & UserStoreActions> | ((state: UserStoreState & UserStoreActions) => Partial<UserStoreState & UserStoreActions>)) => void,
    get: () => UserStoreState & UserStoreActions
  ) {
    return {
      setUser: (user: { id: string; name: string; email: string } | null) => { set({ user }); this._info('User set in store', { user }); },
      setLoading: (loading: boolean) => { set({ loading }); this._debug('Loading state changed', { loading }); },
      clearUser: () => { set({ user: null }); this._info('User cleared from store'); },
    };
  }
}

type ThemeStoreState = { theme: 'light' | 'dark'; primaryColor: string; fontSize: number };
type ThemeStoreActions = { setTheme: (theme: 'light' | 'dark') => void; setPrimaryColor: (color: string) => void; setFontSize: (size: number) => void; resetTheme: () => void };

@Injectable()
export class ThemeStore extends DIStore<ThemeStoreState, ThemeStoreActions> {
  constructor() { super({ theme: 'light', primaryColor: '#007bff', fontSize: 14 }); }
  protected createActions(
    set: (partial: Partial<ThemeStoreState & ThemeStoreActions> | ((state: ThemeStoreState & ThemeStoreActions) => Partial<ThemeStoreState & ThemeStoreActions>)) => void,
    get: () => ThemeStoreState & ThemeStoreActions
  ) {
    return {
      setTheme: (theme: 'light' | 'dark') => { set({ theme }); this._info('Theme changed', { theme }); },
      setPrimaryColor: (color: string) => { set({ primaryColor: color }); this._info('Primary color changed', { color }); },
      setFontSize: (size: number) => { set({ fontSize: size }); this._info('Font size changed', { size }); },
      resetTheme: () => { set({ theme: 'light', primaryColor: '#007bff', fontSize: 14 }); this._info('Theme reset to default'); },
    };
  }
}

type AppStoreState = { isInitialized: boolean; currentPage: string; notifications: string[] };
type AppStoreActions = { setInitialized: (initialized: boolean) => void; setCurrentPage: (page: string) => void; addNotification: (notification: string) => void; clearNotifications: () => void };

@Injectable()
export class AppStore extends DIStore<AppStoreState, AppStoreActions> {
  constructor() { super({ isInitialized: false, currentPage: 'home', notifications: [] }); }
  protected createActions(
    set: (partial: Partial<AppStoreState & AppStoreActions> | ((state: AppStoreState & AppStoreActions) => Partial<AppStoreState & AppStoreActions>)) => void,
    get: () => AppStoreState & AppStoreActions
  ) {
    return {
      setInitialized: (initialized: boolean) => { set({ isInitialized: initialized }); this._info('App initialization status changed', { initialized }); },
      setCurrentPage: (page: string) => { set({ currentPage: page }); this._info('Page changed', { page }); },
      addNotification: (notification: string) => { const state = get(); set({ notifications: [...state.notifications, notification] }); this._info('Notification added', { notification }); },
      clearNotifications: () => { set({ notifications: [] }); this._info('Notifications cleared'); },
    };
  }
}

function ServiceDemo() {
  const userService = useService(UserService);
  const configService = useService(ConfigService);
  const notificationService = useService(NotificationService);
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Services Demo</h3>
      <p>Current User: {userService.getCurrentUser()?.name || 'Not logged in'}</p>
      <p>Config: {JSON.stringify(configService.getConfig())}</p>
      <p>Notifications: {notificationService.getNotificationHistory().length} sent</p>
      <div>
        <button onClick={() => userService.setCurrentUser({ id: '1', name: 'John Doe', email: 'john@example.com' })}>Login</button>
        <button onClick={() => userService.setCurrentUser(null)}>Logout</button>
        <button onClick={() => configService.updateConfig({ theme: 'dark', language: 'zh-CN' })}>Update Config</button>
        <button onClick={() => notificationService.sendNotification('Hello from the app!')}>Send Notification</button>
      </div>
    </div>
  );
}

function StoreDemo() {
  const userStore = useService(UserStore);
  const themeStore = useService(ThemeStore);
  const appStore = useService(AppStore);
  const userName = useDIStore(UserStore, s => s.user?.name || 'No user');
  const theme = useDIStore(ThemeStore, s => s.theme);
  const isInitialized = useDIStore(AppStore, s => s.isInitialized);
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Stores Demo</h3>
      <p>User: {userName}</p>
      <p>Theme: {theme}</p>
      <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
      <div>
        <button onClick={() => userStore.setState({ user: { id: '1', name: 'Jane Doe', email: 'jane@example.com' }, loading: false })}>Set User</button>
        <button onClick={() => themeStore.setState({ theme: theme === 'light' ? 'dark' : 'light' })}>Toggle Theme</button>
        <button onClick={() => appStore.setState({ isInitialized: true, currentPage: 'dashboard' })}>Initialize App</button>
      </div>
    </div>
  );
}

function CompleteDemo() {
  return (
    <div>
      <h1>🚀 Service Store SDK Demo</h1>
      <p>This demo shows 3 Services and 3 Stores with automatic registration.</p>
      <ServiceDemo />
      <StoreDemo />
      <div style={{ padding: '20px', border: '1px solid #green', margin: '10px' }}>
        <h3>📝 Debug Info</h3>
        <p>Check the browser console for logs from services and stores.</p>
        <p>All services and stores are automatically registered via @Injectable decorator.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ServiceProvider services={[]} stores={[]}> 
      <CompleteDemo />
    </ServiceProvider>
  );
}

export default App;


