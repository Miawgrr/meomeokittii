import React, { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Coins, Sparkles, Utensils, Zap, Heart, Bath } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playMeowSound } from "../utils/audio";
import { useGlobalCoins } from "../hooks/useGlobalCoins";
import confetti from "canvas-confetti";

interface PetShopProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const SHOP_ITEMS = [
  { id: "premium_food", name: "Pate Cá Hồi", desc: "No bụng +50, Vui vẻ +10", price: 50, icon: "🐟", type: "food" },
  { id: "magic_yarn", name: "Cuộn Len Ma Thuật", desc: "Vui vẻ +50, Năng lượng +10", price: 60, icon: "🧶", type: "toy" },
  { id: "bubble_bath", name: "Bồn Tắm Hoa Hồng", desc: "Sạch sẽ +100, Vui vẻ +20", price: 40, icon: "🛁", type: "clean" },
  { id: "cloud_bed", name: "Giường Đám Mây", desc: "Năng lượng +100, Vui vẻ +20", price: 80, icon: "☁️", type: "sleep" },
  { id: "silver_bell", name: "Chuông Bạc", desc: "Giúp Chơi Đùa tăng Vui vẻ x2 vĩnh viễn", price: 150, icon: "🔔", type: "toy" },
  { id: "cat_pillow", name: "Gối Mèo", desc: "Giúp Chơi Đùa tăng Vui vẻ x2 vĩnh viễn", price: 150, icon: "🐾", type: "sleep" },
  { id: "umbrella", name: "Ô Trong Suốt", desc: "Che mưa, khi mưa tăng Vui vẻ", price: 120, icon: "☂️", type: "toy" },
];

export default function PetShop({ isDarkMode, onBack }: PetShopProps) {
  const { coins: globalCoins, deductCoins } = useGlobalCoins();
  const [petData, setPetData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("meomeo_pet_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [purchasedItem, setPurchasedItem] = useState<string | null>(null);

  useEffect(() => {
    if (petData) {
      localStorage.setItem("meomeo_pet_data", JSON.stringify(petData));
      window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: petData }));
    }
  }, [petData]);

  const handleBuy = (item: any) => {
    if (!petData) return;
    if (globalCoins < item.price) {
      window.dispatchEvent(new CustomEvent("show-toast", { detail: "Không đủ tiền (Coin) để mua! 😿" }));
      return;
    }

    playMeowSound();
    setPurchasedItem(item.id);
    
    setTimeout(() => {
      setPurchasedItem(null);
    }, 1500);

    const next = { ...petData };
    deductCoins(item.price);
    const now = Date.now();
    if (!next.history) next.history = [];

    // Apply effects
    if (item.id === "premium_food") {
      next.hunger = Math.min(100, next.hunger + 50);
      next.happiness = Math.min(100, next.happiness + 10);
      next.exp += 20;
    } else if (item.id === "magic_yarn") {
      next.happiness = Math.min(100, next.happiness + 50);
      next.energy = Math.min(100, next.energy + 10);
      next.exp += 20;
    } else if (item.id === "bubble_bath") {
      next.cleanliness = Math.min(100, next.cleanliness + 100);
      next.happiness = Math.min(100, next.happiness + 20);
      next.exp += 15;
    } else if (item.id === "cloud_bed") {
      next.energy = Math.min(100, next.energy + 100);
      next.happiness = Math.min(100, next.happiness + 20);
      next.exp += 15;
    } else if (item.id === "silver_bell" || item.id === "cat_pillow") {
      next.buff_play_x2 = true;
      next.happiness = Math.min(100, next.happiness + 20);
      next.exp += 30;
    } else if (item.id === "umbrella") {
      next.has_umbrella = true;
      next.happiness = Math.min(100, next.happiness + 20);
      next.exp += 20;
    }

    // Level up logic
    if (next.exp >= next.level * 100) {
      next.level += 1;
      next.exp = 0;
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
    }

    next.history.unshift({ action: `Đã mua ${item.name}`, time: now, icon: "🛍️", color: "text-purple-500" });
    next.history = next.history.slice(0, 5);

    setPetData(next);
    window.dispatchEvent(new CustomEvent("show-toast", { detail: `Đã mua và dùng ${item.name}! 🛍️` }));
    confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
  };

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

        <div className="flex items-center gap-2 font-serif font-bold text-lg">
          <ShoppingBag className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-500"}`} />
          <span className={isDarkMode ? "text-stone-200" : "text-stone-800"}>Shop Đồ Chơi</span>
        </div>

        {petData && (
          <div className={`px-3 py-1.5 rounded-full font-mono text-sm font-bold border flex items-center gap-1.5 ${isDarkMode ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
            🪙 {petData.coins || 0}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 relative">
        {!petData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center">
            <h2 className={`font-serif font-bold text-2xl mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
              Chưa có thú cưng!
            </h2>
            <p className="text-stone-500">Hãy vào Trại Thú Cưng để nhận nuôi một bé trước khi vào Shop nhé.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SHOP_ITEMS.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-3xl border flex items-center gap-4 transition-all duration-300 ${
                    isDarkMode 
                      ? "bg-stone-900/40 border-stone-800 hover:bg-stone-800" 
                      : "bg-white border-stone-200 hover:shadow-xl"
                  }`}
                >
                  <div className="text-4xl">
                    <AnimatePresence>
                      {purchasedItem === item.id ? (
                        <motion.div initial={{ scale: 1 }} animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5 }}>
                          ✨
                        </motion.div>
                      ) : (
                        <motion.div>
                          {item.icon}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-base ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>{item.name}</h4>
                    <p className={`text-[11px] uppercase tracking-wider font-bold font-mono mt-1 ${
                      item.type === 'food' ? (isDarkMode ? 'text-rose-400' : 'text-rose-500') :
                      item.type === 'toy' ? (isDarkMode ? 'text-amber-400' : 'text-amber-500') :
                      item.type === 'clean' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-500') :
                      (isDarkMode ? 'text-sky-400' : 'text-sky-500')
                    }`}>
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={globalCoins < item.price || (((((item.id === "silver_bell" || item.id === "cat_pillow") && petData.buff_play_x2) || (item.id === "umbrella" && petData.has_umbrella)) || (item.id === "umbrella" && petData.has_umbrella)) || (item.id === "umbrella" && petData.has_umbrella))}
                    className={`px-4 py-2 rounded-xl font-bold font-mono text-sm uppercase tracking-widest transition-all ${
                      (globalCoins >= item.price && !((item.id === "silver_bell" || item.id === "cat_pillow") && petData.buff_play_x2)) 
                        ? (isDarkMode ? "bg-purple-950 text-purple-400 hover:bg-purple-900" : "bg-purple-50 text-purple-600 hover:bg-purple-100")
                        : "bg-stone-200 text-stone-400 cursor-not-allowed dark:bg-stone-800 dark:text-stone-600 border-none"
                    }`}
                  >
                    {((item.id === "silver_bell" || item.id === "cat_pillow") && petData.buff_play_x2) ? "Đã Sở Hữu" : `${item.price} 🪙`}
                  </button>
                </div>
              ))}
            </div>
            
            {/* Pet Preview */}
            <div className="mt-8 flex flex-col items-center justify-center p-6 rounded-[2rem] border dark:border-stone-800 border-stone-200 bg-stone-50/50 dark:bg-stone-900/20">
              <div className="text-6xl filter drop-shadow-xl mb-4">
                {petData.emoji}
              </div>
              <h3 className={`font-serif font-bold text-xl ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
                {petData.name}
              </h3>
              <p className="text-xs text-stone-500">Tiền tiêu vặt của bé: <strong className="text-yellow-500 font-mono text-sm">{petData.coins || 0} 🪙</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
