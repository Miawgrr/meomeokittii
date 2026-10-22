// src/data/voices.ts

// Hệ thống Voice "Gốc" (Pre-recorded) phân theo cảm xúc và nhân vật.
// Bạn có thể dễ dàng thay đổi các link này thành link âm thanh thực tế (Google Drive, Firebase, v.v.)
export const CHARACTER_VOICES: Record<string, Record<string, string[]>> = {
  "Tần Quyết Doãn": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_1.ogg",
    ],
    "flirting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_2.ogg",
    ],
    "sad": [
      "https://actions.google.com/sounds/v1/human_voices/man_sigh.ogg",
    ],
    "angry": [
      "https://actions.google.com/sounds/v1/human_voices/man_clearing_throat.ogg",
    ]
  },
  "Tô Nhược Vũ": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_1.ogg", // Thay bằng link voice Trung "Xin chào"
    ],
    "flirting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_2.ogg", // Thay bằng link voice Trung "Bảo bối..."
    ],
    "sad": [
      "https://actions.google.com/sounds/v1/human_voices/man_sigh.ogg", // Thay bằng link voice Trung "Anh buồn..."
    ],
    "angry": [
      "https://actions.google.com/sounds/v1/human_voices/man_clearing_throat.ogg",
    ]
  },
  "Kanzaki Ren": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_1.ogg",
    ],
    "flirting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_2.ogg",
    ],
    "sad": [
      "https://actions.google.com/sounds/v1/human_voices/man_sigh.ogg",
    ],
    "angry": [
      "https://actions.google.com/sounds/v1/human_voices/man_clearing_throat.ogg",
    ]
  },
  "Lục Tiêu": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_1.ogg",
    ],
    "flirting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_2.ogg",
    ]
  },
  "Kaven Nyx": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_1.ogg",
    ],
    "flirting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_2.ogg",
    ]
  },
  "Haru - Welcome Home": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_1.ogg",
    ],
    "flirting": [
      "https://actions.google.com/sounds/v1/human_voices/male_laugh_2.ogg",
    ],
    "sad": [
      "https://actions.google.com/sounds/v1/human_voices/man_sigh.ogg",
    ],
    "angry": [
      "https://actions.google.com/sounds/v1/human_voices/man_clearing_throat.ogg",
    ]
  },
  // Các nhân vật nữ
  "Lạc Lạc": {
    "greeting": [
      "https://actions.google.com/sounds/v1/human_voices/female_laugh.ogg",
    ],
    "cute": [
      "https://actions.google.com/sounds/v1/human_voices/female_laugh.ogg",
    ]
  },
  "default": {
    "greeting": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"],
    "cute": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"],
    "flirting": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"],
    "sad": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"],
    "angry": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"],
    "love": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"],
    "money": ["https://actions.google.com/sounds/v1/human_voices/human_sniff.ogg"]
  }
};

export const getVoiceForCharacter = (charName: string, emotionTag: string): string | undefined => {
  const normalizedEmotion = emotionTag.toLowerCase().trim();
  const charVoices = CHARACTER_VOICES[charName];
  
  if (charVoices && charVoices[normalizedEmotion] && charVoices[normalizedEmotion].length > 0) {
    const list = charVoices[normalizedEmotion];
    return list[Math.floor(Math.random() * list.length)];
  }
  
  // Rơi về default nếu không có voice cụ thể của nhân vật
  const defaultVoices = CHARACTER_VOICES["default"];
  if (defaultVoices && defaultVoices[normalizedEmotion] && defaultVoices[normalizedEmotion].length > 0) {
    const list = defaultVoices[normalizedEmotion];
    return list[Math.floor(Math.random() * list.length)];
  }

  return undefined;
};
