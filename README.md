# @bookworm/service-store-sdk

一个用于前端 Service + Store 架构的 SDK。基于 Inversify（DI）与 Zustand（Store），支持：
- 自动注册（@Injectable 收集 → 容器 autoRegister 绑定）
- 标识符：支持 symbol 与类构造器（类会映射到配置的 symbol）
- 循环依赖容忍：懒代理首次访问时再解析为真实实例
- Store 能力：持久化（localStorage/自定义 storage）与计算属性（getComputed）
- React 集成：<ServiceProvider/>、useService、用 Service 拿到 Store 再渲染

## 安装
```bash
npm install @bookworm/service-store-sdk inversify reflect-metadata zustand
```
入口引入一次：
```ts
import 'reflect-metadata';
```

## 快速开始
### 定义 token
```ts
export const USER_SERVICE = Symbol.for('UserService');
export const USER_STORE = Symbol.for('UserStore');
```

### 定义 Store（持久化 + 计算属性）
```ts
import { Injectable, DIStore } from '@bookworm/service-store-sdk';
import { USER_STORE } from './tokens';

type State = { user: { id: string; name: string; role?: string } | null; loading: boolean };
@Injectable({ identifier: USER_STORE })
export class UserStore extends DIStore<State, {}> {
  constructor() {
    super(
      { user: null, loading: false },
      { persist: { key: 'UserStore', partialize: s => ({ user: s.user }) } }
    );
  }
  protected createActions(set, get) { return {}; }
  isLoggedIn() { return this.getComputed(s => !!s.user); }
  isAdmin() { return this.getComputed(s => s.user?.role === 'admin'); }
}
```

### 定义 Service（仅改动 Store）
```ts
import { Injectable, Inject, InjectLogger, BaseService } from '@bookworm/service-store-sdk';
import { USER_SERVICE, USER_STORE } from './tokens';
import { UserStore } from './stores/UserStore';

@Injectable({ identifier: USER_SERVICE })
export class UserService extends BaseService {
  constructor(@Inject(USER_STORE) private userStore: UserStore, @InjectLogger() logger?: any) { super(logger); }
  async login() { this.userStore.setState({ user: { id: '1', name: 'Admin', role: 'admin' }, loading: false }); }
}
```

### React 使用
```tsx
import { ServiceProvider, useService } from '@bookworm/service-store-sdk';
import { UserService } from './services/UserService';
import { UserStore } from './stores/UserStore';

function Demo() {
  const userService = useService(UserService);
  const userStore = useService(UserStore);
  const userName = userStore.useStore(s => s.user?.name || 'Guest');
  const isAdmin = userStore.isAdmin();
  return (
    <div>
      <p>User: {userName} / Admin: {isAdmin ? 'Yes' : 'No'}</p>
      <button onClick={() => userService.login()}>Login</button>
    </div>
  );
}

export default function App() {
  return (
    <ServiceProvider>
      <Demo />
    </ServiceProvider>
  );
}
```

## 设计要点
- 标识符
  - 推荐 symbol：`@Injectable({ identifier: TOKEN })` 与 `@Inject(TOKEN)`
  - 也可传类：`useService(MyClass)`；框架用类上的元数据映射到 token（若有配置）
- 自动注册
  - `@Injectable()` 收集实现；`ServiceProvider` 初始化时 `autoRegister()` 绑定
- 循环依赖
  - 冲突时返回“懒代理”，首次访问属性/方法时解析并升级为真实实例
- Store 渲染
  - 组件只从 Store 读取；Service 只修改 Store

## DIStore API
- 构造：`new DIStore(initialState, { persist?: { key, partialize?, storage? } })`
- `useStore(selector)`：组件选择状态片段
- `getState()/setState()`：读写状态
- `getComputed(selector)`：派生值
- 持久化：初始化恢复；更新后写入 storage（默认 localStorage）

## 运行 Demo
```bash
npm run watch   # 根目录构建 SDK
cd demo-webpack && npm start
```
