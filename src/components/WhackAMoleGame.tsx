import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl } from "../utils/image";

interface WhackAMoleGameProps {
  selectedChar: Character | null;
  isDarkMode: boolean;
  onBack: () => void;
}

interface MoleState {
  id: number; // hole index (0 to 8)
  type: "gai" | "cat" | "chibi" | "none";
  active: boolean;
  spawnTime: number;
  duration: number;
}

export default function WhackAMoleGame({ selectedChar, isDarkMode, onBack }: WhackAMoleGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [holes, setHoles] = useState<MoleState[]>(
    Array(9).fill(null).map((_, i) => ({ id: i, type: "none", active: false, spawnTime: 0, duration: 0 }))
  );
  const [shakeGrid, setShakeGrid] = useState(false);
  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);

  const holesRef = useRef<MoleState[]>([]);
  holesRef.current = holes;

  // Sound and feedback variables
  const hitTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});

  const spawnMole = () => {
    if (gameState !== "playing") return;

    // Pick a random inactive hole
    const inactiveIndices = holesRef.current
      .map((h, i) => (!h.active ? i : null))
      .filter((v): v is number => v !== null);

    if (inactiveIndices.length === 0) return;
    const randomIndex = inactiveIndices[Math.floor(Math.random() * inactiveIndices.length)];

    // Type distribution: 70% Gai (bad monster), 20% Cat (good pet), 10% Chibi char (friendly nam than)
    const rand = Math.random();
    let moleType: MoleState["type"] = "gai";
    if (rand > 0.8) {
      moleType = "cat";
    } else if (rand > 0.7) {
      moleType = "chibi";
    }

    // Progression of speed as score increases
    const scoreModifier = Math.min(score * 12, 1000);
    const baseDuration = 1800 - scoreModifier; // faster at higher scores
    const duration = Math.max(750, baseDuration + Math.random() * 400);

    setHoles((prev) => {
      const next = [...prev];
      next[randomIndex] = {
        id: randomIndex,
        type: moleType,
        active: true,
        spawnTime: Date.now(),
        duration,
      };
      return next;
    });

    // Auto-retract after duration
    const timeout = setTimeout(() => {
      setHoles((prev) => {
        const next = [...prev];
        if (next[randomIndex] && next[randomIndex].active && Date.now() - next[randomIndex].spawnTime >= duration) {
          next[randomIndex] = { ...next[randomIndex], active: false, type: "none" };
        }
        return next;
      });
    }, duration);

    hitTimeoutRef.current[randomIndex] = timeout;
  };

  const handleWhack = (e: React.MouseEvent<HTMLDivElement>, holeId: number) => {
    if (gameState !== "playing") return;

    const targetHole = holes[holeId];
    if (!targetHole || !targetHole.active) return;

    // Calculate relative tap coords for float text animation
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const tapY = e.clientY - rect.top;

    playMeowSound();

    // Clear auto-retract timeout
    if (hitTimeoutRef.current[holeId]) {
      clearTimeout(hitTimeoutRef.current[holeId]);
    }

    let pointsEarned = 0;
    let text = "";
    let color = "";

    if (targetHole.type === "gai") {
      pointsEarned = 10;
      text = "+10";
      color = "text-emerald-500";
    } else if (targetHole.type === "cat") {
      pointsEarned = -15;
      text = "-15 Mèo!";
      color = "text-red-500 animate-bounce";
      setShakeGrid(true);
      setTimeout(() => setShakeGrid(false), 300);
    } else if (targetHole.type === "chibi") {
      pointsEarned = -20;
      text = `-20 ${selectedChar?.name || "Nam Thần"}!`;
      color = "text-rose-500 font-extrabold";
      setShakeGrid(true);
      setTimeout(() => setShakeGrid(false), 300);
    }

    setScore((prev) => Math.max(0, prev + pointsEarned));

    // Spawn floating tap effect text
    const effectId = Date.now() + Math.random();
    setTapEffects((prev) => [...prev, { id: effectId, x: tapX, y: tapY, text, color }]);
    setTimeout(() => {
      setTapEffects((prev) => prev.filter((eff) => eff.id !== effectId));
    }, 800);

    // Turn hole inactive immediately
    setHoles((prev) => {
      const next = [...prev];
      next[holeId] = { ...next[holeId], active: false, type: "none" };
      return next;
    });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setCoinsEarned(0);
    setHoles(Array(9).fill(null).map((_, i) => ({ id: i, type: "none", active: false, spawnTime: 0, duration: 0 })));
    setGameState("playing");
    playMeowSound();
  };

  const saveCoinRewards = (points: number) => {
    // 5 points = 1 Xu (🪙)
    const earnedCoins = Math.floor(points / 5);
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
    saveCoinRewards(score);
    // clear all timeouts
    Object.values(hitTimeoutRef.current).forEach(clearTimeout);
    hitTimeoutRef.current = {};
  };

  // Timer Tick
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, score]);

  // Spawn Manager Tick
  useEffect(() => {
    if (gameState !== "playing") return;

    // Spawn loop
    const minSpawnInterval = Math.max(300, 1000 - Math.min(score * 5, 600));
    const interval = setInterval(() => {
      // Chance to spawn
      if (Math.random() < 0.75) {
        spawnMole();
      }
    }, minSpawnInterval);

    return () => clearInterval(interval);
  }, [gameState, score]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(hitTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      {/* Header */}
      <div className="w-full max-w-[480px] flex items-center justify-between mb-4">
        <button
          onClick={() => {
            playMeowSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Thôi Đập
        </button>

        <div className="flex items-center gap-4 font-mono text-sm">
          <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-full font-bold">
            ⏱️ {timeLeft}s
          </div>
          <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-full font-bold">
            🎯 {score} Điểm
          </div>
        </div>
      </div>

      {/* Grid Container (3x3 Whack-a-Mole Grid) */}
      <div
        className={`relative w-full max-w-[440px] p-4 sm:p-6 rounded-[2.5rem] border transition-all duration-300 ${
          shakeGrid ? "animate-shake" : ""
        } ${
          isDarkMode
            ? "bg-stone-900/40 border-stone-800"
            : "bg-[#fff7f8] border-rose-100 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.1)]"
        }`}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        `}</style>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 aspect-square">
          {holes.map((hole) => (
            <div
              key={hole.id}
              onClick={(e) => handleWhack(e, hole.id)}
              className={`relative aspect-square rounded-3xl overflow-hidden shadow-inner border border-stone-200/20 cursor-pointer flex items-center justify-center transition-all duration-300 ${
                isDarkMode
                  ? "bg-stone-950 hover:bg-stone-900"
                  : "bg-amber-900/10 hover:bg-amber-900/15"
              }`}
            >
              {/* Hole Background Dark Bottom shadow */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-stone-900/20 pointer-events-none rounded-b-3xl" />

              {/* Spawned Mole Element */}
              <AnimatePresence>
                {hole.active && (
                  <motion.div
                    initial={{ y: 50, scale: 0.6 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 55, scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute w-4/5 h-4/5 flex flex-col items-center justify-center select-none"
                  >
                    {hole.type === "gai" && (
                      <span className="text-4xl sm:text-5xl drop-shadow-md select-none pointer-events-none">👾</span>
                    )}

                    {hole.type === "cat" && (
                      <span className="text-4xl sm:text-5xl drop-shadow-md select-none pointer-events-none">🐱</span>
                    )}

                    {hole.type === "chibi" && (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-rose-400 bg-white shadow-xs pointer-events-none">
                        {selectedChar?.avatar?.startsWith("http") ? (
                          <img
                            src={formatImageUrl(selectedChar.avatar)}
                            alt="Chibi"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            {selectedChar?.avatar || "🤵"}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inner Hole Ring Decor */}
              <div className="absolute inset-2 border border-dashed border-stone-500/10 rounded-2xl pointer-events-none" />

              {/* Floating score text effect in this hole */}
              {tapEffects.map(
                (eff) =>
                  hole.id === hole.id && ( // draw over current hole if clicked
                    <div
                      key={eff.id}
                      className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
                    >
                      <motion.span
                        initial={{ opacity: 1, y: 10, scale: 0.8 }}
                        animate={{ opacity: 0, y: -40, scale: 1.2 }}
                        className={`text-sm sm:text-base font-bold font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] ${eff.color}`}
                      >
                        {eff.text}
                      </motion.span>
                    </div>
                  )
              )}
            </div>
          ))}
        </div>

        {/* Game Ready Banner Overlay */}
        <AnimatePresence>
          {gameState === "ready" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950/45 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 rounded-[2.5rem]"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 max-w-[320px] border border-rose-100 dark:border-stone-800 shadow-xl flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-stone-800 flex items-center justify-center text-4xl">
                  🔨
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-lg text-stone-800 dark:text-stone-100">
                    Đập Gai Bảo Vệ Tiệm
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-relaxed">
                    Nhanh tay đập tan các **bụi gai dơ bẩn (👾)** trồi lên để ghi điểm. Tuyệt đối **KHÔNG ĐẬP NHẦM** các bé mèo (🐱) hay nam thần ({selectedChar?.name || "nam thần"}) nha!
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-wider shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Cầm Búa Chiến Đấu
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
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20 rounded-[2.5rem]"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 max-w-[320px] border border-rose-100 dark:border-stone-800 shadow-2xl flex flex-col items-center gap-4">
                <span className="text-4xl animate-bounce">⏱️</span>
                <div>
                  <h3 className="font-serif italic font-bold text-xl text-stone-800 dark:text-stone-100">
                    Hết Thời Gian!
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                    Tiệm nước đã được dọn dẹp sạch sẽ bụi gai dơ bẩn rồi nhen nàng!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full bg-stone-50 dark:bg-stone-950/60 p-3 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Tổng Điểm Đập
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
        Mách nhỏ: Cứ **5 Điểm** đổi được **1 Xu (🪙)** nạp trực tiếp vào quỹ tiền mua sắm nhen!
      </div>
    </div>
  );
}
