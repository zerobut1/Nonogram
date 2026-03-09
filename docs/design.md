# 🎮 数织游戏网站设计文档

> **版本**: v0.1.2  
> **最后更新**: 2026-03-09  
> **状态**: 核心功能已实现，图片生成功能待开发

---

## 1. 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **构建工具** | Vite | 5.x | 极速冷启动，原生 ESM |
| **语言** | TypeScript | 5.x | 静态类型，智能提示 |
| **样式** | CSS3 | - | 原生变量，现代布局 |
| **渲染** | Canvas 2D API | - | 高性能网格渲染 |
| **存储** | LocalStorage | - | 本地进度保存（待实现） |

---

## 2. 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
# 打开 http://localhost:3000
```

### 生产构建
```bash
npm run build
# 输出到 dist/ 目录
```

---

## 3. 已实现功能 ✅

### 3.1 核心游戏
- [x] 网格点击填充/标记 ✕
- [x] 鼠标拖拽连续填充
- [x] 双游戏模式（自由模式 / 纠错模式）
- [x] 错误输入 0.2 秒延迟纠正
- [x] 自动纠正格永久红色标记
- [x] 行列数字提示显示
- [x] 行列提示数字按段完成变灰
- [x] 实时胜利判定
- [x] 计时器功能
- [x] 完成度统计

### 3.2 历史操作
- [x] 撤销功能（Ctrl+Z）
- [x] 重做功能（Ctrl+Shift+Z）
- [x] 清空网格
- [x] 操作历史队列

### 3.3 用户界面
- [x] 游戏模式切换
- [x] 填充/标记模式切换
- [x] 题目选择菜单
- [x] 难度筛选（简单/中等/困难）
- [x] 胜利弹窗
- [x] 响应式布局（PC/移动端）
- [x] 键盘快捷键支持

### 3.4 预设题目
- [x] 6个预设题目
  - 3个简单（5x5）：爱心、星星、箭头
  - 2个简单（10x10）：猫咪、花朵
  - 1个中等（15x15）：房子
  - 1个困难（20x20）：大树

---

## 4. 待实现功能 📋

### 4.1 高优先级
- [ ] 本地存储（保存/恢复游戏进度）
- [ ] 图片上传生成数织
- [ ] 图片处理参数调节（网格大小、阈值、平滑）
- [ ] 提示系统（自动解答一行/列）

### 4.2 中优先级
- [ ] 触摸设备优化（长按、手势）
- [ ] 主题切换（深色/浅色模式）
- [ ] 音效系统
- [ ] 更多预设题目（目标20+）

### 4.3 低优先级
- [ ] 自定义题目导入/导出
- [ ] 分享功能
- [ ] 打印功能
- [ ] 成就系统

---

## 5. 系统架构

```
┌─────────────────────────────────────────────────┐
│                     UI Layer                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ Game    │  │ Settings│  │ Gallery │          │
│  │ View    │  │ Panel   │  │ (预设)  │          │
│  └────┬────┘  └────┬────┘  └────┬────┘          │
└───────┼────────────┼────────────┼────────────────┘
        │            │            │
        └────────────┴────────────┘
                    │
┌───────────────────┼──────────────────────────────┐
│              Core Layer                          │
│  ┌────────────────┼─────────────────────┐        │
│  │           Game Engine                  │        │
│  │  ┌─────────┐  ┌─────────┐  ┌────────┐│        │
│  │  │ State   │  │ Logic   │  │ Render ││        │
│  │  │ Manager │  │ Engine  │  │ Engine ││        │
│  │  └─────────┘  └─────────┘  └────────┘│        │
│  └───────────────────────────────────────┘        │
│  ┌───────────────────────────────────────┐        │
│  │      Generator Engine [待实现]         │        │
│  │  ┌─────────┐  ┌─────────┐             │        │
│  │  │ Image   │  │ Puzzle  │             │        │
│  │  │Processor│  │Generator│             │        │
│  │  └─────────┘  └─────────┘             │        │
│  └───────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│              Data Layer                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │ Presets │  │ Storage │  │ Config  │          │
│  │ (TS)    │  │(Local)  │  │ (JSON)  │          │
│  └─────────┘  └─────────┘  └─────────┘          │
└─────────────────────────────────────────────────┘
```

---

## 6. 数据模型

### 6.1 核心类型定义

```typescript
// 坐标
interface Position {
  row: number;
  col: number;
}

// 单元格状态
enum CellState {
  EMPTY = 0,    // 空白
  FILLED = 1,   // 已填充
  MARKED = 2,   // 标记X（确定不填充）
}

// 游戏模式
type GameMode = 'free' | 'assist';

// 游戏状态
interface GameState {
  grid: CellState[][];           // 当前网格
  solution: boolean[][];         // 正确答案
  rowHints: number[][];          // 行提示
  colHints: number[][];          // 列提示
  history: HistoryAction[];      // 操作历史
  historyIndex: number;          // 当前历史位置
  isComplete: boolean;           // 是否完成
  startTime: number;             // 开始时间
  elapsedTime: number;           // 经过时间（毫秒）
  correctedCells: boolean[][];   // 被自动纠正且永久标红的格子
  mode: GameMode;                // 当前游戏模式
}

// 历史操作（用于撤销）
interface HistoryAction {
  positions: Position[];
  oldStates: CellState[];
  newStates: CellState[];
  oldCorrectedStates: boolean[];
  newCorrectedStates: boolean[];
}

// 预设题目
interface PresetPuzzle {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution: boolean[][];
  thumbnail?: string;
}

// 图片生成配置
interface GeneratorConfig {
  gridSize: number;              // 网格大小 5-25
  threshold: number;             // 亮度阈值 0-255
  smoothing: boolean;            // 是否平滑边缘
  invert: boolean;               // 是否反色
}
```

---

## 7. 模块设计

### 7.1 核心游戏模块 (Game.ts) ✅

**位置**: `src/core/Game.ts`

**已实现功能**:
- 游戏状态管理
- 双模式玩法（自由 / 纠错）
- 单元格填充/标记
- 错误输入延迟自动纠正
- 永久红色纠正标记
- 撤销/重做系统
- 胜利判定
- 计时器

```typescript
class Game {
  constructor(puzzle: PresetPuzzle, options?: { mode?: GameMode });
  
  // 操作
  setCell(pos: Position, state: CellState): void;
  toggleCell(pos: Position, isFillMode: boolean): void;
  setCells(positions: Position[], state: CellState): void;
  
  // 历史
  undo(): boolean;
  redo(): boolean;
  clear(): void;
  
  // 查询
  getState(): GameState;
  canUndo(): boolean;
  canRedo(): boolean;
  getProgress(): number;
  formatTime(): string;
  
  // 事件
  onStateChange(callback: (state: GameState) => void): void;
  onWin(callback: () => void): void;
}
```

### 7.2 渲染引擎 (Renderer.ts) ✅

**位置**: `src/ui/Renderer.ts`

**已实现功能**:
- Canvas 自适应渲染
- 行列提示显示
- 行列提示数字按单个数字独立着色
- 网格线绘制（含5格粗线）
- 单元格状态渲染
- 坐标转换

```typescript
class Renderer {
  constructor(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>);
  
  render(state: GameState): void;
  getCellFromPosition(mouseX: number, mouseY: number): Position | null;
  updateConfig(config: Partial<RenderConfig>): void;
}
```

**提示数字变灰规则**:
- 每个提示数字独立计算完成状态，默认黑色，完成后显示为灰色。
- 单段提示如 `5`：只有该行或该列中，对应范围内所有格子都已被正确确认为黑格或叉时，数字才变灰。
- 多段提示如 `2 2`：从左向右检查“已正确确认前缀”，从右向左检查“已正确确认后缀”。
- 已正确确认前缀/后缀的定义：连续区域内没有 `EMPTY`，且每个格子都与答案一致。
- 前缀或后缀中已经形成的连续黑格段，会与对应侧的提示数字逐个匹配；匹配成功的数字变灰，未匹配的保持黑色。
- 典型示例：`1 1` 若左侧已经出现 `X + 黑格` 且都正确，则第一个 `1` 变灰；`2 2` 若左侧已经确认出 `黑黑`，且其左边不存在未确认格，则第一个 `2` 变灰。

### 7.3 图片处理器 (ImageProcessor.ts) 📋

**状态**: 待实现  
**位置**: `src/generator/ImageProcessor.ts`

```typescript
class ImageProcessor {
  async processImage(file: File, config: GeneratorConfig): Promise<ProcessedImage>;
  
  private loadImage(file: File): Promise<HTMLImageElement>;
  private resize(image: HTMLImageElement, size: number): ImageData;
  private toGrayscale(data: ImageData): Uint8Array;
  private applyThreshold(data: Uint8Array, threshold: number): boolean[];
  private smoothEdges(binary: boolean[], width: number): boolean[];
}
```

### 7.4 存储管理 (Storage.ts) 📋

**状态**: 待实现  
**位置**: `src/utils/storage.ts`

```typescript
class Storage {
  saveProgress(puzzleId: string, state: GameState): void;
  loadProgress(puzzleId: string): GameState | null;
  saveSettings(settings: UserSettings): void;
  loadSettings(): UserSettings;
}
```

---

## 8. 项目文件结构

```
nonogram/
├── docs/
│   └── design.md                 # 本设计文档
├── index.html                    # 入口页面 ✅
├── package.json                  # 项目配置 ✅
├── tsconfig.json                 # TS 配置 ✅
├── vite.config.ts                # Vite 配置 ✅
└── src/
    ├── main.ts                   # 应用入口 ✅
    ├── style.css                 # 全局样式 ✅
    ├── types/
    │   └── index.ts              # 类型定义 ✅
    ├── core/
    │   └── Game.ts               # 游戏核心 ✅
    ├── ui/
    │   └── Renderer.ts           # Canvas 渲染 ✅
    ├── data/
    │   └── presets.ts            # 预设题目 ✅
    ├── generator/                # 📋 待创建
    │   └── ImageProcessor.ts     # 图片处理
    └── utils/                    # 📋 待创建
        └── storage.ts            # 本地存储
```

---

## 9. 用户界面

### 9.1 当前界面

游戏主界面包含：
- **左侧**: Canvas 游戏区域（网格 + 提示数字）
- **右侧**: 控制面板
  - 游戏模式切换（自由模式 / 纠错模式）
  - 模式切换（填充/标记）
  - 操作按钮（撤销、重做、清空）
  - 统计信息（时间、完成度）
- **顶部**: 标题栏和菜单按钮
- **弹窗**: 题目选择菜单、胜利提示

### 9.2 操作说明

### 9.2 游戏模式说明

| 模式 | 规则 |
|------|------|
| 自由模式 | 玩家可自由填充/标记，只在最终完成时校验结果 |
| 纠错模式 | 错误输入会先停顿 0.2 秒，再自动纠正为正确状态，并永久显示为红色 |

### 9.3 操作说明

| 操作 | 功能 |
|------|------|
| 左键单击 | 根据当前模式填充或标记 |
| 右键单击 | 反向操作（填充↔标记） |
| 拖拽 | 连续填充/标记 |
| Z | 撤销 |
| Shift + Z | 重做 |
| F | 切换填充/标记模式 |
| R | 清空当前网格 |

---

## 10. 测试

### 10.1 手动测试清单

#### 核心功能测试
- [ ] 点击单元格正确填充/标记
- [ ] 拖拽连续填充正常工作
- [ ] 自由模式下允许错误状态保留到最终
- [ ] 纠错模式下错误输入会在 0.2 秒后自动纠正
- [ ] 自动纠正后的红色格子会永久保留
- [ ] 行列提示数字会按已确认前缀/后缀正确变灰
- [ ] `1 1`、`2 2` 等多段提示在只完成左段或右段时能部分变灰
- [ ] 撤销/重做功能正确
- [ ] 胜利判定准确
- [ ] 计时器正常运行

#### 界面测试
- [ ] 题目菜单正常弹出/关闭
- [ ] 难度筛选正常工作
- [ ] 胜利弹窗正确显示
- [ ] 响应式布局在移动端正常

#### 边界情况
- [ ] 快速连续点击不会出错
- [ ] 拖拽到网格外不会崩溃
- [ ] 切换题目后状态正确重置

### 10.2 单元测试（待添加）

推荐使用 **Vitest** 框架：

```bash
# 安装测试依赖
npm install -D vitest @vitest/ui jsdom @types/jsdom

# 运行测试
npm test

# 运行测试并查看 UI
npm run test:ui
```

测试文件位置：`src/**/*.test.ts`

---

## 11. 图片生成算法（设计）

### 11.1 处理流程

```typescript
async function generateFromImage(
  image: HTMLImageElement,
  config: GeneratorConfig
): Promise<boolean[][]> {
  
  // 1. 创建离屏 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = config.gridSize;
  canvas.height = config.gridSize;
  const ctx = canvas.getContext('2d')!;
  
  // 2. 缩放图片并绘制
  ctx.drawImage(image, 0, 0, config.gridSize, config.gridSize);
  
  // 3. 获取像素数据
  const imageData = ctx.getImageData(0, 0, config.gridSize, config.gridSize);
  const pixels = imageData.data;
  
  // 4. 灰度化 + 阈值处理
  const binary: boolean[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114;
    binary.push(gray < config.threshold);
  }
  
  // 5. 可选：平滑处理
  if (config.smoothing) {
    return smoothEdges(binary, config.gridSize);
  }
  
  // 6. 转为二维数组
  return arrayTo2D(binary, config.gridSize);
}
```

### 11.2 边缘平滑算法

```typescript
function smoothEdges(binary: boolean[], size: number): boolean[] {
  const result = [...binary];
  
  for (let i = 0; i < binary.length; i++) {
    const row = Math.floor(i / size);
    const col = i % size;
    
    // 统计邻居
    let neighbors = 0;
    let total = 0;
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          neighbors += binary[nr * size + nc] ? 1 : 0;
          total++;
        }
      }
    }
    
    // 如果周围多数为填充，则填充
    result[i] = neighbors > total / 2;
  }
  
  return result;
}
```

---

## 12. 部署

### 本地预览
```bash
npm run preview
```

### 静态托管
```bash
npm run build
# 部署 dist/ 目录到：
# - Vercel
# - Netlify
# - GitHub Pages
# - 任意静态服务器
```

---

## 13. 更新日志

### v0.1.1 (2026-03-09)
- ✅ 新增双游戏模式（自由模式 / 纠错模式）
- ✅ 新增纠错模式延迟自动纠正
- ✅ 新增永久红色纠正格标记
- ✅ 文档与当前实现同步

### v0.1.0 (2024-03-02)
- ✅ 初始化项目（Vite + TypeScript）
- ✅ 实现核心游戏逻辑（Game.ts）
- ✅ 实现 Canvas 渲染引擎（Renderer.ts）
- ✅ 实现撤销/重做系统
- ✅ 添加预设题目
- ✅ 实现题目选择菜单
- ✅ 添加键盘快捷键支持
- ✅ 响应式布局适配

---

## 14. 待解决问题

1. **触摸设备**: 当前主要支持鼠标操作，需要添加触摸手势支持
2. **本地存储**: 游戏进度无法保存，刷新页面会丢失
3. **图片生成**: 核心需求尚未实现
4. **测试覆盖**: 缺少自动化测试
5. **性能**: 大规模网格（20x20+）可能需要优化

---

*本文档持续更新，记录项目开发进度和技术决策。*
