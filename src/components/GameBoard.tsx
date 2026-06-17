/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Hammer } from 'lucide-react';
import { ChocolateType, Tile } from '../types';
import { CHOCOLATE_DICTIONARY } from '../utils/chocolateData';
import { audio } from '../utils/AudioEngine';
import { ParticleLayer, ParticleLayerRef } from './ParticleLayer';

interface GameBoardProps {
  levelId: number;
  allowedTypes: ChocolateType[];
  initialObstacles?: { row: number; col: number }[];
  maxMoves: number;
  movesLeft: number;
  setMovesLeft: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  onChocolateMatch: (type: ChocolateType, count: number) => void;
  comboCount: number;
  setComboCount: React.Dispatch<React.SetStateAction<number>>;
  useSpatulaItem: boolean;
  setUseSpatulaItem: React.Dispatch<React.SetStateAction<boolean>>;
  hasSpatulaUpgrade: boolean;
  onUseSpatulaComplete?: () => void;
  useMittenItem: boolean;
  setUseMittenItem: React.Dispatch<React.SetStateAction<boolean>>;
  hasMittenUpgrade: boolean;
  onUseMittenComplete?: () => void;
  hasMistUpgrade: boolean;
  mistTrigger: number;
  isLevelCleared?: boolean;
  activeSkin?: string;
  isAnimating?: boolean;
  setIsAnimating?: (animating: boolean) => void;
}

const BOARD_SIZE = 6;

// Helper to find valid matchable swaps for the hint system
const getPossibleSwaps = (grid: Tile[][]): { tile1: Tile; tile2: Tile }[] => {
  if (grid.length === 0) return [];
  const swaps: { tile1: Tile; tile2: Tile }[] = [];

  const checkMatchAt = (g: Tile[][], r: number, c: number, type: ChocolateType): boolean => {
    if (type === ChocolateType.COCOA_BEAN) return false;
    
    // Check horizontal match containing (r, c)
    if (c >= 2 && g[r]?.[c-1]?.type === type && g[r]?.[c-2]?.type === type) return true;
    if (c >= 1 && c < BOARD_SIZE - 1 && g[r]?.[c-1]?.type === type && g[r]?.[c+1]?.type === type) return true;
    if (c < BOARD_SIZE - 2 && g[r]?.[c+1]?.type === type && g[r]?.[c+2]?.type === type) return true;

    // Check vertical match containing (r, c)
    if (r >= 2 && g[r-1]?.[c]?.type === type && g[r-2]?.[c]?.type === type) return true;
    if (r >= 1 && r < BOARD_SIZE - 1 && g[r-1]?.[c]?.type === type && g[r+1]?.[c]?.type === type) return true;
    if (r < BOARD_SIZE - 2 && g[r+1]?.[c]?.type === type && g[r+2]?.[c]?.type === type) return true;

    return false;
  };

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const tile1 = grid[r]?.[c];
      if (!tile1 || tile1.type === ChocolateType.COCOA_BEAN) continue;

      // Check right neighbor swap
      if (c + 1 < BOARD_SIZE) {
        const tile2 = grid[r]?.[c + 1];
        if (tile2 && tile2.type !== ChocolateType.COCOA_BEAN) {
          // If both are special, swapping them forms a super combo!
          if (tile1.specialEffect && tile2.specialEffect) {
            swaps.push({ tile1, tile2 });
          } else {
            // Virtual swap & check
            const type1 = tile1.type;
            const type2 = tile2.type;
            const mockGrid = grid.map((row) => row.map((t) => ({ ...t })));
            mockGrid[r][c].type = type2;
            mockGrid[r][c + 1].type = type1;

            if (checkMatchAt(mockGrid, r, c, type2) || checkMatchAt(mockGrid, r, c + 1, type1)) {
              swaps.push({ tile1, tile2 });
            }
          }
        }
      }

      // Check bottom neighbor swap
      if (r + 1 < BOARD_SIZE) {
        const tile2 = grid[r + 1]?.[c];
        if (tile2 && tile2.type !== ChocolateType.COCOA_BEAN) {
          if (tile1.specialEffect && tile2.specialEffect) {
            swaps.push({ tile1, tile2 });
          } else {
            // Virtual swap & check
            const type1 = tile1.type;
            const type2 = tile2.type;
            const mockGrid = grid.map((row) => row.map((t) => ({ ...t })));
            mockGrid[r][c].type = type2;
            mockGrid[r + 1][c].type = type1;

            if (checkMatchAt(mockGrid, r, c, type2) || checkMatchAt(mockGrid, r + 1, c, type1)) {
              swaps.push({ tile1, tile2 });
            }
          }
        }
      }
    }
  }

  return swaps;
};

export const GameBoard: React.FC<GameBoardProps> = ({
  levelId,
  allowedTypes,
  initialObstacles = [],
  maxMoves,
  movesLeft,
  setMovesLeft,
  score,
  setScore,
  onChocolateMatch,
  comboCount,
  setComboCount,
  useSpatulaItem,
  setUseSpatulaItem,
  hasSpatulaUpgrade,
  onUseSpatulaComplete,
  useMittenItem,
  setUseMittenItem,
  hasMittenUpgrade,
  onUseMittenComplete,
  hasMistUpgrade,
  mistTrigger,
  isLevelCleared = false,
  activeSkin = 'none',
  setIsAnimating: setIsAnimatingProps,
}) => {
  const [board, setBoard] = useState<Tile[][]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hintTileIds, setHintTileIds] = useState<string[]>([]);
  const isMounted = useRef(true);
  const particleLayerRef = useRef<ParticleLayerRef>(null);

  useEffect(() => {
    if (setIsAnimatingProps) {
      setIsAnimatingProps(isAnimating);
    }
  }, [isAnimating, setIsAnimatingProps]);

  // Idle timer to present matching hints when there is no operation for a while (7.5 seconds)
  useEffect(() => {
    // Clear hint as soon as anything changes
    setHintTileIds([]);

    if (isAnimating || isLevelCleared || movesLeft <= 0) {
      return;
    }

    // Do not show hints if using items
    if (useSpatulaItem || useMittenItem) {
      return;
    }

    const timerId = setTimeout(() => {
      const swaps = getPossibleSwaps(board);
      if (swaps.length > 0) {
        // Highlight the first found swap as a hint!
        const hintSwap = swaps[0];
        setHintTileIds([hintSwap.tile1.id, hintSwap.tile2.id]);
      }
    }, 7500); // 7.5 seconds of no activity

    return () => {
      clearTimeout(timerId);
    };
  }, [board, isAnimating, selectedTile, useSpatulaItem, useMittenItem, isLevelCleared, movesLeft]);

  // Initialize Board on mount or level change
  useEffect(() => {
    isMounted.current = true;
    initializeBoard();
    return () => {
      isMounted.current = false;
    };
  }, [levelId, allowedTypes]);

  // Respond to parent-initiated magic mist shuffle
  useEffect(() => {
    if (mistTrigger > 0) {
      shuffleBoard();
    }
  }, [mistTrigger]);



  const generateRandomChocolate = (): ChocolateType => {
    const randomIndex = Math.floor(Math.random() * allowedTypes.length);
    return allowedTypes[randomIndex];
  };

  const initializeBoard = () => {
    let newBoard: Tile[][] = [];
    let attempts = 0;

    // Retry to make sure we don't start with pre-made matches
    do {
      newBoard = [];
      let tileIdCounter = 0;

      for (let r = 0; r < BOARD_SIZE; r++) {
        const rowTile: Tile[] = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
          // Check if this position is meant to have a Cocoa Bean obstacle
          const isObstacle = initialObstacles.some((obs) => obs.row === r && obs.col === c);
          
          rowTile.push({
            id: `tile_${r}_${c}_${tileIdCounter++}_${Date.now()}`,
            row: r,
            col: c,
            type: isObstacle ? ChocolateType.COCOA_BEAN : generateRandomChocolate(),
          });
        }
        newBoard.push(rowTile);
      }
      attempts++;
    } while (hasMatches(newBoard) && attempts < 50);

    setBoard(newBoard);
    setSelectedTile(null);
    setIsAnimating(false);
    setComboCount(0);
  };

  const shuffleBoard = () => {
    if (board.length === 0) return;
    
    let attempts = 0;
    let shuffledBoard: Tile[][] = [];
    
    // Extract non-obstacle chocolates
    const chocolates: ChocolateType[] = [];
    board.forEach((rowArr) => {
      rowArr.forEach((tile) => {
        if (tile.type !== ChocolateType.COCOA_BEAN) {
          chocolates.push(tile.type);
        }
      });
    });

    if (chocolates.length === 0) return;

    do {
      // Shuffle the list
      const list = [...chocolates];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }

      // Re-populate board
      shuffledBoard = board.map((rowArr) =>
        rowArr.map((tile) => {
          if (tile.type === ChocolateType.COCOA_BEAN) {
            return { ...tile };
          } else {
            const poppedType = list.pop() || generateRandomChocolate();
            return {
              ...tile,
              type: poppedType,
              id: `tile_${tile.row}_${tile.col}_${Date.now()}_${Math.random()}`,
            };
          }
        })
      );
      attempts++;
    } while (hasMatches(shuffledBoard) && attempts < 40);

    setBoard(shuffledBoard);
    setSelectedTile(null);
    setIsAnimating(false);
    audio.playSwipe();
    
    // Spawn sparkles everywhere for great visual effect!
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (Math.random() > 0.6) {
          spawnSparkles(r, c, shuffledBoard[r][c].type);
        }
      }
    }
  };

  const triggerSpecialCombo = async (
    tile1: Tile,
    tile2: Tile,
    deductMove: boolean,
    onComplete?: () => void
  ) => {
    const effect1 = tile1.specialEffect;
    const effect2 = tile2.specialEffect;
    if (!effect1 || !effect2) return;

    // スペシャルチョコレート同士の合体コンボ！
    const finalBoard = board.map((rowArr) => rowArr.map((t) => ({ ...t })));

    // スワップのアニメーションを見せるために実際に位置を入れ替える
    const temp = finalBoard[tile1.row][tile1.col];
    finalBoard[tile1.row][tile1.col] = finalBoard[tile2.row][tile2.col];
    finalBoard[tile2.row][tile2.col] = temp;

    // refresh coordinates
    finalBoard[tile1.row][tile1.col].row = tile1.row;
    finalBoard[tile1.row][tile1.col].col = tile1.col;
    finalBoard[tile2.row][tile2.col].row = tile2.row;
    finalBoard[tile2.row][tile2.col].col = tile2.col;

    setBoard(finalBoard);
    audio.playSwipe();

    // スライドアニメーションを少し待つ
    await new Promise((resolve) => setTimeout(resolve, 300));

    const comboCoords = new Set<string>();
    const r1 = tile1.row;
    const c1 = tile1.col;
    const r2 = tile2.row;
    const c2 = tile2.col;

    if (effect1 === 'bomb' && effect2 === 'bomb') {
      // 爆弾×爆弾：スーパーノヴァ爆発（周囲5x5領域をまるごと消去）
      const centerR = r2;
      const centerC = c2;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = centerR + dr;
          const nc = centerC + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (finalBoard[nr][nc].type !== ChocolateType.COCOA_BEAN) {
              comboCoords.add(`${nr}_${nc}`);
            }
          }
        }
      }
    } else if (
      (effect1 === 'bomb' && (effect2 === 'row' || effect2 === 'col')) ||
      (effect2 === 'bomb' && (effect1 === 'row' || effect1 === 'col'))
    ) {
      // 爆弾×レーザー：極太スーパー十字ビーム（中心3行3列を全消去）
      const centerR = r2;
      const centerC = c2;
      for (let dr = -1; dr <= 1; dr++) {
        const r = centerR + dr;
        if (r >= 0 && r < BOARD_SIZE) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (finalBoard[r][c].type !== ChocolateType.COCOA_BEAN) {
              comboCoords.add(`${r}_${c}`);
            }
          }
        }
      }
      for (let dc = -1; dc <= 1; dc++) {
        const c = centerC + dc;
        if (c >= 0 && c < BOARD_SIZE) {
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (finalBoard[r][c].type !== ChocolateType.COCOA_BEAN) {
              comboCoords.add(`${r}_${c}`);
            }
          }
        }
      }
    } else {
      // レーザー×レーザー（row×row, col×col, row×col）：十字消し（r1行、r2行、c1列、c2列のすべてを全消去）
      [r1, r2].forEach((r) => {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (finalBoard[r][c].type !== ChocolateType.COCOA_BEAN) {
            comboCoords.add(`${r}_${c}`);
          }
        }
      });
      [c1, c2].forEach((c) => {
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (finalBoard[r][c].type !== ChocolateType.COCOA_BEAN) {
            comboCoords.add(`${r}_${c}`);
          }
        }
      });
    }

    // 共通の消去処理！
    audio.playSpatula(); // 特大エフェクト音代わりに道具音を使用

    // 得点を計算
    const clearedTypesCounts: { [key in ChocolateType]?: number } = {};
    comboCoords.forEach((coordStr) => {
      const [rStr, cStr] = coordStr.split('_');
      const r = parseInt(rStr);
      const c = parseInt(cStr);
      const tile = finalBoard[r]?.[c];
      if (tile && tile.type !== ChocolateType.COCOA_BEAN) {
        clearedTypesCounts[tile.type] = (clearedTypesCounts[tile.type] || 0) + 1;
      }
    });

    let scoreGained = 0;
    Object.keys(clearedTypesCounts).forEach((key) => {
      const type = key as ChocolateType;
      const count = clearedTypesCounts[type] || 0;
      const unitPoints = CHOCOLATE_DICTIONARY[type].points;
      const lengthBonus = count > 3 ? (count - 3) * 1.5 : 1;
      scoreGained += Math.round(count * unitPoints * lengthBonus * 2.5);
      onChocolateMatch(type, count);
    });
    setScore((prev) => prev + scoreGained);

    // ココア豆クラッカー
    const obstaclesToClear = new Set<string>();
    comboCoords.forEach((coordStr) => {
      const [rStr, cStr] = coordStr.split('_');
      const r = parseInt(rStr);
      const c = parseInt(cStr);
      spawnSparkles(r, c, finalBoard[r][c].type);

      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 },
      ];
      neighbors.forEach((nb) => {
        if (nb.r >= 0 && nb.r < BOARD_SIZE && nb.c >= 0 && nb.c < BOARD_SIZE) {
          const neighborTile = finalBoard[nb.r][nb.c];
          if (neighborTile && neighborTile.type === ChocolateType.COCOA_BEAN) {
            obstaclesToClear.add(`${nb.r}_${nb.c}`);
          }
        }
      });
    });

    const clearedBoard = finalBoard.map((rowArr, r) =>
      rowArr.map((tile, c) => {
        const coordKey = `${r}_${c}`;
        const isMatched = comboCoords.has(coordKey);
        const isObstacleCracked = obstaclesToClear.has(coordKey);

        if (isObstacleCracked) {
          spawnSparkles(r, c, ChocolateType.COCOA_BEAN);
          onChocolateMatch(ChocolateType.COCOA_BEAN, 1);
          setScore((prev) => prev + CHOCOLATE_DICTIONARY[ChocolateType.COCOA_BEAN].points);
        }

        if (isMatched || isObstacleCracked) {
          return { ...tile, isMatching: true };
        }
        return tile;
      })
    );

    setBoard(clearedBoard);
    if (deductMove) {
      setMovesLeft((prev) => prev - 1);
    }
    setSelectedTile(null);

    await new Promise((resolve) => setTimeout(resolve, 350));

    const nextBoard = collapseBoard(clearedBoard);
    setBoard(nextBoard);
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 連鎖チェック開始
    await checkAndClearMatches(nextBoard, 1);

    setIsAnimating(false);
    if (onComplete) {
      onComplete();
    }
  };

  const swapTilesWithMitten = async (tile1: Tile, tile2: Tile) => {
    setIsAnimating(true);
    setSelectedTile(null);

    const effect1 = tile1.specialEffect;
    const effect2 = tile2.specialEffect;

    if (effect1 && effect2) {
      // ミトン利用時でもスペシャル合体コンボが発動！
      await triggerSpecialCombo(tile1, tile2, false, () => {
        setUseMittenItem(false);
        if (onUseMittenComplete) {
          onUseMittenComplete();
        }
      });
      return;
    }
    
    const finalBoard = board.map((rowArr) => rowArr.map((t) => ({ ...t })));

    // Perform raw swap of both type & special effects
    const tempType = finalBoard[tile1.row][tile1.col].type;
    const tempEffect = finalBoard[tile1.row][tile1.col].specialEffect;
    
    finalBoard[tile1.row][tile1.col].type = finalBoard[tile2.row][tile2.col].type;
    finalBoard[tile1.row][tile1.col].specialEffect = finalBoard[tile2.row][tile2.col].specialEffect;
    
    finalBoard[tile2.row][tile2.col].type = tempType;
    finalBoard[tile2.row][tile2.col].specialEffect = tempEffect;

    setBoard(finalBoard);
    audio.playSpatula(); // Play item sound

    // Sleep a bit during the slide animation
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Resolve matches if any were formed
    await checkAndClearMatches(finalBoard, 0);

    setIsAnimating(false);
    setUseMittenItem(false);
    if (onUseMittenComplete) {
      onUseMittenComplete();
    }
  };

  const spawnSparkles = (row: number, col: number, type: ChocolateType) => {
    particleLayerRef.current?.spawnSparkles(row, col, type);
  };

  // Match Calculation
  const hasMatches = (grid: Tile[][]): boolean => {
    if (grid.length === 0) return false;
    
    // Check horizontal
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const t1 = grid[r][c]?.type;
        const t2 = grid[r][c + 1]?.type;
        const t3 = grid[r][c + 2]?.type;
        if (
          t1 !== undefined &&
          t1 !== ChocolateType.COCOA_BEAN &&
          t1 === t2 &&
          t1 === t3
        ) {
          return true;
        }
      }
    }

    // Check vertical
    for (let r = 0; r < BOARD_SIZE - 2; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const t1 = grid[r][c]?.type;
        const t2 = grid[r + 1][c]?.type;
        const t3 = grid[r + 2][c]?.type;
        if (
          t1 !== undefined &&
          t1 !== ChocolateType.COCOA_BEAN &&
          t1 === t2 &&
          t1 === t3
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const checkAndClearMatches = async (currentBoard: Tile[][], iteration: number = 0): Promise<boolean> => {
    if (currentBoard.length === 0) return false;
    
    const matchesToClear = new Set<string>();
    const matchCountByType: { [key in ChocolateType]?: number } = {};

    const horizontalMatches: { r: number; startCol: number; length: number; type: ChocolateType }[] = [];
    const verticalMatches: { c: number; startRow: number; length: number; type: ChocolateType }[] = [];

    // Horizontal matches
    for (let r = 0; r < BOARD_SIZE; r++) {
      let matchLength = 1;
      let matchType: ChocolateType | null = null;
      let startCol = 0;

      for (let c = 0; c < BOARD_SIZE; c++) {
        const currentType = currentBoard[r][c]?.type;
        const isObstacle = currentType === ChocolateType.COCOA_BEAN;

        if (currentType && !isObstacle && currentType === matchType) {
          matchLength++;
        } else {
          if (matchLength >= 3 && matchType) {
            horizontalMatches.push({ r, startCol, length: matchLength, type: matchType });
          }
          matchType = isObstacle ? null : currentType || null;
          matchLength = 1;
          startCol = c;
        }
      }
      // Boundary check
      if (matchLength >= 3 && matchType) {
        horizontalMatches.push({ r, startCol, length: matchLength, type: matchType });
      }
    }

    // Vertical matches
    for (let c = 0; c < BOARD_SIZE; c++) {
      let matchLength = 1;
      let matchType: ChocolateType | null = null;
      let startRow = 0;

      for (let r = 0; r < BOARD_SIZE; r++) {
        const currentType = currentBoard[r][c]?.type;
        const isObstacle = currentType === ChocolateType.COCOA_BEAN;

        if (currentType && !isObstacle && currentType === matchType) {
          matchLength++;
        } else {
          if (matchLength >= 3 && matchType) {
            verticalMatches.push({ c, startRow, length: matchLength, type: matchType });
          }
          matchType = isObstacle ? null : currentType || null;
          matchLength = 1;
          startRow = r;
        }
      }
      // Boundary check
      if (matchLength >= 3 && matchType) {
        verticalMatches.push({ c, startRow, length: matchLength, type: matchType });
      }
    }

    // Populate standard matches to clear
    horizontalMatches.forEach((m) => {
      for (let i = m.startCol; i < m.startCol + m.length; i++) {
        matchesToClear.add(`${m.r}_${i}`);
      }
      matchCountByType[m.type] = (matchCountByType[m.type] || 0) + m.length;
    });

    verticalMatches.forEach((m) => {
      for (let i = m.startRow; i < m.startRow + m.length; i++) {
        matchesToClear.add(`${i}_${m.c}`);
      }
      matchCountByType[m.type] = (matchCountByType[m.type] || 0) + m.length;
    });

    if (matchesToClear.size === 0) return false;

    // We found matches! Let's do beautiful destruction effects.
    audio.playCrunch();
    setComboCount((prev) => prev + 1);

    // Calculate spawning coordinates for special items before expanding clearing sets
    const specialSpawns = new Map<string, 'row' | 'col' | 'bomb'>();

    // Detect T-shape or L-shape intersections (same coordinate in both horizontal and vertical matches) -> BOMB!
    const crossedCoords = new Set<string>();
    horizontalMatches.forEach((hm) => {
      verticalMatches.forEach((vm) => {
        if (vm.c >= hm.startCol && vm.c < hm.startCol + hm.length &&
            hm.r >= vm.startRow && hm.r < vm.startRow + vm.length) {
          crossedCoords.add(`${hm.r}_${vm.c}`);
        }
      });
    });

    crossedCoords.forEach((coord) => {
      specialSpawns.set(coord, 'bomb');
    });

    // Handle horizontal special items (4 matching -> col, 5 matching -> bomb)
    horizontalMatches.forEach((m) => {
      let hasCrossed = false;
      let spawnCol = m.startCol + Math.floor(m.length / 2);
      for (let col = m.startCol; col < m.startCol + m.length; col++) {
        if (crossedCoords.has(`${m.r}_${col}`)) {
          hasCrossed = true;
          break;
        }
      }
      if (!hasCrossed) {
        if (m.length === 4) {
          specialSpawns.set(`${m.r}_${spawnCol}`, 'col');
        } else if (m.length >= 5) {
          specialSpawns.set(`${m.r}_${spawnCol}`, 'bomb');
        }
      }
    });

    // Handle vertical special items (4 matching -> row, 5 matching -> bomb)
    verticalMatches.forEach((m) => {
      let hasCrossed = false;
      let spawnRow = m.startRow + Math.floor(m.length / 2);
      for (let row = m.startRow; row < m.startRow + m.length; row++) {
        if (crossedCoords.has(`${row}_${m.c}`)) {
          hasCrossed = true;
          break;
        }
      }
      if (!hasCrossed) {
        if (m.length === 4) {
          specialSpawns.set(`${spawnRow}_${m.c}`, 'row');
        } else if (m.length >= 5) {
          specialSpawns.set(`${spawnRow}_${m.c}`, 'bomb');
        }
      }
    });

    // Now, expand the clearing pool with custom special effects triggers
    const finalClearedCoords = new Set<string>(matchesToClear);
    const triggeredSpecialCoords = new Set<string>();

    let addedAny = true;
    while (addedAny) {
      addedAny = false;
      const currentSnapshot = [...finalClearedCoords];

      for (const coordStr of currentSnapshot) {
        if (triggeredSpecialCoords.has(coordStr)) continue;

        const [rStr, cStr] = coordStr.split('_');
        const r = parseInt(rStr);
        const c = parseInt(cStr);
        const tile = currentBoard[r]?.[c];

        if (tile && tile.specialEffect) {
          triggeredSpecialCoords.add(coordStr);
          addedAny = true;

          // Sound of item activating
          audio.playSpatula();

          if (tile.specialEffect === 'row') {
            // Horizontal laser: Clear entire row
            for (let col = 0; col < BOARD_SIZE; col++) {
              if (currentBoard[r][col].type !== ChocolateType.COCOA_BEAN) {
                finalClearedCoords.add(`${r}_${col}`);
              }
            }
          } else if (tile.specialEffect === 'col') {
            // Vertical laser: Clear entire col
            for (let row = 0; row < BOARD_SIZE; row++) {
              if (currentBoard[row][c].type !== ChocolateType.COCOA_BEAN) {
                finalClearedCoords.add(`${row}_${c}`);
              }
            }
          } else if (tile.specialEffect === 'bomb') {
            // Bomb explosion: Clear surrounding 3x3 tiles
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                  if (currentBoard[nr][nc].type !== ChocolateType.COCOA_BEAN) {
                    finalClearedCoords.add(`${nr}_${nc}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Recalculate score recursively based on ALL cleared gems (including special effects extra clears!)
    let scoreGained = 0;
    const clearedTypesCounts: { [key in ChocolateType]?: number } = {};

    finalClearedCoords.forEach((coordStr) => {
      const [rStr, cStr] = coordStr.split('_');
      const r = parseInt(rStr);
      const c = parseInt(cStr);
      const tile = currentBoard[r]?.[c];
      if (tile && tile.type !== ChocolateType.COCOA_BEAN) {
        clearedTypesCounts[tile.type] = (clearedTypesCounts[tile.type] || 0) + 1;
      }
    });

    Object.keys(clearedTypesCounts).forEach((key) => {
      const type = key as ChocolateType;
      const count = clearedTypesCounts[type] || 0;
      const unitPoints = CHOCOLATE_DICTIONARY[type].points;

      const lengthBonus = count > 3 ? (count - 3) * 1.5 : 1;
      const comboBonus = 1 + (iteration * 0.2);
      scoreGained += Math.round(count * unitPoints * lengthBonus * comboBonus);

      onChocolateMatch(type, count);
    });

    // Add extra combo bonus score if cascading (iteration >= 2)
    if (iteration >= 2) {
      const comboExtraPoints = (iteration - 1) * 50;
      scoreGained += comboExtraPoints;
    }

    setScore((prev) => prev + scoreGained);

    // Crack down adjacent Cocoa Bean obstacles
    const obstaclesToClear = new Set<string>();
    finalClearedCoords.forEach((coordStr) => {
      const [rStr, cStr] = coordStr.split('_');
      const r = parseInt(rStr);
      const c = parseInt(cStr);

      const matchedTile = currentBoard[r]?.[c];
      if (matchedTile) {
        spawnSparkles(r, c, matchedTile.type);
      }

      // Check Neighbors for Cocoa Bean cracker
      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 },
      ];

      neighbors.forEach((nb) => {
        if (nb.r >= 0 && nb.r < BOARD_SIZE && nb.c >= 0 && nb.c < BOARD_SIZE) {
          const neighborTile = currentBoard[nb.r][nb.c];
          if (neighborTile && neighborTile.type === ChocolateType.COCOA_BEAN) {
            obstaclesToClear.add(`${nb.r}_${nb.c}`);
          }
        }
      });
    });

    // Build the cleared board map, inserting newly created special tiles
    const clearedBoard = currentBoard.map((rowArr, r) =>
      rowArr.map((tile, c) => {
        const coordKey = `${r}_${c}`;
        const isMatched = finalClearedCoords.has(coordKey);
        const isObstacleCracked = obstaclesToClear.has(coordKey);

        if (isObstacleCracked) {
          spawnSparkles(r, c, ChocolateType.COCOA_BEAN);
          onChocolateMatch(ChocolateType.COCOA_BEAN, 1);
          setScore((prev) => prev + CHOCOLATE_DICTIONARY[ChocolateType.COCOA_BEAN].points);
        }

        // If this coordinate spawned a special item AND is part of the cleared matches, keep it as a special item!
        if (specialSpawns.has(coordKey) && isMatched && !isObstacleCracked) {
          const effect = specialSpawns.get(coordKey)!;
          return {
            ...tile,
            isMatching: false, // Don't match/clear it yet, it's just born!
            specialEffect: effect,
            id: `tile_special_${r}_${c}_${Date.now()}_${Math.random()}`,
          };
        }

        if (isMatched || isObstacleCracked) {
          return { ...tile, isMatching: true };
        }
        return tile;
      })
    );

    setBoard(clearedBoard);
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Collapse board (gravity setup)
    const nextBoard = collapseBoard(clearedBoard);
    setBoard(nextBoard);
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Recursively check for cascade matches
    await checkAndClearMatches(nextBoard, iteration + 1);
    return true;
  };

  const collapseBoard = (currentBoard: Tile[][]): Tile[][] => {
    const nextBoard: Tile[][] = [];
    let tileIdCounter = 0;

    // We process column by column
    for (let c = 0; c < BOARD_SIZE; c++) {
      const columnTiles: Tile[] = [];
      // Grab all non-cleared tiles in this column from bottom to top
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (!currentBoard[r][c].isMatching) {
          columnTiles.push({ ...currentBoard[r][c] });
        }
      }

      // Fill remaining spaces at the top with fresh chocolates!
      while (columnTiles.length < BOARD_SIZE) {
        columnTiles.push({
          id: `tile_new_${columnTiles.length}_${c}_${tileIdCounter++}_${Date.now()}_${Math.random()}`,
          row: -1, // will slide down
          col: c,
          type: generateRandomChocolate(),
        });
      }

      // Reverse so it maps back top to bottom
      columnTiles.reverse();

      // Update their actual grid row indices safely by creating new tile objects
      for (let r = 0; r < BOARD_SIZE; r++) {
        columnTiles[r] = {
          ...columnTiles[r],
          row: r,
          col: c,
        };
      }

      // Insert columns into nextBoard structure
      if (nextBoard.length === 0) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          nextBoard.push([]);
        }
      }
      for (let r = 0; r < BOARD_SIZE; r++) {
        nextBoard[r][c] = columnTiles[r];
      }
    }

    return nextBoard;
  };

  const swapTiles = async (tile1: Tile, tile2: Tile) => {
    setIsAnimating(true);
    setComboCount(0);

    const effect1 = tile1.specialEffect;
    const effect2 = tile2.specialEffect;

    if (effect1 && effect2) {
      await triggerSpecialCombo(tile1, tile2, true);
      return;
    }

    // Create a complete deep row copy of the board to prevent cell cross-referencing mutations
    const finalBoard = board.map((rowArr) => [...rowArr]);

    // Perform swap in the newly copied structure
    const temp = finalBoard[tile1.row][tile1.col];
    finalBoard[tile1.row][tile1.col] = finalBoard[tile2.row][tile2.col];
    finalBoard[tile2.row][tile2.col] = temp;

    // Refresh inner tile coordinates accurately matching their new cells
    finalBoard[tile1.row][tile1.col] = {
      ...finalBoard[tile1.row][tile1.col],
      row: tile1.row,
      col: tile1.col,
    };
    finalBoard[tile2.row][tile2.col] = {
      ...finalBoard[tile2.row][tile2.col],
      row: tile2.row,
      col: tile2.col,
    };

    setBoard(finalBoard);
    audio.playSwipe();

    // Sleep a bit during the slide animation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const clearedAny = await checkAndClearMatches(finalBoard, 0);

    if (clearedAny) {
      setMovesLeft((prev) => prev - 1);
    } else {
      // Swap back since it was an invalid matching move!
      audio.playError();
      const finalReverted = finalBoard.map((rowArr) => [...rowArr]);

      const tempRev = finalReverted[tile1.row][tile1.col];
      finalReverted[tile1.row][tile1.col] = finalReverted[tile2.row][tile2.col];
      finalReverted[tile2.row][tile2.col] = tempRev;

      finalReverted[tile1.row][tile1.col] = {
        ...finalReverted[tile1.row][tile1.col],
        row: tile1.row,
        col: tile1.col,
      };
      finalReverted[tile2.row][tile2.col] = {
        ...finalReverted[tile2.row][tile2.col],
        row: tile2.row,
        col: tile2.col,
      };

      setBoard(finalReverted);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setSelectedTile(null);
    setIsAnimating(false);
  };

  const handleTileClick = (tile: Tile) => {
    setHintTileIds([]);
    if (isAnimating || movesLeft <= 0 || isLevelCleared) return;

    // Spatula Hammer Tool Mechanic
    if (useSpatulaItem && hasSpatulaUpgrade) {
      if (tile.type === ChocolateType.COCOA_BEAN) {
        audio.playError();
        return; // standard spatula cannot directly destroy the boss bean, but matches next to it can!
      }
      audio.playSpatula();
      // Instantly crush this chocolate!
      spawnSparkles(tile.row, tile.col, tile.type);
      onChocolateMatch(tile.type, 1);
      setScore((prev) => prev + CHOCOLATE_DICTIONARY[tile.type].points);

      const destroyedBoard = board.map((rowArr) =>
        rowArr.map((t) => (t.row === tile.row && t.col === tile.col ? { ...t, isMatching: true } : t))
      );
      setBoard(destroyedBoard);
      
      // Clear Spatula Mode
      setUseSpatulaItem(false);
      if (onUseSpatulaComplete) {
        onUseSpatulaComplete();
      }

      setTimeout(async () => {
        const nextB = collapseBoard(destroyedBoard);
        setBoard(nextB);
        await new Promise((r) => setTimeout(r, 350));
        await checkAndClearMatches(nextB, 0);
      }, 350);
      return;
    }

    // Cocoa Bean cannot be selected/swapped directly!
    if (tile.type === ChocolateType.COCOA_BEAN) {
      audio.playError();
      return;
    }

    if (!selectedTile) {
      setSelectedTile(tile);
    } else {
      // Check if clicked tile is adjacent to the selected tile
      const rowDiff = Math.abs(selectedTile.row - tile.row);
      const colDiff = Math.abs(selectedTile.col - tile.col);
      const isAdjacent = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);

      if (isAdjacent) {
        if (useMittenItem && hasMittenUpgrade) {
          swapTilesWithMitten(selectedTile, tile);
        } else {
          swapTiles(selectedTile, tile);
        }
      } else {
        // Change selection
        setSelectedTile(tile);
      }
    }
  };

  // Drag Swapping Handlers
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, tile: Tile) => {
    setHintTileIds([]);
    if (tile.type === ChocolateType.COCOA_BEAN || isLevelCleared) return;
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
    setSelectedTile(tile);
  };

  const handleTouchEnd = (e: React.TouchEvent, tile: Tile) => {
    if (!dragStartPos.current || isAnimating || movesLeft <= 0 || isLevelCleared) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - dragStartPos.current.x;
    const diffY = touch.clientY - dragStartPos.current.y;
    const threshold = 35; // minimum swipe size in px

    let targetRow = tile.row;
    let targetCol = tile.col;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        targetCol = diffX > 0 ? tile.col + 1 : tile.col - 1;
      }
    } else {
      if (Math.abs(diffY) > threshold) {
        targetRow = diffY > 0 ? tile.row + 1 : tile.row - 1;
      }
    }

    if (targetRow !== tile.row || targetCol !== tile.col) {
      if (targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE) {
        const targetTile = board[targetRow][targetCol];
        if (targetTile && targetTile.type !== ChocolateType.COCOA_BEAN) {
          if (useMittenItem && hasMittenUpgrade) {
            swapTilesWithMitten(tile, targetTile);
          } else {
            swapTiles(tile, targetTile);
          }
        } else {
          audio.playError();
          setSelectedTile(null);
        }
      } else {
        setSelectedTile(null);
      }
    }
    dragStartPos.current = null;
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Golden Grid Frame Decor */}
      <div className="p-4 bg-amber-950 border-4 border-yellow-600/60 rounded-3xl shadow-2xl relative">
        {/* Particle Canvas Layer */}
        <ParticleLayer ref={particleLayerRef} />

        {/* The 6x6 Play Grid background slots */}
        <div 
          id="play_grid"
          className="grid grid-cols-6 grid-rows-6 gap-2 w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] bg-amber-970 p-1.5 rounded-2xl relative"
          style={{ backgroundColor: '#1C0D02' }}
        >
          {/* Back slot plates */}
          {Array.from({ length: 36 }).map((_, idx) => (
            <div
              key={`slot_${idx}`}
              className="w-full h-full bg-amber-950/20 border border-amber-900/10 rounded-xl"
              style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)' }}
            />
          ))}

          {/* Active Interactive Tiles Absolute layer */}
          <div className="absolute inset-1.5 pointer-events-auto">
            <AnimatePresence>
              {board.flatMap((rowArr) =>
                rowArr.map((tile) => {
                  const isSelected = selectedTile?.id === tile.id;
                  const item = CHOCOLATE_DICTIONARY[tile.type];

                      const neonColor = {
                        [ChocolateType.MILK]: '#f59e0b',
                        [ChocolateType.WHITE_RUBY]: '#fef08a',
                        [ChocolateType.CARAMEL]: '#cca87a',
                        [ChocolateType.STRAWBERRY]: '#ec4899',
                        [ChocolateType.MATCHA]: '#22c55e',
                        [ChocolateType.ORANGE]: '#f97316',
                      }[tile.type] || '#f59e0b';

                      let customBoxShadow = '2px 4px 6px rgba(0,0,0,0.4)';
                      if (isSelected) {
                        customBoxShadow = '0 0 15px rgba(251, 191, 36, 0.8)';
                      } else if (activeSkin === 'skin_neon') {
                        customBoxShadow = `0 0 12px ${neonColor}`;
                      } else if (activeSkin === 'skin_space') {
                        customBoxShadow = '0 0 10px rgba(139, 92, 246, 0.45), inset 0 0 8px rgba(139, 92, 246, 0.2)';
                      }

                      const skinBgClass = 
                        activeSkin === 'skin_space'
                          ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-violet-500/30'
                          : activeSkin === 'skin_neon'
                          ? 'bg-neutral-950 border border-white/20'
                          : `bg-gradient-to-br ${item.colorGradient}`;

                      return (
                        <motion.div
                          key={tile.id}
                          id={tile.id}
                          className={`absolute w-[15.2%] h-[15.2%] flex items-center justify-center cursor-pointer select-none rounded-2xl touch-none`}
                          style={{
                            top: `${tile.row * 16.66}%`,
                            left: `${tile.col * 16.66}%`,
                          }}
                          layout="position"
                          transition={{
                            type: 'spring',
                            stiffness: 280,
                            damping: 24,
                          }}
                          onClick={() => handleTileClick(tile)}
                          onTouchStart={(e) => handleTouchStart(e, tile)}
                          onTouchEnd={(e) => handleTouchEnd(e, tile)}
                          whileHover={{ scale: tile.type === ChocolateType.COCOA_BEAN ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div
                            className={`w-full h-full rounded-xl flex flex-col items-center justify-center transition-all relative ${
                              tile.isMatching ? 'scale-0 rotate-12 opacity-0' : 'scale-100'
                            } ${
                              isSelected
                                ? 'ring-4 ring-yellow-400 rotate-2 shadow-amber-400/40 shadow-lg'
                                : activeSkin === 'skin_neon'
                                ? 'border-t border-l border-white/25'
                                : 'shadow-md border-b-[3px] border-black/45'
                            } ${skinBgClass}`}
                            style={{
                              transition: 'transform 0.25s ease-out, opacity 0.2s',
                              boxShadow: customBoxShadow,
                            }}
                          >
                            {/* Realistic 3D Chocolate Bar Piece Bevel styling */}
                            {activeSkin !== 'skin_neon' && activeSkin !== 'skin_space' && tile.type !== ChocolateType.COCOA_BEAN && (
                              <div className="absolute inset-1 rounded-lg pointer-events-none border-t border-l border-white/25 border-r border-b border-black/60 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.35),inset_-1px_-1px_2px_rgba(0,0,0,0.6)] flex items-center justify-center z-0">
                                {/* Inner indent ring of classic premium chocolate segments */}
                                <div className="absolute inset-1.5 border border-black/35 border-t-black/45 border-l-black/40 border-r-white/10 border-b-white/15 rounded bg-black/10 flex items-center justify-center">
                                  {/* Glossy top-left light source */}
                                  <div className="absolute inset-0.5 bg-gradient-to-br from-white/15 to-transparent rounded pointer-events-none" />
                                </div>
                              </div>
                            )}

                            {/* Rugged Cocoa Bean Obstacle rustic 3D look */}
                            {tile.type === ChocolateType.COCOA_BEAN && activeSkin !== 'skin_neon' && activeSkin !== 'skin_space' && (
                              <div className="absolute inset-1 rounded-full pointer-events-none border-2 border-stone-900 bg-gradient-to-br from-stone-700 via-stone-850 to-stone-950 shadow-[inset_1px_1.5px_2px_rgba(255,255,255,0.25),2px_3px_5px_rgba(0,0,0,0.7)] flex items-center justify-center z-0">
                                {/* Textured center ridge */}
                                <div className="absolute w-[80%] h-[20%] bg-stone-950/50 rounded-full top-2 border-t border-white/5" />
                              </div>
                            )}

                            {/* Hint Glowing Breathing Ring Overlay */}
                            {hintTileIds.includes(tile.id) && !isSelected && (
                              <div 
                                className="absolute inset-0.5 rounded-lg border-2 border-yellow-400 pointer-events-none z-20 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.9)]"
                                style={{
                                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.7), inset 0 0 8px rgba(251, 191, 36, 0.5)'
                                }}
                              />
                            )}

                            {/* Shimmer/Gloss Plate */}
                            {activeSkin !== 'skin_neon' && (
                              <div className="absolute inset-0.5 bg-gradient-to-br from-white/15 to-transparent rounded-lg pointer-events-none z-10" />
                            )}

                            {/* Space Cosmic Skin particles inside tile */}
                            {activeSkin === 'skin_space' && (
                              <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden opacity-50 z-0">
                                <span className="absolute top-[10%] left-[20%] text-[5px] text-yellow-300 animate-pulse">✦</span>
                                <span className="absolute bottom-[15%] right-[15%] text-[4px] text-white animate-pulse" style={{ animationDelay: '0.6s' }}>✦</span>
                                <div className="absolute w-2 h-2 rounded-full bg-indigo-500/10 blur-sm top-[40%] left-[45%]" />
                              </div>
                            )}

                            {/* Neon Light Outer Border Frame */}
                            {activeSkin === 'skin_neon' && (
                              <div
                                className="absolute inset-[2px] rounded-[10px] pointer-events-none z-0 border border-dashed opacity-40 animate-pulse"
                                style={{ borderColor: neonColor }}
                              />
                            )}

                            {/* Special puzzle item visual effects overlay */}
                            {tile.specialEffect === 'row' && (
                              <div className="absolute inset-x-0 inset-y-0 flex items-center justify-between px-1.5 pointer-events-none z-10">
                                <span className="text-[10px] text-white font-mono font-black animate-pulse opacity-90 filter drop-shadow">◀</span>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-80 blur-[0.5px]" />
                                <span className="text-[10px] text-white font-mono font-black animate-pulse opacity-90 filter drop-shadow">▶</span>
                              </div>
                            )}
                            {tile.specialEffect === 'col' && (
                              <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-between py-1.5 pointer-events-none z-10">
                                <span className="text-[10px] text-white font-mono font-black animate-pulse opacity-90 filter drop-shadow">▲</span>
                                <div className="w-[2px] flex-1 bg-gradient-to-b from-transparent via-white to-transparent opacity-80 blur-[0.5px]" />
                                <span className="text-[10px] text-white font-mono font-black animate-pulse opacity-90 filter drop-shadow">▼</span>
                              </div>
                            )}
                            {tile.specialEffect === 'bomb' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden rounded-xl">
                                <div className="absolute w-[85%] h-[85%] border border-dashed border-yellow-400 rounded-full animate-spin [animation-duration:6s] opacity-90" />
                                <div className="absolute w-[60%] h-[60%] border border-dotted border-white rounded-full animate-ping [animation-duration:3s] opacity-55" />
                                <span className="absolute top-[3px] right-[3px] text-[7px] bg-red-600 border border-red-500 text-white font-mono font-bold px-0.5 rounded leading-none scale-90 select-none shadow-md">BOMB</span>
                              </div>
                            )}

                            {/* Chocolate Deco Line based on type */}
                            {activeSkin !== 'skin_neon' && activeSkin !== 'skin_space' && tile.type === ChocolateType.MILK && (
                              <>
                                <div className="absolute top-[8%] left-[10%] right-[10%] h-[1px] bg-amber-500/35 overflow-hidden" />
                                {/* 板チョコレート風の格子デザインをオーバーレイ */}
                                <div className="absolute inset-1.5 border border-amber-950/40 rounded-lg pointer-events-none flex flex-wrap opacity-40">
                                  <div className="w-1/2 h-1/2 border-r border-b border-amber-950/20" />
                                  <div className="w-1/2 h-1/2 border-b border-amber-950/20" />
                                  <div className="w-1/2 h-1/2 border-r border-amber-950/20" />
                                  <div className="w-1/2 h-1/2" />
                                </div>
                              </>
                            )}
                            {activeSkin !== 'skin_neon' && activeSkin !== 'skin_space' && tile.type === ChocolateType.STRAWBERRY && (
                              <div className="absolute top-[15%] left-[8%] right-[8%] h-[2px] bg-white/20 blur-[0.5px] rounded-full transform -rotate-12 z-10" />
                            )}
                            {activeSkin !== 'skin_neon' && activeSkin !== 'skin_space' && tile.type === ChocolateType.ORANGE && (
                              <>
                                {/* 太陽のようなオレンジ光輪と破線ゴールドトリム */}
                                <div className="absolute w-8 h-8 rounded-full bg-orange-400/30 blur-md pointer-events-none z-0" />
                                <div className="absolute inset-1 border border-dashed border-orange-300/40 rounded-lg pointer-events-none z-10" />
                              </>
                            )}

                            {/* Central Emoji Graphic */}
                            <span className={`text-xl sm:text-2xl drop-shadow-md filter saturate-[1.2] transition-transform duration-300 z-10 ${
                              activeSkin === 'skin_neon'
                                ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.95)] scale-110 z-10'
                                : activeSkin === 'skin_space'
                                ? 'drop-shadow-[0_0_4px_rgba(167,139,250,0.7)] z-10'
                                : 'drop-shadow-[1px_2px_2px_rgba(0,0,0,0.65)] hover:scale-105'
                            }`}>
                              {item.emoji}
                            </span>

                            {/* Gold Foil Accent Corner */}
                            {activeSkin !== 'skin_neon' && activeSkin !== 'skin_space' && tile.type === ChocolateType.MATCHA && (
                              <div className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-yellow-300 shadow z-10" />
                            )}
                          </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* active help guides */}
      <div className="mt-4 text-center">
        {useSpatulaItem ? (
          <p className="flex items-center gap-1.5 text-yellow-400 text-sm animate-pulse font-medium bg-yellow-950/40 px-3 py-1.5 rounded-full border border-yellow-600/30 justify-center">
            <span className="text-base">🧹</span>
            極上スパチュラが起動中！壊したいチョコレートを1つタップしてください。
          </p>
        ) : useMittenItem ? (
          <p className="flex items-center gap-1.5 text-yellow-400 text-sm animate-pulse font-medium bg-yellow-950/40 px-3 py-1.5 rounded-full border border-yellow-600/30 justify-center">
            <span className="text-base">🧤</span>
            パズルミトンが起動中！隣り合うチョコレートをタップまたはスワイプして強制入れ替えしてください。
          </p>
        ) : (
          <div className="bg-amber-950/20 border border-amber-900/10 px-4 py-2.5 rounded-2xl max-w-sm mx-auto space-y-1">
            <p className="text-xs text-amber-300/90 font-medium">
              💡 隣り合うチョコレートを入れ替えて3つ以上揃えましょう
            </p>
            <p className="text-[10px] text-amber-400/80 leading-relaxed font-mono">
              ✨ 4つ並びで<span className="text-yellow-400 font-bold decoration-dotted">列消し/行消しチョコ(◀▶/▲▼)</span>、5つで<span className="text-yellow-400 font-bold underline decoration-yellow-500">爆弾チョコ(BOMB)</span>に進化！<br />
              💥 <span className="text-yellow-300 font-bold">スペシャル同士</span>を入れ替えると強力な超合体コンボが発動！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
