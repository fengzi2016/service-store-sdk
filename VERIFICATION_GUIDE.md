# 自动搜集功能验证指南

## 🎯 要关注的关键对象

### 1. DependencyRegistry (依赖注册表)
- **位置**: `src/core/registry.ts`
- **作用**: 存储所有通过 `@Injectable` 装饰器注册的类
- **关键方法**:
  - `registerDependency()` - 注册依赖
  - `getDependencies()` - 获取所有依赖
  - `createInjectableDecorator()` - 创建自动注册装饰器

### 2. ServiceContainer (服务容器)
- **位置**: `src/core/service-container.ts`
- **作用**: 管理依赖注入和生命周期
- **关键方法**:
  - `autoRegister()` - 自动注册所有发现的依赖
  - `get()` - 解析服务实例
  - `registerService()` - 手动注册服务

### 3. Injectable 装饰器
- **位置**: `src/decorators/index.ts`
- **作用**: 自动注册类到依赖注册表
- **特点**: 无需手动指定标识符，基于类名自动生成

## 🔍 验证步骤

### 步骤1: 检查依赖注册
```typescript
import { DependencyRegistry } from './src/core/registry';

const registry = DependencyRegistry.getInstance();
const dependencies = registry.getDependencies();
console.log('注册的依赖:', Array.from(dependencies.keys()));
```

### 步骤2: 检查自动注册
```typescript
import { ServiceContainer } from './src/core/service-container';

const container = new ServiceContainer();
container.autoRegister();
console.log('已绑定的服务:', container.getBoundIdentifiers());
```

### 步骤3: 测试服务解析
```typescript
// 使用类构造函数作为标识符
const userService = useService<UserService>(UserService);
const configService = useService<ConfigService>(ConfigService);
```

## 📋 完整示例说明

### Services (3个)
1. **UserService** - 用户管理服务
   - 管理当前用户状态
   - 提供登录/登出功能
   - 自动注册标识符: `Symbol.for('UserService')`

2. **ConfigService** - 配置管理服务
   - 管理应用配置
   - 提供配置更新功能
   - 自动注册标识符: `Symbol.for('ConfigService')`

3. **NotificationService** - 通知服务
   - 依赖 UserService 和 ConfigService
   - 发送通知消息
   - 自动注册标识符: `Symbol.for('NotificationService')`

### Stores (3个)
1. **UserStore** - 用户状态存储
   - 基于 DIStore 实现
   - 管理用户状态和加载状态
   - 自动注册标识符: `Symbol.for('UserStore')`

2. **ThemeStore** - 主题状态存储
   - 管理主题、颜色、字体大小
   - 提供主题切换功能
   - 自动注册标识符: `Symbol.for('ThemeStore')`

3. **AppStore** - 应用状态存储
   - 管理应用初始化状态
   - 管理页面和通知
   - 自动注册标识符: `Symbol.for('AppStore')`

## 🚀 运行示例

### 方法1: 使用 React 组件
```tsx
import { App } from './src/examples/complete-demo';

// 在 React 应用中渲染
<App />
```

### 方法2: 直接测试服务
```typescript
import { ServiceContainer } from './src/core/service-container';
import { UserService, ConfigService } from './src/examples/complete-demo';

const container = new ServiceContainer();
container.autoRegister();

const userService = container.get<UserService>(UserService);
const configService = container.get<ConfigService>(ConfigService);
```

## ✅ 验证要点

1. **自动注册**: 所有 `@Injectable` 装饰的类都应该自动注册到容器
2. **依赖注入**: 服务之间的依赖关系应该正确解析
3. **类型安全**: 支持类构造函数作为标识符
4. **生命周期**: 服务应该有正确的生命周期管理
5. **日志功能**: 所有服务都应该有日志输出

## 🔧 调试技巧

1. **查看注册表**: 检查 `DependencyRegistry` 中注册的依赖
2. **查看容器**: 检查 `ServiceContainer` 中绑定的服务
3. **查看日志**: 观察服务创建和调用的日志输出
4. **类型检查**: 确保 TypeScript 类型检查通过

## 🎉 预期结果

- 所有服务都能正确自动注册
- 依赖注入正常工作
- 类型安全得到保证
- 日志输出显示服务创建和调用过程
- React 组件能正常使用服务

