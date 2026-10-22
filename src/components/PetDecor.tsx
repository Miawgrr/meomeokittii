import React, { useState, useEffect } from "react";
import { ArrowLeft, Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playMeowSound } from "../utils/audio";
import { useGlobalCoins } from "../hooks/useGlobalCoins";
import confetti from "canvas-confetti";

interface PetDecorProps {
  isDarkMode: boolean;
  onBack: () => void;
}

const BG_COLORS = [
  { id: "bg-red-200 dark:bg-red-950", name: "Đỏ Nhạt", price: 20, colorClass: "bg-red-200 dark:bg-red-950" },
  { id: "bg-blue-200 dark:bg-blue-950", name: "Xanh Da Trời", price: 20, colorClass: "bg-blue-200 dark:bg-blue-950" },
  { id: "bg-green-200 dark:bg-green-950", name: "Xanh Lá", price: 20, colorClass: "bg-green-200 dark:bg-green-950" },
  { id: "bg-yellow-200 dark:bg-yellow-900/50", name: "Vàng Sáng", price: 30, colorClass: "bg-yellow-200 dark:bg-yellow-900/50" },
  { id: "bg-purple-200 dark:bg-purple-900/50", name: "Tím Mộng Mơ", price: 40, colorClass: "bg-purple-200 dark:bg-purple-900/50" },
  { id: "bg-gradient-to-r from-pink-300 to-rose-300 dark:from-pink-900 dark:to-rose-900", name: "Gradient Hồng", price: 100, colorClass: "bg-gradient-to-r from-pink-300 to-rose-300 dark:from-pink-900 dark:to-rose-900" },
];

const FRAMES = [
  { id: "border-2 border-stone-400 dark:border-stone-600", name: "Khung Trơn", price: 30, class: "border-2 border-stone-400 dark:border-stone-600" },
  { id: "border-4 border-dashed border-pink-400 dark:border-pink-600", name: "Viền Đứt Đoạn", price: 50, class: "border-4 border-dashed border-pink-400 dark:border-pink-600" },
  { id: "ring-4 ring-purple-300 dark:ring-purple-700 ring-offset-2 dark:ring-offset-stone-900", name: "Hào Quang", price: 80, class: "ring-4 ring-purple-300 dark:ring-purple-700 ring-offset-2 dark:ring-offset-stone-900" },
  { id: "border-[6px] border-double border-amber-400 dark:border-amber-600", name: "Khung Đôi", price: 70, class: "border-[6px] border-double border-amber-400 dark:border-amber-600" },
  { id: "shadow-[0_0_20px_rgba(236,72,153,0.6)] dark:shadow-[0_0_20px_rgba(236,72,153,0.3)]", name: "Phát Sáng", price: 120, class: "shadow-[0_0_20px_rgba(236,72,153,0.6)] dark:shadow-[0_0_20px_rgba(236,72,153,0.3)]" },
];

export default function PetDecor({ isDarkMode, onBack }: PetDecorProps) {
  const { coins: globalCoins, deductCoins } = useGlobalCoins();
  const [petData, setPetData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("meomeo_pet_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<"bg" | "frame">("bg");

  useEffect(() => {
    if (petData) {
      localStorage.setItem("meomeo_pet_data", JSON.stringify(petData));
      window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: petData }));
    }
  }, [petData]);

  const handleBuyOrEquipBg = (item: any) => {
    if (!petData) return;
    
    const isOwned = petData.ownedDecorations?.includes(item.id);
    const isEquipped = petData.bgColor === item.id;
    
    if (isEquipped) return;

    playMeowSound();
    const next = { ...petData };

    if (!isOwned) {
      if (globalCoins < item.price) {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: "Không đủ tiền (Coin) để mua! 😿" }));
        return;
      }
      deductCoins(item.price);
      if (!next.ownedDecorations) next.ownedDecorations = [];
      next.ownedDecorations.push(item.id);
      
      if (!next.history) next.history = [];
      next.history.unshift({ action: `Đã mua màu nền ${item.name}`, time: Date.now(), icon: "🎨", color: "text-pink-500" });
      next.history = next.history.slice(0, 5);
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    }

    next.bgColor = item.id;
    setPetData(next);
    window.dispatchEvent(new CustomEvent("show-toast", { detail: `Đã trang bị ${item.name}! 🎨` }));
  };

  const handleBuyOrEquipFrame = (item: any) => {
    if (!petData) return;
    
    const isOwned = petData.ownedDecorations?.includes(item.id);
    const isEquipped = petData.frame === item.id;
    
    if (isEquipped) return;

    playMeowSound();
    const next = { ...petData };

    if (!isOwned) {
      if (globalCoins < item.price) {
        window.dispatchEvent(new CustomEvent("show-toast", { detail: "Không đủ tiền (Coin) để mua! 😿" }));
        return;
      }
      deductCoins(item.price);
      if (!next.ownedDecorations) next.ownedDecorations = [];
      next.ownedDecorations.push(item.id);
      
      if (!next.history) next.history = [];
      next.history.unshift({ action: `Đã mua khung ${item.name}`, time: Date.now(), icon: "🖼️", color: "text-amber-500" });
      next.history = next.history.slice(0, 5);
      confetti({ particleCount: 40, spread: 40, origin: { y: 0.7 } });
    }

    next.frame = item.id;
    setPetData(next);
    window.dispatchEvent(new CustomEvent("show-toast", { detail: `Đã trang bị ${item.name}! 🖼️` }));
  };

  const handleUnequipAll = () => {
    if (!petData) return;
    playMeowSound();
    const next = { ...petData };
    next.bgColor = "";
    next.frame = "";
    setPetData(next);
    window.dispatchEvent(new CustomEvent("show-toast", { detail: `Đã tháo trang bị! 🧹` }));
  };

  if (!petData) return null;

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
          <Palette className={`w-5 h-5 ${isDarkMode ? "text-pink-400" : "text-pink-500"}`} />
          <span className={isDarkMode ? "text-stone-200" : "text-stone-800"}>Shop Trang Trí</span>
        </div>

        <div className={`px-3 py-1.5 rounded-full font-mono text-sm font-bold border flex items-center gap-1.5 ${isDarkMode ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50" : "bg-yellow-50 text-yellow-600 border-yellow-200"}`}>
          🪙 {globalCoins}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col md:flex-row gap-6">
        {/* Preview Area */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center p-8 rounded-[2rem] border dark:border-stone-800 border-stone-200 bg-stone-50/50 dark:bg-stone-900/20 md:w-1/3">
          <h4 className={`font-bold text-sm uppercase tracking-widest mb-6 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
            Bé Cưng
          </h4>
          <div 
            className={`w-32 h-32 rounded-3xl flex items-center justify-center text-7xl shadow-inner transition-all duration-300 ${
              petData.bgColor ? petData.bgColor : (isDarkMode ? "bg-stone-900" : "bg-stone-100")
            } ${petData.frame ? petData.frame : ""}`}
          >
            {petData.emoji}
          </div>
          <h3 className={`font-serif font-bold text-xl mt-6 ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
            {petData.name}
          </h3>
          <button 
            onClick={handleUnequipAll}
            className="mt-4 text-xs underline text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            Tháo hết trang bị
          </button>
        </div>

        {/* Shop Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 mb-4 p-1 rounded-2xl bg-stone-100 dark:bg-stone-900 w-fit">
            <button
              onClick={() => setActiveTab("bg")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "bg" 
                  ? (isDarkMode ? "bg-stone-800 text-pink-400 shadow-sm" : "bg-white text-pink-600 shadow-sm") 
                  : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              Màu Nền
            </button>
            <button
              onClick={() => setActiveTab("frame")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "frame" 
                  ? (isDarkMode ? "bg-stone-800 text-amber-400 shadow-sm" : "bg-white text-amber-600 shadow-sm") 
                  : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              Khung Ảnh
            </button>
          </div>

          {/* Item Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === "bg" && BG_COLORS.map((item) => {
              const isOwned = petData.ownedDecorations?.includes(item.id);
              const isEquipped = petData.bgColor === item.id;
              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-[1.5rem] border flex flex-col items-center gap-3 transition-all duration-300 text-center ${
                    isEquipped
                      ? (isDarkMode ? "bg-stone-800/80 border-pink-500/50" : "bg-pink-50/50 border-pink-200")
                      : (isDarkMode ? "bg-stone-900/40 border-stone-800 hover:bg-stone-800" : "bg-white border-stone-200 hover:shadow-xl hover:border-pink-100")
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl shadow-inner ${item.colorClass}`}></div>
                  <div>
                    <h4 className={`font-bold text-xs ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>{item.name}</h4>
                  </div>
                  <button
                    onClick={() => handleBuyOrEquipBg(item)}
                    disabled={(!isOwned && globalCoins < item.price) || isEquipped}
                    className={`w-full py-2 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all ${
                      isEquipped 
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : isOwned
                          ? (isDarkMode ? "bg-stone-700 text-stone-200 hover:bg-stone-600" : "bg-stone-200 text-stone-700 hover:bg-stone-300")
                          : globalCoins >= item.price 
                            ? (isDarkMode ? "bg-pink-950 text-pink-400 hover:bg-pink-900" : "bg-pink-50 text-pink-600 hover:bg-pink-100")
                            : "bg-stone-100 text-stone-400 cursor-not-allowed dark:bg-stone-900 dark:text-stone-600 border-none"
                    }`}
                  >
                    {isEquipped ? "Đang Dùng" : isOwned ? "Trang Bị" : `${item.price} 🪙`}
                  </button>
                </div>
              );
            })}

            {activeTab === "frame" && FRAMES.map((item) => {
              const isOwned = petData.ownedDecorations?.includes(item.id);
              const isEquipped = petData.frame === item.id;
              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-[1.5rem] border flex flex-col items-center gap-3 transition-all duration-300 text-center ${
                    isEquipped
                      ? (isDarkMode ? "bg-stone-800/80 border-amber-500/50" : "bg-amber-50/50 border-amber-200")
                      : (isDarkMode ? "bg-stone-900/40 border-stone-800 hover:bg-stone-800" : "bg-white border-stone-200 hover:shadow-xl hover:border-amber-100")
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-900 ${item.class}`}></div>
                  <div>
                    <h4 className={`font-bold text-xs ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>{item.name}</h4>
                  </div>
                  <button
                    onClick={() => handleBuyOrEquipFrame(item)}
                    disabled={(!isOwned && globalCoins < item.price) || isEquipped}
                    className={`w-full py-2 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all ${
                      isEquipped 
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : isOwned
                          ? (isDarkMode ? "bg-stone-700 text-stone-200 hover:bg-stone-600" : "bg-stone-200 text-stone-700 hover:bg-stone-300")
                          : globalCoins >= item.price 
                            ? (isDarkMode ? "bg-amber-950 text-amber-400 hover:bg-amber-900" : "bg-amber-50 text-amber-600 hover:bg-amber-100")
                            : "bg-stone-100 text-stone-400 cursor-not-allowed dark:bg-stone-900 dark:text-stone-600 border-none"
                    }`}
                  >
                    {isEquipped ? "Đang Dùng" : isOwned ? "Trang Bị" : `${item.price} 🪙`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
