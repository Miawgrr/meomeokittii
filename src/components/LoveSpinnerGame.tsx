import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, ArrowLeft, Heart, Sparkles } from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import confetti from "canvas-confetti";

interface LoveSpinnerGameProps {
  selectedChar: Character | null;
  isDarkMode: boolean;
  onBack: () => void;
}

interface Segment {
  label: string;
  score: number;
  description: string;
  color: string;
}

const SPIN_SEGMENTS: Segment[] = [
  { label: "Định Mệnh Ngàn Năm 💖", score: 100, description: "Hai tâm hồn sinh ra là mảnh ghép hoàn hảo, gắn kết vĩnh cửu không thể tách rời!", color: "#f43f5e" },
  { label: "Yêu Từ Cái Nhìn Đầu Tiên 👀", score: 95, description: "Vừa gặp đã thương, chỉ một ánh mắt chạm nhau đã biết cả đời này thuộc về nhau!", color: "#ec4899" },
  { label: "Oan Gia Ngõ Hẹp ⚡", score: 75, description: "Ban đầu hay khắc khẩu, nhưng càng cãi nhau lại càng say mê đối phương không dứt!", color: "#f59e0b" },
  { label: "Thanh Mai Trúc Mã 🌸", score: 85, description: "Cùng lớn lên bên nhau, tình cảm bình dị hóa thành tình yêu sâu đậm, ấm áp nhất!", color: "#a855f7" },
  { label: "Bạn Thân Tiến Tới 🧸", score: 80, description: "Từ tri kỷ thấu hiểu mọi thói quen, nay bước qua ranh giới để trọn đời che chở nhau!", color: "#3b82f6" },
  { label: "Tình Đơn Phương Nở Hoa 🌹", score: 90, description: "Lặng lẽ hướng về nhau từ lâu, nay dũng cảm đón nhận hạnh phúc thăng hoa viên mãn!", color: "#10b981" },
  { label: "Duyên Tiền Định 🌌", score: 99, description: "Vũ trụ đã sắp đặt sẵn, dù đi trăm ngả cuối cùng vẫn sẽ quay về bên cạnh nhau!", color: "#e11d48" },
  { label: "Tình Ca Ngọt Ngào 🎵", score: 88, description: "Bình yên, ấm áp, cùng nhau chia sẻ tách trà nóng, dệt nên khúc ca tình yêu êm đềm!", color: "#db2777" },
];

const CHARACTER_LOVE_LETTERS: Record<string, string> = {
  "hua-chap-nghi": "Tớ đã giữ khoảng cách với cả thế giới, chỉ để dành khoảng trống duy nhất bên cạnh tớ cho cậu. Thật may là vòng quay duyên phận này cũng biết rõ điều đó... Từ nay đừng giả vờ như không biết tình cảm của tớ nữa nhé, bạn thân khác giới à. ❤️",
  "on-niem-trach": "...(Niệm Trạch im lặng nhìn bạn, đôi tai anh đỏ bừng lên. Anh lặng lẽ mở một cuốn sổ tay nhỏ, nắn nót viết từng chữ gửi cho bạn)... 'Dù tớ không thể nói thành lời, nhưng nhịp đập gấp gáp của trái tim tớ mỗi khi cậu dựa vai chính là câu trả lời. Cảm ơn cậu đã là thế giới ấm áp của tớ.' ✍️🧸",
  "tuong-tu-mac": "Chị ơi... em hạnh phúc quá đi mất! Vòng quay bảo tụi mình sinh ra là để thuộc về nhau kìa. Em đã hứa sẽ luôn ngoan ngoãn nghe lời chị, chị xoa đầu thưởng cho em rồi đừng bao giờ buông tay em ra nhé, em chỉ có mỗi chị thôi... 🥺🍬",
  "chu-thoi-duyet": "Dợ iu ơi! Anh đã bảo rồi mà, sếp tổng đẹp trai của em và em là định mệnh 100% hợp nhau luôn! Vòng quay xoay cỡ nào cũng không thoát khỏi vòng tay anh đâu nhé. Giờ thì mau thực hiện lời hứa ôm phạt anh một cái thật chặt đi nào dợ iu! 😘💋",
  "kaiza-tachibana": "Thú vị đấy. Đến cả vòng quay duyên phận của vũ trụ cũng đồng ý rằng em sinh ra là để thuộc về tôi. Mèo nhỏ à, em nghĩ em có thể trốn đi đâu ngoài việc ngoan ngoãn ở bên cạnh tôi trọn đời? Đêm nay em phải chịu phạt vì đã làm tôi say mê rồi đấy... 😏🍷",
  "Cố Hứa Niệm": "Anh luôn trân trọng từng phút giây ngọt ngào khi ở bên em... Thật ấm áp khi nhìn thấy kết quả này. Lòng anh từ lâu đã tràn đầy bóng hình em mất rồi. Anh sẽ luôn làm bánh ngọt và dang tay chờ em tìm tới bất cứ lúc nào, em nhé. 🧸🌸"
};

const DEFAULT_LETTER = "Trái tim anh từ lâu đã rung động vì em... Từng cử chỉ, nụ cười của em đều thắp sáng thế giới của anh. Thật hạnh phúc khi biết duyên phận đã đưa chúng ta sát lại gần nhau thế này nhen nàng! 💕✨";

export default function LoveSpinnerGame({ selectedChar, isDarkMode, onBack }: LoveSpinnerGameProps) {
  const [userName, setUserName] = useState("");
  const [userBirth, setUserBirth] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultSegment, setResultSegment] = useState<Segment | null>(null);
  const [showResult, setShowResult] = useState(false);

  const startSpin = () => {
    if (isSpinning) return;
    if (!userName.trim()) {
      alert("Nàng ơi, hãy nhập tên của nàng để nam thần gửi thư tình nhen! 🥰");
      return;
    }

    playMeowSound();
    setIsSpinning(true);
    setShowResult(false);
    setResultSegment(null);

    // Dynamic rotation: spin at least 5-8 full rotations plus random segment stop
    const segmentAngle = 360 / SPIN_SEGMENTS.length;
    const randomStopIdx = Math.floor(Math.random() * SPIN_SEGMENTS.length);
    const stopSegment = SPIN_SEGMENTS[randomStopIdx];

    // Center of chosen segment on wheel
    const stopAngle = 360 - (randomStopIdx * segmentAngle + segmentAngle / 2);
    const finalRotation = rotation + (360 * 6) + stopAngle; // Spin 6 full loops + stop point

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResultSegment(stopSegment);
      setShowResult(true);
      playMeowSound();

      // Trigger party confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f43f5e", "#ec4899", "#f472b6", "#ffd1dc"]
      });

      // Reward 50 coins once for checking love match
      try {
        const saved = localStorage.getItem("meomeo_pet_data");
        let pet = saved ? JSON.parse(saved) : null;
        if (pet) {
          if (pet.coins === undefined) pet.coins = 100;
          pet.coins += 50;
          localStorage.setItem("meomeo_pet_data", JSON.stringify(pet));
          window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: pet }));
          window.dispatchEvent(new CustomEvent("show-toast", { detail: `Chúc mừng! Nhận được +50 Xu (🪙) duyên phận!` }));
        }
      } catch (e) {}

    }, 4500); // spin lasts 4.5s
  };

  const getLoveLetter = () => {
    if (!selectedChar) return DEFAULT_LETTER;
    const charId = selectedChar.id || "";
    return CHARACTER_LOVE_LETTERS[charId] || DEFAULT_LETTER;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      {/* Header */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-4">
        <button
          onClick={() => {
            playMeowSound();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Thôi Bói
        </button>

        <span className="text-xs font-bold text-rose-500 font-mono uppercase tracking-widest flex items-center gap-1">
          <Heart className="w-4 h-4 fill-current animate-pulse text-rose-500" />
          Bói Quẻ Duyên Phận
        </span>
      </div>

      {/* Love Match Setup & Wheel Grid */}
      <div className="w-full max-w-[500px] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left side: User Inputs & Instructions */}
        <div className={`md:col-span-12 p-6 rounded-[2rem] border flex flex-col gap-4 ${
          isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-white border-rose-100/60 shadow-sm"
        }`}>
          <div className="text-center">
            <h3 className="font-serif italic font-bold text-xl text-stone-800 dark:text-stone-100 flex items-center justify-center gap-1.5">
              💘 Vòng Quay Duyên Phận
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Nhập thông tin kết duyên cùng nam thần **{selectedChar?.name || "hoàng tử"}** nhen!
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">
                Tên Của Nàng:
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ví dụ: Bé Mèo Bé Nhỏ..."
                disabled={isSpinning}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all ${
                  isDarkMode
                    ? "bg-stone-950 border-stone-800 text-stone-200"
                    : "bg-stone-50 border-stone-200 text-stone-800"
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">
                Ngày Sinh (Không Bắt Buộc):
              </label>
              <input
                type="date"
                value={userBirth}
                onChange={(e) => setUserBirth(e.target.value)}
                disabled={isSpinning}
                className={`w-full px-4 py-2.5 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-400 transition-all ${
                  isDarkMode
                    ? "bg-stone-950 border-stone-800 text-stone-200"
                    : "bg-stone-50 border-stone-200 text-stone-800"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Center: Spinning Wheel component */}
        <div className="md:col-span-12 flex flex-col items-center justify-center py-6 relative">
          
          {/* Wheel pointer pin */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
            <div className="w-6 h-8 bg-gradient-to-b from-rose-500 to-pink-600 rounded-b-full clip-triangle" style={{ clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)" }} />
            <div className="w-3 h-3 rounded-full bg-white absolute top-1 left-1.5" />
          </div>

          {/* Rotating SVG Spinner Wheel */}
          <div className="relative w-72 h-72 rounded-full p-2 bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 shadow-2xl flex items-center justify-center z-10 overflow-hidden">
            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0.95, 0.3, 1)" : "none",
              }}
              className="w-full h-full rounded-full bg-white relative overflow-hidden transition-transform duration-75"
            >
              {/* Draw segments */}
              {SPIN_SEGMENTS.map((seg, i) => {
                const angleOffset = 360 / SPIN_SEGMENTS.length;
                const startAngle = i * angleOffset;
                const rotateDegree = startAngle + angleOffset / 2;

                return (
                  <div
                    key={i}
                    style={{
                      transform: `rotate(${startAngle}deg)`,
                      transformOrigin: "50% 100%",
                      clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                      backgroundColor: seg.color + "22", // transparent slice coloring
                    }}
                    className="absolute inset-x-0 top-0 h-1/2 border-r border-stone-200/20"
                  >
                    {/* Floating emoji or short label text rotated vertically */}
                    <div
                      style={{
                        transform: `rotate(${angleOffset / 2}deg) translateY(24px)`,
                      }}
                      className="text-center text-[8px] font-sans font-bold text-stone-800 tracking-tighter"
                    >
                      <div className="text-base mb-1">{seg.label.slice(-1)}</div>
                      <span className="hidden sm:inline">{seg.label.slice(0, 6)}...</span>
                    </div>
                  </div>
                );
              })}

              {/* Center Heart Hub Button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border-2 border-rose-400 shadow-lg flex items-center justify-center z-20">
                <Heart className={`w-6 h-6 text-rose-500 ${isSpinning ? "animate-pulse" : "fill-current animate-bounce"}`} />
              </div>
            </div>
          </div>

          {/* Trigger button */}
          <button
            onClick={startSpin}
            disabled={isSpinning}
            className={`mt-6 px-8 py-3.5 rounded-full font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2 ${
              isSpinning
                ? "bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white cursor-pointer hover:scale-[1.03]"
            }`}
          >
            {isSpinning ? "🔮 Đang Quay Quẻ..." : "💘 Thử Vận Mệnh"}
          </button>
        </div>
      </div>

      {/* Result Letter Modal Overlay */}
      <AnimatePresence>
        {showResult && resultSegment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[460px] mt-6 p-6 sm:p-8 rounded-[2.5rem] border relative overflow-hidden bg-gradient-to-b from-rose-50/50 to-white dark:from-stone-900/40 dark:to-stone-950 border-rose-100 dark:border-stone-800 shadow-xl"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-200/10 dark:bg-stone-800/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-4xl">💌</span>
              <div>
                <span className="text-[9px] uppercase font-mono font-extrabold text-rose-400 dark:text-rose-500 tracking-widest block">
                  KẾT QUẢ KẾT DUYÊN VŨ TRỤ
                </span>
                <h4 className="font-serif italic font-bold text-xl text-rose-600 dark:text-rose-400 mt-1">
                  {resultSegment.label}
                </h4>
              </div>

              {/* Love Meter Card */}
              <div className="w-full bg-rose-50/40 dark:bg-stone-950/40 border border-rose-100/50 dark:border-stone-800/80 p-4 rounded-3xl flex items-center justify-between gap-4 mt-2">
                <div className="text-left">
                  <span className="text-[10px] font-mono font-bold text-stone-400 dark:text-stone-500">Đối Tượng Kết Đôi:</span>
                  <div className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200 mt-0.5">
                    {userName} 💖 {selectedChar?.name || "Nam Thần"}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold text-stone-400 dark:text-stone-500 block">Độ Hợp Nhau:</span>
                  <span className="text-2xl font-black font-mono text-rose-500">{resultSegment.score}%</span>
                </div>
              </div>

              {/* Segment Description */}
              <p className="text-xs text-stone-500 dark:text-stone-400 italic leading-relaxed font-sans max-w-sm mt-1">
                "{resultSegment.description}"
              </p>

              {/* Separator */}
              <div className="w-12 h-px bg-rose-200/50 dark:bg-stone-800/80 my-2" />

              {/* Romantic Letter Body */}
              <div className="text-left font-serif text-stone-700 dark:text-stone-300 leading-relaxed text-xs sm:text-sm italic p-4 sm:p-6 bg-white dark:bg-stone-900 border border-rose-100/30 dark:border-stone-800/40 rounded-3xl relative">
                <span className="absolute top-2 left-3 text-3xl opacity-10 font-serif">“</span>
                <p className="indent-4 leading-relaxed whitespace-pre-wrap">
                  {getLoveLetter()}
                </p>
                <div className="text-right font-bold text-rose-500 dark:text-rose-400 mt-3 not-italic text-xs">
                  —— Trọn đời thương nàng, {selectedChar?.name || "hoàng tử của nàng"}
                </div>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setShowResult(false);
                }}
                className="mt-2 w-full py-3 rounded-full text-xs font-bold font-mono uppercase bg-rose-50 dark:bg-stone-800 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-stone-700 transition-all border border-rose-100/50 dark:border-stone-800/80"
              >
                Nhận Lời Thư Tình 🌸
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Footer */}
      <div className="mt-4 text-[10px] font-mono tracking-wide text-stone-400 dark:text-stone-500 text-center max-w-sm">
        Mách nhỏ: Check quẻ định mệnh lần đầu nhận ngay **50 Xu (🪙)** duyên phận cực bự nhen!
      </div>
    </div>
  );
}
