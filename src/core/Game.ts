import { Position, CellState, HistoryAction, GameState, PresetPuzzle } from '../types/index';

export class Game {
  private state: GameState;
  private onStateChangeCallbacks: ((state: GameState) => void)[] = [];
  private onWinCallbacks: (() => void)[] = [];
  private timerInterval: number | null = null;

  constructor(puzzle: PresetPuzzle) {
    const size = puzzle.solution.length;
    
    this.state = {
      grid: Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY)),
      solution: puzzle.solution,
      rowHints: this.generateHints(puzzle.solution, true),
      colHints: this.generateHints(puzzle.solution, false),
      history: [],
      historyIndex: -1,
      isComplete: false,
      startTime: Date.now(),
      elapsedTime: 0
    };

    this.startTimer();
  }

  // 生成提示数字
  private generateHints(solution: boolean[][], isRow: boolean): number[][] {
    const hints: number[][] = [];
    const size = solution.length;

    for (let i = 0; i < size; i++) {
      const line: number[] = [];
      let count = 0;

      for (let j = 0; j < size; j++) {
        const value = isRow ? solution[i][j] : solution[j][i];
        
        if (value) {
          count++;
        } else {
          if (count > 0) {
            line.push(count);
            count = 0;
          }
        }
      }

      if (count > 0) {
        line.push(count);
      }

      // 如果没有填充，提示为 0
      if (line.length === 0) {
        line.push(0);
      }

      hints.push(line);
    }

    return hints;
  }

  // 开始计时器
  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      if (!this.state.isComplete) {
        this.state.elapsedTime = Date.now() - this.state.startTime;
        this.notifyStateChange();
      }
    }, 1000);
  }

  // 停止计时器
  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // 设置单元格状态
  public setCell(pos: Position, state: CellState): void {
    if (this.state.isComplete) return;
    if (!this.isValidPosition(pos)) return;

    const currentState = this.state.grid[pos.row][pos.col];
    if (currentState === state) return;

    // 保存到历史
    this.addToHistory([pos], [currentState], [state]);

    // 更新状态
    this.state.grid[pos.row][pos.col] = state;
    
    // 检查胜利
    this.checkWin();
    
    this.notifyStateChange();
  }

  // 切换单元格状态（用于单击）
  public toggleCell(pos: Position, isFillMode: boolean): void {
    if (this.state.isComplete) return;
    if (!this.isValidPosition(pos)) return;

    const currentState = this.state.grid[pos.row][pos.col];
    let newState: CellState;

    if (isFillMode) {
      // 填充模式：EMPTY -> FILLED -> EMPTY
      newState = currentState === CellState.FILLED ? CellState.EMPTY : CellState.FILLED;
    } else {
      // 标记模式：EMPTY -> MARKED -> EMPTY
      newState = currentState === CellState.MARKED ? CellState.EMPTY : CellState.MARKED;
    }

    this.setCell(pos, newState);
  }

  // 批量设置单元格（用于拖拽）
  public setCells(positions: Position[], state: CellState): void {
    if (this.state.isComplete) return;
    if (positions.length === 0) return;

    const validPositions: Position[] = [];
    const oldStates: CellState[] = [];

    for (const pos of positions) {
      if (this.isValidPosition(pos)) {
        const currentState = this.state.grid[pos.row][pos.col];
        if (currentState !== state) {
          validPositions.push(pos);
          oldStates.push(currentState);
        }
      }
    }

    if (validPositions.length === 0) return;

    // 保存到历史
    const newStates = Array(validPositions.length).fill(state);
    this.addToHistory(validPositions, oldStates, newStates);

    // 更新状态
    for (const pos of validPositions) {
      this.state.grid[pos.row][pos.col] = state;
    }

    // 检查胜利
    this.checkWin();

    this.notifyStateChange();
  }

  // 添加到历史
  private addToHistory(positions: Position[], oldStates: CellState[], newStates: CellState[]): void {
    // 删除当前位置之后的历史
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    
    // 添加新操作
    this.state.history.push({
      positions,
      oldStates,
      newStates
    });
    
    this.state.historyIndex++;
  }

  // 撤销
  public undo(): boolean {
    if (this.state.historyIndex < 0) return false;

    const action = this.state.history[this.state.historyIndex];
    
    for (let i = 0; i < action.positions.length; i++) {
      const pos = action.positions[i];
      this.state.grid[pos.row][pos.col] = action.oldStates[i];
    }

    this.state.historyIndex--;
    this.state.isComplete = false;
    
    this.notifyStateChange();
    return true;
  }

  // 重做
  public redo(): boolean {
    if (this.state.historyIndex >= this.state.history.length - 1) return false;

    this.state.historyIndex++;
    const action = this.state.history[this.state.historyIndex];
    
    for (let i = 0; i < action.positions.length; i++) {
      const pos = action.positions[i];
      this.state.grid[pos.row][pos.col] = action.newStates[i];
    }

    this.checkWin();
    this.notifyStateChange();
    return true;
  }

  // 清空网格
  public clear(): void {
    if (this.state.isComplete) return;

    const size = this.state.grid.length;
    const positions: Position[] = [];
    const oldStates: CellState[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.state.grid[row][col] !== CellState.EMPTY) {
          positions.push({ row, col });
          oldStates.push(this.state.grid[row][col]);
        }
      }
    }

    if (positions.length === 0) return;

    this.addToHistory(positions, oldStates, Array(positions.length).fill(CellState.EMPTY));

    for (const pos of positions) {
      this.state.grid[pos.row][pos.col] = CellState.EMPTY;
    }

    this.notifyStateChange();
  }

  // 检查胜利
  private checkWin(): boolean {
    const size = this.state.grid.length;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isFilled = this.state.grid[row][col] === CellState.FILLED;
        const shouldFill = this.state.solution[row][col];
        
        // 必须填充的必须已填充
        if (shouldFill && !isFilled) {
          this.state.isComplete = false;
          return false;
        }
        
        // 不能填充的不能已填充
        if (!shouldFill && isFilled) {
          this.state.isComplete = false;
          return false;
        }
      }
    }

    if (!this.state.isComplete) {
      this.state.isComplete = true;
      this.stopTimer();
      this.notifyWin();
    }

    return true;
  }

  // 验证位置是否有效
  private isValidPosition(pos: Position): boolean {
    const size = this.state.grid.length;
    return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
  }

  // 获取当前状态
  public getState(): GameState {
    return { ...this.state };
  }

  // 是否可以撤销
  public canUndo(): boolean {
    return this.state.historyIndex >= 0;
  }

  // 是否可以重做
  public canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  // 获取完成度
  public getProgress(): number {
    const size = this.state.grid.length;
    let filled = 0;
    let total = 0;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.state.solution[row][col]) {
          total++;
          if (this.state.grid[row][col] === CellState.FILLED) {
            filled++;
          }
        }
      }
    }

    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }

  // 格式化时间
  public formatTime(): string {
    const totalSeconds = Math.floor(this.state.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // 状态变化回调
  public onStateChange(callback: (state: GameState) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }

  // 胜利回调
  public onWin(callback: () => void): void {
    this.onWinCallbacks.push(callback);
  }

  // 通知状态变化
  private notifyStateChange(): void {
    for (const callback of this.onStateChangeCallbacks) {
      callback(this.getState());
    }
  }

  // 通知胜利
  private notifyWin(): void {
    for (const callback of this.onWinCallbacks) {
      callback();
    }
  }
}