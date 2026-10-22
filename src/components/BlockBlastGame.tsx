import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGlobalCoins } from "../hooks/useGlobalCoins";
import { ArrowLeft, Play, RotateCcw, Trophy, Grid } from "lucide-react";
import confetti from "canvas-confetti";
import { playMeowSound } from "../utils/audio";

interface BlockBlastGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

// ------------------------------------------------------------------
// Types & Constants
// ------------------------------------------------------------------
type Point = { r: number; c: number };

interface ShapeDef {
  name: string;
  blocks: Point[]; // Must be normalized (min r=0, min c=0)
  color: string;
}

const COLORS = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-teal-500"
];

// Define all possible shapes
const SHAPE_TEMPLATES: Point[][] = [
  // 1x1
  [{ r: 0, c: 0 }],
  // 2x1 H & V
  [{ r: 0, c: 0 }, { r: 0, c: 1 }],
  [{ r: 0, c: 0 }, { r: 1, c: 0 }],
  // 3x1 H & V
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
  // 4x1 H & V
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }],
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }],
  // 5x1 H & V
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 4 }],
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }],
  // 2x2 Square
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
  // 3x3 Square
  [
    { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
    { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 },
    { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }
  ],
  // L-shapes small
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }], // L bottom-right
  [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }], // L bottom-left
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }], // L top-right
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }], // L top-left
  // L-shapes large (3x3 footprint)
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
  [{ r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 2 }],
  // T-shapes
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 1 }],
  [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
  [{ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 0, c: 1 }],
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 1, c: 1 }]
];

const GRID_SIZE = 8;

// Sounds
const playPlaceSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  } catch (e) {}
};

const playClearSound = (lines: number) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(400 + lines * 100, now);
    osc.frequency.exponentialRampToValueAtTime(800 + lines * 100, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
};

const playOverSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.6);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {}
};

interface TrayShape {
  id: string;
  def: ShapeDef;
  isUsed: boolean;
}

export default function BlockBlastGame({ isDarkMode, onBack }: BlockBlastGameProps) {
  const { addCoins } = useGlobalCoins();
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  
  const [tray, setTray] = useState<TrayShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hoverPos, setHoverPos] = useState<Point | null>(null);

  useEffect(() => {
    const hs = localStorage.getItem("block_blast_highscore");
    if (hs) setHighScore(parseInt(hs, 10));
  }, []);

  const generateTray = useCallback(() => {
    const newTray: TrayShape[] = Array(3).fill(null).map((_, i) => {
      const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      return {
        id: `shape_${Date.now()}_${i}`,
        def: { name: "shape", blocks: template, color },
        isUsed: false
      };
    });
    setTray(newTray);
    setSelectedShapeId(null);
  }, []);

  const startGame = () => {
    playMeowSound();
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    generateTray();
    setGameState("playing");
  };

  const checkFit = (targetGrid: (string | null)[][], shape: ShapeDef, startR: number, startC: number): boolean => {
    for (const block of shape.blocks) {
      const r = startR + block.r;
      const c = startC + block.c;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
      if (targetGrid[r][c] !== null) return false;
    }
    return true;
  };

  const checkGameOver = (currentGrid: (string | null)[][], currentTray: TrayShape[]) => {
    const availableShapes = currentTray.filter(s => !s.isUsed);
    if (availableShapes.length === 0) return false; // Game continues if tray is empty (will be refilled)

    for (const shape of availableShapes) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (checkFit(currentGrid, shape.def, r, c)) {
            return false; // Found a valid placement
          }
        }
      }
    }
    return true; // No valid placement found for any available shape
  };

  const getShapeCenterOffset = (shape: ShapeDef) => {
    // Luôn chọn khối rắn nằm trên cùng, ngoài cùng bên trái làm điểm neo
    // Điều này giúp khối hình (ví dụ chữ L bị khuyết góc) luôn khớp chính xác
    // với ô mà người dùng nhấn vào, không còn bị "hụt góc"
    let minR = Infinity;
    let minC = Infinity;
    for (const b of shape.blocks) {
      if (b.r < minR) {
        minR = b.r;
        minC = b.c;
      } else if (b.r === minR && b.c < minC) {
        minC = b.c;
      }
    }
    return { r: minR, c: minC };
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing" || !selectedShapeId) return;

    const shapeItem = tray.find(s => s.id === selectedShapeId);
    if (!shapeItem || shapeItem.isUsed) return;

    const offset = getShapeCenterOffset(shapeItem.def);
    const startR = r - offset.r;
    const startC = c - offset.c;

    const fits = checkFit(grid, shapeItem.def, startR, startC);
    if (!fits) return;

    // 1. Place the shape
    playPlaceSound();
    let newGrid = grid.map(row => [...row]);
    shapeItem.def.blocks.forEach(b => {
      newGrid[startR + b.r][startC + b.c] = shapeItem.def.color;
    });

    let newScore = score + shapeItem.def.blocks.length * 10;

    // 2. Mark shape as used
    const newTray = tray.map(s => s.id === selectedShapeId ? { ...s, isUsed: true } : s);
    setTray(newTray);
    setSelectedShapeId(null);
    setHoverPos(null);

    // 3. Check for cleared lines
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every(cell => cell !== null)) rowsToClear.push(row);
    }
    for (let col = 0; col < GRID_SIZE; col++) {
      let isFull = true;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (newGrid[row][col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) colsToClear.push(col);
    }

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      playClearSound(linesCleared);
      
      // Calculate bonus
      newScore += linesCleared * 100;
      if (linesCleared > 1) {
        newScore += (linesCleared - 1) * 50; // Combo bonus
      }

      // Clear the cells
      rowsToClear.forEach(row => {
        for (let col = 0; col < GRID_SIZE; col++) {
          newGrid[row][col] = null;
        }
      });
      colsToClear.forEach(col => {
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = null;
        }
      });

      if (linesCleared >= 2) {
        addCoins(linesCleared * 2);
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#38bdf8', '#fbbf24', '#f43f5e']
        });
      }
    }

    setGrid(newGrid);
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("block_blast_highscore", newScore.toString());
    }

    // 4. Refill tray if empty, or check game over
    const remaining = newTray.filter(s => !s.isUsed);
    if (remaining.length === 0) {
      // Generate new tray immediately
      const nextTray: TrayShape[] = Array(3).fill(null).map((_, i) => {
        const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        return {
          id: `shape_${Date.now()}_${i}`,
          def: { name: "shape", blocks: template, color },
          isUsed: false
        };
      });
      setTray(nextTray);
      if (checkGameOver(newGrid, nextTray)) {
        playOverSound();
        setGameState("gameover");
      }
    } else {
      if (checkGameOver(newGrid, newTray)) {
        playOverSound();
        setGameState("gameover");
      }
    }
  };

  const getGhostCells = () => {
    if (!selectedShapeId || !hoverPos) return [];
    const shapeItem = tray.find(s => s.id === selectedShapeId);
    if (!shapeItem || shapeItem.isUsed) return [];

    const offset = getShapeCenterOffset(shapeItem.def);
    const startR = hoverPos.r - offset.r;
    const startC = hoverPos.c - offset.c;

    const fits = checkFit(grid, shapeItem.def, startR, startC);
    if (!fits) return [];

    return shapeItem.def.blocks.map(b => ({
      r: startR + b.r,
      c: startC + b.c,
      color: shapeItem.def.color
    }));
  };

  const ghostCells = getGhostCells();

  // Render a shape in the tray
  const renderShape = (shape: TrayShape) => {
    if (shape.isUsed) return <div className="w-16 h-16 opacity-0" />;

    // find max R and C to size the container
    const maxR = Math.max(...shape.def.blocks.map(b => b.r));
    const maxC = Math.max(...shape.def.blocks.map(b => b.c));
    
    // Base block size for tray
    const blockSize = 18; 
    
    const isSelected = selectedShapeId === shape.id;

    return (
      <div 
        className={`relative cursor-pointer transition-all duration-200 ${isSelected ? "scale-110 drop-shadow-xl" : "hover:scale-105"}`}
        style={{
          width: (maxC + 1) * blockSize,
          height: (maxR + 1) * blockSize,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          playMeowSound();
          setSelectedShapeId(isSelected ? null : shape.id);
        }}
      >
        {shape.def.blocks.map((b, i) => (
          <div
            key={i}
            className={`absolute rounded-sm border border-black/10 shadow-sm ${shape.def.color} ${isSelected ? "ring-2 ring-white/80" : ""}`}
            style={{
              width: blockSize - 1,
              height: blockSize - 1,
              top: b.r * blockSize,
              left: b.c * blockSize,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      <div className={`w-full max-w-md p-6 rounded-[2rem] border shadow-sm transition-all duration-300 relative ${
        isDarkMode ? "bg-stone-900/80 border-stone-800" : "bg-white border-[#eadbca]/50"
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-stone-100/10 dark:border-stone-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playMeowSound();
                onBack();
              }}
              className={`p-2 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                isDarkMode ? "bg-stone-800/80 hover:bg-stone-750 text-stone-300" : "bg-stone-100 hover:bg-stone-200 text-stone-600"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-extrabold flex items-center gap-2">
                <Grid className="w-5 h-5 text-sky-500" />
                <span className={isDarkMode ? "text-stone-100" : "text-stone-800"}>Xếp Hình</span>
              </h2>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-stone-400 font-mono uppercase">Điểm cao: {highScore}</span>
            <span className="text-xl font-bold text-amber-500 font-mono">{score}</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col items-center justify-center relative">
          
          {gameState === "menu" && (
            <div className="text-center space-y-6 py-12">
              <div className="flex justify-center text-rose-500 mb-4">
                <Grid className="w-20 h-20 animate-pulse" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-700 dark:text-stone-200">
                Xếp Hình Không Giới Hạn
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                Kéo thả hoặc nhấp chọn các khối để lấp đầy hàng dọc hoặc ngang. Lấp càng nhiều, điểm càng cao! Trò chơi kết thúc khi không còn chỗ trống.
              </p>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Play className="w-4 h-4" /> Chơi Ngay
              </button>
            </div>
          )}

          {(gameState === "playing" || gameState === "gameover") && (
            <div className="w-full max-w-[320px] mx-auto flex flex-col items-center">
              
              {/* Grid 8x8 */}
              <div 
                className={`grid grid-cols-8 gap-[2px] p-1.5 rounded-lg border shadow-inner w-full aspect-square ${
                  isDarkMode ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
                }`}
                onPointerLeave={() => setHoverPos(null)}
              >
                {grid.map((row, r) => (
                  row.map((cell, c) => {
                    // Check if ghost
                    const isGhost = ghostCells.find(g => g.r === r && g.c === c);
                    
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-full h-full rounded-sm relative ${
                          cell ? cell : isGhost ? isGhost.color + " opacity-50" : (isDarkMode ? "bg-stone-900" : "bg-white")
                        } ${selectedShapeId && !cell ? "cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700" : ""}`}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          handleCellClick(r, c);
                        }}
                        onPointerEnter={() => setHoverPos({ r, c })}
                      >
                        {/* Highlight border for blocks */}
                        {(cell || isGhost) && (
                          <div className="absolute inset-0 border border-black/10 rounded-sm" />
                        )}
                        {/* Shine effect for placed blocks */}
                        {cell && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        )}
                      </div>
                    );
                  })
                ))}
              </div>

              {/* Shape Tray */}
              <div className="mt-8 flex justify-center items-center gap-6 h-24 w-full">
                {tray.map(shape => (
                  <div key={shape.id} className="flex-1 flex justify-center items-center">
                    {renderShape(shape)}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-stone-400 font-medium h-4">
                {selectedShapeId ? "Nhấp vào lưới để đặt hình!" : "Nhấp vào một hình để chọn"}
              </div>

            </div>
          )}

        </div>

        {/* Overlay Modals */}
        <AnimatePresence>
          {gameState === "gameover" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-[2rem]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`p-8 rounded-3xl border shadow-2xl text-center max-w-sm w-full mx-4 ${
                  isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
                }`}
              >
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
                  <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Trò Chơi Kết Thúc</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-2 leading-relaxed">
                  Không còn chỗ trống nào để đặt hình!
                </p>
                <div className="text-3xl font-black text-amber-500 font-mono mb-6">
                  {score} <span className="text-sm font-normal text-stone-400">điểm</span>
                </div>
                <button
                  onClick={startGame}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Chơi Lại
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
