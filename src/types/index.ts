// 坐标
export interface Position {
  row: number;
  col: number;
}

// 单元格状态
export enum CellState {
  EMPTY = 0,    // 空白
  FILLED = 1,   // 已填充
  MARKED = 2,   // 标记X（确定不填充）
}

// 历史操作（用于撤销）
export interface HistoryAction {
  positions: Position[];
  oldStates: CellState[];
  newStates: CellState[];
}

// 游戏状态
export interface GameState {
  grid: CellState[][];           // 当前网格
  solution: boolean[][];         // 正确答案
  rowHints: number[][];          // 行提示
  colHints: number[][];          // 列提示
  history: HistoryAction[];      // 操作历史
  historyIndex: number;          // 当前历史位置
  isComplete: boolean;           // 是否完成
  startTime: number;             // 开始时间
  elapsedTime: number;           // 经过时间（毫秒）
}

// 预设题目
export interface PresetPuzzle {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution: boolean[][];
  thumbnail?: string;            // 预览图（可选）
}

// 渲染配置
export interface RenderConfig {
  cellSize: number;
  hintWidth: number;
  gap: number;
  colors: {
    background: string;
    grid: string;
    cell: string;
    filled: string;
    marked: string;
    hint: string;
    completed: string;
  };
}
