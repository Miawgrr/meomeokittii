import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Coins, 
  HelpCircle, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  BookOpen, 
  RotateCcw,
  CheckCircle2,
  Trash2,
  BookmarkCheck,
  Flame,
  ChefHat,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { playMeowSound } from "../utils/audio";
import confetti from "canvas-confetti";

interface CakeGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

interface AnimalCustomer {
  id: string;
  name: string;
  emoji: string;
  dialogue: string;
  desiredCake: string; // Cake type ID
}

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[]; // required ingredients list
  steps: string[]; // logical steps in correct sequence
  priceToUnlock: number;
  isUnlocked: boolean;
  description: string;
}

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  price: number;
  isOwned: boolean;
  description: string;
}

interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  isCompleted: boolean;
  isClaimed: boolean;
  type: "complete_orders" | "unlock_recipe" | "buy_ingredient" | "perfect_cakes";
  progress: number;
  target: number;
}

// Sound Synthesizers using Web Audio API
const playMixSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.3);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.35);
  } catch (e) {}
};

const playBakeSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.5);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.55);
  } catch (e) {}
};

const playDecorateSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.16);
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
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
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
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.31);
  } catch (e) {}
};

const ANIMAL_CUSTOMERS: AnimalCustomer[] = [
  { id: "cust-cat", name: "Mèo Ú Meo Meo", emoji: "🐱", dialogue: "Hôm nay trẫm muốn thưởng thức một chiếc Bánh Kem Dâu Tây ngọt lịm tim sen! Làm ngon trẫm thưởng đậm nhen! 🍓💕", desiredCake: "cake-strawberry" },
  { id: "cust-shiba", name: "Cún Shiba Đáng Yêu", emoji: "🐶", dialogue: "Gâu gâu! Mình vừa đi dạo về mệt quá, có chiếc Bánh Kem Matcha thanh mát nào không nhà ngoại ơi? 🍵💚", desiredCake: "cake-matcha" },
  { id: "cust-bunny", name: "Thỏ Bông Tinh Nghịch", emoji: "🐰", dialogue: "Bánh kem dâu thường quá rồi! Cho tớ một chiếc Bánh Kem Sô-cô-la hảo hạng đậm vị đắng ngọt ngào đi nào! 🍫🍫", desiredCake: "cake-chocolate" },
  { id: "cust-panda", name: "Gấu Trúc Mũm Mĩm", emoji: "🐼", dialogue: "Măm măm... ta thèm một chiếc Bánh Kem Việt Quất mọng nước hoàng gia sang trọng nhất tiệm! 🍇✨", desiredCake: "cake-blueberry" }
];

export default function CakeGame({ isDarkMode, onBack }: CakeGameProps) {
  const [walletCoins, setWalletCoins] = useState<number>(150);
  const [activeTab, setActiveTab] = useState<"baking" | "shop" | "quests" | "recipes">("baking");
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Customer Order
  const [currentCustomer, setCurrentCustomer] = useState<AnimalCustomer>(ANIMAL_CUSTOMERS[0]);

  // Baking Step States
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0); // 0: Mixing, 1: Baking, 2: Creaming, 3: Decorating
  const [mixedIngredients, setMixedIngredients] = useState<string[]>([]);
  const [isBaked, setIsBaked] = useState<boolean>(false);
  const [isCreamed, setIsCreamed] = useState<boolean>(false);
  const [isDecorated, setIsDecorated] = useState<boolean>(false);
  const [bakingLogs, setBakingLogs] = useState<string[]>([]);

  // Animations & Reward Result States
  const [activeBakingAnimation, setActiveBakingAnimation] = useState<"dusting" | "whipping" | "sprinkling" | null>(null);
  const [bakingResult, setBakingResult] = useState<{
    score: number;
    coinsEarned: number;
    isPerfect: boolean;
    message: string;
    customerName: string;
    customerEmoji: string;
  } | null>(null);

  // Recipes State
  const [recipes, setRecipes] = useState<Recipe[]>([
    { id: "cake-strawberry", name: "Bánh Kem Dâu Tây Thơ Mộng", emoji: "🍓🍰", ingredients: ["Bột Mì 🌾", "Đường 🍬", "Dâu Tây 🍓"], steps: ["Trộn bột ngọt ngào", "Nướng cốt bánh thơm", "Phết kem sữa tươi", "Trang trí dâu mọng"], priceToUnlock: 0, isUnlocked: true, description: "Bánh kem vị dâu dồi dào kem tươi ngọt lịm mộng mơ." },
    { id: "cake-matcha", name: "Bánh Matcha Vườn Thảo Nguyên", emoji: "🍵🍰", ingredients: ["Bột Mì 🌾", "Trứng 🥚", "Bột Matcha 🍵"], steps: ["Trộn bột matcha thơm mát", "Nướng cốt bánh dẻo", "Phết kem phô mai", "Trang trí matcha rực rỡ"], priceToUnlock: 50, isUnlocked: false, description: "Bột trà xanh Nhật Bản nguyên chất dồi dào thanh mát, dịu êm." },
    { id: "cake-chocolate", name: "Bánh Sô-cô-la Bỉ Đậm Đà", emoji: "🍫🍰", ingredients: ["Bột Mì 🌾", "Đường 🍬", "Sô-cô-la Nguyên Chất 🍫"], steps: ["Trộn bột sô-cô-la đen", "Nướng cốt bánh đậm vị", "Phết kem hạt dẻ", "Trang trí sô-cô-la vụn"], priceToUnlock: 80, isUnlocked: false, description: "Sô-cô-la chảy béo ngậy xen lẫn hậu vị đắng nhẹ hoàn mỹ." },
    { id: "cake-blueberry", name: "Bánh Việt Quất Hoàng Gia", emoji: "🫐🍰", ingredients: ["Bột Mì 🌾", "Trứng 🥚", "Quả Việt Quất 🫐"], steps: ["Trộn bột việt quất thanh tao", "Nướng cốt bánh xốp mịn", "Phết kem sữa chua", "Trang trí việt quất mọng nước"], priceToUnlock: 120, isUnlocked: false, description: "Sự kết hợp sang quý của việt quất chua ngọt cùng cốt bánh hoàng gia." }
  ]);

  // Ingredients State
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "ing-wheat", name: "Bột Mì Cao Cấp", emoji: "🌾", price: 0, isOwned: true, description: "Bột mì siêu mịn nhập khẩu làm cốt bánh siêu mềm xốp." },
    { id: "ing-egg", name: "Trứng Gà Tươi", emoji: "🥚", price: 0, isOwned: true, description: "Trứng gà ta lòng đỏ béo ngậy tạo độ xốp xịn mướt." },
    { id: "ing-sugar", name: "Đường Tinh Luyện", emoji: "🍬", price: 0, isOwned: true, description: "Tạo vị ngọt thanh tao chuẩn thợ bánh." },
    { id: "ing-cream", name: "Kem Sữa Tươi nguyên kem", emoji: "🥛", price: 0, isOwned: true, description: "Kem whipping sữa tươi thượng hạng béo bùi." },
    { id: "ing-strawberry", name: "Hộp Dâu Tây Đà Lạt", emoji: "🍓", price: 25, isOwned: false, description: "Dâu tây tươi mọng nước hái tận vườn ngọt lịm." },
    { id: "ing-matcha", name: "Bột Trà Xanh Matcha Nhật", emoji: "🍵", price: 40, isOwned: false, description: "Bột matcha nguyên chất rực rỡ cho hương vị thanh tao." },
    { id: "ing-chocolate", name: "Sô-cô-la Bỉ Đậm Đặc", emoji: "🍫", price: 50, isOwned: false, description: "Khối sô-cô-la đen nguyên chất thơm lừng khó cưỡng." },
    { id: "ing-blueberry", name: "Quả Việt Quất Úc", emoji: "🫐", price: 70, isOwned: false, description: "Quả việt quất mọng nước chua chua ngọt ngọt quý phái." }
  ]);

  // Daily Quests State
  const [quests, setQuests] = useState<DailyQuest[]>([
    { id: "q-orders", title: "Thợ Bánh Siêu Cấp", description: "Làm bánh hoàn thành thành công 3 đơn hàng của động vật.", reward: 40, isCompleted: false, isClaimed: false, type: "complete_orders", progress: 0, target: 3 },
    { id: "q-unlock", title: "Nghiên Cứu Học Hỏi", description: "Mở khóa thành công 1 quyển sách công thức làm bánh mới.", reward: 50, isCompleted: false, isClaimed: false, type: "unlock_recipe", progress: 0, target: 1 },
    { id: "q-buy", title: "Sắm Sửa Nguyên Liệu", description: "Mua thêm nguyên liệu mới từ Cửa hàng nguyên liệu.", reward: 30, isCompleted: false, isClaimed: false, type: "buy_ingredient", progress: 0, target: 1 },
    { id: "q-perfect", title: "Tay Nghề Vàng", description: "Đạt chiếc bánh hoàn hảo đúng quy trình được chấm 100 điểm.", reward: 60, isCompleted: false, isClaimed: false, type: "perfect_cakes", progress: 0, target: 1 }
  ]);

  // Load Coins and Storage on Mount
  useEffect(() => {
    const savedQuests = localStorage.getItem("cake_game_quests");
    if (savedQuests) {
      try {
        setQuests(JSON.parse(savedQuests));
      } catch (e) {}
    }

    const savedCoins = localStorage.getItem("coffee_game_coins");
    if (savedCoins) {
      setWalletCoins(parseInt(savedCoins));
    }

    const savedRecipes = localStorage.getItem("cake_recipes_unlocked");
    if (savedRecipes) {
      try {
        const unlockedIds: string[] = JSON.parse(savedRecipes);
        setRecipes((prev) =>
          prev.map((r) =>
            unlockedIds.includes(r.id) ? { ...r, isUnlocked: true } : r
          )
        );
      } catch (e) {}
    }

    const savedIngredients = localStorage.getItem("cake_ingredients_unlocked");
    if (savedIngredients) {
      try {
        const ownedIds: string[] = JSON.parse(savedIngredients);
        setIngredients((prev) =>
          prev.map((i) =>
            ownedIds.includes(i.id) ? { ...i, isOwned: true } : i
          )
        );
      } catch (e) {}
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveRecipes = (newList: Recipe[]) => {
    const unlockedIds = newList.filter((r) => r.isUnlocked).map((r) => r.id);
    localStorage.setItem("cake_recipes_unlocked", JSON.stringify(unlockedIds));
  };

  const saveIngredients = (newList: Ingredient[]) => {
    const ownedIds = newList.filter((i) => i.isOwned).map((i) => i.id);
    localStorage.setItem("cake_ingredients_unlocked", JSON.stringify(ownedIds));
  };

  const updateQuestProgress = (type: DailyQuest["type"], amount: number) => {
    setQuests((prev) => {
      const next = prev.map((q) => {
        if (q.type === type && !q.isCompleted) {
          const newProg = Math.min(q.target, q.progress + amount);
          return {
            ...q,
            progress: newProg,
            isCompleted: newProg >= q.target
          };
        }
        return q;
      });
      localStorage.setItem("cake_game_quests", JSON.stringify(next));
      return next;
    });
  };

  // Switch Customer
  const nextCustomer = () => {
    playMeowSound();
    const curIdx = ANIMAL_CUSTOMERS.findIndex((c) => c.id === currentCustomer.id);
    const nextIdx = (curIdx + 1) % ANIMAL_CUSTOMERS.length;
    setCurrentCustomer(ANIMAL_CUSTOMERS[nextIdx]);
    resetBakingTable();
  };

  // Reset Table
  const resetBakingTable = () => {
    setCurrentStepIndex(0);
    setMixedIngredients([]);
    setIsBaked(false);
    setIsCreamed(false);
    setIsDecorated(false);
    setBakingLogs(["Khởi động lò nướng, sẵn sàng chuẩn bị làm bánh kem! ✨"]);
  };

  // Recipe details of current customer's desire
  const getDesiredRecipe = () => {
    return recipes.find((r) => r.id === currentCustomer.desiredCake);
  };

  // Mixing action
  const handleAddIngredient = (ing: Ingredient) => {
    if (currentStepIndex !== 0) {
      playErrorSound();
      alert("⚠️ Sai quy trình rồi nàng ơi! Bước này phải làm theo trình tự (Trộn bột ➔ Nướng bánh ➔ Phết kem ➔ Trang trí toppings).");
      return;
    }

    if (!ing.isOwned) {
      playMeowSound();
      alert(`⚠️ Nàng chưa có nguyên liệu "${ing.name}"! Hãy ghé Tab Cửa hàng để sắm sửa nhé! 🛒`);
      return;
    }

    playMixSound();
    
    // Trigger dusting animation
    setActiveBakingAnimation("dusting");
    setTimeout(() => setActiveBakingAnimation(null), 1000);

    const itemStr = `${ing.emoji} ${ing.name}`;
    if (mixedIngredients.includes(itemStr)) return;

    const newMix = [...mixedIngredients, itemStr];
    setMixedIngredients(newMix);
    setBakingLogs((prev) => [...prev, `Thêm ${ing.emoji} ${ing.name} vào tô trộn.`]);

    // Check if the recipe matches ingredients
    const desired = getDesiredRecipe();
    if (desired) {
      // Find missing ingredients in active mix
      const mappedDesireNames = desired.ingredients;
      const isCorrectIngredients = newMix.every((mItem) =>
        mappedDesireNames.some((dName) => mItem.includes(dName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim()))
      );

      // Warning if user adds completely wrong ingredient
      const isBadMix = !mappedDesireNames.some((dName) => itemStr.includes(dName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim()));
      if (isBadMix) {
        playErrorSound();
        setBakingLogs((prev) => [...prev, `⚠️ Ôi hỏng rồi! Nàng trộn lộn nguyên liệu "${ing.name}" rồi, khách hàng không thích đâu nha!`]);
      }
    }
  };

  // Progress to baking step
  const handleStartBaking = () => {
    if (currentStepIndex !== 0) return;
    const desired = getDesiredRecipe();
    if (!desired) return;

    // Check recipe lock state
    if (!desired.isUnlocked) {
      playErrorSound();
      alert(`⚠️ Sách công thức "${desired.name}" chưa được mở khóa! Hãy ghé tab Sách Công Thức để mở khóa bằng xu nhen! 📖`);
      return;
    }

    // Check ingredients quantity
    const correctCount = desired.ingredients.length;
    const mixNamesOnly = mixedIngredients.map((m) => m.substring(3).trim());
    const matchedCount = desired.ingredients.filter((dName) =>
      mixNamesOnly.some((mName) => mName.includes(dName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim()))
    ).length;

    if (matchedCount < correctCount) {
      playErrorSound();
      alert(`⚠️ Thiếu nguyên liệu rồi nàng ơi! Công thức yêu cầu gồm: ${desired.ingredients.join(", ")}.`);
      return;
    }

    playBakeSound();
    setIsBaked(true);
    setCurrentStepIndex(1);
    setBakingLogs((prev) => [...prev, `🔥 Cho tô bột vào lò nướng... cốt bánh đang nở xốp lấp lánh mùi bơ thơm!`]);
  };

  // Progress to creaming step
  const handleStartCreaming = () => {
    if (currentStepIndex !== 1) return;
    playMixSound();

    // Trigger whipping animation
    setActiveBakingAnimation("whipping");
    setTimeout(() => setActiveBakingAnimation(null), 1200);

    setIsCreamed(true);
    setCurrentStepIndex(2);
    setBakingLogs((prev) => [...prev, `🥛 Phết đều một lớp kem tươi mịn đặc béo ngậy ngọt ngào lên cốt bánh.`]);
  };

  // Progress to decorating toppings step
  const handleDecorateToppings = () => {
    if (currentStepIndex !== 2) return;
    playDecorateSound();

    // Trigger sprinkling animation
    setActiveBakingAnimation("sprinkling");
    setTimeout(() => setActiveBakingAnimation(null), 1200);

    setIsDecorated(true);
    setCurrentStepIndex(3);
    setBakingLogs((prev) => [...prev, `✨ Trang trí tỉ mỉ trái cây, toppings quả mọng ngọt lịm hoàn hảo.`]);
  };

  // Serve cake to the customer
  const handleServeCake = () => {
    const desired = getDesiredRecipe();
    if (!desired) return;

    // Evaluate accuracy
    let score = 100;
    const logCheck = [];

    // Step sequence verification
    if (!isBaked) { score -= 30; logCheck.push("Nướng cốt bánh"); }
    if (!isCreamed) { score -= 30; logCheck.push("Phết kem"); }
    if (!isDecorated) { score -= 30; logCheck.push("Trang trí toppings"); }

    // Check for excessive or wrong ingredients in mix
    const mixNamesOnly = mixedIngredients.map((m) => m.substring(3).trim());
    const unwantedCount = mixNamesOnly.filter((mName) =>
      !desired.ingredients.some((dName) => mName.includes(dName.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim()))
    ).length;

    if (unwantedCount > 0) {
      score -= unwantedCount * 15;
    }

    const finalScore = Math.max(10, score);

    if (finalScore >= 70) {
      // Perfect cake success!
      playSuccessSound();
      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Calculate reward coins
      const payCoins = finalScore >= 95 ? 60 : 40;
      const newCoins = walletCoins + payCoins;
      setWalletCoins(newCoins);
      localStorage.setItem("coffee_game_coins", newCoins.toString());
      window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));

      // Complete Daily Quests trigger
      updateQuestProgress("complete_orders", 1);
      if (finalScore >= 95) {
        updateQuestProgress("perfect_cakes", 1);
      }

      setBakingResult({
        score: finalScore,
        coinsEarned: payCoins,
        isPerfect: true,
        message: `Bé ${currentCustomer.name} cực kỳ hào hứng chấm điểm chiếc bánh ${desired.name} ngọt ngào của nàng cực ngon và chuẩn vị! 🥰💖`,
        customerName: currentCustomer.name,
        customerEmoji: currentCustomer.emoji
      });
    } else {
      // Cake failure
      playErrorSound();
      const failFee = 15;
      const newCoins = Math.max(0, walletCoins - failFee);
      setWalletCoins(newCoins);
      localStorage.setItem("coffee_game_coins", newCoins.toString());
      window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));

      setBakingResult({
        score: finalScore,
        coinsEarned: failFee,
        isPerfect: false,
        message: `Tiếc quá! Chiếc bánh chưa đạt chuẩn quy trình chuẩn vị bơ sữa béo bùi. Bé ${currentCustomer.name} hờn dỗi nhẹ nhe! 🥺💧`,
        customerName: currentCustomer.name,
        customerEmoji: currentCustomer.emoji
      });
    }
  };

  // Buy Ingredient
  const handleBuyIngredient = (ing: Ingredient) => {
    if (walletCoins < ing.price) {
      playMeowSound();
      triggerToast("🪙 Nàng ơi ví của nàng không đủ xu để sắm nguyên liệu này!");
      return;
    }

    playSuccessSound();
    const newCoins = walletCoins - ing.price;
    setWalletCoins(newCoins);
    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));

    const updated = ingredients.map((i) => (i.id === ing.id ? { ...i, isOwned: true } : i));
    setIngredients(updated);
    saveIngredients(updated);

    updateQuestProgress("buy_ingredient", 1);
    triggerToast(`🛒 Đã nhập nguyên liệu "${ing.name}" về kho!`);
  };

  // Unlock Recipe
  const handleUnlockRecipe = (rec: Recipe) => {
    if (walletCoins < rec.priceToUnlock) {
      playMeowSound();
      triggerToast("🪙 Nàng ơi ví không đủ xu để mở khóa quyển công thức này nhen!");
      return;
    }

    playSuccessSound();
    const newCoins = walletCoins - rec.priceToUnlock;
    setWalletCoins(newCoins);
    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));

    const updated = recipes.map((r) => (r.id === rec.id ? { ...r, isUnlocked: true } : r));
    setRecipes(updated);
    saveRecipes(updated);

    updateQuestProgress("unlock_recipe", 1);
    triggerToast(`📖 Đã mở khóa sách công thức "${rec.name}"!`);
  };

  // Claim Quest Rewards
  const handleClaimQuestReward = (q: DailyQuest) => {
    if (!q.isCompleted || q.isClaimed) return;

    playSuccessSound();
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.8 }
    });

    const newCoins = walletCoins + q.reward;
    setWalletCoins(newCoins);
    localStorage.setItem("coffee_game_coins", newCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));

    setQuests((prev) => {
      const next = prev.map((quest) => (quest.id === q.id ? { ...quest, isClaimed: true } : quest));
      localStorage.setItem("cake_game_quests", JSON.stringify(next));
      return next;
    });

    triggerToast(`🎁 Nhận phần thưởng: +${q.reward} Xu!`);
  };

  // Refresh Quest to Day 2 Simulation
  const handleRefreshQuests = () => {
    playMeowSound();
    setQuests((prev) => {
      const next = prev.map((q) => ({
        ...q,
        isCompleted: false,
        isClaimed: false,
        progress: 0
      }));
      localStorage.setItem("cake_game_quests", JSON.stringify(next));
      return next;
    });
    triggerToast("📅 Đã cập nhật lại nhiệm vụ ngày mới cho nàng rồi nhen!");
  };

  // Helper to check what steps are pending
  const renderCookingVisualProgress = () => {
    return (
      <div className="relative overflow-hidden w-full min-h-[180px] rounded-3xl">
        {/* Animated Dusting/Whipping/Sprinkling effects */}
        {activeBakingAnimation === "dusting" && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex justify-around">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, opacity: 0.8, scale: 0.8 }}
                animate={{ 
                  y: 190, 
                  opacity: [0.8, 1, 0],
                  scale: [0.8, 1.2, 0.6] 
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: i * 0.05, 
                  ease: "easeOut" 
                }}
                className="w-2.5 h-2.5 bg-white/90 rounded-full shadow-[0_0_8px_white]"
              />
            ))}
          </div>
        )}

        {activeBakingAnimation === "whipping" && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0.9, originY: 0 }}
            animate={{ 
              scaleY: [0, 1.1, 1], 
              opacity: [0.9, 1, 0] 
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-b from-sky-100/40 via-white to-transparent z-20 pointer-events-none flex items-center justify-center"
          >
            <div className="text-white text-xs font-bold font-mono px-3 py-1 bg-sky-500 rounded-full shadow animate-pulse">
              🥛 ĐANG PHẾT KEM TƯƠI MỊN MÀNG...
            </div>
          </motion.div>
        )}

        {activeBakingAnimation === "sprinkling" && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex justify-around">
            {["🍒", "🍓", "✨", "🍬", "🌸", "⭐", "🍓", "🍒"].map((emoji, i) => (
              <motion.div
                key={i}
                initial={{ y: -30, opacity: 1, rotate: 0 }}
                animate={{ 
                  y: 190, 
                  opacity: [1, 1, 0],
                  rotate: [0, 180, 360] 
                }}
                transition={{ 
                  duration: 1, 
                  delay: i * 0.07, 
                  ease: "linear" 
                }}
                className="text-lg"
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        )}

        {currentStepIndex === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-amber-50/20 dark:bg-stone-950/40 rounded-3xl border border-dashed border-amber-200/50 min-h-[180px]">
            <ChefHat className="w-12 h-12 text-amber-500 animate-bounce mb-3" />
            <p className="text-xs font-bold font-sans">Đang trộn bột bơ sữa</p>
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {mixedIngredients.length > 0 ? (
                mixedIngredients.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white dark:bg-stone-900 rounded-full text-[10px] font-bold shadow-sm border border-stone-100 dark:border-stone-800">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-stone-400 italic">Tô trộn bột đang trống rỗng...</span>
              )}
            </div>
          </div>
        ) : currentStepIndex === 1 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-amber-500/5 dark:bg-amber-950/20 rounded-3xl border border-amber-500/30 min-h-[180px] relative overflow-hidden">
            <Flame className="w-12 h-12 text-rose-500 animate-pulse mb-3" />
            <p className="text-xs font-bold font-sans text-rose-500 animate-pulse">Lò nướng đang hoạt động... 🔥</p>
            <p className="text-[10px] text-stone-400 mt-1">Cốt bánh vàng ruộm thơm béo ngậy!</p>
            <button
              onClick={handleStartCreaming}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-[10px] font-bold font-mono tracking-wider mt-4 shadow-sm cursor-pointer"
            >
              Nướng Xong ➔ Phết Kem
            </button>
          </div>
        ) : currentStepIndex === 2 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-sky-500/5 dark:bg-sky-950/20 rounded-3xl border border-sky-500/30 min-h-[180px]">
            <span className="text-5xl block animate-pulse mb-2">🥛🍰</span>
            <p className="text-xs font-bold font-sans text-sky-500">Đã phết một lớp kem tươi mịn màng!</p>
            <button
              onClick={handleDecorateToppings}
              className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-[10px] font-bold font-mono tracking-wider mt-4 shadow-sm cursor-pointer"
            >
              Xong Kem ➔ Trang Trí Topping
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 bg-emerald-500/5 dark:bg-emerald-950/20 rounded-3xl border border-emerald-500/30 min-h-[180px]">
            <span className="text-6xl block animate-bounce mb-2">🎂✨</span>
            <p className="text-xs font-bold font-sans text-emerald-500">Bánh đã trang trí hoàn tất rực rỡ!</p>
            <button
              onClick={handleServeCake}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full text-[10px] font-bold uppercase tracking-widest font-mono mt-4 shadow-md flex items-center gap-1 cursor-pointer animate-pulse"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Serve Khách Hàng
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-stone-800 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`p-6 rounded-[2rem] border shadow-sm transition-all duration-300 ${
        isDarkMode ? "bg-stone-900/80 border-stone-800" : "bg-white border-[#eadbca]/50"
      }`}>
        
        {/* Header Navigation */}
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
                🎂 <span className={isDarkMode ? "text-stone-100" : "text-stone-800"}>Xưởng Bánh Kem Diệu Kỳ</span>
              </h2>
              <span className="text-[10px] text-stone-400 font-medium">Làm bánh kem theo yêu cầu các bé thú, tích xu mở khóa sách công thức 🌸</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playMeowSound();
                setShowHowTo(!showHowTo);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                isDarkMode 
                  ? "bg-stone-800 text-stone-300 hover:bg-stone-750" 
                  : "bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-100"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Cách Chơi
            </button>

            {/* Global Wallet */}
            <div className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow-inner ${
              isDarkMode ? "bg-amber-950/20 text-amber-400 border border-amber-900/30" : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}>
              <Coins className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>{walletCoins} Xu</span>
            </div>
          </div>
        </div>

        {/* Dynamic Instructional guidelines */}
        <AnimatePresence>
          {showHowTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-2xl border text-xs leading-relaxed mb-6 space-y-2 ${
                isDarkMode ? "bg-stone-950/40 border-stone-800/80 text-stone-300" : "bg-pink-50/20 border-pink-100/50 text-stone-600"
              }`}
            >
              <p className="font-semibold text-pink-600 flex items-center gap-1">✨ Trình tự làm bánh kem tiêu chuẩn nhen:</p>
              <ol className="list-decimal list-inside space-y-1.5 font-sans font-medium text-stone-500 dark:text-stone-400">
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Nhận đơn hàng:</strong> Quan sát yêu cầu của con vật khách hàng (ví dụ: thèm Bánh Kem Dâu Tây).
                </li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Bước 1 (Trộn Bột):</strong> Chọn đúng các nguyên liệu có trong công thức yêu cầu của bánh để bỏ vào tô trộn bột. Lưu ý không chọn sai/thừa nguyên liệu khác!
                </li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Bước 2 & 3 & 4 (Chế biến):</strong> Tiến hành nướng cốt bánh, phết kem tươi whipping béo ngậy, cuối cùng rải toppings trang trí tương ứng.
                </li>
                <li>
                  <strong className="text-stone-700 dark:text-stone-300">Nhận Tiền Công & Sách Công thức:</strong> Đưa bánh kem hoàn chỉnh cho khách nhận xu, mua thêm nguyên liệu cao cấp từ cửa hàng hoặc tích xu mở thêm sách công thức mới xịn sò hơn!
                </li>
              </ol>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Menu Options */}
        <div className="flex space-x-1.5 bg-stone-100 dark:bg-stone-950 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => {
              playMeowSound();
              setActiveTab("baking");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "baking"
                ? "bg-white dark:bg-stone-900 shadow-sm text-pink-500"
                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            Làm Bánh Kem
          </button>
          <button
            onClick={() => {
              playMeowSound();
              setActiveTab("recipes");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "recipes"
                ? "bg-white dark:bg-stone-900 shadow-sm text-pink-500"
                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Sách Công Thức
          </button>
          <button
            onClick={() => {
              playMeowSound();
              setActiveTab("shop");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "shop"
                ? "bg-white dark:bg-stone-900 shadow-sm text-amber-500"
                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Chợ Nguyên Liệu
          </button>
          <button
            onClick={() => {
              playMeowSound();
              setActiveTab("quests");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
              activeTab === "quests"
                ? "bg-white dark:bg-stone-900 shadow-sm text-purple-500"
                : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            Nhiệm Vụ Ngày
            {quests.some((q) => q.isCompleted && !q.isClaimed) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* TAB 1: BAKING SCREEN */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === "baking" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: Customer and Interactive Table */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Customer Chat Order Card */}
              <div className={`p-5 rounded-3xl border ${
                isDarkMode ? "bg-stone-950/60 border-stone-800" : "bg-pink-50/15 border-pink-100/50"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold font-mono text-pink-500 tracking-wider">
                    💬 ĐƠN HÀNG CỦA THÚ CƯNG
                  </span>
                  <button
                    onClick={nextCustomer}
                    className="text-[9px] bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 px-2 py-1 rounded-full font-bold font-mono text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-all cursor-pointer"
                  >
                    Đổi khách hàng ➔
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <span className="text-5xl block p-2.5 rounded-2xl bg-white dark:bg-stone-900 shadow-sm animate-bounce" style={{ animationDuration: "2.5s" }}>
                    {currentCustomer.emoji}
                  </span>
                  <div className="text-left flex-1 space-y-1.5">
                    <h4 className="text-xs font-bold font-sans text-stone-800 dark:text-stone-100">
                      {currentCustomer.name}
                    </h4>
                    <p className={`text-xs leading-relaxed italic ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                      "{currentCustomer.dialogue}"
                    </p>
                    <div className="pt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[9px] bg-pink-100/60 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold px-2.5 py-1 rounded-full border border-pink-200/20">
                        Yêu cầu: {getDesiredRecipe()?.name || "Bánh Chưa Unlock"} {getDesiredRecipe()?.emoji}
                      </span>
                      {getDesiredRecipe() && !getDesiredRecipe()?.isUnlocked && (
                        <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Công thức đang khóa!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Cooking Board Visual Section */}
              <div className={`p-6 rounded-[2rem] border flex flex-col justify-between min-h-[300px] ${
                isDarkMode ? "bg-stone-950/30 border-stone-800" : "bg-amber-50/10 border-[#eadbca]/30"
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold font-mono text-amber-500">
                    🥣 BÀN CHẾ BIẾN BÁNH KEM
                  </span>
                  <button
                    onClick={resetBakingTable}
                    className="p-1 rounded text-stone-400 hover:text-rose-500 transition-all cursor-pointer"
                    title="Làm sạch bàn"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {renderCookingVisualProgress()}

                {/* Stepper Control Area */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100/10 dark:border-stone-800">
                  <button
                    onClick={handleStartBaking}
                    disabled={currentStepIndex !== 0}
                    className={`py-2.5 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      currentStepIndex === 0 && mixedIngredients.length > 0
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" /> Step 2: Nướng Cốt
                  </button>

                  <button
                    onClick={handleStartCreaming}
                    disabled={currentStepIndex !== 1}
                    className={`py-2.5 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      currentStepIndex === 1
                        ? "bg-sky-500 text-white hover:bg-sky-600 animate-pulse"
                        : "bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    🥛 Step 3: Phết Kem
                  </button>

                  <button
                    onClick={handleDecorateToppings}
                    disabled={currentStepIndex !== 2}
                    className={`py-2.5 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      currentStepIndex === 2
                        ? "bg-pink-500 text-white hover:bg-pink-600 animate-pulse"
                        : "bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    🍓 Step 4: Toppings
                  </button>
                </div>
              </div>

              {/* Logs Screen */}
              <div className={`p-4 rounded-2xl border ${
                isDarkMode ? "bg-stone-950/40 border-stone-800 text-stone-300 font-mono" : "bg-stone-50 border-stone-100 text-stone-600"
              } text-[10px] text-left max-h-[110px] overflow-y-auto space-y-1`}>
                {bakingLogs.map((log, idx) => (
                  <p key={idx} className="flex items-center gap-1 leading-relaxed font-semibold">
                    <ChevronRight className="w-3 h-3 text-pink-500" />
                    <span>{log}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Right Column: Inventory Pantry Selection */}
            <div className={`lg:col-span-4 p-5 rounded-[2rem] border flex flex-col justify-between ${
              isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-white border-[#eadbca]/50"
            }`}>
              <div>
                <span className="text-xs font-bold font-mono text-pink-500 block mb-2">
                  🌾 KHO NGUYÊN LIỆU ĐANG CÓ
                </span>
                <p className="text-[10px] text-stone-400 font-mono leading-relaxed mb-4">
                  Nhấn chọn nguyên liệu đang sở hữu để thêm vào tô bột (Chỉ có tác dụng ở bước Trộn Bột):
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto max-h-[380px] pr-1">
                  {ingredients.map((ing) => {
                    const isUsed = mixedIngredients.some((item) => item.includes(ing.name));
                    return (
                      <div
                        key={ing.id}
                        onClick={() => handleAddIngredient(ing)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 shadow-sm ${
                          !ing.isOwned
                            ? "opacity-55 bg-stone-50/50 dark:bg-stone-950/30 border-stone-100/50 border-dashed"
                            : isUsed
                              ? "border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400 scale-[1.01]"
                              : isDarkMode 
                                ? "bg-stone-950 border-stone-800/80 text-stone-200 hover:border-pink-900/40" 
                                : "bg-white border-stone-100 text-stone-800 hover:border-pink-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{ing.emoji}</span>
                          <div className="text-left">
                            <p className="text-[10px] font-sans font-bold leading-tight">{ing.name}</p>
                            <p className="text-[8px] text-stone-400 font-mono mt-0.5">
                              {ing.isOwned ? "Kho: Đang có" : `Khóa - ${ing.price} xu`}
                            </p>
                          </div>
                        </div>

                        {ing.isOwned ? (
                          isUsed ? (
                            <span className="text-[7px] font-bold font-mono text-amber-500 bg-amber-500/15 px-1.5 py-0.5 rounded">Đã Bỏ</span>
                          ) : (
                            <span className="text-[7px] text-stone-400 font-mono">Bỏ ➔</span>
                          )
                        ) : (
                          <span className="text-[7px] text-rose-500 font-mono font-bold">Khóa 🛒</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset Order options */}
              <div className="mt-4 pt-4 border-t border-stone-100/10 dark:border-stone-800 text-center">
                <span className="text-[9px] text-stone-400 font-mono">Muốn thay đổi món nguyên liệu trong kho?</span>
                <button
                  onClick={() => {
                    playMeowSound();
                    setActiveTab("shop");
                  }}
                  className="w-full mt-2 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest font-mono bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-all"
                >
                  Ghé Chợ Sắm Thêm 🛒
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 2: RECIPE BOOK */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === "recipes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold font-mono text-pink-500 flex items-center gap-1">
                📖 SÁCH CÔNG THỨC LÀM BÁNH
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Sở hữu sách công thức để chế tạo nhiều loại bánh ngon!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 border rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden ${
                    isDarkMode 
                      ? "bg-stone-950 border-stone-800" 
                      : "bg-white border-stone-100"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl block p-1 bg-stone-100 dark:bg-stone-900 rounded-xl">{rec.emoji}</span>
                        <div className="text-left">
                          <h4 className="text-xs font-bold font-sans text-stone-800 dark:text-stone-100">{rec.name}</h4>
                          <p className="text-[9px] text-stone-400 font-mono mt-0.5">Sách chế biến bánh kem</p>
                        </div>
                      </div>

                      {rec.isUnlocked ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Đã mở khóa
                        </span>
                      ) : (
                        <span className="text-[8px] bg-amber-500/15 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                          {rec.priceToUnlock} Xu
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed font-semibold text-left mb-3">
                      {rec.description}
                    </p>

                    {/* Show Ingredients and Steps if unlocked */}
                    {rec.isUnlocked ? (
                      <div className="space-y-2 pt-2.5 border-t border-stone-100/10 dark:border-stone-800 text-left">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-stone-400 block">Nguyên liệu yêu cầu:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.ingredients.map((ing, idx) => (
                              <span key={idx} className="text-[9px] px-2 py-0.5 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 rounded-full font-medium">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-mono font-bold text-stone-400 block">Quy trình thực hiện:</span>
                          <ol className="list-decimal list-inside text-[9px] text-stone-500 dark:text-stone-400 space-y-0.5 mt-1 leading-relaxed">
                            {rec.steps.map((st, idx) => (
                              <li key={idx} className="font-semibold">{st}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 p-3 bg-stone-100/50 dark:bg-stone-900/50 rounded-2xl text-[9px] text-stone-400 italic">
                        <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                        Mở khóa sách công thức để xem danh sách nguyên liệu và quy trình chế biến bánh kem này nhen!
                      </div>
                    )}
                  </div>

                  {!rec.isUnlocked && (
                    <button
                      onClick={() => handleUnlockRecipe(rec)}
                      className="w-full mt-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest font-mono cursor-pointer transition-all"
                    >
                      Mở Sách Công Thức nhen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 3: INGREDIENTS SHOP */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === "shop" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold font-mono text-amber-500 flex items-center gap-1">
                🛒 CHỢ NGUYÊN LIỆU LÀM BÁNH
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Trang bị dồi dào nguyên liệu tươi mọng nhen!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingredients.filter((i) => i.price > 0).map((ing) => (
                <div
                  key={ing.id}
                  className={`p-4 border rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden ${
                    isDarkMode 
                      ? "bg-stone-950 border-stone-800" 
                      : "bg-white border-stone-100"
                  }`}
                >
                  <div className="flex gap-3 text-left">
                    <span className="text-3xl block p-2 rounded-2xl bg-stone-100 dark:bg-stone-900">{ing.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold font-sans text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                        {ing.name}
                        {ing.isOwned && (
                          <span className="text-[7px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            Đang Sở Hữu
                          </span>
                        )}
                      </h4>
                      <p className="text-[9px] text-stone-400 font-mono uppercase mt-0.5">Hàng nhập khẩu tươi sạch</p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        {ing.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100/10 dark:border-stone-800">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                        {ing.price} Xu
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuyIngredient(ing)}
                      disabled={ing.isOwned}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-bold font-mono uppercase transition-all shadow-sm cursor-pointer ${
                        ing.isOwned
                          ? "bg-stone-150 text-stone-400 cursor-not-allowed"
                          : "bg-amber-500 hover:bg-amber-600 text-white"
                      }`}
                    >
                      {ing.isOwned ? "Đã sắm" : "Mua sắm"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TAB 4: DAILY QUESTS */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === "quests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold font-mono text-purple-500 flex items-center gap-1">
                📅 BẢNG NHIỆM VỤ TIỆM BÁNH
              </span>
              <button
                onClick={handleRefreshQuests}
                className="px-3 py-1.5 bg-purple-50/20 dark:bg-stone-900 border border-purple-200 dark:border-stone-800 text-purple-600 dark:text-purple-400 rounded-xl text-[10px] font-bold font-mono uppercase hover:bg-purple-100/30 transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Ngày Mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 border rounded-3xl flex flex-col justify-between shadow-sm text-left ${
                    isDarkMode 
                      ? "bg-stone-950 border-stone-800" 
                      : "bg-white border-stone-100"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold font-sans text-stone-800 dark:text-stone-100 flex items-center gap-1">
                        {q.title}
                        {q.isCompleted && !q.isClaimed && (
                          <span className="text-[7px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                            Đã Xong
                          </span>
                        )}
                        {q.isClaimed && (
                          <span className="text-[7px] bg-stone-200 dark:bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded font-mono">
                            Đã Nhận Quà
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold">{q.description}</p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                      <Coins className="w-3.5 h-3.5" /> +{q.reward} Xu
                    </div>
                  </div>

                  {/* Progress slide indicator */}
                  <div className="space-y-1.5 pt-3 border-t border-stone-100/10 dark:border-stone-800">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-stone-400">
                      <span>Tiến trình:</span>
                      <span>{q.progress} / {q.target}</span>
                    </div>

                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${(q.progress / q.target) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleClaimQuestReward(q)}
                        disabled={!q.isCompleted || q.isClaimed}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                          q.isClaimed
                            ? "bg-stone-150 text-stone-400 cursor-not-allowed"
                            : q.isCompleted
                              ? "bg-purple-500 text-white hover:bg-purple-600 animate-pulse"
                              : "bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed"
                        }`}
                      >
                        {q.isClaimed ? "Đã nhận quà" : q.isCompleted ? "Nhận Quà nhen 🎁" : "Chưa Hoàn Thành"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Baking Result Modal (Bảng thông báo nhận xu/phạt) */}
      <AnimatePresence>
        {bakingResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-[2rem] border shadow-2xl text-center relative overflow-hidden ${
                isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-stone-200 text-stone-800"
              }`}
            >
              <div className="absolute top-4 right-4 text-xs font-mono font-bold text-stone-400">
                ⭐ {bakingResult.isPerfect ? "XUẤT SẮC" : "THẤT BẠI"}
              </div>

              <span className="text-6xl block animate-bounce mb-3 mt-2">
                {bakingResult.isPerfect ? "🎉" : "🥺"}
              </span>

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl">{bakingResult.customerEmoji}</span>
                <h4 className="font-serif text-lg font-bold">{bakingResult.customerName}</h4>
              </div>

              <div className="p-2 bg-stone-100 dark:bg-stone-950 rounded-2xl mb-4 text-xs font-semibold">
                Điểm Đánh Giá: <span className={bakingResult.isPerfect ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>{bakingResult.score}/100</span>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed font-semibold">
                {bakingResult.message}
              </p>

              {/* Coins Earned Panel */}
              <div className={`p-4 rounded-3xl border mb-6 flex items-center justify-center gap-2 animate-pulse ${
                bakingResult.isPerfect
                  ? "border-amber-200 bg-amber-50/30 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400"
                  : "border-rose-200 bg-rose-50/30 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400"
              }`}>
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-mono font-extrabold uppercase">
                  {bakingResult.isPerfect 
                    ? `Thu Nhập: +${bakingResult.coinsEarned} Xu nhen! 🌸` 
                    : `Hao Phí: -${bakingResult.coinsEarned} Xu nhen! 💧`
                  }
                </span>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setBakingResult(null);
                  if (bakingResult.isPerfect) {
                    nextCustomer();
                  } else {
                    resetBakingTable();
                  }
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono shadow-md cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${
                  bakingResult.isPerfect
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    : "bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white"
                }`}
              >
                {bakingResult.isPerfect ? "Tiếp Tục Đơn Hàng Mới ➔" : "Làm Lại Bánh Khác ➔"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
