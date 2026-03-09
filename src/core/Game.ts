import { Position, CellState, GameState, PresetPuzzle, GameMode } from '../types/index';

const CORRECTION_DELAY_MS = 200;

interface GameOptions {
  mode?: GameMode;
}

export class Game {
  private state: GameState;
  private onStateChangeCallbacks: ((state: GameState) => void)[] = [];
  private onWinCallbacks: (() => void)[] = [];
  private timerInterval: number | null = null;
  private correctionTimer: number | null = null;
  private inputLocked = false;

  constructor(puzzle: PresetPuzzle, options: GameOptions = {}) {
    const size = puzzle.solution.length;
    const mode = options.mode ?? 'assist';

    this.state = {
      grid: Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY)),
      solution: puzzle.solution,
      rowHints: this.generateHints(puzzle.solution, true),
      colHints: this.generateHints(puzzle.solution, false),
      history: [],
      historyIndex: -1,
      isComplete: false,
      startTime: Date.now(),
      elapsedTime: 0,
      correctedCells: Array(size).fill(null).map(() => Array(size).fill(false)),
      mode
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
        } else if (count > 0) {
          line.push(count);
          count = 0;
        }
      }

      if (count > 0) {
        line.push(count);
      }

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

    this.clearCorrectionTimer();
  }

  // 设置单元格状态
  public setCell(pos: Position, state: CellState): void {
    if (this.state.isComplete) return;
    if (this.inputLocked) return;
    if (!this.isValidPosition(pos)) return;

    const currentState = this.state.grid[pos.row][pos.col];
    if (currentState === state) return;

    if (this.state.mode === 'assist') {
      const correctionState = this.getCorrectionState(pos, state);
      if (correctionState !== null) {
        this.applyIncorrectMove(pos, currentState, state, correctionState);
        return;
      }
    }

    this.applyCellChange(pos, currentState, state, false);
  }

  // 切换单元格状态（用于单击）
  public toggleCell(pos: Position, isFillMode: boolean): void {
    if (this.state.isComplete) return;
    if (this.inputLocked) return;
    if (!this.isValidPosition(pos)) return;

    const currentState = this.state.grid[pos.row][pos.col];
    let newState: CellState;

    if (isFillMode) {
      newState = currentState === CellState.FILLED ? CellState.EMPTY : CellState.FILLED;
    } else {
      newState = currentState === CellState.MARKED ? CellState.EMPTY : CellState.MARKED;
    }

    this.setCell(pos, newState);
  }

  // 批量设置单元格（用于拖拽）
  public setCells(positions: Position[], state: CellState): void {
    if (this.state.isComplete) return;
    if (this.inputLocked) return;
    if (positions.length === 0) return;

    for (const pos of positions) {
      this.setCell(pos, state);
      if (this.inputLocked) {
        break;
      }
    }
  }

  // 撤销
  public undo(): boolean {
    if (this.state.historyIndex < 0) return false;
    if (this.inputLocked) return false;

    const action = this.state.history[this.state.historyIndex];

    for (let i = 0; i < action.positions.length; i++) {
      const pos = action.positions[i];
      this.state.grid[pos.row][pos.col] = action.oldStates[i];
      this.state.correctedCells[pos.row][pos.col] = action.oldCorrectedStates[i];
    }

    this.state.historyIndex--;
    this.state.isComplete = false;

    this.notifyStateChange();
    return true;
  }

  // 重做
  public redo(): boolean {
    if (this.state.historyIndex >= this.state.history.length - 1) return false;
    if (this.inputLocked) return false;

    this.state.historyIndex++;
    const action = this.state.history[this.state.historyIndex];

    for (let i = 0; i < action.positions.length; i++) {
      const pos = action.positions[i];
      this.state.grid[pos.row][pos.col] = action.newStates[i];
      this.state.correctedCells[pos.row][pos.col] = action.newCorrectedStates[i];
    }

    this.checkWin();
    this.notifyStateChange();
    return true;
  }

  // 清空网格
  public clear(): void {
    if (this.state.isComplete) return;
    if (this.inputLocked) return;

    const size = this.state.grid.length;
    const positions: Position[] = [];
    const oldStates: CellState[] = [];
    const newStates: CellState[] = [];
    const oldCorrectedStates: boolean[] = [];
    const newCorrectedStates: boolean[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (this.state.grid[row][col] !== CellState.EMPTY || this.state.correctedCells[row][col]) {
          positions.push({ row, col });
          oldStates.push(this.state.grid[row][col]);
          newStates.push(CellState.EMPTY);
          oldCorrectedStates.push(this.state.correctedCells[row][col]);
          newCorrectedStates.push(false);
        }
      }
    }

    if (positions.length === 0) return;

    this.addToHistory(positions, oldStates, newStates, oldCorrectedStates, newCorrectedStates);

    for (const pos of positions) {
      this.state.grid[pos.row][pos.col] = CellState.EMPTY;
      this.state.correctedCells[pos.row][pos.col] = false;
    }

    this.notifyStateChange();
  }

  // 验证位置是否有效
  private isValidPosition(pos: Position): boolean {
    const size = this.state.grid.length;
    return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
  }

  // 获取当前状态
  public getState(): GameState {
    return {
      ...this.state,
      grid: this.state.grid.map((row) => [...row]),
      solution: this.state.solution.map((row) => [...row]),
      rowHints: this.state.rowHints.map((row) => [...row]),
      colHints: this.state.colHints.map((row) => [...row]),
      history: [...this.state.history],
      correctedCells: this.state.correctedCells.map((row) => [...row])
    };
  }

  // 是否可以撤销
  public canUndo(): boolean {
    return !this.inputLocked && this.state.historyIndex >= 0;
  }

  // 是否可以重做
  public canRedo(): boolean {
    return !this.inputLocked && this.state.historyIndex < this.state.history.length - 1;
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

  // 当前是否处于纠错停顿中
  public isInputLocked(): boolean {
    return this.inputLocked;
  }

  // 状态变化回调
  public onStateChange(callback: (state: GameState) => void): void {
    this.onStateChangeCallbacks.push(callback);
  }

  // 胜利回调
  public onWin(callback: () => void): void {
    this.onWinCallbacks.push(callback);
  }

  // 检查胜利
  private checkWin(): boolean {
    const size = this.state.grid.length;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isFilled = this.state.grid[row][col] === CellState.FILLED;
        const shouldFill = this.state.solution[row][col];

        if (shouldFill && !isFilled) {
          this.state.isComplete = false;
          return false;
        }

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

  private applyCellChange(
    pos: Position,
    oldState: CellState,
    newState: CellState,
    isCorrected: boolean
  ): void {
    const oldCorrectedState = this.state.correctedCells[pos.row][pos.col];
    this.addToHistory([pos], [oldState], [newState], [oldCorrectedState], [isCorrected]);
    this.state.grid[pos.row][pos.col] = newState;
    this.state.correctedCells[pos.row][pos.col] = isCorrected;
    this.checkWin();
    this.notifyStateChange();
  }

  private getCorrectionState(pos: Position, state: CellState): CellState | null {
    if (state === CellState.EMPTY) {
      return null;
    }

    const shouldFill = this.state.solution[pos.row][pos.col];

    if (shouldFill && state === CellState.MARKED) {
      return CellState.FILLED;
    }

    if (!shouldFill && state === CellState.FILLED) {
      return CellState.MARKED;
    }

    return null;
  }

  private applyIncorrectMove(
    pos: Position,
    previousState: CellState,
    incorrectState: CellState,
    correctionState: CellState
  ): void {
    this.clearCorrectionTimer();
    this.inputLocked = true;
    this.state.grid[pos.row][pos.col] = incorrectState;
    this.notifyStateChange();

    this.correctionTimer = window.setTimeout(() => {
      this.correctionTimer = null;
      this.inputLocked = false;
      this.applyCellChange(pos, previousState, correctionState, true);
    }, CORRECTION_DELAY_MS);
  }

  private addToHistory(
    positions: Position[],
    oldStates: CellState[],
    newStates: CellState[],
    oldCorrectedStates: boolean[],
    newCorrectedStates: boolean[]
  ): void {
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    this.state.history.push({
      positions,
      oldStates,
      newStates,
      oldCorrectedStates,
      newCorrectedStates
    });
    this.state.historyIndex++;
  }

  private clearCorrectionTimer(): void {
    if (this.correctionTimer) {
      clearTimeout(this.correctionTimer);
      this.correctionTimer = null;
    }

    this.inputLocked = false;
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
