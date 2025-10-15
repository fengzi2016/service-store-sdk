# @bookworm/service-store-sdk 项目总结（更新版）

## 🎯 项目概述
一个基于 Inversify 的前端 Service + Store 架构 SDK，统一了依赖注入（DI）与状态管理（Zustand），支持自动注册、类→token 映射、懒代理化解循环依赖、Store 持久化与计算属性、React 无缝集成。

---
## 📁 项目结构（目录与核心实体）
```
src/
├── core/
│   ├── base-service.ts         # BaseService：提供日志与生命周期
│   ├── service-container.ts    # ServiceContainer：DI 容器、解析、懒代理
│   └── registry.ts             # DependencyRegistry：收集 @Injectable 元数据
├── decorators/
│   └── index.ts                # @Injectable/@Inject/@InjectLogger 及元数据访问
├── react/
│   ├── context.tsx             # <ServiceProvider/>、useContainer/useService
│   └── hooks.ts                # 额外 React hooks（保持向后兼容）
├── stores/
│   ├── di-store.ts             # DIStore：Zustand 封装、持久化与 getComputed
│   └── store-facade.ts         # IStoreFacade 与 Facade 工具
├── types/
│   ├── index.ts                # ServiceIdentifier、IService/IStoreFacade/ILogger 等
│   └── constants.ts            # 元数据 key 常量
└── utils/
    └── logger.ts              # Logger 与 NoOpLogger
```

---
## 🧱 数据结构与实体关系
- **DependencyRegistry（单例）**
  - Map<ServiceIdentifier, ServiceMetadata>
  - ServiceMetadata = { identifier, implementation, singleton }
  - 由 `@Injectable({ identifier?, singleton? })` 写入；同时在类上写入 `Reflect.defineMetadata(SERVICE, identifier)`

- **ServiceContainer（单例）**
  - 持有 Inversify `Container`
  - 关键集合：`instantiating: Set<any>`（当前正在构造的类）
  - 方法：
    - `autoRegister()`：遍历 DependencyRegistry，(re)bind identifier → `toDynamicValue(() => manuallyInstantiate(impl))`
    - `get(id)`：支持类→token 映射（`getServiceIdentifier(ctor) || ctor`）
    - `manuallyInstantiate(impl)`：按装饰器与设计期类型解析依赖，遇环返回懒代理
    - `createLazyProxy(id)`：首次访问再解析并升级为真实实例

- **Decorators**
  - `@Injectable(options)`：注册实现到 DependencyRegistry，并在类上记录 SERVICE 元数据
  - `@Inject(id)`：记录参数位的依赖标识（延迟在容器解析时读取）
  - `@InjectLogger()`：注入 Logger（若失败回退 NoOpLogger）

- **DIStore<TState, TActions>**
  - 封装 Zustand：`store` + `useStore(selector)`
  - `getComputed(selector)`：计算属性
  - `persist`：`{ key, partialize?, storage? }` 启动时恢复、更新后写入 storage

- **React 集成**
  - `<ServiceProvider>`：创建 `ServiceContainer`、执行 `autoRegister()`、Unmount 时 `dispose()`
  - `useService(id|ctor)`：取实例（类会映射到 token）

关系图（文字化）
- `@Injectable` → DependencyRegistry ← `ServiceContainer.autoRegister`
- `ServiceContainer.get` ↔ `getServiceIdentifier`（类→token）
- `ServiceContainer.manuallyInstantiate` → `Reflect.getMetadata(INJECT)` / `design:paramtypes`
- Logger 作为默认依赖由 `ServiceContainer` 启动时绑定
- `DIStore` 被 Service 依赖；组件通过 Service 拿到 Store 再渲染

---
## 🔑 核心逻辑说明
### 1) 标识符策略（类构造器与 symbol 并存）
- 注册：`@Injectable({ identifier: TOKEN })` 推荐使用 symbol，避免环依赖时的强引用
- 获取：`useService(Token)` 或 `useService(Class)`；若传类，容器使用类上的 SERVICE 元数据映射到 token

### 2) 自动注册与统一工厂
- `autoRegister()` 对每个条目执行 `(re)bind(identifier).toDynamicValue(() => manuallyInstantiate(impl))`
- 强制走 `manuallyInstantiate`，实现统一的装饰器解析与懒代理策略

### 3) 依赖解析顺序
- 读取参数位元数据：`INJECT`（来自 `@Inject`）
- 若缺失，则回退 `design:paramtypes`（TS emitDecoratorMetadata）作为标识符
- 对 Logger 参数特殊处理，优先解析 Logger
- 解析失败或发现环 → 返回 `createLazyProxy(identifier)`

### 4) 循环依赖的懒代理
- 若 A ↔ B 同时构造：`instantiating` 表示 B 尚未就绪
- 此时 A 注入到 B 的依赖返回懒代理：
  - 首次访问属性/方法 → 调用 `self.get(identifier)` 重试解析（支持类→token 映射）
  - 解析成功后升级为真实实例并缓存；未就绪时返回可重试函数/空值，避免抛错

### 5) Store 能力：持久化 + 计算属性
- 构造：`new DIStore(initialState, { persist?: { key, partialize?, storage? } })`
- 持久化：启动恢复、`setState` 后写入
- 计算属性：`getComputed(selector)` 用于派生值；也可在具体 Store 中提供面向业务的 computed API（如 `isAdmin()`）

---
## 🔗 典型调用链
1. 模块加载：类被 `@Injectable` 标注 → 写入 DependencyRegistry，并在类上写 SERVICE 元数据
2. 应用启动：`<ServiceProvider>` 创建容器并 `autoRegister()` 绑定所有依赖
3. 组件取用：`useService(ClassOrToken)` → 容器 `get()`（类→token 映射）→ 命中工厂 → `manuallyInstantiate()`
4. 解析注入：读取 `@Inject`/paramtypes，必要时返回懒代理
5. 业务运行：Service 只改 Store；组件只从 Store 渲染；`DIStore` 自动持久化与 computed

---
## 🧪 Demo 要点（当前示例）
- Services：UserService / ConfigService / NotificationService（示例展示业务方法）
- Stores：UserStore / ConfigStore / NotificationStore / ThemeStore / AppStore
- 组件：
  - ServiceDemo：按钮触发 Service 方法，渲染来自各 Store 的状态；演示 computed（isAdmin/isDark）
  - StoreDemo：直接操作 Store 状态

---
## ⚙️ 配置与运行
- 根：`npm run watch` 持续构建 dist
- demo-webpack：`npm start` 运行示例
- 注意装饰器配置（CRA 使用 craco 已集成）与 Node 版本（18）

---
## 📌 设计约束与建议
- 统一标识符：同一依赖在 `@Injectable/@Inject/useService` 应使用同一 token 或类（推荐 token）
- 环依赖存在时：尽量避免在构造期互相调用；调用点留给运行时懒解析
- 渲染只读 Store：组件不直接依赖 Service 返回值作为可渲染状态；Service 改 Store，组件读 Store

---
## ✅ 当前状态
- 类→token 映射、自动注册、懒代理、统一工厂已生效
- `DIStore` 已支持持久化与计算属性
- Demo 与 README 已对齐最新用法
