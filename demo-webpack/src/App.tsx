import React from 'react';
import {
  ServiceProvider,
  useService,
  Injectable,
  DIStore,
  useDIStore,
  useContainer,
} from '@bookworm/service-store-sdk';

// Import services and stores
import { UserService } from './services/UserService';
import { ConfigService } from './services/ConfigService';
import { NotificationService } from './services/NotificationService';
import { UserStore } from './stores/UserStore';
import { ConfigStore } from './stores/ConfigStore';
import { NotificationStore } from './stores/NotificationStore';

import {
  THEME_STORE,
  APP_STORE,
} from './tokens';

// Additional stores for demo
type ThemeStoreState = { theme: 'light' | 'dark'; primaryColor: string; fontSize: number };
type ThemeStoreActions = { setTheme: (theme: 'light' | 'dark') => void; setPrimaryColor: (color: string) => void; setFontSize: (size: number) => void; resetTheme: () => void };

@Injectable({ identifier: THEME_STORE })
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

@Injectable({ identifier: APP_STORE })
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
  const userService = useService<UserService>(UserService);
  const configService = useService<ConfigService>(ConfigService);
  const notificationService = useService<NotificationService>(NotificationService);
  const userStore = useService<UserStore>(UserStore);
  const themeStore = useService(ThemeStore);
  const configStore = useService<ConfigStore>(ConfigStore);
  const notificationStore = useService<NotificationStore>(NotificationStore);

  // Use Store instance's useStore method to get reactive state
  const currentUser = userStore.useStore(s => s.user);
  const config = configStore.useStore(s => s); // read from store state
  const notificationCount = notificationStore.useStore(s => s.history.length);
  const recentNotifications = notificationStore.useStore(s => s.history.slice(-3));
  // computed examples
  const isAdmin = userStore.isAdmin();
  const isDark = themeStore.getComputed(s => s.theme === 'dark');

  const handleLogin = async () => {
    const result = await userService.login('admin@example.com', 'admin123');
    if (!result.success) {
      notificationService.sendErrorNotification(result.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await userService.logout();
  };

  const handleUpdateProfile = async () => {
    const success = await userService.updateProfile({ name: 'Updated Name' });
    if (!success) {
      notificationService.sendErrorNotification('Profile update failed');
    }
  };
  const container = useContainer();


  React.useEffect(() => {
    console.log('isBound USER_SERVICE', container.isBound(UserService));
  }, [container]);
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Enhanced Services Demo</h3>
      <p>Current User: {currentUser?.name || 'Not logged in'}</p>
      <p>User Role: {currentUser?.role || 'N/A'}</p>
      <p>Config: {JSON.stringify(config)}</p>
      <p>Computed isAdmin: {isAdmin ? 'Yes' : 'No'}</p>
      <p>Computed isDarkTheme: {isDark ? 'Yes' : 'No'}</p>
      <p>Notifications: {notificationCount} sent</p>
      <p>Recent: {recentNotifications.join(', ')}</p>
      <div>
        <button onClick={handleLogin}>Login as Admin</button>
        <button onClick={handleLogout}>Logout</button>
        <button onClick={handleUpdateProfile}>Update Profile</button>
        <button onClick={() => configService.updateConfig({ theme: 'dark', language: 'zh-CN' })}>Update Config</button>
        <button onClick={() => notificationService.sendNotification('Test notification!')}>Send Test Notification</button>
        <button onClick={() => notificationService.clearHistory()}>Clear Notifications</button>
      </div>
    </div>
  );
}

function StoreDemo() {
  const userStore = useService<UserStore>(UserStore);
  const themeStore = useService<ThemeStore>(ThemeStore);
  const appStore = useService<AppStore>(AppStore);
  const userName = userStore.useStore(s => s.user?.name || 'No user');
  const theme = themeStore.useStore(s => s.theme);
  const isInitialized = appStore.useStore(s => s.isInitialized);
  
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
      <h1>🚀 Enhanced Service Store SDK Demo</h1>
      <p>This demo shows complex Services with business logic and simple Stores for state management.</p>
      <ServiceDemo />
      <StoreDemo />
      <div style={{ padding: '20px', border: '1px solid #green', margin: '10px' }}>
        <h3>📝 Architecture Notes</h3>
        <p><strong>Services:</strong> Handle business logic, API calls, validation, and orchestration</p>
        <p><strong>Stores:</strong> Only manage state, no business logic</p>
        <p><strong>Separation:</strong> Services depend on Stores, Services provide business methods</p>
        <p>Check the browser console for detailed logs from services and stores.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ServiceProvider> 
      <CompleteDemo />
    </ServiceProvider>
  );
}

export default App;