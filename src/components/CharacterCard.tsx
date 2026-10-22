import React from "react";
import { BookOpen, Link2, Heart, X, Eye, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { isImageUrl, formatImageUrl, handleImageError } from "../utils/image";

interface CharacterCardProps {
  char: Character;
  idx: number;
  onSelect: () => void;
  onStartChat?: () => void;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  getThemeDetails: (colorValue: string) => any;
  isDarkMode?: boolean;
  onNoLinkClick?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  char,
  idx,
  onSelect,
  onStartChat,
  onEdit,
  onDelete,
  onToggleFavorite,
  getThemeDetails,
  isDarkMode = false,
  onNoLinkClick,
}) => {
  const [showNoteEditor, setShowNoteEditor] = React.useState(false);
  const [floatingHearts, setFloatingHearts] = React.useState<{id: number, x: number, y: number, rotation: number, scale: number}[]>([]);
  const [noteText, setNoteText] = React.useState(() => {
    return localStorage.getItem(`meomeo_note_${char.id}`) || "";
  });
  const [hasNote, setHasNote] = React.useState(() => {
    return !!localStorage.getItem(`meomeo_note_${char.id}`);
  });

  const handleSaveNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(`meomeo_note_${char.id}`, noteText);
    setHasNote(!!noteText);
    setShowNoteEditor(false);
    playMeowSound();
    window.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: `Đã lưu ghi chú bí mật cho ${char.name}! 📝✨`,
      })
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.05 }}
      exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.25, ease: "easeInOut" } }}
      transition={{
        type: "spring",
        stiffness: 85,
        damping: 14,
        mass: 0.9,
        delay: Math.min(idx * 0.04, 0.35)
      }}
      whileHover={{ 
        scale: 1.05,
        y: -6,
        boxShadow: isDarkMode 
          ? "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5), 0 0 30px 4px rgba(253, 186, 116, 0.3)" // Dreamy golden hour glow
          : "0 20px 25px -5px rgba(120, 53, 4, 0.12), 0 10px 10px -5px rgba(120, 53, 4, 0.08), 0 0 20px 2px rgba(244, 63, 94, 0.15)",
        transition: { type: "spring", stiffness: 300, damping: 22 }
      }}
      className={`w-full h-[390px] group relative border flex flex-col p-6 transition-colors duration-300 justify-between cursor-pointer rounded-[2rem] shadow-sm ${
        isDarkMode 
          ? "bg-stone-900/80 backdrop-blur-sm border-stone-800/80 hover:border-amber-200/40 hover:bg-stone-900/95" 
          : "bg-white border-[#eadbca]/50 hover:border-rose-300 hover:bg-white"
      }`}
      id={`character-card-${char.id}`}
      onClick={() => {
        playMeowSound();
        onSelect();
      }}
    >
      {/* Cute Kitten Ear / Heart Deco */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-300 ${
        isDarkMode 
          ? "bg-rose-900/40 group-hover:bg-rose-400" 
          : "bg-rose-200/40 group-hover:bg-rose-400/80"
      }`} />

      {/* Top row: Category & Quick actions */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {char.category && (
              <span className={`text-[8px] uppercase tracking-widest border px-2 py-0.5 rounded-full font-mono font-bold ${
                isDarkMode 
                  ? "text-amber-400 border-amber-900/60 bg-amber-950/30" 
                  : "text-amber-800 border-[#eadbca]/50 bg-amber-50/50"
              }`}>
                {char.category}
              </span>
            )}
            {char.isFavorite && (
              <span className={`text-[8px] uppercase tracking-widest border px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 shadow-sm animate-pulse font-bold ${
                isDarkMode 
                  ? "text-rose-400 border-rose-900/80 bg-rose-950/40 shadow-rose-950/10" 
                  : "text-rose-500 border-rose-200 bg-rose-50 shadow-rose-100/10"
              }`}>
                <Heart className="w-2 h-2 fill-rose-500 text-rose-500" />
                ĐÃ THÍCH
              </span>
            )}
            {hasNote && (
              <span className={`text-[8px] uppercase tracking-widest border px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 shadow-sm font-bold ${
                isDarkMode 
                  ? "text-amber-400 border-amber-900/80 bg-amber-950/40 shadow-amber-950/10" 
                  : "text-amber-600 border-amber-200 bg-amber-50 shadow-amber-100/10"
              }`} title={noteText}>
                📝 CÓ GHI CHÚ
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border shrink-0 transition-colors ${
            isDarkMode 
              ? "bg-stone-950/80 border-stone-800 text-stone-400" 
              : "bg-stone-50 border-stone-200 text-stone-500"
          }`} title={`${char.views || 0} lượt xem`}>
            <Eye className="w-3 h-3 text-rose-400" />
            <span>{char.views || 0}</span>
          </div>
        </div>

        {/* Profile info row: Avatar, Name, Role */}
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-14 h-14 rounded-full aspect-square border flex items-center justify-center relative transition-colors overflow-hidden shrink-0 shadow-inner ${
            isDarkMode 
              ? "border-stone-800 bg-gradient-to-br from-rose-950/30 to-amber-950/30 group-hover:border-rose-800" 
              : "border-[#eadbca]/50 bg-gradient-to-br from-rose-50/50 to-amber-50/50 group-hover:border-rose-200"
          }`}>
            {isImageUrl(char.avatar) ? (
              <img 
                src={formatImageUrl(char.avatar)} 
                alt={char.name} 
                className="w-full h-full object-cover aspect-square rounded-full shrink-0" 
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, char.name)}
              />
            ) : (
              <span className="text-2xl select-none">{char.avatar}</span>
            )}
            <div
              className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full z-10 border border-white ${
                char.themeColor === "red"
                  ? "bg-red-400"
                  : char.themeColor === "sky"
                  ? "bg-sky-400"
                  : char.themeColor === "rose"
                  ? "bg-rose-400"
                  : char.themeColor === "purple"
                  ? "bg-purple-400"
                  : "bg-emerald-400"
              }`}
            />
          </div>
          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
            <h3 className={`text-md font-serif italic transition-colors truncate font-semibold ${
              isDarkMode 
                ? "text-white group-hover:text-white" 
                : "text-stone-800 group-hover:text-rose-500"
            }`}>
              {char.name}
            </h3>
            {char.feedbacks && char.feedbacks.length > 0 && (
              <div 
                className={`flex items-center space-x-1 shrink-0 px-1.5 py-0.5 rounded-full shadow-xs ${
                  isDarkMode ? "bg-rose-950/40 text-rose-400" : "bg-rose-50 text-rose-500 border border-rose-100"
                }`} 
                title={`${char.feedbacks.length} nhận xét`}
              >
                <MessageSquare className="w-3 h-3" />
                <span className="text-[10px] font-bold font-mono">{char.feedbacks.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Plot preview text directly on card face replaced with Category/Tags */}
        <div className={`mt-2 pt-3 border-t ${isDarkMode ? "border-stone-800" : "border-[#eadbca]/30"}`}>
          <div className="flex items-center space-x-1 mb-2">
            <BookOpen className="w-3 h-3 text-rose-400" />
            <span className="text-[9px] uppercase tracking-widest text-rose-500 font-mono font-bold">
              THỂ LOẠI
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 h-[76px] overflow-hidden select-none content-start">
            {char.tags && char.tags.length > 0 ? (
              char.tags.map((tag, i) => tag.trim() && (
                <span 
                  key={i}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-sans font-medium tracking-wide transition-all shadow-2xs ${
                    isDarkMode 
                      ? "bg-rose-950/20 border-rose-900/30 text-rose-300" 
                      : "bg-rose-50/50 border-rose-100/60 text-rose-700"
                  }`}
                >
                  {tag.trim()}
                </span>
              ))
            ) : char.plot && (char.plot.includes(',') || char.plot.includes(';')) ? (
              (char.plot.includes(';') ? char.plot.split(';') : char.plot.split(',')).map((tag, i) => tag.trim() && (
                <span 
                  key={i}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-sans font-medium tracking-wide transition-all shadow-2xs ${
                    isDarkMode 
                      ? "bg-purple-950/40 border-purple-900/30 text-purple-200" 
                      : "bg-pink-50/70 border-pink-100/70 text-rose-700"
                  }`}
                >
                  {tag.trim()}
                </span>
              ))
            ) : (
              <span className={`text-[11px] font-sans font-medium italic ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                {char.plot || "Chưa chọn thể loại."}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: Links & actions */}
      <div className={`space-y-3 mt-4 pt-4 border-t ${isDarkMode ? "border-stone-800" : "border-[#eadbca]/30"}`}>
        {/* Tiny link display */}
        {char.link && (
          (char.link.startsWith("http") && char.id !== "kaven-nyx") ? (
            <a
              href={char.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                playMeowSound();
              }}
              className={`flex items-center space-x-1 text-[9px] font-mono truncate hover:underline cursor-pointer group-hover:text-rose-500 transition-colors ${
                isDarkMode ? "text-stone-300 hover:text-white" : "text-stone-600 hover:text-rose-600"
              }`}
              title="Nhấp để đi đến link trực tiếp nhen! ➔"
            >
              <Link2 className="w-3 h-3 shrink-0" />
              <span className="truncate underline decoration-dotted">{char.link}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playMeowSound();
                if (onNoLinkClick) onNoLinkClick();
              }}
              className={`flex items-center space-x-1 text-[9px] font-mono truncate hover:underline cursor-pointer transition-colors ${
                isDarkMode ? "text-stone-400 hover:text-rose-400" : "text-stone-500 hover:text-rose-600"
              }`}
              title="Nhấp để đi đến link trực tiếp nhen! ➔"
            >
              <Link2 className="w-3 h-3 shrink-0" />
              <span className="truncate underline decoration-dotted">
                {char.id === "kaven-nyx" ? "Đã khóa để sửa chữa" : char.link}
              </span>
            </button>
          )
        )}

        {/* Trigger details, chat, personal note & favorite split button row */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              playMeowSound();
              onSelect();
            }}
            className={`flex-1 py-2 text-center border text-[9px] uppercase tracking-[0.08em] font-bold font-mono transition-all duration-300 cursor-pointer rounded-full shadow-xs hover:shadow-sm ${
              isDarkMode 
                ? "border-rose-900/60 text-rose-400 bg-rose-950/20 hover:bg-rose-950/40" 
                : "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
            }`}
          >
            HỒ SƠ 📖
          </button>

          {onStartChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playMeowSound();
                onStartChat();
              }}
              className={`py-2 px-2.5 border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shrink-0 rounded-full ${
                isDarkMode 
                  ? "border-amber-800 text-amber-300 bg-amber-950/30 hover:bg-amber-900/50" 
                  : "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
              }`}
              title="Chat riêng với nhân vật 💬"
            >
              <span>💬</span>
              <span className="text-[9px] font-mono font-bold tracking-wider">CHAT</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              playMeowSound();
              setShowNoteEditor(true);
            }}
            className={`py-2 px-3 border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shrink-0 rounded-full ${
              hasNote
                ? isDarkMode
                  ? "bg-amber-950/40 text-amber-400 border-amber-900 shadow-sm hover:bg-amber-900/30"
                  : "bg-amber-100 text-amber-600 border-amber-200 shadow-sm hover:bg-amber-200/80"
                : isDarkMode
                  ? "bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-amber-400 border-stone-800 hover:border-amber-900"
                  : "bg-white hover:bg-amber-50 text-stone-500 hover:text-amber-600 border-stone-200 hover:border-rose-200"
            }`}
            title="Ghi chú cá nhân"
          >
            <span>📝</span>
            <span className="text-[9px] font-mono font-bold tracking-wider">GHI CHÚ</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              playMeowSound();
              if (!char.isFavorite) {
                const newHearts = Array.from({ length: 6 }).map((_, i) => ({
                  id: Date.now() + i,
                  x: (Math.random() - 0.5) * 80,
                  y: -Math.random() * 60 - 30,
                  rotation: (Math.random() - 0.5) * 90,
                  scale: Math.random() * 0.5 + 0.6
                }));
                setFloatingHearts(prev => [...prev, ...newHearts]);
                setTimeout(() => {
                  setFloatingHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
                }, 1000);
              }
              onToggleFavorite(e);
            }}
            className={`relative py-2 px-3 border transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 rounded-full ${
              char.isFavorite
                ? isDarkMode
                  ? "bg-rose-950/40 text-rose-400 border-rose-900 shadow-sm hover:bg-rose-900/30"
                  : "bg-rose-100 text-rose-600 border-rose-200 shadow-sm hover:bg-rose-200/80"
                : isDarkMode
                  ? "bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-rose-400 border-stone-800 hover:border-rose-900"
                  : "bg-white hover:bg-rose-50 text-stone-500 hover:text-rose-600 border-stone-200 hover:border-rose-200"
            }`}
            title={char.isFavorite ? "Bỏ yêu thích" : "Yêu thích ❤️"}
          >
            <Heart className={`w-3.5 h-3.5 z-10 ${char.isFavorite ? "fill-rose-500 text-rose-500 animate-pulse" : ""}`} />
            <span className="text-[10px] font-mono font-bold tracking-wider z-10 flex items-center gap-1">
              <span>{char.isFavorite ? "ĐÃ THÍCH" : "THÍCH"}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                char.isFavorite 
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-300"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
              }`}>
                {char.favoritesCount || 0}
              </span>
            </span>
            <AnimatePresence>
              {floatingHearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ opacity: 1, y: 0, x: 0, scale: 0, rotate: 0 }}
                  animate={{ 
                    opacity: 0, 
                    y: heart.y, 
                    x: heart.x, 
                    scale: heart.scale, 
                    rotate: heart.rotation 
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute pointer-events-none text-rose-500 z-20"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                >
                  <Heart className="w-4 h-4 fill-rose-500" />
                </motion.div>
              ))}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Elegant Personal Note Editor Overlay */}
      <AnimatePresence>
        {showNoteEditor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute inset-0 z-20 p-5 rounded-[2rem] flex flex-col justify-between transition-all duration-300 ${
              isDarkMode 
                ? "bg-stone-950 border border-stone-800 text-stone-200" 
                : "bg-[#ffeef2] border border-[#eadbca] text-stone-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between border-b pb-2 border-stone-200/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📝</span>
                  <span className="text-[11px] font-mono tracking-wider font-extrabold uppercase text-rose-500">
                    Ghi Chú Về {char.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNoteEditor(false);
                    playMeowSound();
                  }}
                  className="text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                placeholder="Nàng hãy viết những lời thì thầm, ghi chú riêng tư về chàng trai này ở đây nhé... 💕 (Lưu vào máy nàng)"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={`w-full flex-1 p-3 text-xs font-serif italic rounded-xl border resize-none focus:outline-none transition-all ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-600 focus:border-rose-900" 
                    : "bg-white border-stone-200 text-stone-800 placeholder-stone-400 focus:border-rose-300"
                }`}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNote}
                  className={`flex-1 py-2 text-center text-[10px] font-bold font-mono uppercase transition-all duration-300 cursor-pointer rounded-full shadow-sm hover:scale-[1.02] active:scale-95 ${
                    isDarkMode 
                      ? "bg-rose-950 text-rose-400 border border-rose-900/60 hover:bg-rose-900/40" 
                      : "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  Lưu Ghi Chú ✨
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNoteEditor(false);
                    playMeowSound();
                  }}
                  className={`py-2 px-4 text-center text-[10px] font-bold font-mono uppercase transition-all duration-300 cursor-pointer rounded-full border ${
                    isDarkMode 
                      ? "border-stone-800 text-stone-400 hover:bg-stone-900" 
                      : "border-stone-200 text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
