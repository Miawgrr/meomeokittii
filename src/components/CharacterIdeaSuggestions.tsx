import React, { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { 
  Heart, 
  MessageSquare, 
  Send, 
  Plus, 
  Sparkles, 
  User as UserIcon, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  MessageCircle,
  Filter,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playMeowSound } from "../utils/audio";

interface SuggestionComment {
  id: string;
  authorName: string;
  authorPhotoUrl: string | null;
  authorId: string | null;
  content: string;
  createdAt: string;
}

interface CharacterSuggestion {
  id: string;
  name: string;
  source: string;
  description: string;
  plotIdea: string;
  imageUrl: string;
  createdAt: string;
  authorId: string | null;
  authorName: string;
  authorPhotoUrl: string | null;
  upvotes: string[]; // List of user UIDs who liked
  comments: SuggestionComment[];
  status: "pending" | "approved" | "done" | "rejected";
  adminNotes?: string;
}

interface Props {
  isDarkMode: boolean;
  currentPastel: any;
}

export default function CharacterIdeaSuggestions({ isDarkMode, currentPastel }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<CharacterSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Custom nickname for Guest submissions
  const [guestName, setGuestName] = useState("");

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<"cooking" | "done">("cooking");
  const [searchQuery, setSearchQuery] = useState("");

  // Comments / Expand details state
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [guestCommentNames, setGuestCommentNames] = useState<Record<string, string>>({});

  // Admin notes input state
  const [adminNotesText, setAdminNotesText] = useState<Record<string, string>>({});
  const [editingAdminNotesId, setEditingAdminNotesId] = useState<string | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Sync suggestions from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "character_suggestions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: CharacterSuggestion[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CharacterSuggestion);
      });
      setSuggestions(list);
      setSyncError(null);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi đồng bộ dữ liệu ý tưởng:", error);
      setSyncError("Không thể đồng bộ dữ liệu ý tưởng từ hệ thống đám mây. Vui lòng tải lại trang hoặc kiểm tra kết nối!");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Determine if current user is admin
  const isAdmin = currentUser?.email === "nguyenthao19876.64@gmail.com";

  // Submit suggestion
  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!ideaText.trim()) {
      setFormError("Vui lòng nhập ý tưởng của bảo bối.");
      return;
    }

    playMeowSound();

    let authorName = "Nàng giấu tên 🌸";
    let authorPhotoUrl = null;

    if (currentUser) {
      authorName = currentUser.displayName || currentUser.email?.split("@")[0] || "Người dùng Google";
      authorPhotoUrl = currentUser.photoURL;
    } else if (guestName.trim()) {
      authorName = guestName.trim() + " 🐾";
    }

    const ideaTitle = ideaText.trim().length > 40
      ? ideaText.trim().substring(0, 40) + "..."
      : ideaText.trim();

    const suggestionId = "sug_" + Date.now();
    const newSuggestion: CharacterSuggestion = {
      id: suggestionId,
      name: ideaTitle,
      source: "",
      description: ideaText.trim(),
      plotIdea: "",
      imageUrl: "",
      createdAt: new Date().toISOString(),
      authorId: currentUser ? currentUser.uid : null,
      authorName,
      authorPhotoUrl,
      upvotes: [],
      comments: [],
      status: "pending"
    };

    try {
      await setDoc(doc(db, "character_suggestions", suggestionId), newSuggestion);
      setFormSuccess(true);
      // Reset form
      setIdeaText("");
      setGuestName("");
      // Close form after a brief delay
      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Lỗi thêm ý tưởng:", err);
      setFormError("Không thể gửi ý tưởng. Vui lòng thử lại!");
    }
  };

  // Upvote suggestion
  const handleUpvote = async (suggestionId: string, currentUpvotes: string[]) => {
    playMeowSound();
    if (!currentUser) {
      alert("Cần đăng nhập bằng Google để thả tim/upvote ý tưởng nha nàng! ❤️ (Bấm nút avatar ở thanh công cụ phía trên)");
      return;
    }

    const postRef = doc(db, "character_suggestions", suggestionId);
    const hasUpvoted = currentUpvotes.includes(currentUser.uid);

    try {
      if (hasUpvoted) {
        await updateDoc(postRef, {
          upvotes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          upvotes: arrayUnion(currentUser.uid)
        });
      }
    } catch (e) {
      console.error("Lỗi upvote:", e);
    }
  };

  // Add Comment
  const handleAddComment = async (suggestionId: string) => {
    const text = newCommentText[suggestionId] || "";
    if (!text.trim()) return;

    playMeowSound();

    let commentAuthorName = "Ẩn danh 🌸";
    let commentAuthorPhoto = null;

    if (currentUser) {
      commentAuthorName = currentUser.displayName || currentUser.email?.split("@")[0] || "Người dùng Google";
      commentAuthorPhoto = currentUser.photoURL;
    } else {
      const gName = guestCommentNames[suggestionId] || "";
      if (gName.trim()) {
        commentAuthorName = gName.trim() + " 🐾";
      }
    }

    const newComment: SuggestionComment = {
      id: "cmt_" + Date.now(),
      authorId: currentUser ? currentUser.uid : null,
      authorName: commentAuthorName,
      authorPhotoUrl: commentAuthorPhoto,
      content: text.trim(),
      createdAt: new Date().toISOString()
    };

    const postRef = doc(db, "character_suggestions", suggestionId);
    try {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        await updateDoc(postRef, {
          comments: [...suggestion.comments, newComment]
        });
        // Clear input
        setNewCommentText(prev => ({ ...prev, [suggestionId]: "" }));
        setGuestCommentNames(prev => ({ ...prev, [suggestionId]: "" }));
      }
    } catch (e) {
      console.error("Lỗi đăng bình luận:", e);
    }
  };

  // Admin: Update Status
  const handleUpdateStatus = async (suggestionId: string, status: "pending" | "approved" | "done" | "rejected") => {
    playMeowSound();
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, "character_suggestions", suggestionId), { status });
    } catch (e) {
      console.error("Lỗi cập nhật trạng thái:", e);
    }
  };

  // Admin: Save Admin Notes
  const handleSaveAdminNotes = async (suggestionId: string) => {
    playMeowSound();
    if (!isAdmin) return;

    const notes = adminNotesText[suggestionId] || "";
    try {
      await updateDoc(doc(db, "character_suggestions", suggestionId), { 
        adminNotes: notes.trim() 
      });
      setEditingAdminNotesId(null);
    } catch (e) {
      console.error("Lỗi lưu ghi chú của admin:", e);
    }
  };

  // Delete Suggestion (Only admin or the original submitter if logged in)
  const handleDeleteSuggestion = async (suggestionId: string, authorId: string | null) => {
    if (!confirm("Nàng có chắc chắn muốn xóa gợi ý này không?")) return;

    playMeowSound();
    const canDelete = isAdmin || (currentUser && authorId === currentUser.uid);
    if (!canDelete) {
      alert("Nàng không có quyền xóa gợi ý này!");
      return;
    }

    try {
      await deleteDoc(doc(db, "character_suggestions", suggestionId));
    } catch (e) {
      console.error("Lỗi xóa gợi ý:", e);
    }
  };

  // Formatting date helper
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 30) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return "Cách đây lâu";
    }
  };

  // Filter & Search suggestions
  const filteredSuggestions = suggestions.filter((s) => {
    // Search query match
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Show all suggestions in a single unified feed
    return true;
  });

  // Sort based on active filter (Newest first)
  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro section */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-2xs ${currentPastel.badgeBg} ${currentPastel.badgeText}`}>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Nơi Chắp Cánh Cho Các Ý Tưởng</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-serif font-light mb-2 transition-colors ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
          Góp Ý Tưởng Làm Char
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
          Có ý tưởng nhưng không biết làm? Không sao cứ ném idea vô đây nếu nàng muốn xem tui sẽ cook idea nàng như nào, cứ thoải mái nhé, iu iu
        </p>
      </div>

      {/* Suggestion Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm ý tưởng, tác phẩm, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs py-2.5 pl-9 pr-4 rounded-xl border outline-hidden transition-all ${
              isDarkMode 
                ? "bg-stone-900 border-stone-800 text-stone-200 placeholder-stone-500 focus:border-rose-900 focus:ring-1 focus:ring-rose-950" 
                : "bg-white border-stone-200 text-stone-800 placeholder-stone-400 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
            }`}
          />
          <div className="absolute left-3 top-3.5 text-stone-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Suggest Button */}
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            playMeowSound();
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            showAddForm
              ? isDarkMode ? "bg-stone-800 border border-stone-700 text-stone-300" : "bg-stone-100 text-stone-600"
              : currentPastel.primaryBtnBg
          }`}
        >
          {showAddForm ? (
            <>Đóng Form 🌟</>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Gửi Ý Tưởng Mới</span>
            </>
          )}
        </button>
      </div>

      {/* Suggestion form drawer/card */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleAddSuggestion}
              className={`border p-6 rounded-2xl shadow-xs space-y-4 ${
                isDarkMode 
                  ? "bg-stone-900/60 border-stone-800/80" 
                  : "bg-white border-stone-200/80"
              }`}
            >
              <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                <Sparkles className="w-4 h-4 text-rose-400" />
                Phiếu Đóng Góp Ý Tưởng Làm Bot
              </h3>

              {/* Nhập ý tưởng của bảo bối */}
              <div className="space-y-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                  Nhập ý tưởng của bảo bối ở đây tới MeoMeo, Meo sẽ xem và sẽ làm nếu trong khả năng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ví dụ: Làm husbando Scaramouche nhưng bối cảnh là học sinh lớp bên cạnh hay ghen ghét mình..."
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  className={`w-full text-xs p-3 rounded-lg border outline-hidden resize-none ${
                    isDarkMode 
                      ? "bg-stone-950 border-stone-850 text-stone-100 focus:border-rose-900" 
                      : "bg-stone-50 border-stone-200 text-stone-800 focus:border-rose-300"
                  }`}
                />
              </div>

              {/* Submitter Name (If guest) */}
              {!currentUser && (
                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                    Biệt danh của nàng (Không bắt buộc)
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập biệt danh của bạn (mặc định: Nàng giấu tên 🌸)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={`w-full text-xs p-2.5 rounded-lg border outline-hidden ${
                      isDarkMode 
                        ? "bg-stone-950 border-stone-850 text-stone-100 focus:border-rose-900" 
                        : "bg-stone-50 border-stone-200 text-stone-800 focus:border-rose-300"
                    }`}
                  />
                </div>
              )}

              {/* Status Display */}
              {formError && (
                <div className="text-xs text-rose-500 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-950/20 p-2.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ý tưởng của bảo bối đã gửi lên mây thành công! Đang đóng form... ✨</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                    isDarkMode 
                      ? "border-stone-850 text-stone-400 hover:bg-stone-850" 
                      : "border-stone-200 text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-bold ${currentPastel.primaryBtnBg}`}
                >
                  GỬI GỢI Ý 🌟
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-stone-200/50 dark:border-stone-850/50 pb-3">
        <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
        <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
          Có ý tưởng hay? Góp tại đây nào ✨
        </span>
      </div>

      {/* Sync Error Alert Banner */}
      {syncError && (
        <div className="mb-6 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200/20 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Lỗi đồng bộ dữ liệu:</p>
            <p className="leading-relaxed text-stone-600 dark:text-stone-300">{syncError}</p>
          </div>
        </div>
      )}

      {/* Suggestions Feed Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 dark:border-stone-800 border-t-rose-400 dark:border-t-purple-400 animate-spin" />
          <p className="text-xs text-stone-400 font-medium">Đang dọn phòng đón ý tưởng...</p>
        </div>
      ) : sortedSuggestions.length === 0 ? (
        <div className={`border rounded-2xl p-16 text-center space-y-4 max-w-lg mx-auto ${
          isDarkMode ? "bg-stone-900/20 border-stone-850/40" : "bg-stone-50/50 border-stone-100"
        }`}>
          <div className="text-3xl text-stone-400">🐈</div>
          <p className={`text-xs ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
            Chưa có ý tưởng nào trong mục này. Hãy là người đầu tiên đóng góp ý tưởng siêu cute của bạn nhé!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className={`px-4 py-2 rounded-lg text-xs font-bold ${currentPastel.primaryBtnBg}`}
          >
            Góp Ý Tưởng Đầu Tiên 🌸
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedSuggestions.map((sug) => {
            const hasUpvoted = currentUser ? sug.upvotes.includes(currentUser.uid) : false;
            const isExpanded = expandedSuggestionId === sug.id;
            const canDelete = isAdmin || (currentUser && sug.authorId === currentUser.uid);

            return (
              <motion.div
                key={sug.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border p-5 rounded-2xl flex flex-col transition-all duration-300 hover:shadow-xs relative ${
                  isDarkMode 
                    ? "bg-stone-900/40 border-stone-850/80 hover:bg-stone-900/60" 
                    : "bg-[#fffdfb] border-stone-200/60 hover:bg-white"
                }`}
              >
                {/* Status and Action Header */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-1.5">
                    {/* Status badges */}
                    {sug.status === "pending" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200/50 dark:border-stone-750">
                        <Clock className="w-2.5 h-2.5" />
                        Đang Chờ
                      </span>
                    )}
                    {sug.status === "approved" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Đã Duyệt
                      </span>
                    )}
                    {sug.status === "done" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Đã Làm Xong 🎉
                      </span>
                    )}
                    {sug.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                        <XCircle className="w-2.5 h-2.5" />
                        Chưa Thích Hợp
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Time creation */}
                    <span className="text-[10px] text-stone-400">{formatTimeAgo(sug.createdAt)}</span>

                    {/* Delete Suggestion Button */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteSuggestion(sug.id, sug.authorId)}
                        className="text-stone-400 hover:text-rose-500 p-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Xóa ý tưởng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submitter info */}
                <div className="flex items-center gap-2.5 mb-4">
                  {sug.authorPhotoUrl ? (
                    <img 
                      src={sug.authorPhotoUrl} 
                      alt={sug.authorName} 
                      className="w-6 h-6 rounded-full ring-1 ring-stone-200/50 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] text-stone-500 ring-1 ring-stone-200/50">
                      <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  )}
                  <div className="text-[11px]">
                    <span className={`font-bold ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>{sug.authorName}</span>
                    <span className="text-stone-400 mx-1">•</span>
                    <span className="text-stone-400">Đóng góp ý tưởng</span>
                  </div>
                </div>

                {/* Suggestion Content Layout */}
                <div className="flex gap-4 items-start mb-4">
                  {/* Suggestion Text details */}
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <h4 className={`text-base font-serif font-bold ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                        {sug.name}
                      </h4>
                      {sug.source && sug.source !== "Nguyên tác tự do" && sug.source !== "" && (
                        <p className={`text-[10px] inline-block px-1.5 py-0.5 rounded-md mt-1 border ${
                          isDarkMode 
                            ? "bg-stone-900 border-stone-800 text-stone-400" 
                            : "bg-stone-50 border-stone-100 text-stone-500"
                        }`}>
                          🎨 {sug.source}
                        </p>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                      {(sug.source && sug.source !== "Nguyên tác tự do") || sug.plotIdea || sug.imageUrl ? (
                        <>
                          <strong>Tính cách:</strong> {sug.description}
                        </>
                      ) : (
                        sug.description
                      )}
                    </p>

                    {sug.plotIdea && (
                      <p className={`text-xs leading-relaxed bg-stone-500/5 p-2.5 rounded-xl border border-stone-500/10 ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                        <strong>Bối cảnh:</strong> {sug.plotIdea}
                      </p>
                    )}
                  </div>

                  {/* Reference Image */}
                  {sug.imageUrl && (
                    <div className="w-20 sm:w-24 aspect-square rounded-xl overflow-hidden shadow-xs border border-stone-200/30 dark:border-stone-800/50 shrink-0 relative group">
                      <img 
                        src={sug.imageUrl} 
                        alt={sug.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Hide on broken image url
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Admin Notes Box */}
                {sug.adminNotes && (
                  <div className="mb-4 text-xs bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/20 p-3 rounded-xl space-y-1">
                    <div className="flex items-center gap-1 font-bold text-[10px] uppercase text-rose-500">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      Phản hồi từ Admin
                    </div>
                    <p className={isDarkMode ? "text-stone-300" : "text-stone-700"}>{sug.adminNotes}</p>
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between gap-4 border-t border-stone-200/40 dark:border-stone-850/30 pt-3 mt-auto">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleUpvote(sug.id, sug.upvotes)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-semibold cursor-pointer ${
                      hasUpvoted
                        ? "bg-rose-500/15 text-rose-500 border border-rose-500/20"
                        : isDarkMode 
                          ? "bg-stone-900 text-stone-400 border border-stone-800 hover:text-rose-400" 
                          : "bg-stone-50 text-stone-500 border border-stone-200/50 hover:text-rose-500 hover:bg-rose-50/30"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 transition-transform ${hasUpvoted ? "fill-current scale-110 text-rose-500" : ""}`} />
                    <span>Thả Tim ({sug.upvotes.length})</span>
                  </button>

                  {/* Comment Toggle */}
                  <button
                    onClick={() => {
                      setExpandedSuggestionId(isExpanded ? null : sug.id);
                      playMeowSound();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-xs font-semibold cursor-pointer ${
                      isExpanded
                        ? isDarkMode ? "bg-stone-800 text-stone-100" : "bg-stone-100 text-stone-800"
                        : isDarkMode 
                          ? "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40" 
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Thảo Luận ({sug.comments.length})</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Details / Comments and Admin Controls */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-stone-200/40 dark:border-stone-850/30 mt-3 pt-3 space-y-4"
                    >
                      {/* Admin Controls Box */}
                      {isAdmin && (
                        <div className="border border-purple-500/20 bg-purple-500/5 p-3.5 rounded-xl space-y-3">
                          <div className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                            👑 Khu Vực Quản Lý (Admin Only)
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: "pending", label: "Đợi Duyệt", color: isDarkMode ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-700 border border-stone-200" },
                              { id: "approved", label: "Duyệt & Chờ Làm", color: isDarkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900 border border-blue-200" },
                              { id: "done", label: "Đánh Dấu Xong", color: isDarkMode ? "bg-green-600 text-white" : "bg-green-100 text-green-900 border border-green-200" },
                              { id: "rejected", label: "Từ Chối", color: isDarkMode ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-900 border border-rose-200" }
                            ].map((st) => (
                              <button
                                key={st.id}
                                onClick={() => handleUpdateStatus(sug.id, st.id as any)}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer hover:opacity-90 transition-opacity ${
                                  sug.status === st.id ? "ring-2 ring-purple-500 border border-purple-400" : ""
                                } ${st.color}`}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>

                          {/* Edit Admin Notes */}
                          {editingAdminNotesId === sug.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                rows={2}
                                value={adminNotesText[sug.id] || ""}
                                onChange={(e) => setAdminNotesText(prev => ({ ...prev, [sug.id]: e.target.value }))}
                                placeholder="Viết phản hồi cho nàng (Ví dụ: Mình sẽ làm trong tuần này nha...)"
                                className={`w-full text-xs p-2.5 rounded-lg border outline-hidden ${
                                  isDarkMode ? "bg-stone-950 border-stone-800 text-white" : "bg-white border-stone-200 text-stone-800"
                                }`}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingAdminNotesId(null)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-stone-700 text-stone-200 cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleSaveAdminNotes(sug.id)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer ${
                                    isDarkMode 
                                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                                      : "bg-purple-100 text-purple-950 border border-purple-200 hover:bg-purple-200"
                                  }`}
                                >
                                  Lưu phản hồi
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingAdminNotesId(sug.id);
                                setAdminNotesText(prev => ({ ...prev, [sug.id]: sug.adminNotes || "" }));
                              }}
                              className="text-[10px] font-bold text-purple-400 hover:underline block"
                            >
                              {sug.adminNotes ? "📝 Chỉnh sửa phản hồi của Admin" : "➕ Thêm phản hồi của Admin"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Comments Feed */}
                      <div className="space-y-3">
                        <h5 className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                          Thảo luận ý tưởng ({sug.comments.length})
                        </h5>

                        {sug.comments.length === 0 ? (
                          <p className="text-[10px] text-stone-400 italic">Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {sug.comments.map((cmt) => (
                              <div 
                                key={cmt.id} 
                                className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
                                  isDarkMode 
                                    ? "bg-stone-950/60 border-stone-900/50 text-stone-300" 
                                    : "bg-stone-50/50 border-stone-100 text-stone-700"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    {cmt.authorPhotoUrl ? (
                                      <img src={cmt.authorPhotoUrl} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[8px]">
                                        🌸
                                      </div>
                                    )}
                                    <span className="font-bold text-[10px]">{cmt.authorName}</span>
                                  </div>
                                  <span className="text-[9px] text-stone-400">{formatTimeAgo(cmt.createdAt)}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{cmt.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Box */}
                        <div className="space-y-2 pt-1.5">
                          {/* Guest nickname if not logged in */}
                          {!currentUser && (
                            <input
                              type="text"
                              placeholder="Biệt danh của bạn (mặc định: Ẩn danh 🌸)"
                              value={guestCommentNames[sug.id] || ""}
                              onChange={(e) => setGuestCommentNames(prev => ({ ...prev, [sug.id]: e.target.value }))}
                              className={`w-full text-[10px] px-2 py-1.5 rounded-lg border outline-hidden ${
                                isDarkMode ? "bg-stone-950 border-stone-900 text-stone-200" : "bg-stone-50 border-stone-150 text-stone-800"
                              }`}
                            />
                          )}

                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Nhập bình luận hoặc đóng góp cốt truyện..."
                              value={newCommentText[sug.id] || ""}
                              onChange={(e) => setNewCommentText(prev => ({ ...prev, [sug.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddComment(sug.id);
                                }
                              }}
                              className={`w-full text-xs py-2 pl-3 pr-10 rounded-lg border outline-hidden ${
                                isDarkMode 
                                  ? "bg-stone-950 border-stone-900 text-stone-100 placeholder-stone-500 focus:border-rose-900" 
                                  : "bg-white border-stone-200 text-stone-800 placeholder-stone-400 focus:border-rose-300"
                              }`}
                            />
                            <button
                              onClick={() => handleAddComment(sug.id)}
                              className="absolute right-2 top-2 text-rose-400 hover:text-rose-500 p-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
