import React, { useState, useEffect } from "react";
import { ArrowLeft, Heart, Bath, Utensils, Moon, Zap, Gamepad2, Star, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playMeowSound } from "../utils/audio";
import confetti from "canvas-confetti";
import { useGlobalCoins } from "../hooks/useGlobalCoins";

interface PetGameProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const PET_TYPES = [
  { id: "dog1", name: "Cún Ngốc", emoji: "🐶", color: "amber", type: "dog", rarity: "common", rarityLabel: "Phổ biến" },
  { id: "cat1", name: "Mèo Lười", emoji: "🐱", color: "rose", type: "cat", rarity: "common", rarityLabel: "Phổ biến" },
  { id: "bunny1", name: "Thỏ Bông", emoji: "🐰", color: "pink", type: "bunny", rarity: "common", rarityLabel: "Phổ biến" },
  { id: "hamster1", name: "Chuột Ú", emoji: "🐹", color: "orange", type: "exotic", rarity: "rare", rarityLabel: "Hiếm" },
  { id: "penguin1", name: "Cánh Cụt", emoji: "🐧", color: "sky", type: "exotic", rarity: "epic", rarityLabel: "Cực Hiếm" },
  { id: "fox1", name: "Cáo Nhỏ", emoji: "🦊", color: "orange", type: "exotic", rarity: "rare", rarityLabel: "Hiếm" },
  { id: "dragon1", name: "Rồng Lửa", emoji: "🐉", color: "red", type: "exotic", rarity: "legendary", rarityLabel: "Thần Thoại" },
  { id: "dog2", name: "Husky Ngáo", emoji: "🐺", color: "slate", type: "dog", rarity: "epic", rarityLabel: "Cực Hiếm" },
  { id: "cat2", name: "Mèo Quý Tộc", emoji: "🐈", color: "amber", type: "cat", rarity: "rare", rarityLabel: "Hiếm" },
];

export default function PetGame({ isDarkMode, onBack }: PetGameProps) {
  const { coins: globalCoins, addCoins } = useGlobalCoins();
  const [petData, setPetData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("meomeo_pet_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const handleSaveName = () => {
    if (!petData) return;
    const newName = editNameValue.trim();
    if (!newName) {
      setIsEditingName(false);
      return;
    }
    const next = { ...petData, name: newName };
    const now = Date.now();
    if (!next.history) next.history = [];
    next.history.unshift({ action: `Đã đổi tên thành ${newName}`, time: now, icon: "🏷️", color: "text-purple-500" });
    next.history = next.history.slice(0, 5);
    setPetData(next);
    localStorage.setItem("meomeo_pet_data", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: next }));
    setIsEditingName(false);
    playMeowSound();
  };

  useEffect(() => {
    if (petData) {
      localStorage.setItem("meomeo_pet_data", JSON.stringify(petData));
    } else {
      localStorage.removeItem("meomeo_pet_data");
    }
  }, [petData]);

  // Sync with global background logic
  useEffect(() => {
    const handlePetUpdate = (e: any) => {
      if (e.detail) {
        setPetData(e.detail);
      }
    };
    window.addEventListener("pet-data-updated", handlePetUpdate);
    return () => window.removeEventListener("pet-data-updated", handlePetUpdate);
  }, []);

  const handleAdopt = (pet: any) => {
    playMeowSound();
    setPetData({
      typeId: pet.id,
      name: pet.name,
      emoji: pet.emoji,
      color: pet.color,
      hunger: 100,
      happiness: 100,
      energy: 100,
      cleanliness: 100,
      level: 1,
      exp: 0,
      history: []
    });
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  };

  const handleAction = (action: string) => {
    if (!petData) return;
    playMeowSound();
    setActiveAction(action);
    setTimeout(() => setActiveAction(null), 1000);

    setPetData((prev: any) => {
      let next = { ...prev };
      
      const now = Date.now();
      if (!next.history) next.history = [];
      
      addCoins(10); // Earn 10 coins per action

      switch(action) {
        case "feed":
          next.hunger = Math.min(100, next.hunger + 30);
          next.energy = Math.min(100, next.energy + 5);
          next.cleanliness = Math.max(0, next.cleanliness - 5);
          next.exp += 10;
          next.history.unshift({ action: "Đã cho ăn (+10🪙)", time: now, icon: "🍖", color: "text-rose-500" });
          break;
        case "play":
          const playBonus = next.buff_play_x2 ? 60 : 30;
          next.happiness = Math.min(100, next.happiness + playBonus);
          next.energy = Math.max(0, next.energy - 15);
          next.hunger = Math.max(0, next.hunger - 10);
          next.cleanliness = Math.max(0, next.cleanliness - 10);
          next.exp += 15;
          next.history.unshift({ action: "Đã chơi đùa (+10🪙)", time: now, icon: "⚽", color: "text-amber-500" });
          break;
        case "sleep":
          next.energy = Math.min(100, next.energy + 50);
          next.hunger = Math.max(0, next.hunger - 15);
          next.history.unshift({ action: "Đã cho đi ngủ (+10🪙)", time: now, icon: "💤", color: "text-sky-500" });
          break;
        case "clean":
          next.cleanliness = Math.min(100, next.cleanliness + 40);
          next.happiness = Math.min(100, next.happiness + 5);
          next.exp += 5;
          next.history.unshift({ action: "Đã tắm rửa (+10🪙)", time: now, icon: "✨", color: "text-emerald-500" });
          break;
      }
      
      next.history = next.history.slice(0, 5); // Keep last 5 actions

      // Level up logic
      if (next.exp >= next.level * 100) {
        next.level += 1;
        next.exp = 0;
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
      }

      return next;
    });
  };

  const StatBar = ({ label, value, colorClass, icon: Icon }: any) => (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
        <div className={`flex items-center gap-1 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
          <Icon className="w-3 h-3" />
          {label}
        </div>
        <span className={isDarkMode ? "text-stone-300" : "text-stone-700"}>{Math.round(value)}%</span>
      </div>
      <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-stone-800" : "bg-stone-200"}`}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${colorClass}`}
        />
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-[900px] mx-auto min-h-[500px] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative transition-colors duration-500 ${isDarkMode ? "bg-stone-950 border-stone-800" : "bg-white border-stone-200"} border`}>
      {/* Header */}
      <div className={`w-full p-4 flex items-center justify-between border-b transition-colors duration-500 ${isDarkMode ? "bg-stone-900/40 border-stone-800/60" : "bg-stone-50/50 border-stone-100"}`}>
        <button
          onClick={() => {
            playMeowSound();
            onBack();
          }}
          className={`p-2 rounded-full transition-all ${isDarkMode ? "hover:bg-stone-800 text-stone-400" : "hover:bg-stone-200 text-stone-600"} flex items-center gap-2`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold hidden sm:block">Quay lại</span>
        </button>
        {petData && (
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full font-mono text-xs font-bold border flex items-center gap-1 ${isDarkMode ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
              🪙 {globalCoins}
            </div>
            <div className={`px-3 py-1 rounded-full font-mono text-xs font-bold border ${isDarkMode ? "bg-amber-950/30 text-amber-400 border-amber-900/50" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
              LV. {petData.level}
            </div>
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn bỏ thú cưng này để nuôi con khác không?")) {
                  setPetData(null);
                }
              }}
              className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "bg-stone-800 hover:bg-rose-900/50 text-stone-400 hover:text-rose-400" : "bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-500"}`}
              title="Nhận nuôi bé khác"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          {!petData ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl flex flex-col items-center gap-6"
            >
              <div className="text-center mb-4">
                <h2 className={`font-serif font-bold text-2xl sm:text-3xl italic px-2 mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Trại Thú Cưng
                </h2>
                <p className="text-sm text-stone-500 mb-6">Chọn một bé thú cưng để bắt đầu chăm sóc nhé!</p>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 w-full max-w-md mx-auto px-4">
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isDarkMode ? "bg-stone-900 border-stone-700 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"}`}
                  >
                    <option value="all">Tất cả giống loài</option>
                    <option value="cat">Mèo 🐱</option>
                    <option value="dog">Chó 🐶</option>
                    <option value="bunny">Thỏ 🐰</option>
                    <option value="exotic">Độc lạ 🐉</option>
                  </select>
                  
                  <select 
                    value={filterRarity}
                    onChange={(e) => setFilterRarity(e.target.value)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isDarkMode ? "bg-stone-900 border-stone-700 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"}`}
                  >
                    <option value="all">Mọi độ hiếm</option>
                    <option value="common">Phổ biến</option>
                    <option value="rare">Hiếm</option>
                    <option value="epic">Cực Hiếm</option>
                    <option value="legendary">Thần Thoại</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                {PET_TYPES.filter(p => (filterType === "all" || p.type === filterType) && (filterRarity === "all" || p.rarity === filterRarity)).map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => handleAdopt(pet)}
                    className={`p-6 rounded-3xl text-center flex flex-col items-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-xl ${
                      isDarkMode ? "bg-stone-900 border-stone-800 hover:bg-stone-800" : "bg-white border-stone-200 hover:bg-stone-50"
                    } border-2`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        pet.rarity === 'legendary' ? (isDarkMode ? 'bg-red-950/50 text-red-400 border-red-900' : 'bg-red-50 text-red-600 border-red-200') :
                        pet.rarity === 'epic' ? (isDarkMode ? 'bg-purple-950/50 text-purple-400 border-purple-900' : 'bg-purple-50 text-purple-600 border-purple-200') :
                        pet.rarity === 'rare' ? (isDarkMode ? 'bg-sky-950/50 text-sky-400 border-sky-900' : 'bg-sky-50 text-sky-600 border-sky-200') :
                        (isDarkMode ? 'bg-stone-800 text-stone-400 border-stone-700' : 'bg-stone-100 text-stone-500 border-stone-200')
                      }`}>
                        {pet.rarityLabel}
                      </span>
                    </div>
                    <div className="text-5xl mb-2 mt-4">{pet.emoji}</div>
                    <div className="font-bold text-lg">{pet.name}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg flex flex-col items-center gap-8"
            >
              {/* Pet Display */}
              <div className={`relative w-64 h-64 flex items-center justify-center rounded-full ${petData.bgColor || ''} ${petData.frame || ''}`}>
                <motion.div
                  animate={
                    activeAction === "feed" ? { scale: [1, 1.2, 1], y: [0, -20, 0] } :
                    activeAction === "play" ? { rotate: [0, -15, 15, -15, 0], y: [0, -30, 0] } :
                    activeAction === "sleep" ? { opacity: [1, 0.5, 1], scale: [1, 0.9, 1] } :
                    activeAction === "clean" ? { rotate: [0, 360], scale: [1, 1.1, 1] } :
                    { y: [0, -5, 0] }
                  }
                  transition={{ 
                    duration: activeAction ? 0.5 : 2, 
                    repeat: activeAction ? 0 : Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-9xl filter drop-shadow-2xl z-10"
                >
                  {petData.emoji}
                </motion.div>
                
                {/* Action Effects */}
                <AnimatePresence>
                  {activeAction === "feed" && (
                    <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -50 }} exit={{ opacity: 0 }} className="absolute top-0 right-0 text-3xl">🍖</motion.div>
                  )}
                  {activeAction === "play" && (
                    <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -50 }} exit={{ opacity: 0 }} className="absolute top-0 left-0 text-3xl">⚽</motion.div>
                  )}
                  {activeAction === "sleep" && (
                    <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 50, y: -50 }} exit={{ opacity: 0 }} className="absolute top-0 right-0 text-3xl">💤</motion.div>
                  )}
                  {activeAction === "clean" && (
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1.5 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center text-5xl">✨</motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-center flex flex-col items-center">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      maxLength={15}
                      className={`font-serif font-bold text-xl text-center rounded-xl px-3 py-1 outline-none border-2 ${isDarkMode ? "bg-stone-900 border-stone-700 text-stone-100" : "bg-stone-50 border-stone-300 text-stone-800"}`}
                    />
                    <button onClick={handleSaveName} className={`p-1.5 rounded-xl font-bold transition-colors ${isDarkMode ? "bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"}`}>
                      ✓
                    </button>
                    <button onClick={() => setIsEditingName(false)} className={`p-1.5 rounded-xl font-bold transition-colors ${isDarkMode ? "bg-stone-800 text-stone-400 hover:bg-stone-700" : "bg-stone-200 text-stone-500 hover:bg-stone-300"}`}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditNameValue(petData.name); setIsEditingName(true); }}>
                    <h3 className={`font-serif font-bold text-3xl ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>{petData.name}</h3>
                    <button className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-xs rounded-full ${isDarkMode ? "bg-stone-800 text-stone-400 hover:bg-stone-700" : "bg-stone-200 text-stone-600 hover:bg-stone-300"}`} title="Đổi tên">
                      ✏️
                    </button>
                  </div>
                )}
                <div className="text-xs text-stone-500 mt-1">EXP: {petData.exp} / {petData.level * 100}</div>
              </div>

              {/* Stats */}
              <div className={`w-full p-6 rounded-3xl grid grid-cols-2 gap-x-6 gap-y-4 ${isDarkMode ? "bg-stone-900/50" : "bg-stone-50"}`}>
                <StatBar label="No bụng" value={petData.hunger} colorClass="bg-rose-500" icon={Utensils} />
                <StatBar label="Vui vẻ" value={petData.happiness} colorClass="bg-amber-500" icon={Heart} />
                <StatBar label="Năng lượng" value={petData.energy} colorClass="bg-sky-500" icon={Zap} />
                <StatBar label="Sạch sẽ" value={petData.cleanliness} colorClass="bg-emerald-500" icon={Bath} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <button
                  onClick={() => handleAction("feed")}
                  disabled={!!activeAction || petData.hunger >= 100}
                  className={`flex-1 min-w-[100px] py-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-sm ${
                    isDarkMode ? "bg-stone-800 hover:bg-stone-700 text-rose-400" : "bg-white hover:bg-rose-50 text-rose-500 border border-rose-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Utensils className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cho Ăn</span>
                </button>
                <button
                  onClick={() => handleAction("play")}
                  disabled={!!activeAction || petData.energy < 15}
                  className={`flex-1 min-w-[100px] py-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-sm ${
                    isDarkMode ? "bg-stone-800 hover:bg-stone-700 text-amber-400" : "bg-white hover:bg-amber-50 text-amber-500 border border-amber-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Gamepad2 className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Chơi Đùa</span>
                </button>
                <button
                  onClick={() => handleAction("clean")}
                  disabled={!!activeAction || petData.cleanliness >= 100}
                  className={`flex-1 min-w-[100px] py-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-sm ${
                    isDarkMode ? "bg-stone-800 hover:bg-stone-700 text-emerald-400" : "bg-white hover:bg-emerald-50 text-emerald-500 border border-emerald-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Bath className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tắm Rửa</span>
                </button>
                <button
                  onClick={() => handleAction("sleep")}
                  disabled={!!activeAction || petData.energy >= 100}
                  className={`flex-1 min-w-[100px] py-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-sm ${
                    isDarkMode ? "bg-stone-800 hover:bg-stone-700 text-sky-400" : "bg-white hover:bg-sky-50 text-sky-500 border border-sky-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Đi Ngủ</span>
                </button>
              </div>
              
              {/* History Log */}
              {petData.history && petData.history.length > 0 && (
                <div className={`w-full mt-2 p-4 rounded-3xl ${isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-stone-50 border-stone-200"} border`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                    <Star className="w-3.5 h-3.5" />
                    Hoạt động gần đây
                  </h4>
                  <div className="flex flex-col gap-2">
                    {petData.history.map((h: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{h.icon}</span>
                          <span className={`font-medium ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>{h.action}</span>
                        </div>
                        <span className={`text-xs font-mono ${isDarkMode ? "text-stone-500" : "text-stone-400"}`}>
                          {new Date(h.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
