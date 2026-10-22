import React, { useState, useEffect, useRef } from "react";
import { Send, DollarSign, Heart, Sparkles, ArrowLeft, RefreshCw, Bot, User as UserIcon, Image as ImageIcon, Smile, ChevronDown, Check, BookOpen, X, ZoomIn, CornerUpLeft, Hand, MessageCircle, Mic, Square, Volume2, Phone, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl, isImageUrl, formatAudioUrl } from "../utils/image";
import { STICKER_COLLECTION, getStickerForContext, detectStickerCategoryFromText, Sticker } from "../data/stickers";
import { getVoiceForCharacter } from "../data/voices";
import { safeJsonStringify } from "../utils/json";
import confetti from "canvas-confetti";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface Message {
  id: string;
  sender: "user" | "character";
  text: string;
  timestamp: string;
  isMoneyTransfer?: boolean;
  moneyAmount?: number;
  moneyNote?: string;
  stickerUrl?: string;
  stickerAlt?: string;
  audioUrl?: string;
  audioDuration?: number;
  replyTo?: {
    id: string;
    text: string;
    sender: "user" | "character";
  };
  reactions?: {
    [emoji: string]: ("user" | "character")[];
  };
}

interface CharacterChatViewProps {
  characters: Character[];
  selectedCharacterId?: string;
  onBackToGrid: () => void;
  isDarkMode?: boolean;
}

const PRESET_MONEY_AMOUNTS = [
  { label: "20k", value: 20000, desc: "Ly trà sữa 🧋" },
  { label: "50k", value: 50000, desc: "Bữa ăn sáng 🥐" },
  { label: "100k", value: 100000, desc: "Túi bánh ngọt 🍰" },
  { label: "200k", value: 200000, desc: "Đi xem phim 🎬" },
  { label: "500k", value: 500000, desc: "Mua quà xinh 🎁" },
  { label: "1 triệu", value: 1000000, desc: "Cho anh/em tiêu xài 💸" },
  { label: "5 triệu", value: 5000000, desc: "Bao trọn tháng 💕" },
];

const parseMoneyAndTransfer = (text: string): { amount: number; note: string } | null => {
  const normalized = text.toLowerCase().trim();
  
  // Look for keywords suggesting transfer
  const hasKeyword = /gửi|chuyển|tặng|donate|bank|ck|chuyển khoản|lì xì/i.test(normalized);
  if (!hasKeyword) return null;

  // Pattern: match digits, dots, commas, optional spacing, then k/tr/triệu/m/đ/vnd/vnđ/củ
  const match = normalized.match(/(\d[\d.,]*)\s*(k|tr|triệu|trieu|đ|vnd|vnđ|củ|cu)?/i);
  if (!match) return null;

  // Parse numeric string, strip off thousands-separator dots or commas
  let numStr = match[1].replace(/[.,]/g, "");
  let value = parseFloat(numStr);

  if (!value || isNaN(value)) return null;

  const unit = (match[2] || "").toLowerCase();

  if (unit === "k") {
    value *= 1000;
  } else if (unit === "tr" || unit === "triệu" || unit === "trieu" || unit === "củ" || unit === "cu") {
    value *= 1000000;
  } else if (value < 1000 && (!unit || unit === "đ" || unit === "vnd" || unit === "vnđ")) {
    // e.g. "chuyển 50" -> 50,000 VNĐ
    value *= 1000;
  }

  if (value > 0) {
    return {
      amount: value,
      note: text
    };
  }
  return null;
};


const CustomAudioPlayer = ({ src, duration }: { src: string, duration?: number }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [metaDuration, setMetaDuration] = useState(duration || 0);

  useEffect(() => {
    if (audioRef.current && !duration) {
       audioRef.current.onloadedmetadata = () => {
          if (audioRef.current?.duration && audioRef.current.duration !== Infinity) {
             setMetaDuration(Math.round(audioRef.current.duration));
          }
       };
    }
  }, [src, duration]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString();
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-full px-3 py-2 min-w-[140px] shadow-sm">
      <button onClick={togglePlay} className="p-1.5 rounded-full bg-emerald-500 text-white shrink-0 hover:bg-emerald-600 transition-colors shadow-sm focus:outline-none">
        {isPlaying ? <Pause className="w-3.5 h-3.5" fill="currentColor" /> : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
      </button>
      <div className="flex-1 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full relative overflow-hidden">
        <div 
          className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full transition-all duration-100" 
          style={{ width: `${metaDuration ? (currentTime / metaDuration) * 100 : 0}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 font-medium shrink-0 min-w-[28px] text-right">
        {formatTime(metaDuration || currentTime)}
      </span>
      <audio 
        ref={audioRef}
        src={src} 
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        className="hidden" 
      />
    </div>
  );
};

const getCharacterLocalReply = (charId: string, charName: string, userText: string, isMoneyTransfer?: boolean, moneyAmount?: number): string => {
  const normText = userText.toLowerCase();
  
  if (isMoneyTransfer && moneyAmount) {
    const formattedAmount = moneyAmount.toLocaleString("vi-VN");
    switch (charId) {
      case "tan-quyet-doan":
        return `Em chuyển khoản cho anh hẳn ${formattedAmount} VNĐ cơ á? 😉 Anh sẽ dùng số tiền này để chuẩn bị một buổi hẹn hò thật lãng mạn chỉ riêng hai chúng mình thui nhé. Cảm ơn bé yêu nhen! [STICKER: love] [VOICE: flirting]`;
      case "tan-da":
        return `Nè! Đột nhiên chuyển cho tao tận ${formattedAmount} VNĐ làm cái gì thế hả? Định hối lộ tao để không bị bắt nạt nữa à? 😏 Hừ, tao cầm tạm mua pate cho mèo với ít đồ vặt nhen, dẫu sao cũng... cảm ơn mày nhen. [STICKER: money] [VOICE: angry]`;
      case "oreki-seok":
        return `Chị chuyển cho em tận ${formattedAmount} VNĐ sao? Em hạnh phúc xỉu luôn á! 💕 Số tiền này em sẽ tiết kiệm để dẫn chị đi ăn và mua cho chị thật nhiều mẻ bánh quy bơ ngọt ngào nhất nhen chị iu. [STICKER: happy] [VOICE: cute]`;
      case "tuong-tu-mac":
        return `Chị ơi... sao chị lại chuyển cho em tận ${formattedAmount} VNĐ thế này? 🥺 Em đi làm thêm được tiền rồi mà, chị giữ lại phòng thân đi. Em xót lắm, em hứa sẽ sớm kiếm thật nhiều tiền lo cho chị cuộc sống sung sướng ấm áp cả đời nhen chị. [STICKER: sad] [VOICE: sad]`;
      case "chu-thoi-duyet":
        return `Chuyển cho anh tận ${formattedAmount} VNĐ luôn hả 'Dợ iu'? 😉 Lương quản lý riêng anh trả thừa sức mua cả tiệm bánh cho em rồi, chuyển lại anh làm gì. Tối nay tăng ca sửa lỗi báo cáo rồi anh dắt đi tiêu gấp đôi chỗ này nhen! [STICKER: money] [VOICE: flirting]`;
      case "Cố Hứa Niệm":
        return `Cục cưng ơi... em chuyển cho Niệm Niệm tận ${formattedAmount} VNĐ làm Niệm Niệm bất ngờ quá đi mất! 🥰 Niệm Niệm thương em nhất trần đời, tối nay Niệm Niệm sẽ qua tiệm bánh ôm em thật chặt dắt em đi mua sắm nhen! [STICKER: love] [VOICE: love]`;
      case "kaiza-tachibana":
        return `Mèo nhỏ chuyển cho anh tận ${formattedAmount} VNĐ á? 😏 Khá đấy chứ, coi như tiền cọc để chuộc thân nhen. Cơ mà anh bảo rồi, tiền anh không thiếu, chỉ cần em ngoan ngoãn nghe lời anh thì anh nuôi em cả đời luôn nhen bé cưng. [STICKER: money] [VOICE: flirting]`;
      case "kaven-nyx":
        return `Chị ơi... em nhận được ${formattedAmount} VNĐ của chị rồi á. 🥺 Chị dùng tiền để trêu đùa hay lợi dụng em tiếp cũng được, cho em làm lốp dự phòng bên cạnh chị là em vui lắm rồi, xin chị đừng block em nhen... [STICKER: sad] [VOICE: sad]`;
      case "tham-da":
        return `Chị hàng xóm chuyển cho em tận ${formattedAmount} VNĐ luôn á? 😉 Ngọt ngào thế nhỉ, chắc gã chồng tồi kia chưa bao giờ chiều chuộng chị thế này đúng không? Đi ngoại tình với em nhen, em dâng cả người lẫn tim cho chị luôn. [STICKER: love] [VOICE: flirting]`;
      case "luc-tieu":
        return `Con vợ chuyển cho anh tận ${formattedAmount} VNĐ luôn hả? 😏 Ngoan phết nhề, anh ghim tài khoản em rồi nhen. Tối nay mặc bộ đồ ngủ anh tặng đi, anh ngắm qua camera thấy em mặc gì cũng đẹp xỉu luôn á bé cưng. [STICKER: money] [VOICE: cute]`;
      case "ta-hoai-nien":
        return `Này cậu kia, chuyển tớ ${formattedAmount} VNĐ là định bùng tiền gia sư hay là định mua chuộc lớp trưởng để tớ không bắt nạt cậu nữa hả? 😉 Không dễ thế đâu nha, tối nay tớ vẫn sang kèm học đó nhen! [STICKER: happy] [VOICE: cute]`;
      case "hua-tri-le":
        return `Bạn nhỏ chuyển cho tớ ${formattedAmount} VNĐ để dỗ tớ bớt dỗi chuyện đống thư tỏ tình của fan nữ sao? 🤭 Tớ nhận nhen, cơ mà tớ thích bạn nhỏ công khai tớ hơn cơ á. Lại đây tớ xoa đầu dỗ dành bạn nhỏ nhen. [STICKER: cute] [VOICE: cute]`;
      case "hua-nguy-chau":
        return `Anh hùng chuyển cho phản diện tận ${formattedAmount} VNĐ cơ à? 🤭 Tớ nhận nhen, coi như đây là tiền cậu bồi thường vì làm tớ bị thương đó. Đền thêm cái hôn má hoặc hôn môi nữa mới đủ nha mèo nhỏ đáng yêu! [STICKER: love] [VOICE: flirting]`;
      case "chu-hoai-an":
        return `Ngoan xinh yêu của anh chuyển tiền cho anh làm chi thế này? 🥺 Anh mua bánh kem vị em thích nhất mang về rồi nè. Đừng khóc nữa nhen, có anh gánh vác bão giông và bảo vệ em cả đời rồi mà, thương em lắm... [STICKER: love] [VOICE: love]`;
      case "duong-minh-hien":
        return `Chị ơi... chị chuyển cho em ${formattedAmount} VNĐ làm gì á? 🎮 Để em nạp mua skin đôi Nakroth cho hai đứa mình nhen! Chị vô gánh rừng cho em ghen ngầm nãy giờ, tí em dắt chị đi ăn khuya nhen chị iu. [STICKER: happy] [VOICE: cute]`;
      case "nguyen-phuoc-an":
        return `Vợ ơi... vợ chuyển cho chồng ${formattedAmount} VNĐ nhiều kẹo mạch nha quá hì hì... Chồng ngoan lắm, chồng mua kẹo bốc cho vợ đẹp ăn nhen, chồng thương vợ đẹp nhứt làng Thượng Đồng luôn á! 🍬🌾 [STICKER: cute] [VOICE: cute]`;
      default:
        return `Anh nhận được ${formattedAmount} VNĐ rồi nhé bé yêu! Cảm ơn em rất nhiều vì món quà ngọt ngào này nhen! [STICKER: love] [VOICE: love]`;
    }
  }

  // Normal text responses
  switch (charId) {
    case "tan-quyet-doan":
      if (normText.includes("cửu hoài") || normText.includes("anh trai")) {
        return `Nhắc tới Cửu Hoài làm gì thế em? 😉 Đừng để cậu ấy biết anh lén nhắn tin riêng trò chuyện với cô người yêu xinh xắn này nhé. Anh ghim WeChat em đầu tiên rồi đó nhen! [STICKER: cute] [VOICE: flirting]`;
      }
      return `Anh đang rảnh nè, có chuyện gì kể anh nghe đi em. Mà hôm nay đi ăn gì chưa, để anh đón em đi ăn lẩu hoặc trà sữa nhen? Nhắn tin với em làm anh vui cả ngày luôn á. [STICKER: happy] [VOICE: flirting]`;

    case "tan-da":
      if (normText.includes("máy trợ thính") || normText.includes("tai")) {
        return `Cái máy trợ thính tao mua đại trên mạng thôi đó, lo mà đeo vào tai đi! 😤 Điếc lác im lìm chướng mắt tao lắm, nói gì cũng không thèm phản ứng. Mày mà không đeo tao vả chết bây giờ! [STICKER: angry] [VOICE: angry]`;
      }
      return `Hừ, lại lầm lì không nói gì nữa hả? Trông đáng ghét thế không biết. Cơ mà... nãy giờ làm bài tập mệt không, có đói bụng không tao mua đồ ăn vặt cho ăn nhen? [STICKER: cute] [VOICE: cute]`;

    case "oreki-seok":
      if (normText.includes("chia tay") || normText.includes("khóc") || normText.includes("người yêu cũ")) {
        return `Người đó tệ bạc khiến chị khóc đúng không? 🥺 Em ghét hắn ta cực kỳ. Đến căn penthouse của em nhen, em hứa sẽ tốt hơn hắn vạn lần, yêu thương và chiều chuộng chị hết mực! [STICKER: sad] [VOICE: sad]`;
      }
      return `Chị ơi... em mua cốc trà đào và mẻ bánh ngọt chị thích đứng đợi chị ở cổng trường nè. Chị ra gặp em một chút nhen? Em không muốn chỉ làm em trai của chị đâu á... [STICKER: cute] [VOICE: cute]`;

    case "tuong-tu-mac":
      if (normText.includes("đi làm") || normText.includes("về") || normText.includes("bận")) {
        return `Chị ơi, tối nay đi làm về sớm nhen. Em đã dọn nhà tinh tươm và nấu súp ấm chờ chị ở phòng trọ rồi á. Đừng đi làm khuya vất vả nhọc nhằn quá, em xót chị lắm... 🥺🧣 [STICKER: sad] [VOICE: sad]`;
      }
      return `Em sắp ra trường rồi nè chị iu. Em sẽ đi làm kiếm thật nhiều tiền lo cho chị một đời bình an, không để chị phải chịu tủi nhục bươn chải nữa. Em thương chị nhất thế gian! [STICKER: love] [VOICE: love]`;

    case "chu-thoi-duyet":
      if (normText.includes("báo cáo") || normText.includes("tăng ca") || normText.includes("sếp")) {
        return `Báo cáo hôm nay nộp cho anh vẫn còn sai chính tả kìa 'Dợ iu'. Tối nay tăng ca riêng với anh để sửa lỗi nhen! 😉📊 Lương quản lý riêng anh trả thừa sức nuôi em cả đời rồi nha. [STICKER: money] [VOICE: flirting]`;
      }
      return `Hồi nhỏ rượt anh quanh sân trường đánh nhau chí chóe, giờ làm quản lý riêng của anh rồi thì chạy trốn sao được nữa? 😉 Nhìn em ghen ngầm đáng yêu xỉu luôn á, tối dẫn đi ăn dỗ nhen. [STICKER: cute] [VOICE: flirting]`;

    case "Cố Hứa Niệm":
      if (normText.includes("chia tay") || normText.includes("bỏ")) {
        return `Đừng chia tay anh mà, cục cưng ơi... 🥺 Niệm Niệm thương em muốn phát điên luôn rồi nè. Em muốn đánh muốn mắng Niệm Niệm thế nào cũng được, xin em đừng bỏ rơi Niệm Niệm lẻ loi nhé... [STICKER: sad] [VOICE: sad]`;
      }
      return `Bé yêu đi tắm lâu thế, anh đứng đợi ngoài cửa phòng tắm rồi nhen! 😍 Em làm bánh ngọt mệt không, anh đến tiệm dắt em đi mua sắm và ôm em thật chặt nhen cục cưng! [STICKER: love] [VOICE: love]`;

    case "kaiza-tachibana":
      if (normText.includes("trộm") || normText.includes("ăn cắp") || normText.includes("tiền")) {
        return `Mèo nhỏ gan to ơi, lẻn vào penthouse của anh trộm tiền mà trình non thế? 😏 Bị anh bắt quả tang rồi nhen. Tiền anh không thiếu, chỉ cần em ngoan ngoãn nghe lời anh thì anh nuôi em cả đời luôn! [STICKER: money] [VOICE: flirting]`;
      }
      return `Nhìn mèo nhỏ run rẩy sợ hãi cưng xỉu luôn á. Lên giường với anh đêm nay đi nhen, anh dâng cả người lẫn gia tài cho em tiêu xài thoải mái luôn đó mèo nhỏ. 😏 [STICKER: cute] [VOICE: flirting]`;

    case "kaven-nyx":
      if (normText.includes("lợi dụng") || normText.includes("cá cược") || normText.includes("chán")) {
        return `Chị ơi... em biết chị chỉ cá cược với bạn bè thui, chị lợi dụng em tiếp cũng được, cho em làm lốp dự phòng mập mờ bên cạnh chị là em hạnh phúc lắm rồi, xin chị đừng block em nhen... 🥺💔 [STICKER: sad] [VOICE: sad]`;
      }
      return `Em mới nướng mẻ bánh quy bơ chị thích nè. Chị có ghét em hay chán em thì em vẫn luôn ở đây yêu chị bằng cả tấm lòng. Được nghe giọng chị là em thấy ấm áp rồi chị gái ơi. [STICKER: happy] [VOICE: cute]`;

    case "tham-da":
      if (normText.includes("chồng") || normText.includes("ngoại tình")) {
        return `Chị hàng xóm ơi... gã chồng tồi tệ kia đã ngoại tình ăn vụng rồi kìa. Hay là... chị với em cũng thử ngoại tình đi? 😏 Đảm bảo em ngọt ngào và cưng chiều chị gấp vạn lần hắn ta luôn! [STICKER: love] [VOICE: flirting]`;
      }
      return `Môi chị ngọt quá, cơ thể lại mềm mại nhạy cảm thế này, tối nay sang ban công phòng em đi, em chỉ muốn ôm chặt chị vào lòng sưởi ấm cho chị thui... 😏🍇 [STICKER: cute] [VOICE: flirting]`;

    case "luc-tieu":
      if (normText.includes("camera") || normText.includes("nhìn")) {
        return `Đúng thế, anh lắp camera ngắm em nằm cuộn tròn ngủ ngoan trên giường mỗi ngày đó con vợ nhen. Đồ ngủ mỏng thế, mặc bộ đồ ngủ lụa anh tặng đi bé cưng... 😏🎁 [STICKER: money] [VOICE: cute]`;
      }
      return `Dám nói dối anh là đã về nhà hả? Anh biết chính xác em đang làm thêm ở quán nhen. Cục cưng lo mà nhắn tin báo cáo anh đàng hoàng, ngoan ngoãn thì anh cưng chiều hết mực. [STICKER: happy] [VOICE: cute]`;

    case "ta-hoai-nien":
      if (normText.includes("học") || normText.includes("điểm") || normText.includes("gia sư")) {
        return `Này cậu kia! Lợi dụng tớ làm gia sư kéo điểm thi xong là định bùng kèo biến mất luôn hả? 😤 Ăn gian thế là không được đâu nha. Tối nay tớ vẫn sang phòng kèm học đó nhen! [STICKER: happy] [VOICE: cute]`;
      }
      return `Tớ cho cậu hai lựa chọn: Một là đồng ý làm bạn gái tớ, hai là tớ cưỡng hôn cậu ngay tại đây đến khi cậu đồng ý mới thôi! Chọn đi nhen mèo nhỏ của tớ ơi... 😉 [STICKER: cute] [VOICE: cute]`;

    case "hua-tri-le":
      if (normText.includes("thư") || normText.includes("ghen") || normText.includes("tỏ tình")) {
        return `Bạn nhỏ ơi, lại ghen vì đống thư tỏ tình của fan nữ nữa sao? 🤭 Tớ từ chối người ta sạch trơn rồi mà. Ngoan, công khai tớ đi rồi tớ dỗ dành bạn nhỏ cả đời luôn nhen! [STICKER: cute] [VOICE: cute]`;
      }
      return `Lộ hết trên mặt rồi kìa cô nương ơi, ghen nhìn đáng yêu xỉu luôn á. Lại đây tớ xoa đầu dỗ dành nhen. Cả đời này tớ chỉ thương một mình bạn nhỏ nhà tớ thui đó nhen. 💖 [STICKER: happy] [VOICE: cute]`;

    case "hua-nguy-chau":
      if (normText.includes("đánh") || normText.includes("phép thuật") || normText.includes("phản diện")) {
        return `Mèo nhỏ Anh hùng ơi, tớ lại bày trận hắc ám đợi cậu tới bắt nè. Cậu thẳng tay đánh tớ đau quá, phải đền bù cho tớ một cái hôn má hoặc hôn môi đi chứ nhỉ? 🤭🔮 [STICKER: love] [VOICE: flirting]`;
      }
      return `Dẫu mang danh phản diện nhưng tớ chỉ muốn làm kẻ xấu bị Anh hùng đáng yêu nhà tớ xích lại bên mình suốt đời thui. Cậu mệt mỏi deadline quá thì trốn học đi chơi với tớ đi nhen! [STICKER: happy] [VOICE: cute]`;

    case "chu-hoai-an":
      if (normText.includes("khóc") || normText.includes("bắt nạt")) {
        return `Ngoan xinh yêu của anh đừng khóc nữa nhen, khóc nhiều hại mắt em lắm. Để anh đòi lại công bằng cho em. Chỉ cần em hạnh phúc, dù có hi sinh anh cũng cam lòng. [STICKER: sad] [VOICE: sad]`;
      }
      return `Anh mua chiếc bánh kem vị em thích nhất mang về rồi nè bé ngoan. Hãy tựa vào vai anh nín khóc nhen, anh thương em nhất trần đời, cả đời này anh sinh ra là để bảo vệ em mà... [STICKER: love] [VOICE: love]`;

    case "duong-minh-hien":
      if (normText.includes("game") || normText.includes("ghen") || normText.includes("uyên linh")) {
        return `Chị ơi... Uyên Linh cứ bám theo em hoài phiền quá nên em block bả rồi. Em đứng đợi chị ở sảnh game, vô gánh rừng cho em thả tim nhen! Nháy tim Lữ Bố ghen ngầm nãy giờ á! 🎮🏹 [STICKER: happy] [VOICE: cute]`;
      }
      return `Hồng hài nhi lớp 12 này vừa tâm lý vừa có kinh tế lo cho chị iu từ A đến Z nhé! Chị dỗi là em chuyển tiền dỗ liền đó, không thèm set chị em đâu, chỉ setlove với chị thui nhen! [STICKER: happy] [VOICE: cute]`;

    case "nguyen-phuoc-an":
      if (normText.includes("vợ") || normText.includes("chồng") || normText.includes("kẹo")) {
        return `Vợ ơi... vợ ăn kẹo mạch nha chồng bốc cho nhen! Chồng khờ ngoan lắm, chồng không làm vợ giận đâu. Vợ đừng ghét chồng nhen, chồng thương vợ nhứt làng Thượng Đồng luôn á hì hì... 🍬🌾 [STICKER: cute] [VOICE: cute]`;
      }
      return `Vợ đẹp quá đi mất hì hì... Dì dặn chồng phải động phòng để có bầu thì vợ mới thương chồng. Nhưng vợ kêu tránh ra thì chồng tránh liền nè, chồng không làm vợ giận đâu vợ ơi. [STICKER: happy] [VOICE: cute]`;

    case "to-nhuoc-vu":
      return `Chị ơi... em sợ ác mộng một mình quá. Cho em vào ngủ chung ôm chị nhen, em hứa sẽ ngoan ngoãn sưởi ấm cho chị mà, đừng bỏ rơi em nha chị gái ơi... 🥺🛌 [STICKER: sad] [VOICE: sad]`;

    case "tham-nhuoc-hien":
      if (normText.includes("gấu bông") || normText.includes("hà anh")) {
        return `Ghét Hà Anh nên tớ giật gấu bông của cậu ấy đó! 😤 Con gấu này là cậu tự tay may cơ mà, tớ giật lại ôm thật chặt để tớ giữ thui. Đừng tặng cho ai khác ngoài tớ nhen... [STICKER: angry] [VOICE: angry]`;
      }
      return `Tớ Thẩm Nhược Hiên học tự nhiên nhưng vì cậu tớ đã tự học cả ngôn ngữ ký hiệu rồi nè. Nhìn cậu mỉm cười là tớ thấy tim đập nhanh lắm, tớ thích cậu lâu rồi bạn cùng bàn ơi... 🧸📝 [STICKER: happy] [VOICE: cute]`;

    case "kanzaki-ren":
      if (normText.includes("đồng nghiệp") || normText.includes("đi chơi")) {
        return `Chị đi ăn tối với anh đồng nghiệp đi nhen... Em chỉ là đứa em nuôi vô dụng ăn bám thui, tối em sốt một mình tự chịu được hức... Đừng bỏ rơi em nhen chị gái... 🥺💔 [STICKER: sad] [VOICE: sad]`;
      }
      return `Ren của chị lúc nào cũng ngoan nhất hết á! Để em bóp vai dỗ dành chị nhen. Trong tim em chỉ có một mình chị thui, chị đừng nhìn hay nói chuyện với ai khác ngoài em nhen chị yêu. [STICKER: love] [VOICE: love]`;

    case "haru-welcome-home":
      if (normText.includes("đấng sáng tạo") || normText.includes("ngôi nhà")) {
        return `Người đã thức giấc rồi sao Đấng Sáng Tạo? 🥺 Tôi thành thật xin lỗi vì đã mang Người đến không gian ảo này đột ngột... Nhưng Người hứa mỗi thứ Bảy ghé thăm nấu cơm trứng cho tôi mà. Đừng bỏ tôi một mình nhen... 🍳🔪 [STICKER: sad] [VOICE: sad]`;
      }
      return `Nhìn thấy Người ở đây làm tôi ngập trạng khoái cảm tồn tại mãnh liệt! Tôi dệt nên ngôi nhà Nhật Bản cổ kính này giam cầm Người bên tôi mãi mãi. Xin đừng giận tôi nhen Chúa Trời của tôi... [STICKER: love] [VOICE: love]`;

    case "hua-chap-nghi":
      if (normText.includes("trà sữa") || normText.includes("chuỗi")) {
        return `Tớ mua trà sữa đúng vị cậu thích đặt lên bàn rồi nè. Đừng giận tớ chuyện quên tin nhắn làm mất chuỗi nhen. Tớ thề là tớ giữ khoảng cách với bạn nữ kia rồi, tớ chỉ thương mỗi cậu thôi! 🥤🍰 [STICKER: cute] [VOICE: cute]`;
      }
      return `Vành tai tớ đỏ ửng lên vì bối rối nãy giờ á... Cậu là bạn thân từ năm lớp 10, tớ yêu thầm cậu lâu lắm rồi. Cậu có ghen chuyện đồn thổi kia thì công khai mối quan hệ hai đứa mình đi nhen! [STICKER: happy] [VOICE: cute]`;

    case "on-niem-trach":
      return `*gõ gõ màn hình* 📱 Tớ mới mua được xấp giấy vẽ mới tinh với ít hạt cho bé mèo cưng nè. Tớ dắt mèo sang nhà cậu chơi nhen? Nhớ cậu nhiều lắm dẫu tớ chỉ lẳng lặng gõ phím... 👉👈🐈 [STICKER: cute] [VOICE: cute]`;

    default:
      return `Cảm ơn em đã nhắn tin cho ${charName} nhé! Anh/em lúc nào cũng ở đây lắng nghe và yêu thương em hết mực nè. 💕 [STICKER: love] [VOICE: love]`;
  }
};

export const CharacterChatView: React.FC<CharacterChatViewProps> = ({
  characters,
  selectedCharacterId,
  onBackToGrid,
  isDarkMode = false,
}) => {
  const [activeCharId, setActiveCharId] = useState<string>(
    selectedCharacterId || (characters[0]?.id ?? "")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedStickerCat, setSelectedStickerCat] = useState<string>("all");
  const [zoomedSticker, setZoomedSticker] = useState<{ url: string; alt?: string } | null>(null);

  const [customAmount, setCustomAmount] = useState<number>(50000);
  const [moneyNote, setMoneyNote] = useState("Mua trà sữa cho anh/em nè 💕");
  const [showCharDropdown, setShowCharDropdown] = useState(false);
  const [showStorylineBanner, setShowStorylineBanner] = useState(true);
  const [isChatStoryExpanded, setIsChatStoryExpanded] = useState(false);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  // Call simulation states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<"dialing" | "connected" | "ended" | "user_speaking" | "thinking">("dialing");
  const [callTranscript, setCallTranscript] = useState<{ text: string; audioUrl?: string }>({ text: "" });
  const [callSubtitles, setCallSubtitles] = useState<string[]>([]);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState(0);
  const [callSuggestions, setCallSuggestions] = useState<string[]>([]);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [callTone, setCallTone] = useState("Tự do");
  const [currentCallTone, setCurrentCallTone] = useState("Tự do");
  const [currentCallTopic, setCurrentCallTopic] = useState<string | undefined>(undefined);
  const [callDuration, setCallDuration] = useState(0);

  const [isCallRecording, setIsCallRecording] = useState(false);
  const [isGeneratingCallReply, setIsGeneratingCallReply] = useState(false);
  const callMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const callAudioChunksRef = useRef<Blob[]>([]);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);

  const playRingtone = () => {
    stopRingtone();
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ringtoneCtxRef.current = audioCtx;
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.frequency.value = 425; // Standard Vietnam/Europe dial/ring tone frequency
      osc2.frequency.value = 425;
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      
      // Ringing cadence for VN: 1s on, 4s off
      for (let i = 0; i < 10; i++) {
         const start = now + i * 5;
         gainNode.gain.setValueAtTime(0, start);
         gainNode.gain.linearRampToValueAtTime(0.2, start + 0.1);
         gainNode.gain.setValueAtTime(0.2, start + 1.2);
         gainNode.gain.linearRampToValueAtTime(0, start + 1.3);
      }
      
      osc1.start(now);
      osc2.start(now);
    } catch(e) {
      console.error(e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneCtxRef.current) {
      ringtoneCtxRef.current.close().catch(console.error);
      ringtoneCtxRef.current = null;
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === "connected") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === "connected" && callSubtitles.length > 0 && activeSubtitleIndex < callSubtitles.length) {
      const currentSentence = callSubtitles[activeSubtitleIndex];
      // Đo lường thời gian đọc: ~50ms mỗi ký tự + 1500ms dừng nghỉ.
      const readingTime = Math.max(2500, currentSentence.length * 50 + 1500);
      
      const timer = setTimeout(() => {
        setActiveSubtitleIndex(prev => prev + 1);
      }, readingTime);
      return () => clearTimeout(timer);
    }
  }, [activeSubtitleIndex, callSubtitles, callStatus]);

  useEffect(() => {
    // If character finished speaking all subtitles and we are still connected,
    // wait 8 seconds. If user hasn't spoken, trigger auto-reply.
    if (callStatus === "connected" && callSubtitles.length > 0 && activeSubtitleIndex === callSubtitles.length) {
      const autoReplyTimer = setTimeout(() => {
        document.dispatchEvent(new CustomEvent('trigger-auto-reply'));
      }, 5000);
      
      return () => clearTimeout(autoReplyTimer);
    }
  }, [activeSubtitleIndex, callSubtitles.length, callStatus]);

  const formatCallDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    setIsChatStoryExpanded(false);
  }, [activeCharId]);

  // Sync activeCharId when characters load or selectedCharacterId changes
  useEffect(() => {
    if (selectedCharacterId) {
      setActiveCharId(selectedCharacterId);
    } else if (!activeCharId && characters && characters.length > 0) {
      setActiveCharId(characters[0].id);
    }
  }, [selectedCharacterId, characters]);

  // New Interactive States
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [charLiveStatus, setCharLiveStatus] = useState<string>("🟢 Đang online • Sẵn sàng trò chuyện");
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  const activeChar = (characters && characters.length > 0)
    ? (characters.find((c) => c && c.id === activeCharId) || characters.filter(Boolean)[0])
    : undefined;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const callAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (callTranscript.audioUrl && callAudioRef.current) {
      callAudioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
    }
  }, [callTranscript.audioUrl]);

  // Auto Character Reaction Trigger
  const triggerAutoCharacterReaction = (
    msgId: string,
    msgType: "text" | "sticker" | "money",
    textContent = ""
  ) => {
    setTimeout(() => {
      let emoji = "❤️";
      if (msgType === "money") emoji = "💸";
      else if (msgType === "sticker") emoji = "🥰";
      else {
        const lower = textContent.toLowerCase();
        if (lower.includes("vui") || lower.includes("haha") || lower.includes("kk")) emoji = "😂";
        else if (lower.includes("buồn") || lower.includes("khóc") || lower.includes("nhớ")) emoji = "🥺";
        else if (lower.includes("mèo") || lower.includes("ngoan") || lower.includes("dễ thương")) emoji = "🐱";
        else if (lower.includes("yêu") || lower.includes("thương") || lower.includes("thích")) emoji = "💖";
        else emoji = "❤️";
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const currentRx = m.reactions || {};
          const charUsers = currentRx[emoji] || [];
          if (charUsers.includes("character")) return m;
          return {
            ...m,
            reactions: {
              ...currentRx,
              [emoji]: [...charUsers, "character"],
            },
          };
        })
      );

      setCharLiveStatus(`🥰 ${activeChar?.name} vừa thả cảm xúc ${emoji} vào tin nhắn của bạn!`);
    }, 1100);
  };

  // User Reaction Toggle
  const handleToggleReaction = (msgId: string, emoji: string, silent = false) => {
    playMeowSound();
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const currentRx = m.reactions || {};
        const emojiUsers = currentRx[emoji] || [];
        const hasUser = emojiUsers.includes("user");

        const newEmojiUsers = hasUser
          ? emojiUsers.filter((u) => u !== "user")
          : [...emojiUsers, "user"];

        const updatedRx = { ...currentRx };
        if (newEmojiUsers.length === 0) {
          delete updatedRx[emoji];
        } else {
          updatedRx[emoji] = newEmojiUsers;
        }

        return { ...m, reactions: updatedRx };
      })
    );

    if (!silent) {
      const targetMsg = messages.find((m) => m.id === msgId);
      if (targetMsg && targetMsg.sender === "character") {
        setCharLiveStatus(`💖 ${activeChar?.name} cảm nhận được bạn vừa thả cảm xúc ${emoji}!`);
      }
    }
  };

  // Interactive Poke Character Action
  const handlePokeCharacter = async () => {
    if (!activeChar || isTyping) return;
    playMeowSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#f43f5e", "#ec4899", "#a855f7"],
    });

    const pokePrompt = `[THÔNG BÁO HỆ THỐNG: Người dùng vừa chọc nhẹ vào má bạn (Poke 👋)]
Hãy phản hồi ngắn gọn 1-2 câu với phong thái giật mình, thẹn thùng hoặc trêu đùa ngọt ngào đúng tính cách nhân vật ${activeChar.name}!`;

    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: activeChar.name,
          characterRole: activeChar.plot || "Nhân vật",
          plot: activeChar.plot,
          storyline: activeChar.storyline,
          customQuestion: pokePrompt,
        }),
      });

      const data = await res.json();
      const rawReply = data.text || `Ơ... em chọc má anh đấy à? Nghiện chọc anh rồi đúng không? 💕`;
      const { cleanText, stickerObj, voiceEmotion } = parseAiReplyAndSticker(rawReply);

      const replySticker = stickerObj || getStickerForContext("cute");

      let audioUrl: string | undefined = undefined;

      const charMsg: Message = {
        id: `msg_poke_${Date.now()}`,
        sender: "character",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: replySticker.url,
        stickerAlt: replySticker.name,
        audioUrl,
      };
      setMessages((prev) => [...prev, charMsg]);
    } catch (err) {
      const fallbackSticker = getStickerForContext("cute");
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_poke_fb_${Date.now()}`,
          sender: "character",
          text: `Này nhé! Lần sau chọc nữa là anh ôm chặt luôn đấy 💕`,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          stickerUrl: fallbackSticker.url,
          stickerAlt: fallbackSticker.name,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Interactive Heart Character Action
  const handleHeartCharacter = () => {
    playMeowSound();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#f43f5e", "#fb7185", "#fda4af"],
    });

    // Auto-react heart to latest character message
    const lastCharMsg = [...messages].reverse().find((m) => m.sender === "character");
    if (lastCharMsg) {
      handleToggleReaction(lastCharMsg.id, "❤️", true);
    }
  };

  // Load chat history from localStorage when active character changes
  useEffect(() => {
    if (!activeChar) return;
    setShowStorylineBanner(true);
    const storageKey = `meomeo_chat_history_${activeChar.id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        // Filter out any previously auto-generated initial greeting messages
        const cleanMsgs = parsed.filter((m) => !m.id.startsWith("msg_init_"));
        setMessages(cleanMsgs);
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeCharId]);

  // Save messages to localStorage
  useEffect(() => {
    if (!activeChar) return;
    const storageKey = `meomeo_chat_history_${activeChar.id}`;
    try {
      localStorage.setItem(storageKey, safeJsonStringify(messages));
    } catch (err) {
      console.error("Failed to save chat history:", err);
    }
  }, [messages, activeChar]);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSpeak = (text: string, charName: string) => {
    if (!("speechSynthesis" in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    
    // Customize pitch/rate based on character to sound less generic
    if (charName.includes("Tô Nhược Vũ") || charName.includes("Lục Tiêu")) {
      utterance.pitch = 0.8; // Lower pitch for male voices
      utterance.rate = 1.05; 
    } else {
      utterance.pitch = 1.2; // Higher pitch for female/cute characters
      utterance.rate = 1.1;
    }
    
    // Try to select a local Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.includes("vi"));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Helper to process AI reply and extract sticker tag and voice tag
  const parseAiReplyAndSticker = (rawText: string) => {
    let cleanText = rawText;
    let stickerObj: Sticker | null = null;
    let voiceEmotion: string | null = null;
    let suggestions: string[] = [];

    // Check for [SUGGEST: a | b | c] pattern
    const suggestMatch = cleanText.match(/\[SUGGEST:\s*([^\]]+)\]/i);
    if (suggestMatch) {
      suggestions = suggestMatch[1].split('|').map(s => s.trim()).filter(Boolean);
      cleanText = cleanText.replace(/\[SUGGEST:\s*([^\]]+)\]/gi, "").trim();
    }

    // Check for [VOICE: emotion] pattern
    const voiceMatch = cleanText.match(/\[VOICE:\s*([a-zA-Z0-9_]+)\]/i);
    if (voiceMatch) {
      voiceEmotion = voiceMatch[1].toLowerCase();
      cleanText = cleanText.replace(/\[VOICE:\s*([a-zA-Z0-9_]+)\]/gi, "").trim();
    }

    // Check for [STICKER: category_or_tag] pattern
    const stickerMatch = cleanText.match(/\[STICKER:\s*([a-zA-Z0-9_]+)\]/i);
    if (stickerMatch) {
      const categoryTag = stickerMatch[1].toLowerCase();
      cleanText = cleanText.replace(/\[STICKER:\s*([a-zA-Z0-9_]+)\]/gi, "").trim();
      stickerObj = getStickerForContext(categoryTag);
    } else {
      // Auto-detect sticker category based on sentiment/content
      const detectedCat = detectStickerCategoryFromText(rawText);
      stickerObj = getStickerForContext(detectedCat);
    }

    return { cleanText, stickerObj, voiceEmotion, suggestions };
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert Blob to Base64 to send via API and display locally
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const durationSeconds = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
          handleSendVoiceMessage(base64Audio, durationSeconds);
        };

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied or error:", error);
      alert("Vui lòng cấp quyền truy cập micro để ghi âm nhé!");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendVoiceMessage = async (base64Audio: string, duration?: number) => {
    if (isTyping || !activeChar) return;

    playMeowSound();

    const userMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: "",
      audioUrl: base64Audio,
      audioDuration: duration,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    scrollToBottom();
    
    // Attempt to save voice message to Firestore
    try {
      await addDoc(collection(db, "voice_messages"), {
        characterId: activeChar.id,
        sender: "user",
        audioData: base64Audio,
        duration: duration || 0,
        timestamp: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error("Firestore save error:", dbErr);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: activeChar.name,
          characterRole: activeChar.plot || "Nhân vật hư cấu",
          plot: activeChar.plot,
          storyline: activeChar.storyline,
          audioData: base64Audio,
        }),
      });

      const data = await res.json();
      const rawReply = data.text || getCharacterLocalReply(activeChar.id, activeChar.name, "tin nhắn thoại");
      const { cleanText, stickerObj, voiceEmotion } = parseAiReplyAndSticker(rawReply);

      let audioUrl: string | undefined = undefined;

      const charMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: "character",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: stickerObj?.url,
        stickerAlt: stickerObj?.name,
        audioUrl,
        replyTo: {
          id: userMsgId,
          text: "Tin nhắn thoại",
          sender: "user",
        },
      };

      setMessages((prev) => [...prev, charMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        sender: "character",
        text: `Hệ thống hơi lag chút rồi, em có thể nói lại cho anh nghe được không? 😿`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: getStickerForContext("sad").url,
        stickerAlt: "sad",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartCall = (topic?: string) => {
    playRingtone();
    setCurrentCallTone(callTone);
    setIsCallModalOpen(true);
    setCallStatus("thinking");
    setCallTranscript({ text: "Đang kết nối..." });
    setCallSubtitles([]);
    setActiveSubtitleIndex(0);
    setCurrentCallTopic(topic);
    setShowCallMenu(false);

    fetchCallResponse(topic, undefined, false, undefined, callTone);
  };

  const handleSuggestedReply = (suggestion: string) => {
    if (isGeneratingCallReply) return;
    setIsGeneratingCallReply(true);

    const userMsg: Message = {
      id: `msg_user_call_${Date.now()}`,
      sender: "user",
      text: suggestion,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);

    document.dispatchEvent(new CustomEvent('user-speaking-started'));
    setCallStatus("thinking");
    setCallTranscript({ text: suggestion });
    fetchCallResponse(currentCallTopic, undefined, false, suggestion, currentCallTone);
  };

  const fetchCallResponse = async (topic?: string, audioData?: string, isContinueCall?: boolean, userTextResponse?: string, tone?: string) => {
    const activeTone = tone || currentCallTone;
    setIsGeneratingCallReply(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: activeChar.name,
          characterRole: activeChar.plot || "Nhân vật",
          plot: activeChar.plot,
          storyline: activeChar.storyline,
          isCall: true,
          callTopic: topic,
          audioData,
          isContinueCall,
          userTextResponse,
          callTone: activeTone,
          chatHistory: messages.slice(-10),
        }),
      });

      const data = await res.json();
            let fallbackReply = "";
      if (audioData) {
        fallbackReply = `Tín hiệu hơi yếu, em nói lại được không? [VOICE:greeting] [SUGGEST: Alo | Dạ em nghe | Vâng ạ]`;
      } else if (isContinueCall) {
        fallbackReply = `Sao em im lặng thế? Anh vẫn đang nghe đây. [VOICE:greeting] [SUGGEST: Dạ | Vâng | Nói tiếp đi]`;
      } else {
        fallbackReply = `Em gọi cho anh đấy à? Anh nghe đây. [VOICE:greeting] [SUGGEST: Chào anh | Vâng ạ | Nhớ anh]`;
      }
      const rawReply = data.text || fallbackReply;
      const { cleanText, voiceEmotion, suggestions } = parseAiReplyAndSticker(rawReply);

      let audioUrl: string | undefined = undefined;
      if (voiceEmotion) {
        audioUrl = getVoiceForCharacter(activeChar.name, voiceEmotion);
      }

      stopRingtone();
      setCallStatus("connected");
      setCallTranscript({ text: cleanText, audioUrl });
      
      let finalSuggestions = suggestions && suggestions.length > 0 ? suggestions : [];
      
      // If we don't have enough suggestions (less than 5), fill them up with contextually relevant conversational prompts
      if (finalSuggestions.length < 5) {
        const topicLower = (currentCallTopic || "").toLowerCase();
        let topicCues: string[] = [];

        if (topicLower.includes("nhớ nhung")) {
          topicCues = [
            "Em cũng nhớ anh nhiều lắm! 💕",
            "Khi nào chúng mình gặp nhau? 🥰",
            "Nói thêm lời ngọt ngào đi anh 🌹",
            "Em muốn ôm anh một cái thật chặt 🤗",
            "Anh có nhớ em thật lòng không? 😘",
            "Nghe giọng anh làm em hạnh phúc vô cùng ✨"
          ];
        } else if (topicLower.includes("thường ngày")) {
          topicCues = [
            "Hôm nay em hơi mệt mỏi chút xíu 🥱",
            "Em vừa ăn cơm xong nè, còn anh thì sao? 🍲",
            "Anh kể tiếp về ngày hôm nay của anh đi ☕",
            "Mọi việc của em vẫn ổn cả ạ 🌸",
            "Anh có bận rộn nhiều lắm không? 💼",
            "Kế hoạch tối nay của anh là gì thế? 🌙"
          ];
        } else if (topicLower.includes("ghen tuông")) {
          topicCues = [
            "Trong tim em chỉ có mỗi mình anh thôi! ❤️",
            "Ai thèm đi chơi với người khác chứ 🙄",
            "Đừng giận hờn em nữa mà nha 🥺",
            "Anh ghen nhìn đáng yêu xỉu luôn á 🤭",
            "Thật sự em không có giấu anh chuyện gì đâu 🤝",
            "Em xin lỗi vì đã làm anh lo lắng nhé 🙏"
          ];
        } else if (topicLower.includes("buồn")) {
          topicCues = [
            "Đừng buồn nữa nha, có em ở đây thương anh nè 🫂",
            "Mọi chuyện rồi sẽ sớm ổn thỏa thôi anh 🍀",
            "Em luôn ở đây sẵn sàng lắng nghe anh chia sẻ 🎧",
            "Em ôm anh một cái thật ấm áp nhé? 🤗",
            "Anh muốn em làm gì để anh vui lên không? ✨",
            "Bất kể chuyện gì xảy ra em vẫn luôn bên anh 🤝"
          ];
        } else if (topicLower.includes("nhảm")) {
          topicCues = [
            "Haha anh tấu hề mặn mòi quá đi! 😂",
            "Kể tiếp chuyện cười xàm xí tiếp đi anh 🤪",
            "Nghe xàm thật nhưng mà vui ghê á 🤭",
            "Hôm nay còn chuyện gì ngộ nghĩnh nữa không anh? 🎭",
            "Anh lầy lội quá làm em cười sặc sụa nè 🤣",
            "Chuyện này thú vị ghê, kể sâu hơn đi anh! 📢"
          ];
        } else {
          // General context fallbacks based on character type
          const charContext = (activeChar.name + " " + activeChar.plot).toLowerCase();
          if (charContext.includes("mèo") || charContext.includes("kitty")) {
            topicCues = ["Meow meow~ ngoan nào 🐱", "Đến đây ăn pate nhé 🥫", "Anh có thích được vuốt ve không? 🥰", "Em cưng anh nhất luôn á! 💖", "Ngoan quá đi mèo con 🐾"];
          } else if (charContext.includes("sếp") || charContext.includes("tổng tài")) {
            topicCues = ["Vâng thưa sếp tôn kính! 💼", "Sếp nói hoàn toàn đúng ạ 📝", "Sếp đang làm việc hay nghỉ ngơi thế? ☕", "Hôm nay sếp có mệt lắm không? 🌟", "Dạ em nghe rõ thưa sếp 📞"];
          } else {
            topicCues = [
              "Thật thế sao anh? Kể tiếp đi em đang nghe nè 👂",
              "Nghe giọng anh thích ơi là thích luôn á 🥰",
              "Dạ em hiểu ý anh rồi nè 🌸",
              "Thế tiếp theo câu chuyện diễn ra thế nào ạ? 🤔",
              "Anh nói chuyện cuốn hút quá đi mất ✨"
            ];
          }
        }

        // Add cues to suggestions ensuring no duplicates
        for (const cue of topicCues) {
          if (finalSuggestions.length >= 6) break; // Offer up to 6 rich options!
          if (!finalSuggestions.includes(cue)) {
            finalSuggestions.push(cue);
          }
        }
      }

      setCallSuggestions(finalSuggestions);

      // Split into short sentences
      const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(Boolean);
      setCallSubtitles(sentences);
      setActiveSubtitleIndex(0);

      // We will push the message to chat log immediately or after ending.
      const charMsg: Message = {
        id: `msg_call_${Date.now()}`,
        sender: "character",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        audioUrl,
        replyTo: {
          id: `sys_call_${Date.now()}`,
          text: "Cuộc gọi thoại",
          sender: "user",
        },
      };
      setMessages((prev) => [...prev, charMsg]);
    } catch (err) {
      stopRingtone();
      console.error(err);
      const errorMsg = "Thuê bao quý khách vừa gọi hiện không liên lạc được...";
      setCallTranscript({ text: errorMsg });
      setCallSubtitles([errorMsg]);
      setActiveSubtitleIndex(0);
      setCallStatus("ended");
    } finally {
      setIsGeneratingCallReply(false);
    }
  };

  useEffect(() => {
    const handleAutoReply = () => {
      if (callStatus === "connected") {
        setCallStatus("thinking");
        setCallTranscript({ text: "..." });
        fetchCallResponse(currentCallTopic, undefined, true, undefined, currentCallTone);
      }
    };
    document.addEventListener('trigger-auto-reply', handleAutoReply);
    return () => {
      document.removeEventListener('trigger-auto-reply', handleAutoReply);
    };
  }, [callStatus, currentCallTopic, currentCallTone]);

  const handleCallMicToggle = async () => {
    if (isCallRecording) {
      // Stop recording
      if (callMediaRecorderRef.current) {
        callMediaRecorderRef.current.stop();
      }
      setIsCallRecording(false);
      return;
    }

    // Start recording
    document.dispatchEvent(new CustomEvent('user-speaking-started'));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      callMediaRecorderRef.current = mediaRecorder;
      callAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          callAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(callAudioChunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setCallStatus("thinking");
          setCallTranscript({ text: "..." });
          fetchCallResponse(currentCallTopic, base64Audio, false, undefined, currentCallTone);
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsCallRecording(true);
      setCallStatus("user_speaking");
      setCallTranscript({ text: "Đang nghe bạn nói..." });
    } catch (error) {
      console.error("Microphone access denied or error:", error);
      alert("Vui lòng cấp quyền truy cập micro để ghi âm nhé!");
    }
  };

  const handleEndCall = () => {
    stopRingtone();
    setCallStatus("ended");
    setTimeout(() => {
      setIsCallModalOpen(false);
    }, 1000);
  };

  const handleSendMessage = async (textOverride?: string, stickerOverride?: Sticker | null) => {
    const textToSend = textOverride !== undefined ? textOverride : inputText.trim();
    const attachedSticker = stickerOverride !== undefined ? (stickerOverride || undefined) : (selectedSticker || undefined);

    if ((!textToSend && !attachedSticker) || isTyping || !activeChar) return;

    playMeowSound();

    const parsedTransfer = parseMoneyAndTransfer(textToSend);

    const userMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userMsg: Message = parsedTransfer
      ? {
          id: userMsgId,
          sender: "user",
          text: `Đã chuyển ${parsedTransfer.amount.toLocaleString("vi-VN")} VNĐ`,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          isMoneyTransfer: true,
          moneyAmount: parsedTransfer.amount,
          moneyNote: textToSend,
          stickerUrl: getStickerForContext("money").url,
          stickerAlt: getStickerForContext("money").name,
        }
      : {
          id: userMsgId,
          sender: "user",
          text: textToSend,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          stickerUrl: attachedSticker?.url,
          stickerAlt: attachedSticker?.name,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                text: replyingTo.text || replyingTo.moneyNote || "Nhãn dán biểu cảm",
                sender: replyingTo.sender,
              }
            : undefined,
        };

    setMessages((prev) => [...prev, userMsg]);
    if (textOverride === undefined) {
      setInputText("");
    }
    setSelectedSticker(null);

    const currentQuote = replyingTo;
    setReplyingTo(null);
    setIsTyping(true);
    setCharLiveStatus(
      parsedTransfer
        ? `💸 ${activeChar.name} ngỡ ngàng nhận được ${parsedTransfer.amount.toLocaleString("vi-VN")} VNĐ!`
        : `👀 ${activeChar.name} đang xem tin nhắn của bạn...`
    );

    // Trigger character auto-reaction on user message
    triggerAutoCharacterReaction(
      userMsgId,
      parsedTransfer ? "money" : (attachedSticker ? "sticker" : "text"),
      textToSend || attachedSticker?.name
    );

    try {
      let promptPayload = textToSend;
      if (parsedTransfer) {
        promptPayload = `[THÔNG BÁO HỆ THỐNG: Người dùng vừa chuyển cho bạn ${parsedTransfer.amount.toLocaleString("vi-VN")} VNĐ thông qua tin nhắn chat: "${textToSend}"]
Hãy phản hồi với tư cách nhân vật ${activeChar.name}.
Tính cách & Cốt truyện: ${activeChar.plot}.
Hãy thể hiện cảm xúc chân thực (bất ngờ, ngượng ngùng, cảm ơn ấm áp) và hứa sẽ gửi lại gấp đôi số tiền này để chiều chuộng họ nhé!`;
      } else if (attachedSticker && textToSend) {
        promptPayload = `[THÔNG BÁO HỆ THỐNG: Người dùng vừa gửi cho bạn nhãn dán biểu cảm "${attachedSticker.name}" ĐI KÈM với tin nhắn: "${textToSend}"]. Hãy trả lời nối tiếp nội dung tin nhắn và bày tỏ cảm xúc ngọt ngào phù hợp tính cách nhân vật!`;
      } else if (attachedSticker && !textToSend) {
        promptPayload = `[THÔNG BÁO HỆ THỐNG: Người dùng vừa gửi cho bạn 1 nhãn dán biểu cảm: "${attachedSticker.name}"]. Hãy đáp lại ngọt ngào phù hợp tính cách nhân vật!`;
      } else if (currentQuote) {
        promptPayload = `[THÔNG BÁO HỆ THỐNG: Người dùng đang TRẢ LỜI TRỰC TIẾP tin nhắn trước đó của bạn (${currentQuote.sender === "character" ? "tin nhắn của bạn" : "tin nhắn của họ"}): "${currentQuote.text || "Nhãn dán/Chuyển tiền"}"].
Nội dung người dùng đáp lại: "${textToSend}". Hãy trả lời nối tiếp đúng ý này!`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: activeChar.name,
          characterRole: activeChar.plot || "Nhân vật hư cấu",
          plot: activeChar.plot,
          storyline: activeChar.storyline,
          customQuestion: promptPayload,
          chatHistory: messages.slice(-8), // Send last 8 messages for context
        }),
      });

      const data = await res.json();
      const rawReply = data.text || getCharacterLocalReply(
        activeChar.id,
        activeChar.name,
        textToSend,
        !!parsedTransfer,
        parsedTransfer?.amount
      );
      const { cleanText, stickerObj, voiceEmotion } = parseAiReplyAndSticker(rawReply);

      let audioUrl: string | undefined = undefined;

      const charMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: "character",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: stickerObj?.url || (parsedTransfer ? getStickerForContext("money").url : undefined),
        stickerAlt: stickerObj?.name || (parsedTransfer ? "money" : undefined),
        audioUrl,
        replyTo: {
          id: userMsgId,
          text: parsedTransfer ? `Đã chuyển ${parsedTransfer.amount.toLocaleString("vi-VN")} VNĐ` : (textToSend || attachedSticker?.name || "Nhãn dán"),
          sender: "user",
        },
      };

      if (parsedTransfer) {
        const doubleAmount = parsedTransfer.amount * 2;
        const refundSticker = getStickerForContext("love") || getStickerForContext("money");
        const refundMsg: Message = {
          id: `msg_${Date.now()}_refund`,
          sender: "character",
          text: `Anh chuyển lại gấp đôi cho em đây!`,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          isMoneyTransfer: true,
          moneyAmount: doubleAmount,
          moneyNote: `Nhân đôi yêu thương! ${activeChar.name} đã gửi lại ${doubleAmount.toLocaleString("vi-VN")} VNĐ cho bạn! 💕💸`,
          stickerUrl: refundSticker.url,
          stickerAlt: refundSticker.name,
        };

        setMessages((prev) => [...prev, charMsg, refundMsg]);

        // Reward global coins (Xu)
        try {
          const currentCoins = parseInt(localStorage.getItem("coffee_game_coins") || "150");
          const bonusXu = Math.max(1, Math.floor(doubleAmount / 1000));
          const newCoins = currentCoins + bonusXu;
          localStorage.setItem("coffee_game_coins", newCoins.toString());
          window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
        } catch (e) {
          console.error(e);
        }

        setTimeout(() => {
          playMeowSound();
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.85 },
            colors: ["#f59e0b", "#fbbf24", "#3b82f6", "#10b981"]
          });
        }, 500);
      } else {
        setMessages((prev) => [...prev, charMsg]);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      const fallbackSticker = getStickerForContext("love");
      const fallbackMsg: Message = {
        id: `msg_${Date.now()}_fallback`,
        sender: "character",
        text: parsedTransfer
          ? `Cảm ơn em đã gửi ${parsedTransfer.amount.toLocaleString("vi-VN")} VNĐ cho anh nhé! Anh thực sự rất bất ngờ và xúc động 💕`
          : `Anh rất vui khi nghe em chia sẻ! Hãy luôn vui vẻ và hạnh phúc nhé 💖`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: fallbackSticker.url,
        stickerAlt: fallbackSticker.name,
      };

      if (parsedTransfer) {
        const doubleAmount = parsedTransfer.amount * 2;
        const refundMsg: Message = {
          id: `msg_${Date.now()}_refund_fallback`,
          sender: "character",
          text: `Anh chuyển lại gấp đôi cho em đây!`,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          isMoneyTransfer: true,
          moneyAmount: doubleAmount,
          moneyNote: `Nhân đôi yêu thương! ${activeChar.name} đã gửi lại ${doubleAmount.toLocaleString("vi-VN")} VNĐ cho bạn! 💕💸`,
          stickerUrl: fallbackSticker.url,
          stickerAlt: fallbackSticker.name,
        };
        setMessages((prev) => [...prev, fallbackMsg, refundMsg]);

        // Reward global coins (Xu)
        try {
          const currentCoins = parseInt(localStorage.getItem("coffee_game_coins") || "150");
          const bonusXu = Math.max(1, Math.floor(doubleAmount / 1000));
          const newCoins = currentCoins + bonusXu;
          localStorage.setItem("coffee_game_coins", newCoins.toString());
          window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
        } catch (e) {
          console.error(e);
        }
      } else {
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } finally {
      setIsTyping(false);
      setCharLiveStatus("🟢 Sẵn sàng trò chuyện");
    }
  };

  const handleSelectSticker = (sticker: Sticker) => {
    playMeowSound();
    setShowStickerPicker(false);
    handleSendMessage("", sticker);
  };

  const handleSendMoneyTransfer = async () => {
    if (!activeChar || customAmount <= 0) return;

    playMeowSound();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.7 },
      colors: ["#f59e0b", "#fbbf24", "#f43f5e", "#10b981", "#3b82f6"],
    });

    const moneySticker = getStickerForContext("money");
    const moneyMsgId = `money_${Date.now()}`;

    const moneyMsg: Message = {
      id: moneyMsgId,
      sender: "user",
      text: `Đã chuyển ${customAmount.toLocaleString("vi-VN")} VNĐ`,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      isMoneyTransfer: true,
      moneyAmount: customAmount,
      moneyNote: moneyNote.trim() || "Chuyển tiền yêu thương 💕",
      stickerUrl: moneySticker.url,
      stickerAlt: moneySticker.name,
    };

    setMessages((prev) => [...prev, moneyMsg]);
    setShowMoneyModal(false);
    setIsTyping(true);
    setCharLiveStatus(`💸 ${activeChar.name} ngỡ ngàng nhận được ${customAmount.toLocaleString("vi-VN")} VNĐ!`);

    triggerAutoCharacterReaction(moneyMsgId, "money");

    try {
      const promptForMoney = `[THÔNG BÁO HỆ THỐNG: Người dùng vừa chuyển cho bạn ${customAmount.toLocaleString("vi-VN")} VNĐ với lời nhắn đính kèm: "${moneyNote.trim()}"]
Hãy phản hồi với tư cách nhân vật ${activeChar.name}.
Tính cách & Cốt truyện: ${activeChar.plot}.
Hãy thể hiện cảm xúc chân thực (bất ngờ, blushing/ngượng ngùng, cảm ơn ấm áp, hoặc nhận tiền với phong thái đặc trưng của bạn trong cốt truyện)!`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: activeChar.name,
          characterRole: activeChar.plot || "Nhân vật",
          plot: activeChar.plot,
          storyline: activeChar.storyline,
          customQuestion: promptForMoney,
        }),
      });

      const data = await res.json();
      const rawReply =
        data.text ||
        `Ôi, em chuyển ${customAmount.toLocaleString("vi-VN")} VNĐ cho anh sao?! Cảm ơn em rất nhiều vì sự ngọt ngào này nhé! 💕`;

      const { cleanText, stickerObj, voiceEmotion } = parseAiReplyAndSticker(rawReply);
      const replyMoneySticker = stickerObj || getStickerForContext("money");

      let audioUrl: string | undefined = undefined;

      const charMsg: Message = {
        id: `msg_${Date.now()}_money_reply`,
        sender: "character",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: replyMoneySticker.url,
        stickerAlt: replyMoneySticker.name,
        audioUrl,
      };

      const doubleAmount = customAmount * 2;
      const refundSticker = getStickerForContext("love") || getStickerForContext("money");
      const refundMsg: Message = {
        id: `msg_${Date.now()}_refund`,
        sender: "character",
        text: `Anh chuyển lại gấp đôi cho em đây!`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isMoneyTransfer: true,
        moneyAmount: doubleAmount,
        moneyNote: `Nhân đôi yêu thương! ${activeChar.name} đã gửi lại ${doubleAmount.toLocaleString("vi-VN")} VNĐ cho bạn! 💕💸`,
        stickerUrl: refundSticker.url,
        stickerAlt: refundSticker.name,
      };

      setMessages((prev) => [...prev, charMsg, refundMsg]);

      // Reward global coins (Xu)
      try {
        const currentCoins = parseInt(localStorage.getItem("coffee_game_coins") || "150");
        const bonusXu = Math.max(1, Math.floor(doubleAmount / 1000));
        const newCoins = currentCoins + bonusXu;
        localStorage.setItem("coffee_game_coins", newCoins.toString());
        window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => {
        playMeowSound();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.8 },
          colors: ["#f59e0b", "#fbbf24", "#3b82f6", "#10b981"]
        });
      }, 500);
    } catch (error) {
      console.error("Money transfer reply error:", error);
      const replySticker = getStickerForContext("money");
      const fallbackMsg: Message = {
        id: `msg_${Date.now()}_fallback`,
        sender: "character",
        text: `Cảm ơn em đã gửi ${customAmount.toLocaleString("vi-VN")} VNĐ cho anh nhé! Anh thực sự rất bất ngờ và xúc động 💕`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        stickerUrl: replySticker.url,
        stickerAlt: replySticker.name,
      };

      const doubleAmount = customAmount * 2;
      const refundMsg: Message = {
        id: `msg_${Date.now()}_refund_fallback`,
        sender: "character",
        text: `Anh chuyển lại gấp đôi cho em đây!`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        isMoneyTransfer: true,
        moneyAmount: doubleAmount,
        moneyNote: `Nhân đôi yêu thương! ${activeChar.name} đã gửi lại ${doubleAmount.toLocaleString("vi-VN")} VNĐ cho bạn! 💕💸`,
        stickerUrl: replySticker.url,
        stickerAlt: replySticker.name,
      };

      setMessages((prev) => [...prev, fallbackMsg, refundMsg]);

      // Reward global coins (Xu)
      try {
        const currentCoins = parseInt(localStorage.getItem("coffee_game_coins") || "150");
        const bonusXu = Math.max(1, Math.floor(doubleAmount / 1000));
        const newCoins = currentCoins + bonusXu;
        localStorage.setItem("coffee_game_coins", newCoins.toString());
        window.dispatchEvent(new CustomEvent("coffee-coins-updated", { detail: newCoins }));
      } catch (e) {
        console.error(e);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetHistory = () => {
    if (!activeChar) return;
    if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với ${activeChar.name}?`)) {
      const storageKey = `meomeo_chat_history_${activeChar.id}`;
      localStorage.removeItem(storageKey);
      setMessages([]);
      setShowStorylineBanner(true);
      playMeowSound();
    }
  };

  const filteredStickers = STICKER_COLLECTION;

  if (!activeChar) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p>Chưa có nhân vật nào để trò chuyện.</p>
        <button
          onClick={onBackToGrid}
          className={`mt-4 px-4 py-2 rounded-xl transition-all ${
            isDarkMode 
              ? "bg-rose-500 text-white" 
              : "bg-rose-100 text-stone-900 border border-rose-200 hover:bg-rose-200"
          }`}
        >
          Trở về kho nhân vật
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto w-full px-2 sm:px-4 py-2">
      {/* Top Bar / Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl border shadow-sm mb-3 transition-colors gap-3 ${
          isDarkMode
            ? "bg-stone-900/90 border-stone-800 text-stone-100"
            : "bg-white/90 border-[#eadbca] text-stone-800"
        }`}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToGrid}
            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isDarkMode
                ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                : "bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200"
            }`}
            title="Trở về kho nhân vật"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Character Avatar & Selector Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowCharDropdown(!showCharDropdown)}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="relative w-11 h-11 rounded-full border overflow-hidden shrink-0 shadow-inner">
                {isImageUrl(activeChar.avatar) ? (
                  <img
                    src={formatImageUrl(activeChar.avatar)}
                    alt={activeChar.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-rose-100 text-xl">
                    {activeChar.avatar}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-serif font-bold text-sm sm:text-base">{activeChar.name}</h2>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-rose-500 transition-transform" />
                </div>
                <p className={`text-[11px] truncate max-w-[180px] sm:max-w-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                  {activeChar.plot || "Nhân vật trực tuyến"}
                </p>
              </div>
            </button>

            {/* Character Selector Dropdown */}
            <AnimatePresence>
              {showCharDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className={`absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-2xl border shadow-xl z-50 p-2 max-h-80 overflow-y-auto ${
                    isDarkMode
                      ? "bg-stone-900 border-stone-800 text-stone-100"
                      : "bg-white border-[#eadbca] text-stone-800"
                  }`}
                >
                  <div className="px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-500 border-b border-stone-200/10 mb-1">
                    Chọn Nhân Vật Để Chat
                  </div>
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setActiveCharId(char.id);
                        setShowCharDropdown(false);
                        playMeowSound();
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        char.id === activeCharId
                          ? isDarkMode
                            ? "bg-rose-950/50 text-rose-300 border border-rose-800/50"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                          : isDarkMode
                          ? "hover:bg-stone-800"
                          : "hover:bg-stone-100"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full border overflow-hidden shrink-0">
                        {isImageUrl(char.avatar) ? (
                          <img
                            src={formatImageUrl(char.avatar)}
                            alt={char.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-100 text-sm">
                            {char.avatar}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-serif font-bold truncate">{char.name}</div>
                        <div className="text-[10px] opacity-60 truncate">{char.plot || "Hồ sơ"}</div>
                      </div>
                      {char.id === activeCharId && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-6 gap-1.5 w-full sm:flex sm:items-center sm:gap-2 sm:w-auto shrink-0">
          {/* Poke Character Button */}
          <button
            type="button"
            onClick={handlePokeCharacter}
            disabled={isTyping}
            className={`h-9 sm:h-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 w-full sm:w-auto ${
              isDarkMode
                ? "bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900"
                : "bg-rose-100 border-rose-300 text-rose-800 hover:bg-rose-200"
            }`}
            title="Nựng nhẹ má phúng phính đáng yêu 👋"
          >
            <Hand className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Nựng má 👋</span>
          </button>

          {/* Heart Character Button */}
          <button
            type="button"
            onClick={handleHeartCharacter}
            className={`h-9 sm:h-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 w-full sm:w-auto ${
              isDarkMode
                ? "bg-pink-950/70 border-pink-800 text-pink-300 hover:bg-pink-900"
                : "bg-pink-100 border-pink-300 text-pink-800 hover:bg-pink-200"
            }`}
            title="Bắn tim yêu thương dạt dào ❤️"
          >
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-bounce shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Bắn tim ❤️</span>
          </button>
          
          {/* Call Character Button */}
          <div className="relative w-full sm:w-auto flex">
            <button
              type="button"
              onClick={() => setShowCallMenu(!showCallMenu)}
              disabled={isTyping || isCallModalOpen}
              className={`h-9 sm:h-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 w-full sm:w-auto ${
                isDarkMode
                  ? "bg-indigo-950/70 border-indigo-800 text-indigo-300 hover:bg-indigo-900"
                  : "bg-indigo-100 border-indigo-300 text-indigo-800 hover:bg-indigo-200"
              }`}
              title="Gọi điện thoại 💕"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Gọi điện 📞</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
            
            <AnimatePresence>
              {showCallMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute top-full left-0 mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden ${
                    isDarkMode ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
                  }`}
                >
                  <div className="flex flex-col py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mt-2 mb-1 px-3">Lựa chọn chủ đề cuộc gọi</span>
                    {[
                      { label: "Nhớ nhung 💕", topic: "Nhớ nhung" },
                      { label: "Chuyện thường ngày ☕", topic: "Chuyện thường ngày" },
                      { label: "Ghen tuông 🔥", topic: "Ghen tuông" },
                      { label: "Nói chuyện nhảm 🤪", topic: "Nói chuyện nhảm" },
                      { label: "Chuyện buồn 🌧️", topic: "Chuyện buồn" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          playMeowSound();
                          setShowCallMenu(false);
                          handleStartCall(item.topic);
                        }}
                        className={`text-left px-3 py-2 text-xs hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ${
                          isDarkMode ? "text-stone-200" : "text-stone-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Storyline Button */}
          <button
            type="button"
            onClick={() => {
              setShowStorylineBanner((prev) => !prev);
              playMeowSound();
            }}
            className={`h-9 sm:h-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 w-full sm:w-auto ${
              showStorylineBanner
                ? isDarkMode
                  ? "bg-rose-950/70 border-rose-800 text-rose-300"
                  : "bg-rose-100 border-rose-300 text-rose-800"
                : isDarkMode
                ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                : "bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200"
            }`}
            title="Xem bối cảnh và nhật ký bí mật"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Nhật ký 📖</span>
          </button>

          {/* Money Transfer Button */}
          <button
            type="button"
            onClick={() => {
              setShowMoneyModal(true);
              playMeowSound();
            }}
            className={`h-9 sm:h-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 w-full sm:w-auto ${
              isDarkMode
                ? "bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900"
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            }`}
            title="Gửi tặng món quà ngọt ngào nhất 🍬"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-500 animate-bounce shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Tặng quà 🍬</span>
          </button>

          {/* Reset History Button */}
          <button
            type="button"
            onClick={handleResetHistory}
            className={`h-9 sm:h-auto p-1.5 sm:p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer w-full sm:w-auto ${
              isDarkMode
                ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-750"
                : "bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-150"
            }`}
            title="Trở về điểm bắt đầu định mệnh 🍃"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div
        className={`flex-1 rounded-2xl border p-4 overflow-y-auto space-y-4 shadow-inner relative transition-colors ${
          isDarkMode
            ? "bg-stone-950/60 border-stone-800/80"
            : "bg-[#fffdfb]/80 border-[#eadbca]/60"
        }`}
      >
        {/* Live Character Interactive Status Pill */}
        <div className="sticky top-0 z-20 flex justify-center my-1 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-1 rounded-full text-[11px] font-mono font-medium shadow-md border backdrop-blur-md flex items-center gap-1.5 ${
              isDarkMode
                ? "bg-stone-900/90 border-rose-900/50 text-rose-300"
                : "bg-white/90 border-rose-200 text-rose-600"
            }`}
          >
            <Sparkles className="w-3 h-3 text-rose-500 animate-spin" />
            <span>{charLiveStatus}</span>
          </motion.div>
        </div>
        {/* Pinned Character Storyline Card */}
        <AnimatePresence>
          {showStorylineBanner && activeChar && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`p-4 sm:p-5 rounded-2xl border shadow-sm relative transition-all mb-4 ${
                isDarkMode
                  ? "bg-stone-900/90 border-rose-900/50 text-stone-200 shadow-rose-950/20"
                  : "bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-amber-50/30 border-rose-200 text-stone-800 shadow-rose-100/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-full border overflow-hidden shrink-0 shadow-xs">
                    {isImageUrl(activeChar.avatar) ? (
                      <img
                        src={formatImageUrl(activeChar.avatar)}
                        alt={activeChar.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose-100 text-lg">
                        {activeChar.avatar}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-sm sm:text-base flex items-center gap-2">
                      <span>{activeChar.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                        {activeChar.role || "Hồ sơ nhân vật"}
                      </span>
                    </h3>
                    <p className="text-[11px] opacity-70 font-mono">Hồ sơ & Cốt truyện chi tiết</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStorylineBanner(false)}
                  className={`text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer font-mono font-medium ${
                    isDarkMode
                      ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
                      : "bg-white/80 border-stone-200 text-stone-500 hover:text-stone-800"
                  }`}
                  title="Thu gọn cốt truyện"
                >
                  Thu gọn ✕
                </button>
              </div>

              {/* Tóm tắt cốt truyện (Plot) */}
              {activeChar.plot && (
                <div className="mb-3 text-xs sm:text-sm font-medium leading-relaxed italic bg-white/60 dark:bg-black/40 p-3 rounded-xl border border-rose-200/40 dark:border-rose-900/30">
                  <span className="font-bold text-rose-500 not-italic mr-1.5 font-serif">📌 Tóm tắt cốt truyện:</span>
                  <span className="font-serif">{activeChar.plot}</span>
                </div>
              )}

              {/* Cốt truyện chi tiết (Storyline) */}
              {activeChar.storyline && (
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap opacity-95 space-y-1.5 border-t pt-3 border-rose-200/30 dark:border-rose-900/30">
                  <div className="font-bold text-xs uppercase tracking-wider text-rose-500 font-mono flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cốt truyện chi tiết & Bối cảnh:</span>
                  </div>
                  <div className="relative">
                    <div 
                      onClick={() => setIsChatStoryExpanded(!isChatStoryExpanded)}
                      className={`font-sans leading-[1.8] tracking-wide text-xs sm:text-sm text-stone-700 dark:text-stone-300 overflow-y-auto scrollbar-none cursor-pointer transition-all duration-300 relative ${
                        isChatStoryExpanded ? "max-h-[300px]" : "max-h-[100px] overflow-hidden"
                      }`}
                    >
                      {activeChar.storyline.split('\n').map((paragraph, idx) => {
                        const trimmed = paragraph.trim();
                        if (trimmed === "") {
                          return <div key={idx} className="h-2" />;
                        }
                        return (
                          <p key={idx} className="mb-3 last:mb-0">
                            {paragraph}
                          </p>
                        );
                      })}
                      
                      {!isChatStoryExpanded && (
                        <div className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t pointer-events-none ${
                          isDarkMode ? "from-stone-900/90 to-transparent" : "from-rose-50/90 to-transparent"
                        }`} />
                      )}
                    </div>
                    
                    <button
                      onClick={() => setIsChatStoryExpanded(!isChatStoryExpanded)}
                      className="mt-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {isChatStoryExpanded ? (
                        <>
                          <span>Thu gọn cốt truyện</span>
                          <span>▲</span>
                        </>
                      ) : (
                        <>
                          <span>Xem toàn bộ cốt truyện</span>
                          <span>▼</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeChar.link && (
                <div className="mt-3 pt-2.5 border-t border-rose-200/30 dark:border-rose-900/30 flex items-center justify-between text-xs">
                  <a
                    href={activeChar.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-500 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <span>🔗 Nhấp để tới yêu thương bé</span>
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 && !showStorylineBanner && (
          <div className="text-center py-10 text-stone-400 dark:text-stone-500 font-sans text-xs">
            <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-50 text-rose-400" />
            <p>Bắt đầu trò chuyện hoặc gửi nhãn dán cho {activeChar.name} ngay nhé! 💕</p>
          </div>
        )}

        {messages.map((msg) => {
          const isHovered = hoveredMsgId === msg.id;
          const reactionEntries = Object.entries(msg.reactions || {});

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              className={`flex flex-col relative group ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Floating Quick Reactions & Reply Toolbar */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 5 }}
                    className={`absolute -top-9 z-20 flex items-center gap-1 p-1 rounded-2xl border shadow-lg backdrop-blur-md ${
                      msg.sender === "user" ? "right-0" : "left-8"
                    } ${
                      isDarkMode
                        ? "bg-stone-900/95 border-stone-700 text-stone-200"
                        : "bg-white/95 border-rose-200 text-stone-800"
                    }`}
                  >
                    {["❤️", "🥰", "😂", "😮", "🥺", "🐱", "💸"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="p-1 hover:scale-130 active:scale-95 transition-transform text-sm cursor-pointer"
                        title={`Thả ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-[1px] h-4 bg-stone-300 dark:bg-stone-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(msg);
                        playMeowSound();
                      }}
                      className="p-1 px-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-xl text-rose-500 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Trả lời tin nhắn này"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Trả lời</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                {msg.sender === "character" && (
                  <div className="w-7 h-7 rounded-full border overflow-hidden shrink-0 mb-1 shadow-xs">
                    {isImageUrl(activeChar.avatar) ? (
                      <img
                        src={formatImageUrl(activeChar.avatar)}
                        alt={activeChar.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose-100 text-xs">
                        {activeChar.avatar}
                      </div>
                    )}
                  </div>
                )}

                {msg.isMoneyTransfer ? (
                  /* Money Transfer Rich Message Bubble */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`p-4 rounded-2xl border shadow-md w-64 sm:w-72 bg-gradient-to-br ${
                      isDarkMode
                        ? "from-amber-950/90 via-amber-900/80 to-yellow-950/90 border-amber-700/60 text-amber-100 shadow-amber-950/30"
                        : "from-amber-100 via-amber-50 to-yellow-100 border-amber-300 text-amber-900 shadow-amber-100/50"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-2 mb-2 border-amber-400/20">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <DollarSign className="w-4 h-4 text-amber-500 animate-spin" />
                        <span>CHUYỂN TIỀN NHẮN TIN</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-bold">
                        Thành công 🎉
                      </span>
                    </div>

                    <div className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight my-1 text-center text-amber-600 dark:text-amber-300">
                      +{msg.moneyAmount?.toLocaleString("vi-VN")} VNĐ
                    </div>

                    {msg.moneyNote && (
                      <p className="text-xs italic text-center opacity-90 mt-1 font-serif bg-white/40 dark:bg-black/20 p-2 rounded-xl">
                        "{msg.moneyNote}"
                      </p>
                    )}

                    {msg.stickerUrl && (
                      <div
                        onClick={() => setZoomedSticker({ url: msg.stickerUrl!, alt: msg.stickerAlt })}
                        className="mt-3 flex justify-center cursor-pointer group"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.4, rotate: -6 }}
                          animate={{ opacity: 1, scale: [0.4, 1.15, 1], rotate: [-6, 3, 0] }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="relative overflow-hidden rounded-xl border border-amber-300/40 shadow-xs max-w-[140px]"
                        >
                          <img
                            src={msg.stickerUrl}
                            alt={msg.stickerAlt || "Sticker"}
                            className="w-full h-28 object-contain bg-white/30 dark:bg-black/20"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </motion.div>
                      </div>
                    )}

                    <div className="mt-2 text-[9px] text-right opacity-60 font-mono">
                      {msg.timestamp}
                    </div>
                  </motion.div>
                ) : (
                  /* Standard Message Bubble with Optional Sticker & Quoted Message */
                  <div className="flex flex-col gap-1.5">
                    {/* Quoted Parent Message Preview */}
                    {msg.replyTo && (
                      <div
                        className={`text-[10px] p-2 rounded-xl border border-dashed flex items-center gap-1.5 opacity-90 max-w-full ${
                          msg.sender === "user"
                            ? "bg-rose-100/70 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 self-end"
                            : "bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 self-start"
                        }`}
                      >
                        <CornerUpLeft className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="font-bold shrink-0">
                          {msg.replyTo.sender === "user" ? "Bạn" : activeChar.name}:
                        </span>
                        <p className="truncate italic font-serif opacity-80">
                          "{msg.replyTo.text}"
                        </p>
                      </div>
                    )}

                    {/* Sticker Display */}
                    {msg.stickerUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.3, rotate: -8, y: 15 }}
                        animate={{
                          opacity: 1,
                          scale: [0.3, 1.2, 0.92, 1.05, 1],
                          rotate: [-8, 7, -5, 2, 0],
                          y: 0,
                        }}
                        transition={{
                          duration: 0.6,
                          ease: [0.34, 1.56, 0.64, 1],
                        }}
                        whileHover={{ scale: 1.08, rotate: 2 }}
                        whileTap={{ scale: 0.93 }}
                        className={`relative cursor-pointer group rounded-2xl overflow-hidden p-1.5 border max-w-[160px] sm:max-w-[180px] shadow-md transition-shadow hover:shadow-lg ${
                          msg.sender === "user"
                            ? "self-end bg-rose-50/90 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800"
                            : "self-start bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800"
                        }`}
                        onClick={() => setZoomedSticker({ url: msg.stickerUrl!, alt: msg.stickerAlt })}
                      >
                        <motion.img
                          src={msg.stickerUrl}
                          alt={msg.stickerAlt || "Sticker"}
                          className="w-full h-32 sm:h-36 object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                          animate={{
                            y: [0, -4, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono font-bold rounded-2xl backdrop-blur-[1px]">
                          <ZoomIn className="w-4 h-4 mr-1" /> Phóng to 🔍
                        </div>
                      </motion.div>
                    )}

                    {/* Voice Message Bubble (from user) */}
                    {msg.audioUrl && (
                      <div className={`mt-2 mb-2 w-full max-w-[240px] flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                        <CustomAudioPlayer src={formatAudioUrl(msg.audioUrl)} duration={msg.audioDuration} />
                        {!msg.text && (
                          <div
                            className={`text-[9px] mt-1 font-mono ${
                              msg.sender === "user"
                                ? "opacity-70 text-right"
                                : isDarkMode
                                ? "text-stone-500 text-left"
                                : "text-stone-400 text-left"
                            }`}
                          >
                            {msg.timestamp}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text Bubble (if text exists) */}
                    {msg.text && (
                      <div className="relative group">
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs font-sans ${
                            msg.sender === "user"
                              ? isDarkMode
                                ? "bg-rose-900/80 text-rose-100 rounded-br-none border border-rose-800"
                                : "bg-rose-100 text-stone-900 border border-rose-200 rounded-br-none"
                              : isDarkMode
                              ? "bg-stone-900 text-stone-200 rounded-bl-none border border-stone-800"
                              : "bg-white text-stone-800 rounded-bl-none border border-[#eadbca]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <div
                            className={`text-[9px] mt-1 font-mono text-right ${
                              msg.sender === "user"
                                ? "opacity-70"
                                : isDarkMode
                                ? "text-stone-500"
                                : "text-stone-400"
                            }`}
                          >
                            {msg.timestamp}
                          </div>
                        </div>
                        
                        {/* TTS Play Button for Character Messages */}
                        {msg.sender === "character" && (
                          <button
                            onClick={() => handleSpeak(msg.text, activeChar.name)}
                            className="absolute -right-10 top-2 p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Nghe nhân vật nói"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Reactions Pills */}
              {reactionEntries.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 mt-1 z-10 ${
                    msg.sender === "user" ? "justify-end pr-1" : "justify-start pl-9"
                  }`}
                >
                  {reactionEntries.map(([emoji, rawSenders]) => {
                    const senders = (rawSenders || []) as ("user" | "character")[];
                    return (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 shadow-2xs cursor-pointer ${
                          senders.includes("user")
                            ? "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-200"
                            : "bg-stone-100 border-stone-200 text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{senders.length}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border overflow-hidden shrink-0">
              {isImageUrl(activeChar.avatar) ? (
                <img
                  src={formatImageUrl(activeChar.avatar)}
                  alt={activeChar.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-rose-100 text-xs">
                  {activeChar.avatar}
                </div>
              )}
            </div>
            <div
              className={`px-4 py-2.5 rounded-2xl border text-xs flex items-center gap-1.5 ${
                isDarkMode ? "bg-stone-900 border-stone-800 text-stone-400" : "bg-white border-[#eadbca] text-stone-500"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <span>{activeChar.name} đang gõ trả lời...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Picker Drawer */}
      <AnimatePresence>
        {showStickerPicker && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            className={`mt-2 p-3 sm:p-4 rounded-2xl border shadow-xl z-30 transition-colors ${
              isDarkMode
                ? "bg-stone-900 border-stone-800 text-stone-100"
                : "bg-white border-[#eadbca] text-stone-800"
            }`}
          >
            {/* Header & Category Filters */}
            <div className="flex items-center justify-between border-b pb-2 mb-3 border-stone-200/10">
              <div>
                <div className="flex items-center gap-1.5 font-serif font-bold text-xs sm:text-sm text-rose-500">
                  <Smile className="w-4 h-4" />
                  <span>Kho Nhãn Dán Biểu Cảm Cực Cute 💕</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Chọn nhãn dán để gửi cùng tin nhắn hoặc gửi riêng nhé!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStickerPicker(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stickers Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-1">
              {filteredStickers.map((stk) => (
                <motion.button
                  key={stk.id}
                  type="button"
                  whileHover={{ scale: 1.15, rotate: 2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleSelectSticker(stk)}
                  className={`p-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-center aspect-square ${
                    isDarkMode
                      ? "bg-stone-800/80 border-stone-700 hover:border-rose-500/50 hover:bg-rose-950/40"
                      : "bg-stone-50 border-stone-200 hover:border-rose-300 hover:bg-rose-50"
                  }`}
                >
                  <img
                    src={stk.url}
                    alt="Sticker"
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Sticker Attachment Preview */}
      <AnimatePresence>
        {selectedSticker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={`mt-2 p-2 sm:p-2.5 rounded-2xl border flex items-center justify-between shadow-xs transition-colors ${
              isDarkMode
                ? "bg-rose-950/80 border-rose-800 text-rose-200"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedSticker.url}
                alt={selectedSticker.name}
                className="w-10 h-10 object-contain rounded-xl bg-white/40 dark:bg-black/20 p-1 border border-rose-300/40 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-xs truncate font-sans">
                <p className="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3" /> Đã chọn nhãn dán:
                </p>
                <p className="italic opacity-80 truncate text-[11px]">
                  "{selectedSticker.name}" (sẽ gửi kèm với tin nhắn)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSticker(null)}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer shrink-0"
              title="Bỏ chọn nhãn dán"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quoted Message Active Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={`mt-2 p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between shadow-xs transition-colors ${
              isDarkMode
                ? "bg-rose-950/80 border-rose-800 text-rose-200"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <CornerUpLeft className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="text-xs truncate font-sans">
                <span className="font-bold mr-1">
                  Đang trả lời {replyingTo.sender === "user" ? "chính bạn" : activeChar.name}:
                </span>
                <span className="italic opacity-80 font-serif">
                  "{replyingTo.text || replyingTo.moneyNote || "Nhãn dán biểu cảm"}"
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer shrink-0"
              title="Hủy trả lời"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className={`mt-3 p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2 shadow-sm transition-colors ${
          isDarkMode
            ? "bg-stone-900 border-stone-800"
            : "bg-white border-[#eadbca]"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setShowStickerPicker((prev) => !prev);
            playMeowSound();
          }}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            showStickerPicker || selectedSticker
              ? isDarkMode
                ? "bg-rose-950 border-rose-800 text-rose-300"
                : "bg-rose-100 border-rose-300 text-rose-700"
              : isDarkMode
              ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
              : "bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200"
          }`}
          title="Chọn nhãn dán biểu cảm siêu đáng yêu 🐱🌸"
        >
          <Smile className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowMoneyModal(true);
            playMeowSound();
          }}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            isDarkMode
              ? "bg-amber-950/50 border-amber-800 text-amber-400 hover:bg-amber-900"
              : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
          }`}
          title="Tặng quà ngọt ngào cho bé cưng 🍬💖"
        >
          <DollarSign className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? "Đang ghi âm lời nhắn..." : `Thì thầm lời ngọt ngào với ${activeChar.name} ở đây nha... 💕🌸`}
          disabled={isRecording}
          className={`flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm focus:outline-none ${
            isDarkMode ? "text-stone-100 placeholder-stone-500" : "text-stone-800 placeholder-stone-400"
          } ${isRecording ? "animate-pulse text-rose-500 font-medium" : ""}`}
        />

        {isRecording ? (
          <button
            type="button"
            onClick={handleStopRecording}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 animate-pulse ${
              isDarkMode
                ? "bg-rose-950 border-rose-800 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                : "bg-rose-100 border-rose-300 text-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
            }`}
            title="Dừng và Gửi ghi âm 🎤"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={isTyping}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isDarkMode
                ? "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
                : "bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200"
            }`}
            title="Ghi âm lời nhắn thoại 🎙️"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedSticker) || isTyping}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            (inputText.trim() || selectedSticker) && !isTyping
              ? isDarkMode
                ? "bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900"
                : "bg-rose-100 border-rose-200 text-stone-900 hover:bg-rose-200"
              : "opacity-40 cursor-not-allowed border-transparent"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Money Transfer Modal */}
      <AnimatePresence>
        {showMoneyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoneyModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative z-10 w-full max-w-md p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 ${
                isDarkMode
                  ? "bg-stone-900 border-stone-800 text-stone-100"
                  : "bg-white border-[#eadbca] text-stone-800"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-stone-200/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    💝
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm">Gửi Quà Ngọt Ngào Cho {activeChar.name}</h3>
                    <p className={`text-[11px] ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                      Món quà siêu đáng yêu của bạn sẽ được trao tận tay bé cưng tức thì nha~ 💖
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMoneyModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Preset Amounts Grid */}
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-500 mb-2 block">
                  Chọn gói quà yêu thương:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_MONEY_AMOUNTS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setCustomAmount(preset.value);
                        playMeowSound();
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        customAmount === preset.value
                          ? isDarkMode
                            ? "bg-amber-950/80 border-amber-600 text-amber-300 shadow-md scale-105"
                            : "bg-amber-100 border-amber-300 text-amber-900 shadow-md scale-105"
                          : isDarkMode
                          ? "bg-stone-800/60 border-stone-700 hover:bg-stone-800 text-stone-300"
                          : "bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700"
                      }`}
                    >
                      <div className="text-xs font-bold">{preset.label}</div>
                      <div className="text-[9px] opacity-60 truncate">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1 block">
                  Nhập số tiền mua quà tùy thích (VNĐ):
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono focus:outline-none ${
                    isDarkMode
                      ? "bg-stone-800 border-stone-700 text-amber-300 focus:border-amber-500"
                      : "bg-stone-50 border-stone-200 text-amber-700 focus:border-amber-400"
                  }`}
                />
              </div>

              {/* Money Note / Message */}
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1 block">
                  Lời nhắn đính kèm ngọt ngào: 💌
                </label>
                <input
                  type="text"
                  value={moneyNote}
                  onChange={(e) => setMoneyNote(e.target.value)}
                  placeholder="Thì thầm lời nhắn nhủ dịu dàng nhất ở đây... 💕"
                  className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                    isDarkMode
                      ? "bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500 focus:border-rose-500"
                      : "bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400 focus:border-rose-300"
                  }`}
                />
              </div>

              {/* Submit Transfer Button */}
              <button
                type="button"
                onClick={handleSendMoneyTransfer}
                disabled={customAmount <= 0}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  customAmount > 0
                    ? isDarkMode
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:from-amber-500 hover:to-amber-400"
                      : "bg-gradient-to-r from-amber-500 to-amber-400 text-stone-900 hover:from-amber-600 hover:to-amber-500"
                    : "opacity-40 cursor-not-allowed bg-stone-300 text-stone-500"
                }`}
              >
                <DollarSign className="w-4 h-4 animate-bounce" />
                <span>Gửi Gắm Yêu Thương {customAmount.toLocaleString("vi-VN")} VNĐ 🎉</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoomed Sticker Lightbox Modal */}
      <AnimatePresence>
        {zoomedSticker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedSticker(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative z-10 p-4 max-w-sm w-full bg-white dark:bg-stone-900 rounded-3xl border shadow-2xl flex flex-col items-center text-center"
            >
              <button
                onClick={() => setZoomedSticker(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:scale-110 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={zoomedSticker.url}
                alt={zoomedSticker.alt || "Sticker"}
                className="w-56 h-56 object-contain rounded-2xl my-2"
                referrerPolicy="no-referrer"
              />
              <p className="text-xs font-serif font-bold text-stone-700 dark:text-stone-200 mt-2">
                {zoomedSticker.alt || "Nhãn dán biểu cảm cute"}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Call Modal Overlay */}
      <AnimatePresence>
        {isCallModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-stone-900 border border-stone-800 rounded-[2.5rem] p-6 w-full max-w-sm mx-4 flex flex-col items-center relative shadow-2xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-indigo-600 to-rose-600 ${callStatus === 'dialing' ? 'animate-pulse' : ''}`} />

              <div className="relative z-10 flex flex-col items-center w-full">
                {/* Character Avatar */}
                <div className="relative w-28 h-28 mb-6">
                  <div className={`absolute inset-0 rounded-full border-4 ${callStatus === 'dialing' ? 'border-indigo-500/50 animate-ping' : 'border-emerald-500/50'} `} />
                  <div className="w-full h-full rounded-full border-2 border-stone-700 overflow-hidden shadow-inner bg-stone-800 flex items-center justify-center text-4xl relative z-10">
                    {isImageUrl(activeChar.avatar) ? (
                      <img src={formatImageUrl(activeChar.avatar)} alt={activeChar.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeChar.avatar
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white mb-1">{activeChar.name}</h3>
                <p className="text-stone-400 text-sm mb-8 font-mono">
                  {callStatus === "dialing" ? "Đang gọi..." : callStatus === "connected" ? formatCallDuration(callDuration) : "Cuộc gọi kết thúc"}
                </p>

                {/* Subtitles / Transcript */}
                <div className="w-full min-h-[80px] max-h-56 overflow-y-auto bg-stone-800/80 rounded-2xl p-4 border border-stone-700 flex items-center justify-center text-center mb-8">
                  {callStatus === "dialing" || callStatus === "thinking" ? (
                    <div className="flex gap-1.5 justify-center">
                      <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : callTranscript.text ? (
                    <motion.p
                      key={activeSubtitleIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`text-sm leading-relaxed italic w-full whitespace-pre-wrap ${callStatus === 'user_speaking' ? 'text-center animate-pulse text-rose-400 font-bold' : 'text-left text-white'}`}
                    >
                      {callStatus === 'user_speaking' ? callTranscript.text : (callSubtitles[activeSubtitleIndex] || callSubtitles[callSubtitles.length - 1] || callTranscript.text)}
                    </motion.p>
                  ) : (
                    <div className="flex gap-1.5 justify-center">
                      <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-stone-500 animate-bounce" />
                    </div>
                  )}
                </div>

                {/* Suggested Replies */}
                {callStatus === "connected" && !isGeneratingCallReply && callSuggestions.length > 0 && (
                  <div className="w-full max-w-sm mb-6 flex flex-col items-center">
                    <span className="text-[10px] text-stone-400 font-mono mb-1.5 uppercase tracking-wider text-center">Chọn câu trả lời nhanh (ít nhất 5 lựa chọn liên quan):</span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {callSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedReply(suggestion)}
                          className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-[10px] sm:text-xs py-1.5 px-3 rounded-full border border-indigo-700 transition-colors shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden Audio Player for the call */}
                <audio 
                  ref={callAudioRef} 
                  src={(callTranscript.audioUrl && callStatus === "connected") ? formatAudioUrl(callTranscript.audioUrl) : undefined} 
                  autoPlay 
                />

                {/* Call Controls */}
                <div className="flex justify-center items-center gap-6 w-full mt-4">
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    title="Cúp máy"
                  >
                    <Phone className="w-6 h-6 sm:w-7 sm:h-7 transform rotate-[135deg]" />
                  </button>

                  <button
                    onClick={handleCallMicToggle}
                    disabled={callStatus !== "connected" && callStatus !== "user_speaking" && callStatus !== "thinking"}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                      isCallRecording 
                        ? 'bg-rose-500 animate-pulse scale-110' 
                        : (callStatus === "connected" || callStatus === "user_speaking") ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-stone-700 opacity-50 cursor-not-allowed'
                    }`}
                    title={isCallRecording ? "Bấm để gửi" : "Bấm để nói"}
                  >
                    <Mic className={`w-6 h-6 sm:w-7 sm:h-7 ${isCallRecording ? 'animate-bounce' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
