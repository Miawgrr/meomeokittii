import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  Coins, 
  HelpCircle,
  CheckCircle2,
  Lock,
  Flame,
  ArrowRight
} from "lucide-react";
import { playMeowSound } from "../utils/audio";
import confetti from "canvas-confetti";

interface DishwashingGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

interface Dish {
  id: string;
  type: "plate" | "bowl" | "glass";
  name: string;
  emoji: string;
  dirtLevel: number; // 0 (clean) to 100 (dirty)
  isSoaped: boolean;
  soapLevel: number; // 0 to 100
  color: string;
}

// Sound synthesizers using Web Audio API
const playSoapSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.16);
  } catch (e) {}
};

const playBubbleSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(2000, now + 0.05);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
};

const playScrubSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(125, now + 0.1);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.11);
  } catch (e) {}
};

const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch (e) {}
};

const playErrorSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  } catch (e) {}
};

const DISH_TEMPLATES = [
  { type: "plate" as const, name: "Đĩa Hoa Đào", emoji: "🍽️", color: "from-rose-100 to-rose-200" },
  { type: "plate" as const, name: "Đĩa Tròn Viền Vàng", emoji: "🍳", color: "from-amber-100 to-amber-200" },
  { type: "bowl" as const, name: "Bát Thủy Tinh", emoji: "🥣", color: "from-sky-100 to-sky-200" },
  { type: "bowl" as const, name: "Chén Men Lam", emoji: "🍚", color: "from-blue-100 to-blue-200" },
  { type: "glass" as const, name: "Ly Trà Sữa", emoji: "🥛", color: "from-emerald-100 to-emerald-200" },
  { type: "glass" as const, name: "Cốc Sinh Tố", emoji: "🥃", color: "from-purple-100 to-purple-200" },
];

export default function DishwashingGame({ isDarkMode, onBack }: DishwashingGameProps) {
  const [walletCoins, setWalletCoins] = useState<number>(150);
  const [gameState, setGameState] = useState<"idle" | "washing" | "sorting" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [activeDish, setActiveDish] = useState<Dish | null>(null);
  const [dirtyDishes, setDirtyDishes] = useState<Dish[]>([]);
  const [washedDishes, setWashedDishes] = useState<Dish[]>([]);
  const [shelves, setShelves] = useState<{
    plate: Dish[];
    bowl: Dish[];
    glass: Dish[];
  }>({ plate: [], bowl: [], glass: [] });
  
  const [selectedWashedDishId, setSelectedWashedDishId] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [coinsLost, setCoinsLost] = useState<number>(0);

  // Animating bubbles on soapy dish
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; scale: number }[]>([]);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load wallet coins on init
  useEffect(() => {
    const savedCoins = localStorage.getItem("coffee_game_coins");
    if (savedCoins) {
      setWalletCoins(parseInt(savedCoins));
    }
  }, []);

  // Timer Countdown loop
  useEffect(() => {
    if (gameState === "washing" || gameState === "sorting") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleGameOver(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Generate randomized dirty dishes to start
  const startNewGame = () => {
    playMeowSound();
    
    // Generate exactly 6 dishes, representing a nice balance
    const freshDishes: Dish[] = Array.from({ length: 6 }).map((_, idx) => {
      const template = DISH_TEMPLATES[idx % DISH_TEMPLATES.length];
      return {
        id: `dish-${Date.now()}-${idx}`,
        type: template.type,
        name: template.name,
        emoji: template.emoji,
        dirtLevel: 70 + Math.floor(Math.random() * 30), // Random starting dirt between 70% and 100%
        isSoaped: false,
        soapLevel: 0,
        color: template.color
      };
    });

    setDirtyDishes(freshDishes);
    setWashedDishes([]);
    setShelves({ plate: [], bowl: [], glass: [] });
    setActiveDish(null);
    setSelectedWashedDishId(null);
    setTimeLeft(60);
    setCoinsEarned(0);
    setCoinsLost(0);
    setGameState("washing");
  };

  // Soap action
  const handleApplySoap = () => {
    if (!activeDish) return;
    playSoapSound();
    
    // Add custom cute floating bubbles
    const newBubbles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random() + i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      scale: 0.5 + Math.random() * 1.2
    }));
    setBubbles(newBubbles);

    setActiveDish((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isSoaped: true,
        soapLevel: 100
      };
    });
  };

  // Scrub/wash action
  const handleScrub = () => {
    if (!activeDish || !activeDish.isSoaped) return;
    playScrubSound();

    // Pop bubbles slightly on each scrub
    if (bubbles.length > 0) {
      setBubbles((prev) => prev.slice(0, prev.length - 2));
      playBubbleSound();
    }

    setActiveDish((prev) => {
      if (!prev) return null;
      const newDirt = Math.max(0, prev.dirtLevel - 20); // 5 scrubs needed
      return {
        ...prev,
        dirtLevel: newDirt
      };
    });
  };

  // Select dish from dirty pile to sink
  const selectDishToWash = (dish: Dish) => {
    playMeowSound();
    setActiveDish(dish);
    setBubbles([]);
    // Remove from dirty pile
    setDirtyDishes((prev) => prev.filter((d) => d.id !== dish.id));
  };

  // Move fully washed dish from sink to dry table
  const finishWashingActiveDish = () => {
    if (!activeDish || activeDish.dirtLevel > 0) return;
    playSuccessSound();

    const cleanDish = { ...activeDish };
    setWashedDishes((prev) => [...prev, cleanDish]);
    setActiveDish(null);
    setBubbles([]);

    // Check if we finished washing all dishes
    if (dirtyDishes.length === 0) {
      // Auto transition to sorting phase!
      setGameState("sorting");
      // Pick first washed dish as auto-selected
      setSelectedWashedDishId(cleanDish.id);
    }
  };

  // Sort washed dish onto a shelf
  const handlePlaceOnShelf = (targetType: "plate" | "bowl" | "glass") => {
    if (!selectedWashedDishId) return;
    const dishToPlace = washedDishes.find((d) => d.id === selectedWashedDishId);
    if (!dishToPlace) return;

    if (dishToPlace.type === targetType) {
      // Correct sorting!
      playSuccessSound();
      
      // Add to shelf
      setShelves((prev) => ({
        ...prev,
        [targetType]: [...prev[targetType], dishToPlace]
      }));

      // Remove from washed dry table
      const remainingWashed = washedDishes.filter((d) => d.id !== selectedWashedDishId);
      setWashedDishes(remainingWashed);

      // Check if all sorted successfully
      if (remainingWashed.length === 0) {
        handleGameOver(true);
      } else {
        // Auto select next washed dish
        setSelectedWashedDishId(remainingWashed[0].id);
      }
    } else {
      // Incorrect sorting category!
      playErrorSound();
      alert(`⚠️ Nhầm rồi nàng ơi! Đây là "${dishToPlace.name}" thuộc phân loại ${dishToPlace.type === "plate" ? "Đĩa" : dishToPlace.type === "bowl" ? "Chén Bát" : "Ly Cốc"}. Nàng xếp lại lên đúng kệ nhen! 💕`);
    }
  };

  // Game over handler (victory or failure)
  const handleGameOver = (victory: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsVictory(victory);
    setGameState("finished");

    const localCoinsStr = localStorage.getItem("coffee_game_coins");
    const currentCoins = localCoinsStr ? parseInt(localCoinsStr) : 150;

    if (victory) {
      // Complete! Earn rewards
      playSuccessSound();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      const baseReward = 50;
      const speedBonus = Math.floor(timeLeft / 1.5); // Bonus based on remaining time
      const finalReward = baseReward + speedBonus;
      const newCoins = currentCoins + finalReward;

      setCoinsEarned(finalReward);
      setWalletCoins(newCoins);
      
      localStorage.setItem("coffee_game_coins", newCoins.toString());
      window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    } else {
      // Out of time! Lose coins
      playErrorSound();
      const finalPenalty = 20;
      const newCoins = Math.max(0, currentCoins - finalPenalty);

      setCoinsLost(finalPenalty);
      setWalletCoins(newCoins);

      localStorage.setItem("coffee_game_coins", newCoins.toString());
      window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4">
      {/* Game Header Card */}
      <div className={`p-6 rounded-[2rem] border shadow-sm transition-all duration-300 ${
        isDarkMode ? "bg-stone-900/80 border-stone-800" : "bg-white border-[#eadbca]/50"
      }`}>
        {/* Header Action Menu */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-stone-100/10 dark:border-stone-800/80 pb-4">
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
                🧼 <span className={isDarkMode ? "text-stone-100" : "text-stone-800"}>Tiệm Rửa Chén Chăm Chỉ</span>
              </h2>
              <span className="text-[10px] text-stone-400 font-medium">Bản trải nghiệm làm nhân viên rửa đồ cực iu 🌸</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tutorial toggle */}
            <button
              onClick={() => {
                playMeowSound();
                setShowHowTo(!showHowTo);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                isDarkMode 
                  ? "bg-stone-800 text-stone-300 hover:bg-stone-750" 
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Cách Chơi
            </button>

            {/* Wallet display */}
            <div className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow-inner ${
              isDarkMode ? "bg-amber-950/20 text-amber-400 border border-amber-900/30" : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              <Coins className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>{walletCoins} Xu</span>
            </div>
          </div>
        </div>

        {/* Dynamic Instructional Banner */}
        <AnimatePresence>
          {showHowTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-2xl border text-xs leading-relaxed mb-6 space-y-2 ${
                isDarkMode ? "bg-stone-950/40 border-stone-800/80 text-stone-300" : "bg-stone-50 border-[#eadbca]/30 text-stone-600"
              }`}
            >
              <p className="font-semibold text-rose-500 flex items-center gap-1">✨ Luật chơi siêu đơn giản nhen:</p>
              <ol className="list-decimal list-inside space-y-1.5 font-sans font-medium text-stone-500 dark:text-stone-400">
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Giai đoạn 1 (Rửa đồ):</strong> Chọn món đồ dơ từ <span className="underline decoration-dotted">Bể đồ dơ</span>, sau đó nhấn nút <span className="font-semibold text-rose-500">🧼 Xà Phòng</span> để phun bọt xà phòng lên bát đĩa. Kế đến, nhấn nhấp nhiều lần vào nút <span className="font-semibold text-sky-500">🧽 Chà Rửa</span> để chà sạch vết bẩn về 0% rồi xếp sang bàn ráo nước.
                </li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Giai đoạn 2 (Xếp lên kệ):</strong> Sau khi rửa sạch cả 6 chiếc bát đĩa, bạn sẽ sang khu vực kệ úp chén. Chọn món đồ ráo nước ở dưới, rồi chọn đúng chiếc kệ tương ứng (<span className="font-semibold">Kệ Đĩa, Kệ Chén Bát, Kệ Ly Cốc</span>) để phân loại xếp chúng lên kệ ngăn nắp.
                </li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Thời gian & Thưởng Phạt:</strong> Bạn cần hoàn thành tất cả công việc trong vòng <strong className="text-rose-500">60 giây</strong>. Hoàn thành sẽ nhận được <span className="font-bold text-amber-500">50 xu</span> + <span className="font-bold text-emerald-500">xu thưởng tốc độ</span>. Quá thời gian quy định sẽ bị <span className="font-bold text-rose-500">trừ 20 xu</span> nhen!
                </li>
              </ol>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------------------------------------------------------------- */}
        {/* GAME SCREEN: IDLE / NOT STARTED */}
        {/* ---------------------------------------------------------------- */}
        {gameState === "idle" && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-5">
            <div className="relative">
              <span className="text-8xl block animate-bounce">🧼🍽️</span>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full animate-ping" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h3 className={`text-2xl font-serif font-bold italic ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                Thử Thách Làm Nhân Viên Rửa Đồ
              </h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed font-semibold">
                Nàng ơi, bát đĩa sau bữa tiệc của các nam thần đang chất thành đống kìa! Hãy giúp dọn dẹp, rửa thật sạch bóng loáng và xếp chúng thật ngay ngắn lên kệ nhé! 🌸✨
              </p>
            </div>

            <button
              onClick={startNewGame}
              className={`px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                isDarkMode 
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-rose-950/20" 
                  : "bg-gradient-to-r from-rose-400 to-pink-500 text-white hover:from-rose-500 hover:to-pink-600 shadow-rose-100"
              }`}
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              BẮT ĐẦU TRẢI NGHIỆM
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* GAME PLAYING SCREENS (Washing & Sorting) */}
        {/* ---------------------------------------------------------------- */}
        {(gameState === "washing" || gameState === "sorting") && (
          <div className="space-y-6">
            {/* Timer Progress Tracker */}
            <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row justify-between items-center gap-3 ${
              isDarkMode ? "bg-stone-950/40 border-stone-800" : "bg-stone-50 border-stone-100"
            }`}>
              <div className="flex items-center space-x-2">
                <Clock className={`w-5 h-5 ${timeLeft <= 10 ? "text-rose-500 animate-ping" : "text-rose-500"}`} />
                <span className="text-xs font-mono font-bold">Thời gian còn lại:</span>
                <span className={`text-base font-mono font-extrabold ${timeLeft <= 10 ? "text-rose-500 scale-110" : "text-stone-800 dark:text-stone-100"}`}>
                  {timeLeft} giây
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="flex-1 max-w-md w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${timeLeft <= 10 ? "bg-rose-500" : "bg-gradient-to-r from-rose-400 to-pink-500"}`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 60) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>

              {/* Phase badge Indicator */}
              <span className={`px-4 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase ${
                gameState === "washing" 
                  ? "bg-sky-500/10 text-sky-500 border border-sky-500/20 animate-pulse" 
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}>
                {gameState === "washing" ? "👉 Bước 1: Rửa Đồ" : "👉 Bước 2: Xếp Lên Kệ"}
              </span>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* PHASE 1: WASHING SCREEN */}
            {/* ---------------------------------------------------------------- */}
            {gameState === "washing" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1. SINK AREA (CHẬU RỬA CHÉN) */}
                <div className={`lg:col-span-8 p-6 rounded-[2rem] border flex flex-col justify-between ${
                  isDarkMode ? "bg-stone-950/60 border-stone-800" : "bg-sky-50/20 border-sky-100"
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold font-mono text-sky-500 flex items-center gap-1">
                      💧 KHU VỰC BỒN RỬA CHÉN
                    </span>
                    {activeDish && activeDish.dirtLevel === 0 && (
                      <motion.span 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      >
                        Sạch bóng rồi ✨
                      </motion.span>
                    )}
                  </div>

                  {activeDish ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-6 relative">
                      {/* Floating Bubbles Overlay on Active Dish */}
                      <AnimatePresence>
                        {bubbles.map((bubble) => (
                          <motion.div
                            key={bubble.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: -60, opacity: [0.3, 0.9, 0], x: bubble.x - 50 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2 + Math.random() * 1.5, repeat: Infinity, repeatDelay: Math.random() * 1 }}
                            className="absolute bg-sky-200/50 dark:bg-sky-300/30 border border-white/60 rounded-full pointer-events-none"
                            style={{
                              left: `${bubble.x}%`,
                              top: `${bubble.y}%`,
                              width: `${bubble.scale * 12}px`,
                              height: `${bubble.scale * 12}px`
                            }}
                          />
                        ))}
                      </AnimatePresence>

                      {/* Displaying Active Washing Item */}
                      <div className="relative group flex items-center justify-center">
                        {/* Dirty stains effect underneath */}
                        <motion.div 
                          className={`w-36 h-36 rounded-full bg-gradient-to-br ${activeDish.color} border shadow-lg flex items-center justify-center text-6xl relative transition-all duration-300 ${
                            activeDish.dirtLevel > 0 ? "filter brightness-90 saturate-75" : "shadow-emerald-100/40"
                          }`}
                        >
                          <span>{activeDish.emoji}</span>

                          {/* Show dirt level stains */}
                          {activeDish.dirtLevel > 0 && (
                            <div className="absolute inset-2 bg-yellow-900/10 border-2 border-yellow-800/20 rounded-full flex items-center justify-center backdrop-blur-[0.5px]">
                              <span className="text-[10px] text-yellow-800 dark:text-yellow-400 font-bold px-2 py-0.5 rounded bg-yellow-100/80 dark:bg-yellow-950/80 uppercase font-mono tracking-widest shadow-sm">
                                Dơ: {activeDish.dirtLevel}%
                              </span>
                            </div>
                          )}

                          {/* Sparkling clean effect */}
                          {activeDish.dirtLevel === 0 && (
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full flex items-center justify-center animate-pulse">
                              <Sparkles className="w-10 h-10 text-emerald-400 absolute top-2 right-2 animate-spin-slow" />
                              <Sparkles className="w-6 h-6 text-emerald-400 absolute bottom-3 left-4 animate-pulse" />
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-full bg-emerald-50/90 dark:bg-stone-900/90 border border-emerald-200 uppercase font-mono tracking-wider shadow-sm">
                                Đã Rửa Sạch ✨
                              </span>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Info title */}
                      <div className="text-center">
                        <p className={`text-sm font-serif font-bold ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                          {activeDish.name}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          Phân loại: <span className="uppercase">{activeDish.type === "plate" ? "Đĩa" : activeDish.type === "bowl" ? "Chén Bát" : "Ly Cốc"}</span>
                        </p>
                      </div>

                      {/* Interactive Controls Panel */}
                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4 border-t border-stone-100/10 dark:border-stone-800">
                        {/* Soap Trigger */}
                        <button
                          onClick={handleApplySoap}
                          className={`py-3 rounded-2xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${
                            activeDish.isSoaped 
                              ? "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed" 
                              : "bg-rose-500 hover:bg-rose-600 text-white"
                          }`}
                          disabled={activeDish.isSoaped}
                        >
                          🧼 Nước Rửa Chén
                        </button>

                        {/* Scrub Trigger */}
                        <button
                          onClick={handleScrub}
                          className={`py-3 rounded-2xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 ${
                            !activeDish.isSoaped || activeDish.dirtLevel === 0
                              ? "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed" 
                              : "bg-sky-500 hover:bg-sky-600 text-white"
                          }`}
                          disabled={!activeDish.isSoaped || activeDish.dirtLevel === 0}
                        >
                          🧽 Chà Rửa Chén
                        </button>
                      </div>

                      {/* Put onto drying table */}
                      {activeDish.dirtLevel === 0 && (
                        <motion.button
                          initial={{ scale: 0.95 }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          onClick={finishWashingActiveDish}
                          className="w-full max-w-sm py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full text-xs font-bold uppercase tracking-widest font-mono shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                        >
                          <CheckCircle2 className="w-4 h-4 animate-pulse" />
                          Xếp vào rổ phơi ráo nước
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border border-dashed border-stone-200/40 dark:border-stone-800/60 rounded-3xl">
                      <span className="text-5xl block animate-pulse">🚰🧼</span>
                      <div>
                        <p className={`text-xs font-bold font-sans ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
                          Chưa có đồ trong bồn rửa
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono mt-1">
                          Nàng hãy nhấp chọn một món đồ ở bên phải "Bể Đồ Dơ" để đem vào bồn rửa nhé! 👉
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. DIRTY BASKET (BỂ ĐỒ DƠ) */}
                <div className={`lg:col-span-4 p-5 rounded-[2rem] border flex flex-col justify-between ${
                  isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-amber-50/10 border-[#eadbca]/50"
                }`}>
                  <div className="mb-4">
                    <span className="text-xs font-bold font-mono text-amber-500 flex items-center gap-1">
                      🧺 RỔ BÁT ĐĨA DƠ ({dirtyDishes.length} cái)
                    </span>
                    <p className="text-[10px] text-stone-400 font-mono mt-1">Chọn đồ dơ muốn đem rửa:</p>
                  </div>

                  {dirtyDishes.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto max-h-[340px] pr-1">
                      {dirtyDishes.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => selectDishToWash(dish)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-98 flex items-center justify-between gap-2 shadow-sm ${
                            isDarkMode 
                              ? "bg-stone-950 border-stone-800/80 text-stone-200 hover:border-amber-900/40" 
                              : "bg-white border-[#eadbca]/40 text-stone-800 hover:border-amber-300"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{dish.emoji}</span>
                            <div className="text-left">
                              <p className="text-[11px] font-sans font-bold leading-tight">{dish.name}</p>
                              <p className="text-[9px] text-stone-400 font-mono uppercase">{dish.type === "plate" ? "Đĩa" : dish.type === "bowl" ? "Chén" : "Ly"}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400 font-bold border border-yellow-200/20">
                            {dish.dirtLevel}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                      <span className="text-4xl block">🎉</span>
                      <p className="text-xs font-bold text-stone-400">Rổ đồ dơ trống rỗng!</p>
                      <p className="text-[9px] text-stone-500 max-w-[180px] leading-relaxed">
                        Nàng siêu giỏi! Đã rửa sạch sẽ toàn bộ chén đĩa dơ rồi á nhen 💖
                      </p>
                    </div>
                  )}

                  {/* Clean/Washed basket display */}
                  <div className="mt-4 pt-4 border-t border-stone-100/10 dark:border-stone-800">
                    <span className="text-[10px] font-mono font-bold text-stone-400 block mb-2">
                      🧺 RỔ BÁN RÁO NƯỚC ({washedDishes.length} cái)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {washedDishes.map((dish) => (
                        <div
                          key={dish.id}
                          className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm relative"
                          title={`${dish.name} - Sạch sẽ! ✨`}
                        >
                          <span>{dish.emoji}</span>
                          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] bg-emerald-500 text-white rounded-full p-0.5">✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* PHASE 2: SORTING / SHELVING SCREEN */}
            {/* ---------------------------------------------------------------- */}
            {gameState === "sorting" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* 1. SHELVES DISPLAY (KỆ ĐỰNG CHÉN BÁT) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className={`p-5 rounded-[2rem] border ${
                    isDarkMode ? "bg-stone-950/60 border-stone-800" : "bg-stone-50 border-stone-150"
                  }`}>
                    <span className="text-xs font-bold font-mono text-emerald-500 block mb-4">
                      📂 KHU VỰC KỆ ÚP ĐỒ NGĂN NẮP
                    </span>

                    {/* 3 Shelf levels inside */}
                    <div className="space-y-4">
                      {/* Shelf A: PLATE (Đĩa) */}
                      <div 
                        onClick={() => handlePlaceOnShelf("plate")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] flex flex-col gap-2 ${
                          isDarkMode 
                            ? "bg-stone-900/50 border-stone-800 hover:border-emerald-900/40" 
                            : "bg-white border-[#eadbca]/30 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-stone-100/10 dark:border-stone-800/80 pb-1.5">
                          <span className="text-xs font-bold font-sans text-rose-500 flex items-center gap-1">
                            🍽️ KỆ ĐĨA ({shelves.plate.length} cái)
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">Nhấp để xếp đĩa lên đây ➔</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5 min-h-[50px] items-center">
                          {shelves.plate.length > 0 ? (
                            shelves.plate.map((dish) => (
                              <motion.div
                                key={dish.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-3 py-1.5 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200/30 rounded-full flex items-center space-x-1"
                              >
                                <span>{dish.emoji}</span>
                                <span className="text-[10px] font-sans font-medium">{dish.name}</span>
                              </motion.div>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-400 italic font-mono py-2 pl-2">Chưa xếp chiếc đĩa nào...</span>
                          )}
                        </div>
                      </div>

                      {/* Shelf B: BOWL (Chén Bát) */}
                      <div 
                        onClick={() => handlePlaceOnShelf("bowl")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] flex flex-col gap-2 ${
                          isDarkMode 
                            ? "bg-stone-900/50 border-stone-800 hover:border-emerald-900/40" 
                            : "bg-white border-[#eadbca]/30 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-stone-100/10 dark:border-stone-800/80 pb-1.5">
                          <span className="text-xs font-bold font-sans text-sky-500 flex items-center gap-1">
                            🥣 KỆ CHÉN / BÁT ({shelves.bowl.length} cái)
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">Nhấp để xếp chén lên đây ➔</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5 min-h-[50px] items-center">
                          {shelves.bowl.length > 0 ? (
                            shelves.bowl.map((dish) => (
                              <motion.div
                                key={dish.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-3 py-1.5 bg-sky-50/20 dark:bg-sky-950/10 border border-sky-200/30 rounded-full flex items-center space-x-1"
                              >
                                <span>{dish.emoji}</span>
                                <span className="text-[10px] font-sans font-medium">{dish.name}</span>
                              </motion.div>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-400 italic font-mono py-2 pl-2">Chưa xếp chén bát nào...</span>
                          )}
                        </div>
                      </div>

                      {/* Shelf C: GLASS (Ly/Cốc) */}
                      <div 
                        onClick={() => handlePlaceOnShelf("glass")}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] flex flex-col gap-2 ${
                          isDarkMode 
                            ? "bg-stone-900/50 border-stone-800 hover:border-emerald-900/40" 
                            : "bg-white border-[#eadbca]/30 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex justify-between items-center border-b border-stone-100/10 dark:border-stone-800/80 pb-1.5">
                          <span className="text-xs font-bold font-sans text-emerald-500 flex items-center gap-1">
                            🥛 KỆ LY / CỐC ({shelves.glass.length} cái)
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">Nhấp để xếp ly cốc lên đây ➔</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5 min-h-[50px] items-center">
                          {shelves.glass.length > 0 ? (
                            shelves.glass.map((dish) => (
                              <motion.div
                                key={dish.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-3 py-1.5 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-200/30 rounded-full flex items-center space-x-1"
                              >
                                <span>{dish.emoji}</span>
                                <span className="text-[10px] font-sans font-medium">{dish.name}</span>
                              </motion.div>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-400 italic font-mono py-2 pl-2">Chưa xếp ly cốc nào...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DRY TABLE DRIVING SELECTION (BÀN RÁO NƯỚC) */}
                <div className={`lg:col-span-4 p-5 rounded-[2rem] border flex flex-col justify-between ${
                  isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-white border-[#eadbca]/50"
                }`}>
                  <div>
                    <span className="text-xs font-bold font-mono text-emerald-500 flex items-center gap-1 mb-2">
                      🍽️ BÀN RÁO NƯỚC ({washedDishes.length} cái)
                    </span>
                    <p className="text-[10px] text-stone-400 font-mono leading-relaxed mb-4">
                      Hãy chọn 1 món từ rổ phơi ráo nước bên dưới rồi nhấp lên <strong className="text-stone-700 dark:text-stone-300">đúng Kệ úp đồ</strong> tương ứng để phân loại nhen!
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 overflow-y-auto max-h-[280px] pr-1">
                      {washedDishes.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => {
                            playMeowSound();
                            setSelectedWashedDishId(dish.id);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-sm ${
                            selectedWashedDishId === dish.id
                              ? "border-emerald-400 bg-emerald-50/20 text-emerald-600 dark:text-emerald-400 scale-[1.02] shadow-inner font-extrabold"
                              : isDarkMode 
                                ? "bg-stone-950 border-stone-800/80 text-stone-200 hover:border-emerald-900/40" 
                                : "bg-white border-stone-100 text-stone-800 hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{dish.emoji}</span>
                            <div className="text-left">
                              <p className="text-[11px] font-sans font-bold leading-tight">{dish.name}</p>
                              <p className="text-[9px] text-stone-400 font-mono uppercase">{dish.type === "plate" ? "Đĩa" : dish.type === "bowl" ? "Chén" : "Ly"}</p>
                            </div>
                          </div>
                          {selectedWashedDishId === dish.id && (
                            <span className="text-[8px] uppercase tracking-widest font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold animate-pulse">
                              Đang Chọn
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual Quick Classifier triggers inside mobile */}
                  {selectedWashedDishId && (
                    <div className="mt-4 pt-4 border-t border-stone-100/10 dark:border-stone-800 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-stone-400 block mb-1">
                        ⚡ PHÂN LOẠI NHANH:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handlePlaceOnShelf("plate")}
                          className="py-1.5 text-[10px] font-bold font-mono uppercase rounded-lg border border-rose-200 text-rose-600 bg-rose-50/10 hover:bg-rose-50/30 transition-all cursor-pointer"
                        >
                          Kệ Đĩa
                        </button>
                        <button
                          onClick={() => handlePlaceOnShelf("bowl")}
                          className="py-1.5 text-[10px] font-bold font-mono uppercase rounded-lg border border-sky-200 text-sky-600 bg-sky-50/10 hover:bg-sky-50/30 transition-all cursor-pointer"
                        >
                          Kệ Chén
                        </button>
                        <button
                          onClick={() => handlePlaceOnShelf("glass")}
                          className="py-1.5 text-[10px] font-bold font-mono uppercase rounded-lg border border-emerald-200 text-emerald-600 bg-emerald-50/10 hover:bg-emerald-50/30 transition-all cursor-pointer"
                        >
                          Kệ Ly
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* GAME SCREEN: GAME FINISHED (SUCCESS OR FAILURE OVERLAY) */}
        {/* ---------------------------------------------------------------- */}
        {gameState === "finished" && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-6">
            {isVictory ? (
              <div className="flex flex-col items-center gap-4">
                {/* Cute Trophy celebration */}
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md border-4 border-amber-300">
                  <Trophy className="w-10 h-10 text-white animate-bounce" />
                </div>
                
                <div className="space-y-2 max-w-md">
                  <h3 className="font-serif text-2xl font-extrabold text-emerald-500">
                    Hoàn Thành Xuất Sắc! ✨🎉
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                    Nam thần không ngớt lời khen ngợi nàng giỏi giang, tháo vát! Bát đĩa sạch bóng loáng không một hạt bụi, được xếp lên kệ ngăn nắp cực kỳ hoàn mỹ! 🥰💖
                  </p>
                </div>

                <div className="p-4 rounded-3xl border border-amber-200 bg-amber-50/20 dark:bg-amber-950/20 dark:border-amber-900/40 flex items-center gap-2 max-w-xs justify-center w-full animate-pulse shadow-sm">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    TIỀN CÔNG: +{coinsEarned} Xu nhen!
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <span className="text-7xl block animate-pulse">⏰😭</span>
                
                <div className="space-y-2 max-w-md">
                  <h3 className="font-serif text-2xl font-extrabold text-rose-500">
                    Hết Giờ Mất Rồi! 💔
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                    Huhu! Quá thời gian rửa đồ quy định mất rồi nàng ơi. Nàng rửa hơi chậm một chút nên các chàng trai dỗi nhẹ và bị trừ một xíu tiền công nhen! 🥺💧
                  </p>
                </div>

                <div className="p-4 rounded-3xl border border-rose-200 bg-rose-50/20 dark:bg-rose-950/20 dark:border-rose-900/40 flex items-center gap-2 max-w-xs justify-center w-full shadow-sm text-rose-600 dark:text-rose-400">
                  <Coins className="w-5 h-5" />
                  <span className="text-xs font-mono font-extrabold">
                    PHẠT PHÍ: -{coinsLost} Xu nhen!
                  </span>
                </div>
              </div>
            )}

            {/* End Play Button Panel */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-100/10 dark:border-stone-800/80 w-full max-w-md justify-center">
              <button
                onClick={startNewGame}
                className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-stone-800 hover:bg-stone-750 text-stone-100" 
                    : "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-150"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                CHƠI LẠI VÁN MỚI
              </button>

              <button
                onClick={() => {
                  playMeowSound();
                  onBack();
                }}
                className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-950/20" 
                    : "bg-rose-400 hover:bg-rose-500 text-white shadow-rose-100"
                }`}
              >
                QUAY LẠI SẢNH CHƠI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
