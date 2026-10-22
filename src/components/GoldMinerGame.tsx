import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl } from "../utils/image";

interface GoldMinerGameProps {
  selectedChar: Character | null;
  isDarkMode: boolean;
  onBack: () => void;
}

interface MinerItem {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: "gold_s" | "gold_m" | "gold_l" | "diamond" | "rock_s" | "rock_l" | "gift";
  value: number;
  weight: number; // weight determines retraction speed (higher is slower)
  label: string; // Emoji
}

export default function GoldMinerGame({ selectedChar, isDarkMode, onBack }: GoldMinerGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Hook Physics (Canvas area: width 600, height 400)
  const MINER_X = 300;
  const MINER_Y = 40;

  const [angle, setAngle] = useState(0); // swinging angle in degrees (-75 to 75)
  const [hookLen, setHookLen] = useState(40);
  const [hookState, setHookState] = useState<"swinging" | "shooting" | "retracting">("swinging");
  const [activeItem, setActiveItem] = useState<MinerItem | null>(null);
  const [items, setItems] = useState<MinerItem[]>([]);

  const angleRef = useRef(0);
  const swingDirRef = useRef(1); // 1 for right, -1 for left
  const hookLenRef = useRef(40);
  const hookStateRef = useRef<"swinging" | "shooting" | "retracting">("swinging");
  const itemsRef = useRef<MinerItem[]>([]);
  const activeItemRef = useRef<MinerItem | null>(null);

  // Base physics configuration
  const SWING_SPEED = 1.8;
  const SHOOT_SPEED = 7.0;
  const RETRACT_SPEED_BASE = 5.0;
  const MAX_HOOK_LEN = 370;

  // Sync refs to avoid closures inside game loop
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    hookLenRef.current = hookLen;
  }, [hookLen]);

  useEffect(() => {
    hookStateRef.current = hookState;
  }, [hookState]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    activeItemRef.current = activeItem;
  }, [activeItem]);

  // Generate random items on ground
  const generateItems = () => {
    const list: MinerItem[] = [];
    const itemTypes: { type: MinerItem["type"]; radius: number; value: number; weight: number; label: string }[] = [
      { type: "gold_s", radius: 14, value: 50, weight: 1.2, label: "🪙" },
      { type: "gold_m", radius: 22, value: 100, weight: 2.2, label: "🟡" },
      { type: "gold_l", radius: 32, value: 250, weight: 4.5, label: "💰" },
      { type: "diamond", radius: 12, value: 350, weight: 1.0, label: "💎" },
      { type: "rock_s", radius: 16, value: 15, weight: 2.8, label: "🪨" },
      { type: "rock_l", radius: 28, value: 30, weight: 5.5, label: "🧱" },
      { type: "gift", radius: 18, value: 150, weight: 1.5, label: "🎁" },
    ];

    let idCounter = 1;
    // Attempt to distribute items nicely
    for (let row = 0; row < 3; row++) {
      const yMin = 130 + row * 80;
      const yMax = 180 + row * 80;

      for (let col = 0; col < 4; col++) {
        const xMin = 60 + col * 120;
        const xMax = 140 + col * 120;

        // Randomize pick from items
        const rawType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        // Randomize precise placement
        const x = Math.floor(Math.random() * (xMax - xMin)) + xMin;
        const y = Math.floor(Math.random() * (yMax - yMin)) + yMin;

        list.push({
          id: idCounter++,
          x,
          y,
          radius: rawType.radius,
          type: rawType.type,
          value: rawType.value,
          weight: rawType.weight,
          label: rawType.label,
        });
      }
    }
    setItems(list);
  };

  const handleShoot = () => {
    if (gameState === "playing" && hookState === "swinging") {
      setHookState("shooting");
      playMeowSound();
    }
  };

  // Click handler on area
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowDown") {
        e.preventDefault();
        handleShoot();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, hookState]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setCoinsEarned(0);
    setHookLen(40);
    setAngle(0);
    setHookState("swinging");
    setActiveItem(null);
    generateItems();
    setGameState("playing");
    playMeowSound();
  };

  const saveCoinRewards = (goldPoints: number) => {
    // 10 goldPoints = 1 Xu (🪙)
    const earnedCoins = Math.floor(goldPoints / 10);
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
  };

  // Timer countdown
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

  // Swing & Shoot Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    let animId: number;

    const tick = () => {
      const curState = hookStateRef.current;
      const curLen = hookLenRef.current;
      const curAngle = angleRef.current;
      const curItems = [...itemsRef.current];
      const curActive = activeItemRef.current;

      if (curState === "swinging") {
        // Swing hook angle back and forth
        let nextAngle = curAngle + swingDirRef.current * SWING_SPEED;
        if (nextAngle > 75) {
          nextAngle = 75;
          swingDirRef.current = -1;
        } else if (nextAngle < -75) {
          nextAngle = -75;
          swingDirRef.current = 1;
        }
        setAngle(nextAngle);
      } else if (curState === "shooting") {
        // Extend hook length downwards at the locked angle
        const nextLen = curLen + SHOOT_SPEED;

        // Calculate tip point of hook
        const rad = (curAngle * Math.PI) / 180;
        const tipX = MINER_X + nextLen * Math.sin(rad);
        const tipY = MINER_Y + nextLen * Math.cos(rad);

        // Check if out of bounds
        if (nextLen >= MAX_HOOK_LEN || tipX < 15 || tipX > 585 || tipY > 385) {
          setHookState("retracting");
        } else {
          // Check collision with any item
          let hitItem: MinerItem | null = null;
          let remainingItems: MinerItem[] = [];

          for (const item of curItems) {
            const dist = Math.hypot(tipX - item.x, tipY - item.y);
            if (dist < item.radius + 10) {
              hitItem = item;
            } else {
              remainingItems.push(item);
            }
          }

          if (hitItem) {
            setHookState("retracting");
            setActiveItem(hitItem);
            setItems(remainingItems);
          } else {
            setHookLen(nextLen);
          }
        }
      } else if (curState === "retracting") {
        // Retract hook back to base
        // Speed is based on attached item weight (heavier is slower)
        const currentWeight = curActive ? curActive.weight : 1.0;
        const currentRetractSpeed = Math.max(1.2, RETRACT_SPEED_BASE - currentWeight * 0.8);

        const nextLen = curLen - currentRetractSpeed;
        if (nextLen <= 40) {
          // Hook has returned!
          setHookLen(40);
          setHookState("swinging");
          if (curActive) {
            // Earn points!
            setScore((prev) => prev + curActive.value);
            setActiveItem(null);
            playMeowSound();
          }
        } else {
          setHookLen(nextLen);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Hook Tip coordinates for drawing SVG path
  const rad = (angle * Math.PI) / 180;
  const hookX = MINER_X + hookLen * Math.sin(rad);
  const hookY = MINER_Y + hookLen * Math.cos(rad);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      {/* Header */}
      <div className="w-full max-w-[600px] flex items-center justify-between mb-4">
        <button
          onClick={() => {
            playMeowSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Thôi Đào
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

      {/* Main Game Screen Container (Width 600, Height 400) */}
      <div
        onClick={handleShoot}
        className={`relative w-full max-w-[600px] h-[400px] rounded-3xl border overflow-hidden select-none cursor-pointer transition-colors duration-300 ${
          isDarkMode
            ? "bg-stone-950 border-stone-800 shadow-inner"
            : "bg-[#fdf8f5] border-rose-100 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.1)]"
        }`}
      >
        {/* Sky / Miner Zone (top 80px) */}
        <div className="absolute inset-x-0 top-0 h-[80px] bg-gradient-to-b from-amber-200/10 to-transparent border-b border-dashed border-stone-200/20 pointer-events-none" />

        {/* Chibi Miner character at (300, 25) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow-xs">
            {selectedChar?.avatar?.startsWith("http") ? (
              <img
                src={formatImageUrl(selectedChar.avatar)}
                alt="Miner"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {selectedChar?.avatar || "🐱"}
              </div>
            )}
          </div>
          <div className="text-[9px] uppercase font-mono font-bold text-amber-600 dark:text-amber-500 bg-white/80 dark:bg-stone-900/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-stone-800">
            {hookState === "shooting" ? "Quăng! 🪓" : hookState === "retracting" && activeItem ? "Kéo lên! 💎" : "Ngắm... 🎯"}
          </div>
        </div>

        {/* SVG Hook Rope Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Swinging Rope */}
          <line
            x1={MINER_X}
            y1={MINER_Y}
            x2={hookX}
            y2={hookY}
            stroke={isDarkMode ? "#78716c" : "#7c2d12"}
            strokeWidth="3"
            strokeDasharray={hookState === "shooting" ? "none" : "none"}
          />
          {/* Hook Claw tip */}
          <g transform={`translate(${hookX}, ${hookY}) rotate(${angle})`}>
            {/* Draw claw claws */}
            <path
              d="M -10 -5 C -15 10, -5 15, 0 15 C 5 15, 15 10, 10 -5 M -5 0 L 5 0"
              fill="none"
              stroke={isDarkMode ? "#a8a29e" : "#451a03"}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Small center dot */}
            <circle cx="0" cy="0" r="3.5" fill={isDarkMode ? "#a8a29e" : "#7c2d12"} />
          </g>
        </svg>

        {/* Grabbed active item moving with the hook */}
        {activeItem && (
          <div
            style={{
              left: `${hookX - activeItem.radius}px`,
              top: `${hookY - 5}px`,
              width: `${activeItem.radius * 2}px`,
              height: `${activeItem.radius * 2}px`,
            }}
            className="absolute flex items-center justify-center pointer-events-none z-10 transition-transform duration-75 text-xl"
          >
            {activeItem.label}
          </div>
        )}

        {/* Items on Ground */}
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              left: `${item.x - item.radius}px`,
              top: `${item.y - item.radius}px`,
              width: `${item.radius * 2}px`,
              height: `${item.radius * 2}px`,
            }}
            className="absolute rounded-full flex items-center justify-center transition-all duration-300 select-none group-hover:scale-105 pointer-events-none"
          >
            <span
              style={{ fontSize: `${item.radius * 1.1}px` }}
              className="drop-shadow-xs"
            >
              {item.label}
            </span>
          </div>
        ))}

        {/* Game Ready Banner Overlay */}
        <AnimatePresence>
          {gameState === "ready" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950/45 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 max-w-sm border border-rose-100 dark:border-stone-800 shadow-xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-stone-800 flex items-center justify-center text-4xl">
                  ⛏️
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-xl text-stone-800 dark:text-stone-100">
                    Đào Vàng Vũ Trụ
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 leading-relaxed">
                    Nhấn nút **Space / Mũi tên Xuống** hoặc nhấp vào vùng chơi để quăng móc đào. Kéo càng nhiều vàng, kim cương báu vật càng tốt!
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" /> Thả Móc Đào Vàng
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
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20"
            >
              <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 max-w-sm border border-rose-100 dark:border-stone-800 shadow-2xl flex flex-col items-center gap-5">
                <span className="text-5xl animate-bounce">⏰</span>
                <div>
                  <h3 className="font-serif italic font-bold text-2xl text-stone-800 dark:text-stone-100">
                    Hết Giờ Rồi!
                  </h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Thời gian đào kho báu của nàng đã kết thúc nhen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full bg-stone-50 dark:bg-stone-950/60 p-4 rounded-2xl border border-stone-100 dark:border-stone-800">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Tổng Điểm Đào
                    </span>
                    <span className="text-2xl font-bold font-serif text-rose-500">{score}</span>
                  </div>
                  <div className="text-center border-l border-stone-200 dark:border-stone-800">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-stone-400 dark:text-stone-500 block">
                      Tích Lũy Được
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
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-md text-xs uppercase tracking-wider"
                  >
                    <RotateCcw className="w-4 h-4" /> Chơi Lại
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
      <div className="mt-4 text-[10px] font-mono tracking-wide text-stone-400 dark:text-stone-500 text-center max-w-sm leading-normal">
        Kim cương (💎) có giá trị nhất nhưng nhỏ khó quăng trúng, ráng quăng thật khéo nha nàng!
      </div>
    </div>
  );
}
