# @bookworm/service-store-sdk

A unified Service->Store SDK that combines the best of both bookworm and iCube architectures, built on top of the mature [Inversify](https://inversify.io/) dependency injection library.

## 🚀 Features

- **🔧 Mature DI**: Built on Inversify, the most popular TypeScript DI library
- **🔄 Lifecycle Management**: Automatic service disposal and cleanup
- **📦 Store Abstraction**: Clean facade pattern for Zustand stores
- **⚡ Type Safety**: Full TypeScript support with decorators
- **🎯 React Integration**: Seamless React hooks and providers
- **🛠️ Logger Support**: Built-in logging with context
- **🧪 Test Friendly**: Easy mocking and testing support

## 📦 Installation

```bash
npm install @bookworm/service-store-sdk
# or
yarn add @bookworm/service-store-sdk
# or
pnpm add @bookworm/service-store-sdk
```

## 🎯 Quick Start

### 1. Basic Setup

```tsx
import React from 'react';
import { create } from 'zustand';
import {
  ServiceProvider,
  useService,
  Service,
  InjectStore,
  InjectLogger,
  BaseService,
  createStoreFacade,
} from '@bookworm/service-store-sdk';

// Define your store
const useUserStore = create((set) => ({
  isLogin: false,
  userProfile: null,
  login: (profile) => set({ isLogin: true, userProfile: profile }),
  logout: () => set({ isLogin: false, userProfile: null }),
}));

// Define service interface
interface IUserService {
  isLoggedIn(): boolean;
  login(profile: any): void;
  logout(): void;
}

// Implement service - 使用字符串标识符，更简洁！
@Service('UserService')
class UserService extends BaseService implements IUserService {
  readonly serviceName = 'UserService';

  constructor(
    @InjectStore('UserStore') private userStore: any,
    @InjectLogger() private logger?: any
  ) {
    super(logger);
  }

  isLoggedIn(): boolean {
    return this.userStore.getState().isLogin;
  }

  login(profile: any): void {
    this.userStore.getState().login(profile);
    this._info('User logged in', { profile });
  }

  logout(): void {
    this.userStore.getState().logout();
    this._info('User logged out');
  }
}

// Use in your app
function App() {
  return (
    <ServiceProvider
      services={[
        { identifier: 'UserService', implementation: UserService },
      ]}
      stores={[
        { identifier: 'UserStore', facade: createStoreFacade(useUserStore) },
      ]}
    >
      <UserComponent />
    </ServiceProvider>
  );
}

function UserComponent() {
  // 直接使用字符串标识符，更简洁！
  const userService = useService<IUserService>('UserService');

  return (
    <div>
      {userService.isLoggedIn() ? (
        <button onClick={() => userService.logout()}>Logout</button>
      ) : (
        <button onClick={() => userService.login({ name: 'John' })}>Login</button>
      )}
    </div>
  );
}
```

### 2. Advanced Usage with Cross-Dependencies

```tsx
// Multiple services with dependencies
@Service(TYPES.ChatActionsService)
class ChatActionsService extends BaseService {
  constructor(
    @Inject(TYPES.UserService) private userService: IUserService,
    @Inject(TYPES.ChatService) private chatService: IChatService,
    @InjectLogger() private logger?: any
  ) {
    super(logger);
  }

  canSendMessage(): boolean {
    return this.userService.isLoggedIn();
  }

  sendMessage(content: string): void {
    if (!this.canSendMessage()) {
      this._warn('Cannot send message: user not logged in');
      return;
    }

    this.chatService.addMessage({ content, timestamp: new Date() });
    this._info('Message sent', { content });
  }
}
```

## 🏗️ Architecture

### Core Components

1. **Service Container**: Based on Inversify for robust DI
2. **Store Facade**: Clean abstraction over Zustand stores
3. **Lifecycle Management**: Automatic disposal and cleanup
4. **React Integration**: Hooks and providers for React apps

### Key Benefits

- **🔧 Mature Foundation**: Built on Inversify, battle-tested in production
- **🔄 Automatic Cleanup**: Services are automatically disposed
- **📦 Store Abstraction**: Clean separation between business logic and state
- **⚡ Type Safety**: Full TypeScript support with compile-time checks
- **🎯 React Optimized**: Designed specifically for React applications

## 📚 API Reference

### Decorators

```typescript
// Service decorator
@Service(TYPES.UserService)
class UserService extends BaseService { }

// Dependency injection
@Inject(TYPES.UserService)
private userService: IUserService;

// Store injection
@InjectStore(TYPES.UserStore)
private userStore: IStoreFacade;

// Logger injection
@InjectLogger()
private logger: ILogger;
```

### Hooks

```typescript
// Get service
const userService = useService<IUserService>(TYPES.UserService);

// Get container
const container = useContainer();

// Get logger
const logger = useLogger();

// Store hooks
const [state, setState] = useStore<T>(TYPES.UserStore);
const currentState = useStoreState<T>(TYPES.UserStore);
const setStoreState = useStoreSetter<T>(TYPES.UserStore);
```

### Store Facade

```typescript
// Create facade from Zustand store
const facade = createStoreFacade(useUserStore);

// Use facade
facade.getState();
facade.setState({ isLogin: true });
facade.subscribe((state) => console.log(state));
```

## 🧪 Testing

```typescript
import { ServiceContainer, TYPES } from '@bookworm/service-store-sdk';

// Create test container
const testContainer = new ServiceContainer();

// Mock services
testContainer.bindConstant(TYPES.UserService, mockUserService);
testContainer.bindConstant(TYPES.UserStore, mockStoreFacade);

// Use in tests
const userService = testContainer.get<IUserService>(TYPES.UserService);
```

## 🔄 Migration from Other Libraries

### From bookworm's Custom DI

```typescript
// Before
@Injectable({ identifier: IUserService })
class UserService {
  constructor(@InjectStore(IUserStore) private userStore: IStoreAccessor) {}
}

// After
@Service(TYPES.UserService)
class UserService extends BaseService {
  constructor(@InjectStore(TYPES.UserStore) private userStore: IStoreFacade) {
    super();
  }
}
```

### From iCube's DI

```typescript
// Before
@Injectable({ identifier: IChatService })
class ChatService extends Disposable {
  @Inject(ISessionService)
  protected _sessionService!: ISessionService;
}

// After
@Service(TYPES.ChatService)
class ChatService extends BaseService {
  constructor(
    @Inject(TYPES.SessionService) private sessionService: ISessionService,
    @InjectLogger() private logger?: ILogger
  ) {
    super(logger);
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Inversify](https://inversify.io/) - The amazing DI library this SDK is built on
- [Zustand](https://zustand-demo.pmnd.rs/) - The lightweight state management library
