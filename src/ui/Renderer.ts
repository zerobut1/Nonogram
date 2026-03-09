import { GameState, CellState, Position, RenderConfig } from '../types/index';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement, config?: Partial<RenderConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;

    // 设备像素比
    this.dpr = window.devicePixelRatio || 1;

    // 默认配置
    this.config = {
      cellSize: 30,
      hintWidth: 40,
      gap: 1,
      colors: {
        background: '#ffffff',
        grid: '#e0e0e0',
        cell: '#f5f5f5',
        filled: '#333333',
        marked: '#999999',
        correction: '#e53935',
        hint: '#333333',
        hintCompleted: '#999999',
        completed: '#4caf50'
      },
      ...config
    };

    this.setupCanvas();
  }

  // 设置 Canvas 尺寸
  private setupCanvas(): void {
    // 先设置一个默认值，实际大小会在 render 时根据 state 调整
    this.canvas.style.width = '400px';
    this.canvas.style.height = '400px';
    this.canvas.width = 400 * this.dpr;
    this.canvas.height = 400 * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  // 根据游戏状态调整 Canvas 大小
  private resizeCanvas(state: GameState): void {
    const { cellSize, hintWidth, gap } = this.config;
    const size = state.grid.length;
    
    const totalWidth = hintWidth + gap + size * (cellSize + gap);
    const totalHeight = hintWidth + gap + size * (cellSize + gap);

    this.canvas.style.width = `${totalWidth}px`;
    this.canvas.style.height = `${totalHeight}px`;
    this.canvas.width = totalWidth * this.dpr;
    this.canvas.height = totalHeight * this.dpr;
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  // 渲染游戏状态
  public render(state: GameState): void {
    this.resizeCanvas(state);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const { cellSize, hintWidth, gap, colors } = this.config;
    const size = state.grid.length;

    // 绘制背景
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    // 绘制提示区域背景
    this.ctx.fillStyle = colors.cell;
    this.ctx.fillRect(hintWidth + gap, 0, size * (cellSize + gap), hintWidth);
    this.ctx.fillRect(0, hintWidth + gap, hintWidth, size * (cellSize + gap));

    // 绘制行提示
    this.renderRowHints(state);

    // 绘制列提示
    this.renderColHints(state);

    // 绘制网格
    this.renderGrid(state);

    // 绘制单元格
    this.renderCells(state);

    // 如果已完成，绘制边框
    if (state.isComplete) {
      this.renderCompletionBorder(state);
    }
  }

  // 绘制行提示
  private renderRowHints(state: GameState): void {
    const { cellSize, hintWidth, gap, colors } = this.config;
    const fontSize = Math.floor(cellSize * 0.6);

    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    state.rowHints.forEach((hints, row) => {
      const y = hintWidth + gap + row * (cellSize + gap) + cellSize / 2;
      const x = hintWidth - 5;
      const completed = this.getCompletedHints(
        state.grid[row],
        state.solution[row],
        hints
      );
      const spacing = Math.max(4, Math.floor(fontSize * 0.35));
      let currentX = x;

      for (let i = hints.length - 1; i >= 0; i--) {
        const text = String(hints[i]);
        this.ctx.fillStyle = completed[i] ? colors.hintCompleted : colors.hint;
        this.ctx.fillText(text, currentX, y);
        currentX -= this.ctx.measureText(text).width + spacing;
      }
    });
  }

  // 绘制列提示
  private renderColHints(state: GameState): void {
    const { cellSize, hintWidth, gap, colors } = this.config;
    const fontSize = Math.floor(cellSize * 0.5);

    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';

    state.colHints.forEach((hints, col) => {
      const x = hintWidth + gap + col * (cellSize + gap) + cellSize / 2;
      const lineStates = state.grid.map((row) => row[col]);
      const solutionLine = state.solution.map((row) => row[col]);
      const completed = this.getCompletedHints(lineStates, solutionLine, hints);

      hints.forEach((hint, index) => {
        const y = hintWidth - 3 - (hints.length - 1 - index) * (cellSize * 0.5);
        this.ctx.fillStyle = completed[index] ? colors.hintCompleted : colors.hint;
        this.ctx.fillText(String(hint), x, y);
      });
    });
  }

  private getCompletedHints(
    lineStates: CellState[],
    solutionLine: boolean[],
    hints: number[]
  ): boolean[] {
    if (hints.length === 1 && hints[0] === 0) {
      const isComplete = this.getResolvedPrefixLength(lineStates, solutionLine) === lineStates.length;
      return [isComplete];
    }

    const completed = Array(hints.length).fill(false);
    const completedFromStart = this.getCompletedHintCountFromStart(lineStates, solutionLine, hints);
    const completedFromEnd = this.getCompletedHintCountFromEnd(lineStates, solutionLine, hints);

    for (let i = 0; i < completedFromStart; i++) {
      completed[i] = true;
    }

    for (let i = hints.length - completedFromEnd; i < hints.length; i++) {
      if (i >= 0) {
        completed[i] = true;
      }
    }

    return completed;
  }

  private getCompletedHintCountFromStart(
    lineStates: CellState[],
    solutionLine: boolean[],
    hints: number[]
  ): number {
    const resolvedPrefixLength = this.getResolvedPrefixLength(lineStates, solutionLine);
    const prefixRuns = this.getFilledRuns(lineStates.slice(0, resolvedPrefixLength));
    let count = 0;

    while (count < prefixRuns.length && count < hints.length && prefixRuns[count] === hints[count]) {
      count++;
    }

    return count;
  }

  private getCompletedHintCountFromEnd(
    lineStates: CellState[],
    solutionLine: boolean[],
    hints: number[]
  ): number {
    const resolvedSuffixStart = this.getResolvedSuffixStart(lineStates, solutionLine);
    const suffixRuns = this.getFilledRuns(lineStates.slice(resolvedSuffixStart));
    let count = 0;

    while (
      count < suffixRuns.length &&
      count < hints.length &&
      suffixRuns[suffixRuns.length - 1 - count] === hints[hints.length - 1 - count]
    ) {
      count++;
    }

    return count;
  }

  private getResolvedPrefixLength(lineStates: CellState[], solutionLine: boolean[]): number {
    let length = 0;

    while (length < lineStates.length) {
      const cellState = lineStates[length];
      if (cellState === CellState.EMPTY || !this.isCellResolvedCorrectly(cellState, solutionLine[length])) {
        break;
      }
      length++;
    }

    return length;
  }

  private getResolvedSuffixStart(lineStates: CellState[], solutionLine: boolean[]): number {
    let index = lineStates.length - 1;

    while (index >= 0) {
      const cellState = lineStates[index];
      if (cellState === CellState.EMPTY || !this.isCellResolvedCorrectly(cellState, solutionLine[index])) {
        break;
      }
      index--;
    }

    return index + 1;
  }

  private getFilledRuns(lineStates: CellState[]): number[] {
    const runs: number[] = [];
    let count = 0;

    lineStates.forEach((cellState) => {
      if (cellState === CellState.FILLED) {
        count++;
      } else if (count > 0) {
        runs.push(count);
        count = 0;
      }
    });

    if (count > 0) {
      runs.push(count);
    }

    return runs;
  }

  private isCellResolvedCorrectly(cellState: CellState, shouldFill: boolean): boolean {
    if (shouldFill) {
      return cellState === CellState.FILLED;
    }

    return cellState === CellState.MARKED;
  }

  // 绘制网格线
  private renderGrid(state: GameState): void {
    const { cellSize, hintWidth, gap, colors } = this.config;
    const size = state.grid.length;

    this.ctx.strokeStyle = colors.grid;
    this.ctx.lineWidth = 1;

    // 绘制垂直线
    for (let i = 0; i <= size; i++) {
      const x = hintWidth + gap + i * (cellSize + gap);
      this.ctx.beginPath();
      this.ctx.moveTo(x, hintWidth + gap);
      this.ctx.lineTo(x, hintWidth + gap + size * (cellSize + gap));
      this.ctx.stroke();
    }

    // 绘制水平线
    for (let i = 0; i <= size; i++) {
      const y = hintWidth + gap + i * (cellSize + gap);
      this.ctx.beginPath();
      this.ctx.moveTo(hintWidth + gap, y);
      this.ctx.lineTo(hintWidth + gap + size * (cellSize + gap), y);
      this.ctx.stroke();
    }

    // 绘制5格粗线
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 2;

    for (let i = 0; i <= size; i += 5) {
      if (i > 0 && i < size) {
        const x = hintWidth + gap + i * (cellSize + gap);
        this.ctx.beginPath();
        this.ctx.moveTo(x, hintWidth + gap);
        this.ctx.lineTo(x, hintWidth + gap + size * (cellSize + gap));
        this.ctx.stroke();

        const y = hintWidth + gap + i * (cellSize + gap);
        this.ctx.beginPath();
        this.ctx.moveTo(hintWidth + gap, y);
        this.ctx.lineTo(hintWidth + gap + size * (cellSize + gap), y);
        this.ctx.stroke();
      }
    }
  }

  // 绘制单元格
  private renderCells(state: GameState): void {
    const { cellSize, hintWidth, gap, colors } = this.config;
    const size = state.grid.length;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cellState = state.grid[row][col];
        const x = hintWidth + gap + col * (cellSize + gap);
        const y = hintWidth + gap + row * (cellSize + gap);
        const isCorrected = state.correctedCells[row][col];

        if (cellState === CellState.FILLED) {
          // 绘制填充
          this.ctx.fillStyle = isCorrected ? colors.correction : colors.filled;
          this.ctx.fillRect(x + 1, y + 1, cellSize - 1, cellSize - 1);
        } else if (cellState === CellState.MARKED) {
          // 绘制X标记
          this.ctx.strokeStyle = isCorrected ? colors.correction : colors.marked;
          this.ctx.lineWidth = 2;
          
          const padding = cellSize * 0.25;
          this.ctx.beginPath();
          this.ctx.moveTo(x + padding, y + padding);
          this.ctx.lineTo(x + cellSize - padding, y + cellSize - padding);
          this.ctx.moveTo(x + cellSize - padding, y + padding);
          this.ctx.lineTo(x + padding, y + cellSize - padding);
          this.ctx.stroke();
        } else {
          // 绘制空白背景
          this.ctx.fillStyle = colors.cell;
          this.ctx.fillRect(x + 1, y + 1, cellSize - 1, cellSize - 1);
        }
      }
    }
  }

  // 绘制完成边框
  private renderCompletionBorder(state: GameState): void {
    const { cellSize, hintWidth, gap, colors } = this.config;
    const size = state.grid.length;

    this.ctx.strokeStyle = colors.completed;
    this.ctx.lineWidth = 4;

    const x = hintWidth + gap;
    const y = hintWidth + gap;
    const width = size * (cellSize + gap);
    const height = size * (cellSize + gap);

    this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  }

  // 将鼠标坐标转换为单元格位置
  public getCellFromPosition(mouseX: number, mouseY: number): Position | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;

    const { cellSize, hintWidth, gap } = this.config;

    const col = Math.floor((x - hintWidth - gap) / (cellSize + gap));
    const row = Math.floor((y - hintWidth - gap) / (cellSize + gap));

    // 检查是否在有效范围内
    const size = Math.floor((rect.width - hintWidth - gap) / (cellSize + gap));
    
    if (row >= 0 && row < size && col >= 0 && col < size) {
      return { row, col };
    }

    return null;
  }

  // 更新配置
  public updateConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
