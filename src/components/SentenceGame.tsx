import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Play, RotateCcw, Trophy, CheckCircle, Type, Lightbulb, Dumbbell } from "lucide-react";
import confetti from "canvas-confetti";
import { playMeowSound } from "../utils/audio";
import { useGlobalCoins } from "../hooks/useGlobalCoins";

interface SentenceGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const SENTENCES = [
  // 3-4 words (Level 1-5)
  "Cố lên nào bạn",
  "Trời hôm nay đẹp",
  "Mèo con ngủ ngoan",
  "Bạn thật tuyệt vời",
  "Cười lên đi nào",
  // 5-6 words (Level 6-10)
  "Tôi thích uống cà phê sữa",
  "Hạnh phúc là một hành trình",
  "Hôm nay tôi rất vui vẻ",
  "Đọc sách giúp tôi thư giãn",
  "Mỗi ngày là một món quà",
  // 7-8 words (Level 11-15)
  "Cuộc sống luôn tràn ngập bất ngờ",
  "Hãy luôn mỉm cười và tỏa sáng nhé",
  "Thành công đến từ sự kiên trì",
  "Đừng bao giờ từ bỏ giấc mơ",
  "Gia đình là điểm tựa vững chắc nhất",
  // 9-10 words (Level 16-20)
  "Hãy sống như thể hôm nay là ngày cuối",
  "Luôn giữ tinh thần lạc quan trong mọi hoàn cảnh",
  "Cuộc đời là những chuyến đi dài đầy thú vị",
  "Những điều tốt đẹp nhất thường đến rất bất ngờ",
  "Thất bại là mẹ thành công và là bài học",
  // 11-13 words (Level 21+)
  "Trên con đường thành công không có dấu chân của kẻ lười biếng",
  "Không có gì là không thể nếu bạn có đủ sự quyết tâm",
  "Hãy đối xử với người khác như cách bạn muốn họ đối xử",
  "Sự chuẩn bị kỹ lưỡng là chìa khóa mở ra cánh cửa thành công",
  "Trân trọng những gì đang có là bí quyết để có được hạnh phúc"
];

const getSentenceForLevel = (lvl: number) => {
  if (lvl < SENTENCES.length) {
    return SENTENCES[lvl];
  }
  // Infinite play: cycle through the medium and hard sentences (from index 10 onwards)
  const hardStartIndex = 10; 
  const hardCount = SENTENCES.length - hardStartIndex;
  return SENTENCES[hardStartIndex + ((lvl - SENTENCES.length) % hardCount)];
};

interface WordItem {
  id: string;
  word: string;
  used: boolean;
}

const PRACTICE_BUCKETS = {
  easy: SENTENCES.slice(0, 10),
  medium: SENTENCES.slice(10, 15),
  hard: SENTENCES.slice(15, 25)
};

export default function SentenceGame({ isDarkMode, onBack }: SentenceGameProps) {
  const { addCoins } = useGlobalCoins();
  const [gameState, setGameState] = useState<"menu" | "playing" | "won" | "finished" | "practice_menu">("menu");
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [wordsBank, setWordsBank] = useState<WordItem[]>([]);
  const [answer, setAnswer] = useState<WordItem[]>([]);
  const [isError, setIsError] = useState(false);
  
  const [isPractice, setIsPractice] = useState(false);
  const [practiceSentence, setPracticeSentence] = useState("");
  const [practiceDiff, setPracticeDiff] = useState<"easy" | "medium" | "hard" | null>(null);

  // Load level and score progress
  useEffect(() => {
    const savedLevel = localStorage.getItem("sentence_game_level");
    if (savedLevel) {
      const parsed = parseInt(savedLevel, 10);
      setLevel(parsed);
    }
    const savedScore = localStorage.getItem("sentence_game_score");
    if (savedScore) {
      setScore(parseInt(savedScore, 10));
    }
  }, []);

  const setupBoard = (sentence: string) => {
    const words = sentence.split(" ");
    
    let shuffled = [...words].sort(() => Math.random() - 0.5);
    // Ensure it's properly shuffled if more than 2 words
    if (words.length > 2) {
      while (shuffled.join(" ") === sentence) {
        shuffled = [...words].sort(() => Math.random() - 0.5);
      }
    }

    setWordsBank(
      shuffled.map((w, i) => ({
        id: `word-${Date.now()}-${i}-${Math.random()}`,
        word: w,
        used: false,
      }))
    );
    setAnswer([]);
    setIsError(false);
    setGameState("playing");
  };

  const prepareLevel = (lvlIndex: number) => {
    setIsPractice(false);
    const sentence = getSentenceForLevel(lvlIndex);
    setupBoard(sentence);
  };

  const startPractice = (diff: "easy" | "medium" | "hard") => {
    setIsPractice(true);
    setPracticeDiff(diff);
    const bucket = PRACTICE_BUCKETS[diff];
    const randomSentence = bucket[Math.floor(Math.random() * bucket.length)];
    setPracticeSentence(randomSentence);
    setupBoard(randomSentence);
  };

  const startGame = () => {
    playMeowSound();
    prepareLevel(level);
  };

  const handleSelectWord = (item: WordItem) => {
    if (item.used) return;
    playMeowSound();
    
    // Mark as used in bank
    setWordsBank((prev) => prev.map(w => w.id === item.id ? { ...w, used: true } : w));
    // Add to answer
    setAnswer((prev) => [...prev, item]);
  };

  const handleDeselectWord = (item: WordItem) => {
    playMeowSound();
    
    // Remove from answer
    setAnswer((prev) => prev.filter(w => w.id !== item.id));
    // Mark as unused in bank
    setWordsBank((prev) => prev.map(w => w.id === item.id ? { ...w, used: false } : w));
    setIsError(false);
  };

  const checkAnswer = () => {
    const currentSentence = isPractice ? practiceSentence : getSentenceForLevel(level);
    const playerSentence = answer.map(w => w.word).join(" ");

    if (playerSentence === currentSentence) {
      // Correct!
      playMeowSound();
      addCoins(isPractice ? 5 : 10);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#34d399', '#fbbf24', '#60a5fa']
      });
      
      const newScore = score + 50;
      setScore(newScore);
      localStorage.setItem("sentence_game_score", newScore.toString());
      
      setGameState("won");
      if (!isPractice) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        localStorage.setItem("sentence_game_level", nextLevel.toString());
      }
    } else {
      // Wrong!
      setIsError(true);
      setTimeout(() => setIsError(false), 500); // Reset shake after 500ms
    }
  };

  const handleHint = () => {
    const targetWords = (isPractice ? practiceSentence : getSentenceForLevel(level)).split(" ");
    
    // Find the first index where the answer is wrong or missing
    let firstWrongIndex = 0;
    while (
      firstWrongIndex < answer.length && 
      answer[firstWrongIndex].word === targetWords[firstWrongIndex]
    ) {
      firstWrongIndex++;
    }

    if (firstWrongIndex >= targetWords.length) return; // Already solved?

    const targetWordStr = targetWords[firstWrongIndex];

    // Revert any words in the answer from firstWrongIndex onwards
    const wordsToRevert = answer.slice(firstWrongIndex);
    const newAnswer = answer.slice(0, firstWrongIndex);
    
    // Update wordsBank for the reverted words
    let newWordsBank = wordsBank.map(w => {
      if (wordsToRevert.some(rw => rw.id === w.id)) {
        return { ...w, used: false };
      }
      return w;
    });

    // Now find the targetWordStr in the newWordsBank that is NOT used
    const hintWordIndex = newWordsBank.findIndex(w => w.word === targetWordStr && !w.used);
    if (hintWordIndex !== -1) {
      const hintWord = newWordsBank[hintWordIndex];
      newWordsBank[hintWordIndex] = { ...hintWord, used: true };
      newAnswer.push(hintWord);
    }

    setAnswer(newAnswer);
    setWordsBank(newWordsBank);
    
    // Deduct score
    const newScore = Math.max(0, score - 10);
    setScore(newScore);
    localStorage.setItem("sentence_game_score", newScore.toString());
    playMeowSound();
  };

  // Auto-check when all words are placed
  useEffect(() => {
    if (gameState === "playing" && answer.length > 0 && answer.length === wordsBank.length) {
      checkAnswer();
    }
  }, [answer, wordsBank, gameState]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
      <div className={`w-full max-w-xl p-6 sm:p-8 rounded-[2rem] border shadow-sm transition-all duration-300 relative min-h-[400px] flex flex-col ${
        isDarkMode ? "bg-stone-900/80 border-stone-800" : "bg-white border-[#eadbca]/50"
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-stone-100/10 dark:border-stone-800/80 pb-4">
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
                <Type className="w-5 h-5 text-emerald-500" />
                <span className={isDarkMode ? "text-stone-100" : "text-stone-800"}>Sắp Xếp Từ</span>
              </h2>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1 text-right">
            <div>
              <span className="text-[10px] text-stone-400 font-mono uppercase mr-2">Điểm</span>
              <span className="text-xl font-bold text-amber-500 font-mono">{score}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-mono uppercase mr-2">{isPractice ? "Độ Khó" : "Màn"}</span>
              <span className="text-sm font-bold text-emerald-500 font-mono uppercase">
                {isPractice 
                  ? (practiceDiff === "easy" ? "Dễ" : practiceDiff === "medium" ? "Trung Bình" : "Khó") 
                  : (level + 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col justify-center relative w-full max-w-lg mx-auto">
          
          {gameState === "menu" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center text-emerald-500 mb-4">
                <Type className="w-20 h-20 animate-bounce" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-stone-700 dark:text-stone-200">
                Ghép Chữ Thành Câu
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
                Sắp xếp các từ lộn xộn thành một câu hoàn chỉnh có nghĩa. Vượt qua từng màn để rèn luyện trí nhớ và khả năng ngôn ngữ nhé! 🧩✨
              </p>
              
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <button
                  onClick={startGame}
                  className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> {level > 0 ? "Chơi Tiếp" : "Bắt Đầu"}
                </button>
                
                <button
                  onClick={() => {
                    playMeowSound();
                    setGameState("practice_menu");
                  }}
                  className={`w-full py-3 rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
                    isDarkMode 
                      ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750" 
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <Dumbbell className="w-4 h-4" /> Luyện Tập
                </button>
              </div>
            </div>
          )}

          {gameState === "practice_menu" && (
            <div className="text-center space-y-6">
              <div className="flex justify-center text-amber-500 mb-4">
                <Dumbbell className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-700 dark:text-stone-200">
                Chế Độ Luyện Tập
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-6">
                Chọn độ khó mong muốn để luyện tập. Điểm số vẫn sẽ được cộng thêm nhưng tiến độ màn chơi chính sẽ không thay đổi.
              </p>
              
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={() => startPractice("easy")}
                  className="w-full py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-xl font-bold font-mono transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border border-emerald-200 dark:border-emerald-800/50"
                >
                  Dễ (3-6 từ)
                </button>
                <button
                  onClick={() => startPractice("medium")}
                  className="w-full py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 rounded-xl font-bold font-mono transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border border-amber-200 dark:border-amber-800/50"
                >
                  Trung Bình (7-8 từ)
                </button>
                <button
                  onClick={() => startPractice("hard")}
                  className="w-full py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 rounded-xl font-bold font-mono transition-all shadow-sm hover:scale-[1.02] active:scale-95 cursor-pointer border border-rose-200 dark:border-rose-800/50"
                >
                  Khó (9+ từ)
                </button>
                
                <button
                  onClick={() => {
                    playMeowSound();
                    setGameState("menu");
                  }}
                  className={`mt-4 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                    isDarkMode ? "text-stone-500 hover:text-stone-300" : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  Quay lại
                </button>
              </div>
            </div>
          )}

          {gameState === "playing" && (
            <div className="w-full flex flex-col h-full justify-between gap-8">
              
              {/* Answer Box */}
              <div className="w-full">
                <p className="text-[10px] text-stone-400 font-mono uppercase text-center mb-3">Câu của bạn</p>
                <motion.div 
                  animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`min-h-[120px] p-4 rounded-2xl border-2 border-dashed flex flex-wrap gap-2 content-start transition-colors ${
                    isError 
                      ? "border-rose-400/50 bg-rose-50 dark:bg-rose-900/10" 
                      : (isDarkMode ? "border-stone-700 bg-stone-800/50" : "border-stone-300 bg-stone-50")
                  }`}
                >
                  <AnimatePresence>
                    {answer.map((item, index) => {
                      const targetWords = getSentenceForLevel(level).split(" ");
                      const isCorrectPos = item.word === targetWords[index];
                      
                      return (
                        <motion.div
                          key={`ans-${item.id}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={
                            isCorrectPos 
                              ? { opacity: 1, scale: [1, 1.1, 1], rotate: [0, -3, 3, -3, 0] } 
                              : { opacity: 1, scale: 1, rotate: 0 }
                          }
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          layout
                          onClick={() => handleDeselectWord(item)}
                          className={`px-4 py-2 text-white font-medium rounded-xl shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                            isCorrectPos
                              ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20"
                              : "bg-gradient-to-br from-sky-400 to-indigo-500"
                          }`}
                        >
                          {item.word}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {answer.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-sm text-stone-400 dark:text-stone-500 select-none">
                      Nhấn vào các từ bên dưới để ghép câu...
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Words Bank */}
              <div className="w-full pb-4">
                <div className="flex justify-between items-center mb-3 px-2">
                  <div className="w-24"></div> {/* Spacer for centering */}
                  <p className="text-[10px] text-stone-400 font-mono uppercase text-center m-0">Từ cho sẵn</p>
                  <button 
                    onClick={handleHint}
                    disabled={score < 10}
                    className={`flex items-center justify-center gap-1 text-[10px] font-mono uppercase px-2 py-1 rounded-full border transition-colors w-24 ${
                      score >= 10 
                        ? (isDarkMode ? "border-amber-500/50 text-amber-500 hover:bg-amber-500/10 cursor-pointer" : "border-amber-400 text-amber-600 hover:bg-amber-50 cursor-pointer")
                        : (isDarkMode ? "border-stone-700 text-stone-600 cursor-not-allowed" : "border-stone-200 text-stone-400 cursor-not-allowed")
                    }`}
                    title="Dùng 10 điểm để nhận gợi ý"
                  >
                    <Lightbulb className="w-3 h-3" />
                    <span>Gợi ý (-10đ)</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {wordsBank.map((item) => (
                    <div key={`bank-${item.id}`} className="relative h-10">
                      {/* Ghost placeholder when used */}
                      {item.used && (
                        <div className={`absolute inset-0 border-2 border-dashed rounded-xl ${
                          isDarkMode ? "border-stone-700 bg-stone-800/30" : "border-stone-200 bg-stone-100/50"
                        }`} />
                      )}
                      
                      <button
                        onClick={() => handleSelectWord(item)}
                        disabled={item.used}
                        className={`px-4 py-2 font-medium rounded-xl border transition-all duration-200 cursor-pointer ${
                          item.used 
                            ? "opacity-0 scale-90" 
                            : (isDarkMode 
                                ? "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700 hover:border-stone-600 shadow-sm hover:-translate-y-1 active:translate-y-0" 
                                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-sm hover:-translate-y-1 active:translate-y-0")
                        }`}
                      >
                        {item.word}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Overlays */}
        <AnimatePresence>
          {gameState === "won" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-[2rem]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                className={`p-8 rounded-3xl border shadow-2xl text-center max-w-sm w-full mx-4 ${
                  isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
                }`}
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Chính xác!</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                  Câu hoàn chỉnh: <br/>
                  <strong className="text-emerald-500 dark:text-emerald-400 mt-2 block text-lg">
                    "{isPractice ? practiceSentence : getSentenceForLevel(level - 1)}"
                  </strong>
                </p>
                <button
                  onClick={() => isPractice ? startPractice(practiceDiff!) : prepareLevel(level)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full font-bold uppercase tracking-widest font-mono transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> {isPractice ? "Câu tiếp theo" : `Qua màn ${level + 1}`}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
