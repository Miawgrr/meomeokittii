import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";

interface SweetMergeGameProps {
  selectedChar: Character | null;
  isDarkMode: boolean;
  onBack: () => void;
}

interface Candy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: number; // 0 to 7 (larger number means larger candy)
  emoji: string;
  color: string;
  scoreValue: number;
}

const CANDY_TYPES = [
  { emoji: "🍒", radius: 14, color: "#f43f5e", scoreValue: 2 },   // 0: Cherry
  { emoji: "🍓", radius: 20, color: "#ec4899", scoreValue: 4 },   // 1: Strawberry
  { emoji: "🍇", radius: 26, color: "#a855f7", scoreValue: 8 },   // 2: Grape
  { emoji: "🍊", radius: 32, color: "#f97316", scoreValue: 16 },  // 3: Orange
  { emoji: "🍋", radius: 38, color: "#eab308", scoreValue: 32 },  // 4: Lemon
  { emoji: "🍎", radius: 44, color: "#ef4444", scoreValue: 64 },  // 5: Red Apple
  { emoji: "🥥", radius: 52, color: "#78350f", scoreValue: 128 }, // 6: Coconut
  { emoji: "🍉", radius: 62, color: "#10b981", scoreValue: 256 }, // 7: Big Watermelon
];

export default function SweetMergeGame({ selectedChar, isDarkMode, onBack }: SweetMergeGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Preview candy X coordinate (controlled by mouse/touch)
  const [previewX, setPreviewX] = useState(180);
  const [nextType, setNextType] = useState(0); // type of candy to drop next

  const candiesRef = useRef<Candy[]>([]);
  const scoreRef = useRef(0);
  const nextIdRef = useRef(1);
  const isDroppingRef = useRef(false);
  const dropCooldownRef = useRef(false);

  // Physics dimensions
  const WIDTH = 360;
  const HEIGHT = 500;
  const GRAVITY = 0.4;
  const RESTITUTION = 0.2; // bounciness

  // Sync state refs to loop
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Handle click / screen tap to drop candy
  const handleCanvasInteraction = (clientX: number) => {
    if (gameState !== "playing" || dropCooldownRef.current) return;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(WIDTH - 30, clientX - rect.left));

    // Spawn dropped candy at the top
    const prototype = CANDY_TYPES[nextType];
    const newCandy: Candy = {
      id: nextIdRef.current++,
      x,
      y: 60, // just below drop line
      vx: 0,
      vy: 1.5,
      radius: prototype.radius,
      type: nextType,
      emoji: prototype.emoji,
      color: prototype.color,
      scoreValue: prototype.scoreValue,
    };

    candiesRef.current.push(newCandy);
    playMeowSound();

    // Trigger cooldown to prevent spamming
    dropCooldownRef.current = true;
    setTimeout(() => {
      dropCooldownRef.current = false;
    }, 450);

    // Roll random next candy from types 0, 1, or 2 (keep it interesting but drop small ones)
    const rolledType = Math.floor(Math.random() * 3);
    setNextType(rolledType);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(WIDTH - 30, e.clientX - rect.left));
    setPreviewX(x);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canvasRef.current || e.touches.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(WIDTH - 30, e.touches[0].clientX - rect.left));
    setPreviewX(x);
  };

  const startGame = () => {
    setScore(0);
    setCoinsEarned(0);
    candiesRef.current = [];
    nextIdRef.current = 1;
    scoreRef.current = 0;
    setNextType(Math.floor(Math.random() * 3));
    setGameState("playing");
    playMeowSound();
  };

  const saveCoinRewards = (points: number) => {
    // 10 score points = 1 Xu (🪙)
    const earnedCoins = Math.floor(points / 10);
    if (earnedCoins <= 0) return;
    setCoinsEarned(earnedCoins);
    try {
      const saved = localStorage.getItem("meomeo_pet_data");
      let pet = saved ? JSON.parse(saved) : null;
      if (pet) {
        if (pet.coins === undefined) pet.coins = 100;
        pet.coins += earnedCoins;
        localStorage.setItem("meomeo_pet_data", JSON.stringify(pet));
        window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: pet }));
        window.dispatchEvent(new CustomEvent("show-toast", { detail: `Chúc mừng! Nàng nhận được +${earnedCoins} Xu 🪙` }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGameOver = () => {
    setGameState("gameover");
    saveCoinRewards(scoreRef.current);
  };

  // Main Physics Engine and Canvas Render Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;
    let gameOverTimer: NodeJS.Timeout | null = null;
    let isGameOverTriggered = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updatePhysics = () => {
      let list = [...candiesRef.current];

      // 1. Apply gravity & velocities
      list.forEach((c) => {
        c.vy += GRAVITY;
        c.x += c.vx;
        c.y += c.vy;

        // Wall limits
        if (c.x - c.radius < 0) {
          c.x = c.radius;
          c.vx = -c.vx * RESTITUTION;
        } else if (c.x + c.radius > WIDTH) {
          c.x = WIDTH - c.radius;
          c.vx = -c.vx * RESTITUTION;
        }

        // Floor limits
        if (c.y + c.radius > HEIGHT) {
          c.y = HEIGHT - c.radius;
          c.vy = -c.vy * RESTITUTION;
          c.vx *= 0.85; // slide friction
        }
      });

      // 2. Resolve circle-to-circle collisions and merging
      let mergedPairs: [number, number][] = [];
      let toSpawnNew: { x: number; y: number; nextType: number }[] = [];

      // Loop pairs to resolve overlaps
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const c1 = list[i];
          const c2 = list[j];

          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = c1.radius + c2.radius;

          if (dist < minDist) {
            // Overlapping!
            if (c1.type === c2.type) {
              // MERGE!
              if (c1.type < CANDY_TYPES.length - 1) {
                // Prevent duplicate merges in same frame
                const alreadyMerged = mergedPairs.some((p) => p[0] === c1.id || p[1] === c1.id || p[0] === c2.id || p[1] === c2.id);
                if (!alreadyMerged) {
                  mergedPairs.push([c1.id, c2.id]);
                  toSpawnNew.push({
                    x: (c1.x + c2.x) / 2,
                    y: (c1.y + c2.y) / 2,
                    nextType: c1.type + 1,
                  });
                }
              }
            } else {
              // Push circles apart (AABB overlap resolution)
              const overlap = minDist - dist;
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);

              // Displace each circle by half overlap
              c1.x -= nx * overlap * 0.5;
              c1.y -= ny * overlap * 0.5;
              c2.x += nx * overlap * 0.5;
              c2.y += ny * overlap * 0.5;

              // Elastic collision velocities response
              const kx = c1.vx - c2.vx;
              const ky = c1.vy - c2.vy;
              const p = 2 * (nx * kx + ny * ky) / (1 + 1); // mass equal to 1 simplification

              c1.vx -= nx * p * 0.5;
              c1.vy -= ny * p * 0.5;
              c2.vx += nx * p * 0.5;
              c2.vy += ny * p * 0.5;
            }
          }
        }
      }

      // 3. Process merges (remove old, spawn new upgraded candy, add points)
      if (mergedPairs.length > 0) {
        const removeIds = new Set(mergedPairs.flat());
        list = list.filter((c) => !removeIds.has(c.id));

        toSpawnNew.forEach((sp) => {
          const prototype = CANDY_TYPES[sp.nextType];
          list.push({
            id: nextIdRef.current++,
            x: sp.x,
            y: sp.y,
            vx: (Math.random() - 0.5) * 2, // minor nudge
            vy: -1.0, // minor bounce
            radius: prototype.radius,
            type: sp.nextType,
            emoji: prototype.emoji,
            color: prototype.color,
            scoreValue: prototype.scoreValue,
          });

          // Add to scores
          scoreRef.current += prototype.scoreValue;
          setScore(scoreRef.current);
        });

        playMeowSound();
      }

      // 4. Check lose state (candy sitting above red warning line at top, y = 80)
      let isCandyStackingTooHigh = list.some((c) => c.y - c.radius < 90 && c.vy < 0.2);
      if (isCandyStackingTooHigh) {
        if (!isGameOverTriggered) {
          isGameOverTriggered = true;
          gameOverTimer = setTimeout(() => {
            // Verify if still too high before invoking gameOver
            const stillHigh = candiesRef.current.some((c) => c.y - c.radius < 90);
            if (stillHigh) {
              handleGameOver();
            } else {
              isGameOverTriggered = false;
            }
          }, 2500); // 2.5 seconds warning limit
        }
      } else {
        if (gameOverTimer) {
          clearTimeout(gameOverTimer);
          gameOverTimer = null;
          isGameOverTriggered = false;
        }
      }

      candiesRef.current = list;
    };

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Warning Danger line (top y = 90)
      ctx.strokeStyle = isDroppingRef.current ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.25)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 90);
      ctx.lineTo(WIDTH, 90);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw warning indicator label if close to full
      const isFull = candiesRef.current.some((c) => c.y - c.radius < 110);
      if (isFull) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ CẢNH BÁO QUÁ ĐẦY!", WIDTH / 2, 80);
      }

      // Draw all candies
      candiesRef.current.forEach((c) => {
        ctx.save();

        // Glow behind
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 8;

        // Circle base
        ctx.fillStyle = c.color + "1a"; // very transparent colored body
        ctx.strokeStyle = c.color + "dd"; // thick border
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Draw Emoji inside circle
        ctx.font = `${c.radius * 1.25}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.emoji, c.x, c.y + (c.radius * 0.05)); // center adjustments
      });
    };

    const loop = () => {
      updatePhysics();
      draw();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      if (gameOverTimer) clearTimeout(gameOverTimer);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      {/* Header */}
      <div className="w-full max-w-[380px] flex items-center justify-between mb-4">
        <button
          onClick={() => {
            playMeowSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Thôi Ghép
        </button>

        <div className="text-xl font-bold text-stone-800 dark:text-stone-200 font-serif">
          Điểm: <span className="text-rose-500">{score}</span>
        </div>
      </div>

      {/* Main Sweet Merge Area (360x500 physics canvas) */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[360px] flex flex-col items-center"
      >
        {/* Next drop candy preview slider container */}
        <div
          className={`w-full h-16 relative rounded-t-[1.5rem] border-x border-t transition-all ${
            isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-rose-50/10 border-rose-100"
          }`}
        >
          {gameState === "playing" && (
            <div
              style={{
                left: `${previewX}px`,
                transform: "translateX(-50%)",
              }}
              className="absolute top-2 transition-all duration-75 flex flex-col items-center gap-1 cursor-pointer pointer-events-none"
            >
              <span className="text-3xl filter drop-shadow-sm animate-bounce">
                {CANDY_TYPES[nextType].emoji}
              </span>
              <span className="text-[7px] text-rose-400 font-extrabold uppercase font-mono tracking-widest bg-white/95 dark:bg-stone-950/95 px-1.5 py-0.5 rounded-full border border-rose-100 dark:border-stone-800">
                SẮP THẢ 🎈
              </span>
            </div>
          )}
        </div>

        {/* Physics Game Canvas */}
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onClick={(e) => handleCanvasInteraction(e.clientX)}
          className={`w-full aspect-[360/500] border-x border-b rounded-b-[1.5rem] cursor-crosshair shadow-inner ${
            isDarkMode ? "bg-stone-950 border-stone-800" : "bg-[#fdf9fa] border-rose-100"
          }`}
        />

        {/* Game Ready Banner Overlay */}
        <AnimatePresence>
          {gameState === "ready" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950/45 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 rounded-[1.5rem]"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 max-w-[280px] border border-rose-100 dark:border-stone-800 shadow-xl flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-stone-800 flex items-center justify-center text-4xl">
                  🍬
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-lg text-stone-800 dark:text-stone-100">
                    Hợp Nhất Kẹo Ngọt
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-relaxed">
                    Di chuyển chuột/tay để canh chỉnh vị trí và nhấp thả kẹo. Hai viên kẹo **cùng loại** chạm nhau sẽ hợp thể thành viên to hơn!
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Thả Kẹo Ngọt Ngào
                </button>
              </div>
            </motion.div>
          )}

          {/* Game Over Banner Overlay */}
          {gameState === "gameover" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 rounded-[1.5rem]"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 max-w-[280px] border border-rose-100 dark:border-stone-800 shadow-2xl flex flex-col items-center gap-4">
                <span className="text-4xl animate-bounce">📈</span>
                <div>
                  <h3 className="font-serif italic font-bold text-xl text-stone-800 dark:text-stone-100">
                    Kẹo Tràn Ly Rồi!
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                    Cốc kẹo ngọt của nàng bị xếp quá cao và tràn ly rồi nhen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full bg-stone-50 dark:bg-stone-950/60 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Tổng Điểm Hợp
                    </span>
                    <span className="text-xl font-bold font-serif text-rose-500">{score}</span>
                  </div>
                  <div className="text-center border-l border-stone-200 dark:border-stone-800">
                    <span className="text-[9px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Tích Xu Nhận Được
                    </span>
                    <span className="text-xl font-bold font-serif text-amber-500 flex items-center justify-center gap-0.5">
                      +{coinsEarned} 🪙
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startGame();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Chơi Lại
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playMeowSound();
                      onBack();
                    }}
                    className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-all text-xs uppercase tracking-wider"
                  >
                    Thoát
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guide Footer */}
      <div className="mt-4 text-[10px] font-mono tracking-wide text-stone-400 dark:text-stone-500 text-center max-w-sm">
        Mách nhỏ: Merge ra quả dưa hấu khổng lồ (🍉) để đoạt điểm số bùng nổ cực khủng!
      </div>
    </div>
  );
}
