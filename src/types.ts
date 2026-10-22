export interface Feedback {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  rating?: string;   // Nhãn cảm xúc (e.g., "❤️", "🌸", "🌟", "🔥", "🎭")
  avatar?: string;   // Avatar emoji người viết chọn
  starRating?: number; // 1-5 stars
  adminReply?: string;
  adminReplyTimestamp?: string;
}

export interface Character {
  id: string;
  name: string;
  role?: string;         // Vai trò/Nhãn phụ (e.g. Cấp trên, Bạn học)
  plot: string;          // Tóm tắt cốt truyện (Brief plot outline)
  storyline: string;     // Cốt truyện chi tiết (Full storyline)
  link: string;          // Link liên kết nhân vật
  avatar: string;        // Emoji đại diện
  themeColor: string;    // Màu sắc chủ đề (red, orange, yellow, rose, cyan, sky, purple, emerald)
  isCustom?: boolean;
  isFavorite?: boolean;  // Trạng thái yêu thích
  favoritesCount?: number; // Tổng số lượt yêu thích của tất cả user
  feedbacks?: Feedback[]; // Feedback/bình luận của người dùng
  views?: number;        // Số lượt xem (view count)
  note?: string;         // Ghi chú / Lưu ý đặc biệt cho nhân vật (e.g. Bối cảnh không có thật)
  tags?: string[];       // Thể loại / Nhãn phân loại
  category?: string;     // Phân loại danh mục chính
  age?: string;
  gender?: string;
  height?: string;
  occupation?: string;
  relationship?: string;
  pronouns?: string;
  zodiac?: string;
  mbti?: string;
  birthday?: string;
}

export interface SupportReaction {
  id: string; // usually same as userId
  userId: string;
  userName?: string;
  type: 'heart' | 'emote1' | 'emote2' | 'emote3' | 'emote4' | 'emote5';
}

export interface SupportComment {
  id: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface SupportPost {
  id: string;
  authorEmail: string;
  authorName: string;
  authorId?: string;
  content: string;
  mediaUrl?: string; // image, video, link
  mediaType?: 'image' | 'video' | 'link' | 'none';
  timestamp: string;
  comments?: SupportComment[];
}

export interface SecretComment {
  id: string;
  secretId: string;
  author: string;
  content: string;
  image?: string; // base64 image data or URL
  timestamp: string;
  likes?: number;      // Số lượt đồng ý / thả tim của fan
  tag?: string;        // Nhãn thói quen xấu (e.g., "Mê ngủ", "Ngáo ngơ")
}

export interface FeelingPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorEmail?: string;
  content: string;
  characterId: string;
  characterName: string;
  imageUrl?: string;
  timestamp: string;
  heartsCount: number;
  likedBy?: string[]; // Array of user UIDs who liked this post
}


