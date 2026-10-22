import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Store, 
  ChefHat, 
  ArrowLeft, 
  Coins, 
  Flame, 
  Utensils, 
  Check, 
  AlertCircle,
  Trophy,
  Award,
  BookOpen,
  Lock
} from "lucide-react";
import { playMeowSound } from "../utils/audio";
import confetti from "canvas-confetti";

interface CookingGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[]; // List of ingredient IDs required
  sellPrice: number;
  unlockPrice: number; // 0 means unlocked by default, otherwise requires coins to buy
}

interface Quest {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  reward: number;
  claimed: boolean;
  type: 'buy_any' | 'cook_any' | 'cook_specific' | 'own_distinct_ingredients' | 'reach_coins';
  targetId?: string;
}

const INGREDIENTS: Ingredient[] = [
  { id: "rice", name: "Gạo", emoji: "🍚", price: 10 },
  { id: "egg", name: "Trứng", emoji: "🥚", price: 15 },
  { id: "meat", name: "Thịt lợn", emoji: "🥩", price: 30 },
  { id: "fish", name: "Cá", emoji: "🐟", price: 35 },
  { id: "vegetable", name: "Rau", emoji: "🥬", price: 10 },
  { id: "noodle", name: "Mì", emoji: "🍜", price: 15 },
  { id: "bread", name: "Bánh mì", emoji: "🍞", price: 20 },
  { id: "cheese", name: "Phô mai", emoji: "🧀", price: 25 },
  { id: "tomato", name: "Cà chua", emoji: "🍅", price: 10 },
  { id: "potato", name: "Khoai tây", emoji: "🥔", price: 10 },
];

const RECIPES: Recipe[] = [
  { id: "r1", name: "Cơm chiên trứng", emoji: "🍛", ingredients: ["rice", "egg"], sellPrice: 40, unlockPrice: 0 },
  { id: "r2", name: "Cơm sườn", emoji: "🍱", ingredients: ["rice", "meat"], sellPrice: 60, unlockPrice: 0 },
  { id: "r3", name: "Phở bò", emoji: "🍜", ingredients: ["noodle", "meat"], sellPrice: 65, unlockPrice: 60 },
  { id: "r4", name: "Bánh mì kẹp thịt", emoji: "🥪", ingredients: ["bread", "meat", "vegetable"], sellPrice: 85, unlockPrice: 50 },
  { id: "r5", name: "Pizza", emoji: "🍕", ingredients: ["bread", "cheese", "tomato"], sellPrice: 90, unlockPrice: 100 },
  { id: "r6", name: "Sushi", emoji: "🍣", ingredients: ["fish", "rice"], sellPrice: 70, unlockPrice: 80 },
  { id: "r7", name: "Trứng xốt cà chua", emoji: "🍳", ingredients: ["egg", "tomato"], sellPrice: 45, unlockPrice: 30 },
  { id: "r8", name: "Thịt xào rau", emoji: "🥗", ingredients: ["meat", "vegetable"], sellPrice: 60, unlockPrice: 40 },
  { id: "r9", name: "Mì xào trứng", emoji: "🍝", ingredients: ["noodle", "egg"], sellPrice: 45, unlockPrice: 30 },
  { id: "r10", name: "Cá nướng", emoji: "🍤", ingredients: ["fish", "vegetable"], sellPrice: 65, unlockPrice: 50 },
  { id: "r11", name: "Khoai tây chiên", emoji: "🍟", ingredients: ["potato", "cheese"], sellPrice: 50, unlockPrice: 40 },
  { id: "r12", name: "Canh chua cá", emoji: "🍲", ingredients: ["fish", "tomato", "vegetable"], sellPrice: 90, unlockPrice: 120 },
];

const INITIAL_QUESTS: Quest[] = [
  { id: "q1", title: "Đi Chợ Đầu Mùa", description: "Mua 3 nguyên liệu bất kỳ từ Cửa Hàng", current: 0, target: 3, reward: 50, claimed: false, type: "buy_any" },
  { id: "q2", title: "Bếp Trưởng Khởi Nghiệp", description: "Nấu thành công 3 món ăn bất kỳ", current: 0, target: 3, reward: 100, claimed: false, type: "cook_any" },
  { id: "q3", title: "Món Ăn Quốc Dân", description: "Nấu thành công 1 phần Cơm chiên trứng 🍛", current: 0, target: 1, reward: 80, claimed: false, type: "cook_specific", targetId: "r1" },
  { id: "q4", title: "Tinh Hoa Nước Ý", description: "Nấu thành công 1 phần Pizza 🍕 ngon lành", current: 0, target: 1, reward: 120, claimed: false, type: "cook_specific", targetId: "r5" },
  { id: "q5", title: "Tủ Lạnh Đầy Đủ", description: "Sở hữu cùng lúc từ 5 nguyên liệu khác nhau trở lên", current: 0, target: 5, reward: 150, claimed: false, type: "own_distinct_ingredients" },
  { id: "q6", title: "Đại Phú Hào", description: "Đạt tổng số xu từ 1000 xu trở lên", current: 0, target: 1000, reward: 200, claimed: false, type: "reach_coins" },
];

export default function CookingGame({ isDarkMode, onBack }: CookingGameProps) {
  const [coins, setCoins] = useState(500);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [view, setView] = useState<'kitchen' | 'store' | 'quests' | 'recipes'>('kitchen');
  const [pot, setPot] = useState<string[]>([]);
  const [cookingState, setCookingState] = useState<'idle' | 'cooking' | 'done'>('idle');
  const [resultDish, setResultDish] = useState<Recipe | 'failed' | 'locked' | null>(null);
  const [dropAnim, setDropAnim] = useState<number>(0);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>(["r1", "r2"]);

  // Load from localStorage if exists
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem("coffee_game_coins");
      if (savedCoins) setCoins(parseInt(savedCoins));
      
      const handleCoinsUpdate = (e: any) => {
        if (e.detail !== undefined) setCoins(e.detail);
      };
      window.addEventListener("coffee-coins-updated", handleCoinsUpdate);
      
      const savedInv = localStorage.getItem("meomeo_cooking_inventory");
      if (savedInv) setInventory(JSON.parse(savedInv));

      const savedQuests = localStorage.getItem("meomeo_cooking_quests");
      if (savedQuests) {
        setQuests(JSON.parse(savedQuests));
      } else {
        const initialWithProgress = INITIAL_QUESTS.map(q => ({ ...q, current: 0 }));
        setQuests(initialWithProgress);
        localStorage.setItem("meomeo_cooking_quests", JSON.stringify(initialWithProgress));
      }

      const savedUnlocked = localStorage.getItem("meomeo_cooking_unlocked_recipes");
      if (savedUnlocked) {
        setUnlockedRecipes(JSON.parse(savedUnlocked));
      } else {
        localStorage.setItem("meomeo_cooking_unlocked_recipes", JSON.stringify(["r1", "r2"]));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveState = (newCoins: number, newInv: Record<string, number>) => {
    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    localStorage.setItem("meomeo_cooking_inventory", JSON.stringify(newInv));
  };

  const unlockRecipe = (recipeId: string, price: number) => {
    if (coins < price) {
      alert("Nàng không đủ xu để mở khóa công thức này rồi! 😭");
      return;
    }
    playMeowSound();
    const newCoins = coins - price;
    setCoins(newCoins);
    const newUnlocked = [...unlockedRecipes, recipeId];
    setUnlockedRecipes(newUnlocked);
    
    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    localStorage.setItem("meomeo_cooking_unlocked_recipes", JSON.stringify(newUnlocked));
    
    confetti({ particleCount: 50, spread: 40, origin: { y: 0.8 } });
  };

  const updateQuestProgress = (type: string, amount: number, targetId?: string) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.claimed) return q;
        if (q.type === type) {
          if (type === 'cook_specific' && q.targetId !== targetId) return q;
          const nextVal = q.current + amount;
          return { ...q, current: Math.min(nextVal, q.target) };
        }
        return q;
      });
      localStorage.setItem("meomeo_cooking_quests", JSON.stringify(updated));
      return updated;
    });
  };

  // Watchers for coin milestones and ingredient counts
  useEffect(() => {
    if (quests.length === 0) return;
    const distinctCount = Object.keys(inventory).filter(id => (inventory[id] || 0) > 0).length;

    setQuests(prev => {
      let changed = false;
      const updated = prev.map(q => {
        if (q.claimed) return q;
        if (q.type === 'own_distinct_ingredients') {
          if (q.current !== distinctCount) {
            changed = true;
            return { ...q, current: Math.min(distinctCount, q.target) };
          }
        }
        if (q.type === 'reach_coins') {
          if (q.current !== coins) {
            changed = true;
            return { ...q, current: Math.min(coins, q.target) };
          }
        }
        return q;
      });
      if (changed) {
        localStorage.setItem("meomeo_cooking_quests", JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [coins, inventory, quests.length]);

  const claimQuestReward = (questId: string) => {
    playMeowSound();
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.claimed || quest.current < quest.target) return;

    const newCoins = coins + quest.reward;
    setCoins(newCoins);

    const updatedQuests = quests.map(q => {
      if (q.id === questId) {
        return { ...q, claimed: true };
      }
      return q;
    });
    setQuests(updatedQuests);

    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    localStorage.setItem("meomeo_cooking_quests", JSON.stringify(updatedQuests));

    confetti({ particleCount: 80, spread: 50, origin: { y: 0.8 } });
  };

  const buyIngredient = (ing: Ingredient) => {
    if (coins >= ing.price) {
      playMeowSound();
      const newCoins = coins - ing.price;
      const newInv = { ...inventory, [ing.id]: (inventory[ing.id] || 0) + 1 };
      setCoins(newCoins);
      setInventory(newInv);
      saveState(newCoins, newInv);
      updateQuestProgress('buy_any', 1);
    } else {
      alert("Nàng không đủ tiền òi! Huhu 😭");
    }
  };

  const addToPot = (ingId: string) => {
    if (pot.length >= 3) {
      alert("Nồi đã đầy! Chỉ chứa tối đa 3 nguyên liệu nhen.");
      return;
    }
    if ((inventory[ingId] || 0) > 0) {
      playMeowSound();
      setPot([...pot, ingId]);
      const newInv = { ...inventory, [ingId]: inventory[ingId] - 1 };
      setInventory(newInv);
      saveState(coins, newInv);
      
      // Trigger drop animation
      setDropAnim(prev => prev + 1);
    }
  };

  const removeFromPot = (index: number) => {
    playMeowSound();
    const ingId = pot[index];
    const newPot = [...pot];
    newPot.splice(index, 1);
    setPot(newPot);
    const newInv = { ...inventory, [ingId]: (inventory[ingId] || 0) + 1 };
    setInventory(newInv);
    saveState(coins, newInv);
  };

  const cook = () => {
    if (pot.length === 0) return;
    playMeowSound();
    setCookingState('cooking');
    
    setTimeout(() => {
      // Find matching recipe
      // A recipe matches if it has exactly the same ingredients (order doesn't matter)
      const sortedPot = [...pot].sort();
      let matchedRecipe = null;

      for (const recipe of RECIPES) {
        const sortedRecipeReq = [...recipe.ingredients].sort();
        if (sortedPot.length === sortedRecipeReq.length && sortedPot.every((val, i) => val === sortedRecipeReq[i])) {
          matchedRecipe = recipe;
          break;
        }
      }

      if (matchedRecipe) {
        if (unlockedRecipes.includes(matchedRecipe.id)) {
          setResultDish(matchedRecipe);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          updateQuestProgress('cook_any', 1);
          updateQuestProgress('cook_specific', 1, matchedRecipe.id);
        } else {
          setResultDish('locked');
        }
      } else {
        setResultDish('failed');
      }
      setCookingState('done');
    }, 2000);
  };

  const clearPot = () => {
    playMeowSound();
    // Return items to inventory
    const newInv = { ...inventory };
    pot.forEach(id => {
      newInv[id] = (newInv[id] || 0) + 1;
    });
    setPot([]);
    setInventory(newInv);
    saveState(coins, newInv);
  };

  const sellDish = () => {
    if (resultDish && resultDish !== 'failed' && resultDish !== 'locked') {
      playMeowSound();
      const newCoins = coins + resultDish.sellPrice;
      setCoins(newCoins);
      saveState(newCoins, inventory);
    }
    resetKitchen();
  };

  const resetKitchen = () => {
    playMeowSound();
    setPot([]);
    setResultDish(null);
    setCookingState('idle');
  };

  return (
    <div className={`w-full h-full min-h-[600px] border rounded-[2rem] overflow-hidden flex flex-col ${
      isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-[#eadbca]/50 shadow-sm"
    }`}>
      {/* Header */}
      <div className="w-full p-4 border-b border-stone-200/20 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 flex justify-between items-center z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider transition-all bg-stone-200 dark:bg-stone-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Thoát
        </button>

        <div className="flex gap-2">
          <button 
            onClick={() => { playMeowSound(); setView('kitchen'); }}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
              view === 'kitchen' 
                ? 'bg-rose-500 text-white' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            <ChefHat size={14} /> <span className="hidden sm:inline">Nhà Bếp</span>
          </button>
          <button 
            onClick={() => { playMeowSound(); setView('store'); }}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
              view === 'store' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            <Store size={14} /> <span className="hidden sm:inline">Cửa Hàng</span>
          </button>
          <button 
            onClick={() => { playMeowSound(); setView('quests'); }}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all cursor-pointer relative ${
              view === 'quests' 
                ? 'bg-amber-500 text-white' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            <Trophy size={14} /> <span className="hidden sm:inline">Nhiệm Vụ</span>
            {quests.some(q => !q.claimed && q.current >= q.target) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
            {quests.some(q => !q.claimed && q.current >= q.target) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={() => { playMeowSound(); setView('recipes'); }}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
              view === 'recipes' 
                ? 'bg-rose-600 text-white' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            <BookOpen size={14} /> <span className="hidden sm:inline">Công Thức</span>
          </button>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full font-bold text-sm">
          <Coins size={14} /> {coins}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'kitchen' ? (
            <motion.div 
              key="kitchen"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 flex flex-col p-4 md:p-6"
            >
              <div className="flex-1 flex flex-col md:flex-row gap-6 h-full">
                {/* Cooking Area */}
                <div className="flex-[2] bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col items-center justify-center relative min-h-[300px]">
                  
                  {cookingState === 'idle' && (
                    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
                      <div className="text-xl font-bold font-serif italic text-stone-600 dark:text-stone-300">Nồi Nấu Ăn</div>
                      
                      {/* Pot */}
                      <motion.div 
                        onDragOver={(e: React.DragEvent) => e.preventDefault()}
                        onDrop={(e: React.DragEvent) => {
                          e.preventDefault();
                          const ingId = e.dataTransfer.getData("ingId");
                          if (ingId) addToPot(ingId);
                        }}
                        animate={{ 
                          scale: dropAnim > 0 ? [1, 1.05, 1] : 1,
                          backgroundColor: dropAnim > 0 
                            ? (isDarkMode ? ["#44403c", "#57534e", "#44403c"] : ["#e5e7eb", "#f3f4f6", "#e5e7eb"]) 
                            : (isDarkMode ? "#44403c" : "#e5e7eb")
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-48 h-48 rounded-full flex items-center justify-center border-4 border-stone-300 dark:border-stone-600 relative shadow-inner"
                      >
                        {/* Smoke Animation */}
                        <AnimatePresence>
                          {dropAnim > 0 && (
                            <motion.div
                              key={dropAnim}
                              initial={{ opacity: 0.8, scale: 0.5, y: 0 }}
                              animate={{ opacity: 0, scale: 1.5, y: -40 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="absolute inset-0 m-auto w-20 h-20 bg-white/40 dark:bg-stone-400/30 rounded-full blur-md pointer-events-none z-20"
                            />
                          )}
                        </AnimatePresence>

                        <div className="flex flex-wrap items-center justify-center gap-2 p-4 z-10">
                          {pot.length === 0 ? (
                            <span className="text-stone-400 text-sm italic">Thêm nguyên liệu...</span>
                          ) : (
                            pot.map((ingId, idx) => {
                              const ing = INGREDIENTS.find(i => i.id === ingId);
                              return (
                                <button 
                                  key={idx}
                                  onClick={() => removeFromPot(idx)}
                                  className="w-12 h-12 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center text-2xl shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                  title="Bỏ ra"
                                >
                                  {ing?.emoji}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>

                      <div className="flex gap-3">
                        <button 
                          onClick={clearPot}
                          disabled={pot.length === 0}
                          className="px-4 py-2 rounded-full font-bold text-sm bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-400 disabled:opacity-50 cursor-pointer transition-all"
                        >
                          Làm sạch nồi
                        </button>
                        <button 
                          onClick={cook}
                          disabled={pot.length === 0}
                          className="px-6 py-2 rounded-full font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Flame size={16} /> Nấu Ngay!
                        </button>
                      </div>
                    </div>
                  )}

                  {cookingState === 'cooking' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-40 h-40 flex items-center justify-center relative">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="w-24 h-24 border-4 border-dashed border-rose-400 rounded-full absolute"
                        />
                        <Flame className="text-rose-500 w-16 h-16 animate-pulse" />
                      </div>
                      <div className="text-lg font-bold text-stone-600 dark:text-stone-300 font-mono animate-pulse">
                        Đang xào nấu...
                      </div>
                    </div>
                  )}

                  {cookingState === 'done' && (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                      <div className="text-2xl font-bold font-serif italic text-stone-700 dark:text-stone-200">
                        {resultDish === 'failed' 
                          ? 'Thất bại rùi 😭' 
                          : resultDish === 'locked'
                          ? 'Chưa Mở Khóa! 🔒'
                          : 'Nấu Thành Công! 🎉'}
                      </div>
                      
                      <div className="w-52 h-52 bg-white dark:bg-stone-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-4 border-2 border-stone-100 dark:border-stone-700">
                        {resultDish === 'failed' ? (
                          <>
                            <span className="text-6xl mb-2">💩</span>
                            <span className="font-bold text-center">Món ăn bóng đêm</span>
                            <span className="text-xs text-stone-400 mt-1">Không ai dám ăn...</span>
                          </>
                        ) : resultDish === 'locked' ? (
                          <>
                            <span className="text-5xl mb-2">🔒🍲</span>
                            <span className="font-bold text-center text-sm text-stone-700 dark:text-stone-300">Công thức ẩn giấu!</span>
                            <span className="text-[11px] text-stone-400 text-center mt-2 leading-relaxed">
                              Nàng đã kết hợp đúng nguyên liệu, nhưng công thức này chưa được mở khóa trong Sách Công Thức nhen!
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-6xl mb-2">{resultDish.emoji}</span>
                            <span className="font-bold text-center text-lg">{resultDish.name}</span>
                            <span className="text-xs font-bold text-emerald-500 mt-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                              Trị giá: {resultDish.sellPrice} <Coins size={10} className="inline mb-0.5"/>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {resultDish !== 'failed' && resultDish !== 'locked' && (
                          <button 
                            onClick={sellDish}
                            className="px-6 py-2 rounded-full font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-2 cursor-pointer transition-all shadow-md hover:-translate-y-0.5"
                          >
                            <Coins size={16} /> Bán Lấy Tiền
                          </button>
                        )}
                        {resultDish === 'locked' && (
                          <button 
                            onClick={() => { playMeowSound(); setView('recipes'); resetKitchen(); }}
                            className="px-6 py-2 rounded-full font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-2 cursor-pointer transition-all shadow-md hover:-translate-y-0.5"
                          >
                            <BookOpen size={16} /> Mở Sách Ngay
                          </button>
                        )}
                        <button 
                          onClick={resetKitchen}
                          className="px-6 py-2 rounded-full font-bold text-sm bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-400 cursor-pointer transition-all hover:-translate-y-0.5"
                        >
                          <Utensils size={16} /> Nấu Món Khác
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Inventory Area */}
                <div className="flex-[1] bg-stone-100 dark:bg-stone-800/50 rounded-2xl p-4 flex flex-col">
                  <div className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Tủ Lạnh (Nguyên Liệu)</span>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
                    {Object.keys(inventory).filter(id => (inventory[id] || 0) > 0).length === 0 ? (
                      <div className="text-center text-stone-400 mt-10 text-sm italic">
                        Tủ lạnh trống rỗng.<br/>Hãy sang Cửa Hàng mua nhé!
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                        {Object.keys(inventory).map(id => {
                          const count = inventory[id] || 0;
                          if (count <= 0) return null;
                          const ing = INGREDIENTS.find(i => i.id === id);
                          if (!ing) return null;
                          
                          return (
                            <button
                              key={id}
                              onClick={() => addToPot(id)}
                              draggable={cookingState === 'idle' && pot.length < 3}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("ingId", id);
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                              disabled={cookingState !== 'idle' || pot.length >= 3}
                              className="flex items-center justify-between bg-white dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-rose-300 cursor-grab disabled:cursor-not-allowed disabled:opacity-50 transition-all group hover:shadow-sm active:cursor-grabbing"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{ing.emoji}</span>
                                <span className="text-sm font-bold text-stone-700 dark:text-stone-300 text-left">{ing.name}</span>
                              </div>
                              <span className="text-xs font-bold bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-md text-stone-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                x{count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-[10px] text-stone-400 italic bg-stone-200/50 dark:bg-stone-800 p-2 rounded-lg">
                    Mẹo: Kéo thả (hoặc click) tối đa 3 nguyên liệu vào nồi và nhấn Nấu Ngay! Thử kết hợp ngẫu nhiên xem ra món gì nha.
                  </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'store' ? (
            <motion.div 
              key="store"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-stone-200 dark:border-stone-800 pb-2">
                <Store className="text-emerald-500" />
                <h3 className="text-xl font-bold font-serif italic text-stone-700 dark:text-stone-200">Chợ Nguyên Liệu</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {INGREDIENTS.map(ing => (
                  <div key={ing.id} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group">
                    <span className="text-5xl group-hover:scale-110 transition-transform">{ing.emoji}</span>
                    <span className="font-bold text-stone-700 dark:text-stone-300 text-center text-sm">{ing.name}</span>
                    <div className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                      {ing.price} <Coins size={10} />
                    </div>
                    <button 
                      onClick={() => buyIngredient(ing)}
                      className="w-full py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Mua
                    </button>
                    <div className="text-[10px] text-stone-400">Đang có: {inventory[ing.id] || 0}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800">
                <h4 className="font-bold text-stone-600 dark:text-stone-400 mb-4 flex items-center gap-2">
                  <Utensils size={16} /> Sách Công Thức Gợi Ý (Có Thể Bán Có Lời!)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {RECIPES.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
                      <span className="text-3xl">{r.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-stone-700 dark:text-stone-300">{r.name}</span>
                        <div className="flex gap-1 mt-1">
                          {r.ingredients.map((ingId, idx) => (
                            <span key={idx} className="text-xs bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded shadow-sm border border-stone-100 dark:border-stone-800">
                              {INGREDIENTS.find(i => i.id === ingId)?.emoji}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full whitespace-nowrap">
                        +{r.sellPrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : view === 'quests' ? (
            <motion.div 
              key="quests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center gap-2 mb-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <Trophy className="text-amber-500" />
                <h3 className="text-xl font-bold font-serif italic text-stone-700 dark:text-stone-200">Nhiệm Vụ Nhà Bếp</h3>
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-6">
                Chăm chỉ hoàn thành thử thách để tích lũy thêm Xu sắm sửa nguyên liệu cao cấp nhen nàng! ✨
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quests.map(quest => {
                  const isCompleted = quest.current >= quest.target;
                  const progressPercentage = Math.min((quest.current / quest.target) * 100, 100);

                  return (
                    <div 
                      key={quest.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        quest.claimed
                          ? "bg-stone-100/40 border-stone-200 dark:bg-stone-800/10 dark:border-stone-800 opacity-70"
                          : isCompleted
                          ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 shadow-sm"
                          : "bg-white border-stone-200 dark:bg-stone-800 dark:border-stone-700"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm md:text-base flex items-center gap-1.5">
                            <Award className={`w-4 h-4 ${isCompleted && !quest.claimed ? "text-amber-500 animate-bounce" : "text-stone-400"}`} />
                            {quest.title}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${
                            quest.claimed
                              ? "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                              : isCompleted
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse"
                              : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                          }`}>
                            {quest.claimed ? "Đã nhận" : isCompleted ? "Hoàn thành!" : "Đang làm"}
                          </span>
                        </div>
                        
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                          {quest.description}
                        </p>
                      </div>

                      <div className="space-y-3 mt-auto">
                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-stone-400 mb-1">
                            <span>Tiến trình</span>
                            <span>{quest.type === 'reach_coins' ? `${quest.current} / ${quest.target} xu` : `${quest.current} / ${quest.target}`}</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                quest.claimed
                                  ? "bg-stone-400"
                                  : isCompleted
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Claim action */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                            <Coins size={12} /> +{quest.reward} Xu
                          </div>

                          {quest.claimed ? (
                            <button 
                              disabled
                              className="px-3 py-1.5 bg-stone-200 dark:bg-stone-800 text-stone-400 rounded-xl text-xs font-bold flex items-center gap-1 cursor-not-allowed"
                            >
                              <Check size={12} /> Đã Nhận
                            </button>
                          ) : isCompleted ? (
                            <button
                              onClick={() => claimQuestReward(quest.id)}
                              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer animate-pulse"
                            >
                              🎁 Nhận Thưởng
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800/50 text-stone-400 rounded-xl text-xs font-bold cursor-not-allowed"
                            >
                              Chưa Đạt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="recipes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center gap-2 mb-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <BookOpen className="text-rose-500" />
                <h3 className="text-xl font-bold font-serif italic text-stone-700 dark:text-stone-200">Sách Công Thức Bí Truyền</h3>
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-6">
                Mở khóa các công thức cao cấp bằng Xu để có thể nấu thành công và bán với giá siêu hời nhé nàng! 📖✨
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {RECIPES.map(recipe => {
                  const isUnlocked = unlockedRecipes.includes(recipe.id);
                  return (
                    <div 
                      key={recipe.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isUnlocked
                          ? "bg-white border-stone-200 dark:bg-stone-800 dark:border-stone-700 shadow-sm"
                          : "bg-stone-50/50 border-stone-200 dark:bg-stone-900/40 dark:border-stone-800/80"
                      }`}
                    >
                      {/* Diagonal watermark for locked recipes */}
                      {!isUnlocked && (
                        <div className="absolute -top-1 -right-1 bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1">
                          <Lock size={10} /> Khóa
                        </div>
                      )}

                      <div className="flex gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm ${
                          isUnlocked 
                            ? "bg-rose-50 dark:bg-rose-950/20" 
                            : "bg-stone-200/50 dark:bg-stone-800 grayscale"
                        }`}>
                          {isUnlocked ? recipe.emoji : "❓"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-sm md:text-base truncate ${
                            isUnlocked ? "text-stone-800 dark:text-stone-100" : "text-stone-400 dark:text-stone-500"
                          }`}>
                            {isUnlocked ? recipe.name : "Công thức bí mật"}
                          </h4>
                          
                          <div className="flex gap-1 mt-1.5 overflow-x-auto scrollbar-none pb-1">
                            {recipe.ingredients.map((ingId, idx) => {
                              const ing = INGREDIENTS.find(i => i.id === ingId);
                              return (
                                <span 
                                  key={idx} 
                                  className={`text-xs px-2 py-0.5 rounded-md border flex items-center gap-0.5 whitespace-nowrap ${
                                    isUnlocked
                                      ? "bg-stone-50 border-stone-100 dark:bg-stone-900 dark:border-stone-800 text-stone-600 dark:text-stone-400"
                                      : "bg-stone-200/40 border-stone-200 dark:bg-stone-800/30 dark:border-stone-800/60 text-stone-400"
                                  }`}
                                  title={isUnlocked ? ing?.name : "Bí mật"}
                                >
                                  {isUnlocked ? `${ing?.emoji} ${ing?.name}` : "❓"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-400 font-bold uppercase">Giá bán món</span>
                          <span className={`text-xs font-bold flex items-center gap-0.5 ${
                            isUnlocked ? "text-emerald-500" : "text-stone-400"
                          }`}>
                            {recipe.sellPrice} <Coins size={10} />
                          </span>
                        </div>

                        {isUnlocked ? (
                          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1">
                            <Check size={12} /> Đã Mở
                          </div>
                        ) : (
                          <button
                            onClick={() => unlockRecipe(recipe.id, recipe.unlockPrice)}
                            disabled={coins < recipe.unlockPrice}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 transition-all ${
                              coins >= recipe.unlockPrice
                                ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
                                : "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed"
                            }`}
                          >
                            <Coins size={12} /> {recipe.unlockPrice} để mở
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
