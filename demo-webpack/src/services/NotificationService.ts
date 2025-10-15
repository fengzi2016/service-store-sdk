import { Injectable, Inject, InjectLogger, BaseService, Logger } from '@bookworm/service-store-sdk';
import { NotificationStore } from '../stores/NotificationStore';
import { UserService } from './UserService';
import { ConfigService } from './ConfigService';
import { CONFIG_SERVICE, NOTIFICATION_SERVICE, NOTIFICATION_STORE, USER_SERVICE } from '../tokens';

@Injectable({ identifier: NOTIFICATION_SERVICE })
export class NotificationService extends BaseService {
  constructor(
    @Inject(NOTIFICATION_STORE) private notificationStore: NotificationStore,
    @Inject(USER_SERVICE) private userService: UserService,
    @Inject(CONFIG_SERVICE) private configService: ConfigService,
    @InjectLogger() logger?: Logger
  ) { 
    super(logger); 
    console.log('userService methods', Object.keys(Object.getPrototypeOf(this.userService)));

  }

  sendNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
   
    const user = this.userService.getCurrentUser();
    const config = this.configService.getConfig();
    
    if (!user) {
      this._warn('Cannot send notification: user not logged in');
      return;
    }

    const timestamp = new Date().toISOString();
    const localizedMessage = this.localizeMessage(message, config.language);
    const fullMessage = `[${timestamp}] [${type.toUpperCase()}] ${user.name}: ${localizedMessage}`;
    
    this.notificationStore.setState({ 
      history: [...this.notificationStore.getState().history, fullMessage] 
    });
    
    this._info('Notification sent', { message: fullMessage, type });
  }

  sendWelcomeNotification(user: any): void {
    const welcomeMessage = `Welcome back, ${user.name}! You have ${user.role} privileges.`;
    this.sendNotification(welcomeMessage, 'info');
  }

  sendLogoutNotification(user: any): void {
    const logoutMessage = `User ${user.name} has logged out.`;
    this.sendNotification(logoutMessage, 'info');
  }

  sendProfileUpdateNotification(user: any): void {
    const updateMessage = `Profile updated for ${user.name}`;
    this.sendNotification(updateMessage, 'info');
  }

  sendErrorNotification(error: string): void {
    this.sendNotification(`Error: ${error}`, 'error');
  }

  sendWarningNotification(warning: string): void {
    this.sendNotification(`Warning: ${warning}`, 'warning');
  }

  getNotificationHistory(): string[] {
    return [...this.notificationStore.getState().history];
  }

  getRecentNotifications(count: number = 5): string[] {
    const history = this.getNotificationHistory();
    return history.slice(-count);
  }

  clearHistory(): void {
    this._info('Clearing notification history');
    this.notificationStore.setState({ history: [] });
  }

  getNotificationCount(): number {
    return this.getNotificationHistory().length;
  }

  getNotificationsByType(type: 'info' | 'warning' | 'error'): string[] {
    return this.getNotificationHistory().filter(notification => 
      notification.includes(`[${type.toUpperCase()}]`)
    );
  }

  private localizeMessage(message: string, language: string): string {
    // Simple localization logic
    const translations: Record<string, Record<string, string>> = {
      'zh-CN': {
        'Welcome back': '欢迎回来',
        'has logged out': '已登出',
        'Profile updated': '个人资料已更新',
        'Error': '错误',
        'Warning': '警告'
      }
    };

    if (language === 'zh-CN' && translations[language]) {
      let localizedMessage = message;
      Object.entries(translations[language]).forEach(([en, zh]) => {
        localizedMessage = localizedMessage.replace(en, zh);
      });
      return localizedMessage;
    }

    return message;
  }
}

