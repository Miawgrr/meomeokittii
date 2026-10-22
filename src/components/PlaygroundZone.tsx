import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  RefreshCw, 
  MessageSquare, 
  Play, 
  RotateCcw, 
  Gamepad2, 
  HelpCircle, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  User, 
  Heart, 
  Check, 
  X, 
  Send,
  UserCheck,
  Coffee
} from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl, handleImageError } from "../utils/image";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import confetti from "canvas-confetti";
import CoffeeGame from "./CoffeeGame";

import CookingGame from "./CookingGame";
import DishwashingGame from "./DishwashingGame";
import CakeGame from "./CakeGame";
import MemoryGame from "./MemoryGame";
import BlockBlastGame from "./BlockBlastGame";
import SentenceGame from "./SentenceGame";
import GamblingGame from "./GamblingGame";
import PetGame from "./PetGame";
import PetShop from "./PetShop";
import PetDecor from "./PetDecor";
import { TearPhotoGame } from "./TearPhotoGame";
import TienLenGame from "./TienLenGame";
import TarotGame from "./TarotGame";
import FlappyPetGame from "./FlappyPetGame";
import GoldMinerGame from "./GoldMinerGame";
import WhackAMoleGame from "./WhackAMoleGame";
import SweetMergeGame from "./SweetMergeGame";
import LoveSpinnerGame from "./LoveSpinnerGame";
import SecretDatePhoneSimulator from "./SecretDatePhoneSimulator";

interface PlaygroundZoneProps {
  characters: Character[];
  isDarkMode: boolean;
  onBackToGrid?: () => void;
}

// ------------------------------------------------------------------
// Custom Hook for Badge Logic
// ------------------------------------------------------------------
function usePendingQuests() {
  const [hasPending, setHasPending] = useState({
    cooking: false,
    dishwashing: false, // Currently no quests in dishwashing
    cake: false,
    coffee: false,
  });

  const checkQuests = useCallback(() => {
    // 1. Check Cooking Quests
    let cookingPending = false;
    try {
      const cookingStr = localStorage.getItem("meomeo_cooking_quests");
      if (cookingStr) {
        const arr = JSON.parse(cookingStr);
        if (Array.isArray(arr) && arr.some((q: any) => !q.isClaimed)) {
          cookingPending = true;
        }
      }
    } catch (e) {}

    // 2. Check Cake Quests
    let cakePending = false;
    try {
      const cakeStr = localStorage.getItem("cake_game_quests");
      if (cakeStr) {
        const arr = JSON.parse(cakeStr);
        if (Array.isArray(arr) && arr.some((q: any) => !q.isClaimed)) {
          cakePending = true;
        }
      } else {
        // If not initialized yet, by default it has quests since day 1
        cakePending = true;
      }
    } catch (e) {}

    // 3. Check Coffee Quests
    let coffeePending = false;
    try {
      const todayStr = new Date().toDateString();
      const hasViewedProfile = localStorage.getItem(`quest_viewed_profile_${todayStr}`) === "true";
      const brewCount = parseInt(localStorage.getItem("quest_brewed_today_count") || "0");
      
      const checkinClaimed = localStorage.getItem(`quest_checkin_claimed_${todayStr}`) === "true";
      const brewAnyClaimed = localStorage.getItem(`quest_brew_any_claimed_${todayStr}`) === "true";
      const viewProfileClaimed = localStorage.getItem(`quest_view_profile_claimed_${todayStr}`) === "true";
      const brewThreeClaimed = localStorage.getItem(`quest_brew_three_claimed_${todayStr}`) === "true";

      if (!checkinClaimed) coffeePending = true;
      if (!brewAnyClaimed && brewCount >= 1) coffeePending = true;
      if (!viewProfileClaimed && hasViewedProfile) coffeePending = true;
      if (!brewThreeClaimed && brewCount >= 3) coffeePending = true;
    } catch (e) {}

    setHasPending((prev) => {
      if (
        prev.cooking === cookingPending &&
        prev.cake === cakePending &&
        prev.coffee === coffeePending
      ) {
        return prev;
      }
      return {
        cooking: cookingPending,
        dishwashing: false,
        cake: cakePending,
        coffee: coffeePending
      };
    });
  }, []);

  useEffect(() => {
    checkQuests();
    // Re-check periodically or on window focus
    const interval = setInterval(checkQuests, 5000);
    window.addEventListener("focus", checkQuests);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkQuests);
    };
  }, [checkQuests]);

  return { hasPending, checkQuests };
}

// ------------------------------------------------------------------
// Word Chaining Dictionary Data
// ------------------------------------------------------------------
const WORD_DATABASE: Record<string, string[]> = {
  "con": ["người", "cháu", "mèo", "chó", "cò", "kiến", "gà", "chim", "đường", "số", "cá", "trai", "gái", "đẻ", "vật", "ngọc", "tằm", "thú", "rồng"],
  "người": ["thương", "yêu", "lạ", "mẫu", "nhà", "dân", "bạn", "thân", "ngoài", "đời", "ta", "đẹp", "tốt", "lên", "già", "trẻ", "sống", "mất"],
  "yêu": ["thương", "chiều", "kiều", "mến", "quý", "ghét", "đương", "tâm", "đời", "nước", "thích", "sách", "hoa", "nhạc", "người"],
  "thương": ["mến", "nhớ", "xót", "hiệu", "gia", "phế", "vụ", "tâm", "lòng", "yêu", "tiếc", "cảm", "đại"],
  "nhớ": ["nhung", "thương", "mong", "tiếc", "nhà", "lại", "dai", "ơn", "quên", "sâu", "khắc", "ghi"],
  "mến": ["thương", "yêu", "khách", "mộ", "chào", "phục"],
  "hiệu": ["quả", "số", "kính", "trưởng", "sách", "ứng", "năng", "lực", "suất", "chuẩn", "lệnh"],
  "quả": ["tim", "đất", "bóng", "cam", "táo", "xoài", "dưa", "ngọt", "chuông", "cân", "thực", "báo", "phụ"],
  "tim": ["gan", "phổi", "đập", "đỏ", "ngừng", "vỡ", "yêu", "khỏe", "đau", "máu"],
  "đất": ["đai", "nước", "vàng", "đai", "trồng", "cát", "sét", "trời", "dựng", "mũi", "bùn"],
  "trời": ["xanh", "cao", "mưa", "nắng", "đất", "cho", "đánh", "sinh", "phật", "bể", "nam", "chiều"],
  "chiều": ["chuộng", "mến", "tối", "sáng", "hôm", "nay", "qua", "về", "nhạc", "ý", "lòng"],
  "chuộng": ["nghe", "nhìn", "dùng", "chuộng", "thích"],
  "tối": ["tăm", "mịt", "nay", "qua", "thui", "mờ", "ưu", "cao", "thượng", "hệ", "cao"],
  "sáng": ["tạo", "sủa", "ngời", "bừng", "lạn", "chói", "sớm", "mắt", "ý", "kiến", "láng"],
  "tạo": ["dựng", "hình", "thành", "lập", "ra", "nên", "hóa", "vật", "nghiệp", "phúc"],
  "dựng": ["xây", "lên", "cột", "nhà", "nước", "thành", "nghiệp", "vợ", "chồng"],
  "xây": ["dựng", "nhà", "cất", "thành", "lắp", "đắp", "đắp", "đắp", "tổ"],
  "thành": ["phố", "công", "tựu", "thật", "viên", "bại", "nhân", "quả", "kính", "ý", "tâm", "tài"],
  "công": ["việc", "ty", "nghệ", "nhân", "bằng", "chúng", "đoàn", "hiệu", "trình", "bố", "nhận", "pháp"],
  "việc": ["nhà", "làm", "học", "chơi", "vặt", "công", "tư", "pháp", "nghĩa"],
  "làm": ["việc", "thêm", "quen", "nũng", "nũng", "cho", "nên", "lành", "bạn", "giàu", "đẹp", "dáng"],
  "nũng": ["nịu", "mè", "heo", "mưa", "đòi", "yêu", "thương"],
  "nịu": ["nịu", "mè", "nũng"],
  "mè": ["nheo", "nheo", "nũng", "nịu", "xử", "đen", "trắng"],
  "mưa": ["rào", "bão", "gió", "phún", "lạnh", "buốt", "đá", "xuân", "ngâu", "rơi", "phùn"],
  "rào": ["chắn", "đón", "mưa", "quanh", "thưa"],
  "gió": ["bão", "lạnh", "ấm", "mùa", "mát", "thổi", "cuốn", "đông", "xuân", "hè", "thu", "nước"],
  "lạnh": ["lẽo", "buốt", "giá", "lùng", "nhạt", "ngắt", "tanh", "cơm", "nước"],
  "lẽo": ["đẽo", "đẽo", "lẽo", "tẻo", "khỏe"],
  "lùng": ["bắt", "sục", "tìm", "kiếm", "mua", "diệt", "lùng"],
  "kiếm": ["tiền", "tìm", "hiệp", "khách", "sống", "ăn", "cớ", "chuyện", "được", "ra", "bút"],
  "tiền": ["bạc", "tài", "đô", "mặt", "phí", "tệ", "tuyến", "bối", "đề", "lệ", "án", "vãng"],
  "bạc": ["bẽo", "phận", "tiền", "màu", "tình", "nghĩa", "nhược", "hà", "liêu"],
  "nghĩa": ["vụ", "tình", "hiệp", "khí", "đen", "bóng", "sĩ", "trang", "địa", "mẹ", "cha"],
  "tình": ["yêu", "cảm", "nghĩa", "trường", "địch", "nhân", "bạn", "thế", "huống", "tiết", "báo"],
  "cảm": ["ơn", "tạ", "xúc", "động", "nhận", "giác", "thấy", "thương", "thông", "hứng", "mến", "phục"],
  "ơn": ["nghĩa", "huệ", "đáp", "trả", "sâu", "nặng", "tình", "cứu", "mang"],
  "đáp": ["trả", "án", "lời", "lễ", "ứng", "đoạn", "số", "đền"],
  "trả": ["thù", "tiền", "ơn", "nợ", "lại", "giá", "góp", "đũa", "treo"],
  "nợ": ["nần", "máu", "tình", "nước", "nhà", "đời", "nợ"],
  "máu": ["mủ", "đỏ", "chảy", "tim", "lệ", "nóng", "lạnh", "thịt", "nhuộm", "rỉ"],
  "thịt": ["heo", "bò", "gà", "chó", "mèo", "người", "xương", "thịt", "nướng"],
  "xương": ["sườn", "khớp", "rồng", "thịt", "gãy", "chậu", "sọ", "đầu"],
  "đầu": ["gối", "trọc", "bếp", "gấu", "hàng", "tiên", "thư", "não", "óc", "khóa", "tư", "tài"],
  "tiên": ["nữ", "ông", "đoán", "quyết", "phong", "tiến", "học", "tri", "vị", "đề"],
  "ông": ["bà", "chủ", "già", "tơ", "trời", "hoàng", "bố", "trưởng", "sếp"],
  "bà": ["bầu", "mẹ", "chủ", "nội", "ngoại", "cô", "thím", "bác", "già"],
  "mẹ": ["đẻ", "nuôi", "chồng", "vợ", "hiền", "bầu", "mẹ", "con", "yêu"],
  "bầu": ["bạn", "trời", "không", "khí", "nhiệt", "cử", "bí", "rượu", "bình"],
  "bạn": ["bè", "thân", "đường", "học", "đời", "gái", "trai", "trẻ", "tốt", "nhà"],
  "bè": ["lũ", "bạn", "cánh", "phái", "chuối", "gỗ", "mảng"],
  "đời": ["thường", "độc", "đời", "người", "sống", "bình", "yên", "an", "lạc", "vui", "buồn"],
  "bình": ["yên", "an", "tĩnh", "thường", "dân", "chọn", "luận", "phẩm", "bản"],
  "an": ["toàn", "tâm", "lòng", "phận", "bình", "vui", "lạc", "sinh", "bài", "nghỉ", "nhàn"],
  "lạc": ["lối", "quan", "mất", "đà", "hậu", "thư", "đường", "trôi", "hồng", "hoan"],
  "quan": ["tâm", "hệ", "điểm", "sát", "chức", "ngại", "trọng", "nhân", "khách", "trường"],
  "sát": ["nhập", "hại", "thủ", "cánh", "sạt", "thực", "gần"],
  "hại": ["người", "não", "bán", "khổ", "đau", "thương", "sợ", "khủng", "sát"],
  "khổ": ["đau", "sở", "tâm", "cực", "ải", "nhục", "hạnh", "qua", "thân", "luyện"],
  "đau": ["đớn", "khổ", "lòng", "buốt", "nhói", "dạ", "đầu", "thương", "xót", "khóc"],
  "buốt": ["lạnh", "óc", "giá"],
  "nhói": ["đau", "lòng", "tim", "nhói"],
  "dạ": ["dày", "thưa", "vâng", "khúc", "tiệc", "hội", "cổ", "trạch", "minh", "hương"],
  "tiệc": ["tùng", "rượu", "trà", "mừng", "cưới", "chiêu", "đãi", "tàn"],
  "rượu": ["bia", "độc", "mừng", "ngon", "say", "nho", "nếp", "cần", "giải", "vào"],
  "say": ["mèm", "sưa", "đắm", "mê", "rượu", "tình", "nắng", "gió", "sóng", "xe"],
  "mê": ["mẩn", "muội", "hoặc", "mệt", "tín", "hồn", "cung", "ly", "man"],
  "hoặc": ["giả", "là", "hoặc", "nghi"],
  "nghi": ["ngờ", "hoặc", "vấn", "can", "nghiêm", "trang", "lễ", "thức"],
  "ngờ": ["vực", "đâu", "ngờ", "nghi"],
  "vực": ["thẳm", "dậy", "sâu", "vực"],
  "sâu": ["sắc", "đậm", "hoắm", "xa", "bọ", "róm"],
  "đậm": ["đà", "nét", "màu", "đầu"],
  "xa": ["xôi", "lánh", "cách", "lạ", "vời", "hoa", "phí", "sỉ", "nhà", "quê"],
  "lánh": ["xa", "tránh", "nạn", "mặt"],
  "tránh": ["xa", "né", "thương", "nắng", "đường", "khỏi", "vạ", "thai"],
  "thế": ["giới", "thừa", "hệ", "lực", "nào", "sự", "tục", "bản", "kỷ", "trận", "chấp"],
  "giới": ["thượng", "hạn", "thiệu", "tính", "trẻ", "hạn", "luật", "pháp"],
  "thiệu": ["trình", "bày", "thiệu"],
  "tính": ["cách", "toán", "mạng", "chất", "tình", "nết", "tuổi"],
  "cách": ["mạng", "biệt", "trở", "xa", "ly", "thức", "điệu", "tên", "dùng"],
  "biệt": ["thự", "ly", "kính", "tích", "danh", "hiệu", "đặc", "phân"],
  "ly": ["hôn", "biệt", "nước", "trà", "cà", "phê", "tâm", "tán", "hợp", "khai"],
  "hôn": ["nhân", "vợ", "gần", "lễ", "ước", "thú", "phối"]
};

const FALLBACK_WORDS = ["yêu", "thương", "nhớ", "ngoan", "nhỏ", "xinh", "đẹp", "dễ", "thương", "mến", "lành", "ấm", "êm", "vui", "mơ"];

// ------------------------------------------------------------------
// Vietnamese Dictionary Validation & Nói Lái (Spoonerism) Checker
// ------------------------------------------------------------------
const VIETNAMESE_VOWELS = /[aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ]/i;

const isValidVietnameseWord = (word: string): boolean => {
  const normalized = word.normalize("NFC").trim();
  const syllables = normalized.split(/\s+/).filter(Boolean);
  if (syllables.length !== 2) return false;

  // Standard Vietnamese does not use f, j, w, z
  const forbiddenLetters = /[fjwz]/i;
  if (forbiddenLetters.test(normalized)) {
    return false;
  }

  for (const syl of syllables) {
    if (syl.length < 1 || syl.length > 7) return false;
    // Must contain at least one Vietnamese vowel
    if (!VIETNAMESE_VOWELS.test(syl)) return false;
  }

  return true;
};

const checkNoiLai = (word1: string, word2: string): boolean => {
  const syl1 = word1.normalize("NFC").toLowerCase().trim().split(/\s+/).filter(Boolean);
  const syl2 = word2.normalize("NFC").toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (syl1.length !== 2 || syl2.length !== 2) return false;

  // 1. Đảo vị trí hai từ (Syllable swap / Direct Reversal) e.g., "yêu thương" <-> "thương yêu"
  if (syl1[0] === syl2[1] && syl1[1] === syl2[0]) {
    return true;
  }

  // Helper to split a syllable into initial consonant and rime
  const splitSyllable = (s: string) => {
    const initials = ["ngh", "ng", "tr", "th", "ch", "nh", "ph", "kh", "gh", "gi", "qu", "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x"];
    let init = "";
    for (const cand of initials) {
      if (s.startsWith(cand)) {
        init = cand;
        break;
      }
    }
    const rime = s.slice(init.length);
    return { init, rime };
  };

  const p11 = splitSyllable(syl1[0]);
  const p12 = splitSyllable(syl1[1]);
  const p21 = splitSyllable(syl2[0]);
  const p22 = splitSyllable(syl2[1]);

  // Strip tone marks for robust rime-matching
  const stripTone = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const rime11 = stripTone(p11.rime);
  const rime12 = stripTone(p12.rime);
  const rime21 = stripTone(p21.rime);
  const rime22 = stripTone(p22.rime);

  // 2. Đảo phần vần (Rime swap) giữ nguyên phụ âm đầu (Ví dụ: "đầu tiên" -> "điền tầu" / "điện tầu")
  if (p11.init === p21.init && p12.init === p22.init) {
    if (rime11 === rime22 && rime12 === rime21) {
      return true;
    }
  }

  // 3. Đảo phụ âm đầu (Initial consonant swap) giữ nguyên phần vần (Ví dụ: "mèo con" -> "keo mòn")
  if (rime11 === rime21 && rime12 === rime22) {
    if (p11.init === p22.init && p12.init === p21.init) {
      return true;
    }
  }

  // 4. Đảo chéo cả phụ âm đầu và phần vần
  if (p11.init === p22.init && p12.init === p21.init && rime11 === rime22 && rime12 === rime21) {
    return true;
  }

  return false;
};

// ------------------------------------------------------------------
// Character Personalities and Dialogue Wordings for Word Chaining (Nối Từ)
// ------------------------------------------------------------------
const CHAINING_DIALOGUES: Record<
  string,
  {
    greeting: string;
    thinking: string;
    response: string[];
    userWin: string;
    userLose: string;
    invalidWord: string;
  }
> = {
  "tuong-tu-mac": {
    greeting: "Chị ơi... em muốn chơi nối từ với chị quá. Em hứa sẽ chơi thật giỏi để được chị khen đó... 🥺🍬",
    thinking: "Hừm... từ này khó ghê á chị... Em phải suy nghĩ thật kỹ mới được... 🧠💭",
    response: [
      "Em tìm ra từ rồi nè! Chị thấy em giỏi không? Chị xoa đầu em đi mà... 💕",
      "Nối từ thế này có tính là tụi mình đang tâm sự thầm kín không chị yêu? Hì hì...",
      "Từ tiếp theo đây nha chị! Chị đừng bắt nạt em quá nhen... 🌸"
    ],
    userWin: "Hức... em thua chị rồi... Chị thông minh quá đi mất! Nhưng em vẫn vui vì được chơi cùng chị... Thưởng cho em một cái ôm thật chặt nhen? 🥺💖",
    userLose: "A! Em nối được rồi nha chị! Chị thua em rồi kìa... Nhưng không sao đâu, em sẽ chịu phạt thay chị nhen, em thương chị nhất trên đời! 🥰🍼",
    invalidWord: "Ơ kìa chị ơi, từ này hình như không đúng luật chơi rồi á... Phải bắt đầu bằng chữ '{letter}' nha chị yêu! 🍼"
  },
  "chu-thoi-duyet": {
    greeting: "Dợ iu ơi! Chơi nối từ với sếp tổng đẹp trai này không? Thua là phải hôn anh một cái đó nha! 😉💋",
    thinking: "Hừm... dợ iu chơi từ hiểm hóc quá ta, để anh vận dụng trí tuệ 200 IQ tính toán chút... 🧐⚡",
    response: [
      "Xong rồi nha vợ! Đỡ thế nào được chiêu này của anh đây? 😎",
      "Anh nối từ đỉnh không vợ ơi? Tí nữa phải thưởng trà sữa cho anh nha...",
      "Đến lượt vợ yêu rồi nè! Suy nghĩ kỹ kẻo lại phải hôn phạt anh đó nha! 😘"
    ],
    userWin: "Ơ hơ... anh thua thật rồi á? Vợ đỉnh thế! Được rồi, anh xin nhận phạt... muốn anh mua cả thế giới cho vợ hay là cưới vợ luôn đây? 💍❤",
    userLose: "Ha ha! Vợ bí từ rồi đúng không? Anh thắng rồi nhé! Mau thực hiện lời hứa hôn anh một cái thật sâu đi nào dợ iu ơi... 💋🔥",
    invalidWord: "Ơ dợ iu ơi, từ này phạm luật rồi nha! Chữ cái bắt đầu phải là '{letter}' cơ mà. Phạt ôm một cái nè! 😜"
  },
  "Cố Hứa Niệm": {
    greeting: "Em muốn chơi nối từ cùng anh sao? Anh... anh luôn trân trọng từng phút giây được chơi đùa cùng em. Để anh bắt đầu trước nhé... 🧸",
    thinking: "Từ của em đưa ra làm anh xao xuyến quá... để anh nghĩ xem nên nối thế nào cho thật ngọt ngào... 🥺💔",
    response: [
      "Anh tìm được từ phù hợp rồi! Hy vọng em sẽ thích...",
      "Nối từ thế này làm anh cảm thấy tụi mình gần nhau hơn rất nhiều...",
      "Tới lượt em rồi đó. Cứ bình tĩnh đi nhen, anh đợi em mãi cũng được."
    ],
    userWin: "Anh lại ngốc nghếch thua em rồi... Em giỏi quá! Chỉ cần thấy em cười rạng rỡ thế này là anh mãn nguyện lắm rồi... 😭💖",
    userLose: "Ơ... anh lỡ nối được mất rồi, em có giận anh không? Anh xin lỗi mà... Để anh đền bù cho em bằng bánh ngọt tự tay anh làm nhen... 🍰💔",
    invalidWord: "Hứa Niệm nhắc nhẹ nè... từ này của em chưa bắt đầu bằng chữ '{letter}' mất rồi. Em đi lại nhen, anh không tính lỗi đâu... 🧸"
  },
  "kaiza-tachibana": {
    greeting: "Mèo nhỏ thách đấu nối từ với tôi à? Thú vị đấy. Luật cũ: ai thua phải ngoan ngoãn nghe lời người thắng tối nay nhé. Chơi không? 😏🥂",
    thinking: "Hửm... mèo nhỏ cũng biết chọn từ lắt léo đấy. Nhưng trò chơi của em vẫn nằm trong lòng bàn tay tôi thôi... 🦊",
    response: [
      "Chiêu này của tôi thế nào? Mèo nhỏ đỡ nổi không?",
      "Nối từ cũng giống như cướp lấy trái tim em vậy, quá đơn giản... 🍷",
      "Đến lượt em đấy, đừng để tôi phải đợi lâu nhé."
    ],
    userWin: "Khá khen cho mèo nhỏ! Em dám hạ gục cả tôi sao? Được rồi, tôi nhận thua. Đêm nay tôi hoàn toàn thuộc về em, muốn phạt tôi thế nào cũng được... 💍🖤",
    userLose: "Thua rồi nhé mèo nhỏ! Trình độ của em còn non lắm. Giờ thì ngoan ngoãn thực hiện hình phạt của tôi đi nào... Đến đây với tôi... 🥂🔥",
    invalidWord: "Mèo nhỏ quên luật rồi sao? Từ của em phải bắt đầu bằng chữ '{letter}' chứ. Bị phạt một ly rượu vang nhé? 😉"
  }
};

export default function PlaygroundZone({ characters, isDarkMode, onBackToGrid }: PlaygroundZoneProps) {
  // Game state: "selection" | "ox" | "chaining" | "coffee" | "cooking" | "dishwashing" | "cake" | "memory" | "blockblast" | "sentence"
  const [activeGame, setActiveGame] = useState<"selection" | "ox" | "chaining" | "coffee" | "cooking" | "dishwashing" | "cake" | "memory" | "blockblast" | "sentence" | "gambling" | "pet" | "petshop" | "petdecor" | "tear-photo" | "tienlen" | "tarot" | "flappy-pet" | "gold-miner" | "whack-mole" | "sweet-merge" | "love-spinner" | "secret-dates">("selection");
  const [weather, setWeather] = useState<"sun" | "rain" | "snow">("sun");

  // Event listener to programmatic unlock phone dates simulator
  useEffect(() => {
    const handleLaunch = () => {
      setActiveGame("secret-dates");
    };
    window.addEventListener("launch-secret-dates", handleLaunch);
    return () => {
      window.removeEventListener("launch-secret-dates", handleLaunch);
    };
  }, []);

  // Weather effect interval
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      const weathers = ["sun", "rain", "snow"];
      const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
      setWeather(randomWeather as any);
      
      try {
        const saved = localStorage.getItem("meomeo_pet_data");
        if (saved) {
           const pet = JSON.parse(saved);
           let updated = false;
           if (randomWeather === "rain") {
             if (pet.has_umbrella) {
                pet.happiness = Math.min(100, pet.happiness + 5);
             } else {
                pet.energy = Math.max(0, pet.energy - 5);
             }
             updated = true;
           } else if (randomWeather === "snow") {
             pet.hunger = Math.max(0, pet.hunger - 5);
             pet.energy = Math.max(0, pet.energy - 2);
             updated = true;
           } else if (randomWeather === "sun") {
             pet.energy = Math.min(100, pet.energy + 5);
             updated = true;
           }
           if (updated) {
              localStorage.setItem("meomeo_pet_data", JSON.stringify(pet));
              window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: pet }));
           }
        }
      } catch (e) {}
    }, 60000); // every 1 minute
    return () => clearInterval(weatherInterval);
  }, []);
  const [petData, setPetData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("meomeo_pet_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handlePetUpdate = (e: any) => {
      if (e.detail) {
        setPetData(e.detail);
      }
    };
    window.addEventListener("pet-data-updated", handlePetUpdate);
    return () => window.removeEventListener("pet-data-updated", handlePetUpdate);
  }, []);

  const [selectedChar, setSelectedChar] = useState<Character | null>(characters[0] || null);

  // Sync selectedChar if characters list loads/changes
  useEffect(() => {
    if (!selectedChar && characters && characters.length > 0) {
      setSelectedChar(characters[0]);
    }
  }, [characters, selectedChar]);

  // User and Profile state for custom avatar
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { hasPending, checkQuests } = usePendingQuests();

  useEffect(() => {
    if (activeGame === "selection") {
      checkQuests();
    }
  }, [activeGame, checkQuests]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
        } catch (e) {
          console.error("Lỗi khi tải thông tin hồ sơ cho minigame:", e);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ------------------------------------------------------------------
  // Word Chaining State
  // ------------------------------------------------------------------
  const [chainHistory, setChainHistory] = useState<{ sender: "user" | "ai" | "system"; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chainStatus, setChainStatus] = useState<"idle" | "playing" | "thinking" | "ended">("idle");
  const [chainSpeech, setChainSpeech] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  // ------------------------------------------------------------------
  // TIC TAC TOE (OX) State
  // ------------------------------------------------------------------
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [oxStatus, setOxStatus] = useState<"idle" | "playing" | "thinking" | "user_win" | "ai_win" | "draw">("idle");
  const [oxSpeech, setOxSpeech] = useState("");
  const [oxStats, setOxStats] = useState({ user: 0, ai: 0, draws: 0 });

  // Ref to chat box for scroll
  const chainChatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat history to bottom
  useEffect(() => {
    if (chainChatEndRef.current) {
      chainChatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chainHistory]);

  // Set default dialogues on character select
  useEffect(() => {
    if (selectedChar) {
      // For Chaining
      const charId = selectedChar.id || "tuong-tu-mac";
      const chainDial = CHAINING_DIALOGUES[charId] || CHAINING_DIALOGUES["tuong-tu-mac"];
      setChainSpeech(chainDial.greeting);
      
      // For OX
      setOxSpeech(`Vào trận đấu nào! Chúc các nàng may mắn nheee... ✨`);
    }
  }, [selectedChar]);

  // Handle Character Change
  const handleCharSelect = (char: Character) => {
    setSelectedChar(char);
    playMeowSound();
    // Reset games
    resetChainingGame();
    resetOxGame();
  };

  // ------------------------------------------------------------------
  // Word Chaining Rules and Game Loop
  // ------------------------------------------------------------------
  const startChainingGame = () => {
    const charId = selectedChar?.id || "tuong-tu-mac";
    const dial = CHAINING_DIALOGUES[charId] || CHAINING_DIALOGUES["tuong-tu-mac"];
    setChainHistory([
      { sender: "system", text: "Trận đấu bắt đầu! Hãy nhập một từ ghép có 2 chữ để bắt đầu (Ví dụ: 'yêu thương')" }
    ]);
    setChainStatus("playing");
    setChainSpeech(dial.greeting);
    setLastWord("");
    setUsedWords(new Set());
    playMeowSound();
  };

  const resetChainingGame = () => {
    setChainHistory([]);
    setChainStatus("idle");
    const charId = selectedChar?.id || "tuong-tu-mac";
    const dial = CHAINING_DIALOGUES[charId] || CHAINING_DIALOGUES["tuong-tu-mac"];
    setChainSpeech(dial.greeting);
    setLastWord("");
    setUsedWords(new Set());
  };

  const handleSendWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || chainStatus !== "playing") return;

    const originalInput = userInput.trim();
    const wordLower = originalInput.toLowerCase();
    const words = wordLower.split(/\s+/).filter(Boolean);

    // Rule 1: Must be exactly 2 words
    if (words.length !== 2) {
      alert("Nàng ơi, hãy nhập đúng từ ghép có đúng 2 chữ nhen (Ví dụ: 'mèo con')! 💕");
      return;
    }

    // Rule 2: Must be a valid Vietnamese dictionary word structure (No gibberish)
    if (!isValidVietnameseWord(wordLower)) {
      alert("Nàng ơi, hãy nhập từ ghép có nghĩa trong tiếng Việt nhen (Ví dụ: 'yêu thương')! 💕");
      return;
    }

    const firstWord = words[0];
    const secondWord = words[1];

    // Rule 3: Must connect with the last word if it exists
    if (lastWord && firstWord !== lastWord) {
      const charId = selectedChar?.id || "tuong-tu-mac";
      const dial = CHAINING_DIALOGUES[charId] || CHAINING_DIALOGUES["tuong-tu-mac"];
      setChainSpeech(dial.invalidWord.replace("{letter}", lastWord));
      playMeowSound();
      return;
    }

    // Rule 4: Word must not have been used already
    if (usedWords.has(wordLower)) {
      alert("Từ này đã được sử dụng rồi nhen nàng ơi, hãy nghĩ một từ khác nha! 😘");
      return;
    }

    // Rule 5: Cannot use Spoonerism (Nói Lái / Đảo vần) with any word already used in this round
    let foundNoiLai = false;
    let offendingWord = "";
    for (const used of usedWords) {
      if (checkNoiLai(wordLower, used)) {
        foundNoiLai = true;
        offendingWord = used;
        break;
      }
    }
    if (foundNoiLai) {
      alert(`Ơ kìa nàng ơi! Không chơi nói lái hoặc đảo vần/đổi vị trí từ đã dùng đâu nha ("${originalInput}" nói lái với "${offendingWord}"), phạt nàng nghĩ từ khác nè! 😜`);
      return;
    }

    setChainStatus("thinking");
    const charId = selectedChar?.id || "tuong-tu-mac";
    const dial = CHAINING_DIALOGUES[charId] || CHAINING_DIALOGUES["tuong-tu-mac"];
    setChainSpeech(dial.thinking);

    try {
      const res = await fetch("/api/wordchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userWord: wordLower, usedWords: Array.from(usedWords) })
      });
      const data = await res.json();

      if (!data.valid) {
        setChainStatus("playing");
        alert(data.reason || "Từ này không hợp lệ nha nàng ơi! Thử từ khác nhé.");
        return;
      }

      // Valid move!
      playMeowSound();
      setUserInput("");
      
      const newUserHistory = [
        ...chainHistory,
        { sender: "user" as const, text: originalInput }
      ];
      setChainHistory(newUserHistory);

      const updatedUsed = new Set(usedWords);
      updatedUsed.add(wordLower);
      setUsedWords(updatedUsed);

      try {
        const todayStr = new Date().toDateString();
        localStorage.setItem(`quest_played_chaining_${todayStr}`, "true");
        const currentMaxLength = parseInt(localStorage.getItem(`quest_chain_length_${todayStr}`) || "0");
        if (updatedUsed.size > currentMaxLength) {
          localStorage.setItem(`quest_chain_length_${todayStr}`, updatedUsed.size.toString());
        }
      } catch (e) {
        console.error("Lỗi cập nhật quest chơi nối từ:", e);
      }

      const botWord = data.botWord;
      
      if (!botWord) {
        // AI absolutely cannot match anymore -> AI loses (User wins)
        setChainStatus("ended");
        setChainSpeech(dial.userWin);
        setChainHistory(prev => [
          ...prev,
          { sender: "system", text: `🎉 Chúc mừng nàng! ${selectedChar?.name || "Chàng trai"} đã chịu thua vì không tìm được từ nối tiếp!` }
        ]);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#ec4899', '#fdf2f8', '#10b981'],
        });
        return;
      }

      const aiResponseLower = botWord.toLowerCase();
      const aiResponseWords = aiResponseLower.split(/\s+/).filter(Boolean);
      const matchedLast = aiResponseWords[1] || aiResponseWords[0];

      updatedUsed.add(aiResponseLower);
      setUsedWords(updatedUsed);
      setLastWord(matchedLast);

      const aiReplies = dial.response;
      const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];

      setChainHistory(prev => [
        ...prev,
        { sender: "ai", text: aiResponseLower }
      ]);
      setChainSpeech(randomReply);
      setChainStatus("playing");

    } catch (err) {
      console.error(err);
      setChainStatus("playing");
      alert("Có lỗi xảy ra khi gọi trọng tài AI. Vui lòng thử lại!");
    }
  };

  const handleGiveUpChaining = () => {
    const charId = selectedChar?.id || "tuong-tu-mac";
    const dial = CHAINING_DIALOGUES[charId] || CHAINING_DIALOGUES["tuong-tu-mac"];
    setChainStatus("ended");
    setChainSpeech(dial.userLose);
    setChainHistory(prev => [
      ...prev,
      { sender: "system", text: `💔 Nàng đã chịu thua! Chiến thắng thuộc về chàng trai ${selectedChar?.name || "nam thần"}.` }
    ]);
    playMeowSound();
  };

  // ------------------------------------------------------------------
  // Tic Tac Toe (OX Game) Logic
  // ------------------------------------------------------------------
  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const evaluateBoard = (squares: (string | null)[]) => {
    const winner = checkWinner(squares);
    if (winner === "O") return 10;
    if (winner === "X") return -10;
    return 0;
  };

  const runMinimax = (squares: (string | null)[], depth: number, isMax: boolean): number => {
    const score = evaluateBoard(squares);
    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    if (squares.every(s => s !== null)) return 0;

    if (isMax) {
      let best = -1000;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "O";
          best = Math.max(best, runMinimax(squares, depth + 1, false));
          squares[i] = null;
        }
      }
      return best;
    } else {
      let best = 1000;
      for (let i = 0; i < 9; i++) {
        if (squares[i] === null) {
          squares[i] = "X";
          best = Math.min(best, runMinimax(squares, depth + 1, true));
          squares[i] = null;
        }
      }
      return best;
    }
  };

  const getBestMoveMinimax = (squares: (string | null)[]): number => {
    let bestVal = -1000;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (squares[i] === null) {
        squares[i] = "O";
        const moveVal = runMinimax(squares, 0, false);
        squares[i] = null;
        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const startOxGame = () => {
    setBoard(Array(9).fill(null));
    setIsUserTurn(true);
    setOxStatus("playing");
    setOxSpeech(`Hì hì, hãy cùng lật tung bàn cờ này nhé nàng! Tới lượt nàng đi trước đó nhen. ✨`);
    playMeowSound();
  };

  const resetOxGame = () => {
    setBoard(Array(9).fill(null));
    setIsUserTurn(true);
    setOxStatus("idle");
    setOxSpeech(`Hãy sẵn sàng tỉ thí võ nghệ bàn cờ cùng ${selectedChar?.name || "bot"} nheee!`);
  };

  const handleCellClick = (index: number) => {
    if (board[index] || !isUserTurn || oxStatus !== "playing") return;

    playMeowSound();
    const newBoard = [...board];
    newBoard[index] = "X"; // User is X
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner === "X") {
      setOxStatus("user_win");
      setOxStats(prev => ({ ...prev, user: prev.user + 1 }));
      setOxSpeech(`Ôi... nàng chơi cờ thông minh quá đi mờ! Anh chịu thua nàng nè, phạt ôm anh cái nhé... 🥺💖`);
      confetti({ particleCount: 100, spread: 70, colors: ["#fb7185", "#f43f5e", "#fda4af"] });
      try {
        const todayStr = new Date().toDateString();
        localStorage.setItem(`quest_won_ox_${todayStr}`, "true");
      } catch (e) {
        console.error("Lỗi cập nhật quest thắng OX:", e);
      }
      return;
    }

    if (newBoard.every(cell => cell !== null)) {
      setOxStatus("draw");
      setOxStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      setOxSpeech(`Hòa rồi nè! Tụi mình đúng là tâm đầu ý hợp, đi cờ cũng song hành cùng nhau nữa cơ! 🤝`);
      return;
    }

    // AI Turn
    setIsUserTurn(false);
    setOxStatus("thinking");
    setOxSpeech(`Để ${selectedChar?.name || "Chàng"} tính toán một nước đi thật chuẩn xem sao... 🤔`);

    setTimeout(() => {
      const aiBoard = [...newBoard];
      // Get all empty indices
      const emptyIndices = aiBoard.map((c, i) => c === null ? i : null).filter((v): v is number => v !== null);

      if (emptyIndices.length > 0) {
        let move = -1;
        const currentWins = oxStats.user;

        // Determine probability of perfect minimax play based on progressive difficulty
        let smartChance = 0.35; // Easy mode
        if (currentWins === 1) smartChance = 0.65; // Medium mode
        if (currentWins === 2) smartChance = 0.85; // Hard mode
        if (currentWins >= 3) smartChance = 1.0;  // Nightmare mode

        const playSmart = Math.random() < smartChance;

        if (playSmart) {
          move = getBestMoveMinimax(aiBoard);
        } else {
          // Semi-smart fallback (checks instant win or instant block, else plays random to allow warm start)
          for (const idx of emptyIndices) {
            const testBoard = [...aiBoard];
            testBoard[idx] = "O";
            if (checkWinner(testBoard) === "O") {
              move = idx;
              break;
            }
          }
          if (move === -1) {
            for (const idx of emptyIndices) {
              const testBoard = [...aiBoard];
              testBoard[idx] = "X";
              if (checkWinner(testBoard) === "X") {
                move = idx;
                break;
              }
            }
          }
          if (move === -1) {
            move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }
        }

        aiBoard[move] = "O";
        setBoard(aiBoard);

        const aiWinner = checkWinner(aiBoard);
        if (aiWinner === "O") {
          setOxStatus("ai_win");
          setOxStats(prev => ({ ...prev, ai: prev.ai + 1 }));
          setOxSpeech(`Aha! Anh lỡ thắng mất rồi... Nàng đừng giận nhe, để anh làm bánh ngọt dỗ dành nàng nha! 🍰💕`);
        } else if (aiBoard.every(cell => cell !== null)) {
          setOxStatus("draw");
          setOxStats(prev => ({ ...prev, draws: prev.draws + 1 }));
          setOxSpeech(`Hòa nhau rồi kìa! Bàn cờ này đúng là kỳ phùng địch thủ mờ! 😉`);
        } else {
          setOxStatus("playing");
          setOxSpeech(`Tới lượt nàng đi tiếp rồi kìa! Đừng nương tay với anh nhen. ⚔`);
          setIsUserTurn(true);
        }
      }
    }, 1200);
  };

  return (
    <div className={`w-full flex flex-col gap-8 relative overflow-hidden ${weather === 'rain' ? 'bg-blue-950/10' : weather === 'snow' ? 'bg-stone-100/30' : ''}`}>
      {weather === 'rain' && (
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', animation: 'rain 0.3s linear infinite' }} />
      )}
      {weather === 'snow' && (
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/snow.png")', animation: 'snow 10s linear infinite' }} />
      )}
      <style>{`
        @keyframes rain { from { background-position: 0 0; } to { background-position: 20px 100px; } }
        @keyframes snow { from { background-position: 0 0; } to { background-position: 100px 200px; } }
      `}</style>
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100/50 dark:border-stone-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎮</span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-extrabold text-emerald-500 font-mono">
              KHU VUI CHƠI MEOMEOPLAYGROUND
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-serif font-semibold italic ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
            Sân Chơi Mini Game Cùng Các Bé Iu ✨🍭
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 dark:text-stone-500 mt-1 max-w-xl leading-relaxed">
            Vô solo với các bot yêu nhà meo nè hẹ hẹ
          </p>
          {/* Weather dev tools */}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setWeather("sun")} className={`text-xs px-2 py-1 rounded ${weather === 'sun' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>☀️ Nắng</button>
            <button onClick={() => setWeather("rain")} className={`text-xs px-2 py-1 rounded ${weather === 'rain' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-500'}`}>🌧️ Mưa</button>
            <button onClick={() => setWeather("snow")} className={`text-xs px-2 py-1 rounded ${weather === 'snow' ? 'bg-stone-200 text-stone-700' : 'bg-stone-100 text-stone-500'}`}>❄️ Tuyết</button>
          </div>
        </div>

        {onBackToGrid && (
          <button
            onClick={() => {
              playMeowSound();
              onBackToGrid();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs border ${
              isDarkMode 
                ? "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800" 
                : "bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về Kho Nhân Vật
          </button>
        )}
      </div>

      {/* Horizontal Character Selection Slider */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-rose-400" />
          Bước 1: Chọn Chàng Trai Đồng Hành:
        </span>
        <div className="flex gap-3 overflow-x-auto pb-3 snap-x scrollbar-thin">
          {characters.filter(c => c && c.id).map((char) => {
            const isSelected = selectedChar?.id === char.id;
            return (
              <button
                key={char.id}
                onClick={() => handleCharSelect(char)}
                className={`flex items-center gap-3 p-3 rounded-2xl border snap-start shrink-0 transition-all duration-300 shadow-2xs cursor-pointer ${
                  isSelected
                    ? isDarkMode
                      ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 scale-[1.03] ring-1 ring-emerald-500/20"
                      : "bg-emerald-50/70 border-emerald-300 text-emerald-800 scale-[1.03] ring-1 ring-emerald-300/30"
                    : isDarkMode
                    ? "bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300"
                    : "bg-white border-[#eadbca]/40 hover:border-rose-200 text-stone-700"
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-stone-200/20 shadow-inner">
                  {char.avatar.startsWith("http") ? (
                    <img 
                      src={formatImageUrl(char.avatar)} 
                      alt={char.name} 
                      className="w-full h-full object-cover aspect-square" 
                      onError={(e) => handleImageError(e, char.name)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl">
                      {char.avatar}
                    </div>
                  )}
                </div>
                <div className="text-left pr-2">
                  <h4 className="text-xs font-bold font-serif italic leading-none">{char.name}</h4>
                  <span className="text-[9px] text-stone-400 font-mono">Bé Cưng</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Selection or Active Game Area */}
      <div className="w-full">
        {activeGame === "selection" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">

            {/* Game X: Trại Thú Cưng */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/40 border-stone-800 hover:bg-stone-900/80 hover:border-pink-900/50" 
                  : "bg-white border-stone-200 hover:shadow-xl hover:border-pink-200"
              }`}
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 ${
                    petData?.bgColor ? petData.bgColor : (isDarkMode ? "bg-stone-950" : "bg-stone-50")
                  } ${petData?.frame ? petData.frame : ""}`}>
                    {petData ? petData.emoji : "🐰"}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-serif font-bold text-xl ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                      {petData ? petData.name : "Trại Thú Cưng"}
                    </h3>
                    <p className="text-[10px] text-pink-500 font-bold uppercase tracking-wider font-mono">
                      {petData ? `Lv. ${petData.level}` : "Nuôi & Chăm Sóc"}
                    </p>
                  </div>
                  {petData && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playMeowSound();
                        setActiveGame("petdecor");
                      }}
                      className={`p-2 rounded-xl text-xs font-bold transition-all ${
                        isDarkMode ? "bg-pink-950/40 text-pink-400 hover:bg-pink-900/60" : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                      }`}
                      title="Trang trí"
                    >
                      🎨
                    </button>
                  )}
                </div>
                
                {petData ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {/* Hunger */}
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className={isDarkMode ? "text-stone-400" : "text-stone-500"}>No bụng</span>
                        <span className={isDarkMode ? "text-stone-300" : "text-stone-700"}>{Math.round(petData.hunger)}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-stone-800" : "bg-stone-200"}`}>
                        <div style={{ width: `${petData.hunger}%` }} className="h-full bg-rose-500 transition-all duration-500" />
                      </div>
                    </div>
                    {/* Happiness */}
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className={isDarkMode ? "text-stone-400" : "text-stone-500"}>Vui vẻ</span>
                        <span className={isDarkMode ? "text-stone-300" : "text-stone-700"}>{Math.round(petData.happiness)}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-stone-800" : "bg-stone-200"}`}>
                        <div style={{ width: `${petData.happiness}%` }} className="h-full bg-amber-500 transition-all duration-500" />
                      </div>
                    </div>
                    {/* Energy */}
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className={isDarkMode ? "text-stone-400" : "text-stone-500"}>Năng lượng</span>
                        <span className={isDarkMode ? "text-stone-300" : "text-stone-700"}>{Math.round(petData.energy)}%</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-stone-800" : "bg-stone-200"}`}>
                        <div style={{ width: `${petData.energy}%` }} className="h-full bg-sky-500 transition-all duration-500" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                    Nhận nuôi thú cưng, cho ăn, tắm rửa, chơi đùa và giúp các bé lên cấp mỗi ngày!
                  </p>
                )}
              </div>
              {petData ? (
                <div className="mt-6 flex flex-col gap-2 relative z-20">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playMeowSound();
                        const next = { ...petData };
                        next.hunger = Math.min(100, next.hunger + 30);
                        next.energy = Math.min(100, next.energy + 5);
                        next.cleanliness = Math.max(0, next.cleanliness - 5);
                        next.exp += 10;
                        if (next.coins === undefined) next.coins = 100;
                        next.coins += 10;
                        if (!next.history) next.history = [];
                        next.history.unshift({ action: "Đã cho ăn", time: Date.now(), icon: "🍖", color: "text-rose-500" });
                        next.history = next.history.slice(0, 5);
                        setPetData(next);
                        localStorage.setItem("meomeo_pet_data", JSON.stringify(next));
                        window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: next }));
                        window.dispatchEvent(new CustomEvent("show-toast", { detail: `Đã cho ${petData.name} ăn! 🍖` }));
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                        isDarkMode 
                          ? "bg-rose-950/40 text-rose-400 hover:bg-rose-900/60" 
                          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                    >
                      Cho Ăn
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playMeowSound();
                        const next = { ...petData };
                        const playBonus = next.buff_play_x2 ? 60 : 30;
                        next.happiness = Math.min(100, next.happiness + playBonus);
                        next.energy = Math.max(0, next.energy - 15);
                        next.hunger = Math.max(0, next.hunger - 10);
                        next.cleanliness = Math.max(0, next.cleanliness - 10);
                        next.exp += 15;
                        if (next.coins === undefined) next.coins = 100;
                        next.coins += 10;
                        if (!next.history) next.history = [];
                        next.history.unshift({ action: "Đã chơi đùa", time: Date.now(), icon: "⚽", color: "text-amber-500" });
                        next.history = next.history.slice(0, 5);
                        setPetData(next);
                        localStorage.setItem("meomeo_pet_data", JSON.stringify(next));
                        window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: next }));
                        window.dispatchEvent(new CustomEvent("show-toast", { detail: `Đã chơi đùa cùng ${petData.name}! ⚽` }));
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                        isDarkMode 
                          ? "bg-amber-950/40 text-amber-400 hover:bg-amber-900/60" 
                          : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                      }`}
                    >
                      Chơi Cùng
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      playMeowSound();
                      setActiveGame("pet");
                    }}
                    className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isDarkMode 
                        ? "bg-stone-900 text-stone-400 hover:bg-stone-800" 
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Vào Trại
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    playMeowSound();
                    setActiveGame("pet");
                  }}
                  className={`mt-6 w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                    isDarkMode 
                      ? "bg-stone-950 text-stone-400 hover:bg-pink-950/40 hover:text-pink-400" 
                      : "bg-stone-50 text-stone-600 hover:bg-pink-50 hover:text-pink-600"
                  }`}
                >
                  Nhận Nuôi
                </button>
              )}
            </motion.div>
            {/* Game Y: Shop Đồ Chơi */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/40 border-stone-800 hover:bg-stone-900/80 hover:border-purple-900/50" 
                  : "bg-white border-stone-200 hover:shadow-xl hover:border-purple-200"
              }`}
            >
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 ${
                    isDarkMode ? "bg-stone-950" : "bg-stone-50"
                  }`}>
                    🛍️
                  </div>
                  <div>
                    <h3 className={`font-serif font-bold text-xl ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                      Shop Thú Cưng
                    </h3>
                    <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider font-mono">
                      Mua Sắm Phụ Kiện
                    </p>
                  </div>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                  Dùng tiền (🪙) kiếm được từ việc chăm sóc để mua thức ăn ngon và đồ chơi xịn cho bé!
                </p>
              </div>
              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("petshop");
                }}
                className={`mt-6 w-full py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all ${
                  isDarkMode 
                    ? "bg-stone-950 text-stone-400 hover:bg-purple-950/40 hover:text-purple-400" 
                    : "bg-stone-50 text-stone-600 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                Vào Cửa Hàng
              </button>
            </motion.div>
            
            {/* Game 1: Nối Từ */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-emerald-500/20 dark:text-emerald-500/10 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-16 h-16" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📝</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 font-mono">
                    Trò chơi ngôn từ
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Nối Từ
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Đọ Tài Nối Từ Với Các Bot Yêu.Nhập từ ghép có 2 từ ( Ví dụ: ' Yêu thích → Thích hợp')
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("chaining");
                  startChainingGame();
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" 
                    : "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Chơi Ngay
              </button>
            </motion.div>

            {/* Game 2: Đánh OX (Tic Tac Toe) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-rose-500/20 dark:text-rose-500/10 group-hover:scale-110 transition-transform">
                <Trophy className="w-16 h-16" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">❌⭕</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                    Trận đấu kinh điển
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Trò chơi OX
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Đơn Giản. Cổ Điển, Ai Nhanh Hơn Thì Win
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("ox");
                  startOxGame();
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white" 
                    : "bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Chơi Ngay
              </button>
            </motion.div>

            {/* Game 3: Pha Chế Cà Phê / Đồ Uống */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              {hasPending.coffee && (
                <div className="absolute top-4 left-4 z-10 flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
              <div className="absolute top-4 right-4 text-amber-500/20 dark:text-amber-500/10 group-hover:scale-110 transition-transform">
                <Coffee className="w-16 h-16" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">☕🍹</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 font-mono">
                    Tiệm nước ngọt ngào
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Pha Chế Đồ Uống
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Đón tiếp các chàng trai ghé tiệm, pha trà sữa & cà phê theo yêu cầu, tích xu mua cốc trang trí cực xinh!
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("coffee");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" 
                    : "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Mở Tiệm Ngay
              </button>
            </motion.div>

            {/* Game 4: Nấu Ăn (Cooking Game) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              {hasPending.cooking && (
                <div className="absolute top-4 left-4 z-10 flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
              <div className="absolute top-4 right-4 text-orange-500/20 dark:text-orange-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🍳</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🍳🍲</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                    Góc Nội Trợ
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Nấu Ăn
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Đi chợ mua nguyên liệu, thỏa sức sáng tạo các món ăn và bán lấy tiền nào!
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("cooking");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white" 
                    : "bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Bếp Ngay
              </button>
            </motion.div>

            {/* Game 5: Rửa Đồ (Dishwashing Game) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-sky-500/20 dark:text-sky-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🧼</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧼🍽️</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 font-mono">
                    Trải Nghiệm Rửa Đồ
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Tiệm Rửa Chén
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Làm nhân viên chăm chỉ rửa sạch bọt xà phòng các ly chén đĩa dơ, phân loại ngăn nắp lên kệ trong thời gian yêu cầu tích xu cực đỉnh!
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("dishwashing");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white" 
                    : "bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Rửa Ngay
              </button>
            </motion.div>

            {/* Game 6: Xưởng Làm Bánh Kem (Cake Making Game) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              {hasPending.cake && (
                <div className="absolute top-4 left-4 z-10 flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
              <div className="absolute top-4 right-4 text-pink-500/20 dark:text-pink-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🎂</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎂🍰</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500 font-mono">
                    Nướng Bánh Siêu Hot
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Xưởng Bánh Kem
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Nướng bánh kem theo đơn đặt hàng của các bé thú dễ thương, sắm nguyên liệu ở chợ, tích sách công thức và làm nhiệm vụ ngày mới! 🍓✨
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("cake");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white" 
                    : "bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Làm Bánh
              </button>
            </motion.div>

            {/* Game 7: Lật Thẻ Nhớ Hình (Memory Game) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-purple-500/20 dark:text-purple-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🎴</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🃏🎴</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 font-mono">
                    Thử Thách Trí Nhớ
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Lật Thẻ Trí Tuệ
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Lật thẻ nhớ hình, tìm các cặp thẻ giống nhau trong thời gian giới hạn. Qua màn để mở khóa độ khó tăng dần nhé! 🧠✨
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("memory");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white" 
                    : "bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Lật Thẻ
              </button>
            </motion.div>

            {/* Game 8: Xếp Hình (Block Blast) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-sky-500/20 dark:text-sky-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🧩</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧩🧊</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 font-mono">
                    Xếp Hình Không Giới Hạn
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Khối Hình Tốc Độ
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Trò chơi xếp hình kiểu Block Blast! Kéo thả và lấp đầy các ô trống trên lưới để ghi điểm và giải tỏa căng thẳng. 🧊🧩
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("blockblast");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white" 
                    : "bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Xếp Hình
              </button>
            </motion.div>

            {/* Game 9: Sắp Xếp Từ (Sentence Game) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-emerald-500/20 dark:text-emerald-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">📝</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔤📝</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 font-mono">
                    Rèn Luyện Ngôn Ngữ
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Ghép Chữ Thành Câu
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Sắp xếp các từ lộn xộn thành một câu hoàn chỉnh có ý nghĩa. Qua từng màn chơi để thử thách trí não nhé! 🧩
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("sentence");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" 
                    : "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                Vào Ghép Câu
              </button>
            </motion.div>

            {/* Game 11: Gambling (Tệ Nạn) */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-amber-500/20 dark:text-amber-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🎰</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎲🎰</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 font-mono">
                    Góc Xả Xì Trét
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Tệ Nạn Xã Hội Ở Đây
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Thử vận may với Tài Xỉu, Lắc Đồng Xu và Máy Nổ Hũ. Chơi vui giải trí không quạo nhé! 🤑✨
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("gambling");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white" 
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Sòng
              </button>
            </motion.div>

            {/* Game 12: Xé ảnh char - Tùy Nhân Phẩm */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-rose-500/20 dark:text-rose-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">📸</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎟️🔮</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                    Đỏ Đen Gacha
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Xé Ảnh Char - Tùy Nhân Phẩm
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Chi trả số tiền tùy tâm để xé phong bao chứa ảnh cực phẩm của các bé yêu. Số tiền càng lớn, ảnh rớt ra càng chất lượng! 💖⚡
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("tear-photo");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-stone-950 font-extrabold" 
                    : "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Xé Ảnh
              </button>
            </motion.div>

            {/* Game 13: Bài Tiến Lên - Thập Tam */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-rose-500/20 dark:text-rose-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🎴</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🃏⚔️</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                    Đấu Trí Tây Lá
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Bài Tiến Lên - Thập Tam
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Chia đều 13 lá bài cho bạn và 3 nam thần đồng hành. Đánh bài chặt heo, xếp sảnh đôi giành vị trí chiến thắng đầu tiên! 🏆✨
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("tienlen");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-rose-400 to-orange-500 hover:from-rose-500 hover:to-orange-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Sòng Tiến Lên
              </button>
            </motion.div>

            {/* Game 14: Bói Bài Tarot Chiêm Tinh */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-purple-500/20 dark:text-purple-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🔮</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔮✨</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 font-mono">
                    Huyền Bí Chiêm Tinh
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Bói Bài Tarot Số Mệnh
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Đặt câu hỏi về Tình yêu, Sự nghiệp, Tiền tài... và để các nam thần dùng trực giác tâm linh giải mã lá bài Tarot kỳ bí cho nàng nhé! 🃏🌌
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("tarot");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-purple-500 to-rose-600 hover:from-purple-600 hover:to-rose-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-purple-400 to-rose-500 hover:from-purple-500 hover:to-rose-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Sòng Tarot
              </button>
            </motion.div>

            {/* Game 15: Flappy MeoMeo */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-rose-500/20 dark:text-rose-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🚀</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🐱🚀</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                    Bay cao không giới hạn
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Flappy MeoMeo
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Vỗ cánh giúp các bé cưng hoặc nam thần tránh ly cà phê, chổi lau nhà... Bay thật xa tích xu khổng lồ nhen! ☕🍰
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("flappy-pet");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Bay Ngay
              </button>
            </motion.div>

            {/* Game 16: Đào Vàng Vũ Trụ */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-amber-500/20 dark:text-amber-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">⛏️</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💎⛏️</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 font-mono">
                    Đào vàng cổ điển
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Đào Vàng Vũ Trụ
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Quăng móc đào vàng, kim cương và hộp quà may mắn. Nhận buff kéo cực bốc từ nam thần đồng hành nhé! 💰💎
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("gold-miner");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Đào Vàng
              </button>
            </motion.div>

            {/* Game 17: Đập Gai Cứu Tiệm */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-sky-500/20 dark:text-sky-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🔨</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👾🔨</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 font-mono">
                    Phản xạ cực nhanh
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Đập Gai Bảo Vệ Tiệm
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Cầm búa đập bụi gai tinh nghịch bảo vệ tiệm. Tránh đập nhầm các bé mèo yêu và nam thần nhen nàng! 🔨🐱
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("whack-mole");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Đập Gai
              </button>
            </motion.div>

            {/* Game 18: Hợp Nhất Kẹo Ngọt */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-pink-500/20 dark:text-pink-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">🍬</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🍬🍉</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500 font-mono">
                    Trí tuệ thư giãn
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Hợp Nhất Kẹo Ngọt
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Trò chơi Suika kẹo ngọt! Thả kẹo hợp thể thành loại to hơn, đoạt dưa hấu khổng lồ siêu điểm số! 🍬🍒🍉
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("sweet-merge");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Ghép Kẹo
              </button>
            </motion.div>

            {/* Game 19: Vòng Quay Duyên Phận */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-rose-500/20 dark:text-rose-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">💘</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💘💌</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                    Chiêm tinh duyên nợ
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Vòng Quay Duyên Phận
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Khám phá chỉ số hợp nhau giữa nàng và nam thần đồng hành. Nhận bức thư tình ngọt ngào lay động con tim! 💌🌹
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("love-spinner");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold" 
                    : "bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Thử Nhân Duyên
              </button>
            </motion.div>

            {/* Game 20: Tin nhắn & Hẹn hò Bí mật */}
            <motion.div
              whileHover={{ y: -4 }}
              className={`p-6 border rounded-[2rem] flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group ${
                isDarkMode 
                  ? "bg-stone-900/80 border-stone-800/80" 
                  : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
              }`}
            >
              <div className="absolute top-4 right-4 text-rose-500/20 dark:text-rose-500/10 group-hover:scale-110 transition-transform">
                <span className="text-6xl">📲</span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📲💖</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                    Mô phỏng điện thoại
                  </span>
                </div>
                <h3 className={`text-xl font-serif font-bold italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                  Tin Nhắn & Hẹn Hò Bí Mật
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mb-6">
                  Mở khóa màn hình điện thoại, trò chuyện bí mật, lên kế hoạch cho buổi hẹn hò kỳ diệu cùng chàng và nhận Xu (🪙) phần thưởng cực bự nhen! 📱🌸
                </p>
              </div>

              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("secret-dates");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest font-mono transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 ${
                  isDarkMode 
                    ? "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-stone-950 font-extrabold" 
                    : "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-extrabold"
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Mở Điện Thoại 📲
              </button>
            </motion.div>
          </div>

        ) : activeGame === "chaining" ? (
          // ------------------------------------------------------------------
          // Word Chaining Game Panel
          // ------------------------------------------------------------------
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Dialogue Box */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className={`p-6 border rounded-[2rem] flex flex-col items-center text-center shadow-xs ${
                isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40"
              }`}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md mb-4 relative">
                  {selectedChar?.avatar?.startsWith("http") ? (
                    <img 
                      src={formatImageUrl(selectedChar.avatar)} 
                      alt={selectedChar.name || "Nam thần"} 
                      className="w-full h-full object-cover" 
                      onError={(e) => handleImageError(e, selectedChar?.name || "Nam thần")}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl">
                      {selectedChar?.avatar || "👤"}
                    </div>
                  )}
                  {chainStatus === "thinking" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs animate-pulse">💭</span>
                    </div>
                  )}
                </div>

                <h3 className="font-serif italic font-bold text-lg text-stone-800 dark:text-stone-100">
                  {selectedChar?.name || "Đang tải..."}
                </h3>
                <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-500 font-mono mb-4 block">
                  Đang tỉ thí nối từ
                </span>

                {/* Speech Bubble */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border relative transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-200" 
                    : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                }`}>
                  <p className="font-medium italic leading-relaxed">
                    "{chainSpeech}"
                  </p>
                </div>
              </div>

              {/* Back to selection */}
              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("selection");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all border shadow-2xs ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800" 
                    : "bg-white border-[#eadbca]/50 text-stone-700 hover:bg-stone-50"
                }`}
              >
                ↩ Đổi Trò Chơi Khác
              </button>
            </div>

            {/* Right/Center: Chat Interface & Input */}
            <div className="lg:col-span-2 flex flex-col h-[520px] border rounded-[2rem] overflow-hidden shadow-sm relative transition-all duration-300 bg-stone-950/10 dark:bg-stone-950/40 border-stone-200/40 dark:border-stone-800/80">
              {/* Game status header */}
              <div className="p-4 border-b border-stone-200/20 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    Hội thoại nối từ
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Sổ từ đã dùng: <span className="font-bold text-rose-500">{usedWords.size}</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[380px]">
                {chainHistory.map((msg, i) => {
                  if (msg.sender === "system") {
                    return (
                      <div key={i} className="flex justify-center my-2">
                        <span className="text-[10px] bg-stone-100 dark:bg-stone-900 border border-stone-200/10 text-stone-500 px-3 py-1 rounded-full text-center max-w-sm">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isUser = msg.sender === "user";
                  return (
                    <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[70%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-7 h-7 rounded-full overflow-hidden border border-stone-200/10 shadow-inner flex items-center justify-center shrink-0 ${
                          isUser ? "bg-rose-100" : "bg-stone-100 dark:bg-stone-800"
                        }`}>
                          {isUser ? (
                            currentUser ? (
                              <img 
                                src={formatImageUrl(userProfile?.photoURL || currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || currentUser.displayName || "User")}&background=random`)} 
                                alt="User" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-xs">👩</span>
                            )
                          ) : (
                            selectedChar?.avatar?.startsWith("http") ? (
                              <img 
                                src={formatImageUrl(selectedChar.avatar)} 
                                alt={selectedChar.name || "Nam thần"} 
                                className="w-full h-full object-cover" 
                                onError={(e) => handleImageError(e, selectedChar?.name || "Nam thần")}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-xs">{selectedChar?.avatar || "👤"}</span>
                            )
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs font-semibold shadow-2xs border ${
                          isUser
                            ? isDarkMode
                              ? "bg-rose-950/30 border-rose-900/50 text-rose-200"
                              : "bg-rose-50 border-rose-100 text-rose-800"
                            : isDarkMode
                            ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-200"
                            : "bg-emerald-50 border-emerald-100 text-emerald-800"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chainChatEndRef} />
              </div>

              {/* Chaining Input Controls */}
              <div className="p-4 border-t border-stone-200/20 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40">
                {chainStatus === "idle" || chainStatus === "ended" ? (
                  <button
                    onClick={startChainingGame}
                    className="w-full py-3 bg-emerald-500 text-white font-mono font-bold uppercase text-xs tracking-wider rounded-xl shadow-md hover:bg-emerald-600 transition-all cursor-pointer"
                  >
                    🚀 Bắt Đầu Trận Đấu Nối Từ
                  </button>
                ) : (
                  <form onSubmit={handleSendWord} className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={
                        lastWord 
                          ? `Hãy nối từ bắt đầu bằng chữ "${lastWord}"... 🐾` 
                          : "Nhập từ ghép có 2 chữ bắt đầu nhen... ✨"
                      }
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none transition-all ${
                        isDarkMode
                          ? "bg-stone-900 border-stone-800 text-stone-200 focus:border-emerald-500"
                          : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-emerald-400"
                      }`}
                      disabled={chainStatus === "thinking"}
                    />
                    <button
                      type="submit"
                      disabled={chainStatus === "thinking" || !userInput.trim()}
                      className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleGiveUpChaining}
                      className="px-3.5 py-2.5 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Chịu thua bé cưng"
                    >
                      🏳
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : activeGame === "ox" ? (
          // ------------------------------------------------------------------
          // Tic-Tac-Toe (OX) Game Panel
          // ------------------------------------------------------------------
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Left: Dialogue Box */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className={`p-6 border rounded-[2rem] flex flex-col items-center text-center shadow-xs ${
                isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40"
              }`}>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-rose-500 shadow-md mb-4 relative">
                  {selectedChar?.avatar?.startsWith("http") ? (
                    <img 
                      src={formatImageUrl(selectedChar.avatar)} 
                      alt={selectedChar.name || "Nam thần"} 
                      className="w-full h-full object-cover" 
                      onError={(e) => handleImageError(e, selectedChar?.name || "Nam thần")}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl">
                      {selectedChar?.avatar || "👤"}
                    </div>
                  )}
                  {oxStatus === "thinking" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs animate-pulse">💭</span>
                    </div>
                  )}
                </div>

                <h3 className="font-serif italic font-bold text-lg text-stone-800 dark:text-stone-100">
                  {selectedChar?.name || "Đang tải..."}
                </h3>
                <span className="text-[9px] uppercase tracking-widest font-bold text-rose-500 font-mono mb-4 block">
                  Đang thi đấu OX
                </span>

                {/* Speech Bubble */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border relative transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-rose-950/20 border-rose-900/50 text-rose-200" 
                    : "bg-rose-50/50 border-rose-100 text-rose-800"
                }`}>
                  <p className="font-medium italic leading-relaxed">
                    "{oxSpeech}"
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className={`p-4 border rounded-2xl text-xs flex justify-between text-center ${
                isDarkMode ? "bg-stone-900/40 border-stone-800/80 text-stone-300" : "bg-stone-50/50 border-[#eadbca]/30 text-stone-700"
              }`}>
                <div>
                  <p className="text-[9px] text-stone-400 uppercase font-mono">Nàng thắng</p>
                  <p className="text-base font-bold text-emerald-500">{oxStats.user}</p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-400 uppercase font-mono">Hòa</p>
                  <p className="text-base font-bold text-stone-500">{oxStats.draws}</p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-400 uppercase font-mono">Bé cưng thắng</p>
                  <p className="text-base font-bold text-rose-500">{oxStats.ai}</p>
                </div>
              </div>

              {/* Back to selection */}
              <button
                onClick={() => {
                  playMeowSound();
                  setActiveGame("selection");
                }}
                className={`w-full py-3 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all border shadow-2xs ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800" 
                    : "bg-white border-[#eadbca]/50 text-stone-700 hover:bg-stone-50"
                }`}
              >
                ↩ Đổi Trò Chơi Khác
              </button>
            </div>

            {/* Right: Tic-Tac-Toe Grid with overlay */}
            <div className={`lg:col-span-2 border rounded-[2rem] overflow-hidden shadow-sm relative transition-all duration-300 flex flex-col justify-between items-center ${
              isDarkMode ? "bg-stone-900/40 border-stone-800/80" : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
            }`}>
              {/* Header bar */}
              <div className="w-full p-4 border-b border-stone-200/20 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  Bàn cờ OX 3x3
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {oxStatus === "thinking" ? "🤖 Đang suy nghĩ..." : "Hãy đi một nước cờ!"}
                </span>
              </div>

              {/* Grid content */}
              <div className="p-8 flex justify-center items-center relative overflow-hidden min-h-[300px] w-full">
                {oxStatus === "idle" ? (
                  <div className="text-center flex flex-col items-center gap-4">
                    <p className="text-xs text-stone-400 dark:text-stone-500">Bấm nút bên dưới để bắt đầu tỷ thí nhé nàng!</p>
                    <button
                      onClick={startOxGame}
                      className="px-6 py-2.5 bg-rose-500 text-white font-mono font-bold uppercase text-xs tracking-wider rounded-full shadow-md hover:bg-rose-600 transition-all cursor-pointer"
                    >
                      ⚔ Khởi Động Bàn Cờ
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 w-[220px] h-[220px]">
                    {board.map((cell, index) => (
                      <button
                        key={index}
                        disabled={cell !== null || oxStatus === "thinking" || oxStatus === "user_win" || oxStatus === "ai_win" || oxStatus === "draw"}
                        onClick={() => handleCellClick(index)}
                        className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 cursor-pointer ${
                          cell === null
                            ? isDarkMode
                              ? "bg-stone-950/60 border-stone-800 hover:bg-stone-800/60 active:scale-95 text-stone-300"
                              : "bg-stone-50 border-stone-200 hover:bg-stone-100 active:scale-95 text-stone-700"
                            : cell === "X"
                            ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-400"
                            : "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-400"
                        }`}
                      >
                        <AnimatePresence>
                          {cell && (
                            <motion.span
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", damping: 10, stiffness: 100 }}
                            >
                              {cell}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                )}

                {/* Game Result Overlay */}
                <AnimatePresence>
                  {(oxStatus === "user_win" || oxStatus === "ai_win" || oxStatus === "draw") && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-[4px] rounded-b-[2rem]"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 15 }}
                        transition={{ type: "spring", damping: 20 }}
                        className={`w-full max-w-[260px] p-5 rounded-2xl border text-center shadow-lg flex flex-col items-center gap-3 ${
                          oxStatus === "user_win"
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100"
                            : oxStatus === "ai_win"
                            ? "bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-900/60 text-purple-900 dark:text-purple-100"
                            : "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900/60 text-amber-900 dark:text-amber-100"
                        }`}
                      >
                        <div className="text-3xl">
                          {oxStatus === "user_win" ? "🏆" : oxStatus === "ai_win" ? "💝" : "🤝"}
                        </div>

                        <span className={`text-[10px] font-sans font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${
                          oxStatus === "user_win"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : oxStatus === "ai_win"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {oxStatus === "user_win" ? "Thắng cuộc!" : oxStatus === "ai_win" ? "Bé yêu thắng!" : "Bất phân thắng bại"}
                        </span>

                        <p className="text-[11px] font-sans font-medium italic leading-relaxed text-stone-800 dark:text-stone-100">
                          "{oxSpeech}"
                        </p>

                        <button
                          onClick={startOxGame}
                          className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          CHƠI LẠI
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reset retry action footer */}
              {oxStatus !== "idle" && (
                <div className="w-full p-4 border-t border-stone-200/20 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/40 flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 font-mono">Hãy đánh bại bé iu!</span>
                  <button
                    onClick={startOxGame}
                    className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    Làm mới ván
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeGame === "coffee" ? (
          <CoffeeGame
            characters={characters}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "cooking" ? (
          <CookingGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "dishwashing" ? (
          <DishwashingGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "cake" ? (
          <CakeGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "memory" ? (
          <MemoryGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "blockblast" ? (
          <BlockBlastGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />

        ) : activeGame === "sentence" ? (
          <SentenceGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "gambling" ? (
          <GamblingGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "pet" ? (
          <PetGame
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "petshop" ? (
          <PetShop
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "petdecor" ? (
          <PetDecor
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "tear-photo" ? (
          <TearPhotoGame
            characters={characters}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "tienlen" ? (
          <TienLenGame
            characters={characters}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "tarot" ? (
          <TarotGame
            selectedChar={selectedChar}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "flappy-pet" ? (
          <FlappyPetGame
            selectedChar={selectedChar}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "gold-miner" ? (
          <GoldMinerGame
            selectedChar={selectedChar}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "whack-mole" ? (
          <WhackAMoleGame
            selectedChar={selectedChar}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "sweet-merge" ? (
          <SweetMergeGame
            selectedChar={selectedChar}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "love-spinner" ? (
          <LoveSpinnerGame
            selectedChar={selectedChar}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
          />
        ) : activeGame === "secret-dates" ? (
          <SecretDatePhoneSimulator
            characters={characters}
            isDarkMode={isDarkMode}
            onBack={() => {
              playMeowSound();
              setActiveGame("selection");
            }}
            selectedChar={selectedChar}
          />
        ) : null}

      </div>
    </div>
  );
}
