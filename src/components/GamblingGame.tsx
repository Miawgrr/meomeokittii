import React, { useState, useEffect } from "react";
import { ArrowLeft, Coins } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playMeowSound, playCoinSound, playWinSound } from "../utils/audio";
import { useGlobalCoins } from "../hooks/useGlobalCoins";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import confetti from "canvas-confetti";

interface GamblingGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function GamblingGame({ isDarkMode, onBack }: GamblingGameProps) {
  
  const { coins: balance, addCoins, deductCoins } = useGlobalCoins();
  const setBalance = (updater: any) => {
     if (typeof updater === 'function') {
         // handleWin sets balance(prev => prev + amount)
         // we don't need setBalance if we just use addCoins, but to avoid replacing everything:
     }
  };
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "dice" | "coin" | "slots">("menu");
  const [betAmount, setBetAmount] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [message, setMessage] = useState("Đặt cược để bắt đầu!");
  const [dice, setDice] = useState([1, 1, 1]);
  const [diceChoice, setDiceChoice] = useState<"tai" | "xiu" | null>(null);
  const [coinSide, setCoinSide] = useState<"head" | "tail">("head");
  const [coinChoice, setCoinChoice] = useState<"head" | "tail" | null>(null);
  const [slots, setSlots] = useState(["🍒", "🍋", "🍇"]);
  const slotSymbols = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🔔"];
  const [spinning, setSpinning] = useState([false, false, false]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().gamblingBalance !== undefined) {
            setBalance(userDoc.data().gamblingBalance);
            localStorage.setItem("gamblingBalance", userDoc.data().gamblingBalance.toString());
          }
        } catch (e) {
          console.error("Lỗi khi tải tiền cờ bạc từ Firestore:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("gamblingBalance", balance.toString());
    
    // Sync to Firestore if logged in
    if (currentUser) {
      setDoc(doc(db, "users", currentUser.uid), {
        gamblingBalance: balance
      }, { merge: true }).catch(e => {
        console.error("Lỗi khi lưu tiền cờ bạc lên Firestore:", e);
      });
    }
  }, [balance, currentUser]);


  // Reset message when changing game
  useEffect(() => {
    if (activeTab !== "menu") {
      setMessage("Đặt cược để bắt đầu!");
    }
  }, [activeTab]);

  
  const handleWin = (amount: number) => {
    addCoins(amount);
    playWinSound();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#ef4444', '#10b981']
    });
  };

  const playDice = () => {
    if (!diceChoice) {
      setMessage("Vui lòng chọn Tài hoặc Xỉu!");
      return;
    }
    if (balance < betAmount) {
      setMessage("Không đủ tiền cược!");
      return;
    }
    
    setIsPlaying(true);
    deductCoins(betAmount);
    playMeowSound();
    
    // Animation loop
    let rolls = 0;
    const rollInterval = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      rolls++;
      
      if (rolls > 15) {
        clearInterval(rollInterval);
        
        const finalDice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ];
        setDice(finalDice);
        
        const total = finalDice.reduce((a, b) => a + b, 0);
        const result = total >= 11 ? "tai" : "xiu";
        
        if (result === diceChoice) {
          setMessage(`Tổng ${total} - Thắng! (+${betAmount * 2} xu)`);
          handleWin(betAmount * 2);
        } else {
          setMessage(`Tổng ${total} - Thua rồi!`);
        }
        setIsPlaying(false);
      }
    }, 100);
  };

  const playCoin = () => {
    if (!coinChoice) {
      setMessage("Vui lòng chọn Sấp hoặc Ngửa!");
      return;
    }
    if (balance < betAmount) {
      setMessage("Không đủ tiền cược!");
      return;
    }
    
    setIsPlaying(true);
    deductCoins(betAmount);
    playMeowSound();
    
    let flips = 0;
    const flipInterval = setInterval(() => {
      setCoinSide(prev => prev === "head" ? "tail" : "head");
      flips++;
      
      if (flips > 20) {
        clearInterval(flipInterval);
        const result = Math.random() > 0.5 ? "head" : "tail";
        setCoinSide(result);
        
        if (result === coinChoice) {
          setMessage(`Thắng! (+${betAmount * 2} xu)`);
          handleWin(betAmount * 2);
        } else {
          setMessage("Thua rồi!");
        }
        setIsPlaying(false);
      }
    }, 100);
  };

  const playSlots = () => {
    if (balance < betAmount) {
      setMessage("Không đủ tiền cược!");
      return;
    }
    
    setIsPlaying(true);
    deductCoins(betAmount);
    playMeowSound();
    
    // Determine the result upfront
    const finalSlots = [
      slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
      slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
      slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
    ];
    
    // Rig the slots slightly in favor of the house, but occasionally let them win big
    if (Math.random() > 0.8) {
       const winSymbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
       finalSlots[0] = winSymbol;
       finalSlots[1] = winSymbol;
       finalSlots[2] = winSymbol;
    }
    
    setSpinning([true, true, true]);
    let localSpinning = [true, true, true];
    let currentSlots = [...slots];
    
    const spinInterval = setInterval(() => {
      currentSlots = [
        localSpinning[0] ? slotSymbols[Math.floor(Math.random() * slotSymbols.length)] : currentSlots[0],
        localSpinning[1] ? slotSymbols[Math.floor(Math.random() * slotSymbols.length)] : currentSlots[1],
        localSpinning[2] ? slotSymbols[Math.floor(Math.random() * slotSymbols.length)] : currentSlots[2]
      ];
      setSlots(currentSlots);
    }, 50);

    setTimeout(() => {
      localSpinning[0] = false;
      setSpinning([...localSpinning]);
      currentSlots[0] = finalSlots[0];
    }, 800);
    
    setTimeout(() => {
      localSpinning[1] = false;
      setSpinning([...localSpinning]);
      currentSlots[1] = finalSlots[1];
    }, 1400);

    setTimeout(() => {
      clearInterval(spinInterval);
      localSpinning[2] = false;
      setSpinning([...localSpinning]);
      setSlots(finalSlots);
      
      if (finalSlots[0] === finalSlots[1] && finalSlots[1] === finalSlots[2]) {
        let multiplier = 5;
        if (finalSlots[0] === "7️⃣") multiplier = 20;
        if (finalSlots[0] === "💎") multiplier = 50;
        
        setMessage(`Nổ Hũ! x${multiplier} (+${betAmount * multiplier} xu)`);
        handleWin(betAmount * multiplier);
      } else if (finalSlots[0] === finalSlots[1] || finalSlots[1] === finalSlots[2] || finalSlots[0] === finalSlots[2]) {
        setMessage(`An ủi! (+${betAmount * 1.5} xu)`);
        handleWin(betAmount * 1.5);
      } else {
        setMessage("Trượt rồi!");
      }
      setIsPlaying(false);
    }, 2000);
  };

  const renderBetControls = () => (
    <div className={`mt-6 p-4 rounded-2xl ${isDarkMode ? "bg-stone-900/50" : "bg-stone-100"} w-full max-w-sm mx-auto`}>
      <div className="flex justify-between items-center mb-3">
        <span className={`text-sm font-bold ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>Mức cược:</span>
        <span className="text-amber-500 font-bold font-mono">{betAmount} xu</span>
      </div>
      <div className="flex gap-2">
        {[10, 50, 100, 500, "ALL"].map(amt => (
          <button
            key={amt}
            disabled={isPlaying}
            onClick={() => {
              playCoinSound();
              setBetAmount(amt === "ALL" ? balance : amt as number);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              (amt === "ALL" ? balance === betAmount : betAmount === amt)
                ? "bg-amber-500 text-white shadow-md scale-105"
                : isDarkMode
                  ? "bg-stone-800 text-stone-400 hover:bg-stone-700"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
            }`}
          >
            {amt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } } : {}} className={`w-full max-w-[900px] mx-auto min-h-[500px] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative transition-colors duration-500 ${isDarkMode ? "bg-stone-950 border-stone-800" : "bg-white border-stone-200"} border`}>
      {/* Header */}
      <div className={`w-full p-4 flex items-center justify-between border-b transition-colors duration-500 ${isDarkMode ? "bg-stone-900/40 border-stone-800/60" : "bg-stone-50/50 border-stone-100"}`}>
        <button
          onClick={() => {
            if (activeTab === "menu") {
              onBack();
            } else {
              playMeowSound();
              setActiveTab("menu");
            }
          }}
          className={`p-2 rounded-full transition-all ${isDarkMode ? "hover:bg-stone-800 text-stone-400" : "hover:bg-stone-200 text-stone-600"} flex items-center gap-2`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold hidden sm:block">{activeTab === "menu" ? "Quay lại" : "Chọn trò khác"}</span>
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full font-mono font-bold">
          <Coins className="w-5 h-5" />
          <span className="text-lg">{balance}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          {activeTab === "menu" && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl flex flex-col gap-6"
            >
              <div className="text-center mb-4">
                <h2 className={`font-serif font-bold text-2xl sm:text-3xl italic px-2 mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Tệ Nạn Xã Hội
                </h2>
                <p className="text-sm text-stone-500">Chọn một trò chơi để thử vận may của bạn!</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => { playMeowSound(); setActiveTab("dice"); }}
                  className={`p-6 rounded-3xl text-center flex flex-col items-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-xl ${
                    isDarkMode ? "bg-stone-900 border-stone-800 hover:bg-stone-800" : "bg-white border-stone-200 hover:bg-rose-50"
                  } border-2`}
                >
                  <div className="text-5xl mb-2">🎲</div>
                  <div className="font-bold text-lg">Tài Xỉu</div>
                  <div className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>Lắc xí ngầu 3 viên</div>
                </button>

                <button
                  onClick={() => { playMeowSound(); setActiveTab("coin"); }}
                  className={`p-6 rounded-3xl text-center flex flex-col items-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-xl ${
                    isDarkMode ? "bg-stone-900 border-stone-800 hover:bg-stone-800" : "bg-white border-stone-200 hover:bg-indigo-50"
                  } border-2`}
                >
                  <div className="text-5xl mb-2">🪙</div>
                  <div className="font-bold text-lg">Tung Đồng Xu</div>
                  <div className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>Sấp hay Ngửa?</div>
                </button>

                <button
                  onClick={() => { playMeowSound(); setActiveTab("slots"); }}
                  className={`p-6 rounded-3xl text-center flex flex-col items-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-xl ${
                    isDarkMode ? "bg-stone-900 border-stone-800 hover:bg-stone-800" : "bg-white border-stone-200 hover:bg-emerald-50"
                  } border-2`}
                >
                  <div className="text-5xl mb-2">🎰</div>
                  <div className="font-bold text-lg">Nổ Hũ</div>
                  <div className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>Quay xèng đổi đời</div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab !== "menu" && (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center justify-center flex-1"
            >
              <div className="text-center mb-8">
                <div className={`text-lg font-mono font-bold px-4 py-2 rounded-xl inline-block ${
                  message.includes("Thắng") || message.includes("Nổ") 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : message.includes("Thua") || message.includes("Trượt")
                      ? "bg-rose-500/10 text-rose-500"
                      : isDarkMode ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-700"
                }`}>
                  {message}
                </div>
              </div>

              {activeTab === "dice" && (
                <div className="w-full max-w-sm flex flex-col items-center gap-8">
                  <div className="flex gap-4">
                    {dice.map((val, i) => (
                      <motion.div
                        key={i}
                        animate={isPlaying ? { 
                          rotate: [0, 90, 180, 270, 360],
                          y: [0, -20, 0, -10, 0]
                        } : {}}
                        transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-xl ${
                          isDarkMode ? "bg-stone-800 text-white" : "bg-white text-stone-800 border"
                        }`}
                      >
                        {DICE_FACES[val - 1]}
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="flex w-full gap-4">
                    <button
                      disabled={isPlaying}
                      onClick={() => { playCoinSound(); setDiceChoice("tai"); }}
                      className={`flex-1 py-4 rounded-2xl font-bold text-xl transition-all ${
                        diceChoice === "tai"
                          ? "bg-rose-500 text-white shadow-lg scale-105"
                          : isDarkMode ? "bg-stone-800 text-stone-400" : "bg-white text-stone-600 border"
                      }`}
                    >
                      TÀI
                      <div className="text-xs font-normal opacity-70 mt-1">11-18 điểm</div>
                    </button>
                    <button
                      disabled={isPlaying}
                      onClick={() => { playCoinSound(); setDiceChoice("xiu"); }}
                      className={`flex-1 py-4 rounded-2xl font-bold text-xl transition-all ${
                        diceChoice === "xiu"
                          ? "bg-indigo-500 text-white shadow-lg scale-105"
                          : isDarkMode ? "bg-stone-800 text-stone-400" : "bg-white text-stone-600 border"
                      }`}
                    >
                      XỈU
                      <div className="text-xs font-normal opacity-70 mt-1">3-10 điểm</div>
                    </button>
                  </div>
                  
                  <button
                    disabled={isPlaying || !diceChoice}
                    onClick={playDice}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                      !diceChoice || isPlaying
                        ? "bg-stone-200 text-stone-400 dark:bg-stone-800/50 dark:text-stone-600 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:shadow-amber-500/30"
                    }`}
                  >
                    {isPlaying ? "Đang xóc..." : "Đổ Xúc Xắc"}
                  </button>
                </div>
              )}

              {activeTab === "coin" && (
                <div className="w-full max-w-sm flex flex-col items-center gap-8">
                  <motion.div
                    animate={isPlaying ? { rotateY: [0, 180, 360, 540, 720, 900, 1080] } : {}}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-xl flex items-center justify-center text-white font-bold text-2xl border-4 border-amber-200"
                  >
                    {coinSide === "head" ? "MẶT SẤP" : "MẶT NGỬA"}
                  </motion.div>
                  
                  <div className="flex w-full gap-4">
                    <button
                      disabled={isPlaying}
                      onClick={() => { playCoinSound(); setCoinChoice("head"); }}
                      className={`flex-1 py-4 rounded-2xl font-bold text-xl transition-all ${
                        coinChoice === "head"
                          ? "bg-amber-500 text-white shadow-lg scale-105"
                          : isDarkMode ? "bg-stone-800 text-stone-400" : "bg-white text-stone-600 border"
                      }`}
                    >
                      SẤP
                    </button>
                    <button
                      disabled={isPlaying}
                      onClick={() => { playCoinSound(); setCoinChoice("tail"); }}
                      className={`flex-1 py-4 rounded-2xl font-bold text-xl transition-all ${
                        coinChoice === "tail"
                          ? "bg-amber-500 text-white shadow-lg scale-105"
                          : isDarkMode ? "bg-stone-800 text-stone-400" : "bg-white text-stone-600 border"
                      }`}
                    >
                      NGỬA
                    </button>
                  </div>
                  
                  <button
                    disabled={isPlaying || !coinChoice}
                    onClick={playCoin}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                      !coinChoice || isPlaying
                        ? "bg-stone-200 text-stone-400 dark:bg-stone-800/50 dark:text-stone-600 cursor-not-allowed"
                        : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl hover:shadow-indigo-500/30"
                    }`}
                  >
                    {isPlaying ? "Đang tung..." : "Tung Đồng Xu"}
                  </button>
                </div>
              )}

              {activeTab === "slots" && (
                <div className="w-full max-w-sm flex flex-col items-center gap-8">
                  <div className={`p-4 rounded-2xl border-4 ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-300"} w-full`}>
                    <div className="flex justify-between bg-white dark:bg-stone-950 p-2 sm:p-4 rounded-xl shadow-inner gap-2 overflow-hidden">
                      {slots.map((symbol, i) => (
                        <div
                          key={i}
                          className="flex-1 h-16 sm:h-20 bg-stone-100 dark:bg-stone-900 rounded-lg flex items-center justify-center text-4xl sm:text-5xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden"
                        >
                          <span className={spinning[i] ? "blur-[2px] opacity-70" : "blur-0 opacity-100 transition-all duration-300"}>
                            {symbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between w-full text-xs sm:text-sm font-mono text-stone-500 dark:text-stone-400 px-2 sm:px-4">
                    <div className="text-center"><div className="text-base sm:text-lg">🍒🍋🍇</div>x1.5 (An ủi)</div>
                    <div className="text-center"><div className="text-base sm:text-lg">🍒🍒🍒</div>x5 Cược</div>
                    <div className="text-center"><div className="text-base sm:text-lg">💎💎💎</div>x50 Cược</div>
                  </div>
                  
                  <button
                    disabled={isPlaying}
                    onClick={playSlots}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                      isPlaying
                        ? "bg-stone-200 text-stone-400 dark:bg-stone-800/50 dark:text-stone-600 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl hover:shadow-emerald-500/30"
                    }`}
                  >
                    {isPlaying ? "Đang quay..." : "Quay Nổ Hũ"}
                  </button>
                </div>
              )}

              {renderBetControls()}
            </motion.div>
          )}
        </AnimatePresence>
            </div>
    </motion.div>
  );
}
