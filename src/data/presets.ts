import { PresetPuzzle } from '../types/index';

export const PRESETS: PresetPuzzle[] = [
  // 简单难度 5x5
  {
    id: 'heart-5x5',
    name: '爱心',
    difficulty: 'easy',
    solution: [
      [false, true, false, true, false],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [false, true, true, true, false],
      [false, false, true, false, false],
    ]
  },
  {
    id: 'star-5x5',
    name: '星星',
    difficulty: 'easy',
    solution: [
      [false, false, true, false, false],
      [true, true, true, true, true],
      [false, true, true, true, false],
      [true, false, true, false, true],
      [true, false, false, false, true],
    ]
  },
  {
    id: 'arrow-5x5',
    name: '箭头',
    difficulty: 'easy',
    solution: [
      [false, false, true, false, false],
      [false, true, true, true, false],
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false],
    ]
  },
  
  // 简单难度 10x10
  {
    id: 'cat-10x10',
    name: '猫咪',
    difficulty: 'easy',
    solution: [
      [false, false, true, false, false, false, false, true, false, false],
      [false, true, true, true, false, false, true, true, true, false],
      [true, true, true, true, true, true, true, true, true, true],
      [true, false, true, true, true, true, true, true, false, true],
      [true, true, true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, true, true, false, false],
      [false, false, true, true, false, false, true, true, false, false],
      [false, true, true, false, false, false, false, true, true, false],
      [true, true, false, false, false, false, false, false, true, true],
    ]
  },
  {
    id: 'flower-10x10',
    name: '花朵',
    difficulty: 'easy',
    solution: [
      [false, false, false, true, true, true, true, false, false, false],
      [false, false, true, true, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, true, true, false],
      [true, true, true, false, false, false, false, true, true, true],
      [true, true, true, false, true, true, false, true, true, true],
      [true, true, true, false, true, true, false, true, true, true],
      [true, true, true, false, false, false, false, true, true, true],
      [false, true, true, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, true, true, false, false],
      [false, false, false, true, true, true, true, false, false, false],
    ]
  },
  
  // 中等难度 15x15
  {
    id: 'house-15x15',
    name: '房子',
    difficulty: 'medium',
    solution: [
      [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, true, true, true, false, false, false, false, false, false],
      [false, false, false, false, false, true, true, true, true, true, false, false, false, false, false],
      [false, false, false, false, true, true, true, true, true, true, true, false, false, false, false],
      [false, false, false, true, true, true, true, true, true, true, true, true, false, false, false],
      [false, false, true, true, true, true, true, true, true, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, true, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      [false, true, true, false, false, true, true, true, true, true, false, false, true, true, false],
      [false, true, true, false, false, true, true, true, true, true, false, false, true, true, false],
      [false, true, true, true, true, true, true, true, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, false, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, true, true, true, true, true, true, true, false],
      [false, true, true, true, true, true, true, true, true, true, true, true, true, true, false],
    ]
  },
  
  // 困难难度 20x20
  {
    id: 'tree-20x20',
    name: '大树',
    difficulty: 'hard',
    solution: [
      [false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false, true, true, true, true, false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, true, true, true, true, true, true, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, true, true, true, true, true, true, true, true, false, false, false, false, false, false],
      [false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false],
      [false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false],
      [false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false],
      [false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false],
      [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false],
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false],
      [false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false],
      [false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false],
      [false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false],
      [false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false],
      [false, false, false, false, false, false, false, false, true, true, true, true, false, false, false, false, false, false, false, false],
    ]
  }
];

// 根据难度获取题目
export function getPuzzlesByDifficulty(difficulty: 'all' | 'easy' | 'medium' | 'hard'): PresetPuzzle[] {
  if (difficulty === 'all') {
    return PRESETS;
  }
  return PRESETS.filter(p => p.difficulty === difficulty);
}

// 根据ID获取题目
export function getPuzzleById(id: string): PresetPuzzle | undefined {
  return PRESETS.find(p => p.id === id);
}