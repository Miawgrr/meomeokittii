import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  RotateCcw, 
  UserCheck, 
  Play, 
  HelpCircle, 
  TrendingUp, 
  Check, 
  X,
  Volume2,
  Sparkles
} from "lucide-react";
import { Character } from "../types";
import { playMeowSound, playWinSound } from "../utils/audio";
import { formatImageUrl, isImageUrl } from "../utils/image";
import confetti from "canvas-confetti";

interface TienLenGameProps {
  characters: Character[];
  isDarkMode: boolean;
  onBack: () => void;
}

// Card structure definition
interface Card {
  id: string;
  suit: "spade" | "club" | "diamond" | "heart"; // Bích, Chuồn, Rô, Cơ
  rank: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "2";
  rankVal: number; // 3 to 15 (3 = 3, 10 = 10, J = 11, Q = 12, K = 13, A = 14, 2 = 15)
  suitVal: number; // spade = 1 (weakest), club = 2, diamond = 3, heart = 4 (strongest)
  code: string;
}

interface Player {
  id: string;
  name: string;
  avatar?: string;
  hand: Card[];
  isBot: boolean;
  passed: boolean;
  finishedPlace?: number; // 1st, 2nd, 3rd, 4th
}

interface Combo {
  type: "single" | "pair" | "triple" | "straight" | "four_of_a_kind" | "none";
  cards: Card[];
  highestCard: Card;
}

const SUIT_SYMBOLS = {
  spade: { char: "♠", color: "text-blue-700 dark:text-blue-500", name: "Bích" },
  club: { char: "♣", color: "text-emerald-700 dark:text-emerald-500", name: "Chuồn" },
  diamond: { char: "♦", color: "text-red-500 dark:text-red-400", name: "Rô" },
  heart: { char: "♥", color: "text-rose-600 dark:text-rose-500", name: "Cơ" },
};

const DEFAULT_BOT_PERSONALITIES = [
  {
    id: "tuong-tu-mac",
    name: "Tưởng Tư Mạc",
    avatar: "https://drive.google.com/file/d/1PnCNJmTgbDOk2hawQMnm1ztgz0jtuk_c/view?usp=sharing",
    greeting: "Chị ơi... đánh bài cùng em nhen, em hứa sẽ không nhường chị đâu đó! 🥺🍬",
    phrases: {
      play: [
        "Em ra đôi này nè chị iu! ✨",
        "Có ai đè được lá này của em hông? 🥺",
        "Cố lên em sắp hết bài rùi á!",
        "Chị xoa đầu thưởng cho em đi nhen!"
      ],
      pass: ["Hức... từ từ đã nhen em bỏ lượt á... 🍼", "Lá này mạnh quá, em nhịn vậy 🥺"],
      win: ["Yayyy! Em thắng rồi nhen chị iu! Em giỏi quá đúng không nè? 🥰🍬"]
    }
  },
  {
    id: "chu-thoi-duyet",
    name: "Chu Thời Duật",
    avatar: "https://drive.google.com/file/d/1YBJisJphFQGtCoMUZ1I2kMlz1EX5iA1x/view?usp=drivesdk",
    greeting: "Dợ iu ơi! Solo bài tây với anh không? Ai thua là phải thơm một cái đó nha! 😉💋",
    phrases: {
      play: [
        "Chiêu này của sếp tổng thế nào? Đỡ đi dợ iu! 😎",
        "Tứ quý hay đôi hai gì anh cũng cân hết!",
        "Vợ thấy anh đánh đỉnh không? Cưới anh đi thui!",
        "Lá bài quyền lực nhen!"
      ],
      pass: ["Hừm... lượt này anh nhường vợ đó nha! 😘", "Bài xấu quá, sếp tổng bỏ lượt!"],
      win: ["Hahaha! Anh thắng rồi nhé dợ iu! Mau thơm anh một cái nồng cháy nào! 💋🔥"]
    }
  },
  {
    id: "co-hua-niem",
    name: "Cố Hứa Niệm",
    avatar: "https://drive.google.com/file/d/1d3DasVL_vrZwVVYdbBsksmFyq413jU0M/view?usp=drivesdk",
    greeting: "Em muốn chơi bài Tiến Lên cùng anh sao? Anh... anh sẽ cố gắng chơi thật tốt để em vui... 🧸",
    phrases: {
      play: [
        "Anh xin lỗi nhen, anh đánh lá này... 🧸",
        "Hy vọng em sẽ không giận khi anh đi con này nhen...",
        "Anh đi sảnh này nè em yêu...",
        "Anh đánh nhẹ nhàng thui nha."
      ],
      pass: ["Anh... anh không đè nổi rồi, anh bỏ lượt nhen 😭💔", "Lá này của em mạnh quá, anh xin chịu thua lượt này."],
      win: ["Ơ... anh lỡ hết bài trước mất rồi. Em đừng giận anh nhen, anh làm bánh ngọt đền em nha! 🍰💔"]
    }
  },
  {
    id: "kaiza-tachibana",
    name: "Kaiza Tachibana",
    avatar: "https://drive.google.com/file/d/1HexzSXlFJIT8E03QIrKr8RAPXQ2FFylG/view?usp=drivesdk",
    greeting: "Mèo nhỏ dám thách đấu Tiến Lên với tôi à? Ai thua phải ngoan ngoãn nghe lời cả đêm nhé... 😏🥂",
    phrases: {
      play: [
        "Mèo nhỏ đỡ nổi lá này của tôi không? 😏",
        "Bài của em nằm trong tầm kiểm soát của tôi rồi.",
        "Đi sảnh này để dứt điểm ván bài nào... 🦊🍷",
        "Chặn đứng em lại nhé!"
      ],
      pass: ["Hửm... tha cho em lượt này đấy mèo nhỏ. 😉", "Bỏ lượt. Tôi muốn xem em thể hiện thế nào."],
      win: ["Thua rồi nhé mèo nhỏ! Giờ thì ngoan ngoãn thực hiện hình phạt tối nay đi nào... 🥂🖤"]
    }
  }
];

// Helper to generate a full deck
const generateDeck = (): Card[] => {
  const suits: Card["suit"][] = ["spade", "club", "diamond", "heart"];
  const ranks: Card["rank"][] = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
  const deck: Card[] = [];

  ranks.forEach((rank, rIdx) => {
    suits.forEach((suit, sIdx) => {
      deck.push({
        id: `${rank}_${suit}`,
        suit,
        rank,
        rankVal: rIdx + 3, // 3 to 15
        suitVal: sIdx + 1, // 1 to 4
        code: `${rank}_${suit}`
      });
    });
  });

  return deck;
};

// Helper sound synthetics for cards
const playCardSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Low, short noise / frequency sweep for a card flick
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {}
};

export default function TienLenGame({ characters, isDarkMode, onBack }: TienLenGameProps) {
  const [gameState, setGameState] = useState<"SETUP" | "PLAYING" | "FINISHED">("SETUP");
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponentsPool, setOpponentsPool] = useState<any[]>([]);
  const [selectedOpponentIds, setSelectedOpponentIds] = useState<string[]>([]);
  
  // Gameplay State
  const [activeCombo, setActiveCombo] = useState<Combo | null>(null);
  const [turn, setTurn] = useState<number>(0);
  const [lastPlayIndex, setLastPlayIndex] = useState<number>(-1);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [botChat, setBotChat] = useState<{ [key: number]: string }>({});
  const [showRules, setShowRules] = useState(false);
  const [historyFinished, setHistoryFinished] = useState<string[]>([]);

  // Sound toggler
  const [isMuted, setIsMuted] = useState(false);

  // Initialize pool of available characters (either real or defaults)
  useEffect(() => {
    // Filter out invalid entries and use avatars
    const realOpponents = characters.map(c => ({
      id: c.id || Math.random().toString(),
      name: c.name,
      avatar: formatImageUrl(c.avatar) || "👤",
      greeting: `Hãy cùng đấu bài với tớ nhen! 💖`,
      phrases: {
        play: ["Đỡ lá này nè! ✨", "Sắp hết bài rùi nha!", "Có sảnh đẹp quá nè!", "Đi con này nhé!"],
        pass: ["Nhường các nàng đó nha! ✨", "Bài xấu quá tớ bỏ lượt nhen..."],
        win: ["Tuyệt vời quá! Tớ thắng rùi nhen! 🥰🏆"]
      }
    }));

    // Combine with defaults to ensure we have plenty of unique characters
    const uniquePool = [...realOpponents];
    DEFAULT_BOT_PERSONALITIES.forEach(dbot => {
      const existingIdx = uniquePool.findIndex(p => {
        const idMatch = p.id.toLowerCase() === dbot.id.toLowerCase();
        const normalizeName = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        const nameMatch = normalizeName(p.name) === normalizeName(dbot.name);
        return idMatch || nameMatch;
      });

      const formattedDbotAvatar = formatImageUrl(dbot.avatar);

      if (existingIdx !== -1) {
        uniquePool[existingIdx] = {
          ...uniquePool[existingIdx],
          avatar: isImageUrl(uniquePool[existingIdx].avatar) && !uniquePool[existingIdx].avatar.includes("👤")
            ? uniquePool[existingIdx].avatar
            : (formattedDbotAvatar || uniquePool[existingIdx].avatar),
          greeting: dbot.greeting,
          phrases: dbot.phrases
        };
      } else {
        uniquePool.push({
          ...dbot,
          avatar: formattedDbotAvatar
        });
      }
    });

    setOpponentsPool(uniquePool);
    
    // Default select first 3
    if (uniquePool.length >= 3) {
      setSelectedOpponentIds([uniquePool[0].id, uniquePool[1].id, uniquePool[2].id]);
    } else {
      setSelectedOpponentIds(uniquePool.map(p => p.id));
    }
  }, [characters]);

  // Sorting cards: rank first, then suit
  const sortCards = (cards: Card[]): Card[] => {
    return [...cards].sort((a, b) => {
      if (a.rankVal !== b.rankVal) {
        return a.rankVal - b.rankVal;
      }
      return a.suitVal - b.suitVal;
    });
  };

  // Combo Evaluator
  const getCardPower = (card: Card): number => {
    return card.rankVal * 10 + card.suitVal;
  };

  const evaluateCombination = (cards: Card[]): Combo | null => {
    if (cards.length === 0) return null;
    const sorted = sortCards(cards);
    const len = sorted.length;

    // Single Card
    if (len === 1) {
      return { type: "single", cards: sorted, highestCard: sorted[0] };
    }

    // Pairs
    if (len === 2) {
      if (sorted[0].rankVal === sorted[1].rankVal) {
        return { type: "pair", cards: sorted, highestCard: sorted[1] };
      }
      return null;
    }

    // Triples (Sám Cô)
    if (len === 3) {
      if (sorted[0].rankVal === sorted[1].rankVal && sorted[1].rankVal === sorted[2].rankVal) {
        return { type: "triple", cards: sorted, highestCard: sorted[2] };
      }
    }

    // Four of a Kind (Tứ Quý)
    if (len === 4) {
      if (
        sorted[0].rankVal === sorted[1].rankVal &&
        sorted[1].rankVal === sorted[2].rankVal &&
        sorted[2].rankVal === sorted[3].rankVal
      ) {
        return { type: "four_of_a_kind", cards: sorted, highestCard: sorted[3] };
      }
    }

    // Straights (Sảnh) - 3 or more consecutive cards. NOTE: 2 (rankVal 15) cannot be in a straight!
    if (len >= 3) {
      // Check if any card is a '2'
      const hasTwo = sorted.some(c => c.rankVal === 15);
      if (!hasTwo) {
        let isStraight = true;
        for (let i = 1; i < len; i++) {
          if (sorted[i].rankVal !== sorted[i - 1].rankVal + 1) {
            isStraight = false;
            break;
          }
        }
        if (isStraight) {
          return { type: "straight", cards: sorted, highestCard: sorted[len - 1] };
        }
      }
    }

    return null;
  };

  // Check if play beats active combo
  const canPlayCombination = (selected: Card[]): boolean => {
    const newCombo = evaluateCombination(selected);
    if (!newCombo) return false;

    // Free turn
    if (!activeCombo) {
      return true;
    }

    // Case 1: Same combo type and same length (e.g. single vs single, sảnh 4 vs sảnh 4)
    if (newCombo.type === activeCombo.type && newCombo.cards.length === activeCombo.cards.length) {
      return getCardPower(newCombo.highestCard) > getCardPower(activeCombo.highestCard);
    }

    // Case 2: Special rules - Tứ quý beats single 2
    if (
      activeCombo.type === "single" && 
      activeCombo.highestCard.rankVal === 15 && 
      newCombo.type === "four_of_a_kind"
    ) {
      return true;
    }

    // Case 3: Stronger tứ quý beats smaller tứ quý
    if (activeCombo.type === "four_of_a_kind" && newCombo.type === "four_of_a_kind") {
      return getCardPower(newCombo.highestCard) > getCardPower(activeCombo.highestCard);
    }

    return false;
  };

  // Bot Auto Chat
  const triggerBotBubble = (playerIdx: number, type: "play" | "pass" | "win") => {
    // Không thêm các lời thoại nhân vật trong lúc đánh bài theo yêu cầu của người dùng
    return;
  };

  // Handle Starting the Game
  const handleStartGame = () => {
    if (selectedOpponentIds.length < 1 || selectedOpponentIds.length > 3) {
      alert("Nàng vui lòng chọn từ 1 đến 3 nhân vật đối đầu nha! 🥰");
      return;
    }

    if (!isMuted) playMeowSound();

    // Prepare full shuffled deck
    const deck = generateDeck();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Retrieve selected bots profiles
    const selectedBots = opponentsPool.filter(o => selectedOpponentIds.includes(o.id));
    
    // Players list: User (P0) + selected bots
    const newPlayers: Player[] = [
      {
        id: "user",
        name: "Bạn (Người dùng)",
        avatar: "👩",
        hand: [],
        isBot: false,
        passed: false
      }
    ];

    selectedBots.forEach(bot => {
      newPlayers.push({
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        hand: [],
        isBot: true,
        passed: false
      });
    });

    // Deal 13 cards to each player
    const numPlayers = newPlayers.length;
    for (let cardIdx = 0; cardIdx < 13 * numPlayers; cardIdx++) {
      const playerIdx = cardIdx % numPlayers;
      if (deck[cardIdx]) {
        newPlayers[playerIdx].hand.push(deck[cardIdx]);
      }
    }

    // Sort all players' hands
    newPlayers.forEach(p => {
      p.hand = sortCards(p.hand);
    });

    // Rules: Find who has the smallest card (usually 3 of Spades '3_spade') to go first in first round
    let firstPlayerIdx = 0;
    let minPower = 999;
    newPlayers.forEach((p, pIdx) => {
      p.hand.forEach(c => {
        const power = getCardPower(c);
        if (power < minPower) {
          minPower = power;
          firstPlayerIdx = pIdx;
        }
      });
    });

    setPlayers(newPlayers);
    setTurn(firstPlayerIdx);
    setLastPlayIndex(-1);
    setActiveCombo(null);
    setSelectedCards([]);
    setHistoryFinished([]);
    setGameLog([
      `Trận đấu bài Tiến Lên 52 lá bắt đầu!`,
      `Người đi trước: ${newPlayers[firstPlayerIdx].name} vì sở hữu lá bài nhỏ nhất.`
    ]);
    setGameState("PLAYING");

    // Welcome dialogue for bots is disabled to satisfy the request to not have character dialogue during gameplay.
  };

  // Bot Turn Handler Logic
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const currentPlayer = players[turn];
    if (!currentPlayer) return;

    // If all other players have passed, reset round
    const activePlayersCount = players.filter(p => !p.finishedPlace).length;
    const passedCount = players.filter(p => p.passed || p.finishedPlace).length;
    
    // Check if round should reset because everyone else passed
    if (activeCombo && passedCount >= activePlayersCount - 1 && turn === lastPlayIndex) {
      setGameLog(prev => [...prev, "--- Vòng chơi mới! Tất cả lượt bỏ đã được mở lại. ---"]);
      const updatedPlayers = players.map(p => ({ ...p, passed: false }));
      setPlayers(updatedPlayers);
      setActiveCombo(null);
      setLastPlayIndex(-1);
      return;
    }

    // If current player passed or has already finished, skip them immediately
    if (currentPlayer.passed || currentPlayer.finishedPlace) {
      moveToNextTurn();
      return;
    }

    // If currentPlayer is BOT, run automated AI logic
    if (currentPlayer.isBot) {
      const delay = 1200 + Math.random() * 800; // Realistic delay
      const botTimer = setTimeout(() => {
        executeBotTurn(turn);
      }, delay);
      return () => clearTimeout(botTimer);
    }
  }, [turn, gameState, players, activeCombo, lastPlayIndex]);

  // Turn management helper
  const moveToNextTurn = () => {
    setTurn(prev => (prev + 1) % players.length);
  };

  // AI Logic for Bot
  const executeBotTurn = (botIdx: number) => {
    const bot = players[botIdx];
    const hand = bot.hand;

    // Helper to find combos of specific types
    const findBotCombos = () => {
      const listSingle: Card[][] = hand.map(c => [c]);
      const listPairs: Card[][] = [];
      const listTriples: Card[][] = [];
      const listStraights: Card[][] = [];
      const listFourOfAKind: Card[][] = [];

      // Find pairs, triples, quadruples
      const groups: { [key: number]: Card[] } = {};
      hand.forEach(c => {
        if (!groups[c.rankVal]) groups[c.rankVal] = [];
        groups[c.rankVal].push(c);
      });

      Object.values(groups).forEach(g => {
        if (g.length >= 2) {
          listPairs.push([g[0], g[1]]);
          if (g.length >= 3) listTriples.push([g[0], g[1], g[2]]);
          if (g.length === 4) listFourOfAKind.push(g);
        }
      });

      // Find straights (Sảnh) of length 3 to 6
      for (let sLen = 3; sLen <= 8; sLen++) {
        for (let i = 0; i <= hand.length - sLen; i++) {
          const slice = hand.slice(i, i + sLen);
          // remove duplicates in slice ranks
          const uniqueRanks: Card[] = [];
          slice.forEach(c => {
            if (!uniqueRanks.some(ur => ur.rankVal === c.rankVal)) {
              uniqueRanks.push(c);
            }
          });
          if (uniqueRanks.length >= sLen) {
            // Check consecutive
            let isSeq = true;
            for (let j = 1; j < sLen; j++) {
              if (uniqueRanks[j].rankVal !== uniqueRanks[j - 1].rankVal + 1 || uniqueRanks[j].rankVal === 15) {
                isSeq = false;
                break;
              }
            }
            if (isSeq) {
              listStraights.push(uniqueRanks.slice(0, sLen));
            }
          }
        }
      }

      return { listSingle, listPairs, listTriples, listStraights, listFourOfAKind };
    };

    const { listSingle, listPairs, listTriples, listStraights, listFourOfAKind } = findBotCombos();

    let playSelected: Card[] | null = null;

    // AI is leading the turn (Free Play!)
    if (!activeCombo) {
      // Rule of free turn: try playing straights first, then triples, then pairs, then single smallest
      if (listStraights.length > 0) {
        playSelected = listStraights[0]; // Play smallest straight
      } else if (listTriples.length > 0) {
        playSelected = listTriples[0];
      } else if (listPairs.length > 0) {
        playSelected = listPairs[0];
      } else {
        playSelected = [hand[0]]; // Smallest single card
      }
    } else {
      // AI needs to beat the active combo on table
      const targetType = activeCombo.type;
      const targetLength = activeCombo.cards.length;

      if (targetType === "single") {
        // Find smallest single card that beats it
        const possible = listSingle.filter(c => getCardPower(c[0]) > getCardPower(activeCombo.highestCard));
        if (possible.length > 0) {
          playSelected = possible[0];
        } else if (activeCombo.highestCard.rankVal === 15 && listFourOfAKind.length > 0) {
          // Special: single 2 is beaten by tứ quý
          playSelected = listFourOfAKind[0];
        }
      } else if (targetType === "pair") {
        const possible = listPairs.filter(p => evaluateCombination(p) && getCardPower(p[1]) > getCardPower(activeCombo.highestCard));
        if (possible.length > 0) {
          playSelected = possible[0];
        }
      } else if (targetType === "triple") {
        const possible = listTriples.filter(t => evaluateCombination(t) && getCardPower(t[2]) > getCardPower(activeCombo.highestCard));
        if (possible.length > 0) {
          playSelected = possible[0];
        }
      } else if (targetType === "four_of_a_kind") {
        const possible = listFourOfAKind.filter(fq => evaluateCombination(fq) && getCardPower(fq[3]) > getCardPower(activeCombo.highestCard));
        if (possible.length > 0) {
          playSelected = possible[0];
        }
      } else if (targetType === "straight") {
        // Find sảnh of same length that beats active sảnh
        const possible = listStraights.filter(s => s.length === targetLength && getCardPower(s[s.length - 1]) > getCardPower(activeCombo.highestCard));
        if (possible.length > 0) {
          playSelected = possible[0];
        }
      }
    }

    // Action Execution
    if (playSelected) {
      executePlayAction(botIdx, playSelected);
    } else {
      // Cannot beat -> Pass
      executePassAction(botIdx);
    }
  };

  const executePlayAction = (playerIdx: number, cardsToPlay: Card[]) => {
    if (!isMuted) playCardSound();

    const currentPlayers = [...players];
    const player = currentPlayers[playerIdx];

    // Remove cards from player hand
    player.hand = player.hand.filter(hc => !cardsToPlay.some(c => c.id === hc.id));

    const newCombo = evaluateCombination(cardsToPlay)!;
    setActiveCombo(newCombo);
    setLastPlayIndex(playerIdx);

    const comboLabel = 
      newCombo.type === "single" ? `rác ${newCombo.highestCard.rank}${SUIT_SYMBOLS[newCombo.highestCard.suit].char}` :
      newCombo.type === "pair" ? `đôi ${newCombo.highestCard.rank}` :
      newCombo.type === "triple" ? `sám cô ${newCombo.highestCard.rank}` :
      newCombo.type === "four_of_a_kind" ? `tứ quý ${newCombo.highestCard.rank} 💥` :
      `sảnh ${newCombo.cards.map(c => c.rank).join("-")}`;

    setGameLog(prev => [
      ...prev,
      `👉 ${player.name} đánh ${comboLabel} (${newCombo.cards.length} lá)`
    ]);

    // Trigger cute dialogue bubbles for bot
    if (player.isBot) {
      triggerBotBubble(playerIdx, "play");
    }

    // Check if player finished/won
    if (player.hand.length === 0) {
      const placesFinished = currentPlayers.filter(p => p.finishedPlace).length + 1;
      player.finishedPlace = placesFinished;

      const placeNames = ["Nhất 🏆", "Nhì 🥈", "Ba 🥉", "Bét 💔"];
      const medal = placeNames[placesFinished - 1] || `${placesFinished}`;

      setGameLog(prev => [
        ...prev,
        `🎉 ${player.name} đã HẾT BÀI và đạt hạng ${medal}!`
      ]);

      if (player.isBot) {
        triggerBotBubble(playerIdx, "win");
      } else {
        if (!isMuted) playWinSound();
        const isEffectsOff = localStorage.getItem("meomeo_particle_effect") === "none";
        if (!isEffectsOff) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#ec4899", "#f43f5e", "#fb7185", "#3b82f6"]
          });
        }
      }

      setHistoryFinished(prev => [...prev, `${player.name} (Hạng ${medal})`]);

      // If only one player is left, game ends
      const activePlayers = currentPlayers.filter(p => !p.finishedPlace);
      if (activePlayers.length <= 1) {
        // Award the last place automatically
        if (activePlayers.length === 1) {
          const lastPlayer = activePlayers[0];
          lastPlayer.finishedPlace = currentPlayers.length;
          setHistoryFinished(prev => [...prev, `${lastPlayer.name} (Hạng Bét 💔)`]);
        }
        setGameState("FINISHED");
      }
    }

    setPlayers(currentPlayers);
    setSelectedCards([]);
    moveToNextTurn();
  };

  const executePassAction = (playerIdx: number) => {
    const currentPlayers = [...players];
    currentPlayers[playerIdx].passed = true;
    
    setGameLog(prev => [
      ...prev,
      `❌ ${currentPlayers[playerIdx].name} bỏ lượt.`
    ]);

    if (currentPlayers[playerIdx].isBot) {
      triggerBotBubble(playerIdx, "pass");
    }

    setPlayers(currentPlayers);
    moveToNextTurn();
  };

  // User Actions
  const handleUserPlay = () => {
    if (turn !== 0 || gameState !== "PLAYING") return;
    
    if (selectedCards.length === 0) {
      alert("Nàng ơi, vui lòng nhấp chọn các lá bài muốn đánh trước nhen! 💕");
      return;
    }

    if (!canPlayCombination(selectedCards)) {
      alert("Lựa chọn bài này không hợp lệ hoặc không đè được tổ hợp bài trên bàn nhen nàng! 🥺");
      return;
    }

    executePlayAction(0, selectedCards);
  };

  const handleUserPass = () => {
    if (turn !== 0 || gameState !== "PLAYING") return;
    if (!activeCombo) {
      alert("Nàng ơi, đây là lượt tự do đi bài của nàng, không được bỏ lượt đâu nhen! 😘");
      return;
    }

    executePassAction(0);
  };

  const handleSelectCard = (card: Card) => {
    if (gameState !== "PLAYING" || turn !== 0) return;
    
    setSelectedCards(prev => {
      const alreadySelected = prev.some(c => c.id === card.id);
      if (alreadySelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  // User quick actions
  const handleSortHand = () => {
    if (!isMuted) playCardSound();
    const currentPlayers = [...players];
    if (currentPlayers[0]) {
      currentPlayers[0].hand = sortCards(currentPlayers[0].hand);
      setPlayers(currentPlayers);
    }
  };

  const handleClearSelection = () => {
    setSelectedCards([]);
  };

  // Suggest play suggestions for user if they don't know what to do
  const getUserSuggestions = (): Card[][] => {
    if (gameState !== "PLAYING" || turn !== 0) return [];
    
    const userHand = players[0]?.hand || [];
    if (userHand.length === 0) return [];

    const suggestions: Card[][] = [];

    // Auxiliary arrays of pairs and triples
    const groups: { [key: number]: Card[] } = {};
    userHand.forEach(c => {
      if (!groups[c.rankVal]) groups[c.rankVal] = [];
      groups[c.rankVal].push(c);
    });

    if (!activeCombo) {
      // Suggest small singles, pairs, and sảnh
      // 1. Single card suggestion (first 3 smallest)
      userHand.slice(0, 3).forEach(c => suggestions.push([c]));
      
      // 2. Pairs suggestion
      Object.values(groups).forEach(g => {
        if (g.length >= 2) suggestions.push([g[0], g[1]]);
      });

      // 3. Simple Straights of length 3
      for (let i = 0; i < userHand.length - 2; i++) {
        const c1 = userHand[i];
        if (c1.rankVal === 15) continue;
        const c2 = userHand.find(c => c.rankVal === c1.rankVal + 1);
        const c3 = userHand.find(c => c.rankVal === c1.rankVal + 2);
        if (c2 && c3) suggestions.push([c1, c2, c3]);
      }
    } else {
      const targetType = activeCombo.type;
      const targetLength = activeCombo.cards.length;

      if (targetType === "single") {
        userHand.forEach(c => {
          if (getCardPower(c) > getCardPower(activeCombo.highestCard)) {
            suggestions.push([c]);
          }
        });
        // Tứ quý beats 2
        if (activeCombo.highestCard.rankVal === 15) {
          Object.values(groups).forEach(g => {
            if (g.length === 4) suggestions.push(g);
          });
        }
      } else if (targetType === "pair") {
        Object.values(groups).forEach(g => {
          if (g.length >= 2) {
            const pairComb = [g[0], g[1]];
            if (getCardPower(g[1]) > getCardPower(activeCombo.highestCard)) {
              suggestions.push(pairComb);
            }
          }
        });
      } else if (targetType === "triple") {
        Object.values(groups).forEach(g => {
          if (g.length >= 3) {
            const tripleComb = [g[0], g[1], g[2]];
            if (getCardPower(g[2]) > getCardPower(activeCombo.highestCard)) {
              suggestions.push(tripleComb);
            }
          }
        });
      } else if (targetType === "four_of_a_kind") {
        Object.values(groups).forEach(g => {
          if (g.length === 4) {
            if (getCardPower(g[3]) > getCardPower(activeCombo.highestCard)) {
              suggestions.push(g);
            }
          }
        });
      } else if (targetType === "straight") {
        // Straights with exact target length
        for (let i = 0; i <= userHand.length - targetLength; i++) {
          const startCard = userHand[i];
          if (startCard.rankVal === 15) continue;
          
          let validStraight = true;
          const currentStraight: Card[] = [startCard];
          
          for (let step = 1; step < targetLength; step++) {
            const nextCard = userHand.find(c => c.rankVal === startCard.rankVal + step);
            if (nextCard && nextCard.rankVal !== 15) {
              currentStraight.push(nextCard);
            } else {
              validStraight = false;
              break;
            }
          }

          if (validStraight) {
            const lastC = currentStraight[currentStraight.length - 1];
            if (getCardPower(lastC) > getCardPower(activeCombo.highestCard)) {
              suggestions.push(currentStraight);
            }
          }
        }
      }
    }

    // Limit to unique and maximum 5 suggestions
    const uniqueSuggestions: Card[][] = [];
    const seenCombos = new Set<string>();
    
    suggestions.forEach(s => {
      const idKey = s.map(c => c.id).sort().join(",");
      if (!seenCombos.has(idKey)) {
        seenCombos.add(idKey);
        uniqueSuggestions.push(s);
      }
    });

    return uniqueSuggestions.slice(0, 5); // Limit to exactly at most 5 options
  };

  const userSuggestions = getUserSuggestions();

  const handleApplySuggestion = (suggestion: Card[]) => {
    if (!isMuted) playCardSound();
    setSelectedCards(suggestion);
  };

  const selectedCombo = evaluateCombination(selectedCards);
  const playButtonValid = canPlayCombination(selectedCards);

  return (
    <div className={`w-full max-w-6xl mx-auto rounded-[2.5rem] border overflow-hidden shadow-2xl transition-all duration-300 relative ${
      isDarkMode 
        ? "bg-slate-950 border-slate-900 text-slate-100" 
        : "bg-stone-100 border-[#eadbca]/50 text-stone-800"
    }`}>
      {/* Upper Navigation & Game Banner */}
      <div className={`px-8 py-5 flex items-center justify-between border-b ${
        isDarkMode ? "bg-slate-900/60 border-slate-900" : "bg-white border-stone-200/40"
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-full border transition-all ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800" 
                : "bg-white border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🃏⚔️</span>
              <span className="text-[9px] tracking-widest font-extrabold uppercase text-rose-500 font-mono">
                Mini Game Cổ Điển
              </span>
            </div>
            <h1 className="text-xl font-serif font-bold italic tracking-wide">
              Đấu Bài Tiến Lên - Thập Tam Tây Lá ✨
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mute toggle button */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              isDarkMode
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            <Volume2 className={`w-4 h-4 ${isMuted ? "opacity-30" : "opacity-100"}`} />
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowRules(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Luật Chơi
          </button>
        </div>
      </div>

      {/* Rules Modal Overlay */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[6px] z-50 p-6 flex items-center justify-center overflow-y-auto"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className={`w-full max-w-2xl p-8 rounded-[2rem] border shadow-2xl relative ${
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-serif font-bold italic mb-4">
                Luật Bài Tiến Lên Miền Nam - Thập Tam 📚
              </h2>
              <div className="space-y-4 text-xs leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                <p>
                  Tiến Lên Miền Nam sử dụng bộ bài Tây 52 lá. Trò chơi có từ 2 đến 4 người chơi, mỗi người được chia đều 13 lá bài.
                </p>
                <div>
                  <h3 className="font-bold text-rose-500 mb-1">1. Sắp xếp độ mạnh yếu của các lá bài:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Giá trị (Ranks):</strong> 3 &lt; 4 &lt; 5 &lt; 6 &lt; 7 &lt; 8 &lt; 9 &lt; 10 &lt; J &lt; Q &lt; K &lt; A &lt; 2. Lá 3 là nhỏ nhất, lá 2 là lớn nhất và có sức mạnh đặc biệt.</li>
                    <li><strong>Chất bài (Suits):</strong> Bích ♠ &lt; Chuồn ♣ &lt; Rô ♦ &lt; Cơ ♥. Khi các lá bài có cùng giá trị, ta so sánh chất để phân định thắng thua (Ví dụ: 3♥ đè được 3♠).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-rose-500 mb-1">2. Các bộ bài (Tổ hợp bài hợp lệ):</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Rác (Single):</strong> Một lá bài lẻ loi.</li>
                    <li><strong>Đôi (Pair):</strong> Hai lá bài cùng giá trị (Ví dụ: đôi 7).</li>
                    <li><strong>Sám Cô (Triple):</strong> Ba lá bài cùng giá trị.</li>
                    <li><strong>Sảnh (Straight):</strong> Bộ từ 3 lá bài liên tiếp trở lên (Ví dụ: 3-4-5). Lá 2 không bao giờ được nằm trong Sảnh!</li>
                    <li><strong>Tứ Quý (Four of a Kind):</strong> Bốn lá bài cùng giá trị (Ví dụ: 4 lá K).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-rose-500 mb-1">3. Luật Chơi Căn Bản:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ván đầu tiên: Người giữ lá bài <strong>3 Bích (3♠)</strong> được đi trước và bắt buộc phải đánh lá bài này ra (lẻ hoặc kèm đôi/sảnh).</li>
                    <li>Các ván sau: Người thắng ván trước được quyền đi đầu tiên.</li>
                    <li>Ván bài diễn ra theo vòng tròn. Khi đến lượt, người sau phải đánh ra tổ hợp bài cùng loại nhưng có giá trị cao hơn để đè bài người trước.</li>
                    <li>Nếu không thể hoặc không muốn đè bài, người chơi có thể chọn <strong>Bỏ lượt</strong>. Khi đã bỏ lượt, bạn sẽ không được quyền đánh tiếp trong vòng chơi đó cho tới khi vòng chơi kết thúc và đặt lại lượt mới.</li>
                    <li><strong>Luật đặc biệt đè heo (Lá 2):</strong> Tứ quý đè được một lá 2 bất kì hoặc một Tứ quý nhỏ hơn.</li>
                  </ul>
                </div>

                <p className="italic text-stone-400">
                  Chúc nàng chơi vui vẻ và rinh về thật nhiều chiến thắng ngọt ngào cùng các bé cưng nhé! 🥰🍭
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETUP PHASE VIEW */}
      {gameState === "SETUP" && (
        <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-[2rem] flex items-center justify-center text-5xl shadow-lg mb-6 animate-bounce">
            🎴
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold italic mb-2">
            Chào mừng nàng tới sòng bài Tiến Lên!
          </h2>
          <p className="text-sm text-stone-400 dark:text-stone-500 max-w-lg leading-relaxed mb-8">
            Nàng có thể chọn thi đấu bài tây 4 người cùng các nam thần mà mình thích nhất. Mỗi người sẽ có 13 lá bài đấu trí căng thẳng!
          </p>

          {/* Opponents selection interface */}
          <div className="w-full max-w-xl border rounded-[2rem] p-6 mb-8 bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/40 dark:border-slate-900 flex flex-col gap-4 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-500 font-mono flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              Chọn 3 Bé Cưng Thách Đấu (Đã Chọn {selectedOpponentIds.length}/3):
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {opponentsPool.map((opp) => {
                const isSelected = selectedOpponentIds.includes(opp.id);
                return (
                  <button
                    key={opp.id}
                    onClick={() => {
                      if (!isMuted) playMeowSound();
                      setSelectedOpponentIds(prev => {
                        if (prev.includes(opp.id)) {
                          return prev.filter(id => id !== opp.id);
                        } else {
                          if (prev.length >= 3) {
                            return [...prev.slice(1), opp.id]; // Queue style
                          }
                          return [...prev, opp.id];
                        }
                      });
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center text-center justify-center transition-all duration-300 relative cursor-pointer ${
                      isSelected
                        ? "bg-rose-500/10 border-rose-500 text-rose-600 scale-[1.02] font-semibold"
                        : "bg-white dark:bg-slate-900 border-stone-200/60 dark:border-slate-800 hover:border-rose-300"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden mb-2 bg-rose-50 dark:bg-slate-800 flex items-center justify-center text-2xl border shadow-2xs">
                      {isImageUrl(opp.avatar) ? (
                        <img src={opp.avatar} alt={opp.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{opp.avatar}</span>
                      )}
                    </div>
                    <span className="text-xs font-serif italic truncate w-full">{opp.name}</span>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px]">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={selectedOpponentIds.length === 0}
            className={`px-8 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-full font-serif italic font-bold text-base flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer`}
          >
            <Play className="w-4 h-4 fill-current" />
            BẮT ĐẦU CHIA BÀI
          </button>
        </div>
      )}

      {/* GAMEPLAY PHASE VIEW */}
      {gameState === "PLAYING" && (
        <div className="flex flex-col lg:flex-row h-auto min-h-[600px] relative">
          
          {/* Main Board Table (Green Felt Style) */}
          <div className="flex-1 p-6 flex flex-col justify-between min-h-[500px] relative bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 border-r border-stone-200/10 shadow-inner">
            
            {/* TOP BAR STATUS INDICATORS */}
            <div className="flex justify-between items-center bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-mono text-emerald-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>
                  Lượt của: <strong className="text-white underline font-serif italic">{players[turn]?.name}</strong>
                </span>
              </div>
              <div>
                <span>Vòng đánh bài hiện tại: {activeCombo ? "Đang tranh tài ⚔️" : "Lượt đi tự do ✨"}</span>
              </div>
            </div>

            {/* BOT OPPONENTS DISPLAY */}
            <div className="flex justify-between items-center my-4 relative h-36">
              {/* Bot Player 1 (Left Side of Table) */}
              {players[1] && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center z-10 w-24">
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 relative flex items-center justify-center bg-slate-900/80 shadow-md ${
                    turn === 1 ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-stone-400/40"
                  }`}>
                    {isImageUrl(players[1].avatar) ? (
                      <img src={players[1].avatar} alt={players[1].name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{players[1].avatar}</span>
                    )}

                    {players[1].passed && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-rose-400">
                        BỎ LƯỢT
                      </div>
                    )}

                    {players[1].finishedPlace && (
                      <div className="absolute inset-0 bg-yellow-500/80 flex flex-col items-center justify-center text-[10px] font-extrabold text-slate-950">
                        <span>Hạng {players[1].finishedPlace}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-serif italic text-white font-bold truncate max-w-[90px] mt-1.5">
                    {players[1].name}
                  </span>
                  {!players[1].finishedPlace && (
                    <span className="text-[9px] bg-emerald-950/70 text-emerald-300 font-mono px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
                      🎴 {players[1].hand.length} lá
                    </span>
                  )}

                  {/* Chat bubble */}
                  <AnimatePresence>
                    {botChat[1] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute left-16 top-0 bg-white text-slate-950 p-2.5 rounded-2xl rounded-tl-none shadow-md text-[10px] text-left leading-relaxed max-w-[130px] font-semibold italic border border-rose-100"
                      >
                        "{botChat[1]}"
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Bot Player 2 (Top / Center Side of Table) */}
              {players[2] && (
                <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center text-center z-10 w-24">
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 relative flex items-center justify-center bg-slate-900/80 shadow-md ${
                    turn === 2 ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-stone-400/40"
                  }`}>
                    {isImageUrl(players[2].avatar) ? (
                      <img src={players[2].avatar} alt={players[2].name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{players[2].avatar}</span>
                    )}

                    {players[2].passed && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-rose-400">
                        BỎ LƯỢT
                      </div>
                    )}

                    {players[2].finishedPlace && (
                      <div className="absolute inset-0 bg-yellow-500/80 flex flex-col items-center justify-center text-[10px] font-extrabold text-slate-950">
                        <span>Hạng {players[2].finishedPlace}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-serif italic text-white font-bold truncate max-w-[90px] mt-1.5">
                    {players[2].name}
                  </span>
                  {!players[2].finishedPlace && (
                    <span className="text-[9px] bg-emerald-950/70 text-emerald-300 font-mono px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
                      🎴 {players[2].hand.length} lá
                    </span>
                  )}

                  {/* Chat bubble */}
                  <AnimatePresence>
                    {botChat[2] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-16 bg-white text-slate-950 p-2.5 rounded-2xl shadow-md text-[10px] text-center leading-relaxed max-w-[150px] font-semibold italic border border-rose-100"
                      >
                        "{botChat[2]}"
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Bot Player 3 (Right Side of Table) */}
              {players[3] && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center z-10 w-24">
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 relative flex items-center justify-center bg-slate-900/80 shadow-md ${
                    turn === 3 ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-stone-400/40"
                  }`}>
                    {isImageUrl(players[3].avatar) ? (
                      <img src={players[3].avatar} alt={players[3].name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{players[3].avatar}</span>
                    )}

                    {players[3].passed && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-rose-400">
                        BỎ LƯỢT
                      </div>
                    )}

                    {players[3].finishedPlace && (
                      <div className="absolute inset-0 bg-yellow-500/80 flex flex-col items-center justify-center text-[10px] font-extrabold text-slate-950">
                        <span>Hạng {players[3].finishedPlace}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-serif italic text-white font-bold truncate max-w-[90px] mt-1.5">
                    {players[3].name}
                  </span>
                  {!players[3].finishedPlace && (
                    <span className="text-[9px] bg-emerald-950/70 text-emerald-300 font-mono px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
                      🎴 {players[3].hand.length} lá
                    </span>
                  )}

                  {/* Chat bubble */}
                  <AnimatePresence>
                    {botChat[3] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-16 top-0 bg-white text-slate-950 p-2.5 rounded-2xl rounded-tr-none shadow-md text-[10px] text-right leading-relaxed max-w-[130px] font-semibold italic border border-rose-100"
                      >
                        "{botChat[3]}"
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ACTIVE BATTLE FIELD ZONE (CENTER OF THE BOARD) */}
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-emerald-500/20 rounded-[2rem] bg-emerald-950/20 p-4 my-2 min-h-[140px] relative">
              {activeCombo ? (
                <div className="text-center flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-300/60 font-mono mb-2 block">
                    Lá bài đang trên bàn đấu (Bởi {players[lastPlayIndex]?.name || "vô danh"})
                  </span>
                  <div className="flex gap-1.5 justify-center flex-wrap max-w-sm">
                    {activeCombo.cards.map((c, i) => (
                      <motion.div
                        initial={{ scale: 0.5, y: -20, rotate: (i - 1) * 3 }}
                        animate={{ scale: 1, y: 0, rotate: (i - 1) * 4 }}
                        key={c.id}
                        className="w-11 h-16 sm:w-12 sm:h-18 bg-white rounded-lg border shadow-md flex flex-col justify-between p-1.5 shrink-0"
                      >
                        <span className={`text-xs font-bold leading-none ${SUIT_SYMBOLS[c.suit].color}`}>
                          {c.rank}
                        </span>
                        <span className={`text-center text-lg leading-none ${SUIT_SYMBOLS[c.suit].color}`}>
                          {SUIT_SYMBOLS[c.suit].char}
                        </span>
                        <span className={`text-right text-xs font-bold leading-none self-end ${SUIT_SYMBOLS[c.suit].color}`}>
                          {c.rank}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[11px] font-sans text-emerald-300/40 italic">Bàn bài trống. Lượt đi tự do!</p>
                </div>
              )}
            </div>

            {/* USER CONTROLS AND CARD HAND DISPLAY (BOTTOM OF THE BOARD) */}
            <div className="flex flex-col gap-4 mt-2">
              
              {/* Suggetions Area */}
              {turn === 0 && !players[0]?.finishedPlace && userSuggestions.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/30 backdrop-blur-md overflow-x-auto">
                  <span className="text-[10px] font-bold text-amber-300 font-mono shrink-0">✨ Gợi ý:</span>
                  <div className="flex gap-2 shrink-0">
                    {userSuggestions.map((sug, sugIdx) => (
                      <button
                        key={sugIdx}
                        onClick={() => handleApplySuggestion(sug)}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 rounded-lg text-[10px] font-semibold flex gap-1 transition-all"
                      >
                        {sug.map(c => `${c.rank}${SUIT_SYMBOLS[c.suit].char}`).join(" ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* HAND CARDS ROW */}
              <div className="flex flex-col gap-2 relative">
                {players[0] && (
                  <>
                    {/* Finished user label */}
                    {players[0].finishedPlace ? (
                      <div className="bg-yellow-500 text-slate-950 font-bold p-3 rounded-2xl text-center text-xs">
                        Nàng đã hết bài và hoàn thành ván đấu ở hạng {players[0].finishedPlace}! Chờ các bé cưng đánh hết nhen. ✨💖
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-emerald-300 font-mono">
                            Bài của nàng ({players[0].hand.length} lá):
                          </span>
                          {selectedCards.length > 0 && (
                            <span className="text-[10px] font-bold text-amber-300 font-mono">
                              Đã chọn: {selectedCards.length} lá · {selectedCombo ? `Tổ hợp: ${selectedCombo.type}` : "Tổ hợp không hợp lệ ❌"}
                            </span>
                          )}
                        </div>

                        {/* Hand Cards Grid Row */}
                        <div className="flex justify-center items-center h-28 relative">
                          <div className="flex justify-center w-full max-w-full overflow-x-auto pb-4 pt-4 px-4 snap-x">
                            {players[0].hand.map((card, idx) => {
                              const isSelected = selectedCards.some(sc => sc.id === card.id);
                              return (
                                <motion.div
                                  key={card.id}
                                  onClick={() => handleSelectCard(card)}
                                  whileHover={{ y: -16, scale: 1.05 }}
                                  animate={{ 
                                    y: isSelected ? -20 : 0,
                                    zIndex: idx + 10,
                                  }}
                                  className={`w-11 h-18 sm:w-14 sm:h-22 bg-white rounded-xl border flex flex-col justify-between p-1.5 snap-center transition-all duration-150 shrink-0 shadow-sm cursor-pointer select-none border-stone-200 ${
                                    isSelected 
                                      ? "ring-4 ring-rose-400 border-rose-300 shadow-md" 
                                      : "hover:shadow-md"
                                  }`}
                                  style={{
                                    marginLeft: idx === 0 ? "0" : "-1rem", // Dynamic card overlapping
                                  }}
                                >
                                  <span className={`text-xs sm:text-sm font-extrabold leading-none ${SUIT_SYMBOLS[card.suit].color}`}>
                                    {card.rank}
                                  </span>
                                  <span className={`text-center text-xl sm:text-2xl leading-none ${SUIT_SYMBOLS[card.suit].color}`}>
                                    {SUIT_SYMBOLS[card.suit].char}
                                  </span>
                                  <span className={`text-right text-xs sm:text-sm font-extrabold leading-none self-end ${SUIT_SYMBOLS[card.suit].color}`}>
                                    {card.rank}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Control Buttons for User */}
                        {turn === 0 && (
                          <div className="flex gap-2 justify-center mt-2 flex-wrap">
                            <button
                              onClick={handleUserPlay}
                              disabled={!playButtonValid}
                              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-95 ${
                                playButtonValid
                                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                                  : "bg-stone-500 text-stone-300 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              Đánh Bài
                            </button>

                            <button
                              onClick={handleUserPass}
                              disabled={!activeCombo}
                              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border hover:scale-[1.01] active:scale-95 ${
                                activeCombo
                                  ? "bg-stone-900 border-stone-700 text-white hover:bg-stone-800"
                                  : "bg-stone-600 text-stone-400 border-stone-700 opacity-40 cursor-not-allowed"
                              }`}
                            >
                              <X className="w-4 h-4" />
                              Bỏ Lượt
                            </button>

                            <button
                              onClick={handleSortHand}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                            >
                              ⚡ Xếp Bài
                            </button>

                            {selectedCards.length > 0 && (
                              <button
                                onClick={handleClearSelection}
                                className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                              >
                                ↺ Bỏ Chọn
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR: REAL-TIME GAME CHRONICLE LOG & SCOREBOARD */}
          <div className={`w-full lg:w-72 p-5 flex flex-col justify-between border-t lg:border-t-0 ${
            isDarkMode ? "bg-slate-950" : "bg-white"
          }`}>
            <div className="flex flex-col h-full justify-between gap-5">
              
              {/* Podium / Finished Standings */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono mb-2 block">
                  Bảng Điểm / Xếp Hạng Ván Đấu:
                </span>
                <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                  isDarkMode ? "bg-slate-900/60 border-slate-900" : "bg-stone-50 border-stone-200/50"
                }`}>
                  {historyFinished.length > 0 ? (
                    <ul className="space-y-1.5">
                      {historyFinished.map((item, idx) => (
                        <li key={idx} className="text-xs font-sans font-semibold flex items-center gap-1.5">
                          <span className="text-rose-500">🏆</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] italic text-stone-400">Chưa ai về hết bài.</p>
                  )}
                </div>
              </div>

              {/* Game Log Chronicles */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 font-mono mb-2 block">
                  Nhật Ký Đánh Bài:
                </span>
                <div className={`flex-1 overflow-y-auto p-4 rounded-2xl border text-left font-sans text-xs space-y-2 leading-relaxed h-[240px] ${
                  isDarkMode 
                    ? "bg-slate-900/40 border-slate-900 text-slate-300" 
                    : "bg-stone-50 border-stone-200/50 text-stone-700"
                }`}>
                  {gameLog.map((log, i) => (
                    <p key={i} className={`border-b border-stone-200/10 pb-1.5 ${
                      log.startsWith("👉") ? "text-emerald-500 font-semibold" :
                      log.startsWith("❌") ? "text-slate-400 italic" : 
                      log.includes("HẾT BÀI") ? "text-rose-500 font-bold" : ""
                    }`}>
                      {log}
                    </p>
                  ))}
                </div>
              </div>

              {/* Restart or Quit game buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStartGame}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Xốc Lại Bài Mới
                </button>
                <button
                  onClick={() => setGameState("SETUP")}
                  className={`w-full py-2.5 border rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  ↩ Đổi Đối Thủ
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* FINISHED VICTORY PODIUM VIEW */}
      {gameState === "FINISHED" && (
        <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆🎉</div>
          
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold italic mb-1">
            Ván Bài Đã Kết Thúc!
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 font-mono mb-6 block">
            Kết Quả Chung Cuộc
          </span>

          <div className="w-full max-w-md border rounded-[2rem] p-6 mb-8 bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/40 dark:border-slate-900 flex flex-col gap-3 text-left">
            {players
              .sort((a, b) => (a.finishedPlace || 99) - (b.finishedPlace || 99))
              .map((p, pIdx) => {
                const isUser = p.id === "user";
                const placeLabel = pIdx === 0 ? "🏆 HẠNG NHẤT" : pIdx === 1 ? "🥈 HẠNG NHÌ" : pIdx === 2 ? "🥉 HẠNG BA" : "💔 HẠNG BÉT";
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      isUser
                        ? "bg-rose-500/10 border-rose-500 text-rose-600"
                        : "bg-white dark:bg-slate-900 border-stone-200/60 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-rose-50 flex items-center justify-center text-xl border">
                        {isImageUrl(p.avatar) ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{p.avatar}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-serif italic font-bold">{p.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono">Bé yêu chơi xuất sắc nhe</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">{placeLabel}</span>
                  </div>
                );
              })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStartGame}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-serif italic font-bold text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Làm Ván Mới!
            </button>
            <button
              onClick={() => setGameState("SETUP")}
              className={`px-6 py-3 border rounded-full text-sm font-serif italic font-bold transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                  : "bg-white border-stone-200 text-stone-600 hover:bg-rose-50"
              }`}
            >
              Chọn Đối Thủ Khác
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
