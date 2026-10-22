import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  ListMusic,
  Repeat,
  Repeat1, 
  ChevronDown, 
  Radio,
  Disc,
  Minimize2,
  Sparkles,
  Heart,
  Music,
  Shuffle
} from "lucide-react";
import { playMeowSound } from "../utils/audio";

interface Track {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  coverUrl: string;
  duration: number;
}

const PLAYLIST: Track[] = [
  {
    id: "vi-em-khong-dang",
    title: "Vì em không đáng",
    artist: "Cao Húc, h3R3",
    youtubeId: "i6qbMnaoRtk",
    coverUrl: "https://i.ytimg.com/vi/i6qbMnaoRtk/hqdefault.jpg",
    duration: 195, // 03:15
  },
  {
    id: "1",
    title: "Mập mờ (阴霾)",
    artist: "Cao Húc (高旭)",
    youtubeId: "6sgnZhw7B-A",
    coverUrl: "https://i.ytimg.com/vi/6sgnZhw7B-A/hqdefault.jpg",
    duration: 177, // 02:57
  },
  {
    id: "2",
    title: "Hương Vị Tiêu Tán (消散的味道)",
    artist: "Cao Húc (高旭)",
    youtubeId: "N0dvsp6yM9E",
    coverUrl: "https://i.ytimg.com/vi/N0dvsp6yM9E/hqdefault.jpg",
    duration: 181, // 03:01
  },
  {
    id: "3",
    title: "Pháo Hoa Chóng Tàn (烟花易冷)",
    artist: "Châu Kiệt Luân (Jay Chou)",
    youtubeId: "Zj3fTRFylrs",
    coverUrl: "https://i.ytimg.com/vi/Zj3fTRFylrs/hqdefault.jpg",
    duration: 295, // 04:55
  },
  {
    id: "4",
    title: "Red Line (红线)",
    artist: "Trâu Bái Bái, Pank (邹沛沛, Pank)",
    youtubeId: "-elf4OMkOqk",
    coverUrl: "https://i.ytimg.com/vi/-elf4OMkOqk/hqdefault.jpg",
    duration: 206, // 03:26
  },
  {
    id: "5",
    title: "Đắm chìm (沉溺)",
    artist: "Trâu Bái Bái, Pank (邹沛沛, Pank)",
    youtubeId: "j2ua5ZbfMfk",
    coverUrl: "https://i.ytimg.com/vi/j2ua5ZbfMfk/hqdefault.jpg",
    duration: 200, // 03:20
  },
  {
    id: "6",
    title: "hate that i made you love me x one of the girls",
    artist: "TikTok Remix",
    youtubeId: "qy04njohLI8",
    coverUrl: "https://i.ytimg.com/vi/qy04njohLI8/hqdefault.jpg",
    duration: 219, // 03:39
  },
  {
    id: "7",
    title: "want u",
    artist: "noevdv",
    youtubeId: "O3ebzGSVfEI",
    coverUrl: "https://i.ytimg.com/vi/O3ebzGSVfEI/hqdefault.jpg",
    duration: 124, // 02:04
  },
  {
    id: "8",
    title: "Deserve Better",
    artist: "Shayda (ft. Parys)",
    youtubeId: "cxix_12tsjQ",
    coverUrl: "https://i.ytimg.com/vi/cxix_12tsjQ/hqdefault.jpg",
    duration: 224, // 03:44
  },
  {
    id: "9",
    title: "Mập Mờ Dưới Trăng (月光下暧昧)",
    artist: "Trâu Bái Bái (邹沛沛)",
    youtubeId: "Wj-3rfQ2EQc",
    coverUrl: "https://i.ytimg.com/vi/Wj-3rfQ2EQc/hqdefault.jpg",
    duration: 183, // 03:03
  },
  {
    id: "10",
    title: "Nửa Trái Tim Remix (半点心 DJ版)",
    artist: "DJ Remix",
    youtubeId: "U-mEl98p9w4",
    coverUrl: "https://i.ytimg.com/vi/U-mEl98p9w4/hqdefault.jpg",
    duration: 233, // 03:53
  },
  {
    id: "11",
    title: "Không thể quên em (忘不掉的你)",
    artist: "h3R3",
    youtubeId: "jenR0EaeG40",
    coverUrl: "https://i.ytimg.com/vi/jenR0EaeG40/hqdefault.jpg",
    duration: 172, // 02:52
  },
  {
    id: "12",
    title: "归零",
    artist: "Unknown",
    youtubeId: "EGtQ0HOyrAU",
    coverUrl: "https://i.ytimg.com/vi/EGtQ0HOyrAU/hqdefault.jpg",
    duration: 225, // 03:45
  },
  {
    id: "13",
    title: "That Girl x Talking To The Moon",
    artist: "Unknown",
    youtubeId: "iS7WCFzkMcE",
    coverUrl: "https://i.ytimg.com/vi/iS7WCFzkMcE/hqdefault.jpg",
    duration: 210, // 03:30
  },
  {
    id: "14",
    title: "After Hours",
    artist: "The Weeknd",
    youtubeId: "sI3FS119zNI",
    coverUrl: "https://i.ytimg.com/vi/sI3FS119zNI/hqdefault.jpg",
    duration: 361, // 06:01
  },
  {
    id: "15",
    title: "sweet boy",
    artist: "malcolm todd",
    youtubeId: "fBFUC9JmvfE",
    coverUrl: "https://i.ytimg.com/vi/fBFUC9JmvfE/hqdefault.jpg",
    duration: 175, // 02:55
  },
  {
    id: "16",
    title: "love for you",
    artist: "loveli lori & ovg!",
    youtubeId: "nQVaRFP-ppw",
    coverUrl: "https://i.ytimg.com/vi/nQVaRFP-ppw/hqdefault.jpg",
    duration: 128, // 02:08
  },
  {
    id: "17",
    title: "Die For You",
    artist: "The Weeknd, Ariana Grande",
    youtubeId: "YQ-qToZUybM",
    coverUrl: "https://i.ytimg.com/vi/YQ-qToZUybM/hqdefault.jpg",
    duration: 232, // 03:52
  },
  {
    id: "18",
    title: "Is There Someone Else?",
    artist: "The Weeknd",
    youtubeId: "i4ZuseKFBF0",
    coverUrl: "https://i.ytimg.com/vi/i4ZuseKFBF0/hqdefault.jpg",
    duration: 199, // 03:19
  },
  {
    id: "19",
    title: "50 Feet",
    artist: "SoMo",
    youtubeId: "G7F1eEKhvrs",
    coverUrl: "https://i.ytimg.com/vi/G7F1eEKhvrs/hqdefault.jpg",
    duration: 206, // 03:26
  },
  {
    id: "20",
    title: "Not Around",
    artist: "Nova",
    youtubeId: "CFBAHrqBOLo",
    coverUrl: "https://i.ytimg.com/vi/CFBAHrqBOLo/hqdefault.jpg",
    duration: 180, // 03:00
  },
  {
    id: "21",
    title: "Sienna",
    artist: "The Marías",
    youtubeId: "0L_sUkgrYVw",
    coverUrl: "https://i.ytimg.com/vi/0L_sUkgrYVw/hqdefault.jpg",
    duration: 222, // 03:42
  },
  {
    id: "22",
    title: "Again",
    artist: "Noah cyrus",
    youtubeId: "477YsFDdldQ",
    coverUrl: "https://i.ytimg.com/vi/477YsFDdldQ/hqdefault.jpg",
    duration: 194, // 03:14
  },
  {
    id: "23",
    title: "Strangers",
    artist: "Kenya Grace",
    youtubeId: "S2TaAcwC_zI",
    coverUrl: "https://i.ytimg.com/vi/S2TaAcwC_zI/hqdefault.jpg",
    duration: 173, // 02:53
  },
  {
    id: "24",
    title: "Mind Games",
    artist: "Sickick",
    youtubeId: "QjQliDFIsnk",
    coverUrl: "https://i.ytimg.com/vi/QjQliDFIsnk/hqdefault.jpg",
    duration: 175, // 02:55
  },
  {
    id: "25",
    title: "WRONG",
    artist: "Chris Grey",
    youtubeId: "R_Rir1iguRI",
    coverUrl: "https://i.ytimg.com/vi/R_Rir1iguRI/hqdefault.jpg",
    duration: 178, // 02:58
  },
  {
    id: "26",
    title: "Boyfriend",
    artist: "Ariana Grande, Social House",
    youtubeId: "hTpfiw1i94I",
    coverUrl: "https://i.ytimg.com/vi/hTpfiw1i94I/hqdefault.jpg",
    duration: 186, // 03:06
  },
  {
    id: "27",
    title: "the boy is mine",
    artist: "Ariana Grande",
    youtubeId: "ZqCWXdZFc58",
    coverUrl: "https://i.ytimg.com/vi/ZqCWXdZFc58/hqdefault.jpg",
    duration: 173, // 02:53
  },
  {
    id: "28",
    title: "needy",
    artist: "Ariana Grande",
    youtubeId: "Km__cJEJ3JI",
    coverUrl: "https://i.ytimg.com/vi/Km__cJEJ3JI/hqdefault.jpg",
    duration: 171, // 02:51
  },
  {
    id: "29",
    title: "PARACHUTE",
    artist: "PARYS (feat. Ivy)",
    youtubeId: "h4II9bYqv9I",
    coverUrl: "https://i.ytimg.com/vi/h4II9bYqv9I/hqdefault.jpg",
    duration: 170, // 02:50
  },
  {
    id: "30",
    title: "Shut up My Moms Calling",
    artist: "Hotel Ugly",
    youtubeId: "HuJOVEaOrmw",
    coverUrl: "https://i.ytimg.com/vi/HuJOVEaOrmw/hqdefault.jpg",
    duration: 165, // 02:45
  },
  {
    id: "31",
    title: "Earrings",
    artist: "Malcolm Todd",
    youtubeId: "a4tdS3IB294",
    coverUrl: "https://i.ytimg.com/vi/a4tdS3IB294/hqdefault.jpg",
    duration: 176, // 02:56
  },
  {
    id: "32",
    title: "I Wanna Be Yours",
    artist: "Arctic Monkeys",
    youtubeId: "nyuo9-OjNNg",
    coverUrl: "https://i.ytimg.com/vi/nyuo9-OjNNg/hqdefault.jpg",
    duration: 184, // 03:04
  },
  {
    id: "33",
    title: "3 Strikes",
    artist: "Terror Jr",
    youtubeId: "yJu4MD2hagI",
    coverUrl: "https://i.ytimg.com/vi/yJu4MD2hagI/hqdefault.jpg",
    duration: 187, // 03:07
  },
  {
    id: "34",
    title: "Into It",
    artist: "Chase Atlantic",
    youtubeId: "sMYif8ont4E",
    coverUrl: "https://i.ytimg.com/vi/sMYif8ont4E/hqdefault.jpg",
    duration: 186, // 03:06
  },
  {
    id: "35",
    title: "Heaven Can Wait",
    artist: "Michael Jackson",
    youtubeId: "TDVlDUAIz5k",
    coverUrl: "https://i.ytimg.com/vi/TDVlDUAIz5k/hqdefault.jpg",
    duration: 289, // 04:49
  },
  {
    id: "36",
    title: "BABYDOL",
    artist: "Ari Abdul",
    youtubeId: "evny_w98PjI",
    coverUrl: "https://i.ytimg.com/vi/evny_w98PjI/hqdefault.jpg",
    duration: 106, // 01:46
  },
  {
    id: "37",
    title: "Attention",
    artist: "Charlie Puth",
    youtubeId: "nfs8NYg7yQM",
    coverUrl: "https://i.ytimg.com/vi/nfs8NYg7yQM/hqdefault.jpg",
    duration: 211, // 03:31
  },
  {
    id: "38",
    title: "How Long",
    artist: "Charlie Puth",
    youtubeId: "CwfoyVa980U",
    coverUrl: "https://i.ytimg.com/vi/CwfoyVa980U/hqdefault.jpg",
    duration: 201, // 03:21
  },
  {
    id: "39",
    title: "Please Me",
    artist: "Cardi B & Bruno Mars",
    youtubeId: "3y-O-4IL-PU",
    coverUrl: "https://i.ytimg.com/vi/3y-O-4IL-PU/hqdefault.jpg",
    duration: 201, // 03:21
  },
  {
    id: "40",
    title: "Not Falling",
    artist: "Cao Húc & Dracoooo",
    youtubeId: "42mWG89HO_E",
    coverUrl: "https://i.ytimg.com/vi/42mWG89HO_E/hqdefault.jpg",
    duration: 187, // 03:07
  },
  {
    id: "41",
    title: "Mộng Ức 梦臆",
    artist: "Trâu Bái Bái 邹沛沛",
    youtubeId: "PSXyeswUb64",
    coverUrl: "https://i.ytimg.com/vi/PSXyeswUb64/hqdefault.jpg",
    duration: 175, // 02:55
  },
  {
    id: "42",
    title: "Mind Games",
    artist: "Chris Grey & Sickick",
    youtubeId: "LuExxpIrg4U",
    coverUrl: "https://i.ytimg.com/vi/LuExxpIrg4U/hqdefault.jpg",
    duration: 218, // 03:38
  },
  {
    id: "43",
    title: "Love Options",
    artist: "BESTie",
    youtubeId: "NPqtL1dtrlA",
    coverUrl: "https://i.ytimg.com/vi/NPqtL1dtrlA/hqdefault.jpg",
    duration: 196, // 03:16
  },
  {
    id: "44",
    title: "Đắm chìm x Gone Bá Remix",
    artist: "Đường Quốc Tuấn",
    youtubeId: "aqbi-k_qXI8",
    coverUrl: "https://i.ytimg.com/vi/aqbi-k_qXI8/hqdefault.jpg",
    duration: 239, // 03:59
  },
  {
    id: "45",
    title: "Lipmark",
    artist: "M NAIVE & LiuGrace",
    youtubeId: "-732pAZosi0",
    coverUrl: "https://i.ytimg.com/vi/-732pAZosi0/hqdefault.jpg",
    duration: 198, // 03:18
  },
  {
    id: "46",
    title: "house of cards",
    artist: "BTS",
    youtubeId: "Kwxcso92xIs",
    coverUrl: "https://i.ytimg.com/vi/Kwxcso92xIs/hqdefault.jpg",
    duration: 223, // 03:43
  },
  {
    id: "47",
    title: "Girl You Loud",
    artist: "Unknown",
    youtubeId: "2Ir77eKUP98",
    coverUrl: "https://i.ytimg.com/vi/2Ir77eKUP98/hqdefault.jpg",
    duration: 211, // 03:31
  },
  {
    id: "48",
    title: "Drive You Insane",
    artist: "Daniel Di Angelo",
    youtubeId: "QnP1FYr0dDM",
    coverUrl: "https://i.ytimg.com/vi/QnP1FYr0dDM/hqdefault.jpg",
    duration: 212, // 03:32
  },
  {
    id: "49",
    title: "Ánh Sao Và Bầu Trời",
    artist: "T.R.I x Cá",
    youtubeId: "u8EoYl7OiBU",
    coverUrl: "https://i.ytimg.com/vi/u8EoYl7OiBU/hqdefault.jpg",
    duration: 236, // 03:56
  },
  {
    id: "50",
    title: "Hà Nội - type beat",
    artist: "Unknown",
    youtubeId: "n4fXvwxswbk",
    coverUrl: "https://i.ytimg.com/vi/n4fXvwxswbk/hqdefault.jpg",
    duration: 144, // 02:24
  },
  {
    id: "51",
    title: "We don't talk anymore - Bản Mix",
    artist: "Unknown",
    youtubeId: "4eTHiYtDkAk",
    coverUrl: "https://i.ytimg.com/vi/4eTHiYtDkAk/hqdefault.jpg",
    duration: 147, // 02:27
  }
];

interface MusicPlayerProps {
  isDarkMode: boolean;
}

export default function MusicPlayer({ isDarkMode }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => Math.floor(Math.random() * PLAYLIST.length));
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => PLAYLIST[currentTrackIndex]?.duration || 0);
  const [repeatMode, setRepeatMode] = useState<"all" | "one">("all");
  const [isShuffle, setIsShuffle] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const currentTrack = PLAYLIST[currentTrackIndex];

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const lastTrackChangeRef = useRef<number>(0);

  const handleAutoNext = () => {
    const now = Date.now();
    // Guard against rapid duplicate triggers (e.g. within 2 seconds)
    if (now - lastTrackChangeRef.current < 2000) return;
    lastTrackChangeRef.current = now;

    if (repeatMode === "one") {
      setCurrentTime(0);
      sendPlayerCommand("seekTo", [0, true]);
      sendPlayerCommand("playVideo");
      setIsPlaying(true);
    } else {
      handleNext();
    }
  };

  const handleNextRef = useRef<() => void>(() => {});
  
  // Keep handleNextRef up to date
  useEffect(() => {
    handleNextRef.current = handleAutoNext;
  });

  // Reset progress when track changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(PLAYLIST[currentTrackIndex].duration);
    lastTrackChangeRef.current = Date.now();
  }, [currentTrackIndex]);

  // Timer for smooth second increment during playback whenever isPlaying is true
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (duration > 0 && prev >= duration) {
            setTimeout(() => {
              handleNextRef.current();
            }, 50);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // Auto-play trigger on first user interaction to bypass browser autoplay policies
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (isPlaying) {
        sendPlayerCommand("playVideo");
      }
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [isPlaying]);

  // Listen to iframe postMessages for precise time sync when YouTube sends updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }
        if (data && data.event === "infoDelivery" && data.info) {
          if (data.info.playerState === 1) { // 1 = PLAYING in YouTube API
            setIsPlaying(true);
          } else if (data.info.playerState === 2) { // 2 = PAUSED in YouTube API
            setIsPlaying(false);
          } else if (data.info.playerState === 0) { // 0 = ENDED in YouTube API
            handleNextRef.current();
          }

          const now = Date.now();
          // Only accept position/duration updates if enough time has passed since track change (avoid stale messages from previous iframe)
          if (now - lastTrackChangeRef.current > 1500) {
            if (typeof data.info.currentTime === "number" && data.info.currentTime >= 0) {
              setCurrentTime(Math.floor(data.info.currentTime));
            }
            if (typeof data.info.duration === "number" && data.info.duration > 5) {
              setDuration(Math.floor(data.info.duration));
            }
          }
        }
      } catch {
        // ignore non-json messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    sendPlayerCommand("seekTo", [newTime, true]);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Helper to post messages to YouTube IFrame API
  const sendPlayerCommand = (func: string, args: any = "") => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: func,
            args: args
          }),
          "*"
        );
      } catch (err) {
        console.error("Error communicating with YT frame:", err);
      }
    }
  };

  // Sync isPlaying state with YouTube Iframe Player
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        sendPlayerCommand("playVideo");
        sendPlayerCommand("setVolume", [isMuted ? 0 : volume]);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      sendPlayerCommand("pauseVideo");
    }
  }, [isPlaying, currentTrackIndex]);

  // Sync volume level
  useEffect(() => {
    sendPlayerCommand("setVolume", [isMuted ? 0 : volume]);
  }, [volume, isMuted, currentTrackIndex]);

  const handlePlayPause = () => {
    if (!isIframeLoaded) {
      setIsIframeLoaded(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleShuffleClick = () => {
    setIsIframeLoaded(true);
    setIsShuffle((prev) => !prev);
    lastTrackChangeRef.current = Date.now();
    let nextIndex = Math.floor(Math.random() * PLAYLIST.length);
    if (nextIndex === currentTrackIndex && PLAYLIST.length > 1) {
      nextIndex = (nextIndex + 1) % PLAYLIST.length;
    }
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const handleNext = () => {
    setIsIframeLoaded(true);
    lastTrackChangeRef.current = Date.now();
    if (isShuffle) {
       let nextIndex = Math.floor(Math.random() * PLAYLIST.length);
       if (nextIndex === currentTrackIndex && PLAYLIST.length > 1) {
          nextIndex = (nextIndex + 1) % PLAYLIST.length;
       }
       setCurrentTrackIndex(nextIndex);
    } else {
       setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    }
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setIsIframeLoaded(true);
    lastTrackChangeRef.current = Date.now();
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    setIsPlaying(true);
  };

  const handleSelectTrack = (index: number) => {
    setIsIframeLoaded(true);
    lastTrackChangeRef.current = Date.now();
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setShowQueue(false);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getEmbedUrl = (track: Track) => {
    // enablejsapi=1 allows controlling play/pause/volume, origin ensures cross-origin messages work
    return `https://www.youtube.com/embed/${track.youtubeId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&rel=0&origin=${encodeURIComponent(window.location.origin)}`;
  };

  return (
    <div 
      id="floating-music-widget"
      className="fixed top-16 left-2 sm:left-3 z-[85] font-sans flex flex-col gap-1.5 items-start"
    >
      {/* Hidden YouTube frame to play high-quality music */}
      {isIframeLoaded && (
        <div className="absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0">
          <iframe
            key={`yt-player-${currentTrackIndex}`}
            ref={iframeRef}
            src={getEmbedUrl(currentTrack)}
            title="Nghe nhạc hông nàng yêu Background Player"
            width="200"
            height="200"
            allow="autoplay; encrypted-media"
            className="w-0 h-0"
          />
        </div>
      )}

      <AnimatePresence initial={false}>
        {!isExpanded ? (
          /* COLLAPSED FLOATING DISK MINI PLAYER */
          <motion.div
            key="collapsed-player"
            initial={{ opacity: 0, scale: 0.85, x: -25 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -25 }}
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 p-1.5 px-2 rounded-full shadow-xl border cursor-pointer select-none backdrop-blur-md transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? "bg-gradient-to-r from-[#211b27]/95 via-[#2b203a]/95 to-[#261f35]/95 border-purple-900/50 text-purple-200 shadow-[0_4px_24px_rgba(139,92,246,0.15)] hover:shadow-[0_6px_30px_rgba(139,92,246,0.25)]" 
                : "bg-gradient-to-r from-[#fff0f3]/95 via-[#fffbf9]/95 to-[#f0f5ff]/95 border-pink-200/60 text-rose-700 shadow-[0_4px_24px_rgba(244,180,190,0.25)] hover:shadow-[0_6px_30px_rgba(244,180,190,0.38)]"
            }`}
          >
            {/* Spinning mini vinyl */}
            <div className="relative w-8 h-8 shrink-0">
              <div 
                className="w-full h-full rounded-full bg-stone-950 dark:bg-black border border-stone-800/40 flex items-center justify-center shadow-lg animate-spin-slow"
                style={{ 
                  animationPlayState: isPlaying ? "running" : "paused",
                  boxShadow: isPlaying 
                    ? isDarkMode 
                      ? "0 0 12px 2px rgba(167, 139, 250, 0.4)"
                      : "0 0 12px 2px rgba(244, 63, 94, 0.35)" 
                    : "none"
                }}
              >
                {/* Vinyl texture circles */}
                <div className="absolute inset-1 rounded-full border border-stone-800/20 opacity-50" />
                
                {/* Core cover art */}
                <img 
                  src={currentTrack.coverUrl} 
                  alt={`#Playlist 0${currentTrackIndex + 1}`}
                  className="w-4 h-4 rounded-full object-cover shrink-0 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                
                {/* Center hole pin */}
                <div className="absolute w-1 h-1 rounded-full bg-white border border-stone-900" />
              </div>

              {/* Little sound frequency animation indicator */}
              {isPlaying && (
                <div className="absolute -top-1 -right-1 flex gap-0.5 h-2.5 items-end">
                  <span className="w-0.5 h-2 bg-rose-500 dark:bg-purple-400 animate-bounce" style={{ animationDuration: "0.5s" }} />
                  <span className="w-0.5 h-2.5 bg-rose-500 dark:bg-purple-400 animate-bounce" style={{ animationDuration: "0.7s" }} />
                  <span className="w-0.5 h-1 bg-rose-500 dark:bg-purple-400 animate-bounce" style={{ animationDuration: "0.4s" }} />
                </div>
              )}
            </div>

            {/* Quick Track Metadata */}
            <div className="text-left pr-1 max-w-[95px] hidden sm:block">
              <p className="text-[9.5px] font-bold tracking-wide truncate flex items-center gap-0.5">
                <span>{currentTrack.title}</span>
                <Sparkles className="w-2 h-2 text-amber-400 animate-pulse shrink-0" />
              </p>
              <p className={`text-[7.5px] font-mono truncate ${isDarkMode ? "text-purple-300/80" : "text-rose-500/80"}`}>
                {currentTrack.artist}
              </p>
            </div>

            {/* Compact control button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className={`p-1 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-purple-950/60 text-purple-300 hover:text-purple-200 hover:bg-purple-900/60" 
                  : "bg-rose-50 text-rose-500 hover:bg-rose-100"
              }`}
              title={isPlaying ? "Tạm dừng" : "Nghe nhạc"}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>

            {/* Subtle bottom progress line on collapsed pill */}
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden pointer-events-none">
              <div 
                className={`h-full transition-all duration-300 ${isDarkMode ? "bg-purple-400" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%` }}
              />
            </div>
          </motion.div>
        ) : (
          /* FULL RECORD PLAYER DECK CARD */
          <motion.div
            key="expanded-player"
            initial={{ opacity: 0, scale: 0.92, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -12 }}
            className={`w-64 sm:w-64 rounded-2xl shadow-2xl border flex flex-col p-3.5 backdrop-blur-md transition-all relative overflow-hidden ${
              isDarkMode 
                ? "bg-gradient-to-b from-[#1f172a]/98 via-[#1c1524]/98 to-[#13101a]/98 border-purple-900/50 text-purple-100 shadow-[0_12px_44px_rgba(139,92,246,0.2)]" 
                : "bg-gradient-to-b from-[#ffeef2]/98 via-[#fffafc]/98 to-[#f0f4ff]/98 border-pink-200/80 text-rose-900 shadow-[0_12px_44px_rgba(244,180,190,0.35)]"
            }`}
          >
            {/* Cute sparkles decorative background overlays */}
            <div className="absolute top-12 left-3 opacity-20 pointer-events-none">
              <Sparkles className="w-5 h-5 text-pink-300 animate-pulse" />
            </div>
            <div className="absolute bottom-20 right-4 opacity-15 pointer-events-none">
              <Heart className="w-6 h-6 text-rose-300 fill-rose-200 animate-bounce" style={{ animationDuration: "3s" }} />
            </div>

            {/* Header section with brand and shrink button */}
            <div className="flex items-center justify-between mb-2.5 z-10">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-pink-500 dark:text-purple-400">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400 dark:text-purple-400" />
                Nghe nhạc hông nàng yêu ✨
              </span>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setShowQueue(false);
                }}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isDarkMode 
                    ? "hover:bg-purple-950/60 text-purple-400 hover:text-purple-200" 
                    : "hover:bg-pink-100/60 text-rose-500 hover:text-rose-800"
                }`}
                title="Thu nhỏ"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Stylus Turntable Deck */}
            <div className="flex items-center justify-center gap-4 py-2 relative z-10">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                {/* Turntable plate background with elegant ring */}
                <div className="absolute inset-0.5 rounded-full bg-pink-100/40 dark:bg-purple-950/30 border border-pink-200/30 dark:border-purple-900/20 shadow-inner scale-105 pointer-events-none" />

                {/* Vinyl Record */}
                <div 
                  className="w-24 h-24 rounded-full bg-stone-950 dark:bg-black border border-stone-850/80 flex items-center justify-center shadow-xl animate-spin-slow"
                  style={{ 
                    animationPlayState: isPlaying ? "running" : "paused",
                    boxShadow: isPlaying 
                      ? isDarkMode
                        ? "0 0 20px 5px rgba(167, 139, 250, 0.3)"
                        : "0 0 20px 5px rgba(244, 180, 190, 0.55)" 
                      : "0 6px 16px rgba(0, 0, 0, 0.15)"
                  }}
                >
                  {/* Outer grooves */}
                  <div className="absolute inset-1.5 rounded-full border border-stone-900/40 dark:border-stone-800/30 opacity-70" />
                  <div className="absolute inset-3.5 rounded-full border border-stone-900/35 dark:border-stone-800/25 opacity-70" />
                  <div className="absolute inset-5.5 rounded-full border border-stone-900/30 dark:border-stone-800/20 opacity-70" />
                  <div className="absolute inset-7 rounded-full border border-stone-900/25 dark:border-stone-800/15 opacity-70" />
                  
                  {/* Central Album Label Art */}
                  <img 
                    src={currentTrack.coverUrl} 
                    alt={`#Playlist 0${currentTrackIndex + 1}`}
                    className="w-9 h-9 rounded-full object-cover select-none pointer-events-none border border-stone-900/20 shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Center pin spindle */}
                  <div className="absolute w-2 h-2 rounded-full bg-white border border-stone-900 shadow-md" />
                </div>

                {/* Vinyl stylus tonearm with rotation animation angle ("đĩa nhạc quay một góc") */}
                <div 
                  className="absolute top-0 right-2 w-10 h-10 origin-top-right transition-all duration-1000 pointer-events-none z-10"
                  style={{
                    transform: isPlaying ? "rotate(16deg)" : "rotate(-12deg)"
                  }}
                >
                  {/* Retro stylized tonearm SVG */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    {/* Metal arm */}
                    <path d="M35 6 L21 21 L23 25 L25 23 Z" fill={isDarkMode ? "#c084fc" : "#f472b6"} />
                    <circle cx="35" cy="6" r="3.5" fill="#f43f5e" />
                    {/* Stylus head shell */}
                    <rect x="19" y="23" width="5.5" height="3" rx="0.5" transform="rotate(45 19 23)" fill={isDarkMode ? "#6b21a8" : "#be185d"} />
                  </svg>
                </div>
              </div>
            </div>

            {/* Song Metadata - Decorated in Pastel Theme */}
            <div className="text-center mt-2.5 px-1 z-10">
              <h4 className="text-xs font-bold tracking-wide truncate leading-tight text-rose-800 dark:text-purple-200">
                {currentTrack.title}
              </h4>
              <p className={`text-[10px] font-mono mt-0.5 truncate text-rose-500/85 dark:text-purple-400`}>
                {currentTrack.artist}
              </p>
            </div>

            {/* Interactive Music Seek Bar (Thanh chạy nhạc từ đầu đến cuối) */}
            <div className="mt-3 px-1 z-10 flex flex-col gap-1">
              <div className="relative flex items-center group">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  style={{
                    background: isDarkMode
                      ? `linear-gradient(to right, #c084fc 0%, #c084fc ${((currentTime / (duration || 1)) * 100).toFixed(1)}%, rgba(58, 35, 90, 0.8) ${((currentTime / (duration || 1)) * 100).toFixed(1)}%, rgba(58, 35, 90, 0.8) 100%)`
                      : `linear-gradient(to right, #f43f5e 0%, #f43f5e ${((currentTime / (duration || 1)) * 100).toFixed(1)}%, rgba(251, 207, 232, 0.8) ${((currentTime / (duration || 1)) * 100).toFixed(1)}%, rgba(251, 207, 232, 0.8) 100%)`
                  }}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${
                    isDarkMode 
                      ? "accent-purple-300 hover:accent-purple-200" 
                      : "accent-rose-500 hover:accent-rose-600"
                  }`}
                  title="Tua nhạc từ đầu nhạc đến cuối nhạc"
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono px-0.5 select-none">
                <span className={isDarkMode ? "text-purple-300/90 font-medium" : "text-rose-600/90 font-medium"}>
                  {formatTime(currentTime)}
                </span>
                <span className={isDarkMode ? "text-purple-300/60" : "text-rose-500/60"}>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-3.5 mt-3.5 z-10">
              <button
                onClick={handlePrev}
                className={`p-2 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                  isDarkMode 
                    ? "hover:bg-purple-950 text-purple-400 hover:text-purple-200" 
                    : "hover:bg-pink-100 text-rose-400 hover:text-rose-600"
                }`}
                title="Bài trước"
              >
                <SkipBack className="w-4.5 h-4.5 fill-current" />
              </button>

              <button
                onClick={handlePlayPause}
                className={`p-3 rounded-full shadow-lg hover:scale-108 active:scale-95 transition-all cursor-pointer flex items-center justify-center ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_4px_16px_rgba(167,139,250,0.35)]"
                    : "bg-gradient-to-r from-pink-400 to-rose-400 text-stone-900 shadow-[0_4px_16px_rgba(244,114,182,0.4)]"
                }`}
                title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNext}
                className={`p-2 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                  isDarkMode 
                    ? "hover:bg-purple-950 text-purple-400 hover:text-purple-200" 
                    : "hover:bg-pink-100 text-rose-400 hover:text-rose-600"
                }`}
                title="Bài tiếp"
              >
                <SkipForward className="w-4.5 h-4.5 fill-current" />
              </button>
            </div>

            {/* Bottom Utilities - Volume slider & List toggler */}
            <div className="flex items-center justify-between gap-2.5 mt-3.5 pt-3 border-t border-pink-200/40 dark:border-purple-900/30 z-10">
              <div className="flex items-center gap-1.5 flex-1 max-w-[130px]">
                <button
                  onClick={handleToggleMute}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    isDarkMode 
                      ? "hover:bg-purple-950/60 text-purple-400 hover:text-purple-200" 
                      : "hover:bg-pink-100/50 text-rose-400 hover:text-rose-600"
                  }`}
                  title={isMuted ? "Bật âm" : "Tắt âm"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseInt(e.target.value);
                    setVolume(newVol);
                    if (isMuted && newVol > 0) {
                      setIsMuted(false);
                    }
                  }}
                  className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${
                    isDarkMode ? "bg-purple-950 accent-purple-400" : "bg-pink-100 accent-pink-400"
                  }`}
                  title="Âm lượng"
                />
              </div>

              <div className="flex items-center gap-1">
                {/* Shuffle Button */}
                <button
                  onClick={handleShuffleClick}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    isShuffle
                      ? isDarkMode 
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-pink-500/20 text-pink-600"
                      : isDarkMode
                        ? "hover:bg-purple-950/60 text-purple-400 hover:text-purple-200"
                        : "hover:bg-pink-100/50 text-rose-400 hover:text-rose-600"
                  }`}
                  title={isShuffle ? "Tắt phát ngẫu nhiên" : "Phát ngẫu nhiên"}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                {/* Repeat Button */}
                <button
                  onClick={() => setRepeatMode(prev => prev === "all" ? "one" : "all")}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    repeatMode === "one"
                      ? isDarkMode 
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-pink-500/20 text-pink-600"
                      : isDarkMode
                        ? "hover:bg-purple-950/60 text-purple-400 hover:text-purple-200"
                        : "hover:bg-pink-100/50 text-rose-400 hover:text-rose-600"
                  }`}
                  title={repeatMode === "one" ? "Lặp lại bài này" : "Lặp lại danh sách"}
                >
                  {repeatMode === "one" ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>

                {/* Playlist Queue Button */}
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-wider uppercase border cursor-pointer transition-colors ${
                    showQueue
                      ? isDarkMode
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold"
                        : "bg-pink-500/10 border-pink-500/30 text-pink-500 font-bold"
                      : isDarkMode
                        ? "bg-purple-950/40 border-purple-900/40 text-purple-400 hover:bg-purple-950 hover:text-purple-200"
                        : "bg-[#fff0f3] border-pink-200/50 text-rose-500 hover:bg-pink-50 hover:text-rose-700"
                  }`}
                  title="Danh sách bài hát"
                >
                  <ListMusic className="w-3 h-3" />
                  <span>Danh sách</span>
                </button>
              </div>
            </div>

            {/* Dropdown Playlist Queue List */}
            <AnimatePresence>
              {showQueue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 border-t border-pink-200/40 dark:border-purple-900/30 pt-2.5 flex flex-col gap-1 max-h-36 overflow-y-auto scrollbar-none z-10"
                >
                  {PLAYLIST.map((track, idx) => {
                    const isSelected = idx === currentTrackIndex;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectTrack(idx)}
                        className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? isDarkMode
                              ? "bg-purple-500/15 text-purple-300 font-bold border border-purple-500/20"
                              : "bg-pink-500/10 text-pink-500 font-bold border border-pink-200/50"
                            : isDarkMode
                              ? "hover:bg-purple-950/60 text-purple-300"
                              : "hover:bg-pink-50/50 text-rose-800"
                        }`}
                      >
                        <div className="w-6.5 h-6.5 rounded overflow-hidden bg-pink-100/50 dark:bg-purple-950/50 shrink-0 relative shadow-sm">
                          <img 
                            src={track.coverUrl} 
                            alt={`#Playlist 0${idx + 1}`} 
                            className="w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && isPlaying && (
                            <div className="absolute inset-0 bg-stone-950/25 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 bg-rose-500 dark:bg-purple-400 rounded-full animate-ping" />
                            </div>
                          )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-[10px] truncate leading-normal">{track.title}</p>
                          <p className={`text-[8px] font-mono truncate ${isSelected ? "text-pink-400" : "text-rose-500/60 dark:text-purple-400/60"}`}>
                            {track.artist}
                          </p>
                        </div>
                        <span className="text-[8px] font-mono text-rose-500/60 dark:text-purple-400/60 shrink-0">0{idx + 1}</span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Sound-Off/Mute Toggle Control positioned directly underneath the music player */}
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMuted(!isMuted)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 cursor-pointer ${
            isDarkMode
              ? "bg-gradient-to-r from-[#211b27]/90 to-[#261f35]/90 border-purple-900/40 text-purple-200 shadow-[0_2px_8px_rgba(139,92,246,0.15)] hover:shadow-[0_3px_12px_rgba(139,92,246,0.25)]"
              : "bg-gradient-to-r from-[#fff0f3]/90 via-[#fffbf9]/90 to-[#f0f5ff]/90 border-pink-200/50 text-rose-700 shadow-[0_2px_8px_rgba(244,180,190,0.15)] hover:shadow-[0_3px_12px_rgba(244,180,190,0.25)]"
          }`}
          title={isMuted ? "Bật âm thanh (Unmute)" : "Tắt âm thanh (Mute)"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3 h-3 text-rose-500 dark:text-purple-400 animate-pulse shrink-0" />
              <span className="text-[8px] font-bold font-mono tracking-wider uppercase select-none">Tắt Nhạc 🔕</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3 h-3 text-emerald-500 dark:text-purple-300 animate-bounce shrink-0" />
              <span className="text-[8px] font-bold font-mono tracking-wider uppercase select-none">Bật Nhạc 🎵</span>
            </>
          )}
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
