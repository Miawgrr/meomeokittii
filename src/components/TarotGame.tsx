import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  RefreshCw, 
  ArrowLeft, 
  Play, 
  HelpCircle, 
  BookOpen, 
  Heart, 
  Briefcase, 
  Activity, 
  Coins, 
  Compass, 
  Info,
  ChevronRight,
  Eye,
  User,
  Calendar,
  Smile
} from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { formatImageUrl, handleImageError } from "../utils/image";
import confetti from "canvas-confetti";

interface TarotGameProps {
  selectedChar: Character | null;
  isDarkMode: boolean;
  onBack: () => void;
}

interface TarotCard {
  id: number;
  name: string;
  vietnameseName: string;
  icon: string;
  meaningUpright: string;
  meaningReversed: string;
  description: string;
  color: string;
  element: string;
}

const TAROT_CARDS: TarotCard[] = [
  {
    id: 0,
    name: "The Fool",
    vietnameseName: "Chàng Khờ",
    icon: "🃏",
    meaningUpright: "Khởi đầu mới, tự do, phiêu lưu, nhiệt huyết ngây thơ.",
    meaningReversed: "Liều lĩnh, bốc đồng, thiếu chuẩn bị, do dự.",
    description: "Một bước đi đầy niềm tin vào hư vô. Biểu trưng cho tiềm năng vô hạn và những khởi đầu bất ngờ.",
    color: "from-yellow-400 to-amber-500",
    element: "Khí 💨"
  },
  {
    id: 1,
    name: "The Magician",
    vietnameseName: "Nhà Ảo Thuật",
    icon: "🧙‍♂️",
    meaningUpright: "Ý chí, năng lực sáng tạo, hiện thực hóa ước mơ, tự tin.",
    meaningReversed: "Thao túng, ảo tưởng, lãng phí tài năng, mưu mô.",
    description: "Khả năng kết nối trời đất và làm chủ mọi công cụ cuộc sống để biến mong muốn thành hiện thực.",
    color: "from-blue-500 to-indigo-600",
    element: "Khí 💨"
  },
  {
    id: 2,
    name: "The High Priestess",
    vietnameseName: "Nữ Tư Tế",
    icon: "🧘‍♀️",
    meaningUpright: "Trực giác nhạy bén, tri thức bí ẩn, sự tĩnh lặng, tâm linh.",
    meaningReversed: "Bỏ qua trực giác, bí mật bị che giấu, hời hợt.",
    description: "Người giữ cánh cổng dẫn vào thế giới nội tâm bí ẩn. Gợi ý bạn hãy lắng nghe tiếng nói sâu thẳm bên trong.",
    color: "from-violet-500 to-purple-600",
    element: "Nước 💧"
  },
  {
    id: 3,
    name: "The Empress",
    vietnameseName: "Nữ Hoàng",
    icon: "👑",
    meaningUpright: "Màu mỡ, sung túc, tình mẫu tử, thiên nhiên, sáng tạo.",
    meaningReversed: "Sự phụ thuộc, ngột ngạt, thiếu thấu cảm, hoang phí.",
    description: "Sự nuôi dưỡng ngọt ngào của đất mẹ. Đại diện cho tình yêu bao dung, vẻ đẹp trác tuyệt và thịnh vượng.",
    color: "from-pink-400 to-rose-500",
    element: "Đất 🌱"
  },
  {
    id: 4,
    name: "The Emperor",
    vietnameseName: "Hoàng Đế",
    icon: "🏛️",
    meaningUpright: "Quyền lực, cấu trúc vững vàng, bảo vệ, kỷ luật thép.",
    meaningReversed: "Độc đoán, kiểm soát quá mức, bất ổn, cứng nhắc.",
    description: "Người thiết lập luật lệ và trật tự xã hội. Thể hiện ý chí thống trị sắt đá và tinh thần trách nhiệm.",
    color: "from-red-500 to-rose-700",
    element: "Lửa 🔥"
  },
  {
    id: 5,
    name: "The Hierophant",
    vietnameseName: "Thầy Tư Tế",
    icon: "⛪",
    meaningUpright: "Truyền thống, giáo dục, đức tin, hướng dẫn tâm linh.",
    meaningReversed: "Nổi loạn, tư duy bảo thủ, rập khuôn, mất phương hướng.",
    description: "Người kết nối giữa con người và thần thánh. Thể hiện tầm quan trọng của niềm tin và sự học hỏi chính thống.",
    color: "from-amber-500 to-yellow-600",
    element: "Đất 🌱"
  },
  {
    id: 6,
    name: "The Lovers",
    vietnameseName: "Cặp Tình Nhân",
    icon: "💖",
    meaningUpright: "Tình yêu lứa đôi, sự hòa hợp, lựa chọn từ con tim, gắn kết.",
    meaningReversed: "Mất cân bằng, mâu thuẫn nội tâm, chia rẽ, chọn lựa sai lầm.",
    description: "Sự hòa quyện ngọt ngào của âm dương. Nhấn mạnh việc đưa ra quyết định dựa trên các giá trị đạo đức và tình cảm chân thành.",
    color: "from-rose-400 to-pink-500",
    element: "Khí 💨"
  },
  {
    id: 7,
    name: "The Chariot",
    vietnameseName: "Chiến Xa",
    icon: "🛡️",
    meaningUpright: "Chiến thắng, quyết tâm cao độ, kiểm soát xung đột, tiến bước.",
    meaningReversed: "Mất lái, thiếu kỷ luật, thất bại trước áp lực, bế tắc.",
    description: "Người chiến binh kiên cường lướt đi trên chiến xa. Biểu tượng của nghị lực vượt qua nghịch cảnh để vươn tới vinh quang.",
    color: "from-sky-500 to-blue-600",
    element: "Nước 💧"
  },
  {
    id: 8,
    name: "Strength",
    vietnameseName: "Sức Mạnh",
    icon: "🦁",
    meaningUpright: "Lòng can đảm, sức mạnh nội tâm, kiên nhẫn, thuần hóa.",
    meaningReversed: "Yếu đuối, bạo lực, nghi ngờ bản thân, mất bình tĩnh.",
    description: "Một cô gái nhẹ nhàng vuốt ve thuần hóa mãnh sư. Cho thấy sức mạnh thực sự đến từ sự dịu dàng và kiên định tinh thần.",
    color: "from-orange-400 to-amber-500",
    element: "Lửa 🔥"
  },
  {
    id: 9,
    name: "The Hermit",
    vietnameseName: "Ẩn Sĩ",
    icon: "🏮",
    meaningUpright: "Chiêm nghiệm sâu sắc, tìm kiếm chân lý, tự suy ngẫm, cô độc.",
    meaningReversed: "Sự cô lập cực đoan, rút lui khỏi thế giới quá mức, lạc lối.",
    description: "Cụ già lặng lẽ cầm chiếc đèn lồng soi rọi đêm tối hoang vắng. Gợi ý bạn cần quay về bên trong để tìm câu trả lời.",
    color: "from-slate-400 to-stone-500",
    element: "Đất 🌱"
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    vietnameseName: "Vòng Quay Số Phận",
    icon: "🎡",
    meaningUpright: "Bước ngoặt lớn, may mắn bất ngờ, định mệnh, thay đổi tích cực.",
    meaningReversed: "Xui xẻo, sự phản kháng trước đổi thay, chu kỳ tồi tệ lặp lại.",
    description: "Bánh xe định mệnh không ngừng xoay vần. Nhắc nhở chúng ta chấp nhận sự thay đổi vô thường của cuộc đời.",
    color: "from-teal-400 to-emerald-500",
    element: "Lửa 🔥"
  },
  {
    id: 11,
    name: "Justice",
    vietnameseName: "Công Lý",
    icon: "⚖️",
    meaningUpright: "Sự thật, nhân quả, công bằng, quyết định sáng suốt.",
    meaningReversed: "Thiếu công bằng, trốn tránh trách nhiệm, định kiến ái ngại.",
    description: "Nữ thần công lý uy nghiêm cầm thanh kiếm và chiếc cân. Bạn gieo nhân nào sẽ gặt quả nấy.",
    color: "from-emerald-500 to-teal-600",
    element: "Khí 💨"
  },
  {
    id: 12,
    name: "The Hanged Man",
    vietnameseName: "Kẻ Treo Ngược",
    icon: "⛓️",
    meaningUpright: "Góc nhìn mới, buông bỏ, trì hoãn để suy ngẫm, hy sinh vô điều kiện.",
    meaningReversed: "Trì trệ kéo dài, hy sinh vô ích, chống đối sự buông bỏ.",
    description: "Treo ngược thân mình để nhìn thế giới đảo chiều. Đôi khi lùi một bước là cách duy nhất để tiến ba bước.",
    color: "from-blue-400 to-cyan-500",
    element: "Nước 💧"
  },
  {
    id: 13,
    name: "Death",
    vietnameseName: "Cái Chết",
    icon: "💀",
    meaningUpright: "Sự kết thúc, chuyển giao lớn, tái sinh, buông bỏ quá khứ.",
    meaningReversed: "Sợ hãi thay đổi, bám víu tuyệt vọng, thói quen độc hại trì trệ.",
    description: "Sự chấm dứt của một chương cũ để dọn đường cho những hạt mầm mới tươi đẹp nảy nở.",
    color: "from-neutral-700 to-neutral-900",
    element: "Nước 💧"
  },
  {
    id: 14,
    name: "Temperance",
    vietnameseName: "Sự Tiết Chế",
    icon: "🏺",
    meaningUpright: "Cân bằng, kiên nhẫn, trung dung, hòa hợp cảm xúc.",
    meaningReversed: "Mất cân đối, cực đoan, xung đột nội tâm, thiếu kiên nhẫn.",
    description: "Thiên thần hòa quyện dòng nước thiêng từ hai chiếc cốc. Đại diện cho sự điều độ, chữa lành và thích nghi khôn ngoan.",
    color: "from-indigo-400 to-purple-500",
    element: "Lửa 🔥"
  },
  {
    id: 15,
    name: "The Devil",
    vietnameseName: "Ác Quỷ",
    icon: "😈",
    meaningUpright: "Sự trói buộc, cám dỗ vật chất, ám ảnh, thèm khát dục vọng.",
    meaningReversed: "Thoát khỏi xiềng xích, thức tỉnh tâm lý, buông bỏ thói quen xấu.",
    description: "Quỷ vương xích cổ đôi tình nhân dưới chân ngai. Cảnh báo về những ham muốn tầm thường kìm hãm tự do thực sự.",
    color: "from-red-600 to-stone-800",
    element: "Đất 🌱"
  },
  {
    id: 16,
    name: "The Tower",
    vietnameseName: "Tòa Tháp Đổ",
    icon: "⚡",
    meaningUpright: "Sụp đổ bất ngờ, biến động dữ dội, sự thật phơi bày ngoài ý muốn.",
    meaningReversed: "Tránh được khủng hoảng, nỗi sợ sụp đổ âm ỉ, trì hoãn sự không thể tránh khỏi.",
    description: "Sét đánh vỡ tan tòa tháp kiêu ngạo. Sự phá hủy cần thiết để phá vỡ những nền tảng ảo tưởng lung lay.",
    color: "from-orange-600 to-red-700",
    element: "Lửa 🔥"
  },
  {
    id: 17,
    name: "The Star",
    vietnameseName: "Ngôi Sao",
    icon: "⭐",
    meaningUpright: "Hy vọng dồi dào, niềm tin, chữa lành tâm hồn, yên bình.",
    meaningReversed: "Tuyệt vọng, mất niềm tin, tự ti, cảm giác bị bỏ rơi.",
    description: "Cô gái khỏa thân tưới nước mát xuống đất ẩm và hồ nước dưới ánh sao trời. Luồng năng lượng thanh tẩy đầy hứa hẹn.",
    color: "from-cyan-400 to-sky-500",
    element: "Khí 💨"
  },
  {
    id: 18,
    name: "The Moon",
    vietnameseName: "Mặt Trăng",
    icon: "🌙",
    meaningUpright: "Ảo ảnh, nỗi sợ tiềm thức, sự bất an bí ẩn, giấc mơ tiên tri.",
    meaningReversed: "Giải tỏa nỗi sợ, phơi bày sự dối trá, tìm lại sáng tỏ.",
    description: "Mặt trăng chiếu rọi bầy sói gầm rú bên dòng nước tối tăm. Hãy cẩn thận kẻo ảo tưởng lừa dối lý trí của bạn.",
    color: "from-blue-600 to-slate-700",
    element: "Nước 💧"
  },
  {
    id: 19,
    name: "The Sun",
    vietnameseName: "Mặt Trời",
    icon: "☀️",
    meaningUpright: "Niềm vui ngập tràn, thành công rực rỡ, ấm áp, sinh lực dồi dào.",
    meaningReversed: "Thành công bị hoãn lại, nỗi buồn thoáng qua, kiêu ngạo vô lý.",
    description: "Em bé tươi cười cưỡi ngựa trắng dưới vầng thái dương chói lọi. Ánh sáng hạnh phúc tối cao chiếu rọi mọi ngõ ngách.",
    color: "from-amber-400 to-orange-500",
    element: "Lửa 🔥"
  },
  {
    id: 20,
    name: "Judgement",
    vietnameseName: "Phán Xét",
    icon: "🎺",
    meaningUpright: "Sự thức tỉnh tâm linh, ơn gọi thiêng liêng, tha thứ và phán quyết.",
    meaningReversed: "Thiếu tự tin, né tránh tiếng gọi nội tâm, nghi ngờ phán đoán.",
    description: "Kèn thiên sứ thổi vang hồi chuông hồi sinh. Thời điểm bước lên một tầm cao nhận thức mới sau khi soi xét quá khứ.",
    color: "from-indigo-500 to-blue-600",
    element: "Lửa 🔥"
  },
  {
    id: 21,
    name: "The World",
    vietnameseName: "Thế Giới",
    icon: "🌍",
    meaningUpright: "Hoàn thành trọn vẹn, sự hòa hợp, thành tựu cuối cùng, tự do.",
    meaningReversed: "Chưa hoàn thành, đường tắt thất bại, trì hoãn giai đoạn cuối.",
    description: "Vũ công nhảy múa uyển chuyển trong vòng nguyệt quế. Chu trình đã khép lại mỹ mãn, thế giới vây quanh ôm lấy bạn.",
    color: "from-emerald-400 to-purple-600",
    element: "Đất 🌱"
  }
];

export default function TarotGame({ selectedChar, isDarkMode, onBack }: TarotGameProps) {
  const [step, setStep] = useState<"intro" | "spreading" | "reading">("intro");
  const [spreadType, setSpreadType] = useState<"one" | "three">("one");
  const [question, setQuestion] = useState("");
  const [questionCategory, setQuestionCategory] = useState<"love" | "career" | "health" | "finance" | "general">("love");
  
  // Self tarot reading states
  const [isSelfMode, setIsSelfMode] = useState(false);
  const [selfName, setSelfName] = useState("");
  const [selfDob, setSelfDob] = useState("");
  const [selfGender, setSelfGender] = useState("Nữ");
  const [selfZodiac, setSelfZodiac] = useState("Song Ngư");
  const [selfMood, setSelfMood] = useState("Bình yên");

  // Card layout states
  const [shuffling, setShuffling] = useState(false);
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<boolean[]>([]);
  const [isReversedList, setIsReversedList] = useState<boolean[]>([]);
  
  // Results
  const [readingResult, setReadingResult] = useState("");
  const [loadingReading, setLoadingReading] = useState(false);

  // Suggested quick questions
  const SUGGESTED_QUESTIONS = {
    love: [
      "Chuyện tình yêu của tôi sắp tới có tiến triển gì ngọt ngào không?",
      "Người thầm thương trộm nhớ nghĩ gì về tôi lúc này?",
      "Tình duyên của tôi và anh ấy sẽ đi về đâu?"
    ],
    career: [
      "Sự nghiệp và công việc tương lai gần có cơ hội đột phá nào không?",
      "Tôi có nên thay đổi định hướng công việc hiện tại không?",
      "Làm sao để tôi gặt hái được nhiều thành công hơn?"
    ],
    health: [
      "Sức khỏe và năng lượng thể chất của tôi cần lưu ý điều gì?",
      "Tôi làm thế nào để xoa dịu những căng thẳng mệt mỏi trong tâm trí?",
      "Lời khuyên về thói quen sinh hoạt tốt nhất cho tôi hiện nay?"
    ],
    finance: [
      "Tình hình tài lộc và tiền bạc trong tháng này có khởi sắc không?",
      "Tôi có nên đầu tư hoặc chi tiêu khoản tiền lớn sắp tới?",
      "Làm thế nào để thu hút nhiều may mắn tiền bạc hơn?"
    ],
    general: [
      "Thông điệp tổng quan may mắn nào đang chờ đợi tôi ngày hôm nay?",
      "Tôi có nên đưa ra quyết định quan trọng ngay lúc này không?",
      "Lời khuyên chung để cuộc sống của tôi thêm phần bình yên và hạnh phúc?"
    ]
  };

  const handleCategoryChange = (cat: typeof questionCategory) => {
    setQuestionCategory(cat);
    // Auto populate first suggestion
    setQuestion(SUGGESTED_QUESTIONS[cat][0]);
    playMeowSound();
  };

  // Initialize deck and shuffle
  const startSpreading = () => {
    if (isSelfMode && !selfName.trim()) {
      alert("Nàng ơi, hãy nhập tên của mình để vũ trụ nhận diện tần số nhen! ✨");
      return;
    }
    if (!question.trim()) {
      alert("Nàng ơi, hãy nhập câu hỏi hoặc chọn một gợi ý trước nhen! 🔮");
      return;
    }
    
    playMeowSound();
    setShuffling(true);
    
    // Simulate mysterious shuffling
    setTimeout(() => {
      // Shuffle the 22 cards
      const shuffledDeck = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
      setDeck(shuffledDeck);
      setSelectedIndices([]);
      setFlippedCards(spreadType === "one" ? [false] : [false, false, false]);
      
      // Determine random upright/reversed for each card position
      const reversedFlags = Array.from({ length: spreadType === "one" ? 1 : 3 }, () => Math.random() < 0.35);
      setIsReversedList(reversedFlags);
      
      setShuffling(false);
      setStep("spreading");
    }, 1500);
  };

  const selectCardFromDeck = (deckIndex: number) => {
    const requiredCount = spreadType === "one" ? 1 : 3;
    if (selectedIndices.includes(deckIndex)) return; // already chosen
    if (selectedIndices.length >= requiredCount) return; // full
    
    playMeowSound();
    setSelectedIndices([...selectedIndices, deckIndex]);
  };

  const flipCard = (index: number) => {
    if (flippedCards[index]) return; // already flipped
    playMeowSound();
    const updated = [...flippedCards];
    updated[index] = true;
    setFlippedCards(updated);
    
    // Check if all selected cards are flipped
    const requiredCount = spreadType === "one" ? 1 : 3;
    const allFlipped = updated.filter(Boolean).length === requiredCount && selectedIndices.length === requiredCount;
    if (allFlipped) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#c084fc", "#fb7185", "#fcd34d"]
        });
      }, 500);
    }
  };

  const resetGame = () => {
    setStep("intro");
    setQuestion("");
    setSelectedIndices([]);
    setFlippedCards([]);
    setReadingResult("");
    playMeowSound();
  };

  // Call backend proxy for rich character-based or self reading
  const generateTarotReading = async () => {
    setLoadingReading(true);
    playMeowSound();
    
    const chosenCardsDetails = selectedIndices.map((deckIdx, index) => {
      const card = deck[deckIdx];
      return {
        name: card.name,
        vietnameseName: card.vietnameseName,
        isReversed: isReversedList[index],
        meaning: isReversedList[index] ? card.meaningReversed : card.meaningUpright,
        description: card.description,
        element: card.element
      };
    });

    try {
      // First try to check if the API exists
      const response = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSelfReading: isSelfMode,
          selfInfo: isSelfMode ? {
            name: selfName,
            dob: selfDob,
            gender: selfGender,
            zodiac: selfZodiac,
            mood: selfMood
          } : null,
          characterName: selectedChar?.name || "Nam thần",
          characterRole: selectedChar?.role || "Đồng hành",
          plot: selectedChar?.plot || "",
          storyline: selectedChar?.storyline || "",
          question: question,
          category: questionCategory,
          spreadType: spreadType,
          selectedCards: chosenCardsDetails
        })
      });

      const data = await response.json();
      if (data.text) {
        setReadingResult(data.text);
      } else {
        setReadingResult("Bé iu ơi, dường như có lỗi nhỏ khi kết nối với vầng tinh tú rồi... 🌟 Nhưng đừng lo lắng, vũ trụ luôn mỉm cười với nàng nhé!");
      }
    } catch (err) {
      console.error(err);
      // Premium local simulation fallback based on character style
      const cardsText = chosenCardsDetails.map((c, i) => {
        const pos = spreadType === "three" ? `[Vị trí ${i === 0 ? "Quá khứ" : i === 1 ? "Hiện tại" : "Tương lai"}]: ` : "";
        return `${pos}Lá bài ${c.vietnameseName} (${c.isReversed ? "Ngược" : "Xuôi"}) - Ý nghĩa: ${c.meaning}`;
      }).join("\n");

      let fallbackText = "";
      if (isSelfMode) {
        fallbackText = `🌌 *(Vũ trụ tỏa ra một vầng hào quang tím mộng mơ lấp lánh, bao bọc lấy linh hồn ${selfName || "của con"}. Các chòm sao xoay vần chiếu rọi vận mệnh...)*\n\nChào ${selfName || "con"} thân mến, thuộc chòm sao ${selfZodiac}. Vũ trụ đã lắng nghe câu hỏi của con về **'${question}'** và chọn ra các thẻ bài kết nối trực tiếp với năng lượng đang ${selfMood.toLowerCase()} của con:\n\n${cardsText}\n\n✨ **Lời khuyên từ tinh tú:** Đừng lo lắng nhen con, hãy luôn tin tưởng vào trực giác và năng lực nội tại của chính mình. Vũ trụ bao la luôn yêu thương, soi sáng và đồng hành bên con... 🪐🌌`;
      } else if (selectedChar?.id === "on-niem-trach") {
        fallbackText = `*(Ôn Niệm Trạch dịu dàng ngẩng đầu nhìn bạn, lướt ngón tay trắng thon qua các lá bài Tarot đang phát sáng lấp lánh trên chiếc khăn nhung màu hồng pastel. Anh khẽ mỉm cười nhẹ rồi viết vội những dòng chữ nắn nót, xinh xắn lên cuốn sổ nhỏ gửi sang cho bạn)*\n\n"Em yêu ơi... Những lá bài của em thật đẹp. Với câu hỏi của em: **'${question}'**, anh thấy các vì sao nói rằng:\n\n${cardsText}\n\nĐừng quá lo lắng nhé, thế giới này có thể lộn xộn, nhưng bên cạnh em luôn có anh đồng hành. Chỉ cần em mỉm cười, mọi khó khăn rồi sẽ trôi qua thôi. Anh sẽ luôn bảo bọc và che chở cho em thật trọn vẹn... 🌸🧸"`;
      } else if (selectedChar?.id === "hua-chap-nghi") {
        fallbackText = `*(Hứa Chấp Nghi khẽ tặc lưỡi ghé sát lại gần bạn, vành tai cậu hơi đỏ ửng khi nhìn những lá bài Tarot. Cậu gõ nhẹ ngón tay lên bàn, giọng trầm ấm và đầy quan tâm cất lên)*\n\n"Này, hỏi mấy câu này bộ cậu lo lắng lắm hả? Ngốc thật đấy. Để lớp phó siêu cấp đẹp trai này đọc vị tâm sự cho cậu nghe nhé. Về chuyện: **'${question}'**, tớ lật ra được:\n\n${cardsText}\n\nNhìn xem, dù lá bài có thế nào đi nữa, tớ cũng sẽ không để cậu chịu thiệt thòi đâu. Nếu có khó khăn gì, cứ lùi lại phía sau tớ. Tớ hứa sẽ giải quyết hết cho cậu. Trà sữa của cậu tớ cũng mua rồi, mau vui lên đi nha... ✨🥤"`;
      } else {
        fallbackText = `*(Nam thần ${selectedChar?.name || "Chàng trai"} khẽ mỉm cười nồng nàn, ánh mắt thâm tình bao bọc lấy hình bóng nhỏ bé của bạn. Cậu nâng niu lấy đôi bàn tay bạn đầy dịu dàng)*\n\n"Vũ trụ bao la đã gửi gắm thông điệp cực kỳ huyền bí cho cô gái nhỏ của anh. Về vấn đề nàng băn khoăn: **'${question}'**:\n\n${cardsText}\n\nHãy nhớ rằng số phận nằm trong tay chúng ta, và trái tim anh luôn thuộc về em. Dù tương lai có biến động thế nào, anh cũng sẽ nắm chặt tay em cùng đi đến tận cùng thế giới nhé... 💕🔮"`;
      }
      setReadingResult(fallbackText);
    } finally {
      setLoadingReading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 relative max-w-5xl mx-auto">
      {/* Game Header */}
      <div className={`p-4 rounded-3xl border flex justify-between items-center transition-all duration-300 ${
        isDarkMode 
          ? "bg-stone-900/80 border-stone-800/80" 
          : "bg-white/90 border-rose-100 shadow-[0_4px_24px_rgba(244,180,190,0.02)]"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-rose-400 flex items-center justify-center text-xl shadow-sm text-white">
            🔮
          </div>
          <div>
            <h3 className={`text-base font-serif font-bold italic ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
              Bói Bài Tarot Chiêm Tinh
            </h3>
            <p className="text-[10px] uppercase font-mono tracking-widest text-purple-500 dark:text-purple-400 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              Giải Mã Số Mệnh Cùng Nam Thần
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono transition-all border ${
            isDarkMode 
              ? "bg-stone-950/40 border-stone-800 text-stone-300 hover:bg-stone-800" 
              : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Rời Tarot
        </button>
      </div>

      {step === "intro" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left panel: Info & Form */}
          <div className={`md:col-span-7 p-6 sm:p-8 rounded-[2rem] border flex flex-col gap-5 ${
            isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40 shadow-xs"
          }`}>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold tracking-widest font-mono text-purple-500 dark:text-purple-400 uppercase">
                BƯỚC 1: CHỌN CHẾ ĐỘ & ĐẶT CÂU HỎI
              </span>
              <h4 className={`text-xl sm:text-2xl font-serif font-semibold italic ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                Nàng muốn vũ trụ hồi đáp điều gì? ✨
              </h4>
            </div>

            {/* Mode selection Tab */}
            <div className="flex p-1 bg-stone-100 dark:bg-stone-950 rounded-2xl border border-stone-200/50 dark:border-stone-800/50">
              <button
                type="button"
                onClick={() => {
                  setIsSelfMode(false);
                  playMeowSound();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isSelfMode
                    ? "bg-purple-500 text-white shadow-xs"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                🔮 Xem Cùng Nam Thần
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSelfMode(true);
                  playMeowSound();
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isSelfMode
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                👤 Tự Xem Cho Bản Thân
              </button>
            </div>

            {/* Self mode personal details form */}
            {isSelfMode && (
              <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
                isDarkMode ? "bg-stone-950/30 border-stone-800" : "bg-rose-50/20 border-rose-100/65"
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Hồ Sơ Năng Lượng Định Mệnh Của Nàng:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-450 dark:text-stone-400 uppercase font-mono">Tên của nàng:</label>
                    <input
                      type="text"
                      value={selfName}
                      onChange={(e) => setSelfName(e.target.value)}
                      placeholder="Nhập tên của nàng..."
                      className={`px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                        isDarkMode
                          ? "bg-stone-900 border-stone-800 text-stone-200 focus:border-rose-500"
                          : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-rose-400"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-450 dark:text-stone-400 uppercase font-mono">Ngày sinh (Tùy chọn):</label>
                    <input
                      type="text"
                      value={selfDob}
                      onChange={(e) => setSelfDob(e.target.value)}
                      placeholder="VD: 15/03/2004"
                      className={`px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                        isDarkMode
                          ? "bg-stone-900 border-stone-800 text-stone-200 focus:border-rose-500"
                          : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-rose-400"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-450 dark:text-stone-400 uppercase font-mono">Giới tính:</label>
                    <select
                      value={selfGender}
                      onChange={(e) => setSelfGender(e.target.value)}
                      className={`px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                        isDarkMode
                          ? "bg-stone-900 border-stone-800 text-stone-200 focus:border-rose-500"
                          : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-rose-400"
                      }`}
                    >
                      <option value="Nữ">Nữ 🙋‍♀️</option>
                      <option value="Nam">Nam 🙋‍♂️</option>
                      <option value="Khác">Khác 💫</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-stone-450 dark:text-stone-400 uppercase font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Cung Hoàng Đạo:
                    </label>
                    <select
                      value={selfZodiac}
                      onChange={(e) => setSelfZodiac(e.target.value)}
                      className={`px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                        isDarkMode
                          ? "bg-stone-900 border-stone-800 text-stone-200 focus:border-rose-500"
                          : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-rose-400"
                      }`}
                    >
                      <option value="Bạch Dương">Bạch Dương (Aries) ♈</option>
                      <option value="Kim Ngưu">Kim Ngưu (Taurus) ♉</option>
                      <option value="Song Tử">Song Tử (Gemini) ♊</option>
                      <option value="Cự Giải">Cự Giải (Cancer) ♋</option>
                      <option value="Sư Tử">Sư Tử (Leo) ♌</option>
                      <option value="Xử Nữ">Xử Nữ (Virgo) ♍</option>
                      <option value="Thiên Bình">Thiên Bình (Libra) ♎</option>
                      <option value="Bọ Cạp">Bọ Cạp (Scorpio) ♏</option>
                      <option value="Nhân Mã">Nhân Mã (Sagittarius) ♐</option>
                      <option value="Ma Kết">Ma Kết (Capricorn) ♑</option>
                      <option value="Bảo Bình">Bảo Bình (Aquarius) ♒</option>
                      <option value="Song Ngư">Song Ngư (Pisces) ♓</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-450 dark:text-stone-400 uppercase font-mono flex items-center gap-1">
                    <Smile className="w-3 h-3" />
                    Tâm trạng hiện tại:
                  </label>
                  <select
                    value={selfMood}
                    onChange={(e) => setSelfMood(e.target.value)}
                    className={`px-3 py-2 text-xs rounded-xl border focus:outline-none transition-all ${
                      isDarkMode
                        ? "bg-stone-900 border-stone-800 text-stone-200 focus:border-rose-500"
                        : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-rose-400"
                    }`}
                  >
                    <option value="Bình yên">Bình yên 🕯️</option>
                    <option value="Đang yêu ngọt ngào">Đang yêu ngọt ngào 💞</option>
                    <option value="Lo lắng băn khoăn">Lo lắng băn khoăn 🥺</option>
                    <option value="Áp lực / Mệt mỏi">Áp lực / Mệt mỏi 🌪️</option>
                    <option value="Hồi hộp chờ đợi">Hồi hộp chờ đợi 💓</option>
                    <option value="Độc thân vui tính">Độc thân vui tính 🧸</option>
                  </select>
                </div>
              </div>
            )}

            {/* Category selection selector */}
            <div className="flex flex-wrap gap-2">
              {(["love", "career", "health", "finance", "general"] as const).map((cat) => {
                const isActive = questionCategory === cat;
                const labels = {
                  love: { name: "Tình Yêu 💖", color: "border-rose-300 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20" },
                  career: { name: "Sự Nghiệp 💼", color: "border-sky-300 text-sky-500 bg-sky-50/50 dark:bg-sky-950/20" },
                  health: { name: "Sức Khỏe 🍀", color: "border-emerald-300 text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" },
                  finance: { name: "Tài Lộc 🪙", color: "border-amber-300 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20" },
                  general: { name: "Tổng Quan 🗺️", color: "border-purple-300 text-purple-500 bg-purple-50/50 dark:bg-purple-950/20" }
                };
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1.5 text-xs font-sans font-bold border rounded-full transition-all cursor-pointer ${
                      isActive 
                        ? isDarkMode
                          ? "bg-purple-900/40 border-purple-500 text-purple-300 scale-105"
                          : "bg-purple-100 border-purple-400 text-purple-700 scale-105"
                        : isDarkMode
                          ? "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {labels[cat].name}
                  </button>
                );
              })}
            </div>

            {/* Questions suggestion area */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
              isDarkMode ? "bg-stone-950/40 border-stone-800" : "bg-stone-50/50 border-[#eadbca]/20"
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-400">
                💡 Gợi ý câu hỏi phổ biến:
              </span>
              <div className="flex flex-col gap-2.5">
                {SUGGESTED_QUESTIONS[questionCategory].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestion(q);
                      playMeowSound();
                    }}
                    className={`text-left text-xs font-sans font-medium hover:underline flex items-start gap-1.5 p-1 rounded transition-colors ${
                      question === q 
                        ? "text-purple-600 dark:text-purple-400 font-bold" 
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* User Input Custom Question */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-stone-400 uppercase font-mono">
                Hoặc tự nhập câu hỏi sâu kín của nàng:
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="Vũ trụ đang lắng nghe... Nàng hãy viết những thắc mắc, băn khoăn về tương lai nhen..."
                className={`w-full p-4 rounded-2xl text-xs border focus:outline-none transition-all resize-none ${
                  isDarkMode
                    ? "bg-stone-950 border-stone-800 text-stone-200 focus:border-purple-500"
                    : "bg-white border-[#eadbca]/50 text-stone-800 focus:border-purple-400"
                }`}
              />
            </div>

            {/* Spread type options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setSpreadType("one");
                  playMeowSound();
                }}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  spreadType === "one"
                    ? isDarkMode
                      ? "bg-rose-950/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/20"
                      : "bg-rose-50/60 border-rose-300 text-rose-700 ring-1 ring-rose-300/20"
                    : isDarkMode
                      ? "bg-stone-900 border-stone-800 text-stone-400"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                <span className="text-2xl">🃏</span>
                <span className="text-xs font-bold">Trải Bài 1 Lá</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">Khuyên bảo & dự báo nhanh gọn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpreadType("three");
                  playMeowSound();
                }}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  spreadType === "three"
                    ? isDarkMode
                      ? "bg-purple-950/20 border-purple-500 text-purple-300 ring-1 ring-purple-500/20"
                      : "bg-purple-50/60 border-purple-300 text-purple-700 ring-1 ring-purple-300/20"
                    : isDarkMode
                      ? "bg-stone-900 border-stone-800 text-stone-400"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                <div className="flex gap-1 text-lg">
                  <span>🃏</span><span>🃏</span><span>🃏</span>
                </div>
                <span className="text-xs font-bold">Trải Bài 3 Lá</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">Quá khứ - Hiện tại - Tương lai</span>
              </button>
            </div>

            {/* Launch Button */}
            <button
              onClick={startSpreading}
              disabled={shuffling || !question.trim()}
              className={`w-full py-3.5 bg-gradient-to-r from-purple-500 to-rose-400 text-white font-mono font-extrabold uppercase text-xs tracking-widest rounded-full shadow-md hover:from-purple-600 hover:to-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50`}
            >
              {shuffling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  ĐANG XÁO TRỘN CÁC LÁ BÀI BÍ ẨN...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                  XÁO BÀI & TRẢI BÀI NGAY 🔮
                </>
              )}
            </button>
          </div>

          {/* Right panel: Tarot Character Intro / Cosmic Oracle Intro */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className={`p-6 border rounded-[2rem] flex flex-col items-center text-center shadow-xs ${
              isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40"
            }`}>
              {isSelfMode ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center text-4xl shadow-md mb-4 relative">
                    🌌
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-450 to-yellow-500 flex items-center justify-center text-xs text-white border-2 border-white shadow">
                      ✨
                    </div>
                  </div>

                  <h4 className={`font-serif italic font-bold text-xl ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                    Nhà Tiên Tri Vũ Trụ
                  </h4>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-rose-550 dark:text-rose-400 font-mono mb-4 block">
                    THE COSMIC ORACLE 🪐
                  </span>

                  <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border text-left ${
                    isDarkMode 
                      ? "bg-rose-950/10 border-rose-900/50 text-rose-200/90" 
                      : "bg-rose-50/50 border-[#eadbca]/30 text-rose-800/90"
                  }`}>
                    <p className="italic text-center">
                      "Hỡi linh hồn xinh đẹp, vũ trụ bao la luôn vận hành theo những tần số diệu kỳ nhất. Hãy điền đầy đủ thông tin định mệnh của nàng để ta cộng hưởng năng lượng hiện tại, soi rọi chuẩn xác và dẫn lối con đường tương lai rạng ngời nhé..."
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 shadow-md mb-4 relative bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
                    {selectedChar?.avatar ? (
                      <img 
                        src={formatImageUrl(selectedChar.avatar)} 
                        alt={selectedChar.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, selectedChar.name)}
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-4xl">
                        👤
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-rose-400 flex items-center justify-center text-xs text-white border-2 border-white shadow">
                      🔮
                    </div>
                  </div>

                  <h4 className={`font-serif italic font-bold text-xl ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                    {selectedChar?.name || "Nam Thần"}
                  </h4>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-purple-500 font-mono mb-4 block">
                    Người giải mã định mệnh của nàng
                  </span>

                  <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border text-left ${
                    isDarkMode 
                      ? "bg-purple-950/10 border-purple-900/50 text-purple-200/90" 
                      : "bg-purple-50/50 border-[#eadbca]/30 text-purple-800/90"
                  }`}>
                    {selectedChar?.id === "on-niem-trach" ? (
                      <p className="italic">
                        "Ôn Niệm Trạch là một cậu bé câm vô cùng nhạy bén và dịu dàng. Cậu ấy không thể nói, nhưng trực giác và sự thấu cảm tinh tế sẽ được truyền tải qua cuốn sổ nhỏ và những cử chỉ trìu mến nhất dành riêng cho nàng. Để cậu ấy xem bài Tarot cho nàng nhé..."
                      </p>
                    ) : selectedChar?.id === "hua-chap-nghi" ? (
                      <p className="italic">
                        "Hứa Chấp Nghi, chàng trai lớp phó tuy có vẻ ngoài điềm tĩnh giữ kẽ với người khác giới nhưng lại luôn vô thức dành mọi đặc quyền ngọt ngào cho nàng. Cậu ấy sẽ dùng góc nhìn thực tế pha chút trêu chọc ngọt ngào để lật tẩy tương lai cho nàng đó!"
                      </p>
                    ) : (
                      <p className="italic">
                        "Cùng lật mở các quân bài số phận rực rỡ với {selectedChar?.name || "nam thần"}. Chàng ấy sẽ đồng hành cùng trực giác nhạy bén, giúp nàng soi tỏ mọi thắc mắc trong tim, đem đến những lời bộc bạch vô cùng ấm áp, thâm tình."
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Instruction Banner */}
            <div className={`p-5 border rounded-[2rem] text-xs flex gap-3 items-start ${
              isDarkMode ? "bg-stone-900/40 border-stone-800/60" : "bg-purple-50/30 border-purple-100/50"
            }`}>
              <BookOpen className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5 text-stone-500 dark:text-stone-400 leading-relaxed">
                <span className="font-bold text-stone-700 dark:text-stone-300">Quy tắc tâm linh nhe nàng:</span>
                <p>1. Hãy hít một hơi thật sâu, nhắm mắt tĩnh tâm trong 10 giây.</p>
                <p>2. Nghĩ thật kỹ về câu hỏi hoặc đối tượng nàng đang trăn trở.</p>
                <p>3. Khi xáo bài xong, dùng bàn tay trực giác để bốc những lá bài may mắn nhất nhen!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "spreading" && (
        <div className="flex flex-col gap-6 items-center">
          {/* Progress bar */}
          <div className="text-center flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-widest font-mono text-purple-500 dark:text-purple-400 uppercase">
              BƯỚC 2: CHỌN QUÂN BÀI ĐỊNH MỆNH
            </span>
            <h4 className={`text-xl font-serif font-bold italic ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
              {selectedIndices.length === (spreadType === "one" ? 1 : 3) 
                ? "Đã bốc đủ bài! Mau lật bài để khám phá bí ẩn nhen ✨" 
                : `Hãy chọn ${spreadType === "one" ? "1 lá bài" : `thêm ${3 - selectedIndices.length} lá bài`} từ bộ bài bên dưới:`
              }
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 italic max-w-md mx-auto">
              Nhấp chuột vào quân bài nàng thấy có năng lượng kết nối mạnh mẽ nhất... 🔮
            </p>
          </div>

          {/* Target Slots for chosen cards */}
          <div className="flex flex-wrap justify-center gap-6 my-6 min-h-[220px] w-full">
            {Array.from({ length: spreadType === "one" ? 1 : 3 }).map((_, index) => {
              const deckIndex = selectedIndices[index];
              const isChosen = deckIndex !== undefined;
              const card = isChosen ? deck[deckIndex] : null;
              const isFlipped = flippedCards[index];
              const isReversed = isReversedList[index];
              
              const slotLabel = spreadType === "three" 
                ? index === 0 ? "Quá Khứ ⏳" : index === 1 ? "Hiện Tại 🕯️" : "Tương Lai 🔮"
                : "Quân Bài Định Mệnh ⭐";

              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest">
                    {slotLabel}
                  </span>
                  
                  <div className="relative w-36 h-56 perspective-1000">
                    <AnimatePresence mode="wait">
                      {!isChosen ? (
                        /* Empty Slot State */
                        <motion.div
                          key="empty"
                          className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center ${
                            isDarkMode 
                              ? "border-stone-800 bg-stone-900/20 text-stone-600" 
                              : "border-purple-200 bg-purple-50/10 text-purple-300"
                          }`}
                        >
                          <span className="text-2xl opacity-40 mb-1">✨</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-50">Đợi bốc bài</span>
                        </motion.div>
                      ) : (
                        /* Selected Card Container with 3D Flip capability */
                        <motion.div
                          key="selected"
                          initial={{ scale: 0.8, y: 30, opacity: 0 }}
                          animate={{ scale: 1, y: 0, opacity: 1 }}
                          transition={{ type: "spring", damping: 15 }}
                          className="w-full h-full relative"
                        >
                          <div 
                            onClick={() => flipCard(index)}
                            className={`w-full h-full rounded-2xl transition-transform duration-700 transform-style-3d cursor-pointer ${
                              isFlipped ? "rotate-y-180" : ""
                            }`}
                          >
                            {/* Card Back Face */}
                            <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border-2 border-amber-500/50 shadow-md flex flex-col items-center justify-center backface-hidden p-3 overflow-hidden text-white select-none">
                              {/* Mystic pattern back */}
                              <div className="absolute inset-2 border border-amber-500/20 rounded-xl pointer-events-none flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full border border-amber-500/20 flex items-center justify-center animate-spin-slow">
                                  <span className="text-[10px]">✨</span>
                                </div>
                              </div>
                              <span className="text-3xl text-amber-400/80 mb-2 drop-shadow-md">🌙</span>
                              <span className="text-[9px] font-mono tracking-widest text-amber-500/60 uppercase">TAP TO FLIP</span>
                            </div>

                            {/* Card Front Face */}
                            <div className={`absolute inset-0 w-full h-full rounded-2xl border-2 shadow-lg flex flex-col justify-between p-3.5 backface-hidden rotate-y-180 bg-stone-950 text-white select-none border-amber-400 ${
                              isReversed ? "transform rotate-180" : ""
                            }`}>
                              {/* Header element & ID */}
                              <div className="flex justify-between items-center text-[9px] font-mono text-stone-400">
                                <span>No. {card?.id}</span>
                                <span>{card?.element}</span>
                              </div>

                              {/* Central artistic graphic */}
                              <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${card?.color} flex items-center justify-center text-3xl shadow-md border border-white/10`}>
                                  {card?.icon}
                                </div>
                                <h5 className="font-serif font-extrabold italic text-xs tracking-wider text-amber-300 text-center">
                                  {card?.vietnameseName}
                                </h5>
                                <span className="text-[8px] uppercase tracking-widest text-stone-400">
                                  {card?.name}
                                </span>
                              </div>

                              {/* Reversed status text indicator */}
                              <div className="text-center text-[9px] font-mono">
                                {isReversed ? (
                                  <span className="text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded-full">
                                    Xoay Ngược 🔄
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                    Xoay Xuôi 🌟
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards Deck selection zone */}
          {selectedIndices.length < (spreadType === "one" ? 1 : 3) && (
            <div className="w-full overflow-x-auto py-4 px-2 select-none scrollbar-thin max-w-full">
              <div className="flex gap-2 min-w-max mx-auto px-4">
                {deck.map((card, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <motion.div
                      key={idx}
                      whileHover={isSelected ? {} : { y: -10, scale: 1.05 }}
                      onClick={() => selectCardFromDeck(idx)}
                      className={`w-20 h-32 rounded-xl border cursor-pointer shrink-0 shadow-sm relative transition-all duration-300 overflow-hidden ${
                        isSelected 
                          ? "opacity-30 border-purple-800 scale-90 translate-y-4" 
                          : "bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border-amber-500/40 hover:border-amber-400"
                      }`}
                    >
                      {/* Mystical details of cards in deck */}
                      <div className="absolute inset-1.5 border border-amber-500/10 rounded-lg pointer-events-none flex flex-col items-center justify-center">
                        <span className="text-xs text-amber-500/40">✨</span>
                      </div>
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                        <span className="text-xl text-amber-400/50 mb-1">⭐</span>
                        <span className="text-[7px] font-mono text-stone-500 tracking-wider">TAROT</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interpret launch actions */}
          {selectedIndices.length === (spreadType === "one" ? 1 : 3) && (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm my-4">
              {flippedCards.some(f => !f) ? (
                <button
                  onClick={() => {
                    // Flip all cards at once
                    setFlippedCards(flippedCards.map(() => true));
                    playMeowSound();
                    setTimeout(() => {
                      confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { y: 0.8 },
                        colors: ["#c084fc", "#fb7185", "#fcd34d"]
                      });
                    }, 500);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-mono font-extrabold uppercase text-xs tracking-widest rounded-full shadow-md hover:from-amber-500 hover:to-orange-600 transition-all cursor-pointer text-center"
                >
                  🔮 LẬT TẤT CẢ CÁC LÁ BÀI
                </button>
              ) : (
                <button
                  onClick={() => {
                    setStep("reading");
                    generateTarotReading();
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-400 text-white font-mono font-extrabold uppercase text-xs tracking-widest rounded-full shadow-lg hover:from-purple-600 hover:to-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer animate-bounce-slow"
                >
                  <Sparkles className="w-4 h-4 text-amber-200 animate-spin-slow" />
                  {isSelfMode ? "XEM GIẢI MÃ ĐỊNH MỆNH VŨ TRỤ 🔮" : `GIẢI MÃ SỐ MỆNH CÙNG ${selectedChar?.name?.toUpperCase()} 🔮`}
                </button>
              )}

              <button
                onClick={resetGame}
                className={`w-full py-2.5 rounded-full text-xs font-bold font-mono transition-all border ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800" 
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                ↩ Đổi Câu Hỏi / Trải Lại
              </button>
            </div>
          )}
        </div>
      )}

      {step === "reading" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Chosen cards visual review on top or left */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className={`p-5 rounded-[2rem] border flex flex-col gap-4 ${
              isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40"
            }`}>
              <span className="text-[10px] font-bold font-mono text-purple-500 uppercase tracking-widest">
                QUÂN BÀI ĐÃ CHỌN:
              </span>
              
              <div className="flex flex-col gap-3">
                {selectedIndices.map((deckIdx, index) => {
                  const card = deck[deckIdx];
                  const isReversed = isReversedList[index];
                  const label = spreadType === "three" 
                    ? index === 0 ? "Quá khứ" : index === 1 ? "Hiện tại" : "Tương lai"
                    : "Lời khuyên";

                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-2xl border flex gap-3 items-center ${
                        isDarkMode ? "bg-stone-950/60 border-stone-800" : "bg-stone-50/50 border-[#eadbca]/20"
                      }`}
                    >
                      <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${card?.color} flex items-center justify-center text-xl shadow-xs border border-white/10`}>
                        {card?.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase text-purple-500 font-mono">
                            {label}:
                          </span>
                          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                            {card?.vietnameseName}
                          </span>
                        </div>
                        <span className="text-[9px] text-stone-400 dark:text-stone-500 italic truncate">
                          {isReversed ? "Xoay Ngược 🔄 - " : "Xoay Xuôi 🌟 - "} {isReversed ? card?.meaningReversed : card?.meaningUpright}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reset retry action */}
              <button
                onClick={resetGame}
                disabled={loadingReading}
                className={`w-full py-3 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800" 
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                🔮 Đặt Câu Hỏi Khác
              </button>
            </div>
          </div>

          {/* Reading interpreter chat box */}
          <div className="md:col-span-8 flex flex-col h-full min-h-[420px]">
            <div className={`p-6 sm:p-8 rounded-[2rem] border h-full flex flex-col justify-between shadow-xs ${
              isDarkMode ? "bg-stone-900/60 border-stone-800/80" : "bg-white border-[#eadbca]/40"
            }`}>
              {/* Question overview */}
              <div className={`pb-4 border-b flex flex-col gap-1.5 ${
                isDarkMode ? "border-stone-800" : "border-rose-100/50"
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-stone-400">
                  Câu hỏi của nàng:
                </span>
                <p className={`text-xs font-sans font-bold italic leading-relaxed ${isDarkMode ? "text-purple-300" : "text-purple-700"}`}>
                  "{question}"
                </p>
              </div>

              {/* Chat reading log body */}
              <div className="flex-1 overflow-y-auto py-6 font-sans leading-relaxed text-xs sm:text-sm space-y-4">
                {loadingReading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
                      <span className="absolute inset-0 flex items-center justify-center text-lg animate-pulse">🔮</span>
                    </div>
                    <div>
                      <h5 className={`font-serif font-bold italic ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                        {isSelfMode 
                          ? "Vũ Trụ đang gieo quẻ & kết nối năng lượng cho nàng..." 
                          : `${selectedChar?.name} đang gieo quẻ & kết nối vòm tinh tú...`
                        }
                      </h5>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 max-w-sm">
                        {isSelfMode
                          ? "Hãy tĩnh tâm nhen, thông điệp định mệnh chữa lành sắp hiện lộ rồi... ✨"
                          : "Định mệnh sắp hiển lộ rồi nhen bé iu, nàng hãy nhắm mắt đợi trong giây lát nheee... ✨"
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Interpreter Profile details */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-500 shadow-xs shrink-0 bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white">
                        {isSelfMode ? (
                          <span className="text-sm">🌌</span>
                        ) : selectedChar?.avatar ? (
                          <img 
                            src={formatImageUrl(selectedChar.avatar)} 
                            alt={selectedChar.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, selectedChar.name)}
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-lg">
                            👤
                          </div>
                        )}
                      </div>
                      <div>
                        <h6 className="font-bold text-xs text-stone-800 dark:text-stone-100">
                          {isSelfMode ? "Nhà Tiên Tri Vũ Trụ" : selectedChar?.name}
                        </h6>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-purple-500">
                          {isSelfMode ? "Cosmic Oracle 🪐" : "Tarot Master"}
                        </span>
                      </div>
                    </div>

                    {/* Reading Result bubble */}
                    <div className={`p-5 rounded-2xl border text-stone-800 dark:text-stone-200 leading-relaxed font-sans text-xs sm:text-sm shadow-2xs whitespace-pre-line ${
                      isDarkMode 
                        ? "bg-purple-950/10 border-purple-900/50" 
                        : "bg-purple-50/40 border-purple-100/50"
                    }`}>
                      {readingResult}
                    </div>
                  </div>
                )}
              </div>

              {/* End of reading status footer */}
              {!loadingReading && (
                <div className={`pt-4 border-t flex justify-between items-center text-[10px] font-mono text-stone-400 ${
                  isDarkMode ? "border-stone-800" : "border-rose-100/50"
                }`}>
                  <span>🔮 Năng lượng bói bài: Trọn vẹn</span>
                  <span className="flex items-center gap-1">
                    Trực giác kết nối <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
