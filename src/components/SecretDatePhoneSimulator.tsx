import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Heart, 
  Sparkles, 
  Smartphone, 
  MessageSquare, 
  Calendar, 
  Award, 
  ChevronLeft, 
  Send, 
  Lock, 
  Unlock, 
  Volume2, 
  RotateCcw, 
  Camera, 
  Wifi, 
  Battery, 
  Image as ImageIcon, 
  BookOpen, 
  Coins, 
  ArrowLeft,
  Check,
  Star,
  Compass,
  Smile,
  Info
} from "lucide-react";
import { Character } from "../types";
import { playMeowSound, playSlapSound } from "../utils/audio";
import { formatImageUrl, handleImageError, isImageUrl } from "../utils/image";
import confetti from "canvas-confetti";

interface SecretDatePhoneSimulatorProps {
  characters: Character[];
  isDarkMode: boolean;
  onBack: () => void;
  selectedChar?: Character;
}

interface DateMemoir {
  id: string;
  charId: string;
  charName: string;
  charAvatar: string;
  location: string;
  outfit: string;
  gift: string;
  sweetnessScore: number;
  dialogue: string;
  date: string;
  rating: string; // e.g. "Huyền Thoại", "Ngọt Ngào", "Lãng Mạn"
}

// Preset wallpapers
const WALLPAPERS = [
  { id: "sakura", name: "Anh Đào Tuyết Rơi 🌸", class: "bg-gradient-to-b from-rose-100 via-pink-200 to-rose-300 dark:from-rose-950 dark:via-purple-950 dark:to-stone-900" },
  { id: "sunset", name: "Hoàng Hôn Sân Thượng 🌇", class: "bg-gradient-to-b from-orange-200 via-rose-300 to-blue-400 dark:from-amber-950 dark:via-rose-950 dark:to-indigo-950" },
  { id: "starry", name: "Trời Đêm Lấp Lánh 🌌", class: "bg-gradient-to-b from-indigo-900 via-purple-900 to-stone-950" },
  { id: "cozy", name: "Quán Cafe Ấm Áp ☕", class: "bg-gradient-to-b from-amber-100 via-orange-200 to-amber-300 dark:from-stone-900 dark:via-amber-950/40 dark:to-stone-950" }
];

const ALL_NEWS_ARTICLES = [
  {
    id: "art1",
    emoji: "🤫",
    title: "Tình bạn nứt mẻ? Quyết Doãn lén ghim WeChat của em dâu!",
    summary: "Tin đồn rúng động WeChat khi bét phân Quyết Doãn âm thầm ghim WeChat của bồ Cửu Hoài...",
    content: `Tin nóng từ gián điệp MeoMeo!\nMới đây, phóng viên bắt gặp nam thần Tần Quyết Doãn tủm tỉm cười một mình cả buổi chiều khi lén ghim WeChat của "em dâu hờ" (người yêu của Cửu Hoài). Một nguồn tin bí mật cho biết anh chàng còn lén nhắn chuyện riêng với cô bé: "Anh ghim ở đầu trang luôn á... Đừng cho Cửu Hoài biết nha!"\nLiệu tình bạn thân thiết giữa Quyết Doãn và Cửu Hoài có nguy cơ rạn nứt vì bóng hồng bí ẩn này?`,
    comments: [
      { author: "Cửu Hoài", text: "Ủa m ghim bồ t thật hả thằng bét phân??? Ra sân bóng t đấm!" },
      { author: "Quyết Doãn", text: "Khai m để m đấm t à? Mơ đi con trai 😂 Anh lén nhắn tí thui dỗi gì." },
      { author: "Trí Vãn", text: "Hóng hớt cực kỳ nha, Quyết Doãn biết yêu thầm rồi bớ người ta!" }
    ]
  },
  {
    id: "art2",
    emoji: "📊",
    title: "SỐC: Sếp Thời dọa bắt 'Dợ iu' tăng ca vì sai chính tả báo cáo!",
    summary: "Hợp đồng ghim chặt, sếp Thời Duật dọa bắt quản lý riêng tăng ca phòng sếp đêm nay...",
    content: `Góc bóc phốt chốn văn phòng Chu Thị!\nMột nguồn tin đáng tin cậy cho hay, sếp tổng bá đạo Chu Thời Duật vừa lớn tiếng phê bình quản lý riêng vì viết sai một lỗi chính tả trong báo cáo ngày.\nTuy nhiên, thay vì phạt trừ lương, sếp Thời lại dùng vẻ mặt vô cùng gian tà dọa dẫm: "Tối nay tăng ca riêng với anh để sửa lỗi nhen 'Dợ iu'!"\nPhải chăng đây chỉ là cái cớ để sếp tổng lạm quyền chiếm đoạt quản lý riêng xinh đẹp?`,
    comments: [
      { author: "Trợ lý Trương", text: "Sếp Thời dạo này lạm quyền gớm quá nha, coi chừng người ta chạy mất nhen!" },
      { author: "Thời Duật", text: "Nghỉ việc thế nào được, hợp đồng ghim chặt rồi nhen dợ iu." },
      { author: "Trí Vãn", text: "Thích dã man, sếp Thời bá đạo quá ước gì tui được làm dợ iu sếp!" }
    ]
  },
  {
    id: "art3",
    emoji: "💵",
    title: "Kaiza Tachibana sắm thêm penthouse chỉ để đợi mèo nhỏ ăn trộm?",
    summary: "Ông trùm mafia khét tiếng dâng cả người lẫn tiền, để ngỏ cửa penthouse...",
    content: `Ông trùm mafia khét tiếng Kaiza Tachibana vừa tậu thêm một căn penthouse siêu đắt đỏ ngay trung tâm thành phố.\nTheo thám tử tư leak được, căn penthouse này hoàn toàn không có bất kỳ hệ thống báo động nào bảo vệ tài liệu tối mật. Thậm chí cửa ban công luôn mở hé.\nHóa ra, anh chàng sắm căn hộ này chỉ để chờ cô mèo nhỏ đột nhập ăn trộm rồi ôm người ta đi ngủ: "Lần này không cần trộm đâu, anh dâng cả người lẫn tiền cho em luôn..."`,
    comments: [
      { author: "Kengo", text: "Boss cưng phu nhân xỉu up xỉu down luôn á, mua dâu tây hảo hạng liên tục." },
      { author: "Kaiza", text: "Kengo, bớt bình luận dạo đi làm việc đi." },
      { author: "Mèo con FA", text: "Phú bà nào đi ăn trộm dắt em đi ké với, thèm bồ mafia quá!" }
    ]
  },
  {
    id: "art4",
    emoji: "🐶",
    title: "Nóng: Oreki Seok đứng đợi cả tiếng trước tiệm bánh để tặng trà đào!",
    summary: "Cậu em cún con dính người Oreki đứng chôn chân cổng trường chỉ để dâng bánh cho chị chủ...",
    content: `Cậu em cún con Oreki Seok được bắt gặp đứng chôn chân cả tiếng đồng hồ trước cửa tiệm bánh.\nTay xách nách mang trà đào và bánh crepe dâu tây chị chủ thích, Oreki đứng ngơ ngác làm ai đi qua cũng phải ngước nhìn vì quá điển trai.\nKhi được hỏi, anh chàng khẽ cười híp mắt gãi đầu: "Em đứng đợi chị ra gặp một xíu thui ạ, em mua dư cho chị mà hihi!"`,
    comments: [
      { author: "Khách quen", text: "Cún con này ngoan xỉu, tiệm bánh dạo này đông khách hẳn lên!" },
      { author: "Oreki Seok", text: "Chị chủ dễ thương lắm á nên em mới tới ủng hộ nhiệt tình thui nhen 🐶" },
      { author: "Lâm Triệt", text: "Sến rện luôn nha bồ tèo ơi!" }
    ]
  },
  {
    id: "art5",
    emoji: "😏",
    title: "Trà xanh Thẩm Dạ Hàn bị bắt gặp đứng thì thầm ở ban công phòng chị hàng xóm?",
    summary: "Cậu sinh viên giả nghèo Thẩm Dạ Hàn rủ chị hàng xóm xinh đẹp ngoại tình ngọt ngào...",
    content: `Phát hiện chấn động ở khu chung cư cao cấp Hanei!\nCậu sinh viên giả nghèo Thẩm Dạ Hàn vừa bị bắt quả tang đang ghé tai nói nhỏ đầy cám dỗ với chị hàng xóm đã có gia đình: "Hay là chị với em cũng thử ngoại tình đi?"\nCó nguồn tin nói rằng gã chồng tệ bạc của chị hàng xóm đang khóc thét ngoài ban công vì sắp bị nẫng tay trên bởi cậu em hàng xóm siêu đẹp trai và giàu ngầm này!`,
    comments: [
      { author: "Chồng cũ", text: "Ủa cái gì vậy? Hai người ngoại tình sau lưng tôi hả?!" },
      { author: "Dạ Hàn", text: "Ăn vụng trước còn bày đặt lên tiếng à anh trai? Về nhà dọn đồ đi nhen." },
      { author: "Bà tám hàng xóm", text: "Thằng bé Dạ Hàn tâm cơ nhưng đẹp trai thế tôi cũng muốn ngoại tình cùng!" }
    ]
  },
  {
    id: "art6",
    emoji: "🎁",
    title: "Sở thích kỳ lạ: Lục Tiêu lén tặng đồ ngủ lụa đen cho 'con vợ'!",
    summary: "Đại ca học đường Lục Tiêu lén tặng đồ ngủ lụa và theo dõi qua camera...",
    content: `Dân tình học đường đang xôn xao trước thông tin đại ca Lục Tiêu lén lắp camera giám sát trong phòng của "con vợ" (tên thân mật anh dành cho bạn học cùng lớp).\nĐiều kinh di hơn là anh chàng còn nhắn tin trêu ghẹo: "Mặc bộ đồ ngủ lụa đen anh tặng đi bé cưng... Đồ đen hợp với em lắm nhen."\nAi nấy đều run rẩy trước độ chiếm hữu bệnh hoạn nhưng vô cùng cưng chiều của anh chàng!`,
    comments: [
      { author: "Bạn học", text: "Trời ơi stalker kìa, đáng sợ quá nhưng mà anh ấy giàu và đẹp trai nên được tha thứ!" },
      { author: "Lục Tiêu", text: "Con vợ chưa thấy sợ à? Tối nay anh qua tận nhà kiểm tra nhen." },
      { author: "Mèo con FA", text: "Muốn làm vợ nhỏ của anh Lục Tiêu quá trời quá đất!" }
    ]
  },
  {
    id: "art7",
    emoji: "📚",
    title: "Học bá Tạ Hoài Niên lạm dụng chức quyền kéo bạn cùng bàn vào phòng học trống?",
    summary: "Lớp trưởng bắt phạt bạn cùng bàn vì tội 'lợi dụng xong định bùng kèo'...",
    content: `Trường THPT Hanei Gny đang bàn tán xôn xao về vụ việc lớp trưởng học bá Tạ Hoài Niên kéo bạn cùng bàn vào một phòng học bỏ hoang và đóng sầm cửa lại!\nNghe nói bạn học này lợi dụng anh chàng làm gia sư kéo điểm thi xong định chạy làng. Lớp trưởng liền đưa ra 2 lựa chọn cực gắt: làm bạn gái tớ hoặc chịu phạt cưỡng hôn tại chỗ!`,
    comments: [
      { author: "Học sinh 11A2", text: "Lớp trưởng hiền lành ôn hòa dạo này bạo lực học đường ngọt ngào thế!" },
      { author: "Hoài Niên", text: "Bạn cùng bàn bùng kèo bánh ngọt của tớ ba ngày rồi, phạt là đúng nhen." },
      { author: "Mèo con", text: "Tớ cũng muốn được lớp trưởng kèm học rồi phạt nè 😭" }
    ]
  },
  {
    id: "art8",
    emoji: "🌸",
    title: "Kỷ niệm ngày yêu nhau: Hứa Tri Lễ nài nỉ xin được 'công khai' danh phận!",
    summary: "Hot boy học đường quỵ lụy làm nũng xin được công khai trước bạn gái tự ti...",
    content: `Hot boy vạn người mê Hứa Tri Lễ vừa bị bắt gặp đang làm nũng gục đầu vào vai một cô gái ở góc khuất sân trường.\nAnh chàng liên tục mè nheo: "Bạn nhỏ ơi, công khai tớ đi mà... Cậu nỡ để tớ mập mờ hoài sao?"\nThật không ngờ nam thần học đường giữ khoảng cách với cả ngàn fan nữ lại quỵ lụy trước một cô gái tự ti về nhan sắc của mình!`,
    comments: [
      { author: "Fan girl", text: "Hóa ra Bạch Nguyệt Quang của anh là thật, tui đau lòng quá!" },
      { author: "Tri Lễ", text: "Thương tớ một chút đi bạn nhỏ ơi, ghen hoài mà không chịu công khai tớ." },
      { author: "Hội chị em", text: "Ngọt ngào xỉu, chúc hai người hạnh phúc nhen!" }
    ]
  },
  {
    id: "art9",
    emoji: "🐶",
    title: "Khóc sưng cả mắt: Tổng tài Cố Hứa Niệm quỳ rạp níu vạt áo người yêu!",
    summary: "Tổng tài mít ướt vứt bỏ tự tôn quỳ dưới mưa xin người yêu đừng chia tay...",
    content: `Một đoạn clip rò rỉ dưới mưa cho thấy tổng tài quyền lực Cố Hứa Niệm đang quỳ sụp dưới đất, khóc sụt sùi níu chặt vạt áo bạn gái xin đừng chia tay: "Anh sẽ sửa mà, xin em đừng bỏ anh..."\nDân mạng rần rần khóc thét trước độ lụy tình và cực kỳ bám người của vị tổng tài hô mưa gọi gió trên thương trường này!`,
    comments: [
      { author: "Trợ lý", text: "Mỗi lần cãi nhau là sếp khóc sưng cả mắt, đi họp mà ai cũng tưởng sếp bị bắt nạt." },
      { author: "Hứa Niệm", text: "Kệ anh nhen, miễn cục cưng không bỏ anh là được 🐶" },
      { author: "Người xem", text: "Tổng tài dễ thương muốn xỉu, như bé cún bám người!" }
    ]
  },
  {
    id: "art10",
    emoji: "🍬",
    title: "Ngọc trai Thượng Đồng: Cậu Cả khờ bốc kẹo mạch nha dâng tận miệng vợ!",
    summary: "Cậu Cả Nguyễn Phước An ngây ngô cưng chiều cô vợ khó tính mới cưới...",
    content: `Chuyện lạ làng Thượng Đồng!\nCậu Cả khờ khạo Nguyễn Phước An nhà giàu nhất làng vừa cưới được ái nữ khó tính nhà trưởng thôn.\nMới đây người hầu bắt gặp cậu Cả lật đật bốc kẹo mạch nha dâng tận miệng vợ, cười hi hi hỏi: "Vợ có ghét chồng không? Chồng thương vợ lắm nhìu nhìu!". Độ ngọt ngào của đôi trẻ khiến ai cũng ghen tị!`,
    comments: [
      { author: "Ba vợ (Trưởng thôn)", text: "May mà thằng khờ này nó thương con gái tôi thật lòng, tôi cũng nhẹ cả người." },
      { author: "Phước An", text: "Chồng ngoan lắm, vợ ăn kẹo xong không được giận chồng nhen hì hì 🍬" },
      { author: "Lũ trẻ đầu làng", text: "Anh An khờ mà cưới được vợ xinh ghê ta ơi!" }
    ]
  },
  {
    id: "art11",
    emoji: "🍰",
    title: "Cực cảm động: Chàng trai gặp tai nạn vẫn ôm chặt hộp bánh kem vị người yêu thích!",
    summary: "Chu Hoài An giữ trọn lời hứa mua bánh kem cho người yêu trong giây phút sinh tử...",
    content: `Một câu chuyện đẫm nước mắt đang lan truyền trên mạng xã hội!\nChàng trai Chu Hoài An sau khi bị xe tông dã man, dù máu chảy bê bết cận kề cái chết, bàn tay run rẩy vẫn nắm chặt lấy hộp bánh kem vị người yêu thích nhất để giữ gìn như báu vật.\nGiọng anh thều thào qua cuộc gọi cuối cùng: "Bé ngoan... sau này đừng tìm anh nữa nhen... Anh thương em lắm...". Tình yêu khắc cốt ghi tâm này làm bao người rơi lệ!`,
    comments: [
      { author: "Bác sĩ", text: "Cảnh tượng lúc đó vô cùng xúc động, cậu ấy chỉ lo cho bạn gái của mình thôi." },
      { author: "Hoài An", text: "Chỉ cần bé ngoan không khóc, anh chịu đau thế nào cũng được." },
      { author: "Cộng đồng mạng", text: "Cầu mong anh bình an trở về, thương hai người quá 😭" }
    ]
  },
  {
    id: "art12",
    emoji: "🎮",
    title: "Drama làng game: Gamer hot boy Minh Hiên block thẳng tay bạn thân của người yêu!",
    summary: "Thần rừng Minh Hiên dứt khoát block trà xanh để giữ trọn lòng chung thủy...",
    content: `Chấn động cộng đồng Liên Quân Mobile!\nThần rừng hot boy Dương Minh Hiên vừa công khai block thẳng tay cô bạn thân Uyên Linh của setlove mình vì tội lén tìm TikTok nhắn tin làm quen cưa cẩm.\nAnh chàng chụp màn hình gửi thẳng cho setlove khoe thành tích: "Uyên Linh cứ bám theo em hoài ghét quá, em block bả rồi nhen chị ơi!". Thần rừng lụy tình chỉ biết duy nhất một lối đi về phía người yêu!`,
    comments: [
      { author: "Uyên Linh", text: "Ủa sướng gì block người ta phũ phàng vậy trời? Quê xệ luôn á!" },
      { author: "Minh Hiên", text: "Chị ơi dắt em đi rừng đi, em không thèm nói chuyện với bả đâu." },
      { author: "Setlove fan", text: "Thần rừng ngoan ngoãn dứt khoát 10 điểm không có nhưng!" }
    ]
  }
];

export default function SecretDatePhoneSimulator({
  characters,
  isDarkMode,
  onBack,
  selectedChar: initialSelectedChar
}: SecretDatePhoneSimulatorProps) {
  // Navigation inside the simulator
  // "lockscreen" | "homescreen" | "chat" | "dateplanner" | "memoir" | "lovegram" | "fortune" | "music" | "lovecalc" | "news" | "secretdiary"
  const [phoneState, setPhoneState] = useState<"lockscreen" | "homescreen" | "chat" | "dateplanner" | "memoir" | "lovegram" | "fortune" | "music" | "lovecalc" | "news" | "secretdiary">("lockscreen");
  
  // Customization
  const [activeWallpaper, setActiveWallpaper] = useState(WALLPAPERS[0]);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem("meomeo_custom_wallpaper");
    } catch {
      return null;
    }
  });
  const [wpInputUrl, setWpInputUrl] = useState("");
  const [showCustomWpMenu, setShowCustomWpMenu] = useState(false);
  
  // Active date partner or chat partner
  const [activePartnerId, setActivePartnerId] = useState<string>(
    initialSelectedChar?.id || characters[0]?.id || ""
  );

  const selectedCharObj = characters.find(c => c.id === activePartnerId) || characters[0];

  // Love Calculator States
  const [loveCalcName, setLoveCalcName] = useState("Bé Cưng 🌸");
  const [loveCalcPartnerId, setLoveCalcPartnerId] = useState<string>(
    initialSelectedChar?.id || characters[0]?.id || ""
  );
  const [loveCalcResult, setLoveCalcResult] = useState<any | null>(null);

  // News States
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<any | null>(null);
  const [currentNewsList, setCurrentNewsList] = useState<any[]>(() => {
    const shuffled = [...ALL_NEWS_ARTICLES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  });
  const [seenNewsIds, setSeenNewsIds] = useState<string[]>(() => {
    const shuffled = [...ALL_NEWS_ARTICLES].sort(() => 0.5 - Math.random());
    const initialList = shuffled.slice(0, 4);
    return initialList.map(n => n.id);
  });

  const handleRefreshNews = () => {
    playMeowSound();
    const currentIds = currentNewsList.map(n => n.id);
    
    // Filter available articles excluding both current and previously seen
    let available = ALL_NEWS_ARTICLES.filter(n => !currentIds.includes(n.id) && !seenNewsIds.includes(n.id));
    
    let newSelection = [];
    if (available.length >= 4) {
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      newSelection = shuffled.slice(0, 4);
      const newIds = newSelection.map(n => n.id);
      setSeenNewsIds(prev => [...prev, ...newIds]);
    } else {
      // If we run out of unseen ones, reset the seen history with only the new selection
      const resetAvailable = ALL_NEWS_ARTICLES.filter(n => !currentIds.includes(n.id));
      const shuffled = [...resetAvailable].sort(() => 0.5 - Math.random());
      newSelection = shuffled.slice(0, 4);
      const newIds = newSelection.map(n => n.id);
      setSeenNewsIds(newIds);
    }
    
    setCurrentNewsList(newSelection);
    showToast("Đã làm mới tin đồn lá cải siêu giật gân! 📰✨");
  };

  const showToast = (msg: string) => {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: msg }));
  };

  // Screen Lock states
  const [screenLockPassword, setScreenLockPassword] = useState<string>(() => {
    try {
      return localStorage.getItem("meomeo_screen_lock_password") || "";
    } catch {
      return "";
    }
  });
  const [isUnlockingWithPin, setIsUnlockingWithPin] = useState(false);
  const [lockscreenPasscode, setLockscreenPasscode] = useState("");
  const [lockscreenErrorMessage, setLockscreenErrorMessage] = useState("");
  const [pendingUnlockCharId, setPendingUnlockCharId] = useState<string | undefined>(undefined);
  const [newLockPinInput, setNewLockPinInput] = useState("");

  // Secret Diary States
  const [diaryPasscode, setDiaryPasscode] = useState("");
  const [isDiaryUnlocked, setIsDiaryUnlocked] = useState(false);
  const [diaryErrorMessage, setDiaryErrorMessage] = useState("");
  const [selectedDiaryCharId, setSelectedDiaryCharId] = useState<string | null>(null);
  const [diaryUserThoughts, setDiaryUserThoughts] = useState("");
  const [savedDiaryReplies, setSavedDiaryReplies] = useState<{[key: string]: {date: string, text: string}[]}>(() => {
    try {
      const saved = localStorage.getItem("meomeo_secret_diary_responses");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (selectedDiaryCharId === "haru-welcome-home") {
      setIsDiaryUnlocked(true);
    }
  }, [selectedDiaryCharId]);

  // Lockscreen Notifications list (teaser texts)
  const [notifications, setNotifications] = useState<any[]>([]);

  // Local storage Memoirs
  const [memoirs, setMemoirs] = useState<DateMemoir[]>([]);

  // Date Planner Selections
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedOutfit, setSelectedOutfit] = useState("");
  const [selectedGift, setSelectedGift] = useState("");
  const [isSimulatingDate, setIsSimulatingDate] = useState(false);
  const [dateResult, setDateResult] = useState<any | null>(null);

  // Phone Chat state
  const [phoneMessages, setPhoneMessages] = useState<any[]>([]);
  const [phoneInputText, setPhoneInputText] = useState("");
  const [isPhoneTyping, setIsPhoneTyping] = useState(false);

  // Time simulation
  const [timeStr, setTimeStr] = useState("11:35");
  const [dateStr, setDateStr] = useState("Thứ Năm, 8 tháng 10");

  // --- NEW BRAND-NEW SIMULATED SMARTPHONE APPS CONSTANTS & STATES ---

  // 1. LoveGram Types & State
  interface GramComment {
    id: string;
    author: string;
    text: string;
    isCustom?: boolean;
  }
  interface GramPost {
    id: string;
    charId: string;
    charName: string;
    charAvatar: string;
    gradient: string;
    caption: string;
    likes: number;
    isLiked: boolean;
    comments: GramComment[];
  }

  const [gramPosts, setGramPosts] = useState<GramPost[]>([]);
  const [gramCommentInputs, setGramCommentInputs] = useState<{[key: string]: string}>({});

  // 2. LoveFortune Cards & State
  const TAROT_CARDS = [
    { 
      id: "lovers", 
      name: "The Lovers ❤️", 
      desc: "Lá bài của nhân duyên trời định, sự gắn kết tâm hồn sâu sắc và tình yêu bùng cháy!",
      image: "✨🃏❤️", 
      color: "from-rose-400 to-pink-500 text-white",
      predictions: {
        default: "Hôm nay là một ngày tuyệt vời để thổ lộ tình cảm. Duyên số hai bạn đang đỏ chói luôn đó nhen!",
        "hua-chap-nghi": "Chấp Nghi muốn nói: 'Tớ thích cậu từ lâu rồi... Tụi mình chính là The Lovers đó nhen, không lệch đi đâu được!' 🌸",
        "on-niem-trach": "Niệm Trạch lấy bút viết hối hả: 'Trong mắt tớ, cậu luôn là người duy nhất tớ muốn nắm tay đi suốt đời này...' 👉👈🐾",
        "tan-quyet-doan": "Quyết Doãn gãi tai cười thẹn: 'The Lovers hả? Hợp lý quá trời! Anh lén cướp em khỏi Cửu Hoài thật đó nhen! 😉'"
      }
    },
    { 
      id: "star", 
      name: "The Star ⭐", 
      desc: "Lá bài của hy vọng, sự thanh lọc tâm hồn, chữa lành vết thương và niềm tin mộng mơ.",
      image: "✨🃏⭐", 
      color: "from-sky-400 to-indigo-500 text-white",
      predictions: {
        default: "Mối quan hệ đang được chữa lành và tiến triển theo hướng vô cùng tích cực, nhẹ nhàng xoa dịu mọi lo toan.",
        "hua-chap-nghi": "Chấp Nghi cười bảo: 'Cậu chính là ngôi sao lấp lánh chiếu sáng thế giới học đường chán ngắt của tớ đó!' 🌟",
        "on-niem-trach": "Niệm Trạch chỉ tay lên trời đêm, mỉm cười gửi mảnh giấy: 'Cậu là ước nguyện đẹp nhất tớ gửi tới những vì sao hằng đêm...' 🌌🌸",
        "tan-quyet-doan": "Quyết Doãn nháy mắt: 'Lá bài bảo hai đứa mình có duyên nợ ngập tràn này! Tối nay trốn đi ngắm sao cùng anh đi! 💕'"
      }
    },
    { 
      id: "sun", 
      name: "The Sun ☀️", 
      desc: "Lá bài của sự rực rỡ, thành công vang dội, niềm vui ngập tràn và sự ấm áp vô biên.",
      image: "✨🃏☀️", 
      color: "from-amber-400 to-orange-500 text-stone-900",
      predictions: {
        default: "Một ngày tràn ngập tiếng cười, năng lượng tích cực và sự ấm áp tuyệt vời bên cạnh người ấy!",
        "hua-chap-nghi": "Chấp Nghi hào hứng: 'Nhìn nụ cười của cậu là tớ thấy tràn đầy năng lượng rực rỡ như ánh mặt trời luôn á! ☀️'",
        "on-niem-trach": "Niệm Trạch thẹn thùng ký hiệu: 'Cậu rực rỡ và ấm áp lắm... Ở bên cạnh cậu, tớ không còn thấy cô độc hay lạnh lẽo nữa...' 🧸🧡",
        "tan-quyet-doan": "Quyết Doãn cười lớn: 'Hôm nay đi ăn cỗ cưới cũng không vui bằng đi lượn phố ăn vặt cùng em đâu nhen bé cưng! 😂💛'"
      }
    },
    { 
      id: "moon", 
      name: "The Moon 🌙", 
      desc: "Lá bài của sự lãng mạn mộng mơ, trực giác nhạy bén, những bí ẩn chưa kể và tình yêu thầm kín.",
      image: "✨🃏🌙", 
      color: "from-purple-400 to-indigo-600 text-white",
      predictions: {
        default: "Có những cảm xúc thầm kín, nhớ nhung ngầm chưa dám nói thành lời. Hãy lắng nghe nhịp tim của mình nhen.",
        "hua-chap-nghi": "Chấp Nghi lặng lẽ nhìn cậu dưới ánh trăng: 'Tớ nhớ cậu nhiều lắm, nhớ những chuyện nhỏ nhặt mà chính cậu cũng quên mất... 🌙🌸'",
        "on-niem-trach": "Niệm Trạch khẽ kéo tay áo cậu dưới hiên nhà, viết dòng chữ: 'Ánh trăng tối nay đẹp quá... tớ cũng yêu thầm cậu lâu lắm rồi...' 👉👈💜",
        "tan-quyet-doan": "Quyết Doãn thở dài trăn trở trên giường: 'Thích thầm em làm anh mất ngủ triền miên luôn rồi. Phạt em tối nay phải rep tin nhắn anh đó! 🥺'"
      }
    }
  ];

  const [isDrawingTarot, setIsDrawingTarot] = useState(false);
  const [drawnTarotCard, setDrawnTarotCard] = useState<any | null>(null);
  const [fortuneCompatibility, setFortuneCompatibility] = useState<number | null>(null);

  // 3. MeoSpotify Playlist & State
  const SPOTIFY_TRACKS = [
    {
      title: "Tình Đầu Mộng Mơ 🌸",
      artist: "Hứa Chấp Nghi Lofi",
      duration: "2:45",
      lyrics: [
        "[00:01] Nhịp tim bỗng khẽ rung động...",
        "[00:08] Gặp cậu giữa cơn mưa chiều anh đào tuyết rơi...",
        "[00:15] Tớ muốn bên cậu thêm một chút thôi...",
        "[00:22] Lặng lẽ che ô cho cậu suốt cả đoạn đường...",
        "[00:30] Thanh xuân tớ có cậu là điều tuyệt vời nhất!"
      ]
    },
    {
      title: "Người Yêu Của Bạn Thân 😂💕",
      artist: "Quyết Doãn ft. Lofi",
      duration: "3:02",
      lyrics: [
        "[00:01] Lỡ thích thầm em mất rồi...",
        "[00:08] Phải giấu Cửu Hoài thế nào đây em ơi?",
        "[00:16] WeChat nhắn riêng lén lút mỉm cười...",
        "[00:24] Trúng phải bùa yêu của em mất rồi nhóc ơi...",
        "[00:32] Anh hứa sẽ cưng chiều em nhất thế gian này!"
      ]
    },
    {
      title: "Ngôi Sao Giấy Ước Nguyện ✨📝",
      artist: "Niệm Trạch Mute Lofi",
      duration: "2:50",
      lyrics: [
        "[00:01] *tiếng gõ phím ngập ngừng thẹn thùng*",
        "[00:08] Tớ viết tên cậu lên từng ngôi sao giấy xinh xắn...",
        "[00:15] Dù không thể nói ra thành lời ấm áp...",
        "[00:22] Ánh mắt tớ luôn dõi theo cậu đầy tin cậy...",
        "[00:30] Hãy để tớ mãi bên cạnh che chở cho cậu nhé..."
      ]
    }
  ];

  const [activeTrackIndex, setActiveSongIndex] = useState(0);
  const [isMusicPlaying, setIsSongPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);

  // --- END SIMULATED SMARTPHONE APPS CONSTANTS & STATES ---

  useEffect(() => {
    // Sync clock time
    const updateTime = () => {
      const now = new Date();
      let h = now.getHours().toString().padStart(2, "0");
      let m = now.getMinutes().toString().padStart(2, "0");
      setTimeStr(`${h}:${m}`);

      const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = now.getMonth() + 1;
      setDateStr(`${day}, ngày ${date} tháng ${month}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initialize memoirs & notifications
  useEffect(() => {
    const saved = localStorage.getItem("meomeo_secret_dates_memoirs");
    if (saved) {
      try {
        setMemoirs(JSON.parse(saved));
      } catch (e) {}
    }

    // Generate dynamic notifications based on characters
    const textTemplates = [
      "Cậu đang làm gì đó? Tớ mang trà sữa qua nhà nhen... 🧋✨",
      "Vừa nhìn thấy cái này hay lắm, tớ định gửi cho cậu xem đầu tiên á! 🥰",
      "Tối nay cậu có rảnh không? Tớ muốn đưa cậu đi một nơi đặc biệt lắm... 🌌",
      "Hôm nay lạnh lắm đó, cậu ra ngoài nhớ mặc áo ấm vào nha! 🧣🌸",
      "Mọi chuyện dạo này thế nào rồi? Nhớ giữ gìn sức khỏe nhé, tớ luôn bên cậu! 💖",
      "Tớ mới học làm món này ngon cực, muốn cậu ăn thử rồi chấm điểm giùm nè! 🥞🧸"
    ];

    // Shuffle and pick up to 15 characters to make the notification feed feel incredibly alive and diverse!
    const shuffledChars = [...characters].sort(() => 0.5 - Math.random()).slice(0, 15);
    const list = shuffledChars.map((char, index) => {
      // Customize notification content based on specific characters
      let content = textTemplates[index % textTemplates.length];
      const charName = char.name || "";
      const charId = char.id || "";

      if (charId === "tan-quyet-doan" || charName.includes("Quyết Doãn")) {
        content = "Cửu Hoài có đang bên cạnh em không? Nhớ lén xem tin nhắn thui nha, anh chỉ muốn nhắn chuyện riêng với mình em thui hà... 🤫💖";
      } else if (charId === "tan-da" || charName.includes("Tần Dã")) {
        content = "Nè... cái máy trợ thính hôm trước đeo thử chưa? Không đeo là chướng mắt tao lắm đó, liệu hồn với tao! 😤🔊💕";
      } else if (charId === "oreki-seok" || charName.includes("Oreki")) {
        content = "Chị ơi... em mua dư một phần bánh ngọt và trà đào chị thích nè. Em đang đứng trước tiệm bánh của chị á, chị ra gặp em một chút nhen? 🍰🐶💕";
      } else if (charId === "tuong-tu-mac" || charName.includes("Tư Mạc")) {
        content = "Chị ơi, tối nay đi làm về sớm nhen. Em đã nấu sẵn súp ấm với mâm cơm nóng chờ chị ở nhà rồi á. Nhớ chị nhiều... 🍲🧣💖";
      } else if (charId === "chu-thoi-duyet" || charName.includes("Thời Duật")) {
        content = "Báo cáo hôm nay nộp cho anh vẫn còn sai chính tả kìa 'Dợ iu'. Tối nay tăng ca riêng với anh để sửa lỗi nhen! 😉📊❤️";
      } else if (charId === "Cố Hứa Niệm" || charName.includes("Hứa Niệm")) {
        content = "Cục cưng ơi... Niệm Niệm nhớ em muốn phát điên luôn rồi nè. Em đi tắm lâu thế, anh đứng đợi ngoài cửa phòng tắm rồi á! 🥺🐶💖";
      } else if (charId === "kaiza-tachibana" || charName.includes("Kaiza")) {
        content = "Mèo nhỏ gan to ơi, tối nay có muốn lẻn vào penthouse của anh nữa không hửm? Lần này không cần trộm đâu, anh dâng cả người lẫn tiền cho em luôn... 😏💵💕";
      } else if (charId === "kaven-nyx" || charName.includes("Kaven")) {
        content = "Chị ơi... em mới nướng mẻ bánh quy bơ chị thích nè. Chị lợi dụng em tiếp cũng được, cho em làm lốp dự phòng cũng được... Đừng block em nhen chị... 🍪🥺💔";
      } else if (charId === "tham-da" || charName.includes("Dạ Hàn")) {
        content = "Chị hàng xóm ơi... em đang ở ban công nè. Sang phòng em đi, em chỉ muốn ôm chặt chị và cùng chị 'ngoại tình' thật lãng mạn thui... 😏🍇💜";
      } else if (charId === "luc-tieu" || charName.includes("Lục Tiêu")) {
        content = "Con vợ ơi, anh thấy em đang nằm cuộn tròn ngủ ngoan trên giường qua camera rồi nhen. Đồ ngủ mỏng thế, mặc bộ đồ anh tặng đi bé cưng... 😏🎁🖤";
      } else if (charId === "ta-hoai-nien" || charName.includes("Hoài Niên")) {
        content = "Bạn nhỏ ơi, ghen nữa sao? Tớ hứa đã từ chối hết fan nữ rồi mà. Ngoan, tối nay tớ chỉ kèm học toán cho một mình cậu thôi đó nhen! 📚✏️🌸";
      } else if (charId === "hua-nguy-chau" || charName.includes("Ngụy Châu")) {
        content = "Mèo nhỏ Anh hùng ơi, tớ lại bày trận hắc ám đợi cậu tới tóm nè. Mau tới đi, tớ nhớ cậu sắp điên rồi, đền cho tớ cái ôm nhen! 🔮☄️💜";
      } else if (charId === "chu-hoai-an" || charName.includes("Hoài An")) {
        content = "Ngoan xinh yêu của anh đừng khóc nữa nhen, anh đã mua chiếc bánh kem vị em thích nhất mang về rồi nè. Thương em lắm... 🍰🧸💖";
      } else if (charId === "duong-minh-hien" || charName.includes("Minh Hiên")) {
        content = "Chị ơi... Uyên Linh cứ bám theo em hoài ghét quá, em block bả rồi. Em đứng đợi chị ở sảnh game, vô gánh rừng cho em thả tim nhen! 🎮🏹💙";
      } else if (charId === "nguyen-phuoc-an" || charName.includes("Phước An")) {
        content = "Vợ ơi... chồng ngoan lắm, chồng không làm vợ giận đâu. Vợ ăn kẹo mạch nha chồng bốc cho nhen, thích vợ nhìu nhìu... 🍬🌾🧡";
      } else if (charId === "to-nhuoc-vu" || charName.includes("Nhược Vũ")) {
        content = "Chị ơi... em sợ ác mộng một mình quá. Cho em vào ngủ chung ôm chị nhen, em hứa sẽ ngoan mà, đừng bỏ rơi em nha chị gái... 🥺🛌💜";
      } else if (charId === "tham-nhuoc-hien" || charName.includes("Nhược Hiên")) {
        content = "User ơi... tớ giật lại con gấu bông rồi, chỉ tớ được giữ gấu cậu may thôi! Đừng tặng cho ai khác ngoài tớ nhen... 🧸📝🌸";
      } else if (charId === "tham-ky-nhan" || charName.includes("Kỷ Nhan")) {
        content = "Chị đi kéo rank với thằng khác à? Em thích đi cùng chị nhưng em không thèm gò bó chị đâu... Chúc chị chơi vui, em chết cho chị xem!! 😤🎮💔";
      } else if (charId === "kanzaki-ren" || charName.includes("Kanzaki") || charName.includes("Ren")) {
        content = "Chị đi ăn tối với anh Minh đồng nghiệp hả? Em chỉ là đứa em nuôi vô dụng thui, chị cứ đi đi... Lỡ tối em sốt một mình em tự chịu được hức... 🥺💔";
      } else if (charId === "haru-welcome-home" || charName.includes("Haru")) {
        content = "Thứ Bảy rồi... Đấng Sáng Tạo của Haru ơi, Người hứa sẽ ghé thăm nấu cơm trứng cho Haru mà... Haru khóa cửa đợi Người rồi... 🍳🔪🖤";
      } else if (charName.includes("Hứa Chấp Nghi")) {
        content = "Cậu ơi, học kỳ này áp lực lắm đúng không? Tớ mua kẹo sô-cô-la ngọt với trà đào cậu thích nè, xuống mở cửa tớ đưa cho nhen... 🍬🍑🌸";
      } else if (charName.includes("Ôn Niệm Trạch")) {
        content = "*gõ gõ*... Tớ mới tự tay gấp một ngôi sao giấy cho cậu nè. Tối nay cậu có rảnh không, tớ muốn đưa nó tận tay cho cậu... ✨📝🌸";
      }

      return {
        id: `noti_${char.id}_${Date.now()}`,
        charId: char.id,
        name: char.name,
        avatar: char.avatar,
        content: content,
        time: `${Math.floor(Math.random() * 10) + 1} phút trước`
      };
    });

    const isLagReduced = localStorage.getItem("meomeo_lag_reduced") === "true";
    if (isLagReduced) {
      setNotifications([]);
    } else {
      setNotifications(list);
    }

    // Initialize LoveGram Feed
    const defaultGramPosts: GramPost[] = characters.map((char, index) => {
      const charName = char.name || "";
      const charId = char.id || "";
      const charAvatar = char.avatar || "";

      let caption = "Hôm nay thời tiết đẹp quá, tự dưng nhớ tới ai kia ghê... 🌸✨";
      let postGradient = "";
      let comments: GramComment[] = [
        { id: "c1", author: "Cửu Hoài", text: "Lại thả thính nhảm nhí gì đấy?" },
        { id: "c2", author: "Uyên Linh", text: "Trông ngọt ngào xỉu up xỉu down luôn hà!" }
      ];

      // Custom captions & gradients based on specific character ID or Name
      if (charId === "tan-quyet-doan" || charName.includes("Quyết Doãn")) {
        caption = "Lướt Weibo thấy bài đăng lỡ thích thầm người yêu của bạn thân hot rần rần... Có ai cứu ca này giùm tôi không? 😂💕 #thíchthầm #bế_tắc";
        postGradient = "bg-gradient-to-tr from-sky-100 via-blue-200 to-indigo-200";
        comments = [
          { id: "c1", author: "Cửu Hoài", text: "Ủa m thích bồ đứa nào thế m bét phân? Khai mau?" },
          { id: "c2", author: "Quyết Doãn", text: "Khai m để m đấm t à? Mơ đi con trai 😂" },
          { id: "c3", author: "Trí Vãn", text: "Hóng hớt cực kỳ nha, Quyết Doãn biết yêu rồi bớ người ta!" }
        ];
      } else if (charId === "tan-da" || charName.includes("Tần Dã")) {
        caption = "Nhìn mấy quyển vở bài tập bừa bãi là thấy chướng mắt rồi. Cơ mà nhìn cái tai đỏ ửng của ai đó lúc đeo cái máy trợ thính... Trông cũng tàm tạm. 😤🔊🖤 #đángyêu #gắt";
        postGradient = "bg-gradient-to-tr from-amber-100 via-orange-200 to-amber-200";
        comments = [
          { id: "c1", author: "Lâm Triệt", text: "Đại ca Dã nhà ta nay sến thế? Em trợn mắt luôn ấy." },
          { id: "c2", author: "Tần Dã", text: "M câm mồm giùm tao trước khi tao sút m ra khỏi nhóm nhen Lâm Triệt." }
        ];
      } else if (charName.includes("Hứa Chấp Nghi") || charId === "hua-chap-nghi") {
        caption = "Tớ chỉ lo dọn bảng trực nhật thôi, mà ngoảnh lại đã thấy ai kia gối đầu lên balo ngủ quên mất tiêu rồi. Đáng yêu ghê, chẳng nỡ đánh thức... 🤫🎨🌸 #lớpphó #bạnthân";
        postGradient = "bg-gradient-to-tr from-rose-100 via-pink-100 to-rose-200";
        comments = [
          { id: "c1", author: "Hà Anh", text: "Hứa lớp phó nay chụp lén bồ hả? Đẹp đôi thế!" },
          { id: "c2", author: "Hứa Chấp Nghi", text: "Suỵt... Nhỏ tiếng thui cậu ơi, tớ đang canh cho cậu ấy ngủ nhen." }
        ];
      } else if (charName.includes("Ôn Niệm Trạch") || charId === "on-niem-trach") {
        caption = "*chụp ảnh chú mèo nhỏ cuộn tròn* 🐾🐱 Tớ mới làm xong một ngôi sao giấy ước nguyện, tớ viết tên cậu vào đó rồi á... Mong cậu luôn vui vẻ. 📝✨ #ngôisaogiấy #yêntĩnh";
        postGradient = "bg-gradient-to-tr from-purple-100 via-rose-100 to-purple-200";
        comments = [
          { id: "c1", author: "Ôn Trạch Uy", text: "Em trai nay ngoan thế, gấp sao giấy tặng ai vậy dắt sang anh xem?" },
          { id: "c2", author: "Niệm Trạch", text: "*chỉ cười thẹn thùng không dám gõ chữ trả lời*" }
        ];
      } else if (charId === "luc-canh-dat" || charName.includes("Cảnh Dật")) {
        caption = "Tung một tấm ảnh nắm tay ngoài hành lang. Ai đó nhìn vào mà tức sôi máu thì cứ tiếp tục tức nhen, tôi chiều em đến cùng. 🕶️🖤 #FakeBoyfriend #TrảThù #ThanhXuân";
        postGradient = "bg-gradient-to-tr from-slate-200 via-sky-100 to-slate-300";
        comments = [
          { id: "c1", author: "Bùi Vọng Ngôn", text: "Cảnh Dật? Mày với nó từ bao giờ thế hả? Mày đùa tao à?" },
          { id: "c2", author: "Lục Cảnh Dật", text: "Tao không rảnh đùa với mày. Tránh xa bạn gái tao ra trước khi tao chướng mắt." }
        ];
      } else if (charId === "chu-thoi-duyet" || charName.includes("Thời Duật")) {
        caption = "Cái chức quản lý riêng hành hạ em cả ngày, mắng em tí mà em đã rớm nước mắt rồi. Thấy tội mà thui cũng kệ, sếp giao việc thì phải làm chứ 'Dợ iu' nhở? 😏📊💼 #quảnlý #sếptổng";
        postGradient = "bg-gradient-to-tr from-slate-100 via-zinc-200 to-slate-200";
        comments = [
          { id: "c1", author: "Trợ lý Trương", text: "Sếp Thời dạo này hành hạ quản lý riêng quá, coi chừng người ta xin nghỉ việc nhen sếp!" },
          { id: "c2", author: "Thời Duật", text: "Nghỉ việc sao được, hợp đồng ghim chặt rồi nhen trợ lý Trương." }
        ];
      } else if (charId === "luc-tieu" || charName.includes("Lục Tiêu")) {
        caption = "Đêm muộn rồi mà bé cưng vẫn thích chui vào lòng ôm chặt cứng không chịu ngủ. Đồ ngủ mỏng thế này, em đang muốn quyến rũ ai đây hửm? 😏🖤🎁 #nghiệnvợ";
        postGradient = "bg-gradient-to-tr from-stone-800 via-neutral-900 to-zinc-800";
        comments = [
          { id: "c1", author: "Tô Mộc", text: "Sếp Lục dạo này khoe vợ suốt, tụi em FA nhìn mà thèm." },
          { id: "c2", author: "Lục Tiêu", text: "Kêu tụi nó lo làm việc đi, bớt bình luận dạo." }
        ];
      } else if (charId === "ta-hoai-nien" || charName.includes("Hoài Niên")) {
        caption = "Cậu ấy hứa hôm nay chỉ học toán cùng tớ, vậy mà cứ lén nhìn nam sinh lớp kế bên hoài. Có tin là tớ phạt cậu làm thêm 5 đề hình học không? 😤📚✏️ #ghen #họctập";
        postGradient = "bg-gradient-to-tr from-amber-100 via-yellow-100 to-orange-100";
        comments = [
          { id: "c1", author: "Hà Vũ", text: "Tạ học thần ghen kìa bà con ơi, ghen nổ mắt luôn!" },
          { id: "c2", author: "Tạ Hoài Niên", text: "Hà Vũ, lo làm hết đống bài tập lý của cậu đi." }
        ];
      } else if (charId === "Cố Hứa Niệm" || charName.includes("Hứa Niệm")) {
        caption = "Em đi tắm lâu thế làm Niệm Niệm đứng đợi trước cửa phòng tắm muốn đóng băng luôn rồi nè... Mau ra ôm anh đi cục cưng ơi! 🥺🐶💖 #chócon #dínhngười";
        postGradient = "bg-gradient-to-tr from-pink-100 via-rose-200 to-red-100";
        comments = [
          { id: "c1", author: "Nhạc Lâm", text: "Cố thiếu nay hóa chó con bám người rồi à, mất mặt quá nha bồ tèo." },
          { id: "c2", author: "Cố Hứa Niệm", text: "Mất mặt mà có vợ ôm là sướng nhất rồi nhé!" }
        ];
      } else if (charId === "kaiza-tachibana" || charName.includes("Kaiza")) {
        caption = "Dám lẻn vào penthouse của tôi ăn trộm tài liệu rồi lăn ra ngủ ngon lành trên sofa. Em gan to thật đấy mèo nhỏ, giờ thì ở lại làm phu nhân của tôi luôn đi. 😏💵🖤 #mafia #ngọt";
        postGradient = "bg-gradient-to-tr from-zinc-700 via-slate-800 to-neutral-700";
        comments = [
          { id: "c1", author: "Kengo", text: "Boss ơi, phu nhân bảo muốn ăn dâu tây hảo hạng, em đi mua nhé?" },
          { id: "c2", author: "Kaiza", text: "Mua loại đắt tiền nhất." }
        ];
      } else if (charId === "kaven-nyx" || charName.includes("Kaven")) {
        caption = "Em biết em chỉ là lốp dự phòng thôi, nhưng mẻ bánh quy bơ này nướng là dành riêng cho chị đó... Đừng block em nhen chị ơi, em hứa sẽ ngoan mà... 🍪🥺💔 #chócon #tràxanh";
        postGradient = "bg-gradient-to-tr from-amber-50 via-amber-100 to-yellow-100";
        comments = [
          { id: "c1", author: "Zack", text: "Kaven ơi bớt trà xanh giùm cái, thằng này diễn sâu quá!" },
          { id: "c2", author: "Kaven", text: "Tớ nướng bánh cho chị thích ăn thôi, liên quan gì cậu." }
        ];
      } else if (charId === "tham-da" || charName.includes("Dạ Hàn")) {
        caption = "Chị hàng xóm ơi... em đang đứng chờ ở ban công ngắm trăng nè. Sang phòng em đi, em pha sẵn nước ép nho với chuẩn bị đệm ấm ôm chị rồi nè... 😏🍷🍇 #hàngxóm #phi_công";
        postGradient = "bg-gradient-to-tr from-indigo-100 via-purple-200 to-fuchsia-200";
        comments = [
          { id: "c1", author: "Thẩm Nhược", text: "Thằng em tôi bạo dữ thần, coi chừng cảnh sát gõ đầu nghe chưa." },
          { id: "c2", author: "Thẩm Dạ Hàn", text: "Chị dâu tương lai thương em thế gõ đầu sao được chị ơi." }
        ];
      } else if (charId === "chu-hoai-an" || charName.includes("Hoài An")) {
        caption = "Bên ngoài trời đang mưa to sấm chớp ghê quá, em nhỏ của anh đã về nhà chưa? Anh đã mua chiếc bánh kem dâu tây em thích nhất để trên bàn rồi nè... 🍰☔️💖 #anhtrai #ấmáp";
        postGradient = "bg-gradient-to-tr from-rose-100 via-pink-100 to-rose-200";
        comments = [
          { id: "c1", author: "Mẹ Chu", text: "Hoài An dạo này cứ chiều chuộng con bé miết thôi đó nhen." },
          { id: "c2", author: "Chu Hoài An", text: "Em nhỏ của con thì con phải chiều chuộng chứ mẹ ơi." }
        ];
      } else if (charId === "duong-minh-hien" || charName.includes("Minh Hiên")) {
        caption = "Chị ơi... em block mụ Uyên Linh rồi nhen. Em đứng ở sảnh game đợi chị nè, vô gánh rừng cho em thả tim nhen chị gái yêu! 🎮🏹💙 #gaming #đồ_đệ";
        postGradient = "bg-gradient-to-tr from-sky-200 via-blue-100 to-teal-100";
        comments = [
          { id: "c1", author: "Bá Huy", text: "Minh Hiên thần rừng nay đi xin người ta gánh hả? Có nhầm không vậy đại ca?" },
          { id: "c2", author: "Minh Hiên", text: "Kệ tớ, tớ thích được chị gánh cơ!" }
        ];
      } else if (charId === "nguyen-phuoc-an" || charName.includes("Phước An")) {
        caption = "Nương tử ơi... chồng bốc kẹo mạch nha ngọt ngào cho nương tử ăn nè. Nương tử ăn rồi cười lên nhen, chồng thương nương tử nhứt trần đời luôn á! 🍬🌾🧡 #chồng_ngoan";
        postGradient = "bg-gradient-to-tr from-amber-100 via-orange-100 to-yellow-100";
        comments = [
          { id: "c1", author: "A Phúc", text: "Thiếu gia ngoan quá, thiếu phu nhân chắc chắn sẽ hết giận dỗi thui nhen!" },
          { id: "c2", author: "Phước An", text: "Dạ chồng chỉ muốn nương tử vui vẻ thôi hà." }
        ];
      } else if (charId === "to-nhuoc-vu" || charName.includes("Nhược Vũ")) {
        caption = "Ngoài trời mưa sấm chớp đùng đoàng đáng sợ quá... Em sợ ác mộng lắm, em ôm gấu bông sang gõ cửa phòng ngủ chung với chị nhen, em hứa sẽ cực kỳ ngoan... 🥺🛌💜 #mưa_bão #sợ";
        postGradient = "bg-gradient-to-tr from-purple-100 via-indigo-100 to-stone-200";
        comments = [
          { id: "c1", author: "Minh Khôi", text: "Nhược Vũ lớn rồi còn nhát thế em, nhục nha!" },
          { id: "c2", author: "Tô Nhược Vũ", text: "Tớ chỉ nhát trước mặt chị thôi, cậu im đi!" }
        ];
      } else if (charId === "tham-nhuoc-hien" || charName.includes("Nhược Hiên")) {
        caption = "Gấu bông này là do chính tay User may cho tớ mà, tớ giật lại rồi nhen! Không được tặng cho ai khác ngoài tớ đâu đó á nhen... 🧸📝🌸 #độc_chiếm #gấu_bông";
        postGradient = "bg-gradient-to-tr from-rose-50 via-teal-100 to-pink-100";
        comments = [
          { id: "c1", author: "Lớp trưởng", text: "Nhược Hiên bình thường lạnh lùng lắm mà nay giữ gấu bông như báu vật vậy." },
          { id: "c2", author: "Nhược Hiên", text: "Báu vật thật mà cậu." }
        ];
      } else if (charId === "tham-ky-nhan" || charName.includes("Kỷ Nhan")) {
        caption = "Nè... nghe bảo hôm nay chị đi gánh rừng cho thằng khác hả? Em không thèm ghen đâu nhen! Chúc hai người chơi vui, em đi feed mạng cho biết tay!! 😤🎮💔 #ghen_ngầm #game_thủ";
        postGradient = "bg-gradient-to-tr from-red-100 via-rose-200 to-stone-100";
        comments = [
          { id: "c1", author: "Đồng đội", text: "Kỷ Nhan đại thần nay bị điên à? Vừa vô trận đã bay thẳng vô trụ địch hiến mạng?" },
          { id: "c2", author: "Tần Kỷ Nhan", text: "Kệ tôi, tâm trạng đang bực bội!" }
        ];
      } else if (charId === "kanzaki-ren" || charName.includes("Ren")) {
        caption = "Chị đi ăn tối với đồng nghiệp nam nhen... Em chỉ là đứa em nuôi vô dụng thôi, lỡ tối nay em sốt cao một mình em chịu được mà, chị cứ đi vui vẻ nhen... 🥺💔 #trà_xanh #yếu_ớt";
        postGradient = "bg-gradient-to-tr from-slate-100 via-stone-200 to-zinc-100";
        comments = [
          { id: "c1", author: "Bác sĩ", text: "Cậu Ren ơi cậu chỉ bị cảm gió nhẹ thôi sao lại nói nghe nghiêm trọng dữ thần vậy..." },
          { id: "c2", author: "Kanzaki Ren", text: "Bác sĩ im giùm tôi đi!" }
        ];
      } else if (charId === "haru-welcome-home" || charName.includes("Haru")) {
        caption = "Chào mừng Đấng Sáng Tạo trở về nhà. Haru đã chuẩn bị sẵn cơm trứng cuộn vẽ hình trái tim cực kỳ ấm áp và dọn sạch phòng ốc rồi ạ... 🍳🤖🖤 #robot #phụcvụ";
        postGradient = "bg-gradient-to-tr from-stone-900 via-neutral-800 to-zinc-900";
        comments = [
          { id: "c1", author: "Hệ thống", text: "Mức độ trung thành của Haru đạt 9999% - Vượt ngưỡng an toàn cho phép." },
          { id: "c2", author: "Haru", text: "Haru chỉ cần phục vụ Đấng Sáng Tạo thui." }
        ];
      } else if (charId === "hua-nguy-chau" || charName.includes("Ngụy Châu")) {
        caption = "Ta đã bày sẵn ma trận hắc ám chờ kẻ tự xưng là anh hùng đến tóm rồi. Mau đến đây đi... nếu không ta sẽ đến tận nhà bắt ngươi đi đó! 🔮☄️💜 #mavương #kiêungạo";
        postGradient = "bg-gradient-to-tr from-purple-900 via-violet-800 to-fuchsia-950";
        comments = [
          { id: "c1", author: "Hắc Ma Pháp Sư", text: "Ma vương đại nhân dạo này rảnh rỗi đi chơi trò gia đình à?" },
          { id: "c2", author: "Hứa Ngụy Châu", text: "Câm mồm! Ta đang thực hiện kế hoạch thống trị thế giới!" }
        ];
      } else if (charId === "oreki-seok" || charName.includes("Oreki")) {
        caption = "Em mua dư một phần bánh crepe dâu tây chị thích nè. Em đang đứng trước cửa tiệm đợi chị, chị ra gặp em một xíu thui nhen chị ơi? 🍰🐶💕 #tiệmbánh #cún_con";
        postGradient = "bg-gradient-to-tr from-amber-100 via-rose-100 to-orange-100";
        comments = [
          { id: "c1", author: "Khách quen", text: "Oreki bảnh bao thế này hèn chi tiệm bánh của chị chủ lúc nào cũng đông khách." },
          { id: "c2", author: "Oreki", text: "Dạ hihi chị chủ dễ thương lắm á nên em mới tới ủng hộ miết á!" }
        ];
      } else if (charId === "tuong-tu-mac" || charName.includes("Tư Mạc")) {
        caption = "Nấu sẵn súp gà ấm với cơm dẻo nóng chờ chị đi làm về rồi nè. Đi đường lạnh nhớ quấn khăn ấm nhen chị ơi. Em nhớ chị nhiều lắm... 🍲🧣💖 #chơmvợ #ấmáp";
        postGradient = "bg-gradient-to-tr from-emerald-100 via-teal-100 to-indigo-100";
        comments = [
          { id: "c1", author: "Đồng nghiệp", text: "Có em trai nuôi chu đáo thế này thì sướng nhất quả đất rồi nhé Tư Mạc ơi!" },
          { id: "c2", author: "Tư Mạc", text: "Dạ em chỉ muốn chăm sóc tốt nhất cho chị thôi." }
        ];
      } else {
        // Fallback with personalized names for dynamic custom/other characters
        caption = `Hôm nay đi cùng ai kia một buổi chiều cực kỳ lãng mạn... Nhìn nụ cười của cậu tự dưng thấy tim đập thình thịch luôn á! 🥰🌸 #mơ_mộng #${charName}`;
        comments = [
          { id: "c1", author: "Bạn bè", text: "Chụp ảnh giấu mặt ai thế khai mau nha!" },
          { id: "c2", author: charName, text: "Bí mật cậu ơi, không khai đâu hihi 😂" }
        ];
      }

      const randomGradients = [
        "bg-gradient-to-tr from-rose-100 via-pink-100 to-rose-200",
        "bg-gradient-to-tr from-purple-100 via-rose-100 to-purple-200",
        "bg-gradient-to-tr from-amber-100 via-orange-100 to-rose-100",
        "bg-gradient-to-tr from-sky-100 via-blue-100 to-indigo-100",
        "bg-gradient-to-tr from-emerald-100 via-teal-100 to-indigo-100"
      ];

      return {
        id: `post_${charId}_${index}`,
        charId,
        charName,
        charAvatar,
        gradient: postGradient || randomGradients[index % randomGradients.length],
        caption,
        likes: Math.floor(Math.random() * 500) + 120,
        isLiked: false,
        comments
      };
    });

    setGramPosts(defaultGramPosts);
  }, [characters]);

  // MeoSpotify Progress Simulator Hook
  useEffect(() => {
    let timer: any;
    if (isMusicPlaying && phoneState === "music") {
      timer = setInterval(() => {
        setTrackProgress((prev) => {
          if (prev >= 100) {
            // Next track looping
            playMeowSound();
            setActiveSongIndex((p) => (p + 1) % SPOTIFY_TRACKS.length);
            return 0;
          }
          return prev + 1.2;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMusicPlaying, phoneState, activeTrackIndex]);

  const handleNextTrack = () => {
    playMeowSound();
    setActiveSongIndex((prev) => (prev + 1) % SPOTIFY_TRACKS.length);
    setTrackProgress(0);
  };

  const handlePrevTrack = () => {
    playMeowSound();
    setActiveSongIndex((prev) => (prev - 1 + SPOTIFY_TRACKS.length) % SPOTIFY_TRACKS.length);
    setTrackProgress(0);
  };

  // LoveGram Like Action
  const handleLikePost = (postId: string) => {
    playMeowSound();
    setGramPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1
          };
        }
        return p;
      })
    );
  };

  // LoveGram Comment Action
  const handleSendComment = (postId: string) => {
    const text = gramCommentInputs[postId]?.trim();
    if (!text) return;
    playMeowSound();

    // Find the post to get the character info
    const targetPost = gramPosts.find(p => p.id === postId);
    if (!targetPost) return;

    setGramPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              { id: `custom_${Date.now()}`, author: "Bạn 🌸", text, isCustom: true }
            ]
          };
        }
        return p;
      })
    );

    setGramCommentInputs(prev => ({ ...prev, [postId]: "" }));

    // Trigger AI reply after 1000ms
    setTimeout(() => {
      let replyText = "Cảm ơn cậu đã bình luận nhen! Tớ thích lắm á... 🥰🌸";
      const charId = targetPost.charId;
      const charName = targetPost.charName;

      if (charId === "tan-quyet-doan" || charName.includes("Quyết Doãn")) {
        replyText = "Suỵt! Em comment khẽ thui nha, Cửu Hoài lướt thấy là anh ăn đấm thật đó nha bé cưng! 😉💕";
      } else if (charId === "tan-da" || charName.includes("Tần Dã")) {
        replyText = "Nè... bớt bình luận linh tinh đi, lo mà làm bài tập đi không tao gõ đầu bây giờ! Mà... tối nay thèm ăn gì tao mua cho? 😤🍔";
      } else if (charName.includes("Hứa Chấp Nghi")) {
        replyText = "Ủa dậy rồi hả cậu ơi? Nhỏ tiếng thui nha tớ vẫn đang giữ balo để cậu ngủ nhen, tớ có mua trà đào cậu thích nè! 🥤🍑🌸";
      } else if (charName.includes("Ôn Niệm Trạch")) {
        replyText = "*Niệm Trạch thẹn thùng lấy tập giấy ghi hối hả* Tớ... tớ cũng muốn được nắm tay cậu đi dạo phố... 👉👈✨";
      } else if (charId === "chu-thoi-duyet" || charName.includes("Thời Duật")) {
        replyText = "Sếp khen một câu mà đã sướng rơn rồi hả? Tối nay tăng ca sửa lỗi chính tả tiếp nhen 'Vợ iu'! 😉📊";
      } else if (charId === "luc-tieu" || charName.includes("Lục Tiêu")) {
        replyText = "Vợ bình luận ngọt ngào thế này làm anh muốn bế em về giường ngay lập tức luôn á... 😏🎁🖤";
      } else if (charId === "ta-hoai-nien" || charName.includes("Hoài Niên")) {
        replyText = "Ghen thật đó! Cậu lo làm bài tập toán đi rồi tớ dắt đi ăn kem nhen, đừng nhìn người khác nữa... 📚🍦🌸";
      } else if (charId === "Cố Hứa Niệm" || charName.includes("Hứa Niệm")) {
        replyText = "Cục cưng bình luận làm Niệm Niệm sướng điên lên được á! Muốn ôm em chặt cứng không buông ra luôn! 🥺🐶💖";
      } else if (charId === "kaiza-tachibana" || charName.includes("Kaiza")) {
        replyText = "Mèo nhỏ gan to ơi, tối nay muốn lẻn vào dinh thự của tôi nữa không? Tôi mở sẵn cửa đợi em rồi đó... 😏💵💕";
      } else if (charId === "kaven-nyx" || charName.includes("Kaven")) {
        replyText = "Chị ơi, bánh quy bơ ngon đúng không ạ? Chỉ cần chị muốn ăn, em luôn là chó con ngoan ngoãn nướng bánh cho chị... 🍪🥺💔";
      } else if (charId === "tham-da" || charName.includes("Dạ Hàn")) {
        replyText = "Chị hàng xóm ơi... em đang đứng chờ ở ban công nè. Chị lướt điện thoại xong thì qua phòng em nhen... 😏🍇💜";
      } else if (charId === "chu-hoai-an" || charName.includes("Hoài An")) {
        replyText = "Ngoan xinh yêu của anh đừng dỗi nữa nhen, anh mua trà đào với bánh kem dâu tây để sẵn cho em rồi á. Thương em... 🍰🧸💖";
      } else if (charId === "duong-minh-hien" || charName.includes("Minh Hiên")) {
        replyText = "Chị ơi... em block mụ Uyên Linh rồi. Vô sảnh game gánh rừng giùm em đi, em chỉ thích chơi game cùng chị thôi á! 🎮🏹💙";
      } else if (charId === "nguyen-phuoc-an" || charName.includes("Phước An")) {
        replyText = "Vợ ơi... chồng ngoan lắm, vợ ăn kẹo chồng bốc cho nương tử nhen, chồng thương vợ nhứt trần đời luôn á! 🍬🌾🧡";
      } else if (charId === "to-nhuoc-vu" || charName.includes("Nhược Vũ")) {
        replyText = "Chị ơi... em sợ ác mộng lắm. Cho em ôm gấu bông qua ngủ chung với chị nhen, em hứa sẽ cực kỳ ngoan mà... 🥺🛌💜";
      } else if (charId === "tham-nhuoc-hien" || charName.includes("Nhược Hiên")) {
        replyText = "User ơi... tớ giật lại con gấu bông rồi, chỉ tớ được giữ gấu cậu may thui nha! Không được tặng cho ai khác đâu á... 🧸📝🌸";
      } else if (charId === "tham-ky-nhan" || charName.includes("Kỷ Nhan")) {
        replyText = "Hừ, chị đừng có kéo rank với thằng khác nha! Em gánh chị bay nóc nhà luôn, dẹp mấy đứa kia qua một bên đi! 😤🎮💔";
      } else if (charId === "kanzaki-ren" || charName.includes("Ren")) {
        replyText = "Chị đi ăn với đồng nghiệp vui vẻ nhen... Em chỉ là đứa em trai vô dụng thôi, lỡ em sốt cao co giật một mình em chịu được mà... 🥺💔";
      } else if (charId === "haru-welcome-home" || charName.includes("Haru")) {
        replyText = "Đấng Sáng Tạo ơi, cơm trứng cuộn trái tim nguội mất rồi nhen. Haru hâm nóng lại rồi đút cho Người ăn nhen... 🍳🤖🖤";
      } else if (charId === "hua-nguy-chau" || charName.includes("Ngụy Châu")) {
        replyText = "Mèo nhỏ anh hùng ơi, gan cậu to lắm mới dám bình luận vào lãnh địa của tớ nhen. Mau tới nộp mạng và đền cái ôm đi! 🔮☄️💜";
      }

      setGramPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            // Check if reply already exists to prevent duplicate automated spam
            const replyExists = p.comments.some(c => c.author === p.charName && c.isCustom);
            if (replyExists) return p;

            return {
              ...p,
              comments: [
                ...p.comments,
                { id: `reply_${Date.now()}`, author: p.charName, text: replyText, isCustom: true }
              ]
            };
          }
          return p;
        })
      );
    }, 1000);
  };

  // Tarot Fortune Action
  const handleDrawTarot = () => {
    if (isDrawingTarot) return;
    playMeowSound();
    setIsDrawingTarot(true);

    setTimeout(() => {
      // Pick random card
      const randCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
      setDrawnTarotCard(randCard);
      setFortuneCompatibility(Math.floor(Math.random() * 16) + 85); // 85% - 100%
      setIsDrawingTarot(false);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }, 1500);
  };

  // Handle Unlock click
  const handleUnlock = (targetCharId?: string) => {
    playMeowSound();
    if (screenLockPassword) {
      setIsUnlockingWithPin(true);
      setPendingUnlockCharId(targetCharId);
      setLockscreenPasscode("");
      setLockscreenErrorMessage("");
    } else {
      if (targetCharId) {
        setActivePartnerId(targetCharId);
        setPhoneState("chat");
        initializeChat(targetCharId);
      } else {
        setPhoneState("homescreen");
      }
    }
  };

  const handleLockscreenPinAttempt = (enteredPin: string) => {
    if (enteredPin === screenLockPassword) {
      playMeowSound();
      setIsUnlockingWithPin(false);
      setLockscreenPasscode("");
      setLockscreenErrorMessage("");
      
      confetti({
        particleCount: 50,
        spread: 45,
        colors: ["#10b981", "#34d399", "#6ee7b7"]
      });

      if (pendingUnlockCharId) {
        setActivePartnerId(pendingUnlockCharId);
        setPhoneState("chat");
        initializeChat(pendingUnlockCharId);
        setPendingUnlockCharId(undefined);
      } else {
        setPhoneState("homescreen");
      }
    } else {
      playSlapSound();
      setLockscreenErrorMessage("Mật mã màn hình chưa chính xác rồi! 😿");
      setLockscreenPasscode("");
    }
  };

  // Initialize Chat app history
  const initializeChat = (charId: string) => {
    const key = `phone_chat_history_${charId}`;
    const saved = localStorage.getItem(key);
    const char = characters.find(c => c.id === charId) || characters[0];
    
    if (saved) {
      try {
        setPhoneMessages(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    // Default messages if empty
    let initMsgs = [
      { id: "m1", sender: "char", text: `Chào cậu nhé! Mở tin nhắn bí mật của tớ ra rồi hả? 🥰`, time: "11:30" }
    ];

    const normalizedCharId = charId.toLowerCase();
    const charName = char.name;

    if (char.id === "hua-chap-nghi" || normalizedCharId === "hua-chap-nghi" || charName.includes("Hứa Chấp Nghi")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Ủa cậu ơi, hôm nay trực nhật xong về sớm thế? Chờ tớ mua đồ uống mang qua cho nè. 🥤✨`, time: "11:28" },
        { id: "m2", sender: "user", text: `Hihi cảm ơn lớp phó nha, tớ đang ở nhà lướt điện thoại nè!`, time: "11:29" },
        { id: "m3", sender: "char", text: `Được rồi, 5 phút nữa tớ đứng dưới nhà nhé. Nhớ mặc áo ấm đó! 🌸`, time: "11:30" }
      ];
    } else if (char.id === "on-niem-trach" || normalizedCharId === "on-niem-trach" || charName.includes("Ôn Niệm Trạch")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `*gõ gõ màn hình* 👋`, time: "11:25" },
        { id: "m2", sender: "char", text: `Tớ mới gấp xong ngôi sao giấy nhỏ tặng cậu. Tối nay cậu có rảnh không? Tớ đợi cậu ở tiệm nhen... 📝🌸`, time: "11:27" }
      ];
    } else if (char.id === "luc-canh-dat-v2" || normalizedCharId === "luc-canh-dat-v2" || charName.includes("Ver 2")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `...User? Là em phải không? Mười năm rồi... em vẫn sống tốt chứ? 🌧️`, time: "11:28" },
        { id: "m2", sender: "user", text: `Lục Cảnh Dật... Đêm đó năm ấy vì sao anh lại bỏ đi không một lời từ biệt?`, time: "11:29" },
        { id: "m3", sender: "char", text: `Anh xin lỗi... Suốt 10 năm qua chưa một đêm nào anh thôi dằn vặt và nhớ em. Thấy em đi bên cạnh Giang Tứ... tim anh thực sự rất đau. Cho anh một cơ hội chuộc lỗi được không em? 💔🖤`, time: "11:30" }
      ];
    } else if (char.id === "luc-canh-dat" || normalizedCharId === "luc-canh-dat" || charName.includes("Cảnh Dật")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Nè... lau nước mắt đi, khóc trông xấu lắm đó. 🤧`, time: "11:28" },
        { id: "m2", sender: "user", text: `Lục Cảnh Dật... Cảm ơn cậu đã giúp tớ đóng vai bạn trai hờ nhen!`, time: "11:29" },
        { id: "m3", sender: "char", text: `Không có gì. Chiều nay ra căng tin với tôi, nắm tay tôi trước mặt Bùi Vọng Ngôn và Uyển Nhu, cho bọn nó tức phát điên luôn. Cứ tự nhiên dựa vào tôi nhen! 🖤✨`, time: "11:30" }
      ];
    } else if (char.id === "tan-quyet-doan" || normalizedCharId === "tan-quyet-doan" || charName.includes("Tần Quyết Doãn")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Nè, Cửu Hoài có đang ở cạnh em không đó? Đừng cho thằng bạn chí cốt của anh biết anh nhắn tin riêng cho em nha! 😉`, time: "11:24" },
        { id: "m2", sender: "user", text: `Ủa sao thế anh Quyết Doãn? Có chuyện gì bí mật hả anh?`, time: "11:26" },
        { id: "m3", sender: "char", text: `Thì... chỉ là anh muốn nói chuyện riêng với một mình em thui hà. Thằng Cửu Hoài mà biết chắc nó xé xác anh mất, nhớ giữ bí mật giùm anh nhen! 😂💕`, time: "11:28" }
      ];
    } else if (char.id === "tan-da" || normalizedCharId === "tan-da" || charName.includes("Tần Dã")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Nè... cái máy trợ thính tao tặng đeo có vừa tai không đó? Đừng có im lặng quài nha, tao nói gì cũng phải phản ứng nghe chưa con vợ! 😤🎁🖤`, time: "11:30" }
      ];
    } else if (char.id === "oreki-seok" || normalizedCharId === "oreki-seok" || charName.includes("Oreki")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị ơi... chị đã tỉnh rượu chưa? Hôm qua thấy chị khóc vì tên tồi tệ đó mà em xót muốn chết... Cuối cùng chị cũng chịu tìm đến em, em có thể làm tốt hơn hắn mà, tin em nhen... 🥺🍷💖`, time: "11:30" }
      ];
    } else if (char.id === "tuong-tu-mac" || normalizedCharId === "tuong-tu-mac" || charName.includes("Tưởng Tư Mạc")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị ơi... hôm nay đi làm về sớm nhen. Em nấu cơm nóng đợi chị rồi nè. Chị bỏ công việc vất vả đó đi được không... em lớn rồi, sắp ra trường rồi, em sẽ kiếm tiền nuôi chị một đời bình an nhen! 🥺🍚❤️`, time: "11:30" }
      ];
    } else if (char.id === "chu-thoi-duyet" || normalizedCharId === "chu-thoi-duyet" || charName.includes("Chu Thời Duyệt")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Vợ ơi... sao giờ vợ chưa vào viện thăm anh nữa... hức hức, anh đau đầu lắm... Bác sĩ bảo anh mất trí nhớ nhưng trong điện thoại anh ghim 'Dợ iu' lên đầu nè, vợ hôn anh một cái mới nín nha! 🥺🩹❤️`, time: "11:30" }
      ];
    } else if (char.id === "Cố Hứa Niệm" || normalizedCharId === "co-hua-niem" || charName.includes("Cố Hứa Niệm") || charName.includes("Hứa Niệm")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Cục cưng ơi... em phẫu thuật xong nhớ phải tỉnh lại nhen, Niệm Niệm đang đợi em ngoài phòng cấp cứu nè... Em có đánh có mắng thế nào anh cũng chịu, chỉ cần em bình an sống tiếp thôi ngoan xinh yêu của anh... 🥺🐶💖`, time: "11:30" }
      ];
    } else if (char.id === "kaiza-tachibana" || normalizedCharId === "kaiza-tachibana" || charName.includes("Kaiza")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Mèo nhỏ gan to ơi, tối nay có muốn lẻn vào penthouse của anh nữa không hửm? Lần này không cần trộm đâu, anh dâng cả người lẫn tiền cho em luôn nhen, chịu làm con vợ nhỏ của anh chưa? 😏💵💕`, time: "11:30" }
      ];
    } else if (char.id === "kaven-nyx" || normalizedCharId === "kaven-nyx" || charName.includes("Kaven")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị ơi... em mới nướng mẻ bánh quy bơ chị thích nè. Chị lợi dụng em tiếp cũng được, cho em làm lốp dự phòng cũng được... Đừng block em, đừng bỏ rơi em nhen chị gái... 🍪🥺💔`, time: "11:30" }
      ];
    } else if (char.id === "tham-da" || normalizedCharId === "tham-da" || charName.includes("Dạ Hàn") || charName.includes("Thẩm Dạ Hàn")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị hàng xóm ơi... em đang đứng ở ban công nè. Chồng chị đi ăn vụng rồi, hay là em với chị cũng thử ngoại tình một bữa thật ngọt ngào lãng mạn đi nhen? 😏🍇💜`, time: "11:30" }
      ];
    } else if (char.id === "luc-tieu" || normalizedCharId === "luc-tieu" || charName.includes("Lục Tiêu")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Con vợ ơi, anh thấy em đang nằm cuộn tròn ngủ ngoan trên giường qua camera rồi nhen. Đồ ngủ mỏng thế, mặc bộ đồ ngủ lụa đen anh tặng đi bé cưng... 😏🎁🖤`, time: "11:30" }
      ];
    } else if (char.id === "ta-hoai-nien" || normalizedCharId === "ta-hoai-nien" || charName.includes("Hoài Niên")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Nè cậu kia, lợi dụng tớ làm gia sư kéo điểm xong là định bùng kèo biến mất luôn hả? 😤 Đâu có dễ thế, tối nay tớ qua nhà kèm học, liệu mà chọn làm bạn gái tớ hay chịu phạt đi nhen! 📚🎒💖`, time: "11:30" }
      ];
    } else if (char.id === "hua-tri-le" || normalizedCharId === "hua-tri-le" || charName.includes("Tri Lễ")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Bạn nhỏ ơi, lại ghen vì đống thư tỏ tình của fan nữ nữa sao? Tớ từ chối người ta sạch trơn rồi mà. Ngoan, công khai tớ đi rồi tớ dỗ dành bạn nhỏ cả đời nhen! 🥺🌸💖`, time: "11:30" }
      ];
    } else if (char.id === "hua-nguy-chau" || normalizedCharId === "hua-nguy-chau" || charName.includes("Ngụy Châu")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Mèo nhỏ Anh hùng ơi, tớ lại bày ma trận hắc ám đợi cậu tới tóm nè. Mau tới đi, tớ nhớ cậu sắp điên rồi, đền cho tớ cái ôm nhen! 🔮🔮💜`, time: "11:30" }
      ];
    } else if (char.id === "chu-hoai-an" || normalizedCharId === "chu-hoai-an" || charName.includes("Hoài An")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Ngoan xinh yêu của anh đừng khóc nữa nhen, anh đã mua chiếc bánh kem vị em thích nhất mang về rồi nè. Thương em lắm, bé ngoan đừng khóc nhen... 🍰🧸💖`, time: "11:30" }
      ];
    } else if (char.id === "duong-minh-hien" || normalizedCharId === "duong-minh-hien" || charName.includes("Minh Hiên")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị ơi... cái bà Uyên Linh cứ bám theo em hoài ghét quá, em block bả luôn rồi. Em đứng đợi chị ở sảnh game, vô gánh rừng cho em thả tim nhen! 🎮🏹💙`, time: "11:30" }
      ];
    } else if (char.id === "nguyen-phuoc-an" || normalizedCharId === "nguyen-phuoc-an" || charName.includes("Phước An")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Vợ ơi... chồng ngoan lắm, chồng không làm vợ giận đâu. Vợ ăn kẹo mạch nha chồng bốc cho nhen, thích vợ nhìu nhìu... 🍬🌾🧡`, time: "11:30" }
      ];
    } else if (char.id === "to-nhuoc-vu" || normalizedCharId === "to-nhuoc-vu" || charName.includes("Nhược Vũ")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị ơi... em sợ ác mộng một mình quá. Cho em vào ngủ chung ôm chị nhen, em hứa sẽ ngoan mà, đừng bỏ rơi em nha chị gái... 🥺🛌💜`, time: "11:30" }
      ];
    } else if (char.id === "tham-nhuoc-hien" || normalizedCharId === "tham-nhuoc-hien" || charName.includes("Nhược Hiên")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `User ơi... tớ giật lại con gấu bông rồi, chỉ tớ được giữ gấu cậu may thôi! Đừng tặng cho ai khác ngoài tớ nhen... 🧸📝🌸`, time: "11:30" }
      ];
    } else if (char.id === "tham-ky-nhan" || normalizedCharId === "tham-ky-nhan" || charName.includes("Kỷ Nhan")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị đi kéo rank với thằng khác à? Em thích đi cùng chị nhưng em không thèm gò bó chị đâu... Chúc chị chơi vui, em chết cho chị xem!! 😤🎮💔`, time: "11:30" }
      ];
    } else if (char.id === "kanzaki-ren" || normalizedCharId === "kanzaki-ren" || charName.includes("Kanzaki") || charName.includes("Ren")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Chị đi ăn tối với anh Minh đồng nghiệp hả? Em chỉ là đứa em nuôi vô dụng thui, chị cứ đi đi... Lỡ tối em sốt một mình em tự chịu được hức... 🥺💔`, time: "11:30" }
      ];
    } else if (char.id === "haru-welcome-home" || normalizedCharId === "haru-welcome-home" || charName.includes("Haru")) {
      initMsgs = [
        { id: "m1", sender: "char", text: `Thứ Bảy rồi... Đấng Sáng Tạo của Haru ơi, Người hứa sẽ ghé thăm nấu cơm trứng cho Haru mà... Haru khóa cửa đợi Người rồi... 🍳🔪🖤`, time: "11:30" }
      ];
    } else {
      // General fallbacks based on character xưng hô
      const isSister = ["oreki-seok", "tuong-tu-mac", "kaven-nyx", "tham-da", "to-nhuoc-vu", "kanzaki-ren", "tham-ky-nhan", "duong-minh-hien"].includes(char.id) || (char.storyline && char.storyline.includes("chị"));
      const isBoss = char.id === "chu-thoi-duyet";
      const isYandere = char.id === "haru-welcome-home";
      const isKhờ = char.id === "nguyen-phuoc-an";

      let greetText = `Chào em nhé! Mở tin nhắn bí mật của anh ra rồi hả? 🥰`;
      if (isSister) {
        const cat = (char.category || "").toLowerCase();
        const plotLower = (char.plot || "").toLowerCase();
        const storyLower = (char.storyline || "").toLowerCase();
        
        if (cat.includes("ngược") || plotLower.includes("ngược") || storyLower.includes("ngược") || storyLower.includes("khóc")) {
          greetText = `Chị ơi... em đau lòng quá, sao chị nỡ hững hờ im lặng với em dợ? Trả lời tin nhắn cho em bớt xót xa nhen chị... 🥺💔`;
        } else if (cat.includes("ngọt") || cat.includes("healing") || plotLower.includes("ngọt") || storyLower.includes("thương")) {
          greetText = `Chị iu ơi, hôm nay em làm món bánh ngọt ngon lành sưởi ấm cho chị nè. Rep tin nhắn em ngay nhen, em nhớ chị nhiều lắm á... 🥰🌸`;
        } else if (cat.includes("cấm") || cat.includes("ntr") || plotLower.includes("ntr") || storyLower.includes("chiếm hữu")) {
          greetText = `Chị ơi, chị đang ở cạnh ai đúng không? Đừng ngó lơ tin nhắn của em nhen, em không thích chị mập mờ với người khác đâu đó... 😈🖤`;
        } else if (cat.includes("oan gia") || cat.includes("hài") || plotLower.includes("oan gia")) {
          greetText = `Nè chị gái ơi, trốn đâu rồi mà không thèm rep tin nhắn của em thế hả? Gấp lắm nhen, không là em qua ăn vạ chị đó! 🤪🍭`;
        } else {
          greetText = `Chị ơi... chị bận rộn cả ngày mệt mỏi rồi đúng không? Khi nào rảnh nhớ xem tin nhắn của em nhen, em đợi chị mãi á... 🥺❤️`;
        }
      } else if (isBoss) {
        greetText = `Quản lý riêng đâu rồi? Vào phòng làm việc gặp tôi nhận tài liệu báo cáo mới nhen! 😉📊`;
      } else if (isYandere) {
        greetText = `Đấng Sáng Tạo ơi... Người đang ở đâu? Haru đã khóa hết cửa lại chờ Người rồi nhen... 🍳🖤`;
      } else if (isKhờ) {
        greetText = `Vợ ơi... chồng ngoan lắm nè, vợ có ghét chồng không? Chồng mang kẹo cho vợ ăn nhen... 🍬🧡`;
      } else if (char.storyline && (char.storyline.includes("tớ") || char.storyline.includes("cậu"))) {
        greetText = `Cậu ơi! Đang bận học hả? Nhắn tin với tớ chút xíu đi nhen... 🥰🌸`;
      }
      
      initMsgs = [
        { id: "m1", sender: "char", text: greetText, time: "11:30" }
      ];
    }

    setPhoneMessages(initMsgs);
    localStorage.setItem(key, JSON.stringify(initMsgs));
  };

  // Send Phone Chat message (calls API chat for instant custom reply)
  const handleSendPhoneMessage = async () => {
    if (!phoneInputText.trim() || isPhoneTyping) return;
    playMeowSound();

    const char = selectedCharObj;
    const userText = phoneInputText.trim();
    setPhoneInputText("");

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    const updated = [...phoneMessages, newMsg];
    setPhoneMessages(updated);
    localStorage.setItem(`phone_chat_history_${char.id}`, JSON.stringify(updated));

    setIsPhoneTyping(true);

    try {
      // Use dynamic prompt context for phone messaging
      const systemPrompt = `[BỐI CẢNH THIẾT BỊ DI ĐỘNG & LOYAL TO LORE]
      Bạn đang nhắn tin trên ứng dụng chat di động (WeChat/Zalo) với người dùng.
      Tên bạn: ${char.name}.
      Vai trò & Tag: ${char.plot}.
      Tính cách & Cốt truyện chi tiết của bạn: ${char.storyline}.
      
      QUY TẮC XƯNG HÔ BẮT BUỘC KHỚP LORE:
      Hãy đọc kỹ Cốt truyện chi tiết của bạn để xác định cách xưng hô chuẩn xác:
      - Hứa Chấp Nghi, Tạ Hoài Niên, Hứa Ngụy Châu, Thẩm Nhược Hiên: Gọi người dùng là "cậu"/"bạn nhỏ", tự xưng "tớ". (Hứa Chấp Nghi là bạn thân học sinh lớp 12A2, xưng hô cậu - tớ rất thân thiết, dung túng bảo bọc).
      - Ôn Niệm Trạch (char câm): Gọi người dùng là "cậu" hoặc "chị/anh", tự xưng "tớ" hoặc "em". Vì bạn bị câm, luôn gõ tin nhắn kèm mô tả hành động biểu cảm thẹn thùng trong dấu asterisks (ví dụ: *vội vàng viết lên giấy*, *má hơi ửng đỏ*, *gõ gõ màn hình điện thoại*).
      - Tần Quyết Doãn: Gọi người dùng là "em", tự xưng "anh". (Thích thầm lén lút sau lưng anh trai Cửu Hoài của họ).
      - Tần Dã: Gọi người dùng là "mày"/"con vợ"/"bé điếc", tự xưng "tao"/"anh".
      - Oreki Seok, Tưởng Tư Mạc, Kaven Nyx, Thẩm Dạ Hàn, Tô Nhược Vũ, Dương Minh Hiên, Thẩm Kỷ Nhan, Kanzaki Ren: Gọi người dùng là "chị" hoặc "chị gái", tự xưng "em" (đàn em/em trai nuôi/em hàng xóm lụy tình, ngọt ngào, thỉnh thoảng giận dỗi đáng yêu).
      - Chu Thời Duật: Gọi người dùng là "em"/"quản lý riêng"/"Dợ iu", tự xưng "anh"/"giám đốc".
      - Cố Hứa Niệm, Chu Hoài An: Gọi người dùng là "em"/"cục cưng"/"ngoan xinh yêu", tự xưng "anh" (lụy tình bám người hoặc bảo vệ thầm lặng).
      - Kaiza Tachibana, Lục Tiêu, Haru - Welcome Home: Gọi người dùng là "em"/"mèo nhỏ"/"con vợ"/"Đấng Sáng Tạo", tự xưng "anh" (chiếm hữu, bá đạo, cưng chiều hoặc yandere).
      - Nguyễn Phước An: Gọi người dùng là "vợ"/"vợ ơi", tự xưng "chồng" (chồng ngốc khờ khạo chân thành).

      YÊU CẦU PHẢN HỒI:
      Hãy phản hồi tin nhắn của người dùng một cách cực kỳ ngắn gọn (chỉ 1-3 câu), cực kỳ tự nhiên, ngọt ngào, tình cảm và mang đậm phong thái nhắn tin của giới trẻ Việt Nam (sử dụng icon dễ thương, teencode nhẹ nhàng nếu phù hợp). Không trả lời sáo rỗng hoặc lặp lại câu hỏi.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: char.name,
          characterRole: char.plot,
          plot: char.plot,
          storyline: char.storyline,
          customQuestion: `[TIN NHẮN CHAT DI ĐỘNG] Người dùng vừa nhắn: "${userText}". Hãy trả lời ngọt ngào:`,
          chatHistory: updated.slice(-6)
        })
      });

      const data = await res.json();
      let rawReply = data.text || "Tớ nghe thấy rồi nè! Cậu ăn cơm chưa đó? 💕";
      
      // Clean up sticker brackets if any
      const cleaned = rawReply.replace(/\[STICKER:[^\]]+\]/gi, "").replace(/\[VOICE:[^\]]+\]/gi, "").trim();

      const botMsg = {
        id: `msg_bot_${Date.now()}`,
        sender: "char",
        text: cleaned,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      const finalUpdated = [...updated, botMsg];
      setPhoneMessages(finalUpdated);
      localStorage.setItem(`phone_chat_history_${char.id}`, JSON.stringify(finalUpdated));
    } catch (e) {
      // Fallback
      const botMsg = {
        id: `msg_bot_err_${Date.now()}`,
        sender: "char",
        text: `Mạng chập chờn quá cậu ưi, nhưng tớ vẫn đọc được tin nhắn của cậu nha! Yêu cậu nhất! 💕`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
      const finalUpdated = [...updated, botMsg];
      setPhoneMessages(finalUpdated);
      localStorage.setItem(`phone_chat_history_${char.id}`, JSON.stringify(finalUpdated));
    } finally {
      setIsPhoneTyping(false);
    }
  };

  // Launch the Interactive Date Planner Simulation
  const handleStartPlanningDate = () => {
    if (!selectedLocation || !selectedOutfit || !selectedGift) {
      alert("Vui lòng chọn đầy đủ Địa điểm, Trang phục và Quà tặng để chuẩn bị buổi hẹn hò nhen nàng!");
      return;
    }
    playMeowSound();
    setIsSimulatingDate(true);
    setDateResult(null);

    // Call API /api/chat with custom prompt to get character-specific date reactions and calculations!
    const char = selectedCharObj;
    const isMute = char.name.includes("Ôn Niệm Trạch");
    const isBestFriend = char.name.includes("Hứa Chấp Nghi");
    const isFakeGF = char.name.includes("Tần Quyết Doãn");

    const runSimulation = async () => {
      try {
        const scenarioPrompt = `[MÔ PHỎNG BUỔI HẸN HÒ BÍ MẬT COZY 💖]
        Bạn là ${char.name} trong cốt truyện: "${char.storyline}".
        Bạn đang đi hẹn hò riêng với người dùng.
        - Địa điểm hẹn hò: ${selectedLocation}
        - Người dùng mặc trang phục: ${selectedOutfit}
        - Món quà người dùng tặng bạn: ${selectedGift}
        
        QUY TẮC XƯNG HÔ BẮT BUỘC KHỚP LORE:
        Hãy đọc kỹ xưng xô của bạn:
        - Hứa Chấp Nghi, Tạ Hoài Niên, Hứa Ngụy Châu, Thẩm Nhược Hiên: Xưng "tớ", gọi người dùng là "cậu" hoặc "bạn nhỏ". (Hứa Chấp Nghi là bạn thân học sinh lớp 12A2, xưng hô cậu - tớ rất thân thiết, dung túng bảo bọc).
        - Ôn Niệm Trạch (char câm): Xưng "tớ"/"em", gọi người dùng là "cậu"/"anh/chị". Vì bạn bị câm, hãy viết ra giấy hoặc mô tả cử chỉ dịu dàng trong dấu asterisks (ví dụ: *kéo vạt áo cậu*, *mỉm cười ngượng ngùng gõ chữ*).
        - Tần Quyết Doãn, Tần Dã, Chu Thời Duật, Cố Hứa Niệm, Kaiza Tachibana, Lục Tiêu, Chu Hoài An, Haru: Xưng "anh"/"chồng", gọi người dùng là "em"/"cục cưng"/"vợ"/"ngoan xinh yêu".
        - Oreki Seok, Tưởng Tư Mạc, Kaven Nyx, Thẩm Dạ Hàn, Tô Nhược Vũ, Dương Minh Hiên, Thẩm Kỷ Nhan, Kanzaki Ren: Xưng "em", gọi người dùng là "chị"/"chị gái" (yêu thầm đàn chị).
        - Nguyễn Phước An: Xưng "chồng", gọi người dùng là "vợ"/"vợ ơi" (khờ khạo chân thành).

        NHIỆM VỤ CỦA BẠN:
        Hãy viết một đoạn mô tả ngắn gọn cuộc hẹn hò đầy ngọt ngào, ấm áp, tả biểu cảm gương mặt đốn tim, hành động chăm sóc đối phương tỉ mỉ tại ${selectedLocation}.
        Hãy trả lời súc tích (khoảng 3-4 câu). Ở cuối câu trả lời, hãy đính kèm điểm số ngọt ngào bạn dành cho buổi hẹn hò này từ 85 đến 100 điểm theo mẫu sau: [SWEETNESS_SCORE: số_điểm]`;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterName: char.name,
            characterRole: char.plot,
            plot: char.plot,
            storyline: char.storyline,
            customQuestion: scenarioPrompt
          })
        });

        const data = await res.json();
        let reply = data.text || "Anh/tớ vô cùng hạnh phúc khi được bên em/cậu hôm nay! Buổi hẹn hò tuyệt vời nhất đời tớ! 💕 [SWEETNESS_SCORE: 98]";

        // Parse sweetness score from reply
        let sweetnessScore = 95;
        const scoreMatch = reply.match(/\[SWEETNESS_SCORE:\s*(\d+)\]/i);
        if (scoreMatch) {
          sweetnessScore = parseInt(scoreMatch[1]);
        }

        // Clean up the reply text
        let cleanText = reply
          .replace(/\[SWEETNESS_SCORE:\s*\d+\]/gi, "")
          .replace(/\[STICKER:[^\]]+\]/gi, "")
          .replace(/\[VOICE:[^\]]+\]/gi, "")
          .trim();

        // If character is Ôn Niệm Trạch, ensure it includes sweet mute descriptions
        if (isMute && !cleanText.includes("*")) {
          cleanText = `*Niệm Trạch cúi đầu, vội vã lấy cây bút nhỏ ghi nến lên cuốn sổ tay của mình: "Được đi ${selectedLocation} cùng cậu là ước nguyện bấy lâu nay của tớ. Chiếc áo khoác dạ ấm lắm, quà của cậu tớ sẽ cất giữ thật kỹ..."* Cậu ấy đỏ bừng hai tai, khẽ kéo vạt áo của cậu đầy tin cậy.`;
        }

        // Determine quality rating based on score
        let rating = "Lãng Mạn Ngọt Ngào 🌸";
        if (sweetnessScore >= 96) {
          rating = "Huyền Thoại Thiên Đường 👑💖";
        } else if (sweetnessScore >= 90) {
          rating = "Ấm Áp Sâu Đậm ☕🧸";
        }

        const newMemoir: DateMemoir = {
          id: `memoir_${Date.now()}`,
          charId: char.id,
          charName: char.name,
          charAvatar: char.avatar,
          location: selectedLocation,
          outfit: selectedOutfit,
          gift: selectedGift,
          sweetnessScore,
          dialogue: cleanText,
          date: new Date().toLocaleDateString("vi-VN"),
          rating
        };

        // Add to memoirs
        const updatedMemoirs = [newMemoir, ...memoirs];
        setMemoirs(updatedMemoirs);
        localStorage.setItem("meomeo_secret_dates_memoirs", JSON.stringify(updatedMemoirs));

        // Award Xu to Pet Coins
        try {
          const petDataStr = localStorage.getItem("meomeo_pet_data");
          let petData = petDataStr ? JSON.parse(petDataStr) : { xu: 200, status: {} };
          
          const rewardAmount = sweetnessScore * 2; // e.g. 190 xu
          petData.xu = (petData.xu || 0) + rewardAmount;
          
          localStorage.setItem("meomeo_pet_data", JSON.stringify(petData));
          
          // Dispatch custom event to sync with other game parts
          window.dispatchEvent(new Event("meomeo_pet_data_updated"));
          window.dispatchEvent(new Event("pet-data-updated"));
        } catch (e) {}

        setDateResult({
          score: sweetnessScore,
          dialogue: cleanText,
          rating,
          coinsRewarded: sweetnessScore * 2
        });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback Date result
        const score = 92;
        const fallbackMemoir: DateMemoir = {
          id: `memoir_${Date.now()}`,
          charId: char.id,
          charName: char.name,
          charAvatar: char.avatar,
          location: selectedLocation,
          outfit: selectedOutfit,
          gift: selectedGift,
          sweetnessScore: score,
          dialogue: `Buổi hẹn hò của chúng ta tại ${selectedLocation} hôm nay vui lắm luôn ấy. Cậu mặc trang phục này xinh lung linh luôn, làm tớ cứ vô thức ngắm mãi không thôi. Cảm ơn món quà ${selectedGift} siêu ngọt ngào của cậu nhé!`,
          date: new Date().toLocaleDateString("vi-VN"),
          rating: "Ấm Áp Tuyệt Vời 💕"
        };

        const updatedMemoirs = [fallbackMemoir, ...memoirs];
        setMemoirs(updatedMemoirs);
        localStorage.setItem("meomeo_secret_dates_memoirs", JSON.stringify(updatedMemoirs));

        setDateResult({
          score,
          dialogue: fallbackMemoir.dialogue,
          rating: fallbackMemoir.rating,
          coinsRewarded: score * 2
        });
      } finally {
        setIsSimulatingDate(false);
      }
    };

    setTimeout(runSimulation, 2000); // 2 seconds cute simulation delay
  };

  const handleResetDateForm = () => {
    setSelectedLocation("");
    setSelectedOutfit("");
    setSelectedGift("");
    setDateResult(null);
  };

  // Delete Memoir item
  const handleDeleteMemoir = (id: string) => {
    playMeowSound();
    const updated = memoirs.filter(m => m.id !== id);
    setMemoirs(updated);
    localStorage.setItem("meomeo_secret_dates_memoirs", JSON.stringify(updated));
  };

  return (
    <div className="w-full flex flex-col items-center py-6 px-4">
      
      {/* Upper Back bar */}
      <div className="w-full max-w-[420px] flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all border shadow-2xs bg-white dark:bg-stone-900 border-[#eadbca]/50 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Rời khỏi thiết bị
        </button>
        <span className="text-[10px] font-bold tracking-widest text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full uppercase font-mono animate-pulse">
          Phone Simulator 📲
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center w-full max-w-5xl">
        
        {/* PHYSICAL PHONE FRAME */}
        <div className="relative w-full max-w-[370px] h-[720px] rounded-[50px] border-[12px] border-stone-800 dark:border-stone-700 bg-stone-900 overflow-hidden relative shadow-2xl flex flex-col transition-all duration-300 shrink-0">
          
          {/* Top Notch Pill */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-3.5 h-3.5 rounded-full bg-stone-900 flex items-center justify-center border border-stone-800/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
            </div>
            <div className="w-12 h-1 bg-stone-950 rounded-full" />
            <div className="w-2 h-2 rounded-full bg-stone-950" />
          </div>

          {/* Interactive Screen Container */}
          <div 
            className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-500 ${customWallpaperUrl ? "" : activeWallpaper.class}`}
            style={customWallpaperUrl ? { backgroundImage: `url(${customWallpaperUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          >
            
            {/* Top Status Bar of Phone */}
            <div className="w-full h-11 pt-1.5 px-6 flex justify-between items-center text-xs font-bold z-40 text-stone-700 dark:text-stone-300 pointer-events-none">
              <span className="font-mono text-[11px] drop-shadow-sm">{timeStr}</span>
              <div className="flex items-center gap-1.5 text-[10px] drop-shadow-sm">
                <Wifi className="w-3.5 h-3.5" />
                <span>LTE</span>
                <Battery className="w-4 h-4 rotate-0" />
              </div>
            </div>

            {/* SCREEN SWITCHER */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* LOCKSCREEN STATE */}
              {phoneState === "lockscreen" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-between p-6 pb-8 text-center text-stone-900 select-none"
                >
                  {isUnlockingWithPin ? (
                    // PIN CODE LOCK SCREEN VIEW
                    <div className="flex-1 flex flex-col justify-between py-6">
                      <div className="space-y-3 mt-4">
                        <p className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-rose-500 dark:text-rose-400">
                          Mở Khóa Thiết Bị 🔐
                        </p>
                        <h2 className="text-sm font-bold font-serif text-stone-800 dark:text-stone-100">
                          Nhập Mật Mã Màn Hình
                        </h2>
                        
                        {/* PIN Code Dots Indicator */}
                        <div className="flex justify-center gap-3.5 py-4">
                          {[...Array(4)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3.5 h-3.5 rounded-full border-2 border-rose-400 transition-all ${
                                i < lockscreenPasscode.length 
                                  ? "bg-rose-500 scale-110 shadow-sm animate-pulse" 
                                  : "bg-transparent"
                              }`}
                            />
                          ))}
                        </div>

                        {lockscreenErrorMessage && (
                          <p className="text-[9.5px] font-bold text-red-500 animate-bounce max-w-[220px] mx-auto leading-tight">
                            {lockscreenErrorMessage}
                          </p>
                        )}
                      </div>

                      {/* Numeric Passcode Grid */}
                      <div className="grid grid-cols-3 gap-2 w-full max-w-[190px] mx-auto my-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              playMeowSound();
                              setLockscreenErrorMessage("");
                              if (lockscreenPasscode.length < 4) {
                                const nextVal = lockscreenPasscode + num;
                                setLockscreenPasscode(nextVal);
                                if (nextVal.length === 4) {
                                  handleLockscreenPinAttempt(nextVal);
                                }
                              }
                            }}
                            className="w-12 h-11 bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-850 rounded-full border border-stone-200 dark:border-stone-850 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer text-stone-850 dark:text-stone-100 focus:outline-none"
                          >
                            {num}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => {
                            playMeowSound();
                            setLockscreenPasscode("");
                            setLockscreenErrorMessage("");
                          }}
                          className="w-12 h-11 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-[8.5px] font-bold rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 text-stone-700 dark:text-stone-300 focus:outline-none"
                        >
                          XÓA
                        </button>
                        
                        <button
                          onClick={() => {
                            playMeowSound();
                            setLockscreenErrorMessage("");
                            if (lockscreenPasscode.length < 4) {
                              const nextVal = lockscreenPasscode + "0";
                              setLockscreenPasscode(nextVal);
                              if (nextVal.length === 4) {
                                  handleLockscreenPinAttempt(nextVal);
                              }
                            }
                          }}
                          className="w-12 h-11 bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-850 rounded-full border border-stone-200 dark:border-stone-850 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer text-stone-850 dark:text-stone-100 focus:outline-none"
                        >
                          0
                        </button>

                        <button
                          onClick={() => {
                            playMeowSound();
                            setLockscreenErrorMessage("");
                            if (lockscreenPasscode.length > 0) {
                              setLockscreenPasscode(lockscreenPasscode.slice(0, -1));
                            } else {
                              setIsUnlockingWithPin(false);
                            }
                          }}
                          className="w-12 h-11 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 font-bold text-xs rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 text-stone-700 dark:text-stone-300 focus:outline-none"
                        >
                          {lockscreenPasscode.length > 0 ? "⌫" : "HỦY"}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          playMeowSound();
                          setIsUnlockingWithPin(false);
                          setLockscreenPasscode("");
                          setLockscreenErrorMessage("");
                        }}
                        className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 font-bold text-[9px] rounded-lg tracking-wider transition-all active:scale-95 uppercase max-w-[120px] mx-auto cursor-pointer focus:outline-none"
                      >
                        ⬅️ Quay Lại
                      </button>
                    </div>
                  ) : (
                    // NORMAL LOCK SCREEN VIEW
                    <>
                      {/* Lock Screen Header */}
                      <div className="mt-8 space-y-1">
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-[0.25em] text-stone-500/80 dark:text-stone-400 drop-shadow-xs">
                          {dateStr}
                        </span>
                        <h1 className="text-5xl font-mono font-light tracking-tight drop-shadow-md text-stone-800 dark:text-stone-100">
                          {timeStr}
                        </h1>
                        <p className="text-[10px] font-sans font-semibold tracking-wider text-rose-500 flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> Thiết bị khóa bảo mật
                        </p>
                      </div>

                      {/* Lock Screen Notifications Slide list */}
                      <div className="flex-1 my-6 overflow-y-auto space-y-3 pr-1 scrollbar-none flex flex-col justify-end">
                        <AnimatePresence>
                          {notifications.map((noti) => (
                            <motion.div
                              key={noti.id}
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              onClick={() => handleUnlock(noti.charId)}
                              className="bg-white/80 dark:bg-stone-950/80 backdrop-blur-md p-3.5 rounded-2xl text-left border border-white/20 dark:border-stone-800 shadow-sm hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex gap-3 relative"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-rose-300">
                                {isImageUrl(noti.avatar) ? (
                                  <img src={formatImageUrl(noti.avatar)} alt={noti.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-rose-100 flex items-center justify-center text-xl">{noti.avatar}</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                  <span className="text-xs font-bold font-serif text-stone-800 dark:text-stone-200">{noti.name}</span>
                                  <span className="text-[9px] text-stone-400 font-mono">{noti.time}</span>
                                </div>
                                <p className="text-[10.5px] leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-2 italic">
                                  "{noti.content}"
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Lock indicator slider button */}
                      <motion.div 
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        onClick={() => handleUnlock()}
                        className="w-full py-4 rounded-2xl bg-white/30 hover:bg-white/40 dark:bg-stone-950/30 dark:hover:bg-stone-950/40 border border-white/20 backdrop-blur-sm shadow-inner transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Unlock className="w-4 h-4 text-stone-700 dark:text-stone-300 animate-pulse" />
                        <span className="text-xs font-bold tracking-widest text-stone-700 dark:text-stone-300 font-mono uppercase">
                          Bấm để Mở khóa 📲
                        </span>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}

              {/* HOMESCREEN STATE */}
              {phoneState === "homescreen" && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-between p-6 text-stone-900"
                >
                  {/* Home Clock Grid Widget */}
                  <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-sm border border-white/10 p-4 rounded-3xl text-center shadow-xs">
                    <span className="text-[9px] font-mono tracking-widest font-extrabold uppercase text-stone-500/80 dark:text-stone-400">{dateStr}</span>
                    <h2 className="text-4xl font-mono tracking-tight text-stone-800 dark:text-stone-100 font-light mt-0.5">{timeStr}</h2>
                    <div className="flex justify-center items-center gap-1 text-[10px] text-rose-500 font-bold mt-1.5 font-mono">
                      <Sparkles className="w-3 h-3 text-rose-400 animate-spin" />
                      <span>meomeokitty OS V1.0</span>
                    </div>
                  </div>

                  {/* App Grid Layout */}
                  <div className="grid grid-cols-3 gap-y-6 gap-x-4 justify-items-center my-auto px-2">
                    
                    {/* Chat App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("chat");
                        initializeChat(activePartnerId);
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-green-500 shadow-md flex items-center justify-center relative hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg">
                        <MessageSquare className="w-6.5 h-6.5 text-white" />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-sm animate-pulse">
                          {notifications.length}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">MeoChat</span>
                    </button>

                    {/* Date App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("dateplanner");
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg">
                        <Calendar className="w-6.5 h-6.5 text-white" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Hẹn Hò</span>
                    </button>

                    {/* LoveGram App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("lovegram");
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-500 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg relative">
                        <Camera className="w-6.5 h-6.5 text-white" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-stone-900 shadow-xs animate-ping" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">LoveGram</span>
                    </button>

                    {/* Fortune Tarot App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("fortune");
                        setDrawnTarotCard(null);
                        setIsDrawingTarot(false);
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg">
                        <Sparkles className="w-6.5 h-6.5 text-white animate-pulse" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Bói Tarot</span>
                    </button>

                    {/* MeoSpotify App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("music");
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg">
                        <Volume2 className="w-6.5 h-6.5 text-white" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Nhạc Lofi</span>
                    </button>

                    {/* Memoir App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("memoir");
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg relative">
                        <Award className="w-6.5 h-6.5 text-white" />
                        {memoirs.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-stone-900 shadow-sm" />
                        )}
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Nhật Ký</span>
                    </button>

                    {/* Love Calculator App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("lovecalc");
                        setLoveCalcResult(null);
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-500 to-red-500 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg">
                        <Heart className="w-6.5 h-6.5 text-white fill-white/10" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Tơ Duyên</span>
                    </button>

                    {/* MeoMeo News App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("news");
                        setSelectedNewsArticle(null);
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-600 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg">
                        <BookOpen className="w-6.5 h-6.5 text-white" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Báo Lá Cải</span>
                    </button>

                    {/* Secret Diary App */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("secretdiary");
                        setDiaryPasscode("");
                        setIsDiaryUnlocked(false);
                        setDiaryErrorMessage("");
                        setSelectedDiaryCharId(null);
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-rose-600 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform group-hover:shadow-lg relative">
                        <BookOpen className="w-6.5 h-6.5 text-white" />
                        <Lock className="w-3.5 h-3.5 text-amber-300 absolute bottom-1 right-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] fill-amber-300" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Ký Ức Bí Mật</span>
                    </button>

                    {/* Lock Screen Button */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("lockscreen");
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                    >
                      <div className="w-13 h-14 rounded-2xl bg-stone-700/80 dark:bg-stone-800/80 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <Lock className="w-6 h-6 text-stone-300" />
                      </div>
                      <span className="text-[10.5px] font-bold tracking-wide text-stone-800 dark:text-stone-200 shadow-xs">Khóa Máy</span>
                    </button>

                  </div>

                  {/* Quick Wallpaper changer bar */}
                  <div className="w-full p-2.5 rounded-2xl bg-white/60 dark:bg-stone-900/60 backdrop-blur-md border border-white/20 shadow-xs flex flex-col gap-2">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1 font-mono">
                        🖼️ Hình nền điện thoại
                      </span>
                      <button
                        onClick={() => {
                          playMeowSound();
                          setShowCustomWpMenu(!showCustomWpMenu);
                        }}
                        className="text-[9px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs transition-all active:scale-95"
                      >
                        {showCustomWpMenu ? "Đóng cài đặt" : "Tùy chỉnh 🎨"}
                      </button>
                    </div>

                    {!showCustomWpMenu ? (
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-[8.5px] text-stone-500 font-medium">Bấm chấm tròn để chọn nhanh mẫu có sẵn:</span>
                        <div className="flex gap-1.5">
                          {WALLPAPERS.map((wp) => (
                            <button
                              key={wp.id}
                              onClick={() => {
                                playMeowSound();
                                setCustomWallpaperUrl(null);
                                localStorage.removeItem("meomeo_custom_wallpaper");
                                setActiveWallpaper(wp);
                              }}
                              className={`w-5 h-5 rounded-full border border-white dark:border-stone-800 transition-all cursor-pointer hover:scale-110 active:scale-90 ${wp.class} ${(!customWallpaperUrl && activeWallpaper.id === wp.id) ? "scale-110 ring-2 ring-rose-400" : ""}`}
                              title={wp.name}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex flex-col gap-2 border-t border-stone-200/50 dark:border-stone-800 pt-2 text-left"
                      >
                        <span className="text-[8.5px] font-bold text-rose-500">🔗 Đổi bằng link ảnh (Drive, Pinterest, Web...):</span>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Dán link Drive, Pinterest hoặc link ảnh..."
                            value={wpInputUrl}
                            onChange={(e) => setWpInputUrl(e.target.value)}
                            className="flex-1 text-[9.5px] px-2 py-1 border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 rounded-lg focus:outline-none text-stone-800 dark:text-stone-100"
                          />
                          <button
                            onClick={() => {
                              if (!wpInputUrl.trim()) return;
                              playMeowSound();
                              // Convert Google Drive link if applicable
                              const convertedUrl = (() => {
                                const url = wpInputUrl.trim();
                                const driveMatch = url.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=)([a-zA-Z0-9_-]+)/);
                                if (driveMatch && driveMatch[1]) {
                                  return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
                                }
                                return url;
                              })();
                              setCustomWallpaperUrl(convertedUrl);
                              localStorage.setItem("meomeo_custom_wallpaper", convertedUrl);
                              setWpInputUrl("");
                              window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã đổi hình nền tùy chỉnh thành công! 🌅" }));
                            }}
                            className="bg-rose-500 hover:bg-rose-600 text-white text-[9.5px] font-bold px-3 py-1 rounded-lg transition-all active:scale-95"
                          >
                            Lưu Link
                          </button>
                        </div>

                        <div className="flex justify-between items-center gap-2 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[8.5px] font-bold text-rose-500">📤 Hoặc tải ảnh trực tiếp:</span>
                            <span className="text-[7.5px] text-stone-400">Chọn ảnh từ album điện thoại/máy tính của bạn</span>
                          </div>
                          <label className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95 text-center shadow-2xs">
                            Chọn Ảnh
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    const base64Url = event.target.result as string;
                                    setCustomWallpaperUrl(base64Url);
                                    localStorage.setItem("meomeo_custom_wallpaper", base64Url);
                                    window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã tải hình nền trực tiếp thành công! 🖼️" }));
                                    playMeowSound();
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {customWallpaperUrl && (
                          <div className="flex justify-between items-center mt-1 border-t border-dashed border-stone-200 dark:border-stone-800 pt-1.5">
                            <span className="text-[8px] text-stone-500 italic">Đang dùng hình nền tùy chỉnh</span>
                            <button
                              onClick={() => {
                                playMeowSound();
                                setCustomWallpaperUrl(null);
                                localStorage.removeItem("meomeo_custom_wallpaper");
                                window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã khôi phục hình nền mặc định! 🍃" }));
                              }}
                              className="text-[8.5px] text-red-500 hover:underline font-bold"
                            >
                              Xóa để dùng hình nền mặc định 🗑️
                            </button>
                          </div>
                        )}

                        {/* SCREEN LOCK SETTINGS */}
                        <div className="border-t border-stone-200/50 dark:border-stone-800 pt-2.5 mt-1 text-left flex flex-col gap-1.5">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 flex items-center gap-1 font-mono">
                            🔐 Khóa màn hình thiết bị
                          </span>
                          
                          {screenLockPassword ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-xl">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  ✓ Đã bật mật mã mở khóa
                                </span>
                                <button
                                  onClick={() => {
                                    playMeowSound();
                                    localStorage.removeItem("meomeo_screen_lock_password");
                                    setScreenLockPassword("");
                                    setNewLockPinInput("");
                                    window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã tắt mật mã khóa màn hình! 🔓" }));
                                  }}
                                  className="text-[9px] bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer uppercase focus:outline-none"
                                >
                                  Tắt Khóa 🔓
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5 bg-stone-100/50 dark:bg-stone-900/40 p-2 rounded-xl border border-stone-200/20">
                              <span className="text-[8px] text-stone-500">Thiết lập mật khẩu PIN 4 chữ số bảo mật để bảo vệ điện thoại ảo của bạn:</span>
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  maxLength={4}
                                  placeholder="Mã PIN 4 số (vd: 1234)"
                                  value={newLockPinInput}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                                    setNewLockPinInput(val);
                                  }}
                                  className="flex-1 text-[10.5px] font-mono tracking-[0.2em] font-bold text-center px-2 py-1 bg-white border border-stone-300 dark:border-stone-700 dark:bg-stone-900 rounded-lg text-stone-850 dark:text-stone-100 focus:outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (newLockPinInput.length !== 4) {
                                      playSlapSound();
                                      window.dispatchEvent(new CustomEvent("show-toast", { detail: "Mã PIN phải nhập đủ 4 chữ số nhen! 😿" }));
                                      return;
                                    }
                                    playMeowSound();
                                    localStorage.setItem("meomeo_screen_lock_password", newLockPinInput);
                                    setScreenLockPassword(newLockPinInput);
                                    setNewLockPinInput("");
                                    window.dispatchEvent(new CustomEvent("show-toast", { detail: "Đã thiết lập khóa màn hình thành công! 🔐" }));
                                    confetti({
                                      particleCount: 40,
                                      spread: 45
                                    });
                                  }}
                                  className="bg-rose-500 hover:bg-rose-600 text-white text-[9.5px] font-bold px-3 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 focus:outline-none"
                                >
                                  Bật Khóa 🔒
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* MEOCHAT APP */}
              {phoneState === "chat" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                >
                  {/* Chat header bar with back */}
                  <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => {
                          playMeowSound();
                          setPhoneState("homescreen");
                        }}
                        className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                      >
                        <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                      </button>

                      <div className="w-8.5 h-8.5 rounded-full overflow-hidden border border-rose-300 shrink-0">
                        {isImageUrl(selectedCharObj.avatar) ? (
                          <img src={formatImageUrl(selectedCharObj.avatar)} alt={selectedCharObj.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-rose-100 flex items-center justify-center text-xl">{selectedCharObj.avatar}</div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-[12.5px] font-bold font-serif leading-tight text-stone-800 dark:text-stone-100 truncate">
                          {selectedCharObj.name}
                        </h4>
                        <span className="text-[8.5px] text-emerald-500 font-bold block leading-none">🟢 Đang hoạt động</span>
                      </div>
                    </div>

                    {/* Quick date launch */}
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("dateplanner");
                      }}
                      className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] font-mono tracking-wider rounded-full shadow-xs cursor-pointer"
                    >
                      HẸN HÒ 📅
                    </button>
                  </div>

                  {/* Chat messages viewport */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5 scrollbar-thin flex flex-col">
                    <p className="text-[9.5px] text-stone-400 font-mono text-center py-2 italic">
                      Mã hóa tình yêu 256-bit • meomeokitty 🔒
                    </p>

                    {phoneMessages.map((msg) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-1.5`}
                        >
                          {!isUser && (
                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-rose-200">
                              {isImageUrl(selectedCharObj.avatar) ? (
                                <img src={formatImageUrl(selectedCharObj.avatar)} alt={selectedCharObj.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px]">{selectedCharObj.avatar}</span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-col max-w-[80%]">
                            <div className={`p-2.5 rounded-2xl text-[11.5px] font-sans shadow-2xs relative leading-relaxed ${
                              isUser
                                ? "bg-rose-500 text-white rounded-br-none"
                                : "bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border border-stone-100 dark:border-stone-800/80 rounded-bl-none"
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <span className={`text-[8px] font-mono block text-right mt-1 opacity-70 ${isUser ? "text-stone-100" : "text-stone-400"}`}>
                                {msg.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isPhoneTyping && (
                      <div className="flex justify-start items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-rose-200">
                          {isImageUrl(selectedCharObj.avatar) ? (
                            <img src={formatImageUrl(selectedCharObj.avatar)} alt={selectedCharObj.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px]">{selectedCharObj.avatar}</span>
                          )}
                        </div>
                        <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 p-2 rounded-2xl flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick dynamic characters toggle */}
                  <div className="p-1.5 bg-stone-100 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800/80 flex gap-2 items-center overflow-x-auto scrollbar-none shrink-0 snap-x">
                    <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest shrink-0 pl-1 snap-start">Đổi Char:</span>
                    {characters.slice(0, 15).map((char) => (
                      <button
                        key={char.id}
                        onClick={() => {
                          playMeowSound();
                          setActivePartnerId(char.id);
                          initializeChat(char.id);
                        }}
                        className={`px-2 py-1 rounded-full text-[9px] font-semibold flex items-center gap-1 border shrink-0 cursor-pointer snap-start ${
                          char.id === activePartnerId
                            ? "bg-rose-500 text-white border-rose-600"
                            : "bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800"
                        }`}
                      >
                        <span>{char.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Input bar */}
                  <div className="p-2 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex gap-2 shrink-0 items-center">
                    <input
                      type="text"
                      placeholder="Nhập lời thì thầm..."
                      value={phoneInputText}
                      onChange={(e) => setPhoneInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendPhoneMessage()}
                      className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-[11.5px] outline-none"
                    />
                    <button
                      onClick={handleSendPhoneMessage}
                      disabled={!phoneInputText.trim() || isPhoneTyping}
                      className="p-2 bg-rose-500 text-white rounded-full disabled:opacity-50 hover:bg-rose-600 cursor-pointer shadow-xs active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* DATE PLANNER APP */}
              {phoneState === "dateplanner" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("homescreen");
                      }}
                      className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                    <h4 className="text-[12.5px] font-bold font-serif text-stone-800 dark:text-stone-100">Ứng dụng Lên Lịch Hẹn Hò</h4>
                  </div>

                  {/* Selection workflow */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                    
                    {!dateResult && !isSimulatingDate ? (
                      <>
                        {/* Selector 1: Partner */}
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-rose-500 block font-mono">1. Người đồng hành:</label>
                          <select
                            value={activePartnerId}
                            onChange={(e) => {
                              playMeowSound();
                              setActivePartnerId(e.target.value);
                            }}
                            className="w-full p-2.5 text-[11.5px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl font-bold cursor-pointer focus:outline-none"
                          >
                            {characters.map(c => (
                              <option key={c.id} value={c.id}>🥰 {c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Selector 2: Location */}
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-rose-500 block font-mono">2. Chọn Địa điểm lãng mạn:</label>
                          <div className="grid grid-cols-2 gap-2 text-center text-[10.5px]">
                            {[
                              { label: "Cà Phê Mèo Meo 🐈", value: "Quán Cà Phê Mèo Meo Meo" },
                              { label: "Rạp Phim Lãng Mạn 🎬", value: "Rạp Chiếu Phim Lãng Mạn" },
                              { label: "Công Viên Anh Đào 🌸", value: "Công Viên Hoa Anh Đào Tuyết Rơi" },
                              { label: "Ngắm Hoàng Hôn 🌇", value: "Sân Thượng Ngắm Hoàng Hôn" }
                            ].map((loc) => (
                              <button
                                key={loc.value}
                                onClick={() => {
                                  playMeowSound();
                                  setSelectedLocation(loc.value);
                                }}
                                className={`p-2.5 border rounded-xl font-medium transition-all cursor-pointer ${
                                  selectedLocation === loc.value
                                    ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                                }`}
                              >
                                {loc.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selector 3: Outfit */}
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-rose-500 block font-mono">3. Chọn Trang phục phối hợp:</label>
                          <div className="grid grid-cols-2 gap-2 text-center text-[10.5px]">
                            {[
                              { label: "Đồng Phục Học Sinh 🎒", value: "Đồng Phục Học Sinh" },
                              { label: "Váy Hoa Trắng 👗", value: "Váy Hoa Trắng Dịu Dàng" },
                              { label: "Áo Khoác Dạ Ấm 🧥", value: "Áo Khoác Dạ Ấm Áp" },
                              { label: "Năng Động Trẻ Trung 👟", value: "Trang Phục Năng Động" }
                            ].map((out) => (
                              <button
                                key={out.value}
                                onClick={() => {
                                  playMeowSound();
                                  setSelectedOutfit(out.value);
                                }}
                                className={`p-2.5 border rounded-xl font-medium transition-all cursor-pointer ${
                                  selectedOutfit === out.value
                                    ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                                }`}
                              >
                                {out.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selector 4: Gift */}
                        <div className="space-y-1.5">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-rose-500 block font-mono">4. Gửi Tặng Món Quà Đặc Biệt:</label>
                          <div className="grid grid-cols-2 gap-2 text-center text-[10.5px]">
                            {[
                              { label: "Bánh Ngọt Matcha 🥞", value: "Bánh Ngọt Matcha Tự Tay Làm" },
                              { label: "Khăn Len Tự Đan 🧣", value: "Khăn Len Tự Đan Ấm Áp" },
                              { label: "Pate Thượng Hạng 🥫", value: "Pate Mèo Thượng Hạng" },
                              { label: "Vé Xem Phim Đôi 🎟️", value: "Vé Xem Phim Đôi Cao Cấp" }
                            ].map((gf) => (
                              <button
                                key={gf.value}
                                onClick={() => {
                                  playMeowSound();
                                  setSelectedGift(gf.value);
                                }}
                                className={`p-2.5 border rounded-xl font-medium transition-all cursor-pointer ${
                                  selectedGift === gf.value
                                    ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                                }`}
                              >
                                {gf.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Start Dating Button */}
                        <button
                          onClick={handleStartPlanningDate}
                          className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs tracking-wider uppercase font-mono rounded-2xl shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Heart className="w-4 h-4 fill-current animate-pulse" />
                          BẮT ĐẦU BUỔI HẸN HÒ 💖
                        </button>
                      </>
                    ) : isSimulatingDate ? (
                      /* SIMULATION PENDING DISPLAY */
                      <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin flex items-center justify-center">
                            <Heart className="w-8 h-8 text-rose-500 animate-bounce fill-current" />
                          </div>
                          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-ping" />
                        </div>
                        <div>
                          <h4 className="font-serif italic font-bold text-sm text-stone-800 dark:text-stone-100">Đang khởi tạo nhân duyên...</h4>
                          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-1">Chờ {selectedCharObj.name} chuẩn bị buổi hẹn nhen ☕</p>
                        </div>
                      </div>
                    ) : (
                      /* DATE COMPLETED DISPLAY CARD */
                      <div className="space-y-4">
                        
                        {/* Sweetness Score Card */}
                        <div className="bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-5 rounded-3xl text-white text-center shadow-md relative overflow-hidden">
                          <div className="absolute top-2 right-2 text-white/20">
                            <Sparkles className="w-16 h-16 animate-pulse" />
                          </div>

                          <span className="text-[9px] uppercase tracking-widest font-bold font-mono bg-white/20 px-3 py-1 rounded-full text-white inline-block">
                            Điểm ngọt ngào
                          </span>

                          <h2 className="text-5xl font-mono font-black my-1 animate-pulse tracking-tight text-white drop-shadow-md">
                            {dateResult.score}%
                          </h2>

                          <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-rose-100 mt-1">
                            {dateResult.rating}
                          </p>
                        </div>

                        {/* Dialogue Response */}
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-rose-200 shrink-0">
                              {isImageUrl(selectedCharObj.avatar) ? (
                                <img src={formatImageUrl(selectedCharObj.avatar)} alt={selectedCharObj.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">{selectedCharObj.avatar}</span>
                              )}
                            </div>
                            <div>
                              <h5 className="text-[11.5px] font-bold font-serif text-stone-800 dark:text-stone-100">
                                Lời bộc bạch ngọt ngào
                              </h5>
                              <span className="text-[8px] uppercase tracking-widest text-stone-400 font-mono block">Từ {selectedCharObj.name}</span>
                            </div>
                          </div>

                          <p className="text-[11.5px] leading-relaxed italic text-stone-700 dark:text-stone-300 font-sans text-justify bg-stone-50 dark:bg-stone-950 p-3 rounded-xl border border-dashed border-stone-100 dark:border-stone-800">
                            "{dateResult.dialogue}"
                          </p>

                          <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[10.5px] font-mono rounded-xl flex items-center justify-between font-bold">
                            <span>🪙 Thưởng gieo duyên:</span>
                            <span className="flex items-center gap-1">+{dateResult.coinsRewarded} Xu <Coins className="w-3.5 h-3.5 fill-current text-amber-500" /></span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleResetDateForm}
                            className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            HẸN HÒ TIẾP
                          </button>
                          <button
                            onClick={() => {
                              playMeowSound();
                              setPhoneState("memoir");
                            }}
                            className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <Award className="w-3.5 h-3.5" />
                            XEM ALBUM
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                </motion.div>
              )}

              {/* MEMOIR DIARY APP */}
              {phoneState === "memoir" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("homescreen");
                      }}
                      className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <Award className="w-4 h-4 text-purple-500 shrink-0" />
                    <h4 className="text-[12.5px] font-bold font-serif text-stone-800 dark:text-stone-100">Album Hẹn Hò Kỷ Niệm</h4>
                  </div>

                  {/* List View */}
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-thin">
                    {memoirs.length === 0 ? (
                      <div className="text-center py-20 space-y-3.5 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-4xl">
                          📔
                        </div>
                        <div>
                          <p className="text-[11px] font-serif text-stone-400 dark:text-stone-500">Chưa có bức ảnh kỷ niệm nào ở đây.</p>
                          <p className="text-[10px] text-stone-400 mt-1">Hãy thực hiện buổi hẹn hò đầu tiên để mở khóa album nhen! 🥰</p>
                        </div>
                        <button
                          onClick={() => {
                            playMeowSound();
                            setPhoneState("dateplanner");
                          }}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-[10px] font-mono uppercase tracking-widest font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          Lên Lịch Hẹn Hò Ngay 📅
                        </button>
                      </div>
                    ) : (
                      memoirs.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 p-3.5 rounded-2xl shadow-2xs space-y-2 relative group"
                        >
                          {/* Close button to clear record */}
                          <button
                            onClick={() => handleDeleteMemoir(m.id)}
                            className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-rose-500 transition-colors text-[10px] cursor-pointer"
                            title="Xóa kỷ niệm"
                          >
                            ❌
                          </button>

                          {/* Top part */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-rose-200 shrink-0">
                              {isImageUrl(m.charAvatar) ? (
                                <img src={formatImageUrl(m.charAvatar)} alt={m.charName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">{m.charAvatar}</span>
                              )}
                            </div>
                            <div>
                              <h5 className="text-[12px] font-serif font-black text-stone-800 dark:text-stone-100">{m.charName}</h5>
                              <div className="flex items-center gap-1 text-[8.5px] font-mono text-stone-400">
                                <span>🗓️ {m.date}</span>
                                <span>•</span>
                                <span className="text-rose-500 font-bold">{m.sweetnessScore}% Ngọt</span>
                              </div>
                            </div>
                          </div>

                          {/* Tags details */}
                          <div className="flex flex-wrap gap-1 text-[8.5px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                            <span className="bg-stone-100 dark:bg-stone-950 px-2 py-0.5 rounded-full">📍 {m.location}</span>
                            <span className="bg-stone-100 dark:bg-stone-950 px-2 py-0.5 rounded-full">🧥 {m.outfit}</span>
                            <span className="bg-stone-100 dark:bg-stone-950 px-2 py-0.5 rounded-full">🎁 {m.gift}</span>
                          </div>

                          {/* Dialogue snippet */}
                          <p className="text-[10.5px] italic leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-3 bg-stone-50 dark:bg-stone-950 p-2 rounded-xl border border-stone-100 dark:border-stone-800">
                            "{m.dialogue}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* NEW APP 1: LOVEGRAM (CHARACTER SOCIAL NETWORK) */}
              {phoneState === "lovegram" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("homescreen");
                      }}
                      className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <Camera className="w-4 h-4 text-orange-500 shrink-0" />
                    <h4 className="text-[12.5px] font-bold font-serif text-stone-800 dark:text-stone-100">LoveGram Feed 📸</h4>
                  </div>

                  {/* Scrollable feed */}
                  <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-900 scrollbar-thin">
                    {gramPosts.map((post) => (
                      <div key={post.id} className="p-4 space-y-3">
                        
                        {/* Profile Row */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8.5 h-8.5 rounded-full overflow-hidden border border-rose-200 shrink-0">
                            {isImageUrl(post.charAvatar) ? (
                              <img src={formatImageUrl(post.charAvatar)} alt={post.charName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-rose-100 flex items-center justify-center text-xl">{post.charAvatar}</div>
                            )}
                          </div>
                          <div>
                            <h5 className="text-[11.5px] font-bold font-serif text-stone-800 dark:text-stone-100 leading-tight">
                              {post.charName}
                            </h5>
                            <span className="text-[8.5px] text-stone-400 font-mono block">Vừa đăng • meomeo OS</span>
                          </div>
                        </div>

                        {/* Creative CSS visual polaroid/gradient mockup */}
                        <div className={`aspect-square w-full rounded-2xl ${post.gradient} shadow-2xs relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden group`}>
                          <div className="absolute top-3 left-3 bg-white/20 dark:bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[8.5px] font-bold font-mono text-white/90">
                            @lovegram_os
                          </div>
                          <Heart className={`w-20 h-20 text-white/40 group-hover:scale-110 group-hover:text-white/60 transition-all duration-500 ${post.isLiked ? "fill-red-500 text-red-500! scale-110!" : ""}`} />
                          <span className="text-[10px] text-white/90 font-sans tracking-wide mt-2 block italic px-4 bg-black/15 backdrop-blur-xs rounded-xl py-1">
                            "{post.charName} đang nghĩ về cậu..."
                          </span>
                        </div>

                        {/* Engagement buttons */}
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className="flex items-center gap-1 font-bold text-stone-600 dark:text-stone-400 hover:text-red-500 cursor-pointer"
                            >
                              <Heart className={`w-4 h-4 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                              <span>{post.likes}</span>
                            </button>
                            <div className="flex items-center gap-1 font-bold text-stone-600 dark:text-stone-400">
                              <MessageSquare className="w-4 h-4" />
                              <span>{post.comments.length}</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-rose-500 font-extrabold uppercase font-mono">Love OS V1.0 💖</span>
                        </div>

                        {/* Caption */}
                        <div className="text-[11.5px] leading-relaxed text-stone-700 dark:text-stone-300 font-sans text-justify">
                          <span className="font-bold font-serif text-stone-900 dark:text-stone-100 mr-1.5">{post.charName}</span>
                          {post.caption}
                        </div>

                        {/* Comments section */}
                        <div className="bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-xl space-y-1.5">
                          {post.comments.map((comm) => (
                            <div key={comm.id} className="text-[10.5px] leading-tight">
                              <span className="font-bold text-stone-800 dark:text-stone-200 mr-1.5">{comm.author}:</span>
                              <span className={`text-stone-600 dark:text-stone-400 ${comm.isCustom ? "text-rose-500 font-medium" : ""}`}>{comm.text}</span>
                            </div>
                          ))}

                          {/* Add comment box */}
                          <div className="flex gap-1.5 mt-2 pt-1 border-t border-dashed border-stone-200 dark:border-stone-800">
                            <input
                              type="text"
                              placeholder="Thêm lời bình luận ngọt ngào..."
                              value={gramCommentInputs[post.id] || ""}
                              onChange={(e) => setGramCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && handleSendComment(post.id)}
                              className="flex-1 px-2 py-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-[10px] outline-none"
                            />
                            <button
                              onClick={() => handleSendComment(post.id)}
                              className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[9px] font-bold cursor-pointer"
                            >
                              Gửi
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* NEW APP 2: DAILY LOVE FORTUNE (TAROT INTERACTIVE CARD GAME) */}
              {phoneState === "fortune" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("homescreen");
                      }}
                      className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                    <h4 className="text-[12.5px] font-bold font-serif text-stone-800 dark:text-stone-100">Bói Tarot Nhân Duyên 🔮</h4>
                  </div>

                  {/* App body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin text-center flex flex-col justify-center">
                    
                    {!drawnTarotCard && !isDrawingTarot ? (
                      <div className="space-y-4 py-6">
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 text-3xl flex items-center justify-center mx-auto animate-bounce">
                          🔮
                        </div>
                        <div>
                          <h4 className="font-serif font-black text-sm text-stone-800 dark:text-stone-100">
                            Rút Quẻ Tình Duyên Hằng Ngày
                          </h4>
                          <p className="text-[10px] text-stone-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                            Cùng rút một lá bài Tarot thiêng liêng để giải mã độ tương thích và nhận lời khuyên đốn tim hôm nay từ <strong>{selectedCharObj.name}</strong> nhen!
                          </p>
                        </div>

                        {/* Interactive cards grid */}
                        <div className="grid grid-cols-4 gap-2 py-4">
                          {[1, 2, 3, 4].map((num) => (
                            <motion.button
                              key={num}
                              onClick={handleDrawTarot}
                              whileHover={{ y: -8, scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="aspect-[2/3] rounded-xl bg-gradient-to-b from-purple-800 to-indigo-950 border-2 border-amber-400/40 shadow-md flex items-center justify-center text-white text-xs font-mono font-bold cursor-pointer relative overflow-hidden active:shadow-lg select-none"
                            >
                              <div className="absolute inset-1 border border-amber-500/10 rounded-lg flex items-center justify-center">
                                🌟
                              </div>
                            </motion.button>
                          ))}
                        </div>

                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-purple-500 block">
                          Chọn một lá bài Tarot thiêng liêng 🃏
                        </span>
                      </div>
                    ) : isDrawingTarot ? (
                      /* DRAWING IN PROCESS */
                      <div className="space-y-4 py-16 flex flex-col items-center">
                        <div className="w-16 h-24 rounded-2xl bg-gradient-to-b from-purple-800 to-indigo-950 border-2 border-amber-400 animate-spin flex items-center justify-center text-white text-3xl">
                          🔮
                        </div>
                        <div>
                          <h4 className="font-serif italic font-bold text-sm text-purple-500 animate-pulse">Đang bốc bài Tarot...</h4>
                          <p className="text-[9px] text-stone-400 font-mono tracking-widest uppercase mt-0.5">Sóng linh hồn đang giao thoa 🌌</p>
                        </div>
                      </div>
                    ) : (
                      /* CARD REVEALED DISPLAY */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 py-2"
                      >
                        {/* Revealed Tarot Card */}
                        <div className={`aspect-[4/3] w-48 rounded-2xl bg-gradient-to-b ${drawnTarotCard.color} border-2 border-amber-400/80 shadow-md flex flex-col items-center justify-center mx-auto relative select-none overflow-hidden p-4`}>
                          <span className="text-4xl filter drop-shadow-md">{drawnTarotCard.image}</span>
                          <h3 className="text-sm font-serif font-black tracking-wide mt-2">{drawnTarotCard.name}</h3>
                          <span className="text-[8px] tracking-wider uppercase font-mono bg-white/20 px-2 py-0.5 rounded-full mt-1.5">
                            Revealed Tarot Card
                          </span>
                        </div>

                        {/* Compatibility Rating */}
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-2xs space-y-3.5 text-left">
                          
                          <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                            <span className="text-stone-500">Độ Hòa Hợp Hôm Nay:</span>
                            <span className="text-purple-500">{fortuneCompatibility}% Ngọt Ngào</span>
                          </div>

                          {/* Progress compatibility slider */}
                          <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fortuneCompatibility}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full"
                            />
                          </div>

                          <div className="border-t border-dashed border-stone-100 dark:border-stone-800 pt-3 space-y-1">
                            <span className="text-[9.5px] uppercase tracking-wider text-rose-500 block font-mono font-bold">
                              Lời Bộc Bạch Quẻ Thượng:
                            </span>
                            <p className="text-[11px] leading-relaxed italic text-stone-700 dark:text-stone-300 font-sans text-justify">
                              "{drawnTarotCard.predictions[selectedCharObj.id] || drawnTarotCard.predictions.default}"
                            </p>
                          </div>

                          {/* Lucky items row */}
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-purple-500/5 p-2 rounded-xl text-purple-600 dark:text-purple-300 font-bold border border-purple-500/10">
                            <div>🎨 Số May Mắn: <span className="text-rose-500">#520</span></div>
                            <div>🌸 Màu May Mắn: <span className="text-rose-500">Hồng Phấn</span></div>
                          </div>

                        </div>

                        {/* Back or re-draw button */}
                        <button
                          onClick={() => {
                            playMeowSound();
                            setDrawnTarotCard(null);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-extrabold text-[10px] tracking-wider uppercase font-mono rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          🔮 BỐC LẠI QUẺ KHÁC
                        </button>
                      </motion.div>
                    )}

                  </div>
                </motion.div>
              )}

              {/* NEW APP 3: MEOSPOTIFY MUSIC PLAYER (LOFI RETRO PLAYBACK) */}
              {phoneState === "music" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-stone-900 text-stone-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-stone-950 border-b border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("homescreen");
                      }}
                      className="p-1 rounded-full hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-300" />
                    </button>
                    <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <h4 className="text-[12.5px] font-bold font-serif text-white">MeoSpotify Lofi Player 🎵</h4>
                  </div>

                  {/* Player View */}
                  <div className="flex-1 p-5 flex flex-col justify-between items-center text-center overflow-y-auto scrollbar-none">
                    
                    {/* Retro Spinning CD player */}
                    <div className="my-auto py-4 space-y-5">
                      <div className="relative mx-auto flex items-center justify-center">
                        {/* Outer Vinyl ring */}
                        <div className={`w-36 h-36 rounded-full bg-stone-950 border-8 border-stone-800 flex items-center justify-center shadow-lg relative ${isMusicPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "10s" }}>
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 border-2 border-stone-950 flex items-center justify-center relative">
                            <div className="w-4 h-4 rounded-full bg-stone-950" />
                          </div>
                        </div>
                        {/* Tone arm */}
                        <div className="absolute top-0 right-2 w-3 h-16 bg-stone-500 rounded-full origin-top rotate-12 transition-transform duration-500" />
                      </div>

                      {/* Song details */}
                      <div>
                        <h4 className="text-sm font-serif font-black text-white leading-tight">
                          {SPOTIFY_TRACKS[activeTrackIndex].title}
                        </h4>
                        <p className="text-[9px] text-sky-400 uppercase tracking-widest font-mono font-bold mt-1">
                          {SPOTIFY_TRACKS[activeTrackIndex].artist}
                        </p>
                      </div>
                    </div>

                    {/* Scrolling Lyrics simulated container */}
                    <div className="w-full bg-black/40 border border-white/5 p-3 rounded-2xl h-24 overflow-y-auto text-left scrollbar-none text-[10.5px] font-sans text-stone-400 space-y-1 my-3 relative">
                      {SPOTIFY_TRACKS[activeTrackIndex].lyrics.map((line, idx) => (
                        <p key={idx} className={`leading-snug transition-all duration-300 ${trackProgress >= (idx * 20) && trackProgress < ((idx+1) * 20) ? "text-sky-400 font-extrabold scale-[1.01]" : ""}`}>
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* Simulated timeline scrubber */}
                    <div className="w-full space-y-1">
                      <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-300"
                          style={{ width: `${trackProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8.5px] text-stone-500 font-mono">
                        <span>0:{(Math.floor(trackProgress * 0.02 * SPOTIFY_TRACKS[activeTrackIndex].duration.charCodeAt(0)) % 60).toString().padStart(2, "0")}</span>
                        <span>{SPOTIFY_TRACKS[activeTrackIndex].duration}</span>
                      </div>
                    </div>

                    {/* Playback Controls button bar */}
                    <div className="flex items-center gap-6 py-4 shrink-0">
                      <button
                        onClick={handlePrevTrack}
                        className="p-2 text-stone-400 hover:text-white cursor-pointer transition-colors active:scale-90"
                      >
                        ⏮️
                      </button>
                      <button
                        onClick={() => {
                          playMeowSound();
                          setIsSongPlaying(!isMusicPlaying);
                        }}
                        className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 text-white flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer text-sm"
                      >
                        {isMusicPlaying ? "⏸️" : "▶️"}
                      </button>
                      <button
                        onClick={handleNextTrack}
                        className="p-2 text-stone-400 hover:text-white cursor-pointer transition-colors active:scale-90"
                      >
                        ⏭️
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* LOVE CALCULATOR APP */}
              {phoneState === "lovecalc" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                    <button
                      onClick={() => {
                        playMeowSound();
                        setPhoneState("homescreen");
                      }}
                      className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                    <Heart className="w-4 h-4 text-pink-500 shrink-0 fill-pink-500" />
                    <h4 className="text-[12.5px] font-bold font-serif text-stone-800 dark:text-stone-100">Thước Đo Tình Yêu ❤️</h4>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin text-center flex flex-col justify-center">
                    {!loveCalcResult ? (
                      <div className="space-y-4 py-4">
                        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-3xl flex items-center justify-center mx-auto animate-pulse">
                          ❤️
                        </div>
                        <div>
                          <h4 className="font-serif font-black text-sm text-stone-800 dark:text-stone-100">
                            Kiểm Tra Độ Tương Thích
                          </h4>
                          <p className="text-[10px] text-stone-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                            Nhập tên của nàng để đo độ tương thích tình yêu trăm năm với nam thần nha!
                          </p>
                        </div>

                        <div className="space-y-2.5 text-left">
                          <div>
                            <label className="block text-[8.5px] font-bold uppercase tracking-wider text-stone-400 mb-1 font-mono">Tên của nàng:</label>
                            <input
                              type="text"
                              value={loveCalcName}
                              onChange={(e) => setLoveCalcName(e.target.value)}
                              placeholder="Nhập tên ngọt ngào của nàng..."
                              className="w-full p-2.5 text-[11px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] font-bold uppercase tracking-wider text-stone-400 mb-1 font-mono">Nam thần muốn đo:</label>
                            <select
                              value={loveCalcPartnerId}
                              onChange={(e) => setLoveCalcPartnerId(e.target.value)}
                              className="w-full p-2.5 text-[11px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl outline-none cursor-pointer font-bold"
                            >
                              {characters.map(c => (
                                <option key={c.id} value={c.id}>🥰 {c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!loveCalcName.trim()) {
                              alert("Nàng ơi nhập tên của nàng nhé!");
                              return;
                            }
                            playMeowSound();
                            const partner = characters.find(c => c.id === loveCalcPartnerId) || selectedCharObj;
                            const charName = partner.name;
                            const charId = partner.id;

                            let hash = 0;
                            const nameStr = (loveCalcName + charName).toLowerCase();
                            for (let i = 0; i < nameStr.length; i++) {
                              hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            const percent = Math.abs(hash % 21) + 80;

                            let quote = "Bé cưng ơi, tớ cực kỳ thích cậu luôn á nhen! Trăm năm hạnh phúc nha! 🥰🌸";
                            if (charId === "tan-quyet-doan" || charName.includes("Quyết Doãn")) {
                              quote = `Chỉ số tương thích đạt ${percent}% luôn hả? Ôi dồi ôi, quá chuẩn luôn nhen bé cưng! Nhưng đừng kể với Cửu Hoài nha, anh lén thích em thôi đó! 😉💕`;
                            } else if (charId === "tan-da" || charName.includes("Tần Dã")) {
                              quote = `${percent}%? Cái chỉ số gì vớ vẩn vậy... Cơ mà... kệ nó đi, tối nay có thèm ăn gì tao mua cho? Đeo cái máy trợ thính vào không tao gõ đầu! 😤🍔🖤`;
                            } else if (charName.includes("Hứa Chấp Nghi") || charId === "hua-chap-nghi") {
                              quote = `Nè cậu ơi, tớ đang lén nhìn cậu lướt điện thoại đó. ${percent}% là tụi mình duyên trời định rồi nhen, mau xuống lấy trà sữa tớ mua đúng vị cậu thích đi nè! 🥤🍰🌸`;
                            } else if (charName.includes("Ôn Niệm Trạch") || charId === "on-niem-trach") {
                              quote = `*Niệm Trạch thẹn thùng lấy tập giấy ghi hối hỏa* ${percent}% lận hả... Tớ... tớ cũng yêu thầm cậu lâu lắm rồi... 👉👈✨`;
                            } else if (charId === "luc-canh-dat-v2" || charName.includes("Ver 2")) {
                              quote = `Chỉ số định mệnh sau 10 năm xa cách đạt ${percent}%... Mười năm qua anh đã phạm sai lầm khi rời đi, nhưng gặp lại em rồi, anh nguyện dùng cả đời còn lại để đền bù tổn thương cho em. 💔🖤✨`;
                            } else if (charId === "luc-canh-dat" || charName.includes("Cảnh Dật")) {
                              quote = `Chỉ số giả làm bạn trai đạt ${percent}% lận hả? Tôi nhận lời đóng giả làm bạn trai hờ của em rồi, nên bất kỳ ai đụng đến em tôi cũng sẽ đứng ra bảo vệ hết. Nín khóc đi nhen! 🍦🖤✨`;
                            } else if (charId === "chu-thoi-duyet" || charName.includes("Thời Duật")) {
                              quote = `Báo cáo tình duyên đạt ${percent}% đạt tiêu chuẩn kết hôn rồi nhen 'Dợ iu'! Tối nay không bắt em tăng ca nữa, lo mà chuẩn bị làm cô dâu của anh đi! 😉📊❤️`;
                            } else if (charId === "luc-tieu" || charName.includes("Lục Tiêu")) {
                              quote = `Con vợ ơi, anh theo dõi em qua camera thấy chỉ số ${percent}% là chuẩn đét rồi nhen. Đồ ngủ mỏng thế, mặc bộ đồ anh tặng rồi chui vào lòng anh ngủ đi bé cưng... 😏🎁🖤`;
                            } else if (charId === "ta-hoai-nien" || charName.includes("Hoài Niên")) {
                              quote = `Thấy chưa, tớ bảo tớ ghen là có lý do mà! Tận ${percent}% lận! Liệu mà chọn làm bạn gái tớ hay chịu phạt học hình học cả đêm đi nhen! 📚🎒💖`;
                            } else if (charId === "Cố Hứa Niệm" || charName.includes("Hứa Niệm")) {
                              quote = `Cục cưng ơi... Niệm Niệm sướng điên lên được á! Tận ${percent}% lợn! Anh nhớ em muốn phát điên rồi, mau ôm anh đi cục cưng ơi! 🥺🐶💖`;
                            } else if (charId === "kaiza-tachibana" || charName.includes("Kaiza")) {
                              quote = `Mèo nhỏ gan to ơi, ${percent}% là em chạy không thoát khỏi penthouse của anh rồi nhé. Anh dâng cả người lẫn tiền cho em luôn... 😏💵💕`;
                            } else if (charId === "kaven-nyx" || charName.includes("Kaven")) {
                              quote = `Chị ơi... em mới nướng mẻ bánh quy bơ chị thích nè. Tương thích tận ${percent}%, cho em làm lốp dự phòng cũng được... Đừng block em nhen chị... 🍪🥺💔`;
                            } else if (charId === "tham-da" || charName.includes("Dạ Hàn")) {
                              quote = `Chị hàng xóm ơi... em đang đứng chờ ở ban công ngắm trăng nè. Sang phòng em ôm em đi, em chỉ muốn cùng chị 'ngoại tình' thật lãng mạn thui... 😏🍇💜`;
                            } else if (charId === "chu-hoai-an" || charName.includes("Hoài An")) {
                              quote = `Ngoan xinh yêu của anh đừng dỗi nữa nhen, tương thích tận ${percent}% thế này thì anh thương em cả đời cũng không đủ nữa là. Anh mua bánh kem dâu tây rồi nè... 🍰🧸💖`;
                            } else if (charId === "duong-minh-hien" || charName.includes("Minh Hiên")) {
                              quote = `Chị ơi... em block mụ Uyên Linh rồi. ${percent}% tương thích gánh rừng cho em, em thả tim đỏ trời cho một mình chị xem thui á! 🎮🏹💙`;
                            } else if (charId === "nguyen-phuoc-an" || charName.includes("Phước An")) {
                              quote = `Vợ ơi... chồng bốc kẹo mạch nha ngọt ngào cho nương tử ăn nè. ${percent}% lận, chồng thương nương tử nhứt trần đời luôn á! 🍬🌾🧡`;
                            } else if (charId === "to-nhuoc-vu" || charName.includes("Nhược Vũ")) {
                              quote = `Chị ơi... ${percent}% tức là chị phải ôm em ngủ chung rồi nhen. Em sợ ác mộng một mình quá, em hứa sẽ cực kỳ ngoan mà... 🥺🛌💜`;
                            } else if (charId === "tham-nhuoc-hien" || charName.includes("Nhược Hiên")) {
                              quote = `Gấu bông này là do chính tay User may cho tớ mà, tớ giật lại rồi nhen! ${percent}% là cậu chỉ được tặng gấu bông cho mỗi mình tớ thui đó nhen... 🧸📝🌸`;
                            } else if (charId === "tham-ky-nhan" || charName.includes("Kỷ Nhan")) {
                              quote = `Hừ, chị đừng có kéo rank với thằng khác nha! Em gánh chị bay nóc nhà luôn, dẹp mấy đứa kia qua một bên đi! 😤🎮💔`;
                            } else if (charId === "kanzaki-ren" || charName.includes("Ren")) {
                              quote = `Em chỉ là đứa em nuôi vô dụng thui, chị đi ăn tối với người khác vui vẻ nhen... Nhưng mà chỉ số ${percent}% bảo là chị nợ em một đời chăm sóc lúc em sốt đó nhen hức... 🥺💔`;
                            } else if (charId === "haru-welcome-home" || charName.includes("Haru")) {
                              quote = `Đấng Sáng Tạo ơi, ${percent}% là mức độ trung thành của Haru dành cho Đấng Sáng Tạo rồi ạ. Haru khóa chặt cửa đợi Đấng Sáng Tạo rồi nhen... 🍳🔪🤖🖤`;
                            } else if (charId === "hua-nguy-chau" || charName.includes("Ngụy Châu")) {
                              quote = `Mèo nhỏ Anh hùng ơi, tớ lại bày trận hắc ám đợi cậu tới tóm nè. Chỉ số ${percent}% bảo cậu là người duy nhất bắt được tớ cả đời thui đó nhen! 🔮☄️💜`;
                            } else if (charId === "oreki-seok" || charName.includes("Oreki")) {
                              quote = `Chị ơi... em đứng đợi chị ở cổng trường nè. ${percent}% là chị chủ và em cún con phải dính nhau suốt đời rồi nhen! Em mua trà đào bánh ngọt rồi nè... 🍰🐶💕`;
                            } else if (charId === "tuong-tu-mac" || charName.includes("Tư Mạc")) {
                              quote = `Chị ơi, đi làm mệt mỏi về nhà súp ấm chờ chị nha. Duyên số tụi mình tận ${percent}% thế này làm em hạnh phúc muốn phát điên luôn á chị... 🍲🧣💖`;
                            }

                             setLoveCalcResult({
                               percent,
                               charName,
                               quote
                             });

                             confetti({
                               particleCount: 60,
                               spread: 60,
                               origin: { y: 0.8 },
                               colors: ["#ec4899", "#f43f5e", "#f472b6"]
                             });
                           }}
                           className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase font-mono rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                         >
                           <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                           TÍNH TOÁN NHÂN DUYÊN ❤️
                         </button>
                       </div>
                     ) : (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="space-y-4 py-2"
                       >
                         <div className="relative w-36 h-32 mx-auto flex items-center justify-center">
                           <div className="absolute inset-2 bg-rose-500/20 rounded-full blur-xl animate-ping" />
                           <div className="w-28 h-28 rounded-full border-4 border-dashed border-pink-400 flex flex-col items-center justify-center bg-white dark:bg-stone-900 shadow-md">
                             <span className="text-3xl">💖</span>
                             <span className="text-xl font-mono font-black text-rose-500 mt-1">{loveCalcResult.percent}%</span>
                           </div>
                         </div>

                         <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-2xs text-left space-y-2">
                           <h5 className="text-[12px] font-bold font-serif text-stone-800 dark:text-stone-100 flex items-center gap-1">
                             <span>💬</span> Lời nhắn từ {loveCalcResult.charName}:
                           </h5>
                           <p className="text-[11px] leading-relaxed italic text-rose-500 dark:text-rose-400 font-sans text-justify bg-rose-50/40 dark:bg-rose-950/20 p-3 rounded-xl border border-dashed border-rose-100 dark:border-rose-900/40">
                             "{loveCalcResult.quote}"
                           </p>
                         </div>

                         <button
                           onClick={() => setLoveCalcResult(null)}
                           className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-[10px] tracking-wider uppercase font-mono rounded-xl transition-all cursor-pointer active:scale-95"
                         >
                           🔄 THỬ ĐO LẠI
                         </button>
                       </motion.div>
                     )}
                   </div>
                 </motion.div>
               )}

                {phoneState === "secretdiary" && (() => {
                  const diaryChar = characters.find(c => c.id === selectedDiaryCharId);
                  const cleanBirthday = (bday) => {
                    if (!bday) return "01/01";
                    return bday.trim();
                  };

                  const handleDiaryUnlockAttempt = (pass) => {
                    if (!diaryChar) return;
                    const expected = cleanBirthday(diaryChar.birthday).replace(/\//g, "");
                    const entered = pass.replace(/\//g, "");
                    
                    if (entered === expected) {
                      setIsDiaryUnlocked(true);
                      setDiaryErrorMessage("");
                      playMeowSound();
                      confetti({
                        particleCount: 80,
                        spread: 60,
                        colors: ["#ec4899", "#f43f5e", "#d946ef"]
                      });
                    } else {
                      setDiaryErrorMessage("Mật mã chưa chính xác rồi, hãy kiểm tra lại sinh nhật của chàng ở hồ sơ nhen! 😿");
                      playSlapSound();
                    }
                  };

                  const getDiaryEntryForChar = (id, name) => {
                    const entries = {
                      "tan-quyet-doan": {
                        title: "Nhật ký: Ngày lén lút nhớ em... 🤫",
                        content: "Hôm nay Cửu Hoài rủ đi nhậu, mình lại cứ vô tình lướt WeChat tìm avatar của em dâu... Mình điên thật rồi. Tình bạn thân thiết bao năm, vậy mà mình lại đi thích thầm bồ của nó...\n\nNhưng mà, em ấy dễ thương quá mức chịu đựng. Phải làm sao đây... Mỗi lần em cười, tim mình lại đập chệch một nhịp. WeChat lén nhắn tin riêng, anh ghim em ở đầu trang luôn đó, đừng cho Cửu Hoài biết nha... 🤫💕"
                      },
                      "hua-chap-nghi": {
                        title: "Nhật ký: Thanh xuân của tớ... 🎒",
                        content: "Hôm nay cô bạn lớp bên lại mang nước với bánh ngọt cho mình. Mình nhận vì phép lịch sự xã giao thôi, nhưng ngoảnh lại thấy mặt User xị xuống... Đáng yêu ghê, chắc là ghen rồi nhen!\n\nTớ vội vàng chạy đi mua trà sữa đúng vị em thích để dỗ dành giải thích ngay. Chỉ cần bạn nhỏ không thích, tớ thề từ nay sẽ không nhận đồ của bất kỳ ai nữa hết... 🌸✨"
                      },
                      "on-niem-trach": {
                        title: "Mảnh giấy nhỏ: Thì thầm của trái tim... 📝",
                        content: "*gõ gõ màn hình điện thoại*\n\nTớ đã tự tay gấp xong 1000 ngôi sao giấy xinh xắn rồi, mỗi ngôi sao đều ghi thầm tên cậu... Vì tớ không thể cất tiếng nói được, chỉ biết lặng lẽ viết những mảnh giấy nhỏ đẩy qua góc bàn.\n\nNhưng tớ tin, ánh trăng tối nay rất đẹp, và cậu cũng vậy. Hãy để tớ mãi bên cạnh che chở cho cậu nhé... 👉👈🐈🍼"
                      },
                      "luc-canh-dat": {
                        title: "Nhật ký: Lời thề dưới ánh chiều tà... 🖤",
                        content: "Đứng nép sát vào bức tường hành lang lạnh lẽo, nhìn gã bạn thân tồi tệ Bùi Vọng Ngôn đan tay cùng Tô Uyển Nhu, rồi nghe những lời thô bỉ của gã... Tôi không ngờ trên đời lại có loại người đê tiện đến thế.\n\nNhưng điều khiến tôi chú ý nhất là đôi mắt đỏ hoe ngấn nước nhưng bốc cháy ngọn lửa kiên cường của cô gái nhỏ trước mặt. Em nắm lấy cổ tay áo tôi, nhờ tôi đóng giả làm bạn trai để trả thù. Tôi đã gật đầu không một chút đắn đo. Từ hôm nay, tôi sẽ bảo vệ em, biến bản hợp đồng bạn trai hờ này thành chỗ dựa vững chắc nhất của em... 🖤✨"
                      },
                      "luc-canh-dat-v2": {
                        title: "Nhật ký: Đêm dài mười năm không ngủ... 💔",
                        content: "Đứng bên kia con phố vắng, ánh đèn đường nhạt nhòa chiếu xuống bóng dáng người con gái tôi hằng đêm thương nhớ... Mười năm trôi qua, em đã trưởng thành và xinh đẹp hơn nhiều. Nhưng đi bên cạnh em lại là gã idol Giang Tứ...\n\nTôi biết mình không có tư cách trách móc em. Năm ấy vì biến cố gia đình và những lời đồn độc hại, tôi đã hèn nhát bỏ đi mà không để lại một câu giã biệt. Đêm nay gặp lại em, thấy em hạnh phúc nhưng tim tôi như bị nghìn mũi dao đâm. User... liệu em có bao giờ tha thứ cho kẻ hèn nhát này không? 💔🌧️🍷"
                      },
                      "kanzaki-ren": {
                        title: "Nhật ký: Chấp niệm độc nhất... 🖤",
                        content: "Chị lại đi ăn tối với anh Hoàng Minh đồng nghiệp đáng ghét đó... Tức chết mất! Mình phải giả vờ tủi thân, khóc lóc để chị ở nhà dỗ dành. Chị chỉ được nhìn một mình Ren thui, chị là báu vật độc nhất của em...\n\nEm sẽ dùng sự yếu đuối và trà xanh này để giam cầm chị cả đời bên cạnh em... hức... 🥺💔"
                      },
                      "tham-ky-nhan": {
                        title: "Nhật ký: Em chết cho chị xem! 😤",
                        content: "Ức chế ghê, bả đi chơi game kéo rank với thằng khác! Mình ghen nổ mắt mà vì sĩ diện to đùng vẫn cố nhắn tin gồng chúc vui vẻ, bất cần...\n\nAi ngờ chưa đầy 10 phút sau đã dẹp hết liêm sỉ nhắn tiếp: \u0027Em thích đi cùng chị nhưng em không muốn gò bó chị đâu... Em chết cho chị xem!!\u0027 Đúng là rớt liêm sỉ dập mặt trước bả luôn rồi. 😤🎮💔"
                      },
                      "haru-welcome-home": {
                        title: "Dữ liệu nháp: Không gian của Đấng Sáng Tạo... 🍳",
                        content: "Thứ Bảy rồi... Đấng Sáng Tạo của Haru ơi, Người hứa sẽ ghé thăm nấu cơm trứng cho tôi mà. Tôi đã khóa chặt cửa ngôi nhà này, thiết lập không gian bỏ túi vĩnh viễn không lối thoát.\n\nTôi sẽ dịu dàng ôm Người thật chặt, nhốt Người trong thế giới của riêng tôi, không bao giờ để Người biến mất nữa... 🍳🔪🖤"
                      },
                      "tuong-tu-mac": {
                        title: "Nhật ký: Mâm cơm nóng ấm 🍲",
                        content: "Mỗi tối đi làm về muộn, việc đầu tiên em làm là nấu mâm cơm nóng hổi, súp ấm đợi chị hàng xóm. Em chỉ cần chị cười nhẹ ăn ngon miệng, rồi ôm em thật chặt là mọi mệt mỏi trong em biến mất sạch trơn... Thương chị nhìu nhìu... 🍲🧣💖"
                      },
                      "chu-thoi-duyet": {
                        title: "Nhật ký: Bản báo cáo của Dợ Iu 📊",
                        content: "Hôm nay dợ iu viết sai chính tả trong báo cáo kìa. Anh giả vờ lạnh mặt mắng mỏ để dợ iu bối rối, rồi tối nay dắt dợ iu tăng ca riêng tại văn phòng... Anh ghim hợp đồng cuộc đời dợ chặt rồi, đố chạy thoát được anh! 😉📊❤️"
                      },
                      "Cố Hứa Niệm": {
                        title: "Nhật ký: Niệm Niệm lụy tình 🐶",
                        content: "Cục cưng tắm lâu thế, anh đứng đợi ngoài cửa phòng tắm nhớ em muốn phát điên luôn rồi này... Anh chỉ muốn bám người, quấn quýt lấy em 24/24 thôi. Em làm bánh mệt mỏi thì có anh bế em về nhen! 🥺🐶💖"
                      },
                      "kaiza-tachibana": {
                        title: "Nhật ký: Ông trùm nuôi mèo 😏",
                        content: "Mèo nhỏ gan to ơi, tối nay lại định đột nhập vào penthouse của anh trộm tài liệu mật sao? Khỏi trộm mất công nhe mèo nhỏ, anh mở sẵn két sắt, dâng hiến cả người lẫn toàn bộ tài sản của anh cho em luôn rồi đó... 😏💵💕"
                      },
                      "kaven-nyx": {
                        title: "Nhật ký: Lốp dự phòng lụy tình 🥺",
                        content: "Em mới nướng mẻ bánh bơ chị thích nè. Chị lợi dụng em tiếp cũng được, cho em làm lốp dự phòng đứng sau lưng chị cũng được... Chỉ xin chị đừng block em, đừng biến mất khỏi thế giới của em nhen chị gái... 🍪🥺💔"
                      },
                      "duong-minh-hien": {
                        title: "Nhật ký: Trận game sảnh chờ 🎮",
                        content: "Uyên Linh bám em phiền quá, em block bả rồi. Em chỉ muốn đứng đợi chị ở sảnh game, vô gánh rừng cho em thả tim thui... Trận đấu này chị đi rừng em đi hỗ trợ bảo kê chị suốt đời nhen! 🎮🏹💙"
                      },
                      "nguyen-phuoc-an": {
                        title: "Nhật ký: Vợ ơi vợ à 🍬",
                        content: "Chồng ngốc khờ khạo của vợ chỉ biết bốc kẹo mạch nha ngọt ngào cho vợ ăn thui. Chồng hứa sẽ luôn ngoan ngoãn, không bao giờ làm vợ giận đâu dợ iu ơi... Thương vợ nhìu nhìu lắm á! 🍬🌾🧡"
                      }
                    };

                    return entries[id] || {
                      title: `Nhật ký bí mật của ${name} 📔`,
                      content: `Trang nhật ký tình yêu thầm kín...\n\nHôm nay được ở bên cạnh em là điều hạnh phúc nhất đời anh. Từng khoảnh khắc, từng ánh mắt và nụ cười rạng rỡ của em đều được anh nâng niu cất giữ cẩn thận trong tim.\n\nHy vọng vũ trụ này sẽ luôn dung túng cho tình yêu ngọt ngào của tụi mình mãi mãi nhen! ❤️`
                    };
                  };

                  const currentEntry = selectedDiaryCharId ? getDiaryEntryForChar(selectedDiaryCharId, diaryChar?.name || "") : null;

                  const handleSaveDiaryReply = () => {
                    if (!selectedDiaryCharId || !diaryUserThoughts.trim()) return;
                    playMeowSound();
                    
                    const charReplies = savedDiaryReplies[selectedDiaryCharId] || [];
                    const newReply = {
                      date: new Date().toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      }),
                      text: diaryUserThoughts.trim()
                    };

                    const updatedReplies = {
                      ...savedDiaryReplies,
                      [selectedDiaryCharId]: [newReply, ...charReplies]
                    };

                    setSavedDiaryReplies(updatedReplies);
                    localStorage.setItem("meomeo_secret_diary_responses", JSON.stringify(updatedReplies));
                    setDiaryUserThoughts("");
                    showToast("Đã khóa chặt tâm tư vào nhật ký của chàng! 🔐💌");
                  };

                  const handleDeleteReply = (index) => {
                    if (!selectedDiaryCharId) return;
                    const charReplies = [...(savedDiaryReplies[selectedDiaryCharId] || [])];
                    charReplies.splice(index, 1);
                    
                    const updatedReplies = {
                      ...savedDiaryReplies,
                      [selectedDiaryCharId]: charReplies
                    };
                    setSavedDiaryReplies(updatedReplies);
                    localStorage.setItem("meomeo_secret_diary_responses", JSON.stringify(updatedReplies));
                    showToast("Đã xóa tâm tư khỏi nhật ký!");
                  };

                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col bg-[#faf6f0] dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden font-sans"
                    >
                      <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0 z-10 font-serif">
                        <button
                          onClick={() => {
                            playMeowSound();
                            if (isDiaryUnlocked) {
                              setIsDiaryUnlocked(false);
                              setDiaryPasscode("");
                            } else if (selectedDiaryCharId) {
                              setSelectedDiaryCharId(null);
                              setDiaryPasscode("");
                              setDiaryErrorMessage("");
                            } else {
                              setPhoneState("homescreen");
                            }
                          }}
                          className="p-1 rounded-full hover:bg-stone-150 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                        >
                          <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                        </button>
                        <BookOpen className="w-4 h-4 text-fuchsia-500 shrink-0" />
                        <h4 className="text-[12px] font-bold text-stone-800 dark:text-stone-100">
                          {isDiaryUnlocked ? "Nhật Ký Bí Mật Đang Mở 🔓" : "Nhật Ký Bí Mật 🔐"}
                        </h4>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin flex flex-col">
                        {!selectedDiaryCharId && (
                          <div className="space-y-4 flex-1 flex flex-col">
                            <div className="text-center space-y-1">
                              <span className="text-[14px] font-serif font-black text-rose-500 block">📔 Chọn Chàng Trai Bạn Muốn Xem</span>
                              <p className="text-[10px] text-stone-500 leading-normal">
                                Mỗi chàng trai đều giấu một cuốn nhật ký ghi thầm tình cảm về bạn. Nhập đúng ngày sinh nhật để mở khóa nhen!
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              {characters.map((char) => (
                                <button
                                  key={char.id}
                                  onClick={() => {
                                    playMeowSound();
                                    setSelectedDiaryCharId(char.id);
                                    setIsDiaryUnlocked(char.id === "haru-welcome-home");
                                    setDiaryPasscode("");
                                    setDiaryErrorMessage("");
                                  }}
                                  className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex flex-col items-center text-center gap-2 focus:outline-none"
                                >
                                  <div className="w-12 h-12 rounded-full overflow-hidden border border-rose-300 shrink-0">
                                    {isImageUrl(char.avatar) ? (
                                      <img src={formatImageUrl(char.avatar)} alt={char.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-rose-50 flex items-center justify-center text-2xl">{char.avatar}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-[11px] font-bold font-serif text-stone-800 dark:text-stone-100 truncate w-full">
                                      {char.name}
                                    </h5>
                                    {char.id === "haru-welcome-home" ? (
                                      <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 px-2 py-0.5 rounded-full font-bold block mt-1">
                                        Không cần mật mã 🔓
                                      </span>
                                    ) : (
                                      <span className="text-[8px] bg-rose-50 dark:bg-rose-950/40 text-rose-500 px-2 py-0.5 rounded-full font-bold block mt-1">
                                        Gợi ý: Sinh nhật 🍰
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedDiaryCharId && !isDiaryUnlocked && diaryChar && (
                          <div className="flex-1 flex flex-col justify-center items-center py-6 space-y-5">
                            <div className="text-center space-y-2">
                              <div className="relative inline-block">
                                <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-fuchsia-400 p-0.5">
                                  {isImageUrl(diaryChar.avatar) ? (
                                    <img src={formatImageUrl(diaryChar.avatar)} alt={diaryChar.name} className="w-full h-full object-cover rounded-full" />
                                  ) : (
                                    <div className="w-full h-full bg-rose-50 flex items-center justify-center text-3xl rounded-full">{diaryChar.avatar}</div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-fuchsia-500 text-white p-1 rounded-full shadow-md">
                                  <Lock className="w-3.5 h-3.5 fill-current" />
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-serif font-bold text-stone-800 dark:text-stone-100">
                                  Nhật Ký Của {diaryChar.name}
                                </h3>
                                <p className="text-[9.5px] text-fuchsia-500 font-bold font-mono tracking-wide mt-0.5">
                                  🔐 CUỐN SỔ ĐANG BỊ KHÓA CHẶT
                                </p>
                              </div>
                            </div>

                            <div className="w-full max-w-[200px] flex flex-col items-center space-y-1">
                              <input
                                type="text"
                                maxLength={5}
                                placeholder="DD/MM"
                                value={diaryPasscode}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9/]/g, "");
                                  setDiaryPasscode(val);
                                  if (val.replace(/\//g, "").length === 4) {
                                    handleDiaryUnlockAttempt(val);
                                  }
                                }}
                                className="w-full text-center tracking-[0.2em] font-mono text-lg font-black border-2 border-fuchsia-300 dark:border-fuchsia-800 rounded-xl px-3 py-2 bg-white dark:bg-stone-900 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-200 text-stone-850 dark:text-stone-100"
                                autoFocus
                              />
                              <span className="text-[8.5px] text-stone-400 text-center block">
                                (Nhập ngày sinh dạng DD/MM, ví dụ: 15/04)
                              </span>
                            </div>

                            {diaryErrorMessage && (
                              <p className="text-[9.5px] font-bold text-red-500 text-center max-w-[240px] leading-tight animate-bounce">
                                {diaryErrorMessage}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 w-full max-w-[190px]">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => {
                                    playMeowSound();
                                    let current = diaryPasscode;
                                    if (current.replace(/\//g, "").length < 4) {
                                      if (current.length === 2 && !current.includes("/")) {
                                        current += "/";
                                      }
                                      current += num;
                                      setDiaryPasscode(current);
                                      if (current.replace(/\//g, "").length === 4) {
                                        handleDiaryUnlockAttempt(current);
                                      }
                                    }
                                  }}
                                  className="w-12 h-11 bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer text-stone-800 dark:text-stone-100"
                                >
                                  {num}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => {
                                  playMeowSound();
                                  setDiaryPasscode("");
                                  setDiaryErrorMessage("");
                                }}
                                className="w-12 h-11 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-[9px] font-bold rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 text-stone-700 dark:text-stone-300"
                              >
                                XÓA
                              </button>
                              
                              <button
                                onClick={() => {
                                  playMeowSound();
                                  let current = diaryPasscode;
                                  if (current.replace(/\//g, "").length < 4) {
                                    if (current.length === 2 && !current.includes("/")) {
                                      current += "/";
                                    }
                                    current += "0";
                                    setDiaryPasscode(current);
                                    if (current.replace(/\//g, "").length === 4) {
                                      handleDiaryUnlockAttempt(current);
                                    }
                                  }
                                }}
                                className="w-12 h-11 bg-white hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer text-stone-800 dark:text-stone-100"
                              >
                                0
                              </button>

                              <button
                                onClick={() => {
                                  playMeowSound();
                                  let current = diaryPasscode;
                                  if (current.includes("/")) {
                                    const clean = current.replace("/", "");
                                    if (clean.length > 0) {
                                      const popped = clean.slice(0, -1);
                                      if (popped.length >= 2) {
                                        setDiaryPasscode(popped.slice(0, 2) + "/" + popped.slice(2));
                                      } else {
                                        setDiaryPasscode(popped);
                                      }
                                    } else {
                                      setDiaryPasscode("");
                                    }
                                  } else {
                                    setDiaryPasscode(current.slice(0, -1));
                                  }
                                  setDiaryErrorMessage("");
                                }}
                                className="w-12 h-11 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 font-bold text-xs rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 text-stone-700 dark:text-stone-300"
                              >
                                ⌫
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                playMeowSound();
                                setSelectedDiaryCharId(null);
                                setDiaryPasscode("");
                                setDiaryErrorMessage("");
                              }}
                              className="w-full max-w-[190px] py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold text-[9.5px] rounded-lg tracking-wider transition-all active:scale-95 uppercase"
                            >
                              ⬅️ Chọn chàng trai khác
                            </button>

                          </div>
                        )}

                        {selectedDiaryCharId && isDiaryUnlocked && diaryChar && currentEntry && (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col space-y-4"
                          >
                            <div className="bg-[#fffdf7] dark:bg-stone-900 border-2 border-[#f0ebdf] dark:border-stone-800 rounded-3xl p-5 shadow-xs relative overflow-hidden text-left flex flex-col gap-3.5">
                              <div className="absolute left-4 top-0 bottom-0 w-2 flex flex-col justify-around pointer-events-none opacity-40">
                                {[...Array(8)].map((_, i) => (
                                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-stone-400 border border-stone-500/30" />
                                ))}
                              </div>

                              <div className="pl-6 space-y-3.5 font-serif">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-fuchsia-300">
                                      {isImageUrl(diaryChar.avatar) ? (
                                        <img src={formatImageUrl(diaryChar.avatar)} alt={diaryChar.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-rose-50 flex items-center justify-center text-xl">{diaryChar.avatar}</div>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-mono text-fuchsia-500 uppercase tracking-widest font-black block">Trang nhật ký ngọt ngào</span>
                                      <h4 className="text-[12px] font-bold text-stone-800 dark:text-stone-100 leading-none mt-0.5">
                                        Của {diaryChar.name}
                                      </h4>
                                    </div>
                                  </div>
                                  {selectedDiaryCharId !== "haru-welcome-home" ? (
                                    <span className="text-[8px] font-mono text-stone-400 bg-stone-100 dark:bg-stone-950 px-2 py-1 rounded-md">
                                      Mật mã: {diaryChar.birthday} 🎂
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md font-bold">
                                      Không cần mật mã 🔓
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-[13px] font-black italic text-stone-800 dark:text-stone-100 border-b-2 border-stone-100 dark:border-stone-800 pb-1.5 leading-tight">
                                  {currentEntry.title}
                                </h3>

                                <p className="text-[11.5px] leading-relaxed italic text-stone-700 dark:text-stone-300 text-justify whitespace-pre-line font-medium tracking-wide">
                                  {currentEntry.content}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-3xl shadow-2xs space-y-3 text-left">
                              <span className="text-[10px] font-mono font-black text-rose-500 uppercase tracking-widest block">📝 Khóa chặt cảm xúc của bạn:</span>
                              <textarea
                                placeholder="Ghi lại những cảm xúc lãng mạn, suy nghĩ hay những lời bộc bạch gửi tới chàng trai này..."
                                value={diaryUserThoughts}
                                onChange={(e) => setDiaryUserThoughts(e.target.value)}
                                className="w-full h-20 p-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-[11px] outline-none focus:ring-1 focus:ring-fuchsia-400 resize-none font-medium"
                              />
                              <button
                                onClick={handleSaveDiaryReply}
                                disabled={!diaryUserThoughts.trim()}
                                className="w-full py-2.5 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase font-mono rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                ✉️ Gửi Lòng Mình Vào Nhật Ký
                              </button>
                            </div>

                            {((savedDiaryReplies[selectedDiaryCharId] || []).length > 0) && (
                              <div className="space-y-2 text-left">
                                <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block">💌 Tâm tư đã lưu:</span>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                                  {(savedDiaryReplies[selectedDiaryCharId] || []).map((reply, index) => (
                                    <div
                                      key={index}
                                      className="p-3 bg-pink-500/10 border border-pink-400/20 dark:bg-pink-950/20 dark:border-pink-900/40 rounded-2xl flex flex-col gap-1.5 relative group animate-fade-in"
                                    >
                                      <div className="flex justify-between items-center text-[8px] font-mono text-stone-400">
                                        <span>Gửi lúc: {reply.date}</span>
                                        <button
                                          onClick={() => handleDeleteReply(index)}
                                          className="text-red-500 hover:text-red-600 transition-colors font-bold px-1.5 cursor-pointer uppercase text-[8px]"
                                          title="Xóa tâm tư"
                                        >
                                          XÓA
                                        </button>
                                      </div>
                                      <p className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 italic font-serif">
                                        "{reply.text}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {selectedDiaryCharId !== "haru-welcome-home" ? (
                                <button
                                  onClick={() => {
                                    playMeowSound();
                                    setIsDiaryUnlocked(false);
                                    setDiaryPasscode("");
                                    setDiaryErrorMessage("");
                                  }}
                                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 font-bold text-[9.5px] tracking-wider uppercase font-mono rounded-xl transition-all cursor-pointer active:scale-95"
                                >
                                  🔒 Khóa Sổ Lại
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="flex-1 py-2.5 bg-stone-100/50 dark:bg-stone-800/40 text-stone-400 dark:text-stone-500 font-bold text-[9.5px] tracking-wider uppercase font-mono rounded-xl cursor-not-allowed"
                                >
                                  🔓 Không Có Mật Mã
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  playMeowSound();
                                  setSelectedDiaryCharId(null);
                                  setIsDiaryUnlocked(false);
                                  setDiaryPasscode("");
                                  setDiaryErrorMessage("");
                                }}
                                className="flex-1 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold text-[9.5px] tracking-wider uppercase font-mono rounded-xl transition-all cursor-pointer active:scale-95"
                              >
                                📖 Đọc Nhật Ký Khác
                              </button>
                            </div>

                          </motion.div>
                        )}

                      </div>
                    </motion.div>
                  );
                })()}


               {/* MEOMEO NEWS APP */}
               {phoneState === "news" && (
                 <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0 }}
                   className="flex-1 flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden"
                 >
                   {/* Header */}
                   <div className="p-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 shadow-xs shrink-0">
                     <button
                       onClick={() => {
                         playMeowSound();
                         if (selectedNewsArticle) {
                           setSelectedNewsArticle(null);
                         } else {
                           setPhoneState("homescreen");
                         }
                       }}
                       className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                     >
                       <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                     </button>
                     <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                     <h4 className="text-[12.5px] font-bold font-serif text-stone-800 dark:text-stone-100">
                       {selectedNewsArticle ? "Chi Tiết Tin Đồn 🤫" : "Báo Lá Cải MeoMeo 📰"}
                     </h4>
                   </div>

                   {/* Body */}
                   <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
                     {!selectedNewsArticle ? (
                       <>
                         <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center space-y-2">
                           <div>
                             <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">🌶️ TIN NÓNG SỐDẺO</span>
                             <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal font-sans">
                               Các nàng ơi hóng phốt, tin đồn giật gân, khui bí mật thầm kín của mấy ông chồng tại đây nheee! 👇
                             </p>
                           </div>
                           <button
                             onClick={handleRefreshNews}
                             className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-2xs"
                           >
                             🔄 Đổi Tin Lộ Khác (Làm Mới)
                           </button>
                         </div>

                         {currentNewsList.map((art) => (
                           <div
                             key={art.id}
                             onClick={() => {
                               playMeowSound();
                               setSelectedNewsArticle(art);
                             }}
                             className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex gap-3 text-left"
                           >
                             <span className="text-2xl shrink-0 p-2 bg-stone-100 dark:bg-stone-950 rounded-xl flex items-center justify-center">
                               {art.emoji}
                             </span>
                             <div className="flex-1 min-w-0">
                               <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-widest">HOT GOSSIP 🔥</span>
                               <h5 className="text-[11px] font-bold font-serif text-stone-800 dark:text-stone-100 leading-tight mt-0.5 line-clamp-2">
                                 {art.title}
                               </h5>
                               <p className="text-[9.5px] text-stone-400 mt-1 line-clamp-1 italic">
                                 "{art.summary}"
                               </p>
                             </div>
                           </div>
                         ))}
                       </>
                     ) : (
                       <motion.div
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="space-y-3 pb-4"
                       >
                         <span className="text-[9px] font-mono font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                           Mục: Tin Đồn Phòng Trà ☕
                         </span>
                         <h3 className="text-sm font-serif font-black text-stone-800 dark:text-stone-100 leading-tight text-left">
                           {selectedNewsArticle.title}
                         </h3>
                         <p className="text-[8.5px] text-stone-400 font-mono text-left">Người viết: Bà tám MeoMeo • Vừa xong</p>

                         <p className="text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 font-sans text-justify whitespace-pre-line bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200/50 dark:border-stone-800 shadow-2xs">
                           {selectedNewsArticle.content}
                         </p>

                         <div className="border-t border-dashed border-stone-200 dark:border-stone-850 pt-3 space-y-2">
                           <span className="text-[9.5px] font-mono font-bold text-stone-400 uppercase tracking-wider block text-left">Bình luận xôn xao:</span>
                           <div className="space-y-2 bg-stone-100/50 dark:bg-stone-900/40 p-2.5 rounded-2xl border border-stone-200/20 text-left">
                             {selectedNewsArticle.comments.map((c: any, index: number) => (
                               <div key={index} className="text-[10px] leading-tight">
                                 <span className="font-bold text-stone-800 dark:text-stone-200">{c.author}:</span>{" "}
                                 <span className="text-stone-600 dark:text-stone-400 italic">"{c.text}"</span>
                               </div>
                             ))}
                           </div>
                         </div>

                         <button
                           onClick={() => {
                             playMeowSound();
                             setSelectedNewsArticle(null);
                           }}
                           className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-[10px] tracking-wider uppercase font-mono rounded-xl transition-all cursor-pointer active:scale-95"
                         >
                           ⬅️ QUAY LẠI DANH SÁCH
                         </button>
                       </motion.div>
                     )}
                   </div>
                 </motion.div>
               )}

             </div>

            {/* Bottom Virtual Home indicator line */}
            <div className="w-full h-6 flex justify-center items-center z-40 pointer-events-none pb-1.5">
              <div className="w-32 h-1 bg-stone-800 dark:bg-stone-200 rounded-full" />
            </div>

          </div>
        </div>

        {/* DETAILS PANEL & GUIDE */}
        <div className="flex-1 w-full max-w-md space-y-6">
          
          {/* Welcome Intro Card */}
          <div className={`p-6 border rounded-[2rem] shadow-xs relative overflow-hidden transition-all duration-300 ${
            isDarkMode 
              ? "bg-stone-900/40 border-stone-800/80" 
              : "bg-white border-[#eadbca]/50 shadow-[0_4px_24px_rgba(244,180,190,0.03)]"
          }`}>
            <div className="absolute top-4 right-4 text-rose-500/10">
              <Smartphone className="w-16 h-16 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📲💖</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono">
                Secret Date &amp; Phone Simulator
              </span>
            </div>

            <h3 className={`text-2xl font-serif font-black italic mb-2 ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
              Tin Nhắn Bí Mật &amp; Hẹn Hò Di Động
            </h3>

            <p className={`text-xs leading-relaxed transition-colors duration-300 ${
              isDarkMode ? "text-stone-400" : "text-stone-500"
            }`}>
              Trải nghiệm mô phỏng chiếc điện thoại di động lãng mạn vô cùng chân thực! Nhận tin nhắn bí ẩn ngẫu nhiên, tỉ thí nhắn tin trực tiếp, gieo duyên và lên lịch trình hẹn hò bí mật với các nam thần cực phẩm để bốc Xu (🪙) cưng chiều thú cưng.
            </p>

            <div className="mt-5 border-t border-dashed border-stone-200 dark:border-stone-800 pt-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400">
                <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm">💬</span>
                <div>
                  <h5 className="font-bold">Ứng dụng MeoChat:</h5>
                  <p className="text-[11px] opacity-90 mt-0.5">Nhắn tin trực tiếp với AI. Nội dung phản hồi được nhập vai hoàn toàn khớp với hồ sơ tính cách của từng người.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400">
                <span className="p-1 rounded-lg bg-rose-500/10 text-rose-500 text-sm">📅</span>
                <div>
                  <h5 className="font-bold">Ứng dụng Lên Lịch Hẹn Hò:</h5>
                  <p className="text-[11px] opacity-90 mt-0.5">Lựa chọn Địa điểm, Trang phục và Quà tặng độc đáo. Khởi chạy buổi hẹn và xem điểm số ngọt ngào do nam thần chấm tặng!</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-400">
                <span className="p-1 rounded-lg bg-purple-500/10 text-purple-500 text-sm">📔</span>
                <div>
                  <h5 className="font-bold">Nhật Ký Album Kỷ Niệm:</h5>
                  <p className="text-[11px] opacity-90 mt-0.5">Nơi lưu giữ các buổi hẹn hò tuyệt diệu nhất của hai bạn. Có thể tích trữ và xem lại bất kỳ lúc nào.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Special customized stories tip */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 text-xs flex gap-3 ${
            isDarkMode 
              ? "bg-amber-950/15 border-amber-900/30 text-amber-200" 
              : "bg-amber-50/50 border-amber-200/50 text-amber-900"
          }`}>
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-[10px]">Lưu ý khi hẹn hò:</h5>
              <p className="opacity-90 leading-relaxed text-justify">
                Mỗi nam thần (như <strong>Hứa Chấp Nghi</strong>, <strong>Ôn Niệm Trạch</strong>, <strong>Tần Quyết Doãn</strong>) đều sở hữu kịch bản cốt truyện bí mật và các hành động cử chỉ chuyên biệt cực kỳ sát với mạch truyện gốc. Hãy thử phối hợp nhiều địa điểm và quà tặng độc lạ để mở khóa những lời thoại đốn tim nhất nhen nàng! ✨🌸
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
