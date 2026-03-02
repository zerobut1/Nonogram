# 🎮 数织游戏网站设计文档

## 1. 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **构建工具** | Vite | 5.x | 极速冷启动，原生 ESM |
| **语言** | TypeScript | 5.x | 静态类型，智能提示 |
| **样式** | CSS3 | - | 原生变量，现代布局 |
| **渲染** | Canvas 2D API | - | 高性能网格渲染 |
| **存储** | LocalStorage | - | 本地进度保存 |

---

## 2. 系统架构

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
│  │      Generator Engine                  │        │
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

## 3. 数据模型

### 3.1 核心类型定义

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
}

// 历史操作（用于撤销）
interface HistoryAction {
  positions: Position[];
  oldStates: CellState[];
  newStates: CellState[];
}

// 预设题目
interface PresetPuzzle {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution: boolean[][];
  thumbnail?: string;            // 预览图（可选）
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

## 4. 模块设计

### 4.1 核心游戏模块 (Game.ts)

**职责：** 管理游戏状态、处理用户输入、判定胜负

```typescript
class Game {
  // 状态
  private state: GameState;
  
  // 核心方法
  constructor(puzzle: PresetPuzzle | GeneratedPuzzle);
  
  // 操作
  fillCell(pos: Position): void;           // 填充单元格
  markCell(pos: Position): void;           // 标记X
  clearCell(pos: Position): void;          // 清空
  fillLine(start: Position, end: Position): void; // 拖拽填充
  
  // 历史
  undo(): boolean;                         // 撤销
  redo(): boolean;                         // 重做
  clearHistory(): void;                    // 清空历史
  
  // 验证
  checkWin(): boolean;                     // 检查胜利
  checkLine(line: number, isRow: boolean): boolean; // 检查单行/列
  
  // 事件
  onStateChange(callback: (state: GameState) => void): void;
  onWin(callback: () => void): void;
}
```

### 4.2 渲染引擎 (Renderer.ts)

**职责：** 将游戏状态渲染到 Canvas

```typescript
class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(container: HTMLElement, config: RenderConfig);
  
  // 渲染
  render(state: GameState): void;
  renderGrid(): void;                      // 渲染网格线
  renderCells(grid: CellState[][]): void;  // 渲染单元格
  renderHints(rowHints: number[][], colHints: number[][]): void;
  
  // 坐标转换
  getCellFromPosition(x: number, y: number): Position | null;
  
  // 动画
  highlightLine(index: number, isRow: boolean): void;
  animateWin(): void;
}
```

### 4.3 图片处理器 (ImageProcessor.ts)

**职责：** 将图片转换为数织谜题

```typescript
class ImageProcessor {
  // 处理流程
  async processImage(
    file: File, 
    config: GeneratorConfig
  ): Promise<ProcessedImage>;
  
  // 步骤
  private loadImage(file: File): Promise<HTMLImageElement>;
  private resize(image: HTMLImageElement, size: number): ImageData;
  private toGrayscale(data: ImageData): Uint8Array;
  private applyThreshold(data: Uint8Array, threshold: number): boolean[];
  private smoothEdges(binary: boolean[], width: number): boolean[];
  private generateHints(grid: boolean[][]): { row: number[][], col: number[][] };
}
```

### 4.4 存储管理 (Storage.ts)

```typescript
class Storage {
  private prefix = 'nonogram_';
  
  // 进度
  saveProgress(puzzleId: string, state: GameState): void;
  loadProgress(puzzleId: string): GameState | null;
  clearProgress(puzzleId: string): void;
  
  // 设置
  saveSettings(settings: UserSettings): void;
  loadSettings(): UserSettings;
  
  // 自定义题目
  saveCustomPuzzle(puzzle: PresetPuzzle): void;
  loadCustomPuzzles(): PresetPuzzle[];
}
```

---

## 5. 界面设计

### 5.1 页面结构

```
┌─────────────────────────────────────────────────────┐
│  Header                    [Settings] [Sound]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐    ┌───────────────────────┐  │
│  │                 │    │                       │  │
│  │   Game Board    │    │      Sidebar          │  │
│  │   (Canvas)      │    │  ┌─────────────────┐  │  │
│  │                 │    │  │  Preview        │  │  │
│  │   ┌───────┐     │    │  │  (完成图)        │  │  │
│  │   │Hints  │     │    │  └─────────────────┘  │  │
│  │   │       │     │    │  ┌─────────────────┐  │  │
│  │   │ Grid  │     │    │  │  Controls       │  │  │
│  │   │       │     │    │  │  [Fill] [Mark]  │  │  │
│  │   └───────┘     │    │  │  [Undo] [Redo]  │  │  │
│  │                 │    │  │  [Clear] [Hint] │  │  │
│  │                 │    │  └─────────────────┘  │  │
│  │                 │    │  ┌─────────────────┐  │  │
│  │                 │    │  │  Progress       │  │  │
│  │                 │    │  │  Time: 00:05:23 │  │  │
│  │                 │    │  │  Cells: 45/120  │  │  │
│  │                 │    │  └─────────────────┘  │  │
│  └─────────────────┘    └───────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Menu]  Presets | Custom | Generate from Image    │
└─────────────────────────────────────────────────────┘
```

### 5.2 菜单界面（预设题目选择）

```
┌─────────────────────────────────────────────────────┐
│              Select a Puzzle                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [All] [Easy ★] [Medium ★★] [Hard ★★★] [Custom]   │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ ▓▓░░▓▓  │ │ ▓▓▓▓▓▓  │ │ ▓░▓░▓░  │ │ [+Img]  │  │
│  │ ░░▓▓░░  │ │ ▓░░░░▓  │ │ ░▓░▓░▓  │ │         │  │
│  │ ▓▓░░▓▓  │ │ ▓▓▓▓▓▓  │ │ ▓░▓░▓░  │ │ Upload  │  │
│  │         │ │         │ │         │ │  Image  │  │
│  │ Heart   │ │ Star    │ │ Pattern │ │         │  │
│  │ 5x5 ★   │ │ 10x10 ★ │ │ 15x15★★ │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.3 图片生成配置界面

```
┌─────────────────────────────────────────────────────┐
│         Generate from Image                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Upload Image]                                     │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │                 │  │  Grid Size: [15] ▲▼     │  │
│  │   Preview       │  │      (5 - 25)           │  │
│  │   (Original)    │  │                         │  │
│  │                 │  │  Threshold: [128] ─────○│  │
│  │                 │  │      (0 - 255)          │  │
│  │                 │  │                         │  │
│  └─────────────────┘  │  [✓] Smooth Edges       │  │
│                       │  [ ] Invert Colors      │  │
│  ┌─────────────────┐  │                         │  │
│  │   Result        │  │  ┌─────────────────┐    │  │
│  │   Preview       │  │  │ ▓▓░░▓▓░░▓▓░░   │    │  │
│  │   (Grid)        │  │  │ ░░▓▓░░▓▓░░▓▓   │    │  │
│  │                 │  │  │ ▓▓░░▓▓░░▓▓░░   │    │  │
│  └─────────────────┘  │  └─────────────────┘    │  │
│                       │                         │  │
│                       │  [Generate] [Play Now]  │  │
│                       └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 6. 游戏交互逻辑

### 6.1 操作模式

| 模式 | 鼠标左键 | 鼠标右键 | 触摸操作 |
|------|----------|----------|----------|
| **填充模式** | 填充单元格 | 标记X | 单击切换 |
| **标记模式** | 标记X | 填充单元格 | 长按菜单选择 |
| **拖拽** | 连续填充 | - | 不支持 |

### 6.2 键盘快捷键

| 按键 | 功能 |
|------|------|
| `Z` | 撤销 |
| `Shift + Z` | 重做 |
| `F` | 切换填充/标记模式 |
| `H` | 显示提示（高亮可确定单元格） |
| `R` | 重新开始当前谜题 |
| `S` | 保存进度 |

### 6.3 胜利判定算法

```typescript
function checkWin(grid: CellState[][], solution: boolean[][]): boolean {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      const isFilled = grid[row][col] === CellState.FILLED;
      const shouldFill = solution[row][col];
      
      // 必须填充的必须已填充
      if (shouldFill && !isFilled) return false;
      
      // 不能填充的不能已填充
      if (!shouldFill && isFilled) return false;
    }
  }
  return true;
}
```

---

## 7. 图片生成算法

### 7.1 处理流程

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
  
  // 5. 可选：平滑处理（去除孤立像素）
  if (config.smoothing) {
    return smoothEdges(binary, config.gridSize);
  }
  
  // 6. 转为二维数组
  return arrayTo2D(binary, config.gridSize);
}
```

### 7.2 边缘平滑算法

```typescript
function smoothEdges(
  binary: boolean[], 
  size: number
): boolean[] {
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
    
    // 如果周围多数为填充，则填充；反之亦然
    result[i] = neighbors > total / 2;
  }
  
  return result;
}
```

---

## 8. 预设题目设计

### 8.1 题目规格

| 难度 | 大小 | 数量 | 示例 |
|------|------|------|------|
| 入门 | 5x5 | 3个 | 心形、星形、箭头 |
| 简单 | 10x10 | 4个 | 猫咪、花朵、音符 |
| 中等 | 15x15 | 4个 | 房子、汽车、动物 |
| 困难 | 20x20 | 3个 | 风景、人物、复杂图案 |

### 8.2 数据结构示例

```typescript
// src/data/presets.ts
export const PRESETS: PresetPuzzle[] = [
  {
    id: 'heart-5x5',
    name: '爱心',
    difficulty: 'easy',
    solution: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ]
  },
  // ... 更多题目
];
```

---

## 9. 项目文件结构

```
nonogram/
├── index.html                    # 入口页面
├── package.json                  # 项目配置
├── tsconfig.json                 # TS 配置
├── vite.config.ts                # Vite 配置
├── public/
│   └── favicon.svg               # 网站图标
├── src/
│   ├── main.ts                   # 应用入口
│   ├── style.css                 # 全局样式
│   ├── types/
│   │   └── index.ts              # 类型定义
│   ├── core/
│   │   ├── Game.ts               # 游戏核心
│   │   ├── Grid.ts               # 网格工具
│   │   └── Validator.ts          # 验证逻辑
│   ├── components/
│   │   ├── GameBoard.ts          # 游戏面板组件
│   │   ├── ControlPanel.ts       # 控制面板
│   │   ├── PuzzleGallery.ts      # 题目画廊
│   │   └── ImageGenerator.ts     # 图片生成器
│   ├── ui/
│   │   ├── Renderer.ts           # Canvas 渲染
│   │   └── EventHandler.ts       # 事件处理
│   ├── generator/
│   │   ├── ImageProcessor.ts     # 图片处理
│   │   └── PuzzleGenerator.ts    # 谜题生成
│   ├── data/
│   │   └── presets.ts            # 预设题目
│   └── utils/
│       ├── storage.ts            # 本地存储
│       └── helpers.ts            # 辅助函数
└── docs/
    └── design.md                 # 本设计文档
```

---

## 10. 开发计划

### Phase 1: 基础框架（1-2天）

- [ ] 初始化 Vite 项目
- [ ] 配置 TypeScript
- [ ] 搭建基础页面结构
- [ ] 定义核心类型

### Phase 2: 核心游戏（2-3天）

- [ ] 实现 Game 类
- [ ] Canvas 渲染引擎
- [ ] 鼠标/触摸交互
- [ ] 撤销/重做系统
- [ ] 胜利判定

### Phase 3: 预设题目（1天）

- [ ] 设计并实现 15-20 个预设题目
- [ ] 题目选择界面
- [ ] 难度过滤

### Phase 4: 图片生成（2-3天）

- [ ] 图片上传功能
- [ ] Canvas 图片处理
- [ ] 参数调节界面
- [ ] 实时预览
- [ ] 边缘平滑算法

### Phase 5: 优化完善（1-2天）

- [ ] 本地存储（进度保存）
- [ ] 动画效果
- [ ] 响应式布局
- [ ] 性能优化

### Phase 6: 测试部署（1天）

- [ ] 功能测试
- [ ] 构建优化
- [ ] 部署上线

**总计：约 8-12 天**

---

## 11. 技术要点

### 11.1 Canvas 性能优化

```typescript
// 使用离屏 Canvas 缓存
class Renderer {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  
  render() {
    // 只重绘变化的部分
    // 静态元素使用缓存
  }
}
```

### 11.2 响应式设计

```css
/* 使用 CSS 变量管理尺寸 */
:root {
  --cell-size: clamp(20px, 4vw, 40px);
  --grid-gap: 1px;
  --hint-width: 60px;
}

/* Canvas 根据容器自适应 */
canvas {
  max-width: 100%;
  height: auto;
}
```

### 11.3 触摸设备优化

```typescript
// 防止双击缩放
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// 长按识别
let touchTimer: number;
canvas.addEventListener('touchstart', () => {
  touchTimer = setTimeout(() => {
    // 显示操作菜单
  }, 500);
});
```

---

## 12. 扩展功能（可选）

按优先级排序：

1. **提示系统** - 自动标记可确定的单元格
2. **计时器** - 记录解题时间
3. **音效** - 填充音效、胜利音效
4. **主题切换** - 深色/浅色/彩色主题
5. **导入/导出** - 分享自定义谜题
6. **打印功能** - 打印谜题供线下游玩

---

## 13. 部署方案

### 方案 A：静态托管（推荐）

- **Vercel**：GitHub 集成，自动部署
- **Netlify**：拖拽部署，简单快捷
- **GitHub Pages**：免费，与代码仓库一体

### 方案 B：自有服务器

```bash
# 构建
npm run build

# 输出 dist/ 目录，包含：
# - index.html
# - assets/ (JS, CSS)
# - 纯静态文件，任何服务器均可托管
```
