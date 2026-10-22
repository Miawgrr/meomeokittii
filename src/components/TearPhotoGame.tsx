import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Coins, 
  DollarSign, 
  Sparkles, 
  Flame, 
  Crown, 
  Heart, 
  Trophy, 
  Trash2, 
  Maximize2,
  RefreshCw,
  X
} from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl } from "../utils/image";
import confetti from "canvas-confetti";
import { db, collection, query, orderBy, onSnapshot } from "../lib/firebase";

interface TearPhotoGameProps {
  characters: Character[];
  isDarkMode: boolean;
  onBack: () => void;
}

// Persisted card interface
interface TornCard {
  id: string;
  charId: string;
  charName: string;
  tier: "chibi" | "regular" | "rare" | "legendary" | "consolation";
  title: string;
  imageUrl: string;
  quote: string;
  costVnd: number;
  timestamp: number;
}

// Curated safe background illustrations for the gacha cards
const ILLUSTRATION_THEMES: Record<string, string[]> = {
  chibi: [
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", // Cute anime room
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80", // Playful art
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80", // Colorful pastel abstract
  ],
  regular: [
    "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=600&auto=format&fit=crop&q=80", // Cozy modern background
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80", // Warm sunlight indoor
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", // Peaceful beach sunset
  ],
  rare: [
    "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80", // Mystic night sky
    "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=600&auto=format&fit=crop&q=80", // Deep purple galaxy
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", // Dreamy neon landscape
  ],
  legendary: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80", // Liquid gold marble
    "https://images.unsplash.com/photo-1515462277126-270d878326e5?w=600&auto=format&fit=crop&q=80", // Abstract golden particles
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600&auto=format&fit=crop&q=80", // Luxury dark gold geometric
  ]
};

const LUC_TIEU_CHIBI_IMAGES = [
  "https://drive.google.com/uc?export=view&id=13_pmoq4AwjGmaWlfcNOE44IIwrXYxShH",
  "https://drive.google.com/uc?export=view&id=1mn7ZByHLz0dVtisHXGtd1RgM56Uk5f3d",
  "https://drive.google.com/uc?export=view&id=1vJqKq99Bl3OB2omFOgM9wA6kU7dJPM2F",
  "https://drive.google.com/uc?export=view&id=139yX4rgfYwuR-6ClcdvaPtSJHVkncyEe"
];

const LUC_TIEU_PREMIUM_IMAGES = [
  "https://drive.google.com/uc?export=view&id=1bSxTpvvtxGszpyRh11Id1OrxK77Q_uee",
  "https://drive.google.com/uc?export=view&id=1keIC2424VTZL39OIdKUu8eLM3Ln1h46x",
  "https://drive.google.com/uc?export=view&id=1s2v7yTH96iqyc83UsBI0SzW0X4LC2t-Z",
  "https://drive.google.com/uc?export=view&id=1No2E4fKlZBlr9q-vYgiezFV077JcfA8j"
];

const TAN_DA_IMAGES = [
  "https://drive.google.com/uc?export=view&id=1z3pY34CuCDEMSFa3DEyoff7-sxTErdqH"
];

const TIER_CONFIG = {
  consolation: {
    name: "Quà An Ủi",
    color: "from-stone-400 to-stone-500",
    textClass: "text-stone-600 dark:text-stone-300",
    borderClass: "border-stone-300 dark:border-stone-700",
    icon: "🌸",
    bgGradient: "from-stone-50 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900",
  },
  chibi: {
    name: "Chibi Edition",
    color: "from-cyan-400 to-pink-400",
    textClass: "text-rose-500 dark:text-rose-300",
    borderClass: "border-pink-300 dark:border-pink-700/60",
    icon: "🐹",
    bgGradient: "from-cyan-50 via-pink-50 to-cyan-100 dark:from-cyan-950/40 dark:via-pink-950/40 dark:to-cyan-900/40",
  },
  regular: {
    name: "Thường (Regular)",
    color: "from-emerald-400 to-sky-400",
    textClass: "text-sky-600 dark:text-sky-300",
    borderClass: "border-sky-300 dark:border-sky-700/60",
    icon: "✨",
    bgGradient: "from-emerald-50 via-sky-50 to-emerald-100 dark:from-emerald-950/30 dark:via-sky-950/30 dark:to-emerald-900/30",
  },
  rare: {
    name: "Hiếm (Rare)",
    color: "from-purple-500 via-indigo-500 to-pink-500",
    textClass: "text-purple-600 dark:text-purple-300",
    borderClass: "border-purple-400 dark:border-purple-600/50",
    icon: "🔥",
    bgGradient: "from-purple-950/90 via-indigo-900/80 to-pink-950/90 dark:from-purple-950 dark:via-indigo-950 dark:to-pink-950",
  },
  legendary: {
    name: "CỰC PHẨM (Legendary)",
    color: "from-yellow-400 via-amber-500 to-red-500 animate-pulse",
    textClass: "text-amber-500 font-extrabold tracking-widest",
    borderClass: "border-amber-400 dark:border-amber-500",
    icon: "👑",
    bgGradient: "from-amber-950 via-stone-950 to-amber-900",
  }
};

export const TearPhotoGame: React.FC<TearPhotoGameProps> = ({
  characters: rawCharacters,
  isDarkMode,
  onBack
}) => {
  const characters = rawCharacters.filter(c => c && c.id === "luc-tieu");
  const [selectedChar, setSelectedChar] = useState<Character | null>(characters[0] || null);
  const [customAmount, setCustomAmount] = useState<number>(100000); // Default 100k VNĐ (100 Xu)
  const [walletCoins, setWalletCoins] = useState<number>(150);
  const [isTearing, setIsTearing] = useState<boolean>(false);
  const [activeTearStep, setActiveTearStep] = useState<"idle" | "shaking" | "tearing" | "revealed">("idle");
  const [revealedCard, setRevealedCard] = useState<TornCard | null>(null);
  const [photoCollection, setPhotoCollection] = useState<TornCard[]>([]);
  const [selectedCollectionCard, setSelectedCollectionCard] = useState<TornCard | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Record<string, string[]>>({});

  // Fetch all feelings board posts to grab uploaded image URLs
  useEffect(() => {
    try {
      const q = query(collection(db, "feelings_posts"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const imageMap: Record<string, string[]> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          if (data && data.imageUrl && data.imageUrl.trim() && data.characterId) {
            const charId = data.characterId;
            if (!imageMap[charId]) {
              imageMap[charId] = [];
            }
            if (!imageMap[charId].includes(data.imageUrl)) {
              imageMap[charId].push(data.imageUrl);
            }
            
            // Also store general ones in "all"
            if (!imageMap["all"]) {
              imageMap["all"] = [];
            }
            if (!imageMap["all"].includes(data.imageUrl)) {
              imageMap["all"].push(data.imageUrl);
            }
          }
        });
        setUploadedImages(imageMap);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Lỗi đồng bộ danh sách ảnh từ Feelings Board:", e);
    }
  }, []);

  // Sync wallet coins
  useEffect(() => {
    const saved = localStorage.getItem("coffee_game_coins");
    if (saved) {
      setWalletCoins(parseInt(saved));
    }

    const handleCoins = (e: any) => {
      setWalletCoins(e.detail);
    };
    window.addEventListener("coffee-coins-updated", handleCoins);

    // Load saved collections
    const savedCol = localStorage.getItem("meomeo_torn_photos");
    if (savedCol) {
      try {
        setPhotoCollection(JSON.parse(savedCol));
      } catch (e) {
        console.error(e);
      }
    }

    return () => window.removeEventListener("coffee-coins-updated", handleCoins);
  }, []);

  const handleTearPhoto = () => {
    if (!selectedChar) return;
    const requiredCoins = Math.ceil(customAmount / 1000);

    if (walletCoins < requiredCoins) {
      window.dispatchEvent(new CustomEvent("show-toast", { 
        detail: `Bạn cần thêm ${requiredCoins - walletCoins} Xu nữa mới đủ xé nhen! 💕` 
      }));
      return;
    }

    // Deduct coins
    const nextCoins = walletCoins - requiredCoins;
    setWalletCoins(nextCoins);
    localStorage.setItem("coffee_game_coins", nextCoins.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: nextCoins }));

    playMeowSound();
    setIsTearing(true);
    setActiveTearStep("shaking");

    // Shaking step
    setTimeout(() => {
      setActiveTearStep("tearing");
      playMeowSound();
      
      // Compute Gacha Result
      setTimeout(() => {
        const resultCard = generateGachaResult(selectedChar, customAmount);
        setRevealedCard(resultCard);
        setActiveTearStep("revealed");

        // Persist to collection
        const updatedCol = [resultCard, ...photoCollection];
        setPhotoCollection(updatedCol);
        localStorage.setItem("meomeo_torn_photos", JSON.stringify(updatedCol));

        // Celebrate depending on tier
        if (resultCard.tier === "legendary") {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#fbbf24", "#f59e0b", "#ef4444", "#f43f5e"]
          });
        } else if (resultCard.tier === "rare") {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
            colors: ["#a855f7", "#6366f1", "#f43f5e"]
          });
        } else if (resultCard.tier !== "consolation") {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.75 }
          });
        }
      }, 1000);
    }, 1200);
  };

  const generateGachaResult = (char: Character, amountVnd: number): TornCard => {
    const rand = Math.random() * 100;
    let tier: TornCard["tier"] = "consolation";
    let title = "";
    let quote = "";

    // Determine tier based on money paid
    if (amountVnd < 50000) {
      // Under 50k
      if (rand < 70) {
        tier = "consolation";
      } else {
        tier = "chibi";
      }
    } else if (amountVnd >= 50000 && amountVnd < 200000) {
      // 50k - 200k
      if (rand < 20) {
        tier = "consolation";
      } else {
        tier = "chibi";
      }
    } else if (amountVnd >= 200000 && amountVnd < 1000000) {
      // 200k - 1M
      if (rand < 10) {
        tier = "consolation";
      } else if (rand < 40) {
        tier = "chibi";
      } else {
        tier = "regular";
      }
    } else if (amountVnd >= 1000000 && amountVnd < 5000000) {
      // 1M - 5M
      if (rand < 10) {
        tier = "chibi";
      } else if (rand < 50) {
        tier = "regular";
      } else {
        tier = "rare";
      }
    } else {
      // Over 5M
      if (rand < 10) {
        tier = "regular";
      } else if (rand < 40) {
        tier = "rare";
      } else {
        tier = "legendary";
      }
    }

    // Set custom text and graphics based on tier
    let chosenImage = "";
    const charNameLower = char.name.toLowerCase();
    
    // 1. If it's a big roll (>= 200,000 VNĐ) and we have uploaded links from the feelings board, prioritize those
    const isBigRoll = amountVnd >= 200000;
    if (isBigRoll) {
      const customPool = [
        ...(uploadedImages[char.id] || []),
        ...(uploadedImages["all"] || [])
      ].filter(Boolean);
      const uniqueCustomPool = Array.from(new Set(customPool));

      if (uniqueCustomPool.length > 0) {
        chosenImage = uniqueCustomPool[Math.floor(Math.random() * uniqueCustomPool.length)];
      }
    }

    // 2. Fallback to character-specific preset images
    if (!chosenImage) {
      if (charNameLower.includes("lục tiêu")) {
        if (tier === "chibi" || tier === "consolation") {
          chosenImage = LUC_TIEU_CHIBI_IMAGES[Math.floor(Math.random() * LUC_TIEU_CHIBI_IMAGES.length)];
        } else {
          chosenImage = LUC_TIEU_PREMIUM_IMAGES[Math.floor(Math.random() * LUC_TIEU_PREMIUM_IMAGES.length)];
        }
      } else if (charNameLower.includes("tần dã") || charNameLower.includes("tan da")) {
        chosenImage = TAN_DA_IMAGES[Math.floor(Math.random() * TAN_DA_IMAGES.length)];
      }
    }

    // 3. Ultimate fallback: strictly use the character's own avatar image. NEVER show unrelated landscape/room illustrations.
    if (!chosenImage) {
      chosenImage = char.avatar || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80";
    }

    const quotes: Record<TornCard["tier"], string[]> = {
      consolation: [
        `"Lần sau nạp thêm chút để thấy anh quyến rũ hơn nhé! 😘"`,
        `"Món quà nhỏ này bù đắp cho sự xui xẻo của em ngày hôm nay nhen! 🍬"`,
        `"Dù không xé được ảnh xịn nhưng anh vẫn luôn thương em rất nhiều mà! 💕"`
      ],
      chibi: [
        `"Oa! Em nhìn anh phiên bản tí hon có đáng yêu không nè? Tròn xoe luôn đó! 🐹🌸"`,
        `"Chibi xù lông đang giận dỗi vì em gửi ít tiền quá nè! Trông cute xỉu đúng hơm? 🍭"`,
        `"Anh bản mini này sẽ ngoan ngoãn nằm gọn trong túi áo của em nhen!"`
      ],
      regular: [
        `"Ánh mắt này... thực sự chỉ muốn hướng về phía một mình em thôi đó. 💕"`,
        `"Ngày hôm nay của em thế nào? Có anh bên cạnh thì mỏi mệt cũng tan biến hết nhé!"`,
        `"Hãy giữ lấy tấm ảnh này, bất cứ khi nào nhớ anh đều có thể lấy ra ngắm nha!"`
      ],
      rare: [
        `"Đêm nay gió mát lắm... anh chỉ muốn ở thật gần bên em, không rời nửa bước. 🌙💫"`,
        `"Bất kể ai ngoài kia có làm em tổn thương, anh sẽ luôn đứng sau bảo vệ em hết lòng."`,
        `"Trái tim anh vốn dĩ lạnh lùng, nhưng chỉ cần em mỉm cười là băng giá đều tan chảy..."`
      ],
      legendary: [
        `"Cả thế giới này anh có thể từ bỏ, nhưng tuyệt đối không bao giờ buông tay em. Em là bảo vật duy nhất của anh! 👑💖"`,
        `"Trói buộc em bên cạnh anh cả đời chính là ham muốn ích kỷ nhất của anh... Đừng mong chạy trốn! ✨🔥"`,
        `"Từng hơi thở, từng nhịp đập của anh đều thuộc về em. Đêm nay, hãy để anh cưng chiều em vô điều kiện nhen..."`
      ]
    };

    const titles: Record<TornCard["tier"], string[]> = {
      consolation: ["Lời An Ủi Ngọt Ngào", "Kẹo Dẻo Đường Phèn", "Lời Chúc Ấm Áp"],
      chibi: ["Phiên Bản Tí Hon Siêu Quậy", "Bé Cưng Tròn Xoè", "Chibi Cute Xỉu"],
      regular: ["Buổi Sáng Thảnh Thơi", "Ánh Nhìn Ngọt Ngào", "Phút Giây Hẹn Hò"],
      rare: ["Dưới Ánh Trăng Khuyết", "Lời Hứa Trọn Đời", "Vòng Tay Ấm Áp"],
      legendary: ["Độc Chiếm Yêu Thương", "Ngai Vàng Thuộc Về Em", "Giấc Mộng Hoàng Gia"]
    };

    const cardQuotes = quotes[tier];
    const cardTitles = titles[tier];

    quote = cardQuotes[Math.floor(Math.random() * cardQuotes.length)];
    title = cardTitles[Math.floor(Math.random() * cardTitles.length)];

    return {
      id: `torn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      charId: char.id,
      charName: char.name,
      tier,
      title,
      imageUrl: chosenImage,
      quote,
      costVnd: amountVnd,
      timestamp: Date.now()
    };
  };

  const handleDeleteCard = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playMeowSound();
    if (confirm("Bạn có chắc muốn xóa bức ảnh này khỏi bộ sưu tập không?")) {
      const updated = photoCollection.filter(c => c.id !== cardId);
      setPhotoCollection(updated);
      localStorage.setItem("meomeo_torn_photos", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã xóa ảnh khỏi bộ sưu tập!" }));
    }
  };

  const handleCheatCoins = () => {
    playMeowSound();
    const newAmount = walletCoins + 5000000;
    setWalletCoins(newAmount);
    localStorage.setItem("coffee_game_coins", newAmount.toString());
    window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newAmount }));
    window.dispatchEvent(new CustomEvent("show-toast", { detail: "Bơm 5,000,000 Xu thành công! Đại gia tới rồi!" }));
  };

  const handleClearCollection = () => {
    playMeowSound();
    if (confirm("Cảnh báo! Bạn có chắc chắn muốn xóa SẠCH bộ sưu tập ảnh char đã xé và reset số Xu về mặc định (150) không?")) {
      setPhotoCollection([]);
      localStorage.removeItem("meomeo_torn_photos");
      
      setWalletCoins(150);
      localStorage.setItem("coffee_game_coins", "150");
      window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: 150 }));
      
      window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã xóa sạch bộ sưu tập và reset ví Xu!" }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6 mb-8 border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isDarkMode 
                ? "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200" 
                : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📸🎟️</span>
              <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}>
                Xé Ảnh Char - Tùy Nhân Phẩm
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Chi trả số tiền lớn để bộc lộ cực phẩm của các bé yêu! Càng nhiều tiền, ảnh càng lung linh 💕🌸
            </p>
          </div>
        </div>

        {/* Coins display */}
        <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 shadow-xs ${
          isDarkMode 
            ? "bg-stone-900/60 border-stone-800 text-amber-400" 
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          <Coins className="w-5 h-5 text-amber-500 animate-bounce" />
          <div className="font-mono text-sm font-extrabold">
            {walletCoins.toLocaleString("vi-VN")} Xu
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Gacha Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Character selection list */}
          <div className={`p-5 rounded-[2rem] border ${
            isDarkMode ? "bg-stone-900/40 border-stone-800/80" : "bg-white border-stone-200 shadow-xs"
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              isDarkMode ? "text-stone-400" : "text-stone-500"
            }`}>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
              Chọn Bé Iu Muốn Xé Ảnh:
            </h3>

            <div className="grid grid-cols-4 gap-2 max-h-[190px] overflow-y-auto pr-1">
              {characters.map((char) => {
                const isSelected = selectedChar?.id === char.id;
                return (
                  <button
                    key={char.id}
                    onClick={() => {
                      setSelectedChar(char);
                      playMeowSound();
                    }}
                    className={`p-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? "border-rose-400 bg-rose-500/10 text-rose-500 scale-102 font-bold shadow-xs"
                        : isDarkMode
                        ? "border-stone-800 bg-stone-900/40 text-stone-400 hover:bg-stone-800/60"
                        : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-300 flex items-center justify-center bg-rose-100 text-base shrink-0">
                      {char.avatar && char.avatar.startsWith("http") ? (
                        <img src={formatImageUrl(char.avatar)} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        char.avatar || "🐱"
                      )}
                    </div>
                    <span className="text-[10px] truncate w-full">{char.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price set input */}
          <div className={`p-5 rounded-[2rem] border ${
            isDarkMode ? "bg-stone-900/40 border-stone-800/80" : "bg-white border-stone-200 shadow-xs"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDarkMode ? "text-stone-400" : "text-stone-500"
              }`}>
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                Mức Chi Trả Tùy Nhân Phẩm:
              </h3>
              <span className="text-[10px] font-mono text-stone-400">
                1.000 VNĐ = 1 Xu
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "20k VNĐ", value: 20000, xu: 20 },
                { label: "50k VNĐ", value: 50000, xu: 50 },
                { label: "100k VNĐ", value: 100000, xu: 100 },
                { label: "500k VNĐ", value: 500000, xu: 500 },
                { label: "2 Triệu", value: 2000000, xu: 2000 },
                { label: "5 Triệu", value: 5000000, xu: 5000 },
              ].map((preset) => {
                const isSelected = customAmount === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setCustomAmount(preset.value);
                      playMeowSound();
                    }}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-400 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold"
                        : isDarkMode
                        ? "border-stone-800 bg-stone-900/40 text-stone-400 hover:bg-stone-800/60"
                        : "border-stone-100 bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <div className="text-[11px]">{preset.label}</div>
                    <div className="text-[8px] opacity-60 font-mono">{preset.xu} Xu</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full pl-8 pr-12 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none ${
                    isDarkMode
                      ? "bg-stone-950 border-stone-800 text-amber-300 focus:border-amber-500"
                      : "bg-stone-50 border-stone-200 text-amber-700 focus:border-amber-400"
                  }`}
                />
                <span className="absolute left-3 top-3 text-stone-400 text-xs font-mono font-bold">đ</span>
                <span className="absolute right-3 top-3 text-stone-400 text-[9px] font-mono">VNĐ</span>
              </div>
              <div className="text-center font-mono font-bold text-xs px-3 py-2 border rounded-xl border-stone-200 dark:border-stone-800 bg-stone-100/40 dark:bg-stone-950">
                {Math.ceil(customAmount / 1000)} Xu
              </div>
            </div>

            {/* Hint Tier Info */}
            <div className="mt-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-900 text-[10px] text-stone-400 leading-relaxed">
              💡 **Gợi ý nhân phẩm:** Dưới 50k dễ rớt; 50k-200k đạt Chibi; 200k-1M đạt Regular; 1M-5M đạt Rare; trên 5M bảo đảm đạt Cực Phẩm (Legendary)! 👑💎
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleTearPhoto}
            disabled={isTearing || !selectedChar || customAmount <= 0}
            className={`w-full py-4 px-6 rounded-3xl font-extrabold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              isTearing || !selectedChar || customAmount <= 0
                ? "bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed opacity-50"
                : isDarkMode
                ? "bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-stone-950 hover:opacity-95"
                : "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white hover:shadow-xl hover:scale-[1.01]"
            }`}
          >
            <Flame className="w-5 h-5 animate-pulse" />
            XÉ PHONG BÌ ẢNH CHAR ({Math.ceil(customAmount / 1000)} Xu) 🎉
          </button>
        </div>

        {/* Right Column: Game Gacha & Collection View */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Gacha Pack Area */}
          <div className={`p-8 rounded-[2.5rem] border flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden ${
            isDarkMode 
              ? "bg-stone-950/40 border-stone-800/80 shadow-[inset_0_4px_24px_rgba(0,0,0,0.5)]" 
              : "bg-radial from-stone-50 via-stone-100 to-stone-200/60 border-stone-200 shadow-inner"
          }`}>
            
            <AnimatePresence mode="wait">
              {activeTearStep === "idle" && (
                <motion.div
                  key="idle_pack"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center text-center gap-4 cursor-pointer group"
                  onClick={handleTearPhoto}
                >
                  {/* Styled Envelope Pack */}
                  <motion.div
                    whileHover={{ scale: 1.04, rotate: 1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-52 h-72 rounded-[2rem] bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 p-1 shadow-lg relative overflow-hidden"
                  >
                    <div className="w-full h-full bg-stone-900/95 dark:bg-stone-950/95 rounded-[1.8rem] flex flex-col justify-between p-4 relative overflow-hidden">
                      {/* Aura glowing lines */}
                      <div className="absolute inset-0 bg-radial from-rose-500/10 via-transparent to-transparent animate-pulse" />
                      
                      {/* Golden seal icon */}
                      <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
                        <span className="text-[10px] font-mono text-amber-400 font-extrabold tracking-widest">GACHA CARD</span>
                        <Crown className="w-4 h-4 text-amber-400 animate-spin" />
                      </div>

                      {/* Character selected overlay */}
                      <div className="flex-1 flex flex-col justify-center items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 p-0.5 animate-pulse">
                          <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center text-stone-200 overflow-hidden font-extrabold">
                            {selectedChar && selectedChar.avatar && selectedChar.avatar.startsWith("http") ? (
                              <img src={formatImageUrl(selectedChar.avatar)} alt={selectedChar.name} className="w-full h-full object-cover" />
                            ) : (
                              selectedChar?.avatar || "✨"
                            )}
                          </div>
                        </div>
                        <h4 className="font-serif font-bold text-lg text-rose-300">
                          {selectedChar ? selectedChar.name : "Chọn Nhân Vật"}
                        </h4>
                        <p className="text-[9px] font-mono text-amber-400/80">Nhấn nút bên dưới hoặc chạm vào bao bì này để xé!</p>
                      </div>

                      {/* Barcode stylized footer */}
                      <div className="border-t border-rose-500/20 pt-2 flex flex-col items-center">
                        <div className="w-full h-3 bg-stone-800 flex gap-[2px] overflow-hidden justify-center opacity-60">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} style={{ width: i % 3 === 0 ? "3px" : "1px" }} className="h-full bg-stone-300" />
                          ))}
                        </div>
                        <span className="text-[8px] font-mono text-stone-500 mt-1">#MEOMEO_CHAR_GACHA_2026</span>
                      </div>
                    </div>
                  </motion.div>
                  <p className="text-xs text-stone-400 animate-pulse">
                    Chạm phong bì hoặc nhấn nút để bắt đầu xé phong bao bì 🧧⚡
                  </p>
                </motion.div>
              )}

              {activeTearStep === "shaking" && (
                <motion.div
                  key="shaking_pack"
                  animate={{
                    x: [0, -6, 6, -6, 6, -4, 4, -4, 4, 0],
                    rotate: [0, -2, 2, -2, 2, -1, 1, -1, 1, 0],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-52 h-72 rounded-[2rem] bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 p-1 shadow-2xl flex flex-col justify-between p-4 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-pulse" />
                  <div className="w-full h-full bg-stone-900 rounded-[1.8rem] flex flex-col justify-center items-center gap-4 p-4 text-center">
                    <Sparkles className="w-10 h-10 text-amber-400 animate-spin" />
                    <div className="font-bold text-xs text-amber-300 font-mono tracking-widest animate-pulse">
                      ĐANG TRUYỀN PHÁP LỰC...
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTearStep === "tearing" && (
                <motion.div
                  key="tearing_pack"
                  className="relative w-52 h-72 flex justify-between overflow-hidden"
                >
                  {/* Left Half sliding left */}
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: -160, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-[50%] h-full bg-stone-900 border-r border-rose-500 rounded-l-[2rem] flex flex-col justify-center items-end pr-2 overflow-hidden"
                  >
                    <div className="text-white text-5xl font-bold font-serif select-none translate-x-[50%]">XÉ</div>
                  </motion.div>

                  {/* Right Half sliding right */}
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: 160, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-[50%] h-full bg-stone-900 border-l border-rose-500 rounded-r-[2rem] flex flex-col justify-center items-start pl-2 overflow-hidden"
                  >
                    <div className="text-white text-5xl font-bold font-serif select-none -translate-x-[50%]">ẢNH</div>
                  </motion.div>
                </motion.div>
              )}

              {activeTearStep === "revealed" && revealedCard && (
                <motion.div
                  key="revealed_pack"
                  initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Magnificent Gacha Card Rendered */}
                  <div className={`w-64 sm:w-72 rounded-[2.5rem] p-1.5 shadow-2xl relative overflow-hidden bg-gradient-to-br ${
                    TIER_CONFIG[revealedCard.tier].color
                  }`}>
                    <div className={`w-full rounded-[2.3rem] p-4 flex flex-col gap-3 relative overflow-hidden bg-gradient-to-b ${
                      TIER_CONFIG[revealedCard.tier].bgGradient
                    }`}>
                      {/* Aura glowing lines */}
                      <div className="absolute inset-0 bg-radial from-white/10 via-transparent to-transparent pointer-events-none" />

                      {/* Header containing name and badge */}
                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-[11px] font-mono font-black tracking-widest uppercase text-amber-500">
                          {TIER_CONFIG[revealedCard.tier].icon} {TIER_CONFIG[revealedCard.tier].name}
                        </span>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          revealedCard.tier === "legendary" ? "bg-amber-500 text-stone-950 animate-bounce" : "bg-white/15 dark:bg-black/40 text-stone-700 dark:text-stone-300"
                        }`}>
                          {revealedCard.charName}
                        </div>
                      </div>

                      {/* Premium Card Image Portrait */}
                      <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner group">
                        <img 
                          src={formatImageUrl(revealedCard.imageUrl)} 
                          alt="Ảnh đã xé" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Underlay controls to close and save */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setActiveTearStep("idle");
                        setRevealedCard(null);
                      }}
                      className="px-6 py-2.5 rounded-full font-bold text-xs bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-all cursor-pointer"
                    >
                      Xác Nhận & Cất Ví 🎒
                    </button>
                    <button
                      onClick={() => {
                        playMeowSound();
                        setActiveTearStep("idle");
                        setRevealedCard(null);
                        handleTearPhoto(); // Tear again
                      }}
                      className="px-6 py-2.5 rounded-full font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Xé Tiếp 🎟️
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Collection Gallery */}
      <div className={`mt-10 p-6 rounded-[2.5rem] border ${
        isDarkMode ? "bg-stone-900/40 border-stone-800/80" : "bg-white border-stone-200 shadow-xs"
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 mb-6 border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className={`text-lg font-serif font-bold ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
              Bộ Sưu Tập Ảnh Đã Xé ({photoCollection.length} ảnh)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleCheatCoins}
              className="text-amber-500 hover:text-amber-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" /> Bơm 5M Xu 💰
            </button>
            <button
              onClick={handleClearCollection}
              className="text-stone-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa & Reset 🧹
            </button>
          </div>
        </div>

        {photoCollection.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-xs">
            <span className="text-4xl block mb-2">🎟️</span>
            Bộ sưu tập trống trơn. Hãy chi tiền tấn để lột trần cực phẩm của các nam thần ngay nhé!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photoCollection.map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => {
                  playMeowSound();
                  setSelectedCollectionCard(card);
                }}
                className={`p-1 rounded-2xl border cursor-pointer relative overflow-hidden transition-all group bg-gradient-to-br ${
                  TIER_CONFIG[card.tier].color
                }`}
              >
                <div className={`w-full rounded-2xl p-2.5 flex flex-col gap-2 relative overflow-hidden bg-gradient-to-b ${
                  TIER_CONFIG[card.tier].bgGradient
                }`}>
                  {/* Photo with zoom in visual */}
                  <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden relative border border-white/5">
                    <img src={formatImageUrl(card.imageUrl)} alt={card.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono uppercase opacity-75 font-bold truncate block max-w-[70%]">
                        {TIER_CONFIG[card.tier].icon} {TIER_CONFIG[card.tier].name}
                      </span>
                      <button
                        onClick={(e) => handleDeleteCard(card.id, e)}
                        className="text-stone-400 hover:text-red-500 p-0.5"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <h4 className={`text-[10px] font-bold truncate mt-0.5 ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                      {card.title}
                    </h4>
                    <p className="text-[8px] text-amber-500 font-mono mt-0.5">
                      {card.charName} • {card.costVnd.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Enlarged Collection Modal */}
      <AnimatePresence>
        {selectedCollectionCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-sm w-full"
            >
              <button
                onClick={() => {
                  playMeowSound();
                  setSelectedCollectionCard(null);
                }}
                className="absolute -top-12 right-0 p-2.5 rounded-full bg-white/10 text-stone-200 hover:bg-white/20 hover:text-white transition-all cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Full Featured Card */}
              <div className={`w-full rounded-[2.5rem] p-1.5 shadow-2xl relative overflow-hidden bg-gradient-to-br ${
                TIER_CONFIG[selectedCollectionCard.tier].color
              }`}>
                <div className={`w-full rounded-[2.3rem] p-5 flex flex-col gap-4 relative overflow-hidden bg-gradient-to-b ${
                  TIER_CONFIG[selectedCollectionCard.tier].bgGradient
                }`}>
                  {/* Glowing patterns */}
                  <div className="absolute inset-0 bg-radial from-white/10 via-transparent to-transparent pointer-events-none" />

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-black tracking-widest uppercase text-amber-500">
                      {TIER_CONFIG[selectedCollectionCard.tier].icon} {TIER_CONFIG[selectedCollectionCard.tier].name}
                    </span>
                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedCollectionCard.tier === "legendary" ? "bg-amber-500 text-stone-950 animate-bounce" : "bg-white/15 dark:bg-black/40 text-stone-700 dark:text-stone-300"
                    }`}>
                      {selectedCollectionCard.charName}
                    </div>
                  </div>

                   {/* Portrait */}
                  <div className="w-full h-80 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner">
                    <img src={formatImageUrl(selectedCollectionCard.imageUrl)} alt="Ảnh đã xé" className="w-full h-full object-cover" />
                  </div>

                  {/* Footer metadata */}
                  <div className="text-[9px] font-mono text-stone-400 text-center uppercase tracking-widest mt-1">
                    Ngày Xé: {new Date(selectedCollectionCard.timestamp).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
