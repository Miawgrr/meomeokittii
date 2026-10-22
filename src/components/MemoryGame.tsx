import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, RotateCcw, Play, Trophy, Sparkles, Eye, Coins, Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import { playMeowSound } from "../utils/audio";

interface MemoryGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = [
  "🍎", "🍌", "🍉", "🍇", "🍓", "🍒", "🍍", "🥝", 
  "🥥", "🍅", "🍆", "🥑", "🍔", "🍟", "🍕", "🌭", 
  "🍿", "🍩", "🍦", "🍰", "🍭", "🍬", "🍫", "🍯",
  "🍪", "🍄", "🍋", "🍊", "🍑", "🍐", "🍏", "🥭"
];

// Sound Synthesizers
const playFlipSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  } catch (e) {}
};

const playMatchSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
};

const playErrorSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
};

const playWinSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  } catch (e) {}
};

const playLoseSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.8);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1);
  } catch (e) {}
};

export default function MemoryGame({ isDarkMode, onBack }: MemoryGameProps) {
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem("memory_game_level");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem("memory_game_score");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<"ready" | "playing" | "won" | "lost">("ready");
  
  // Wallet
  const [walletCoins, setWalletCoins] = useState<number>(0);
  
  // Hint State
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const HINT_COST = 50;

  useEffect(() => {
    const savedCoins = localStorage.getItem("coffee_game_coins");
    if (savedCoins) {
      setWalletCoins(parseInt(savedCoins));
    }
    
    // Listen for cross-component coin updates
    const handleCoinsUpdate = (e: any) => {
      if (e.detail !== undefined) {
        setWalletCoins(e.detail);
      }
    };
    window.addEventListener("coffee-coins-updated", handleCoinsUpdate);
    return () => window.removeEventListener("coffee-coins-updated", handleCoinsUpdate);
  }, []);
  
  // Disable clicks when checking pairs or transitioning
  const [isLocked, setIsLocked] = useState(false);

  // Dynamic Level Config
  const getLevelConfig = (lvl: number) => {
    // Tăng số lượng thẻ:
    // Lvl 1: 4 pairs, Lvl 2: 6 pairs, Lvl 3: 8 pairs...
    // Max 20 pairs (40 cards)
    const pairs = Math.min(20, 2 + lvl * 2);
    
    // Thời gian không trùng lặp và liên tục tăng, không bao giờ bị giảm
    // 30, 47, 68, 93, 122...
    const time = 20 + lvl * 15 + (lvl * lvl * 2);
    
    return { pairs, time };
  };

  const initGame = useCallback((currentLevel: number) => {
    const config = getLevelConfig(currentLevel);
    
    // Select random emojis for this level
    const shuffledEmojis = [...EMOJIS].sort(() => Math.random() - 0.5);
    const selectedEmojis = shuffledEmojis.slice(0, config.pairs);
    
    // Duplicate for pairs
    const gameEmojis = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle cards
    const shuffledCards = gameEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffledCards);
    setFlippedIndices([]);
    setMatchedPairs(0);
    setTimeLeft(config.time);
    setGameState("playing");
    setIsLocked(false);
  }, []);

  // Timer Effect
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState("lost");
          playLoseSound();
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState]);

  // Card matching effect
  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsLocked(true);
      const [idx1, idx2] = flippedIndices;
      
      if (cards[idx1].emoji === cards[idx2].emoji) {
        // Match
        playMatchSound();
        setCards((prev) => {
          const next = [...prev];
          next[idx1].isMatched = true;
          next[idx2].isMatched = true;
          return next;
        });
        setMatchedPairs((prev) => prev + 1);
        setScore((prev) => {
          const newScore = prev + 10;
          localStorage.setItem("memory_game_score", newScore.toString());
          return newScore;
        });
        setFlippedIndices([]);
        setIsLocked(false);
      } else {
        // No match
        playErrorSound();
        const timeout = setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[idx1].isFlipped = false;
            next[idx2].isFlipped = false;
            return next;
          });
          setFlippedIndices([]);
          setIsLocked(false);
        }, 800);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [flippedIndices, cards]);

  // Win condition effect
  useEffect(() => {
    if (gameState === "playing" && cards.length > 0 && matchedPairs === cards.length / 2) {
      setGameState("won");
      playWinSound();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [matchedPairs, cards.length, gameState]);

  const handleCardClick = (index: number) => {
    if (gameState !== "playing" || isLocked) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.includes(index)) return;
    
    playFlipSound();
    
    setCards((prev) => {
      const next = [...prev];
      next[index].isFlipped = true;
      return next;
    });
    
    setFlippedIndices((prev) => [...prev, index]);
  };

  const handleNextLevel = () => {
    playMeowSound();
    const nextLvl = level + 1;
    setLevel(nextLvl);
    localStorage.setItem("memory_game_level", nextLvl.toString());
    initGame(nextLvl);
  };

  const handleRetryLevel = () => {
    playMeowSound();
    initGame(level);
  };
  
  const handleUseHint = () => {
    if (walletCoins < HINT_COST) {
      alert("Nàng không đủ Xu để dùng gợi ý rồi nhen! 🥺");
      setShowHintConfirm(false);
      return;
    }
    
    playMeowSound();
    
    // Deduct coins
    const newCoins = walletCoins - HINT_COST;
    setWalletCoins(newCoins);
    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    
    setShowHintConfirm(false);
    setIsLocked(true);
    
    // Reveal all unmatched cards temporarily
    setCards((prev) => prev.map(c => ({ ...c, isFlipped: true })));
    
    setTimeout(() => {
      setCards((prev) => prev.map(c => ({ 
        ...c, 
        isFlipped: flippedIndices.includes(c.id) || c.isMatched // only keep previously flipped or matched ones flipped
      })));
      setIsLocked(false);
    }, 500);
  };
  
  const handleStart = () => {
    playMeowSound();
    initGame(level);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Determine grid columns based on number of cards
  const getGridCols = (totalCards: number) => {
    if (totalCards <= 8) return "grid-cols-4";
    if (totalCards <= 12) return "grid-cols-4";
    if (totalCards <= 16) return "grid-cols-4";
    if (totalCards <= 20) return "grid-cols-5";
    if (totalCards <= 24) return "grid-cols-6";
    if (totalCards <= 30) return "grid-cols-6";
    if (totalCards <= 36) return "grid-cols-6";
    return "grid-cols-8";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      <div className={`w-full p-6 rounded-[2rem] border shadow-sm transition-all duration-300 relative ${
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
                🎴 <span className={isDarkMode ? "text-stone-100" : "text-stone-800"}>Thử Thách Lật Thẻ</span>
              </h2>
            </div>
          </div>
          
            {gameState !== "ready" && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-[10px] text-stone-400 font-mono block">XU</span>
                <span className="text-sm font-bold text-amber-500 font-mono flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3" /> {walletCoins}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-stone-400 font-mono block">ĐIỂM</span>
                <span className="text-sm font-bold text-amber-500 font-mono">{score}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-stone-400 font-mono block">MÀN CHƠI</span>
                <span className="text-sm font-bold text-sky-500 font-mono">{level}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-sm font-bold shadow-sm ${
                timeLeft <= 10 && gameState === "playing"
                  ? "bg-rose-500 text-white animate-pulse"
                  : isDarkMode 
                    ? "bg-stone-800 text-stone-200" 
                    : "bg-stone-100 text-stone-700"
              }`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="min-h-[400px] flex flex-col items-center justify-center relative">
          
          {gameState === "ready" && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">🎴</div>
              <h3 className="text-xl font-serif font-bold text-stone-700 dark:text-stone-200">
                Lật Thẻ Tìm Cặp Giống Nhau
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                Nhiệm vụ của bạn là tìm các cặp thẻ giống nhau trong thời gian quy định để vượt qua từng màn. Nếu thất bại, bạn có thể chơi lại.
              </p>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Play className="w-4 h-4" /> Bắt Đầu Chơi
              </button>
            </div>
          )}

          {(gameState === "playing" || gameState === "won" || gameState === "lost") && (
            <div className={`grid gap-2 sm:gap-3 w-full max-w-3xl place-items-center ${getGridCols(cards.length)}`}>
              {cards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  className="relative w-full aspect-[3/4] max-w-[80px] cursor-pointer perspective-1000"
                  onClick={() => handleCardClick(idx)}
                  whileHover={{ scale: (card.isFlipped || card.isMatched) ? 1 : 1.05 }}
                  whileTap={{ scale: (card.isFlipped || card.isMatched) ? 1 : 0.95 }}
                >
                  <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    {/* Front of card (hidden by default) */}
                    <div 
                      className={`absolute w-full h-full backface-hidden flex items-center justify-center rounded-xl shadow-sm border ${
                        isDarkMode ? "bg-stone-800 border-stone-700 text-stone-400" : "bg-sky-50 border-sky-100 text-sky-300"
                      }`}
                    >
                      <span className="text-2xl opacity-50">?</span>
                    </div>

                    {/* Back of card (the emoji) */}
                    <div 
                      className={`absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded-xl shadow-md border ${
                        card.isMatched
                          ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700/50"
                          : isDarkMode
                            ? "bg-stone-700 border-stone-600"
                            : "bg-white border-stone-200"
                      }`}
                    >
                      <span className={`text-3xl sm:text-4xl ${card.isMatched ? "animate-pulse" : ""}`}>
                        {card.emoji}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
          
          {gameState === "playing" && (
            <div className="mt-8">
              <button
                onClick={() => setShowHintConfirm(true)}
                disabled={isLocked}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-widest font-mono shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" /> Gợi Ý Lật Thẻ
              </button>
            </div>
          )}

        </div>

        {/* Overlay Modals for Win/Loss */}
        <AnimatePresence>
          {gameState === "won" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[2rem]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`p-8 rounded-3xl border shadow-2xl text-center max-w-sm w-full mx-4 ${
                  isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
                }`}
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                  <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Tuyệt Vời!</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  Bạn đã hoàn thành Màn {level} thành công.<br/>
                  Sẵn sàng cho thử thách tiếp theo chưa?
                </p>
                <button
                  onClick={handleNextLevel}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Màn Tiếp Theo
                </button>
              </motion.div>
            </div>
          )}

          {gameState === "lost" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[2rem]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`p-8 rounded-3xl border shadow-2xl text-center max-w-sm w-full mx-4 ${
                  isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
                }`}
              >
                <div className="text-6xl mb-4">⏱️</div>
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Hết Thời Gian!</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  Đừng nản chí! Bạn có thể thử lại màn này nhé.
                </p>
                <button
                  onClick={handleRetryLevel}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Chơi Lại Màn Này
                </button>
              </motion.div>
            </div>
          )}

          {showHintConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[2rem]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`p-6 sm:p-8 rounded-3xl border shadow-2xl text-center max-w-sm w-full mx-4 ${
                  isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
                }`}
              >
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">Sử dụng Gợi Ý?</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  Bạn có chắc chắn muốn xem tất cả thẻ trong 0.5s?<br/>
                  Sẽ tiêu tốn <strong className="text-amber-500">{HINT_COST} Xu</strong> đó nha!
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setShowHintConfirm(false)}
                    className={`flex-1 py-3 rounded-full font-bold uppercase tracking-widest text-xs font-mono transition-all border cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 ${
                      isDarkMode 
                        ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700" 
                        : "bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <X className="w-3 h-3" /> Hủy
                  </button>
                  <button
                    onClick={handleUseHint}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-full font-bold uppercase tracking-widest text-xs font-mono transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3 h-3" /> Chắc chắn
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
