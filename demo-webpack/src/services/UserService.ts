import { Injectable, Inject, InjectLogger, BaseService, Logger } from '@bookworm/service-store-sdk';
import { UserStore } from '../stores/UserStore';
import { NotificationService } from './NotificationService';
import { USER_SERVICE, USER_STORE, NOTIFICATION_SERVICE } from '../tokens';

export interface IUserService {
  login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): any | null;
  isLoggedIn(): boolean;
  hasRole(role: string): boolean;
  updateProfile(updates: { name?: string; email?: string }): Promise<boolean>;
}



@Injectable({ identifier: USER_SERVICE })
export class UserService extends BaseService implements IUserService {
  constructor(
    @Inject(USER_STORE) private userStore: UserStore,
    @Inject(NOTIFICATION_SERVICE) private notificationService: NotificationService,
    @InjectLogger() logger?: Logger
  ) {
    super(logger);
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    this._info('Attempting login', { email });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      if (email === 'admin@example.com' && password === 'admin123') {
        const user = { id: '1', name: 'Admin User', email, role: 'admin' };
        this.userStore.setState({ user, loading: false });
        this.notificationService.sendWelcomeNotification(user);
        this._info('Login successful', { user });
        return { success: true, user };
      } else {
        this.userStore.setState({ loading: false });
        this._warn('Login failed: invalid credentials');
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      this.userStore.setState({ loading: false });
      this._error('Login error', { error });
      return { success: false, error: 'Login failed' };
    }
  }

  async logout(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this._info('Logging out user', { user: currentUser });
      this.userStore.setState({ user: null });
      this.notificationService.sendLogoutNotification(currentUser);
    }
  }

  getCurrentUser() {
    return this.userStore.getState().user;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  async updateProfile(updates: { name?: string; email?: string }): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      this._warn('Cannot update profile: user not logged in');
      return false;
    }

    try {
      this.userStore.setState({ loading: true });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...currentUser, ...updates };
      this.userStore.setState({ user: updatedUser, loading: false });
      this.notificationService.sendProfileUpdateNotification(updatedUser);
      this._info('Profile updated', { user: updatedUser });
      return true;
    } catch (error) {
      this.userStore.setState({ loading: false });
      this._error('Profile update failed', { error });
      return false;
    }
  }
}
