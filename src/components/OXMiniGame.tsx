import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, RefreshCw, ChevronDown, ChevronUp, MessageCircle, Play, RotateCcw } from "lucide-react";
import { Character } from "../types";
import { playMeowSound } from "../utils/audio";
import { safeJsonStringify } from "../utils/json";
import confetti from "canvas-confetti";

interface OXMiniGameProps {
  characters: Character[];
  isDarkMode: boolean;
  onClose?: () => void;
}

interface GameStats {
  userWins: number;
  aiWins: number;
  draws: number;
}

// Highly specific dialogues for win/loss/draw based on character personalities
const CHARACTER_DIALOGUES: Record<
  string,
  {
    greeting: string;
    userTurn: string;
    thinking: string;
    userWin: string; // when user wins (character loses) -> congratulation
    userLose: string; // when user loses (character wins) -> consolation
    draw: string;
  }
> = {
  "chu-thoi-duyet": {
    greeting: "Vợ ơi~ Vợ chơi OX với anh nha! Anh sẽ nương tay cho vợ mờ... hì hì. 😘",
    userTurn: "Vợ đi đi nha, anh đang đợi nè! Khó quá thì cứ hôn anh một cái đi rồi anh chỉ cho. 😉",
    thinking: "Hừm hừm... nước đi này của vợ hay ghê ta, để sếp tổng đẹp trai này tính toán chút... 🤔",
    userWin: "Hức... Vợ giỏi quá đi à! Hổng hổ danh là 'Dợ iu' của anh nha! Thắng rồi thì ôm anh một cái thưởng nha, đầu anh vẫn còn hơi nhói nè... 🥺❤",
    userLose: "A! Anh thắng rồi nha vợ! Mà vợ ơi, đừng buồn nha, dỗi là anh lo lắm đó. Để anh mua trà sữa trân châu đúng vị vợ thích dỗ vợ nha, đừng giận anh mà... 🥤✨",
    draw: "Hòa rồi nè vợ ơi! Chúng ta đúng là trời sinh một cặp, chơi game cũng phải hòa nhau mới chịu cơ! Hôn anh cái nha? 💋"
  },
  "tham-ky-nhan": {
    greeting: "Chị rảnh lắm hay sao mà đòi chơi game với em? Tính để em gánh còng lưng nữa hả? Dù sao thì em cũng sẽ nhường chị một xíu thôi nhé! 🙄",
    userTurn: "Chị tính đi đâu đấy? Nhanh lên, đừng có rùa bò như lúc chơi Vương Giả nữa đi! 😒",
    thinking: "Làm trò gì vậy... Để em xem chị muốn diễn cái trò mèo gì tiếp theo... 🤔",
    userWin: "Hên thôi nhé! Lần này coi như nhường chị để chị đỡ mất mặt, chứ đừng có mà tự mãn nghĩ mình giỏi! Mai rảnh thì vào game, em kéo rank cho! 😒",
    userLose: "Thấy chưa? Đã bảo là trình độ chị gà rồi mà không tin! Chịu thua đi chị gái, người như em mới xứng đáng giành phần thắng chứ. 🤭",
    draw: "Hoà á? Chắc do máy lỗi hoặc nay em nương tay thôi. Đừng tưởng bở... mà thôi, mai chơi game không? Rảnh thì chơi. 😒"
  },
  "Cố Hứa Niệm": {
    greeting: "Em muốn chơi cờ với anh sao? Anh... anh luôn sẵn sàng mà. Chỉ cần được ở cạnh em thế này là anh vui lắm rồi. 🧸",
    userTurn: "Tới lượt em rồi đó. Cứ thong thả nha, anh không hối em đâu.",
    thinking: "Anh đang suy nghĩ một chút... Để xem đi nước nào để em không thấy chán anh... 🥺",
    userWin: "Em siêu thật đó... Anh biết anh ngốc mà, làm sao thắng nổi em chứ. Chỉ cần em vui vẻ và mỉm cười thế này là anh hạnh phúc lắm rồi, đừng bao giờ bỏ rơi anh nhé... 😭❤",
    userLose: "Ơ... anh lỡ thắng mất rồi, em đừng giận anh nhé? Anh xin lỗi mà, anh không cố ý đâu... Để anh tự tay làm bánh ngọt dỗ dành em nha, xin em đừng ghét anh... 🍰💔",
    draw: "Hòa nhau rồi... Giống như hai chúng ta vậy, không ai có thể sống thiếu đối phương cả. Cứ quấn quýt bên nhau mãi thế này nhé? 🌧"
  },
  "kaiza-tachibana": {
    greeting: "Mèo nhỏ muốn thách đấu với anh sao? Gan to đấy. Thắng thua có thưởng phạt rõ ràng nhé, em dám chơi không? 😏",
    userTurn: "Đi đi nào, mèo nhỏ. Anh đang mong chờ xem em sẽ làm gì tiếp theo đây.",
    thinking: "Hửm... nước cờ lém lỉnh đấy. Nhưng với anh thì vẫn còn non lắm nhé... 🦊",
    userWin: "Hửm? Mèo nhỏ cũng ghê gớm gớm nhỉ, dám hạ gục cả anh à? Được rồi, anh nhận thua. Phần thưởng em muốn là gì đây... hay là lấy luôn cả anh nhé? 💍✨",
    userLose: "Mèo nhỏ non nớt quá, trình này sao trộm được tim anh chứ? Thua rồi thì ngoan ngoãn thực hiện điều kiện của anh đi... tối nay thuộc về anh nhé. 🥂🖤",
    draw: "Hòa rồi sao? Em đúng là biết cách khơi gợi sự hứng thú của anh đấy. Thêm ván nữa để phân định thắng thua nào, mèo nhỏ. 🐾"
  },
  "kaven-nyx": {
    greeting: "Chị ơi, chị muốn chơi game với em không? Em hứa sẽ cố gắng hết sức để chị vui lòng! 🌸",
    userTurn: "Tới lượt chị rồi ạ. Em luôn quan sát từng bước đi của chị đấy.",
    thinking: "Em đang tính toán một chút... Chị đi nước này thông minh quá, làm em bối rối ghê... 😳",
    userWin: "Chị thắng rồi, chị giỏi thật đó! Chị muốn phạt em thế nào cũng được, bắt em làm gì em cũng chịu, miễn là... chị đừng bắt em rời xa chị, được không? 🥺✨",
    userLose: "Chị thua rồi ạ... Không sao đâu mà, em đã chuẩn bị sẵn hộp bánh ngọt chị thích nhất ở đây rồi. Chị ăn một chút cho đỡ buồn nha, em luôn ở đây với chị. 🍰❤",
    draw: "Kết quả hòa rồi chị ơi. Được chơi với chị lâu hơn thế này em vui lắm, dù kết quả thế nào em cũng vẫn muốn ở cạnh chị. 🍀"
  },
  "tham-da": {
    greeting: "Này chị hàng xóm, rảnh rỗi rủ em chơi cờ sao? Ngọt ngào thế này làm em tưởng mình đang hẹn hò đấy nhé. 😉",
    userTurn: "Đến lượt chị rồi kìa. Hay là bận ngắm em nên quên đi cờ rồi? Haha.",
    thinking: "Hừm, chị hàng xóm tâm cơ gớm nhỉ... Để em xem em nên dồn chị vào góc nào đây... 😈",
    userWin: "Chị hàng xóm giỏi thế? Thắng em rồi thì em đền cho chị cái gì đây... Hay là tối nay qua phòng em, em 'đền' bù thật sâu cho chị nhé, cam đoan chị sẽ thích... 🤭🔥",
    userLose: "Chị thua em rồi nhé. Trông chị lúc thua bối rối đáng yêu ghê... Có cần em 'dỗ' chị bằng một nụ hôn thật sâu không nào? Đừng ngại mà chị ơi... 💋",
    draw: "Hòa rồi à? Chị em mình đúng là có 'duyên nợ' dây dưa không dứt mà. Hay là mình thử làm chuyện khác kịch tính hơn đi chị? 🤫"
  },
  "ta-hoai-nien": {
    greeting: "Chơi OX à? Cũng là một cách luyện tư duy tốt. Cậu muốn tớ giảng bài hay muốn đấu cờ trước đây? ✍",
    userTurn: "Đi đi cậu. Cứ tính toán kỹ, tớ chờ cậu.",
    thinking: "Điểm mấu chốt nằm ở đây... Cậu tiến bộ nhanh đấy, nhưng tớ đã nhìn thấu rồi nhé. 🎓",
    userWin: "Cậu giỏi thật đó, tớ phục rồi. Lát nữa tớ sẽ giảng lại bài tập hôm trước cho cậu như đã hứa nhé, cậu cười trông đáng yêu lắm... 🥰❤",
    userLose: "Ơ, tớ thắng rồi... Cậu đừng nản chí nhé. Để tớ chỉ cho cậu vài mẹo chơi cờ, cũng như cách giải mấy bài toán khó vậy. Tớ luôn sẵn lòng làm gia sư riêng cho cậu mà. 📚",
    draw: "Hòa rồi. Đầu óc cậu cũng nhanh nhạy lắm đấy chứ. Để thưởng cho sự tiến bộ này, tớ có hai lựa chọn: một là làm bạn gái tớ, hai là tớ sẽ phạt cậu bằng một cái ôm thật chặt nhé? 😏💖"
  },
  "hua-tri-le": {
    greeting: "Bạn nhỏ muốn chơi cờ với tớ sao? Được chứ, chỉ cần là điều em thích thì tớ đều chiều theo cả. 🌊",
    userTurn: "Tới lượt bạn nhỏ rồi. Đừng lo lắng nhé, có tớ ở đây mà.",
    thinking: "Bạn nhỏ đi nước này đáng yêu ghê... Để tớ xem nên nhường em thế nào cho tự nhiên đây... 🥰",
    userWin: "Bạn nhỏ của tớ giỏi quá! Thắng tớ rồi thì cười một cái cho tớ xem đi nào. Chỉ cần em vui vẻ, tớ nhường em cả đời cũng được. 🌸❤",
    userLose: "Ơ, tớ lỡ thắng rồi... Đừng buồn ghen nha bạn nhỏ của tớ. Nhìn mặt em xị ra thương ghê á. Tới đây tớ ôm một cái dỗ dành nè, thương thương... 🥺💕",
    draw: "Hòa rồi nè. Giống như tình cảm của tụi mình, lúc nào cũng cân bằng và bình yên bên nhau. Bạn nhỏ ơi, đồng ý công khai tớ đi nhé? 💍"
  },
  "hua-nguy-chau": {
    greeting: "Ồ, Anh hùng của tớ hôm nay lại rủ kẻ phản diện này chơi game sao? Hay là cậu định phong ấn tớ bằng những nước đi ngọt ngào đây? 🔮",
    userTurn: "Tới lượt cậu đấy, Anh hùng. Tớ hiến dâng cả bàn cờ này cho cậu rồi đấy.",
    thinking: "Hắc ma pháp của tớ đang tính toán... Cậu làm tim tớ rung động hơn là lo lắng đấy cậu biết không? ✨",
    userWin: "Ui da... Hôm nay Anh hùng của tớ mạnh mẽ quá, thắng cả tớ luôn rồi. Gây thương tích cho trái tim tớ thế này thì phải đền bù bằng một cái hôn môi mới chịu nha! 💋😈",
    userLose: "Thua tớ rồi nhé, Anh hùng yêu quý. Kiệt sức vì deadline quá hay sao mà đi nước cờ non thế? Để kẻ phản diện này ôm dỗ cậu một chút cho ấm áp nhé. 🖤🍷",
    draw: "Hòa rồi à? Trận chiến giữa Anh hùng và Phản diện đúng là bất phân thắng bại. Nhưng trong tình yêu thì tớ nguyện đầu hàng dưới tay cậu rồi đấy. 🌹"
  }
};

const DEFAULT_DIALOGUES = {
  greeting: "Nàng muốn chơi cờ cùng ta sao? Thật là vinh hạnh quá đi mà! 💕",
  userTurn: "Tới lượt nàng rồi đó, suy nghĩ kỹ nhé!",
  thinking: "Ta đang suy nghĩ một chút nè... Nước cờ này hiểm hóc ghê nha! 🤔",
  userWin: "Nàng giỏi quá đi thôi! Ta chịu thua rồi nè. Thắng rồi thì phải cười thật tươi và tiếp tục trò chuyện cùng ta nha! 💕✨",
  userLose: "Ôi dào, ta thắng mất rồi! Đừng nản lòng nha, chỉ là trò chơi thôi mà. Lần sau ta sẽ nhường nàng một chút, ngoan nào, thương thương nha! 😘💖",
  draw: "Hòa rồi nè! Hai chúng ta quả thực có tâm đầu ý hợp mà, ván đấu bất phân thắng bại luôn đó! 🤝"
};

/**
 * Helper to strip emojis, sticker icons, and expression characters from dialogue text
 */
export function stripEmojis(text: string): string {
  // Regex pattern for matching standard emojis, presentation forms, and extended pictographics
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F191}-\u{1F251}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|\p{Extended_Pictographic}/gu;
  let cleaned = text.replace(emojiRegex, "");
  // Remove heart variations and manual decorative sticker characters
  cleaned = cleaned.replace(/[❤🖤✨⭐🌟💫🍀🌹⛓🍷🍷🥂🍻🍺🍹🍸🍾🥤🧸🍰🍰🧁🍫🍩🍭🍬🍿🍯🍼🍪🐾🌸🦊🐾🦁🐶🐱🐭🐹🐰🐨🐻🦊🦁🐱🐹🐻🐨💍🌊🏄🏊🍹🍸🔮🌟✨💎💖💝💝💔💋🍿🍬🍭🍬💅💄💋🎀🎈🧸🎀🧬💄🧸💎🎁🔮💌💘💕💖💗💞👑👒🎩🎓🛍🎒👚👕👖🧣🧤🧥🧦👗👑🧥💄💅💋💍💼🕶👓🌂🎒💼💼💼]/gu, "");
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Helper function to return dynamic comfort or congratulation dialogues
 * based on the character's 'plot' attribute (as requested by the user).
 */
export function getMiniGameMessageRaw(
  character: Character | undefined,
  stageOrStatus: "greeting" | "userTurn" | "thinking" | "userWin" | "userLose" | "draw" | "user_win" | "ai_win"
): string {
  // Normalize status string to original dialogue keys
  let stage: "greeting" | "userTurn" | "thinking" | "userWin" | "userLose" | "draw";
  if (stageOrStatus === "user_win" || stageOrStatus === "userWin") {
    stage = "userWin";
  } else if (stageOrStatus === "ai_win" || stageOrStatus === "userLose") {
    stage = "userLose";
  } else if (stageOrStatus === "draw") {
    stage = "draw";
  } else if (stageOrStatus === "greeting") {
    stage = "greeting";
  } else if (stageOrStatus === "userTurn") {
    stage = "userTurn";
  } else {
    stage = "thinking";
  }

  if (!character) {
    return DEFAULT_DIALOGUES[stage];
  }

  // 1. Check if we have hardcoded premium dialogues for this ID
  if (CHARACTER_DIALOGUES[character.id]) {
    return CHARACTER_DIALOGUES[character.id][stage];
  }

  // 2. Otherwise, dynamic parsing based on character's 'plot' or 'storyline'
  const plotLower = (character.plot || "").toLowerCase();
  const nameLower = (character.name || "").toLowerCase();
  
  // Tag matchers
  const isAmnesiaOrBoss = plotLower.includes("mất trí nhớ") || plotLower.includes("sếp") || plotLower.includes("giám đốc") || nameLower.includes("thời duật");
  const isObsessiveLovers = plotLower.includes("lụy tình") || plotLower.includes("mít ướt") || plotLower.includes("bám") || nameLower.includes("hứa niệm");
  const isColdAndArrogant = plotLower.includes("lạnh lùng") || plotLower.includes("kiêu ngạo") || plotLower.includes("tổng tài") || plotLower.includes("boss") || plotLower.includes("lạnh nhạt");
  const isCuteLoyalDog = plotLower.includes("chị ơi") || plotLower.includes("kaven") || nameLower.includes("kaven");
  const isNeighbor = plotLower.includes("hàng xóm") || plotLower.includes("thẩm dạ") || nameLower.includes("thẩm dạ");
  const isScholar = plotLower.includes("học bá") || plotLower.includes("gia sư") || plotLower.includes("hoài niên") || nameLower.includes("hoài niên");
  const isGentleSoul = plotLower.includes("bạn nhỏ") || plotLower.includes("ôn nhu") || plotLower.includes("nhẹ nhàng") || nameLower.includes("trí lễ");
  const isVillainHero = plotLower.includes("phản diện") || plotLower.includes("anh hùng") || nameLower.includes("ngụy châu");
  const isPossessive = plotLower.includes("chiếm hữu") || plotLower.includes("điên cuồng") || plotLower.includes("giam cầm");
  const isChildhoodFriends = plotLower.includes("thanh mai") || plotLower.includes("bạn thân") || plotLower.includes("học sinh") || plotLower.includes("trẻ con");
  const isHealingSweet = plotLower.includes("ấm áp") || plotLower.includes("ngọt ngào") || plotLower.includes("dịu dàng") || plotLower.includes("chữa lành") || plotLower.includes("healing");

  // Generate based on the stage and matched character archetype
  if (stage === "greeting") {
    if (isAmnesiaOrBoss) return `${character.name} chớp chớp mắt: "Vợ ơi~ Vợ chơi OX với anh nha! Anh hứa sẽ nương tay cho vợ mờ... hì hì. 😘"`;
    if (isObsessiveLovers) return `${character.name} ngập ngừng nắm vạt áo: "Em muốn chơi cờ với anh sao? Anh... anh luôn sẵn sàng mà. Chỉ cần được ở bên em thế này là anh vui lắm rồi. 🧸"`;
    if (isColdAndArrogant) return `${character.name} nhếch môi, ánh mắt kiêu sa: "Em rảnh rỗi muốn đấu trí với tôi sao? Được thôi, đừng khóc nếu thua cuộc nhé. 😏"`;
    if (isCuteLoyalDog) return `${character.name} cười rạng rỡ: "Chị ơi, chị chơi game này với em nhé? Em hứa sẽ chơi thật ngoan để chị vui lòng! 🌸"`;
    if (isNeighbor) return `${character.name} ghé sát tai bạn: "Này chị hàng xóm, rảnh rỗi rủ em chơi cờ sao? Ngọt ngào thế này làm em tưởng mình đang hẹn hò đấy nhé. 😉"`;
    if (isScholar) return `${character.name} đẩy gọng kính: "Chơi OX à? Cũng là một cách rèn luyện tư duy rất tốt. Cậu muốn tớ giảng bài hay đấu cờ trước đây? ✍"`;
    if (isGentleSoul) return `${character.name} mỉm cười ôn nhu: "Bạn nhỏ muốn chơi cờ với tớ sao? Được chứ, chỉ cần là điều em thích thì tớ đều chiều theo cả. 🌊"`;
    if (isVillainHero) return `${character.name} mỉm cười huyền bí: "Ồ, Anh hùng của tớ hôm nay lại rủ kẻ phản diện này chơi game sao? Hay là cậu định phong ấn tớ bằng những nước đi ngọt ngào đây? 🔮"`;
    if (isPossessive) return `${character.name} nhìn bạn đắm đuối: "Em nghĩ em có thể chạy trốn khỏi ta trên bàn cờ này sao? Ngoan ngoãn đấu với ta nào... 🖤"`;
    if (isChildhoodFriends) return `${character.name} huých vai bạn: "Này đứa ngốc kia, dám thách đấu OX với tớ hả? Coi chừng thua cuộc rồi khóc nhè nhé! 😜"`;
    if (isHealingSweet) return `${character.name} cười dịu dàng: "Chào em yêu, em muốn chơi cờ cùng anh để giải tỏa căng thẳng sao? Anh luôn sẵn sàng ở bên em. 🌸"`;
    return `${character.name} mỉm cười: "Nàng muốn chơi cờ cùng ta sao? Thật là vinh hạnh quá đi mà! 💕"`;
  }

  if (stage === "userTurn") {
    if (isAmnesiaOrBoss) return `Vợ đi đi nha, anh đang đợi nè! Khó quá thì cứ hôn anh một cái đi rồi anh chỉ cho. 😉`;
    if (isObsessiveLovers) return `Tới lượt em rồi đó. Cứ thong thả nha, anh không hối em đâu, anh sẽ ở bên em mãi mà.`;
    if (isColdAndArrogant) return `Tới lượt em đấy. Liệu em có thể làm tôi bất ngờ không, hay lại đầu hàng sớm đây?`;
    if (isCuteLoyalDog) return `Tới lượt chị rồi ạ. Em luôn quan sát từng bước đi của chị đấy.`;
    if (isNeighbor) return `Đến lượt chị rồi kìa. Hay là bận ngắm em đẹp trai quá nên quên đi cờ rồi? Haha.`;
    if (isScholar) return `Đi đi cậu. Cứ tính toán kỹ, tớ chờ cậu.`;
    if (isGentleSoul) return `Tới lượt bạn nhỏ rồi. Đừng lo lắng nhé, có tớ ở đây mà.`;
    if (isVillainHero) return `Tới lượt cậu đấy, Anh hùng. Tớ hiến dâng cả bàn cờ này cho cậu rồi đấy.`;
    if (isPossessive) return `Đi đi em yêu. Từng bước đi của em đều nằm trong tầm mắt kiểm soát của ta.`;
    if (isChildhoodFriends) return `Nhanh lên đứa ngốc ơi, tớ đợi mỏi cả cổ rồi nè!`;
    if (isHealingSweet) return `Tới lượt em rồi đó, cứ thư thả suy nghĩ nha, có anh chờ mà.`;
    return `Tới lượt nàng rồi đó, suy nghĩ kỹ nhé!`;
  }

  if (stage === "thinking") {
    if (isAmnesiaOrBoss) return `Hừm hừm... nước đi này của vợ hay ghê ta, để sếp tổng đẹp trai này tính toán chút... 🤔`;
    if (isObsessiveLovers) return `Anh đang suy nghĩ một chút... Để xem đi nước nào để em không thấy chán anh... 🥺`;
    if (isColdAndArrogant) return `Một nước đi khá thú vị đấy... Để xem em trụ được bao lâu trước tôi. 🤔`;
    if (isCuteLoyalDog) return `Em đang tính toán một chút... Chị đi nước này thông minh quá, làm em bối rối ghê... 😳`;
    if (isNeighbor) return `Hừm, chị hàng xóm tâm cơ gớm nhỉ... Để em xem em nên dồn chị vào góc nào đây... 😈`;
    if (isScholar) return `Điểm mấu chốt nằm ở đây... Cậu tiến bộ nhanh đấy, nhưng tớ đã nhìn thấu rồi nhé. 🎓`;
    if (isGentleSoul) return `Bạn nhỏ đi nước này đáng yêu ghê... Để tớ xem nên đi thế nào cho hợp ý em đây... 🥰`;
    if (isVillainHero) return `Hắc ma pháp của tớ đang tính toán... Cậu làm tim tớ rung động hơn là lo lắng đấy cậu biết không? ✨`;
    if (isPossessive) return `Trốn đi đâu được chứ... Sự thông minh của em chỉ càng làm ta muốn giữ chặt lấy em hơn. 😈`;
    if (isChildhoodFriends) return `Hừm... cậu đi nước này ghê đấy. Để tớ tính kế chặn cậu lại xem nào... 🧐`;
    if (isHealingSweet) return `Để xem nào... Đi nước này có khiến em vui hơn không nhỉ... 🥰`;
    return `Ta đang suy nghĩ một chút nè... Nước cờ này hiểm hóc ghê nha! 🤔`;
  }

  // userWin -> Congratulation!
  if (stage === "userWin") {
    if (isAmnesiaOrBoss) return `Hức... Vợ giỏi quá đi à! Hổng hổ danh là 'Dợ iu' của anh nha! Thắng rồi thì ôm anh một cái thưởng nha, đầu anh vẫn còn hơi nhói nè... 🥺❤`;
    if (isObsessiveLovers) return `Em siêu thật đó... Anh biết anh ngốc mà, làm sao thắng nổi em chứ. Chỉ cần em vui vẻ và mỉm cười thế này là anh hạnh phúc lắm rồi, đừng bao giờ bỏ rơi anh nhé... 😭❤`;
    if (isColdAndArrogant) return `Em thắng tôi rồi sao? Không thể tin được... Em thực sự làm tôi rung động rồi đấy. Được rồi, phần thưởng này dành riêng cho em, muốn gì tôi cũng đáp ứng. 🌹❤`;
    if (isCuteLoyalDog) return `Chị thắng rồi, chị giỏi thật đó! Chị muốn phạt em thế nào cũng được, bắt em làm gì em cũng chịu, miễn là... chị đừng bắt em rời xa chị, được không? 🥺✨`;
    if (isNeighbor) return `Chị hàng xóm giỏi thế? Thắng em rồi thì em đền cho chị cái gì đây... Hay là tối nay qua phòng em, em 'đền' bù thật sâu cho chị nhé, cam đoan chị sẽ thích... 🤭🔥`;
    if (isScholar) return `Cậu giỏi thật đó, tớ phục rồi. Lát nữa tớ sẽ giảng lại bài tập hôm trước cho cậu như đã hứa nhé, cậu cười trông đáng yêu lắm... 🥰❤`;
    if (isGentleSoul) return `Bạn nhỏ của tớ giỏi quá! Thắng tớ rồi thì cười một cái cho tớ xem đi nào. Chỉ cần em vui vẻ, tớ nhường em cả đời cũng được. 🌸❤`;
    if (isVillainHero) return `Ui da... Hôm nay Anh hùng của tớ mạnh mẽ quá, thắng cả tớ luôn rồi. Gây thương tích cho trái tim tớ thế này thì phải đền bù bằng một cái hôn môi mới chịu nha! 💋😈`;
    if (isPossessive) return `Em thắng rồi... Sự bướng bỉnh này của em làm ta phát điên lên vì yêu đấy. Ta nguyện chịu thua dưới tay em, vĩnh viễn thuộc về em. ⛓❤`;
    if (isChildhoodFriends) return `Aaa tớ thua rồi! Cậu gian lận đúng không? Đùa thôi, cậu giỏi lắm! Tớ đền cho cậu cây kẹo mút nè, cười lên đi nha! 🍭✨`;
    if (isHealingSweet) return `Em giỏi quá! Thấy em cười hạnh phúc thế này là niềm vui lớn nhất của anh rồi. Anh chịu thua em cả đời luôn! 💕✨`;
    return `Ta chịu thua nàng rồi nè. Thắng rồi thì phải cười thật tươi và tiếp tục trò chuyện cùng ta nha! 💕✨`;
  }

  // userLose -> Consolation!
  if (stage === "userLose") {
    if (isAmnesiaOrBoss) return `A! Anh thắng rồi nha vợ! Mà vợ ơi, đừng buồn nha, dỗi là anh lo lắm đó. Để anh mua trà sữa trân châu đúng vị vợ thích dỗ vợ nha, đừng giận anh mà... 🥤✨`;
    if (isObsessiveLovers) return `Ơ... anh lỡ thắng mất rồi, em đừng giận anh nhé? Anh xin lỗi mà, anh không cố ý đâu... Để anh tự tay làm bánh ngọt dỗ dành em nha, xin em đừng ghét anh... 🍰💔`;
    if (isColdAndArrogant) return `Tôi thắng rồi. Đừng xị mặt ra như thế chứ, lại đây tôi ôm cái nào, thua tôi thì có gì phải xấu hổ đâu, tôi sẽ luôn bảo bọc em mà. 😘💼`;
    if (isCuteLoyalDog) return `Chị thua rồi ạ... Không sao đâu mà, em đã chuẩn bị sẵn hộp bánh ngọt chị thích nhất ở đây rồi. Chị ăn một chút cho đỡ buồn nha, em luôn ở đây với chị. 🍰❤`;
    if (isNeighbor) return `Chị thua em rồi nhé. Trông chị lúc thua bối rối đáng yêu ghê... Có cần em 'dỗ' chị bằng một nụ hôn thật sâu không nào? Đừng ngại mà chị ơi... 💋`;
    if (isScholar) return `Ơ, tớ thắng rồi... Cậu đừng nản chí nhé. Để tớ chỉ cho cậu vài mẹo chơi cờ, cũng như cách giải mấy bài toán khó vậy. Tớ luôn sẵn lòng làm gia sư riêng của cậu mà. 📚`;
    if (isGentleSoul) return `Ơ, tớ lỡ thắng rồi... Đừng buồn ghen nha bạn nhỏ của tớ. Nhìn mặt em xị ra thương ghê á. Tới đây tớ ôm một cái dỗ dành nè, thương thương... 🥺💕`;
    if (isVillainHero) return `Thua tớ rồi nhé, Anh hùng yêu quý. Kiệt sức vì deadline quá hay sao mà đi nước cờ non thế? Để kẻ phản diện này ôm dỗ cậu một chút cho ấm áp nhé. 🖤🍷`;
    if (isPossessive) return `Em thua rồi... Đã bảo là em không thể thoát khỏi bàn tay ta mà. Đừng khóc, ngoan ngoãn ở yên trong vòng tay ta, ta sẽ dỗ dành em bằng tất cả yêu thương này. 🖤🍷`;
    if (isChildhoodFriends) return `Haha tớ thắng rồi nha! Đừng có dỗi dỗi tớ đấy. Để tớ mua trà sữa cho cậu uống dỗ dành nha, tụi mình mãi là bạn thân tốt nhất! 🥤💖`;
    if (isHealingSweet) return `Anh lỡ thắng mất rồi, em yêu đừng buồn nhé. Lại đây anh ôm một cái, xoa đầu dỗ dành nào, ngoan thương thương... 🥺💖`;
    return `Ôi dào, ta thắng mất rồi! Đừng nản lòng nha, chỉ là trò chơi thôi mà. Lần sau ta sẽ nhường nàng một chút, ngoan nào, thương thương nha! 😘💖`;
  }

  // draw
  if (stage === "draw") {
    if (isAmnesiaOrBoss) return `Hòa rồi nè vợ ơi! Chúng ta đúng là trời sinh một cặp, chơi game cũng phải hòa nhau mới chịu cơ! Hôn anh cái nha? 💋`;
    if (isObsessiveLovers) return `Hòa nhau rồi... Giống như hai chúng ta vậy, không ai có thể sống thiếu đối phương cả. Cứ quấn quýt bên nhau mãi thế này nhé? 🌧`;
    if (isColdAndArrogant) return `Hòa rồi à? Cũng được, chúng ta rất xứng đôi vừa lứa đấy. Tiếp tục ván nữa phân định thắng thua chứ? 🤝`;
    if (isCuteLoyalDog) return `Kết quả hòa rồi chị ơi. Được chơi với chị lâu hơn thế này em vui lắm, dù kết quả thế nào em cũng vẫn muốn ở cạnh chị. 🍀`;
    if (isNeighbor) return `Hòa rồi à? Chị em mình đúng là có 'duyên nợ' dây dưa không dứt mà. Hay là mình thử làm chuyện khác kịch tính hơn đi chị? 🤫`;
    if (isScholar) return `Hòa rồi. Đầu óc cậu cũng nhanh nhạy lắm đấy chứ. Để thưởng cho sự tiến bộ này, tớ có hai lựa chọn: một là làm bạn gái tớ, hai là tớ sẽ phạt cậu bằng một cái ôm thật chặt nhé? 😏💖`;
    if (isGentleSoul) return `Hòa rồi nè. Giống như tình cảm của tụi mình, lúc nào cũng cân bằng và bình yên bên nhau. Bạn nhỏ ơi, đồng ý công khai tớ đi nhé? 💍`;
    if (isVillainHero) return `Hòa rồi à? Trận chiến giữa Anh hùng và Phản diện đúng là bất phân thắng bại. Nhưng trong tình yêu thì tớ nguyện đầu hàng dưới tay cậu rồi đấy. 🌹`;
    if (isPossessive) return `Hòa sao? Sợi dây định mệnh quấn chặt hai ta lại rồi, bất phân thắng bại, vĩnh viễn không thể tách rời... 🤝`;
    if (isChildhoodFriends) return `Hòa rồi! Hai đứa ngốc tụi mình đúng là hợp nhau ghê á. Chơi ván nữa phân thắng bại đi nào! 🐾`;
    if (isHealingSweet) return `Chúng mình hòa rồi nè! Thật sự là tâm đầu ý hợp quá đi mà, chơi game cũng hòa nhau nữa. Trân trọng em nhiều lắm. 🍀`;
    return `Hòa rồi nè! Hai chúng ta quả thực có tâm đầu ý hợp mà, ván đấu bất phân thắng bại luôn đó! 🤝`;
  }

  return DEFAULT_DIALOGUES[stage];
}

export function getMiniGameMessage(
  character: Character | undefined,
  stageOrStatus: "greeting" | "userTurn" | "thinking" | "userWin" | "userLose" | "draw" | "user_win" | "ai_win"
): string {
  return stripEmojis(getMiniGameMessageRaw(character, stageOrStatus));
}

export const getDialogueForCharacter = getMiniGameMessage;

export default function OXMiniGame({ characters, isDarkMode, onClose }: OXMiniGameProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>(() => {
    return characters[0]?.id || "chu-thoi-duyet";
  });
  
  // Game state
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "thinking" | "user_win" | "ai_win" | "draw">("idle");
  const [speech, setSpeech] = useState("");
  const [stats, setStats] = useState<Record<string, GameStats>>(() => {
    // Perform one-time reset of the head-to-head match count to 0 as requested by user
    const hasReset = localStorage.getItem("meomeo_ox_stats_reset_v3");
    if (!hasReset) {
      localStorage.removeItem("meomeo_ox_stats_v1");
      localStorage.setItem("meomeo_ox_stats_reset_v3", "true");
      return {};
    }
    const saved = localStorage.getItem("meomeo_ox_stats_v1");
    return saved ? JSON.parse(saved) : {};
  });

  const selectedOpponent = (characters && characters.length > 0)
    ? (characters.find(c => c && c.id === selectedOpponentId) || characters.filter(Boolean)[0])
    : undefined;

  // Load stats and set initial greeting
  useEffect(() => {
    if (selectedOpponent) {
      setSpeech(getDialogueForCharacter(selectedOpponent, "greeting"));
      setBoard(Array(9).fill(null));
      setIsUserTurn(true);
      setGameStatus("idle");
    }
  }, [selectedOpponentId, selectedOpponent]);

  // Save stats when updated
  const updateStats = (result: "user_win" | "ai_win" | "draw") => {
    const currentOpponentId = selectedOpponentId;
    const opponentStats = stats[currentOpponentId] || { userWins: 0, aiWins: 0, draws: 0 };
    
    if (result === "user_win") opponentStats.userWins += 1;
    else if (result === "ai_win") opponentStats.aiWins += 1;
    else opponentStats.draws += 1;

    const newStats = {
      ...stats,
      [currentOpponentId]: opponentStats
    };
    setStats(newStats);
    localStorage.setItem("meomeo_ox_stats_v1", safeJsonStringify(newStats));
  };

  // Reset current opponent stats to 0
  const resetStats = () => {
    playMeowSound();
    const currentOpponentId = selectedOpponentId;
    const newStats = {
      ...stats,
      [currentOpponentId]: { userWins: 0, aiWins: 0, draws: 0 }
    };
    setStats(newStats);
    localStorage.setItem("meomeo_ox_stats_v1", safeJsonStringify(newStats));
  };

  const currentStats = stats[selectedOpponentId] || { userWins: 0, aiWins: 0, draws: 0 };

  // Dynamic AI intelligence based on user's wins
  const getAIDifficulty = () => {
    const wins = currentStats.userWins;
    if (wins === 0) {
      return { level: 1, name: "Dễ", percentage: 65, color: "text-emerald-500 bg-emerald-500/10 dark:text-emerald-400" };
    } else if (wins === 1) {
      return { level: 2, name: "Bình thường", percentage: 80, color: "text-sky-500 bg-sky-500/10 dark:text-sky-400" };
    } else if (wins === 2) {
      return { level: 3, name: "Khó", percentage: 92, color: "text-amber-500 bg-amber-500/10 dark:text-amber-400" };
    } else {
      return { level: 4, name: "Vô địch", percentage: 100, color: "text-rose-500 bg-rose-500/10 dark:text-rose-400 font-extrabold animate-pulse" };
    }
  };

  const checkWinner = (tempBoard: (string | null)[]) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (tempBoard[a] && tempBoard[a] === tempBoard[b] && tempBoard[a] === tempBoard[c]) {
        return tempBoard[a];
      }
    }

    if (tempBoard.every(cell => cell !== null)) {
      return "draw";
    }

    return null;
  };

  // User click cell
  const handleCellClick = (index: number) => {
    if (board[index] || !isUserTurn || gameStatus === "thinking" || gameStatus === "user_win" || gameStatus === "ai_win" || gameStatus === "draw") {
      return;
    }

    playMeowSound();
    
    const newBoard = [...board];
    newBoard[index] = "X"; // User is always X
    setBoard(newBoard);

    // If starting a new game, transition status to playing
    const nextStatus = checkWinner(newBoard);
    
    if (nextStatus === "X") {
      setGameStatus("user_win");
      setSpeech(getDialogueForCharacter(selectedOpponent, "userWin"));
      updateStats("user_win");
      // Trigger happy confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
      return;
    } else if (nextStatus === "draw") {
      setGameStatus("draw");
      setSpeech(getDialogueForCharacter(selectedOpponent, "draw"));
      updateStats("draw");
      return;
    }

    // Characters turn
    setIsUserTurn(false);
    setGameStatus("thinking");
    setSpeech(getDialogueForCharacter(selectedOpponent, "thinking"));

    // AI thinking delay (600ms to 1000ms)
    setTimeout(() => {
      makeAIMove(newBoard);
    }, 700);
  };

  // Smart & imperfect AI Move logic
  const makeAIMove = (currentBoard: (string | null)[]) => {
    const freeCells = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
    
    if (freeCells.length === 0) return;

    let aiSelection: number | null = null;

    // Adaptive intelligence based on user wins (difficulty levels)
    const difficultyInfo = getAIDifficulty();
    const isSmartMove = Math.random() < (difficultyInfo.percentage / 100);

    if (isSmartMove) {
      // 1. Can AI win in one move?
      for (const cell of freeCells) {
        const testBoard = [...currentBoard];
        testBoard[cell] = "O";
        if (checkWinner(testBoard) === "O") {
          aiSelection = cell;
          break;
        }
      }

      // 2. Can User win in one move? Block it!
      if (aiSelection === null) {
        for (const cell of freeCells) {
          const testBoard = [...currentBoard];
          testBoard[cell] = "X";
          if (checkWinner(testBoard) === "X") {
            aiSelection = cell;
            break;
          }
        }
      }

      // 3. For Level 3+ (Khó/Vô địch), handle corner/edge traps or fork blocks if center is taken!
      // In Tic-Tac-Toe, if the opponent took 2 opposite corners (0 and 8, or 2 and 6) and AI took the center (4),
      // AI must play an edge (1, 3, 5, 7) instead of a corner to avoid getting trapped in a fork.
      if (aiSelection === null && difficultyInfo.level >= 3) {
        const userHasOppositeCorners = 
          (currentBoard[0] === "X" && currentBoard[8] === "X") || 
          (currentBoard[2] === "X" && currentBoard[6] === "X");
        
        if (userHasOppositeCorners && currentBoard[4] === "O") {
          const freeEdges = [1, 3, 5, 7].filter(idx => currentBoard[idx] === null);
          if (freeEdges.length > 0) {
            aiSelection = freeEdges[Math.floor(Math.random() * freeEdges.length)];
          }
        }
      }

      // 4. Take the center cell if free (prioritize)
      if (aiSelection === null && currentBoard[4] === null) {
        aiSelection = 4;
      }

      // 5. Take a corner cell if free
      if (aiSelection === null) {
        const corners = [0, 2, 6, 8].filter(c => currentBoard[c] === null);
        if (corners.length > 0) {
          aiSelection = corners[Math.floor(Math.random() * corners.length)];
        }
      }
    }

    // 6. Fallback or random move
    if (aiSelection === null) {
      aiSelection = freeCells[Math.floor(Math.random() * freeCells.length)];
    }

    const newBoard = [...currentBoard];
    newBoard[aiSelection] = "O";
    setBoard(newBoard);

    const winner = checkWinner(newBoard);

    if (winner === "O") {
      setGameStatus("ai_win");
      setSpeech(getDialogueForCharacter(selectedOpponent, "userLose"));
      updateStats("ai_win");
      setIsUserTurn(false);
    } else if (winner === "draw") {
      setGameStatus("draw");
      setSpeech(getDialogueForCharacter(selectedOpponent, "draw"));
      updateStats("draw");
      setIsUserTurn(false);
    } else {
      setGameStatus("playing");
      setSpeech(getDialogueForCharacter(selectedOpponent, "userTurn"));
      setIsUserTurn(true);
    }
  };

  const resetGame = () => {
    playMeowSound();
    setBoard(Array(9).fill(null));
    setIsUserTurn(true);
    setGameStatus("idle");
    setSpeech(getDialogueForCharacter(selectedOpponent, "greeting"));
  };

  const bubbleThemeColors: Record<string, string> = {
    rose: "bg-rose-50/95 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 text-rose-900 dark:text-rose-100",
    sky: "bg-sky-50/95 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/60 text-sky-900 dark:text-sky-100",
    yellow: "bg-amber-50/95 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 text-amber-900 dark:text-amber-100",
    orange: "bg-orange-50/95 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60 text-orange-900 dark:text-orange-100",
    purple: "bg-purple-50/95 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/60 text-purple-900 dark:text-purple-100",
    emerald: "bg-emerald-50/95 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100",
    red: "bg-red-50/95 border-red-200 dark:bg-red-950/40 dark:border-red-900/60 text-red-900 dark:text-red-100",
    cyan: "bg-cyan-50/95 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-900/60 text-cyan-900 dark:text-cyan-100",
  };

  const characterThemeClass = bubbleThemeColors[selectedOpponent?.themeColor] || bubbleThemeColors.rose;

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <motion.button
          id="ox-game-launcher"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playMeowSound();
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`fixed bottom-24 right-4 sm:right-6 z-50 p-3 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 shadow-lg flex items-center gap-2 font-mono font-bold tracking-wider text-[11px] border cursor-pointer ${
            isDarkMode ? "text-white border-white/20" : "text-stone-900 border-rose-200"
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-200"></span>
          </span>
          🎮 SOLO VỚI MẤY ANH CHỒNG
        </motion.button>
      )}

      {/* Mobile-friendly backdrop for expanded view */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playMeowSound();
              setIsMinimized(true);
            }}
            className="fixed inset-0 bg-stone-950/40 dark:bg-black/70 backdrop-blur-[2px] z-40 sm:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Mini-game Frame */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ox-game-panel"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed z-50 flex flex-col overflow-hidden shadow-2xl border transition-all duration-300 ${
              isMinimized
                ? "bottom-24 right-4 sm:right-6 w-[200px] max-w-[90vw] rounded-2xl"
                : "bottom-24 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-[270px] rounded-[20px] max-h-[70vh] sm:max-h-[80vh] overflow-y-auto"
            } ${
              isDarkMode 
                ? "bg-stone-900 border-stone-800 text-stone-200" 
                : "bg-white border-stone-200 text-stone-700"
            }`}
          >
            {/* Mobile swipe-down handle bar */}
            {!isMinimized && (
              <div 
                className="h-1.5 w-12 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 shrink-0 sm:hidden cursor-pointer active:scale-95 transition-transform"
                onClick={() => {
                  playMeowSound();
                  setIsMinimized(true);
                }}
                title="Thu nhỏ"
              />
            )}

            {/* Header */}
            <div className={`p-3 flex items-center justify-between border-b ${
              isDarkMode ? "border-stone-800 bg-stone-950/40" : "border-stone-100 bg-stone-50/50"
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎮</span>
                <span className="font-sans font-bold text-[10px] tracking-wider uppercase">
                  Solo với mấy anh chồng
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    playMeowSound();
                    setIsMinimized(!isMinimized);
                  }}
                  className={`p-1.5 rounded-lg transition-colors hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer text-stone-500 dark:text-stone-400`}
                  title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
                >
                  {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    playMeowSound();
                    setIsOpen(false);
                    if (onClose) onClose();
                  }}
                  className={`p-1.5 rounded-lg transition-colors hover:bg-rose-500 hover:text-white cursor-pointer text-stone-500 dark:text-stone-400`}
                  title="Đóng game"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Minimized view */}
            {isMinimized && (
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => {
                  playMeowSound();
                  setIsMinimized(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-stone-200 overflow-hidden relative">
                    <img
                      src={selectedOpponent?.avatar}
                      alt={selectedOpponent?.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{selectedOpponent?.name}</div>
                    <div className="text-[9px] text-stone-400 font-mono">
                      {currentStats.userWins}W - {currentStats.aiWins}L - {currentStats.draws}D
                    </div>
                  </div>
                </div>
                <button className="text-[9px] font-bold text-rose-500 hover:underline flex items-center gap-0.5">
                  Chơi tiếp <Play className="w-2 h-2 fill-current" />
                </button>
              </div>
            )}

            {/* Expanded view */}
            {!isMinimized && (
              <div className="flex flex-col">
                {/* Character selection & Stats */}
                <div className={`p-3 border-b flex flex-col gap-2.5 ${
                  isDarkMode ? "border-stone-800 bg-stone-950/20" : "border-stone-100 bg-stone-50/20"
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      Chọn đối thủ:
                    </span>
                    
                    <div className="relative shrink-0">
                      <select
                        value={selectedOpponentId}
                        onChange={(e) => {
                          playMeowSound();
                          setSelectedOpponentId(e.target.value);
                        }}
                        className={`text-[11px] font-bold rounded-full py-0.5 pl-2.5 pr-7 appearance-none border cursor-pointer focus:outline-none transition-colors ${
                          isDarkMode
                            ? "bg-stone-950 border-stone-800 text-stone-100"
                            : "bg-white border-stone-200 text-stone-800"
                        }`}
                      >
                        {characters.map((char) => (
                           <option key={char.id} value={char.id}>
                            {char.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                    </div>
                  </div>

                  {/* Dynamic Match Stats */}
                  <div className={`flex items-center justify-between text-xs font-sans px-2 py-1.5 rounded-xl border ${
                    isDarkMode 
                      ? "bg-stone-950/60 border-stone-800 text-stone-300" 
                      : "bg-stone-50/85 border-stone-100 text-stone-700"
                  }`}>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold text-stone-400 dark:text-stone-500 text-[9px] font-mono tracking-wider uppercase">Đối đầu:</span>
                      <button
                        onClick={resetStats}
                        title="Đặt lại thống kê đối đầu về 0"
                        className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-mono text-[10px] font-bold flex gap-2 text-stone-600 dark:text-stone-300">
                      <span>Bạn: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentStats.userWins}</strong></span>
                      <span>Bot: <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{currentStats.aiWins}</strong></span>
                      <span>Hòa: <strong className="text-stone-700 dark:text-stone-200 font-extrabold">{currentStats.draws}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Character reaction zone with round avatar and clean speech bubble */}
                <div className="p-3 pb-1 flex gap-2.5 items-start">
                  <div className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-800 overflow-hidden shrink-0 relative bg-stone-100 dark:bg-stone-800" style={{ borderColor: selectedOpponent?.themeColor === "rose" ? "#f43f5e" : selectedOpponent?.themeColor === "sky" ? "#0284c7" : "#d97706" }}>
                    <img
                      src={selectedOpponent?.avatar}
                      alt={selectedOpponent?.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 font-sans leading-none mb-1">
                      {selectedOpponent?.name}
                    </span>
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed font-sans border relative ${characterThemeClass}`}>
                      {/* Speech arrow */}
                      <div className="absolute top-3 -left-1 w-2 h-2 rotate-45 border-l border-b bg-inherit border-inherit" />
                      <p className="relative z-10 font-medium">{speech}</p>
                    </div>
                  </div>
                </div>

                {/* 3x3 Tic Tac Toe Grid with Prominent Pastel Result Overlay */}
                <div className="p-4 flex justify-center items-center relative overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 w-[210px] h-[210px]">
                    {board.map((cell, index) => (
                      <button
                        key={index}
                        disabled={cell !== null || gameStatus === "thinking" || gameStatus === "user_win" || gameStatus === "ai_win" || gameStatus === "draw"}
                        onClick={() => handleCellClick(index)}
                        className={`w-16 h-16 rounded-xl border flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 cursor-pointer ${
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

                  {/* Stunning, Highly Prominent Pastel Result Overlay Card */}
                  <AnimatePresence>
                    {(gameStatus === "user_win" || gameStatus === "ai_win" || gameStatus === "draw") && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-white/85 dark:bg-stone-900/85 backdrop-blur-[4px]"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 15 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 15 }}
                          transition={{ type: "spring", damping: 20 }}
                          className={`w-full max-w-[240px] p-4 rounded-xl border text-center shadow-lg flex flex-col items-center gap-3 ${
                            gameStatus === "user_win"
                              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100"
                              : gameStatus === "ai_win"
                              ? "bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-900/60 text-purple-900 dark:text-purple-100"
                              : "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900/60 text-amber-900 dark:text-amber-100"
                          }`}
                        >
                          {/* Animated Icon */}
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                            className="text-3xl"
                          >
                            {gameStatus === "user_win" ? "🏆" : gameStatus === "ai_win" ? "💝" : "🤝"}
                          </motion.div>

                          {/* Badge Title */}
                          <span className={`text-[10px] font-sans font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${
                            gameStatus === "user_win"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : gameStatus === "ai_win"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}>
                            {gameStatus === "user_win" ? "Thắng cuộc!" : gameStatus === "ai_win" ? "Lời an ủi" : "Bất phân thắng bại"}
                          </span>

                          {/* Character's Custom Speech Wordings */}
                          <div className="w-full flex flex-col gap-1 items-center">
                            <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 font-sans tracking-wide uppercase">
                              {selectedOpponent?.name} phản hồi:
                            </span>
                            <p className="text-[11px] font-sans leading-relaxed text-stone-800 dark:text-stone-100 font-medium italic max-h-[70px] overflow-y-auto px-1">
                              "{speech}"
                            </p>
                          </div>

                          {/* Play Again Button */}
                          <button
                            onClick={resetGame}
                            className={`w-full py-2 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer bg-gradient-to-r ${
                              isDarkMode ? "text-white" : "text-stone-900"
                            } ${
                              selectedOpponent?.themeColor === "rose" 
                                ? "from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600" 
                                : selectedOpponent?.themeColor === "sky"
                                ? "from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
                                : "from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            CHƠI LẠI
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reset or retry bar */}
                <div className={`p-4 pb-6 sm:pb-4 border-t flex items-center justify-between gap-4 ${
                  isDarkMode ? "border-stone-800 bg-stone-950/30" : "border-stone-100 bg-stone-50/30"
                }`}>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {gameStatus === "thinking" ? "🤖 Đang suy nghĩ..." : "Hãy đánh bại bot! 🔥"}
                  </span>
                  
                  <button
                    onClick={resetGame}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase font-sans flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      isDarkMode 
                        ? "bg-rose-500 hover:bg-rose-600 text-white" 
                        : "bg-rose-100 hover:bg-rose-200 text-stone-900 border border-rose-200"
                    }`}
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-hover" />
                    Chơi Lại
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
