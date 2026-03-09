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

  private getLayoutMetrics(state: GameState) {
    return this.getLayoutMetricsWithSizing(
      state,
      this.config.cellSize,
      this.config.hintWidth,
      this.config.gap
    );
  }

  private getLayoutMetricsWithSizing(
    state: GameState,
    cellSize: number,
    hintWidth: number,
    gap: number
  ) {
    const fontSize = this.getHintFontSize(cellSize);
    const horizontalSpacing = this.getHintHorizontalSpacing(cellSize);
    const verticalSpacing = this.getHintVerticalSpacing(cellSize);
    const horizontalPadding = Math.max(10, Math.floor(cellSize * 0.3));
    const verticalPadding = Math.max(10, Math.floor(cellSize * 0.3));
    const size = state.grid.length;

    this.ctx.font = `${fontSize}px Arial`;

    const rowHintWidth = Math.max(
      hintWidth,
      ...state.rowHints.map((hints) => {
        const totalTextWidth = hints.reduce((width, hint) => {
          return width + this.ctx.measureText(String(hint)).width;
        }, 0);
        const totalSpacing = Math.max(0, hints.length - 1) * horizontalSpacing;
        return Math.ceil(totalTextWidth + totalSpacing + horizontalPadding * 2);
      })
    );

    const colHintHeight = Math.max(
      hintWidth,
      ...state.colHints.map((hints) => {
        const totalTextHeight = hints.length * fontSize;
        const totalSpacing = Math.max(0, hints.length - 1) * verticalSpacing;
        return Math.ceil(totalTextHeight + totalSpacing + verticalPadding * 2);
      })
    );

    return {
      cellSize,
      gap,
      size,
      rowHintWidth,
      colHintHeight,
      rowHintTextX: rowHintWidth - horizontalPadding,
      colHintTextBottomY: colHintHeight - verticalPadding,
      gridOffsetX: rowHintWidth + gap,
      gridOffsetY: colHintHeight + gap,
      gridSpan: size * (cellSize + gap),
      totalWidth: rowHintWidth + gap + size * (cellSize + gap),
      totalHeight: colHintHeight + gap + size * (cellSize + gap)
    };
  }

  // 根据游戏状态调整 Canvas 大小
  private resizeCanvas(state: GameState): void {
    const layout = this.getLayoutMetrics(state);
    const totalWidth = layout.rowHintWidth + layout.gap + layout.gridSpan;
    const totalHeight = layout.colHintHeight + layout.gap + layout.gridSpan;

    this.canvas.style.width = `${totalWidth}px`;
    this.canvas.style.height = `${totalHeight}px`;
    this.canvas.width = totalWidth * this.dpr;
    this.canvas.height = totalHeight * this.dpr;
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  // 渲染游戏状态
  public render(state: GameState): void {
    this.syncThemeColors();
    this.syncResponsiveSizing(state);
    this.resizeCanvas(state);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const { colors } = this.config;
    const layout = this.getLayoutMetrics(state);

    // 绘制背景
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    // 绘制提示区域背景
    this.ctx.fillStyle = colors.cell;
    this.ctx.fillRect(layout.gridOffsetX, 0, layout.gridSpan, layout.colHintHeight);
    this.ctx.fillRect(0, layout.gridOffsetY, layout.rowHintWidth, layout.gridSpan);

    // 绘制行提示
    this.renderRowHints(state, layout);

    // 绘制列提示
    this.renderColHints(state, layout);

    // 绘制网格
    this.renderGrid(state, layout);

    // 绘制单元格
    this.renderCells(state, layout);

    // 如果已完成，绘制边框
    if (state.isComplete) {
      this.renderCompletionBorder(state, layout);
    }
  }

  private syncThemeColors(): void {
    const rootStyle = getComputedStyle(document.body);

    this.config.colors = {
      ...this.config.colors,
      background: this.getThemeColor(rootStyle, '--canvas-bg', this.config.colors.background),
      grid: this.getThemeColor(rootStyle, '--canvas-grid', this.config.colors.grid),
      cell: this.getThemeColor(rootStyle, '--canvas-cell', this.config.colors.cell),
      filled: this.getThemeColor(rootStyle, '--canvas-fill', this.config.colors.filled),
      marked: this.getThemeColor(rootStyle, '--canvas-mark', this.config.colors.marked)
    };
  }

  private getThemeColor(style: CSSStyleDeclaration, name: string, fallback: string): string {
    const value = style.getPropertyValue(name).trim();
    return value || fallback;
  }

  private syncResponsiveSizing(state: GameState): void {
    const parent = this.canvas.parentElement;

    if (!parent) {
      return;
    }

    const parentStyle = getComputedStyle(parent);
    const horizontalPadding =
      parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
    const verticalPadding =
      parseFloat(parentStyle.paddingTop) + parseFloat(parentStyle.paddingBottom);
    const availableWidth = Math.max(280, parent.clientWidth - horizontalPadding);
    const availableHeight = Math.max(280, parent.clientHeight - verticalPadding);

    let nextCellSize = 14;
    let nextHintWidth = 26;

    for (let cellSize = 34; cellSize >= 14; cellSize--) {
      const hintWidth = Math.max(26, Math.round(cellSize * 1.35));
      const layout = this.getLayoutMetricsWithSizing(state, cellSize, hintWidth, this.config.gap);

      if (layout.totalWidth <= availableWidth && layout.totalHeight <= availableHeight) {
        nextCellSize = cellSize;
        nextHintWidth = hintWidth;
        break;
      }
    }

    this.config.cellSize = nextCellSize;
    this.config.hintWidth = nextHintWidth;
  }

  // 绘制行提示
  private renderRowHints(
    state: GameState,
    layout: ReturnType<Renderer['getLayoutMetrics']>
  ): void {
    const { colors } = this.config;
    const spacing = this.getHintHorizontalSpacing();

    this.ctx.font = `${this.getHintFontSize()}px Arial`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    state.rowHints.forEach((hints, row) => {
      const y = layout.gridOffsetY + row * (layout.cellSize + layout.gap) + layout.cellSize / 2;
      const x = layout.rowHintTextX;
      const completed = this.getCompletedHints(
        state.grid[row],
        state.solution[row],
        hints
      );
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
  private renderColHints(
    state: GameState,
    layout: ReturnType<Renderer['getLayoutMetrics']>
  ): void {
    const { colors } = this.config;
    const fontSize = this.getHintFontSize();
    const verticalSpacing = this.getHintVerticalSpacing();

    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';

    state.colHints.forEach((hints, col) => {
      const x = layout.gridOffsetX + col * (layout.cellSize + layout.gap) + layout.cellSize / 2;
      const lineStates = state.grid.map((row) => row[col]);
      const solutionLine = state.solution.map((row) => row[col]);
      const completed = this.getCompletedHints(lineStates, solutionLine, hints);

      hints.forEach((hint, index) => {
        const y = layout.colHintTextBottomY - (hints.length - 1 - index) * (fontSize + verticalSpacing);
        this.ctx.fillStyle = completed[index] ? colors.hintCompleted : colors.hint;
        this.ctx.fillText(String(hint), x, y);
      });
    });
  }

  private getHintFontSize(cellSize: number = this.config.cellSize): number {
    return Math.floor(cellSize * 0.6);
  }

  private getHintHorizontalSpacing(cellSize: number = this.config.cellSize): number {
    const fontSize = this.getHintFontSize(cellSize);
    return Math.max(4, Math.floor(fontSize * 0.3));
  }

  private getHintVerticalSpacing(cellSize: number = this.config.cellSize): number {
    const fontSize = this.getHintFontSize(cellSize);
    return Math.max(2, Math.floor(fontSize * 0.2));
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
  private renderGrid(
    state: GameState,
    layout: ReturnType<Renderer['getLayoutMetrics']>
  ): void {
    const { colors } = this.config;
    const size = state.grid.length;

    this.ctx.strokeStyle = colors.grid;
    this.ctx.lineWidth = 1;

    // 绘制垂直线
    for (let i = 0; i <= size; i++) {
      const x = layout.gridOffsetX + i * (layout.cellSize + layout.gap);
      this.ctx.beginPath();
      this.ctx.moveTo(x, layout.gridOffsetY);
      this.ctx.lineTo(x, layout.gridOffsetY + layout.gridSpan);
      this.ctx.stroke();
    }

    // 绘制水平线
    for (let i = 0; i <= size; i++) {
      const y = layout.gridOffsetY + i * (layout.cellSize + layout.gap);
      this.ctx.beginPath();
      this.ctx.moveTo(layout.gridOffsetX, y);
      this.ctx.lineTo(layout.gridOffsetX + layout.gridSpan, y);
      this.ctx.stroke();
    }

    // 绘制5格粗线
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 2;

    for (let i = 0; i <= size; i += 5) {
      if (i > 0 && i < size) {
        const x = layout.gridOffsetX + i * (layout.cellSize + layout.gap);
        this.ctx.beginPath();
        this.ctx.moveTo(x, layout.gridOffsetY);
        this.ctx.lineTo(x, layout.gridOffsetY + layout.gridSpan);
        this.ctx.stroke();

        const y = layout.gridOffsetY + i * (layout.cellSize + layout.gap);
        this.ctx.beginPath();
        this.ctx.moveTo(layout.gridOffsetX, y);
        this.ctx.lineTo(layout.gridOffsetX + layout.gridSpan, y);
        this.ctx.stroke();
      }
    }
  }

  // 绘制单元格
  private renderCells(
    state: GameState,
    layout: ReturnType<Renderer['getLayoutMetrics']>
  ): void {
    const { colors } = this.config;
    const size = state.grid.length;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cellState = state.grid[row][col];
        const x = layout.gridOffsetX + col * (layout.cellSize + layout.gap);
        const y = layout.gridOffsetY + row * (layout.cellSize + layout.gap);
        const isCorrected = state.correctedCells[row][col];

        if (cellState === CellState.FILLED) {
          // 绘制填充
          this.ctx.fillStyle = isCorrected ? colors.correction : colors.filled;
          this.ctx.fillRect(x + 1, y + 1, layout.cellSize - 1, layout.cellSize - 1);
        } else if (cellState === CellState.MARKED) {
          // 绘制X标记
          this.ctx.strokeStyle = isCorrected ? colors.correction : colors.marked;
          this.ctx.lineWidth = 2;
          
          const padding = layout.cellSize * 0.25;
          this.ctx.beginPath();
          this.ctx.moveTo(x + padding, y + padding);
          this.ctx.lineTo(x + layout.cellSize - padding, y + layout.cellSize - padding);
          this.ctx.moveTo(x + layout.cellSize - padding, y + padding);
          this.ctx.lineTo(x + padding, y + layout.cellSize - padding);
          this.ctx.stroke();
        } else {
          // 绘制空白背景
          this.ctx.fillStyle = colors.cell;
          this.ctx.fillRect(x + 1, y + 1, layout.cellSize - 1, layout.cellSize - 1);
        }
      }
    }
  }

  // 绘制完成边框
  private renderCompletionBorder(
    _state: GameState,
    layout: ReturnType<Renderer['getLayoutMetrics']>
  ): void {
    const { colors } = this.config;
    this.ctx.strokeStyle = colors.completed;
    this.ctx.lineWidth = 4;

    const x = layout.gridOffsetX;
    const y = layout.gridOffsetY;
    const width = layout.gridSpan;
    const height = layout.gridSpan;

    this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  }

  // 将鼠标坐标转换为单元格位置
  public getCellFromPosition(mouseX: number, mouseY: number): Position | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;

    const layout = this.getLayoutMetricsFromCanvas(rect.width, rect.height);
    const col = Math.floor((x - layout.gridOffsetX) / (layout.cellStep));
    const row = Math.floor((y - layout.gridOffsetY) / (layout.cellStep));

    // 检查是否在有效范围内
    if (row >= 0 && row < layout.size && col >= 0 && col < layout.size) {
      return { row, col };
    }

    return null;
  }

  // 更新配置
  public updateConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private getLayoutMetricsFromCanvas(width: number, height: number) {
    const { cellSize, gap, hintWidth } = this.config;
    const cellStep = cellSize + gap;
    const sizeFromWidth = Math.floor((width - hintWidth - gap) / cellStep);
    const sizeFromHeight = Math.floor((height - hintWidth - gap) / cellStep);
    const size = Math.min(sizeFromWidth, sizeFromHeight);
    const gridSpan = size * cellStep;
    const rowHintWidth = Math.max(hintWidth, Math.round(width - gap - gridSpan));
    const colHintHeight = Math.max(hintWidth, Math.round(height - gap - gridSpan));

    return {
      size,
      cellStep,
      gridOffsetX: rowHintWidth + gap,
      gridOffsetY: colHintHeight + gap
    };
  }
}
