export interface Sticker {
  id: string;
  url: string;
  category: "happy" | "love" | "money" | "sad" | "angry" | "sleepy" | "cute";
  name: string;
}

// 11 Sticker images requested by user from Pinterest
export const STICKER_COLLECTION: Sticker[] = [
  {
    id: "stk_1",
    url: "https://i.pinimg.com/736x/17/5f/72/175f72e2b11cda0289733ef22cbe14d6.jpg",
    category: "happy",
    name: "Sticker 1",
  },
  {
    id: "stk_2",
    url: "https://i.pinimg.com/736x/a2/aa/a3/a2aaa360bc739899fde5f1d9d5af0e69.jpg",
    category: "love",
    name: "Sticker 2",
  },
  {
    id: "stk_3",
    url: "https://i.pinimg.com/736x/54/86/0b/54860b1348588f36fd77c30d46040d27.jpg",
    category: "cute",
    name: "Sticker 3",
  },
  {
    id: "stk_4",
    url: "https://i.pinimg.com/736x/b5/25/67/b52567aea2271e072700aade77670915.jpg",
    category: "happy",
    name: "Sticker 4",
  },
  {
    id: "stk_5",
    url: "https://i.pinimg.com/736x/55/da/81/55da81945aff80a2f860274f8cbf661d.jpg",
    category: "money",
    name: "Sticker 5",
  },
  {
    id: "stk_6",
    url: "https://i.pinimg.com/736x/47/de/88/47de88bad4a59c38802e6388387b00a9.jpg",
    category: "angry",
    name: "Sticker 6",
  },
  {
    id: "stk_7",
    url: "https://i.pinimg.com/736x/e2/63/11/e26311905f05b5ac6ad3709d2fae3d8c.jpg",
    category: "sad",
    name: "Sticker 7",
  },
  {
    id: "stk_8",
    url: "https://i.pinimg.com/736x/33/2c/6d/332c6dcccc981838f9947e7222459f20.jpg",
    category: "sleepy",
    name: "Sticker 8",
  },
  {
    id: "stk_9",
    url: "https://i.pinimg.com/736x/05/95/47/0595475074b426ee265ff19bf4766b89.jpg",
    category: "love",
    name: "Sticker 9",
  },
  {
    id: "stk_10",
    url: "https://i.pinimg.com/736x/17/ad/41/17ad413dd49b7e3d9c814fdcfd9ddaa7.jpg",
    category: "cute",
    name: "Sticker 10",
  },
  {
    id: "stk_11",
    url: "https://i.pinimg.com/736x/d5/14/70/d51470380374b5bfffc74e7e58a334c8.jpg",
    category: "happy",
    name: "Sticker 11",
  },
  {
    id: "stk_12",
    url: "https://i.pinimg.com/736x/8f/6c/08/8f6c0853f9e21c59ab4bec967d62fca3.jpg",
    category: "cute",
    name: "Sticker 12",
  },
  {
    id: "stk_13",
    url: "https://i.pinimg.com/736x/09/e9/e2/09e9e2926f9ce3ecb987c2f1e28fb16a.jpg",
    category: "love",
    name: "Sticker 13",
  },
  {
    id: "stk_14",
    url: "https://i.pinimg.com/736x/92/67/62/926762fef636e31bb8eeb4b7b6eea7a5.jpg",
    category: "happy",
    name: "Sticker 14",
  },
  {
    id: "stk_15",
    url: "https://i.pinimg.com/736x/fd/cd/29/fdcd298a8f87d657af19411b428318fb.jpg",
    category: "cute",
    name: "Sticker 15",
  },
  {
    id: "stk_16",
    url: "https://i.pinimg.com/736x/ce/1e/9f/ce1e9f3066e49afe5bbb686c767a9762.jpg",
    category: "sad",
    name: "Sticker 16",
  },
  {
    id: "stk_17",
    url: "https://i.pinimg.com/736x/47/85/dc/4785dcb69488a06a69d7ebe80b73f36c.jpg",
    category: "love",
    name: "Sticker 17",
  },
  {
    id: "stk_18",
    url: "https://i.pinimg.com/736x/45/78/54/4578542797d808c1387d7cf4d3adebcb.jpg",
    category: "happy",
    name: "Sticker 18",
  },
  {
    id: "stk_19",
    url: "https://i.pinimg.com/736x/61/5b/0c/615b0cf1ec0b571b955251bb6c19b18b.jpg",
    category: "love",
    name: "Sticker 19",
  },
  {
    id: "stk_20",
    url: "https://i.pinimg.com/736x/13/7d/27/137d27dd7680fa1c148b7a57ca18bf6a.jpg",
    category: "cute",
    name: "Sticker 20",
  },
  {
    id: "stk_21",
    url: "https://i.pinimg.com/736x/c3/b1/be/c3b1be422036534c8055d256531a5b60.jpg",
    category: "love",
    name: "Sticker 21",
  },
  {
    id: "stk_22",
    url: "https://i.pinimg.com/736x/3b/10/93/3b10939210e1373656d9d89131971862.jpg",
    category: "sleepy",
    name: "Sticker 22",
  },
  {
    id: "stk_23",
    url: "https://i.pinimg.com/736x/a4/96/9d/a4969d67429520ade788f3ff8335fb88.jpg",
    category: "angry",
    name: "Sticker 23",
  },
  {
    id: "stk_24",
    url: "https://i.pinimg.com/736x/ec/52/52/ec5252ce4421f9e0a96477b1f9bf68ff.jpg",
    category: "happy",
    name: "Sticker 24",
  },
  {
    id: "stk_25",
    url: "https://i.pinimg.com/736x/83/e5/1d/83e51d7e4a53ca4c70cc53914f8e8eba.jpg",
    category: "sad",
    name: "Sticker 25",
  },
  {
    id: "stk_26",
    url: "https://i.pinimg.com/736x/50/ae/5d/50ae5dbb7ece57c8d9ef06c7540750aa.jpg",
    category: "cute",
    name: "Sticker 26",
  },
];

// Helper to pick a sticker based on category or context
export const getStickerForContext = (
  context: "money" | "love" | "happy" | "sad" | "angry" | "sleepy" | "cute" | string
): Sticker => {
  const matchCat = STICKER_COLLECTION.filter((s) => s.category === context);
  if (matchCat.length > 0) {
    return matchCat[Math.floor(Math.random() * matchCat.length)];
  }
  // Default pick randomly from full list
  return STICKER_COLLECTION[Math.floor(Math.random() * STICKER_COLLECTION.length)];
};

// Smart auto-detector for text content -> sticker category
export const detectStickerCategoryFromText = (
  text: string
): "money" | "love" | "happy" | "sad" | "angry" | "sleepy" | "cute" => {
  const lower = text.toLowerCase();

  if (
    lower.includes("chuyển") ||
    lower.includes("tiền") ||
    lower.includes("vnđ") ||
    lower.includes("100k") ||
    lower.includes("mô hình") ||
    lower.includes("mua")
  ) {
    return "money";
  }
  if (
    lower.includes("yêu") ||
    lower.includes("thương") ||
    lower.includes("ngượng") ||
    lower.includes("thích") ||
    lower.includes("mê") ||
    lower.includes("đẹp trai") ||
    lower.includes("xinh")
  ) {
    return "love";
  }
  if (
    lower.includes("buồn") ||
    lower.includes("khóc") ||
    lower.includes("tội") ||
    lower.includes("nhớ") ||
    lower.includes("xin lỗi")
  ) {
    return "sad";
  }
  if (
    lower.includes("dỗi") ||
    lower.includes("tức") ||
    lower.includes("ghét") ||
    lower.includes("đừng") ||
    lower.includes("hờn")
  ) {
    return "angry";
  }
  if (
    lower.includes("ngủ") ||
    lower.includes("mệt") ||
    lower.includes("comfy") ||
    lower.includes("lười")
  ) {
    return "sleepy";
  }
  if (
    lower.includes("hi") ||
    lower.includes("chào") ||
    lower.includes("vui") ||
    lower.includes("cười") ||
    lower.includes("hihi") ||
    lower.includes("hehe")
  ) {
    return "happy";
  }

  return "cute";
};
