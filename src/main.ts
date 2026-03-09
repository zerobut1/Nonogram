import { Game } from './core/Game';
import { Renderer } from './ui/Renderer';
import { PRESETS, getPuzzlesByDifficulty } from './data/presets';
import { Position, CellState } from './types/index';
import './style.css';

// 游戏实例
let game: Game | null = null;
let renderer: Renderer | null = null;

// 状态
let currentPuzzleIndex = 0;
let isFillMode = true;
let isDragging = false;
let dragState: 'fill' | 'mark' | null = null;
let lastCell: Position | null = null;

// DOM 元素
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const btnMenu = document.getElementById('btn-menu') as HTMLButtonElement;
const modeFill = document.getElementById('mode-fill') as HTMLButtonElement;
const modeMark = document.getElementById('mode-mark') as HTMLButtonElement;
const timerDisplay = document.getElementById('timer') as HTMLSpanElement;
const progressDisplay = document.getElementById('progress') as HTMLSpanElement;
const currentPuzzleTitle = document.getElementById('current-puzzle-title') as HTMLHeadingElement;
const menuModal = document.getElementById('menu-modal') as HTMLDivElement;
const winModal = document.getElementById('win-modal') as HTMLDivElement;
const btnCloseMenu = document.getElementById('btn-close-menu') as HTMLButtonElement;
const btnCloseWin = document.getElementById('btn-close-win') as HTMLButtonElement;
const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
const winTimeDisplay = document.getElementById('win-time') as HTMLSpanElement;
const puzzleList = document.getElementById('puzzle-list') as HTMLDivElement;

// 初始化游戏
function initGame(puzzleIndex: number = 0): void {
  currentPuzzleIndex = puzzleIndex;
  resetDragState();

  // 停止旧游戏
  if (game) {
    game.stopTimer();
  }

  // 创建新游戏
  game = new Game(PRESETS[puzzleIndex], { mode: 'assist' });
  
  // 创建渲染器
  if (!renderer) {
    renderer = new Renderer(canvas);
    setupCanvasEvents();
  }

  // 初始渲染
  renderer.render(game.getState());
  updateUI();

  // 监听状态变化
  game.onStateChange(() => {
    if (game && renderer) {
      renderer.render(game.getState());
      updateUI();
    }
  });

  // 监听胜利
  game.onWin(() => {
    showWinModal();
  });
}

// 更新 UI
function updateUI(): void {
  if (!game) return;
  const currentPuzzle = PRESETS[currentPuzzleIndex];
  
  // 更新计时器
  timerDisplay.textContent = game.formatTime();
  
  // 更新进度
  progressDisplay.textContent = `${game.getProgress()}%`;
  currentPuzzleTitle.textContent = currentPuzzle.name;
  document.title = `${currentPuzzle.name} - 数织`;
}

// 设置 Canvas 事件
function setupCanvasEvents(): void {
  if (!canvas || !game) return;

  // 鼠标按下
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 2) { // 左键或右键
      e.preventDefault();
      const pos = renderer?.getCellFromPosition(e.clientX, e.clientY);
      if (pos) {
        isDragging = true;
        lastCell = pos;
        
        // 根据模式和鼠标按键决定操作
        const isLeftClick = e.button === 0;
        const useFillMode = isFillMode ? isLeftClick : !isLeftClick;
        
        dragState = useFillMode ? 'fill' : 'mark';
        
        // 切换当前格子
        game?.toggleCell(pos, useFillMode);
        if (game?.isInputLocked()) {
          resetDragState();
        }
      }
    }
  });

  // 鼠标移动
  canvas.addEventListener('mousemove', (e) => {
    if (isDragging && dragState && lastCell) {
      if (game?.isInputLocked()) {
        resetDragState();
        return;
      }

      const pos = renderer?.getCellFromPosition(e.clientX, e.clientY);
      if (pos && (pos.row !== lastCell.row || pos.col !== lastCell.col)) {
        lastCell = pos;
        const newState = dragState === 'fill' ? CellState.FILLED : CellState.MARKED;
        game?.setCell(pos, newState);
        if (game?.isInputLocked()) {
          resetDragState();
        }
      }
    }
  });

  // 鼠标松开
  window.addEventListener('mouseup', () => {
    resetDragState();
  });

  // 禁用右键菜单
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

function resetDragState(): void {
  isDragging = false;
  dragState = null;
  lastCell = null;
}

// 切换模式
function setFillMode(fill: boolean): void {
  isFillMode = fill;
  if (fill) {
    modeFill.classList.add('active');
    modeMark.classList.remove('active');
  } else {
    modeFill.classList.remove('active');
    modeMark.classList.add('active');
  }
}

// 显示菜单
function showMenu(): void {
  renderPuzzleList('all');
  menuModal.classList.remove('hidden');
}

// 隐藏菜单
function hideMenu(): void {
  menuModal.classList.add('hidden');
}

// 渲染题目列表
function renderPuzzleList(difficulty: 'all' | 'easy' | 'medium' | 'hard'): void {
  const puzzles = getPuzzlesByDifficulty(difficulty);
  puzzleList.innerHTML = '';
  
  puzzles.forEach((puzzle) => {
    const card = document.createElement('div');
    card.className = 'puzzle-card';
    
    // 生成预览
    const preview = generatePuzzlePreview(puzzle);
    
    card.innerHTML = `
      <div class="puzzle-preview">${preview}</div>
      <div class="puzzle-info">
        <h4>${puzzle.name}</h4>
        <span class="difficulty ${puzzle.difficulty}">${getDifficultyText(puzzle.difficulty)}</span>
        <span class="size">${puzzle.solution.length}x${puzzle.solution[0].length}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      initGame(PRESETS.indexOf(puzzle));
      hideMenu();
    });
    
    puzzleList.appendChild(card);
  });
}

// 生成题目预览（ASCII 艺术）
function generatePuzzlePreview(puzzle: typeof PRESETS[0]): string {
  const size = puzzle.solution.length;
  const previewSize = Math.min(size, 8); // 最多显示8格
  const scale = Math.floor(size / previewSize);
  
  let html = '<div class="preview-grid">';
  
  for (let row = 0; row < previewSize; row++) {
    for (let col = 0; col < previewSize; col++) {
      const sourceRow = Math.min(row * scale, size - 1);
      const sourceCol = Math.min(col * scale, size - 1);
      const filled = puzzle.solution[sourceRow][sourceCol];
      
      html += `<div class="preview-cell ${filled ? 'filled' : ''}"></div>`;
    }
  }
  
  html += '</div>';
  return html;
}

// 获取难度文本
function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return '简单';
    case 'medium': return '中等';
    case 'hard': return '困难';
    default: return difficulty;
  }
}

// 显示胜利弹窗
function showWinModal(): void {
  if (game) {
    winTimeDisplay.textContent = game.formatTime();
    winModal.classList.remove('hidden');
  }
}

// 隐藏胜利弹窗
function hideWinModal(): void {
  winModal.classList.add('hidden');
}

// 下一个谜题
function nextPuzzle(): void {
  hideWinModal();
  // 简单随机选择一个不同的谜题
  const currentIndex = PRESETS.findIndex(p => p.id === game?.getState().solution.toString());
  let nextIndex = Math.floor(Math.random() * PRESETS.length);
  if (nextIndex === currentIndex) {
    nextIndex = (nextIndex + 1) % PRESETS.length;
  }
  initGame(nextIndex);
}

// 事件监听
btnMenu.addEventListener('click', showMenu);
btnCloseMenu.addEventListener('click', hideMenu);
modeFill.addEventListener('click', () => setFillMode(true));
modeMark.addEventListener('click', () => setFillMode(false));
btnCloseWin.addEventListener('click', hideWinModal);
btnNext.addEventListener('click', nextPuzzle);

// 难度标签切换
const tabs = document.querySelectorAll<HTMLButtonElement>('.difficulty-tabs .tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderPuzzleList(tab.dataset.difficulty as 'all' | 'easy' | 'medium' | 'hard');
  });
});

// 键盘快捷键
window.addEventListener('keydown', (e) => {
  if (e.key === 'z' || e.key === 'Z') {
    if (e.shiftKey) {
      game?.redo();
    } else {
      game?.undo();
    }
  } else if (e.code === 'Space') {
    e.preventDefault();
    setFillMode(!isFillMode);
  } else if (e.key === 'f' || e.key === 'F') {
    setFillMode(!isFillMode);
  } else if (e.key === 'r' || e.key === 'R') {
    game?.clear();
  }
});

// 启动游戏
initGame(0);
