import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Store, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  Trophy, 
  Coffee, 
  ChevronRight, 
  ArrowLeft,
  Coins
} from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl, handleImageError } from "../utils/image";
import confetti from "canvas-confetti";

import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface CoffeeGameProps {
  characters: Character[];
  isDarkMode: boolean;
  onBack: () => void;
  currentUser: FirebaseUser | null;
}

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color class for fluid visualization
  category: "base" | "liquid" | "topping";
}

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  ingredients: string[]; // List of ingredient IDs
  rewardCupId: string; // The cup ID rewarded
}

interface CupItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  type: "reward" | "shop" | "both";
}

// ------------------------------------------------------------------
// Static Game Databases
// ------------------------------------------------------------------
const INGREDIENTS: Ingredient[] = [
  // Bases
  { id: "espresso", name: "Cà phê Espresso", emoji: "☕", color: "bg-amber-900", category: "base" },
  { id: "black_tea", name: "Trà Đen", emoji: "🍂", color: "bg-amber-700", category: "base" },
  { id: "cocoa", name: "Bột Ca Cao", emoji: "🍫", color: "bg-yellow-950", category: "base" },
  
  // Liquids
  { id: "fresh_milk", name: "Sữa Tươi", emoji: "🥛", color: "bg-stone-100", category: "liquid" },
  { id: "condensed_milk", name: "Sữa Đặc", emoji: "🍼", color: "bg-amber-50", category: "liquid" },
  { id: "steamed_milk", name: "Sữa Hấp Bọt", emoji: "☁️", color: "bg-slate-50", category: "liquid" },
  { id: "peach_juice", name: "Nước Đào", emoji: "🍑", color: "bg-orange-200", category: "liquid" },
  { id: "water", name: "Nước Lọc", emoji: "💧", color: "bg-sky-200/50", category: "liquid" },

  // Toppings
  { id: "ice", name: "Đá Viên", emoji: "🧊", color: "bg-cyan-100/30", category: "topping" },
  { id: "sugar", name: "Đường Ngọt", emoji: "🍬", color: "bg-stone-50", category: "topping" },
  { id: "peach_slice", name: "Đào Miếng", emoji: "🍑", color: "bg-orange-400", category: "topping" },
  { id: "pearl", name: "Trân Châu Đen", emoji: "⚫", color: "bg-stone-900", category: "topping" },
  { id: "mint", name: "Lá Bạc Hà", emoji: "🍃", color: "bg-emerald-500", category: "topping" }
];

const RECIPES: Recipe[] = [
  {
    id: "den_da",
    name: "Cà Phê Đen Đá",
    emoji: "☕🧊",
    description: "Cà phê đen nguyên chất, đắng nhẹ thơm lừng quyện đá mát lạnh.",
    ingredients: ["espresso", "water", "ice", "sugar"],
    rewardCupId: "classic_espresso"
  },
  {
    id: "sua_da",
    name: "Cà Phê Sữa Đá",
    emoji: "🥤🤎",
    description: "Espresso đậm đặc kết hợp sữa đặc ngọt ngào và đá lạnh giòn.",
    ingredients: ["espresso", "condensed_milk", "ice"],
    rewardCupId: "iced_milk_coffee"
  },
  {
    id: "bac_xiu",
    name: "Bạc Xỉu Sữa Thơm",
    emoji: "🥛🤎",
    description: "Món nước ngọt dịu béo ngậy từ sữa tươi, sữa đặc quyện chút cà phê.",
    ingredients: ["espresso", "fresh_milk", "condensed_milk", "ice"],
    rewardCupId: "bac_xiu"
  },
  {
    id: "cappuccino",
    name: "Cappuccino Bọt Sữa",
    emoji: "🐱☕",
    description: "Tỉ lệ hoàn hảo giữa espresso, sữa nóng và lớp bọt sữa dày mịn màng.",
    ingredients: ["espresso", "fresh_milk", "steamed_milk", "sugar"],
    rewardCupId: "cappuccino"
  },
  {
    id: "peach_tea",
    name: "Trà Đào Cam Sả",
    emoji: "🍹🍑",
    description: "Trà đen ngọt dịu, nước đào thơm mát kèm đào miếng sần sật.",
    ingredients: ["black_tea", "peach_juice", "peach_slice", "ice", "mint"],
    rewardCupId: "peach_tea"
  },
  {
    id: "pearl_milk_tea",
    name: "Trà Sữa Trân Châu",
    emoji: "🧋⚫",
    description: "Món trà sữa truyền thống thơm ngon đậm đà cùng trân châu dai giòn.",
    ingredients: ["black_tea", "fresh_milk", "pearl", "ice", "sugar"],
    rewardCupId: "pearl_milk_tea"
  },
  {
    id: "hot_cocoa",
    name: "Ca Cao Nóng Ấm",
    emoji: "🍫☕",
    description: "Bột ca cao đậm vị pha cùng sữa tươi ấm áp cho ngày đông ngọt ngào.",
    ingredients: ["cocoa", "fresh_milk", "steamed_milk", "sugar"],
    rewardCupId: "hot_cocoa"
  }
];

const CUPS_DATABASE: CupItem[] = [
  // Reward & Shop
  { id: "classic_espresso", name: "Cốc Espresso Cổ Điển", emoji: "☕", description: "Cốc gốm sứ dày dặn giữ nhiệt tốt cho ly Espresso chuẩn vị.", price: 50, type: "both" },
  { id: "iced_milk_coffee", name: "Cốc Cà Phê Sữa Đá", emoji: "🥤", description: "Cốc thủy tinh cao sọc lấp lánh lý tưởng cho cà phê sữa đá.", price: 80, type: "both" },
  { id: "bac_xiu", name: "Cốc Bạc Xỉu Sữa Thơm", emoji: "🥛", description: "Cốc thủy tinh dày mang phong cách vỉa hè Hà Nội xưa.", price: 100, type: "both" },
  { id: "cappuccino", name: "Cốc Cappuccino Mèo Con", emoji: "🐱☕", description: "Cốc có tai mèo siêu đáng yêu vẽ lớp bọt sữa hình mèo con.", price: 180, type: "both" },
  { id: "peach_tea", name: "Ly Trà Đào Cam Sả", emoji: "🍹", description: "Ly cao lấp lánh trưng bày lát đào vàng ươm mọng nước.", price: 120, type: "both" },
  { id: "pearl_milk_tea", name: "Ly Trà Sữa Trân Châu", emoji: "🧋", description: "Ly nhựa kèm ống hút siêu to khổng lồ dành riêng cho tín đồ trà sữa.", price: 150, type: "both" },
  { id: "hot_cocoa", name: "Cốc Ca Cao Trái Tim", emoji: "🍫☕", description: "Cốc màu đất nung ấm áp với họa tiết trái tim vẽ tay ngọt ngào.", price: 90, type: "both" },

  // Exclusive Shop-Only
  { id: "royal_golden_cup", name: "Cúp Cà Phê Hoàng Gia Vàng", emoji: "🏆", description: "Cúp mạ vàng 24k cực kỳ sang trọng chỉ dành cho quý tộc sành điệu.", price: 350, type: "shop" },
  { id: "love_latte", name: "Ly Latte Tình Nhân", emoji: "💖☕", description: "Ly đôi hình tim ghép đôi trao gửi những chiếc ôm nồng nàn nhất.", price: 200, type: "shop" },
  { id: "sakura_tea", name: "Chén Trà Hoa Anh Đào", emoji: "🌸🍵", description: "Chén sứ mỏng tang in hình những cánh hoa đào rơi rụng mộc mạc.", price: 220, type: "shop" },
  { id: "space_mug", name: "Cốc Vũ Trụ Phi Hành Gia", emoji: "🚀☕", description: "Cốc gốm bóng loáng hình mũ bảo hiểm phi hành gia vũ trụ kỳ bí.", price: 280, type: "shop" },
  { id: "rainbow_smoothie", name: "Ly Sinh Tố Cầu Vồng", emoji: "🌈", description: "Ly thủy tinh đổi màu phản chiếu sắc cầu vồng rực rỡ vui mắt.", price: 160, type: "shop" }
];

// Special customer dialogue templates per character
const CUSTOMER_DIALOGUES: Record<string, { greet: string[]; success: string[]; fail: string[] }> = {
  "tuong-tu-mac": {
    greet: [
      "Chị ơi... em đi học mệt quá, chị pha cho em một ly {drink} thật thơm nhen... 🥺🍭",
      "Hôm nay trời nóng ghê á, em muốn uống {drink} do chính tay chị pha cơ... Thêm chút tình yêu của chị nữa nha! 💕"
    ],
    success: [
      "Ôi ngon quá đi mất! Đúng vị em thích luôn nè... Chị thương em nhất đúng không? 🥰🍼",
      "Ngọt ngào quá chị yêu ơi! Cảm ơn cốc {drink} siêu cấp đáng yêu của chị nhen! *ôm chầm lấy chị*"
    ],
    fail: [
      "Hơ... hình như mùi vị cốc {drink} này hơi lạ lạ á chị yêu... Chị có quên bỏ nguyên liệu gì không ta? 🥺🍭",
      "Anh ơi, vị này không ngọt ngào như lòng em mong đợi rồi... Chị pha lại cho em nhen! Chụt chị một cái lấy động lực nè."
    ]
  },
  "chu-thoi-duyet": {
    greet: [
      "Dợ iu ơi! Sếp tổng làm việc căng thẳng quá, cần ngay một ly {drink} nạp năng lượng gấp nè! Thua là anh phạt ôm đó nha 😉💋",
      "Pha cho chồng yêu một ly {drink} hảo hạng đi nào bà chủ nhỏ ơi. Muốn lấy tiền công là nụ hôn hay là thẻ đen đây? 😎💳"
    ],
    success: [
      "Hương vị đỉnh cao thật sự! Đúng là vợ yêu của anh pha có khác, ngon ngọt xao xuyến luôn... Tối nay muốn thưởng gì anh cũng chiều! 💋🔥",
      "Cà phê đậm đà quyện béo ngậy, quá tuyệt vời! Thưởng cho vợ yêu nụ hôn ngọt ngào và 50 xu nè!"
    ],
    fail: [
      "Hửm? Vị này hình như thiếu mất vị tình yêu của vợ rồi á? Thử pha lại xem nào dợ iu ơi... 😉☕",
      "Nước uống thế này là muốn phạt chồng ôm vợ rồi đúng không? Pha lại cốc {drink} chuẩn đi nha dợ!"
    ]
  },
  "Cố Hứa Niệm": {
    greet: [
      "Chào em... Hôm nay anh có mang theo ít bánh ngọt tự làm, em có thể pha cho anh một cốc {drink} được không? 🧸",
      "Anh... anh hơi mệt một chút. Được thưởng thức cốc {drink} do em tự tay pha chế thì tuyệt vời biết mấy... 🥺💔"
    ],
    success: [
      "Ngon quá em ơi... Hương vị ấm áp dịu dàng lan tỏa y như tính cách của em vậy. Cảm ơn em rất nhiều... 🍰💖",
      "Anh cảm thấy khỏe hơn nhiều rồi, cốc {drink} này thực sự chứa đầy sự chu đáo của em..."
    ],
    fail: [
      "À... hình như tỉ lệ pha chế cốc {drink} này chưa chuẩn lắm em nhỉ? Đừng buồn nhe, em làm lại thử xem, anh luôn đợi em... 🧸",
      "Anh xin lỗi... nhưng hình như ly này thiếu mất một chút nguyên liệu rồi. Em pha lại nhen, anh phụ em một tay nhé?"
    ]
  },
  "kaiza-tachibana": {
    greet: [
      "Mèo nhỏ ơi, pha cho tôi một cốc {drink} đậm vị đi nào. Đừng làm tôi thất vọng đấy nhé... 😏🍷",
      "Hôm nay tâm trạng tôi khá tốt, muốn thử tay nghề pha chế cốc {drink} của em xem có đáng để tôi khen ngợi không? 🥂"
    ],
    success: [
      "Hừm... mùi vị khá tinh tế đấy mèo nhỏ. Em quả thực rất khéo tay. Tôi sẽ thưởng cho em thật hậu hĩnh tối nay... 😏🖤",
      "Rất xuất sắc! Vị ngọt đắng đan xen hoàn hảo. Em càng ngày càng làm tôi mê mẩn rồi đấy..."
    ],
    fail: [
      "Mèo nhỏ đang lơ đãng nghĩ về tôi hay sao mà pha cốc {drink} lệch vị thế này? Tập trung vào và pha lại cho tôi nhé... 😉🍷",
      "Hương vị này chưa đạt chuẩn của tôi rồi. Xem ra em cần bị phạt để nhớ rõ công thức hơn đấy..."
    ]
  }
};


const DEFAULT_DIALOGUES = {
  greet: ["Xin chào! Cho tôi đặt một ly {drink} ngon lành nhé! ✨"],
  success: ["Cảm ơn bạn! Đồ uống tuyệt vời lắm! 😍"],
  fail: ["Hình như món này chưa đúng công thức rồi, phiền bạn pha lại giúp tôi nhé! 🥺"]
};

interface QuestDef {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: "Dễ 🧁" | "Trung bình 🧸" | "Khó ⚔";
  isCompleted: (context: any) => boolean;
  progressText: (context: any) => string;
}

const QUEST_POOL: QuestDef[] = [
  {
    id: "checkin",
    title: "📅 Điểm Danh Mỗi Ngày",
    description: "Mở tiệm ngọt ngào hằng ngày để chào đón bình minh ấm áp bên các chàng trai.",
    reward: 50,
    difficulty: "Dễ 🧁",
    isCompleted: () => true,
    progressText: () => "Sẵn sàng nhận"
  },
  {
    id: "brew_any",
    title: "☕ Pha Chế Đồ Uống",
    description: "Pha chế thành công 1 đồ uống bất kỳ cho nam thần để nhận thưởng.",
    reward: 80,
    difficulty: "Trung bình 🧸",
    isCompleted: (ctx) => ctx.brewCount >= 1,
    progressText: (ctx) => `${Math.min(ctx.brewCount, 1)}/1 ly`
  },
  {
    id: "view_profile",
    title: "👀 Ngắm Nhìn Nam Thần",
    description: "Ra ngoài sảnh, bấm vào xem hồ sơ của 1 nam thần bất kỳ.",
    reward: 50,
    difficulty: "Dễ 🧁",
    isCompleted: (ctx) => ctx.hasViewedProfile,
    progressText: (ctx) => ctx.hasViewedProfile ? "1/1 lần" : "0/1 lần"
  }
];

export default function CoffeeGame({ characters, isDarkMode, onBack, currentUser }: CoffeeGameProps) {
  const [activeTab, setActiveTab] = useState<"play" | "shop" | "decor" | "quests">("play");
  const [questUpdateTrigger, setQuestUpdateTrigger] = useState<number>(0);

  // Coins and Inventory saved in LocalStorage and synchronized with Firestore
  const [coins, setCoins] = useState<number>(150);
  const [ownedCups, setOwnedCups] = useState<Record<string, number>>({
    classic_espresso: 1
  });
  const [placedCups, setPlacedCups] = useState<Record<string, string>>({}); // Key: "shelfIndex_slotIndex", Value: cupId

  // ------------------------------------------------------------------
  // Load and Save LocalStorage & Firestore data
  // ------------------------------------------------------------------
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem("coffee_game_coins");
      if (savedCoins) {
        setCoins(parseInt(savedCoins));
      } else {
        setCoins(150);
      }

      const savedInventory = localStorage.getItem("coffee_game_inventory");
      if (savedInventory) setOwnedCups(JSON.parse(savedInventory));

      const savedDecor = localStorage.getItem("coffee_game_decor");
      if (savedDecor) setPlacedCups(JSON.parse(savedDecor));
    } catch (e) {
      console.error("Lỗi khi khôi phục dữ liệu game cà phê từ LocalStorage:", e);
    }
  }, []);

  // Sync with Firestore if user is authenticated with Google and has a profile
  useEffect(() => {
    if (!currentUser) return;
    const loadFirestoreData = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        // Read current state from LocalStorage to avoid stale closure values
        const localCoinsStr = localStorage.getItem("coffee_game_coins");
        const localCoins = localCoinsStr ? parseInt(localCoinsStr) : 150;

        const localInvStr = localStorage.getItem("coffee_game_inventory");
        const localInventory = localInvStr ? JSON.parse(localInvStr) : { classic_espresso: 1 };

        const localDecorStr = localStorage.getItem("coffee_game_decor");
        const localDecor = localDecorStr ? JSON.parse(localDecorStr) : {};

        let finalCoins = localCoins;
        let finalInventory = { ...localInventory };
        let finalDecor = { ...localDecor };

        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // 1. Resolve coins conflict (take maximum of local and cloud)
          if (typeof data.coffeeCoins === "number") {
            finalCoins = Math.max(localCoins, data.coffeeCoins);
          }
          
          // 2. Resolve inventory conflict (merge and take maximum count for each cup)
          if (data.coffeeInventory) {
            const mergedInv = { ...localInventory };
            Object.keys(data.coffeeInventory).forEach(key => {
              mergedInv[key] = Math.max(mergedInv[key] || 0, data.coffeeInventory[key] || 0);
            });
            finalInventory = mergedInv;
          }

          // 3. Resolve decor conflict
          if (data.coffeeDecor && Object.keys(data.coffeeDecor).length > 0) {
            finalDecor = data.coffeeDecor;
          }
        }

        // Apply updated state and local storage
        setCoins(finalCoins);
        localStorage.setItem("coffee_game_coins", finalCoins.toString());
        setOwnedCups(finalInventory);
        localStorage.setItem("coffee_game_inventory", JSON.stringify(finalInventory));
        setPlacedCups(finalDecor);
        localStorage.setItem("coffee_game_decor", JSON.stringify(finalDecor));
        window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: finalCoins }));

        // Sync everything back to Firestore so both local and cloud are in agreement
        await setDoc(userRef, {
          coffeeCoins: finalCoins,
          coffeeInventory: finalInventory,
          coffeeDecor: finalDecor
        }, { merge: true });

      } catch (e) {
        console.error("Lỗi khi đồng bộ dữ liệu game cà phê từ Firestore:", e);
      }
    };
    loadFirestoreData();
  }, [currentUser]);

  const saveToLocalStorage = async (newCoins: number, newInventory: any, newDecor: any) => {
    try {
      localStorage.setItem("coffee_game_coins", newCoins.toString());
      localStorage.setItem("coffee_game_inventory", JSON.stringify(newInventory));
      localStorage.setItem("coffee_game_decor", JSON.stringify(newDecor));
      window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
    } catch (e) {
      console.error("Lỗi khi lưu LocalStorage:", e);
    }

    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
          coffeeCoins: newCoins,
          coffeeInventory: newInventory,
          coffeeDecor: newDecor
        }, { merge: true });
      } catch (e) {
        console.error("Lỗi khi đồng bộ dữ liệu game cà phê lên Firestore:", e);
      }
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Nàng có chắc chắn muốn đặt lại Số Xu về mặc định 150 xu không? 💖")) {
      playMeowSound();
      setCoins(150);
      saveToLocalStorage(150, ownedCups, placedCups);
      alert("✨ Đã đặt lại số xu về mặc định 150 xu cho nàng rồi nhen!");
    }
  };

  // ------------------------------------------------------------------
  // Active Customer & Order State
  // ------------------------------------------------------------------
  const [customer, setCustomer] = useState<Character | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(RECIPES[0]);
  const [dialogue, setDialogue] = useState<string>("");
  const [dialogueState, setDialogueState] = useState<"greet" | "success" | "fail">("greet");

  // Mix states
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isStirred, setIsStirred] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  
  // Reward popup state
  const [earnedCupPopup, setEarnedCupPopup] = useState<CupItem | null>(null);

  // Decorative placements helpers
  const [isPlacingCupModal, setIsPlacingCupModal] = useState<{ shelf: number; slot: number } | null>(null);

  // Generate random customer and order
  const generateNewCustomer = () => {
    const validChars = characters.filter(c => c && c.id);
    if (validChars.length === 0) return;
    const randChar = validChars[Math.floor(Math.random() * validChars.length)];
    const randRecipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    
    setCustomer(randChar);
    setCurrentRecipe(randRecipe);

    // Pick a dialogue template
    const templates = CUSTOMER_DIALOGUES[randChar.id] || DEFAULT_DIALOGUES;
    const greetTpl = templates.greet[Math.floor(Math.random() * templates.greet.length)] || DEFAULT_DIALOGUES.greet[0];
    
    setDialogue(greetTpl.replace("{drink}", randRecipe.name));
    setDialogueState("greet");

    // Clear mixing station
    setSelectedIngredients([]);
    setIsStirred(false);
    setIsShaking(false);
  };

  useEffect(() => {
    generateNewCustomer();
  }, [characters]);

  // ------------------------------------------------------------------
  // Mixing actions
  // ------------------------------------------------------------------
  const handleAddIngredient = (id: string) => {
    if (selectedIngredients.length >= 6) {
      alert("Cốc nước đã đầy tràn rồi nàng ơi! Hãy xóa đi bớt hoặc khuấy đều để gửi nhe! 🥛");
      return;
    }
    playMeowSound();
    setSelectedIngredients([...selectedIngredients, id]);
  };

  const handleResetCup = () => {
    playMeowSound();
    setSelectedIngredients([]);
    setIsStirred(false);
  };

  const handleStirCup = () => {
    if (selectedIngredients.length === 0) return;
    playMeowSound();
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsStirred(true);
    }, 1200);
  };

  const handleServeCustomer = () => {
    if (selectedIngredients.length === 0) {
      alert("Nàng chưa pha chế gì trong cốc cả á! Hãy thêm nguyên liệu nhé ☕");
      return;
    }
    if (!isStirred) {
      alert("Hãy khuấy/lắc đều đồ uống trước khi gửi cho khách để hòa quyện hương vị ngọt ngào nhen! 🍧");
      return;
    }

    if (!customer) return;

    // Check recipe correctness
    const targetIngredients = [...currentRecipe.ingredients].sort();
    const uniqueUserIngredients = Array.from(new Set(selectedIngredients)).sort();

    // Verify user ingredients cover the exact target list
    const isCorrect = 
      targetIngredients.length === uniqueUserIngredients.length && 
      targetIngredients.every((val, index) => val === uniqueUserIngredients[index]);

    const templates = CUSTOMER_DIALOGUES[customer.id] || DEFAULT_DIALOGUES;

    if (isCorrect) {
      // SUCCESS!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      playMeowSound();

      const successTpl = templates.success[Math.floor(Math.random() * templates.success.length)] || DEFAULT_DIALOGUES.success[0];
      setDialogue(successTpl.replace("{drink}", currentRecipe.name));
      setDialogueState("success");

      // Add cup reward to inventory
      const cupRewardId = currentRecipe.rewardCupId;

      // Add coins
      const bonusCoins = 50;
      setCoins(prevCoins => {
        const newCoins = prevCoins + bonusCoins;
        
        const newInventory = { ...ownedCups };
        newInventory[cupRewardId] = (newInventory[cupRewardId] || 0) + 1;
        setOwnedCups(newInventory);

        // Save to LocalStorage
        saveToLocalStorage(newCoins, newInventory, placedCups);
        
        // Record brew for quest
        try {
          const todayStr = new Date().toDateString();
          const storedBrewDate = localStorage.getItem("quest_brewed_today_date");
          let brewCount = 0;
          if (storedBrewDate === todayStr) {
            brewCount = parseInt(localStorage.getItem("quest_brewed_today_count") || "0");
          }
          brewCount += 1;
          localStorage.setItem("quest_brewed_today_date", todayStr);
          localStorage.setItem("quest_brewed_today_count", brewCount.toString());
        } catch (e) {
          console.error("Lỗi cập nhật quest:", e);
        }

        return newCoins;
      });


      // Trigger Earned Cup visual banner
      const rewardedCup = CUPS_DATABASE.find(c => c.id === cupRewardId);
      if (rewardedCup) {
        setTimeout(() => {
          setEarnedCupPopup(rewardedCup);
        }, 800);
      }
    } else {
      // FAILURE
      playMeowSound();
      const failTpl = templates.fail[Math.floor(Math.random() * templates.fail.length)] || DEFAULT_DIALOGUES.fail[0];
      setDialogue(failTpl.replace("{drink}", currentRecipe.name));
      setDialogueState("fail");
    }
  };

  // ------------------------------------------------------------------
  // Shop operations
  // ------------------------------------------------------------------
  const handleBuyCup = (cup: CupItem) => {
    if (coins < cup.price) {
      alert("Huhu nàng ơi, ví nàng không đủ xu rồi á! Hãy chăm chỉ pha trà nước cho các chàng trai để tích lũy thêm xu nhen! 🪙");
      return;
    }

    playMeowSound();
    
    setCoins(prevCoins => {
      const newCoins = prevCoins - cup.price;
      const newInventory = { ...ownedCups };
      newInventory[cup.id] = (newInventory[cup.id] || 0) + 1;
      
      setOwnedCups(newInventory);
      saveToLocalStorage(newCoins, newInventory, placedCups);
      return newCoins;
    });

    try {
      const todayStr = new Date().toDateString();
    } catch (e) {
    }

    alert(`✨ Chúc mừng nàng đã rước thành công "${cup.name} ${cup.emoji}" về kệ trưng bày rồi nhé!`);
  };

  // ------------------------------------------------------------------
  // Decor Placement operations
  // ------------------------------------------------------------------
  const handlePlaceCup = (cupId: string) => {
    if (!isPlacingCupModal) return;
    const { shelf, slot } = isPlacingCupModal;
    const key = `${shelf}_${slot}`;

    // Decrement from inventory
    if (!ownedCups[cupId] || ownedCups[cupId] <= 0) {
      alert("Nàng không còn cốc này trong kho dự trữ rồi á!");
      return;
    }

    playMeowSound();
    const newInventory = { ...ownedCups };
    newInventory[cupId] -= 1;
    if (newInventory[cupId] === 0) {
      delete newInventory[cupId];
    }

    const newDecor = { ...placedCups };
    // If there was already a cup here, return it to inventory
    const oldCupId = newDecor[key];
    if (oldCupId) {
      newInventory[oldCupId] = (newInventory[oldCupId] || 0) + 1;
    }

    newDecor[key] = cupId;

    setOwnedCups(newInventory);
    setPlacedCups(newDecor);
    saveToLocalStorage(coins, newInventory, newDecor);

    try {
      const todayStr = new Date().toDateString();
    } catch (e) {
    }

    setIsPlacingCupModal(null);
  };

  const handleRemovePlacedCup = (shelf: number, slot: number) => {
    const key = `${shelf}_${slot}`;
    const cupId = placedCups[key];
    if (!cupId) return;

    playMeowSound();
    const newInventory = { ...ownedCups };
    newInventory[cupId] = (newInventory[cupId] || 0) + 1;

    const newDecor = { ...placedCups };
    delete newDecor[key];

    setOwnedCups(newInventory);
    setPlacedCups(newDecor);
    saveToLocalStorage(coins, newInventory, newDecor);
  };

  return (
    <div className={`w-full flex flex-col gap-6 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
      {/* Upper Navigation & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-stone-200/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className={`p-2.5 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? "bg-stone-950/60 hover:bg-stone-900 border border-stone-800" : "bg-stone-100 hover:bg-stone-200"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-serif italic">Tiệm Nước Ngọt Ngào ☕🌸</h2>
            <p className="text-[10px] text-stone-400 font-mono">Pha Chế Trà Chiều & Trang Trí Quán Xinh</p>
          </div>
        </div>

        {/* Currency & Tab buttons */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 border shadow-sm font-mono text-sm font-bold bg-amber-500/10 border-amber-500/20 text-amber-500`}>
            <Coins className="w-4 h-4 animate-bounce" />
            <span>{coins} Xu Cà Phê</span>
          </div>

          <div className={`p-1.5 rounded-xl border flex gap-1 ${
            isDarkMode ? "bg-stone-950/80 border-stone-800" : "bg-stone-100/80 border-[#eadbca]/50"
          }`}>
            <button
              onClick={() => { playMeowSound(); setActiveTab("play"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "play" 
                  ? "bg-amber-500 text-white shadow-xs" 
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              Pha Chế
            </button>
            <button
              onClick={() => { playMeowSound(); setActiveTab("decor"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "decor" 
                  ? "bg-amber-500 text-white shadow-xs" 
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Tiệm Của Tôi
            </button>
            <button
              onClick={() => { playMeowSound(); setActiveTab("shop"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "shop" 
                  ? "bg-amber-500 text-white shadow-xs" 
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Cửa Hàng Cốc
            </button>
            <button
              onClick={() => { playMeowSound(); setActiveTab("quests"); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "quests" 
                  ? "bg-amber-500 text-white shadow-xs" 
                  : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Nhiệm Vụ 🪙
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="w-full">
        {activeTab === "play" && customer && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Column 1: Customer Order (Left) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className={`p-6 border rounded-[2rem] flex flex-col items-center text-center shadow-xs ${
                isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40"
              }`}>
                {/* Character Profile */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500 shadow-md mb-4 relative">
                  {customer.avatar.startsWith("http") ? (
                    <img 
                      src={formatImageUrl(customer.avatar)} 
                      alt={customer.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => handleImageError(e, customer.name)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-4xl">
                      {customer.avatar}
                    </div>
                  )}
                  {dialogueState === "greet" && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                      Order!
                    </div>
                  )}
                </div>

                <h3 className="font-serif italic font-bold text-lg text-stone-800 dark:text-stone-100">
                  {customer.name}
                </h3>
                <span className="text-[10px] uppercase tracking-widest font-mono text-amber-500 font-bold mb-4 block">
                  Khách Ghé Tiệm Xinh
                </span>

                {/* Speech Bubble */}
                <div className={`p-5 rounded-2xl text-xs leading-relaxed font-sans border relative transition-all duration-300 w-full text-left ${
                  dialogueState === "success"
                    ? isDarkMode ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-200" : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                    : dialogueState === "fail"
                    ? isDarkMode ? "bg-rose-950/20 border-rose-900/50 text-rose-200" : "bg-rose-50/50 border-rose-100 text-rose-800"
                    : isDarkMode ? "bg-amber-950/20 border-amber-900/50 text-amber-200" : "bg-amber-50/50 border-amber-100 text-amber-800"
                }`}>
                  <p className="font-medium italic leading-relaxed">
                    "{dialogue}"
                  </p>
                </div>

                {/* Recipe Blueprint Guide card */}
                <div className={`mt-5 p-4 rounded-2xl w-full border text-left ${
                  isDarkMode ? "bg-stone-950/80 border-stone-800" : "bg-stone-50 border-[#eadbca]/30"
                }`}>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mb-2">
                    📖 Gợi ý Công thức pha chế:
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{currentRecipe.emoji}</span>
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-200">{currentRecipe.name}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-relaxed mb-3">
                    {currentRecipe.description}
                  </p>
                  
                  {/* Ingredient checklist */}
                  <div className="flex flex-wrap gap-1.5">
                    {currentRecipe.ingredients.map(ingId => {
                      const ing = INGREDIENTS.find(i => i.id === ingId);
                      const isAdded = selectedIngredients.includes(ingId);
                      return (
                        <div 
                          key={ingId} 
                          className={`px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 border transition-colors ${
                            isAdded 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                              : "bg-stone-500/5 border-stone-500/15 text-stone-400"
                          }`}
                        >
                          {isAdded ? "✓" : "○"} {ing?.emoji} {ing?.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dialogueState !== "greet" && (
                  <button
                    onClick={generateNewCustomer}
                    className="mt-5 w-full py-2.5 rounded-full text-xs font-bold font-mono uppercase bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    Đón Khách Tiếp Theo <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Column 2: Mixer Panel (Right) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className={`p-6 border rounded-[2rem] shadow-xs flex flex-col gap-6 flex-1 ${
                isDarkMode ? "bg-stone-900/40 border-stone-800/80" : "bg-white border-[#eadbca]/40"
              }`}>
                <h3 className="text-sm font-bold font-serif italic border-b border-stone-200/10 pb-2">
                  Quầy Pha Chế Của Nàng 🥛🧪
                </h3>

                {/* Mixing Glass Visual */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                  
                  {/* Left: The Virtual Cup / Glass */}
                  <div className="relative w-44 h-56 flex items-end justify-center">
                    
                    {/* Floating Shaker Animation container */}
                    <motion.div 
                      animate={isShaking ? {
                        rotate: [0, -15, 15, -15, 15, 0],
                        y: [0, -10, 10, -10, 10, 0],
                        x: [0, -5, 5, -5, 5, 0]
                      } : {}}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="w-32 h-48 border-4 border-stone-400/30 dark:border-stone-200/20 rounded-b-3xl relative overflow-hidden bg-stone-500/5 backdrop-blur-xs flex flex-col-reverse shadow-inner"
                    >
                      {/* Fluid Layering */}
                      <AnimatePresence>
                        {selectedIngredients.map((ingId, idx) => {
                          const ing = INGREDIENTS.find(i => i.id === ingId);
                          if (!ing) return null;
                          return (
                            <motion.div
                              key={`${ingId}_${idx}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "16.6%", opacity: 0.9 }}
                              exit={{ height: 0, opacity: 0 }}
                              className={`w-full ${ing.color} flex items-center justify-center text-[10px] font-bold border-t border-stone-400/10 text-white drop-shadow-sm`}
                            >
                              {ing.emoji} {ing.name.split(" ")[0]}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {selectedIngredients.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                          <span className="text-2xl text-stone-400/50 mb-2">🥛</span>
                          <span className="text-[10px] text-stone-400/60 font-mono">Cốc Đang Trống.<br />Thêm nguyên liệu phía dưới!</span>
                        </div>
                      )}

                      {/* Sparkles overlay if stirred */}
                      {isStirred && (
                        <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center animate-pulse pointer-events-none">
                          <Sparkles className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
                        </div>
                      )}
                    </motion.div>

                    {/* Shaker measurement scale marks */}
                    <div className="absolute right-2 top-8 h-32 flex flex-col justify-between text-[7px] font-mono text-stone-500 pointer-events-none">
                      <span>- 600ml (Max)</span>
                      <span>- 400ml</span>
                      <span>- 200ml</span>
                    </div>
                  </div>

                  {/* Right: Mix Station Controls */}
                  <div className="flex flex-col gap-3 w-full max-w-xs justify-center">
                    <div className={`p-3.5 rounded-xl border text-center ${
                      isDarkMode ? "bg-stone-950/80 border-stone-800" : "bg-stone-50 border-[#eadbca]/20"
                    }`}>
                      <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1.5">
                        Trạng Thái Cốc Nước
                      </h4>
                      <div className="text-xs font-bold flex items-center justify-center gap-1">
                        {isStirred ? (
                          <span className="text-emerald-500 flex items-center gap-1">✨ Đã lắc đều hoàn hảo!</span>
                        ) : selectedIngredients.length > 0 ? (
                          <span className="text-amber-500">⏳ Chưa lắc/khuấy đều...</span>
                        ) : (
                          <span className="text-stone-400">Trống rỗng</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleResetCup}
                        disabled={selectedIngredients.length === 0}
                        className={`py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          selectedIngredients.length === 0 
                            ? "border-stone-200/10 text-stone-500 cursor-not-allowed opacity-50" 
                            : isDarkMode 
                            ? "bg-stone-900 border-stone-800 hover:bg-stone-800 text-stone-300" 
                            : "bg-white border-[#eadbca] hover:bg-stone-50 text-stone-700"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa Hết
                      </button>

                      <button
                        onClick={handleStirCup}
                        disabled={selectedIngredients.length === 0 || isShaking}
                        className={`py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                          selectedIngredients.length === 0 || isShaking
                            ? "border-stone-200/10 text-stone-500 cursor-not-allowed opacity-50" 
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs"
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isShaking ? "1s" : "0s" }} />
                        Lắc Đều
                      </button>
                    </div>

                    <button
                      onClick={handleServeCustomer}
                      disabled={selectedIngredients.length === 0 || dialogueState !== "greet"}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        selectedIngredients.length === 0 || dialogueState !== "greet"
                          ? "bg-stone-500/10 border border-stone-500/10 text-stone-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      Gửi Cho {customer.name}
                    </button>
                  </div>
                </div>

                {/* Ingredients Shelf selection */}
                <div className="flex flex-col gap-4 border-t border-stone-200/10 pt-4">
                  
                  {/* Category: Bases */}
                  <div>
                    <h4 className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold mb-2">
                      🫙 1. Chất Nền (Bases)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {INGREDIENTS.filter(i => i.category === "base").map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => handleAddIngredient(ing.id)}
                          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border hover:scale-[1.02] cursor-pointer ${
                            isDarkMode 
                              ? "bg-stone-900 border-stone-800 hover:bg-stone-800/80 text-stone-200" 
                              : "bg-white border-[#eadbca]/40 hover:bg-amber-50/10 text-stone-700 shadow-2xs"
                          }`}
                        >
                          <span className="text-sm">{ing.emoji}</span>
                          <span>{ing.name.replace("Cà phê ", "").replace("Bột ", "")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Liquids */}
                  <div>
                    <h4 className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold mb-2">
                      🥛 2. Sữa / Chất Lỏng (Liquids)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {INGREDIENTS.filter(i => i.category === "liquid").map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => handleAddIngredient(ing.id)}
                          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border hover:scale-[1.02] cursor-pointer ${
                            isDarkMode 
                              ? "bg-stone-900 border-stone-800 hover:bg-stone-800/80 text-stone-200" 
                              : "bg-white border-[#eadbca]/40 hover:bg-amber-50/10 text-stone-700 shadow-2xs"
                          }`}
                        >
                          <span className="text-sm">{ing.emoji}</span>
                          <span className="truncate">{ing.name.replace("Sữa ", "")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Toppings */}
                  <div>
                    <h4 className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-bold mb-2">
                      🍑 3. Đá / Topping / Đường
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {INGREDIENTS.filter(i => i.category === "topping").map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => handleAddIngredient(ing.id)}
                          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all border hover:scale-[1.02] cursor-pointer ${
                            isDarkMode 
                              ? "bg-stone-900 border-stone-800 hover:bg-stone-800/80 text-stone-200" 
                              : "bg-white border-[#eadbca]/40 hover:bg-amber-50/10 text-stone-700 shadow-2xs"
                          }`}
                        >
                          <span className="text-sm">{ing.emoji}</span>
                          <span className="truncate">{ing.name.replace(" Viên", "").replace(" Miếng", "")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* SHOP TAB */}
        {activeTab === "shop" && (
          <div className="flex flex-col gap-6">
            <div className={`p-6 border rounded-[2rem] shadow-xs text-center md:text-left ${
              isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-white border-[#eadbca]/40"
            }`}>
              <h3 className="text-lg font-serif font-bold italic mb-2">Cửa Hàng Cốc Trang Trí Độc Quyền 🏪☕</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Sử dụng Xu tích lũy được sau khi pha nước cho các chàng trai để rước những chiếc cốc gốm, sứ, thủy tinh độc lạ trang hoàng cho quán cà phê riêng của mình nhen!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CUPS_DATABASE.map(cup => {
                const count = ownedCups[cup.id] || 0;
                return (
                  <motion.div
                    key={cup.id}
                    whileHover={{ y: -3 }}
                    className={`p-5 border rounded-[2rem] flex flex-col justify-between shadow-xs relative overflow-hidden ${
                      isDarkMode ? "bg-stone-900/40 border-stone-800/80" : "bg-white border-[#eadbca]/30"
                    }`}
                  >
                    <div>
                      {/* Ribbon / Badge if owned */}
                      {count > 0 && (
                        <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase">
                          Sở hữu: {count}
                        </div>
                      )}

                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-4">
                        {cup.emoji}
                      </div>

                      <h4 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-100 mb-1">
                        {cup.name}
                      </h4>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-relaxed mb-4">
                        {cup.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-200/10 pt-4">
                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-500">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{cup.price} Xu</span>
                      </div>

                      <button
                        onClick={() => handleBuyCup(cup)}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer transition-all shadow-xs ${
                          isDarkMode 
                            ? "bg-stone-800 hover:bg-stone-700 text-amber-500 border border-stone-700" 
                            : "bg-amber-500 text-white hover:bg-amber-600"
                        }`}
                      >
                        Mua Ngay
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* DECOR / SHELF TAB */}
        {activeTab === "decor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Column 1: Shelf Display (Left - 7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`p-6 border rounded-[2rem] shadow-md flex flex-col gap-6 relative overflow-hidden min-h-[500px] ${
                isDarkMode 
                  ? "bg-stone-900 border-stone-800" 
                  : "bg-[linear-gradient(to_bottom,rgba(250,245,235,0.4),rgba(255,255,255,0.9))] border-[#eadbca]/50"
              }`}>
                {/* Visual cafe shop banner */}
                <div className="flex justify-between items-center border-b border-stone-200/10 pb-4">
                  <div>
                    <h3 className="font-serif font-bold italic text-lg text-amber-700 dark:text-amber-500">
                      ☕ Tiệm Trưng Bày Của Tôi
                    </h3>
                    <p className="text-[9px] text-stone-400 font-mono uppercase tracking-wider">
                      Nhấn vào từng ô kệ gỗ để đặt các cốc trang trí đã rước về nhé!
                    </p>
                  </div>
                  <div className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold">
                    ⛲ 12 Ô Kệ Sách Xinh
                  </div>
                </div>

                {/* Cozy Cafe Room Visual with Wooden Shelves */}
                <div className="flex-1 flex flex-col justify-center gap-12 py-8 px-4 bg-stone-950/5 dark:bg-stone-950/20 rounded-2xl border border-stone-200/10 relative">
                  
                  {/* Decorative plant or cozy elements inside room */}
                  <div className="absolute top-2 left-3 text-lg opacity-40">🪴</div>
                  <div className="absolute top-2 right-3 text-lg opacity-40">🐈🐾</div>

                  {/* Shelf 1 */}
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-4 px-2">
                      {[0, 1, 2, 3].map(slot => {
                        const key = `0_${slot}`;
                        const cupId = placedCups[key];
                        const cup = CUPS_DATABASE.find(c => c.id === cupId);
                        return (
                          <div key={slot} className="flex flex-col items-center justify-end h-16 relative group">
                            {cup ? (
                              <button 
                                onClick={() => handleRemovePlacedCup(0, slot)}
                                className="text-3xl hover:scale-115 transition-transform cursor-pointer drop-shadow-md relative group/cup"
                                title={`Nhấp để cất "${cup.name}"`}
                              >
                                {cup.emoji}
                                {/* Tooltip label */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover/cup:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {cup.name} (Cất ↩)
                                </div>
                              </button>
                            ) : (
                              <button 
                                onClick={() => { playMeowSound(); setIsPlacingCupModal({ shelf: 0, slot }); }}
                                className="w-10 h-10 border border-dashed border-stone-400/30 rounded-xl flex items-center justify-center hover:bg-amber-500/10 hover:border-amber-500/40 transition-all cursor-pointer text-stone-400/60"
                              >
                                ＋
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Shelf Wood Plank */}
                    <div className="h-3 w-full bg-amber-900/80 rounded-full shadow-md border-t border-amber-800 mt-1" />
                  </div>

                  {/* Shelf 2 */}
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-4 px-2">
                      {[0, 1, 2, 3].map(slot => {
                        const key = `1_${slot}`;
                        const cupId = placedCups[key];
                        const cup = CUPS_DATABASE.find(c => c.id === cupId);
                        return (
                          <div key={slot} className="flex flex-col items-center justify-end h-16 relative group">
                            {cup ? (
                              <button 
                                onClick={() => handleRemovePlacedCup(1, slot)}
                                className="text-3xl hover:scale-115 transition-transform cursor-pointer drop-shadow-md relative group/cup"
                                title={`Nhấp để cất "${cup.name}"`}
                              >
                                {cup.emoji}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover/cup:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {cup.name} (Cất ↩)
                                </div>
                              </button>
                            ) : (
                              <button 
                                onClick={() => { playMeowSound(); setIsPlacingCupModal({ shelf: 1, slot }); }}
                                className="w-10 h-10 border border-dashed border-stone-400/30 rounded-xl flex items-center justify-center hover:bg-amber-500/10 hover:border-amber-500/40 transition-all cursor-pointer text-stone-400/60"
                              >
                                ＋
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Shelf Wood Plank */}
                    <div className="h-3 w-full bg-amber-900/80 rounded-full shadow-md border-t border-amber-800 mt-1" />
                  </div>

                  {/* Shelf 3 */}
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-4 px-2">
                      {[0, 1, 2, 3].map(slot => {
                        const key = `2_${slot}`;
                        const cupId = placedCups[key];
                        const cup = CUPS_DATABASE.find(c => c.id === cupId);
                        return (
                          <div key={slot} className="flex flex-col items-center justify-end h-16 relative group">
                            {cup ? (
                              <button 
                                onClick={() => handleRemovePlacedCup(2, slot)}
                                className="text-3xl hover:scale-115 transition-transform cursor-pointer drop-shadow-md relative group/cup"
                                title={`Nhấp để cất "${cup.name}"`}
                              >
                                {cup.emoji}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover/cup:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {cup.name} (Cất ↩)
                                </div>
                              </button>
                            ) : (
                              <button 
                                onClick={() => { playMeowSound(); setIsPlacingCupModal({ shelf: 2, slot }); }}
                                className="w-10 h-10 border border-dashed border-stone-400/30 rounded-xl flex items-center justify-center hover:bg-amber-500/10 hover:border-amber-500/40 transition-all cursor-pointer text-stone-400/60"
                              >
                                ＋
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Shelf Wood Plank */}
                    <div className="h-3 w-full bg-amber-900/80 rounded-full shadow-md border-t border-amber-800 mt-1" />
                  </div>

                </div>
              </div>
            </div>

            {/* Column 2: Inventory list on the right (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className={`p-6 border rounded-[2rem] shadow-xs flex flex-col gap-4 h-full ${
                isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-white border-[#eadbca]/40"
              }`}>
                <div className="border-b border-stone-200/10 pb-3">
                  <h4 className="font-serif font-bold italic text-sm text-stone-700 dark:text-stone-200">
                    📦 Kho Lưu Trữ Cốc Của Nàng
                  </h4>
                  <p className="text-[10px] text-stone-400 font-sans">
                    Đây là các logo cốc cà phê nàng đã sở hữu nhưng chưa trưng bày lên kệ.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 flex flex-col gap-3">
                  {(Object.entries(ownedCups) as [string, number][]).length > 0 ? (
                    (Object.entries(ownedCups) as [string, number][]).map(([id, qty]) => {
                      const cup = CUPS_DATABASE.find(c => c.id === id);
                      if (!cup || qty <= 0) return null;
                      return (
                        <div 
                          key={id}
                          className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 ${
                            isDarkMode ? "bg-stone-950/40 border-stone-800" : "bg-stone-50 border-[#eadbca]/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{cup.emoji}</span>
                            <div>
                              <h5 className="text-xs font-bold">{cup.name}</h5>
                              <p className="text-[9px] text-stone-400 truncate max-w-[140px] md:max-w-[200px]">
                                {cup.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                              SL: {qty}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-stone-400/60">
                      <span className="text-4xl mb-2">📦</span>
                      <p className="text-xs">Chưa có cốc rảnh rỗi trong kho.<br />Hãy đi pha chế đồ uống hoặc mua cốc mới nhen!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* QUESTS / EARN COINS TAB */}
        {activeTab === "quests" && (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className={`p-6 border rounded-[2rem] shadow-xs ${
              isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-[#eadbca]/40 shadow-xs"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/25 text-amber-500">
                    <Trophy className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold italic text-lg text-stone-800 dark:text-stone-100">
                      Bảng Nhiệm Vụ Kiếm Xu 🪙✨
                    </h3>
                    <p className="text-[10px] text-stone-400 font-sans leading-relaxed">
                      Đồng hành cùng các nam thần, hoàn thành các hoạt động ngọt ngào để tích lũy xu mua cốc độc quyền!
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid of Quests */}
              <div className="flex flex-col gap-4">
                {(() => {
                  const todayStr = new Date().toDateString();

                  // Context for daily quest checks
                  const hasViewedProfile = localStorage.getItem(`quest_viewed_profile_${todayStr}`) === "true";
                  const brewCount = parseInt(localStorage.getItem("quest_brewed_today_count") || "0");

                  const context = {
                    hasViewedProfile,
                    brewCount,
                  };

                  const handleClaim = (questId: string, amount: number) => {
                    playMeowSound();
                    
                    setCoins(prevCoins => {
                      const newCoins = prevCoins + amount;
                      localStorage.setItem(`quest_${questId}_claimed_${todayStr}`, "true");
                      saveToLocalStorage(newCoins, ownedCups, placedCups);
                      return newCoins;
                    });
                    
                    setQuestUpdateTrigger(prev => prev + 1);
                    
                    // Fire beautiful claim confetti
                    confetti({
                      particleCount: 80,
                      spread: 60,
                      origin: { y: 0.6 },
                      colors: ["#fbbf24", "#f59e0b", "#d97706"] // gold/amber colors
                    });
                  };

                  return QUEST_POOL.map((q) => {
                    const isClaimed = localStorage.getItem(`quest_${q.id}_claimed_${todayStr}`) === "true";
                    
                    const quest = {
                      ...q,
                      isCompleted: q.isCompleted(context),
                      progressText: q.progressText(context),
                      onClaim: () => handleClaim(q.id, q.reward)
                    };

                    return (
                      <div 
                        key={quest.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                          isClaimed 
                            ? (isDarkMode ? "bg-stone-900/30 border-stone-800/50 opacity-60" : "bg-stone-50 border-stone-200/50 opacity-60")
                            : (isDarkMode ? "bg-stone-900/80 border-stone-800 hover:border-amber-500/30" : "bg-white border-[#eadbca]/50 hover:border-amber-500/30")
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold flex items-center gap-2 ${
                            isClaimed ? "text-stone-500 line-through" : "text-stone-800 dark:text-stone-100"
                          }`}>
                            {quest.title}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-500/10 text-stone-500 border border-stone-500/20 no-underline">
                              {quest.difficulty}
                            </span>
                          </h4>
                          <p className={`text-[11px] mt-1 ${isClaimed ? "text-stone-500" : "text-stone-500 dark:text-stone-400"}`}>
                            {quest.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                          <div className="flex flex-col items-center sm:items-end">
                            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mb-1">Phần Thưởng</span>
                            <span className="text-sm font-bold text-amber-500 flex items-center gap-1">
                              +{quest.reward} 🪙
                            </span>
                          </div>

                          <div className="w-[100px] flex justify-end">
                            {isClaimed ? (
                              <span className="px-4 py-2 rounded-full text-[10px] font-bold font-mono text-stone-400 bg-stone-500/10 border border-stone-500/20 uppercase tracking-wider">
                                Đã Nhận
                              </span>
                            ) : quest.isCompleted ? (
                              <button
                                onClick={quest.onClaim}
                                className="px-4 py-2 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
                              >
                                Nhận Xu 🪙
                              </button>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono text-stone-400 uppercase tracking-wider bg-stone-500/5 border border-stone-200/5`}>
                                  Chưa Đạt
                                </span>
                                <span className="text-[9px] text-stone-400 mt-1 font-mono tracking-wider">{quest.progressText}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------------
          POPUP MODAL: Earned Cup Celebration
      ------------------------------------------------------------------ */}
      <AnimatePresence>
        {earnedCupPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full p-8 border rounded-[3rem] text-center shadow-2xl relative ${
                isDarkMode 
                  ? "bg-stone-900 border-stone-800 text-stone-100" 
                  : "bg-white border-[#eadbca] text-stone-800"
              }`}
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setEarnedCupPopup(null)}
                  className="p-1.5 rounded-full hover:bg-stone-500/10 cursor-pointer text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center bg-amber-500/10 rounded-full border border-amber-500/20">
                <span className="text-6xl filter drop-shadow-md animate-bounce">{earnedCupPopup.emoji}</span>
                <div className="absolute -top-2 -right-2 text-yellow-400 animate-pulse text-2xl">✨</div>
                <div className="absolute -bottom-2 -left-2 text-yellow-400 animate-pulse text-2xl">🌟</div>
              </div>

              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500 mb-1 block">
                🎉 Quà Tặng Đặc Biệt Đã Rơi!
              </span>
              <h3 className="font-serif font-bold text-2xl italic mb-3">
                Nhận Thành Công Cốc Đồ Uống!
              </h3>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                "{earnedCupPopup.name}"
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-6 max-w-sm mx-auto">
                {earnedCupPopup.description}
              </p>

              <button
                onClick={() => setEarnedCupPopup(null)}
                className="w-full py-3 rounded-full text-xs font-bold font-mono uppercase bg-amber-500 hover:bg-amber-600 text-white cursor-pointer hover:scale-[1.01] active:scale-95 transition-all shadow-md"
              >
                Tuyệt Vời! Đưa Vào Kho Hàng 📦
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------
          POPUP MODAL: Select Cup to Place on Shelf
      ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isPlacingCupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-lg w-full p-6 border rounded-[2.5rem] shadow-2xl relative ${
                isDarkMode 
                  ? "bg-stone-900 border-stone-800 text-stone-100" 
                  : "bg-white border-[#eadbca] text-stone-800"
              }`}
            >
              <div className="flex justify-between items-center border-b border-stone-200/10 pb-4 mb-4">
                <div>
                  <h3 className="font-serif font-bold text-lg italic text-amber-700 dark:text-amber-500">
                    Trưng Bày Cốc Lên Kệ Gỗ
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">
                    Chọn một chiếc cốc từ kho lưu trữ để đặt vào kệ [Tầng {isPlacingCupModal.shelf + 1}, Ô {isPlacingCupModal.slot + 1}]
                  </p>
                </div>
                <button 
                  onClick={() => setIsPlacingCupModal(null)}
                  className="p-1.5 rounded-full hover:bg-stone-500/10 cursor-pointer text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of owned inventory cups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {(Object.entries(ownedCups) as [string, number][]).filter(([_, qty]) => qty > 0).length > 0 ? (
                  (Object.entries(ownedCups) as [string, number][]).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
                    const cup = CUPS_DATABASE.find(c => c.id === id);
                    if (!cup) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => handlePlaceCup(id)}
                        className={`p-3 border rounded-2xl flex items-center gap-3 text-left hover:scale-[1.01] transition-all cursor-pointer ${
                          isDarkMode 
                            ? "bg-stone-950/40 border-stone-800 hover:bg-stone-850" 
                            : "bg-stone-50 border-[#eadbca]/20 hover:bg-amber-50/10 shadow-2xs"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{cup.emoji}</span>
                        <div className="truncate flex-1">
                          <h4 className="text-xs font-bold truncate">{cup.name}</h4>
                          <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block">
                            Kho Sẵn Có: {qty}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center p-6 text-stone-400/60">
                    <span className="text-3xl mb-2">📦</span>
                    <p className="text-xs">Nàng chưa có chiếc cốc nhàn rỗi nào trong kho cả á!<br />Hãy rước thêm ở cửa hàng hoặc chăm pha đồ uống nhen 💕</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsPlacingCupModal(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono cursor-pointer border ${
                    isDarkMode 
                      ? "bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-900" 
                      : "bg-white border-[#eadbca] text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  Đóng Lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
