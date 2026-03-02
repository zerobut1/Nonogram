# AGENTS.md - 数织游戏项目开发指南

## 项目概述

这是一个基于 Vite + TypeScript 的数织(Nonogram)游戏网站项目。

## 技术栈

- **构建工具**: Vite 5.x
- **语言**: TypeScript 5.x
- **样式**: 原生 CSS3 (CSS 变量)
- **渲染**: Canvas 2D API
- **模块系统**: ES Modules

## 常用命令

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 类型检查
npx tsc --noEmit
```

> **注意**: 当前项目未配置测试框架。如需添加测试，推荐安装 Vitest。

## 代码风格指南

### TypeScript 规范

- **缩进**: 2 个空格
- **引号**: 单引号 `'string'`
- **分号**: 必须添加
- **严格模式**: 开启 (tsconfig.json)

### 命名约定

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 类/接口/类型 | PascalCase | `Game`, `GameState` |
| 函数/变量 | camelCase | `getState()`, `isFillMode` |
| 常量 (导出) | UPPER_SNAKE_CASE | `PRESETS` |
| 私有成员 | 下划线前缀 (可选) | `_privateMethod` |
| 枚举成员 | UPPER_SNAKE_CASE | `CellState.EMPTY` |

### 类型定义

所有类型定义在 `src/types/index.ts`:

```typescript
// 使用接口定义对象结构
export interface Position {
  row: number;
  col: number;
}

// 使用枚举定义状态
export enum CellState {
  EMPTY = 0,
  FILLED = 1,
  MARKED = 2,
}

// 使用类型别名定义联合类型
type Difficulty = 'easy' | 'medium' | 'hard';
```

### 导入规范

```typescript
// 1. 第三方库
import { defineConfig } from 'vite';

// 2. 类型导入
import { Position, CellState } from '../types/index';

// 3. 核心模块
import { Game } from './core/Game';

// 4. 样式 (最后)
import './style.css';
```

### 类结构

```typescript
export class Game {
  // 1. 私有属性
  private state: GameState;
  private callbacks: (() => void)[] = [];

  // 2. 构造函数
  constructor(puzzle: PresetPuzzle) {
    // 初始化代码
  }

  // 3. 公共方法
  public getState(): GameState { }

  // 4. 私有方法
  private checkWin(): boolean { }
}
```

### 注释规范

```typescript
// 单行注释用于简单说明

/**
 * 多行注释用于函数/类说明
 * @param puzzle 题目数据
 * @returns 游戏实例
 */
```

### 错误处理

```typescript
// Canvas 上下文获取必须检查
const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('无法获取 Canvas 2D 上下文');
}

// 边界检查
private isValidPosition(pos: Position): boolean {
  const size = this.state.grid.length;
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
}
```

## 项目结构

```
src/
├── main.ts              # 应用入口
├── style.css            # 全局样式
├── types/
│   └── index.ts         # 类型定义
├── core/
│   └── Game.ts          # 游戏核心逻辑
├── ui/
│   └── Renderer.ts      # Canvas 渲染
├── data/
│   └── presets.ts       # 预设题目
├── generator/           # 图片生成 (待实现)
│   └── ImageProcessor.ts
└── utils/               # 工具函数 (待实现)
    └── storage.ts
```

## 开发注意事项

1. **Canvas 渲染**: 需考虑设备像素比 (DPR) 进行缩放
2. **性能优化**: 大型网格 (20x20+) 注意渲染性能
3. **移动端**: 需添加触摸事件支持
4. **存储**: LocalStorage 接口待实现
5. **图片生成**: 使用离屏 Canvas 处理像素数据

## 设计文档

详细设计参考 `docs/design.md`，包含:
- 数据模型定义
- 模块接口设计
- 图片生成算法
- 测试清单
