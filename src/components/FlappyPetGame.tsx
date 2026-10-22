import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles, Volume2 } from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl } from "../utils/image";

interface FlappyPetGameProps {
  selectedChar: Character | null;
  isDarkMode: boolean;
  onBack: () => void;
}

interface Obstacle {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  type: string; // "coffee" | "cake" | "broom" | "bomb"
}

const OBSTACLE_EMOJIS: Record<string, string> = {
  coffee: "☕",
  cake: "🍰",
  broom: "🧹",
  bomb: "💣",
};

export default function FlappyPetGame({ selectedChar, isDarkMode, onBack }: FlappyPetGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem("meomeo_flappy_highscore") || "0");
    } catch {
      return 0;
    }
  });
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Physics State (game area is 400px wide, 500px high)
  const [birdY, setBirdY] = useState(200);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const gameLoopRef = useRef<number | null>(null);
  const birdYRef = useRef(200);
  const velocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastObstacleSpawnRef = useRef<number>(0);
  const scoreRef = useRef(0);

  const GRAVITY = 0.45;
  const JUMP_FORCE = -7.5;
  const GAME_HEIGHT = 460;
  const GAME_WIDTH = 500;
  const BIRD_SIZE = 36;
  const OBSTACLE_WIDTH = 55;
  const GAP_HEIGHT = 140;

  // Sync refs to avoid stale closures in requestAnimationFrame
  useEffect(() => {
    birdYRef.current = birdY;
  }, [birdY]);

  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // Load High Score
  useEffect(() => {
    try {
      const saved = localStorage.getItem("meomeo_flappy_highscore");
      if (saved) setHighScore(parseInt(saved));
    } catch (e) {}
  }, []);

  const handleJump = () => {
    if (gameState === "ready") {
      setGameState("playing");
      setVelocity(JUMP_FORCE);
      playMeowSound();
    } else if (gameState === "playing") {
      setVelocity(JUMP_FORCE);
      playMeowSound();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  const startGame = () => {
    setBirdY(200);
    setVelocity(0);
    setObstacles([]);
    setScore(0);
    setCoinsEarned(0);
    setGameState("playing");
    lastObstacleSpawnRef.current = Date.now();
    scoreRef.current = 0;
    playMeowSound();
  };

  const saveCoinRewards = (coins: number) => {
    if (coins <= 0) return;
    try {
      const saved = localStorage.getItem("meomeo_pet_data");
      let pet = saved ? JSON.parse(saved) : null;
      if (pet) {
        if (pet.coins === undefined) pet.coins = 100;
        pet.coins += coins;
        localStorage.setItem("meomeo_pet_data", JSON.stringify(pet));
        window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: pet }));
        window.dispatchEvent(new CustomEvent("show-toast", { detail: `Chúc mừng! Nàng nhận được +${coins} Xu 🪙` }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGameOver = () => {
    setGameState("gameover");
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    const currentScore = scoreRef.current;
    const earned = currentScore * 3; // 3 coins per score
    setCoinsEarned(earned);

    if (earned > 0) {
      saveCoinRewards(earned);
    }

    if (currentScore > highScore) {
      setHighScore(currentScore);
      try {
        localStorage.setItem("meomeo_flappy_highscore", currentScore.toString());
      } catch (e) {}
    }
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const loop = (time: number) => {
      // Delta time adjustment for smooth speed
      const dt = (time - lastTime) / 16.666; 
      lastTime = time;

      // Apply Gravity
      let nextVel = velocityRef.current + GRAVITY * dt;
      if (nextVel > 12) nextVel = 12; // cap fall speed
      let nextY = birdYRef.current + nextVel * dt;

      // Ceiling and floor boundaries
      if (nextY < 0) {
        nextY = 0;
        nextVel = 0;
      }
      if (nextY > GAME_HEIGHT - BIRD_SIZE) {
        nextY = GAME_HEIGHT - BIRD_SIZE;
        setBirdY(nextY);
        handleGameOver();
        return;
      }

      setBirdY(nextY);
      setVelocity(nextVel);

      // Spawn Obstacles
      const now = Date.now();
      let updatedObstacles = [...obstaclesRef.current];

      // Spawn new pipe every 1.8 seconds (1800ms)
      if (now - lastObstacleSpawnRef.current > 1800) {
        const minHeight = 50;
        const maxHeight = GAME_HEIGHT - GAP_HEIGHT - 50;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        const bottomHeight = GAME_HEIGHT - GAP_HEIGHT - topHeight;

        const types = ["coffee", "cake", "broom", "bomb"];
        const randomType = types[Math.floor(Math.random() * types.length)];

        updatedObstacles.push({
          id: now,
          x: GAME_WIDTH,
          topHeight,
          bottomHeight,
          passed: false,
          type: randomType,
        });
        lastObstacleSpawnRef.current = now;
      }

      // Move Obstacles
      updatedObstacles = updatedObstacles
        .map((obs) => ({
          ...obs,
          x: obs.x - 2.8 * dt,
        }))
        .filter((obs) => obs.x > -OBSTACLE_WIDTH);

      // Check Collisions and Score
      let scoreIncrement = 0;
      let hit = false;

      const birdBox = {
        left: 80,
        right: 80 + BIRD_SIZE - 6,
        top: nextY + 6,
        bottom: nextY + BIRD_SIZE - 6,
      };

      updatedObstacles.forEach((obs) => {
        // Pass validation
        if (!obs.passed && obs.x + OBSTACLE_WIDTH < birdBox.left) {
          obs.passed = true;
          scoreIncrement++;
        }

        // Pipe collision boxes
        const topBox = {
          left: obs.x,
          right: obs.x + OBSTACLE_WIDTH,
          top: 0,
          bottom: obs.topHeight,
        };

        const bottomBox = {
          left: obs.x,
          right: obs.x + OBSTACLE_WIDTH,
          top: GAME_HEIGHT - obs.bottomHeight,
          bottom: GAME_HEIGHT,
        };

        // Helpers to detect AABB overlapping
        const isOverlapping = (r1: typeof birdBox, r2: typeof topBox) => {
          return !(
            r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom
          );
        };

        if (isOverlapping(birdBox, topBox) || isOverlapping(birdBox, bottomBox)) {
          hit = true;
        }
      });

      if (hit) {
        handleGameOver();
        return;
      }

      if (scoreIncrement > 0) {
        scoreRef.current += scoreIncrement;
        setScore(scoreRef.current);
      }

      setObstacles(updatedObstacles);
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      {/* Header */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-4">
        <button
          onClick={() => {
            playMeowSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Thôi Bay
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-500">
            <Trophy className="w-4 h-4" /> Kỷ lục: {highScore}
          </div>
          <div className="text-xl font-bold text-stone-800 dark:text-stone-200 font-serif">
            Điểm: <span className="text-rose-500">{score}</span>
          </div>
        </div>
      </div>

      {/* Main Game Screen Container */}
      <div
        onClick={handleJump}
        className={`relative w-full max-w-[500px] h-[460px] rounded-3xl border overflow-hidden select-none cursor-pointer group transition-colors duration-300 ${
          isDarkMode
            ? "bg-stone-950 border-stone-800 shadow-inner"
            : "bg-sky-50/50 border-rose-100 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.1)]"
        }`}
      >
        {/* Sky Background Decor */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-400/10 to-transparent pointer-events-none" />
        <div className="absolute top-10 left-[10%] text-sky-400/20 dark:text-stone-800 text-6xl pointer-events-none">☁️</div>
        <div className="absolute top-24 right-[15%] text-sky-400/10 dark:text-stone-800 text-7xl pointer-events-none">☁️</div>
        <div className="absolute bottom-10 left-[40%] text-sky-400/5 dark:text-stone-800 text-8xl pointer-events-none">☁️</div>

        {/* Obstacles / Pipes */}
        {obstacles.map((obs) => (
          <React.Fragment key={obs.id}>
            {/* Top Obstacle Column */}
            <div
              style={{
                left: `${obs.x}px`,
                height: `${obs.topHeight}px`,
                width: `${OBSTACLE_WIDTH}px`,
              }}
              className={`absolute top-0 rounded-b-xl border-x-2 border-b-2 flex flex-col justify-end items-center pb-2 font-bold text-xl pointer-events-none ${
                isDarkMode
                  ? "bg-stone-900 border-stone-800 text-stone-400"
                  : "bg-emerald-100/90 border-emerald-300 text-emerald-800"
              }`}
            >
              {OBSTACLE_EMOJIS[obs.type]}
            </div>

            {/* Bottom Obstacle Column */}
            <div
              style={{
                left: `${obs.x}px`,
                height: `${obs.bottomHeight}px`,
                width: `${OBSTACLE_WIDTH}px`,
                bottom: 0,
              }}
              className={`absolute rounded-t-xl border-x-2 border-t-2 flex flex-col justify-start items-center pt-2 font-bold text-xl pointer-events-none ${
                isDarkMode
                  ? "bg-stone-900 border-stone-800 text-stone-400"
                  : "bg-emerald-100/90 border-emerald-300 text-emerald-800"
              }`}
            >
              {OBSTACLE_EMOJIS[obs.type]}
            </div>
          </React.Fragment>
        ))}

        {/* Flying Character / Bird Avatar */}
        <div
          style={{
            top: `${birdY}px`,
            left: "80px",
            width: `${BIRD_SIZE}px`,
            height: `${BIRD_SIZE}px`,
            transform: `rotate(${Math.min(Math.max(velocity * 4, -30), 70)}deg)`,
          }}
          className="absolute transition-transform duration-75 pointer-events-none z-10"
        >
          {selectedChar?.avatar?.startsWith("http") ? (
            <div className="w-full h-full rounded-full border-2 border-rose-400 overflow-hidden bg-white shadow-md">
              <img
                src={formatImageUrl(selectedChar.avatar)}
                alt="Flappy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full border-2 border-rose-400 bg-rose-100 flex items-center justify-center text-2xl shadow-md">
              {selectedChar?.avatar || "🐱"}
            </div>
          )}
          {/* Flame bubble trail effect when rising */}
          {velocity < 0 && (
            <span className="absolute -bottom-2 -left-2 text-xs animate-bounce">✨</span>
          )}
        </div>

        {/* Game Ready Banner Overlay */}
        <AnimatePresence>
          {gameState === "ready" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-stone-950/45 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 max-w-sm border border-rose-100 dark:border-stone-800 shadow-xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-stone-800 flex items-center justify-center text-4xl">
                  🚀
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-xl text-stone-800 dark:text-stone-100">
                    Flappy MeoMeo
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Nhấn phím **Space** hoặc nhấp vào vùng trò chơi để vỗ cánh giúp {selectedChar?.name || "bé yêu"} tránh chướng ngại vật!
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" /> Bắt Đầu Bay
                </button>
              </div>
            </motion.div>
          )}

          {/* Game Over Banner Overlay */}
          {gameState === "gameover" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 max-w-sm border border-rose-100 dark:border-stone-800 shadow-2xl flex flex-col items-center gap-5">
                <span className="text-5xl animate-bounce">💀</span>
                <div>
                  <h3 className="font-serif italic font-bold text-2xl text-stone-800 dark:text-stone-100">
                    Bị Va Chạm Rồi!
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    {selectedChar?.name || "Bé cưng"} đã va phải đồ dùng trong tiệm mất tiêu rùi...
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full bg-stone-50 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Đạt Điểm
                    </span>
                    <span className="text-2xl font-bold font-serif text-rose-500">{score}</span>
                  </div>
                  <div className="text-center border-l border-stone-200 dark:border-stone-800">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Nhận Được
                    </span>
                    <span className="text-2xl font-bold font-serif text-amber-500 flex items-center justify-center gap-1">
                      +{coinsEarned} 🪙
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startGame();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-md text-xs uppercase tracking-wider"
                  >
                    <RotateCcw className="w-4 h-4" /> Bay Lại
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playMeowSound();
                      onBack();
                    }}
                    className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-all text-xs uppercase tracking-wider"
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
        Mách nhỏ: Bay qua mỗi chướng ngại vật nhận **3 Xu (🪙)** cộng thẳng vào Tiền Thú Cưng nhen!
      </div>
    </div>
  );
}
