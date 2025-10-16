## State Adapter 指南（如何为任意状态库适配 DIStore）

### 我们抽象了什么？
- **IStateStore<T>**：最小状态存取与订阅接口
  - `getState(): T`
  - `setState(partial: Partial<T>): void | void 0`
  - `subscribe(listener: (state: T) => void): () => void`
  - `destroy?: () => void`
- **IStoreFactory<TState, TActions>**：工厂接口，用于创建 `IStateStore<TState & TActions>`
  - `create(initialState: TState, actionsFactory: (set, get) => Partial<TActions>): IStateStore<TState & TActions>`

DIStore 仅依赖上述两个接口，不关心具体状态库（Zustand、Jotai 或自研）。

### 全局工厂
- 通过 `setGlobalStoreFactory(factory)` 设定全局默认的状态库适配器。
- 也可在某个 `DIStore` 子类构造时传入 `options.storeFactory` 覆盖。

### 计算属性与持久化
- 计算属性：使用 `store.useStore(selector)` 或 `store.getComputed(selector)`，与具体状态库无关。
- 持久化：DIStore 在 `setState` 后统一写入 `localStorage`（或自定义 storage），在构造时恢复；同样库无关。

---

### 总结

IStoreFactory：封装具体库的初始化、get、set、subscribe，输出统一的 IStateStore。

DIStore：负责通用流程与能力（统一初始化、useSyncExternalStore 订阅、persist、computed）。

业务 Store（如 ConfigStore）：只实现 createActions，写业务动作；用 actionsFactory 提供的 set/get 改/读状态。

配置：项目层用 setGlobalStoreFactory 选择底层库，业务层无需改动。

### 如何实现一个自定义 Adapter
实现 `IStoreFactory<TState, TActions>`：

1) 准备 initialState（TState）
2) 利用 `actionsFactory(set, get)` 生成 action 方法（Partial<TActions>）
3) 返回一个实现 `IStateStore<TState & TActions>` 的对象：
   - `getState()`：返回当前完整状态（含 actions）
   - `setState(partial)`：进行不可变更新（浅合并即可，深层更新放在 action 内）
   - `subscribe(listener)`：当状态变化时调用 listener(newState)
   - 可选 `destroy()` 清理资源

#### 示例：Zustand Adapter（用户项目内）
```ts
import { create } from 'zustand';
import { IStateStore, IStoreFactory } from '@bookworm/service-store-sdk';

export class ZustandAdapter<TState, TActions> implements IStoreFactory<TState, TActions> {
  create(initialState: TState, actionsFactory: (set: any, get: any) => Partial<TActions>): IStateStore<TState & TActions> {
    const zustandStore = create<TState & TActions>((set, get) => {
      const actions = actionsFactory(set, get);
      return { ...initialState, ...actions } as TState & TActions;
    });

    return {
      getState: () => zustandStore.getState(),
      setState: (partial) => zustandStore.setState(partial as any),
      subscribe: (listener) => zustandStore.subscribe(listener),
      destroy: () => zustandStore.destroy?.(),
    };
  }
}
export const zustandAdapter = new ZustandAdapter();
```

#### 示例：Jotai Adapter（用户项目内）
```ts
import { atom, createStore } from 'jotai';
import type { Getter, Setter } from 'jotai';
import { IStateStore, IStoreFactory } from '@bookworm/service-store-sdk';

export class JotaiAdapter<TState, TActions> implements IStoreFactory<TState, TActions> {
  create(initialState: TState, actionsFactory: (set: any, get: any) => Partial<TActions>): IStateStore<TState & TActions> {
    const store = createStore();
    const stateAtom = atom(initialState as TState & TActions);

    // 固定一次 actions 引用，避免在读取时创建新函数导致循环更新
    const actions = actionsFactory(
      (partial) => {
        const current = store.get(stateAtom);
        const patch = typeof partial === 'function' ? (partial as any)(current) : partial;
        store.set(stateAtom, { ...current, ...patch });
      },
      () => store.get(stateAtom)
    ) as Partial<TActions>;

    const combinedAtom = atom(
      (get: Getter) => ({ ...get(stateAtom), ...actions }) as TState & TActions,
      (_get: Getter, set: Setter, partial: Partial<TState & TActions>) => {
        const current = store.get(stateAtom);
        set(stateAtom, { ...current, ...partial });
      }
    );

    return {
      getState: () => store.get(combinedAtom),
      setState: (partial) => {
        const current = store.get(combinedAtom);
        const patch = typeof partial === 'function' ? (partial as any)(current) : partial;
        store.set(combinedAtom, { ...current, ...patch });
      },
      subscribe: (listener) => {
        let current = store.get(combinedAtom);
        return store.sub(combinedAtom, () => {
          const next = store.get(combinedAtom);
          if (next !== current) { current = next; listener(next); }
        });
      },
      destroy: () => {}
    };
  }
}
export const jotaiAdapter = new JotaiAdapter();
```

### 在项目中启用自定义 Adapter
```ts
import { setGlobalStoreFactory } from '@bookworm/service-store-sdk';
import { jotaiAdapter } from './adapters/jotai-adapter';

setGlobalStoreFactory(jotaiAdapter);
```

### 最佳实践
- 在 action 内进行所需的深层不可变更新；适配器层保持浅合并即可。
- 通过 `useStore(selector)` 精准订阅，减少无关渲染。
- 复杂状态尽量扁平化，避免频繁深层结构更新。

### 常见问题
- 无限渲染/警告：确保 `useSyncExternalStore` 的 `getSnapshot` 返回“原始可缓存状态”；不要在读取阶段创建新对象。
- 循环依赖：由 DI 层 Lazy Proxy 处理；与状态库选择无关。


