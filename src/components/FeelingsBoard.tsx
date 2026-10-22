import React, { useState, useEffect, useRef } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider, db, collection, doc, onSnapshot, setDoc, query, orderBy, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "../lib/firebase";
import { FeelingPost, Character } from "../types";
import { Heart, LogOut, Image as ImageIcon, Send, LogIn, Trash2, HelpCircle, Info, ChevronDown, CheckCircle2, X } from "lucide-react";
import { formatImageUrl, handleImageError, getAvatarFallback } from "../utils/image";
import { motion, AnimatePresence } from "motion/react";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface FeelingsBoardProps {
  isDarkMode: boolean;
  characters: Character[];
}

export const FeelingsBoard: React.FC<FeelingsBoardProps> = ({ isDarkMode, characters }) => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<FeelingPost[]>([]);
  const [content, setContent] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [selectedCharId, setSelectedCharId] = useState<string>("all");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // User custom profile fields
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync current user profile changes
  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCurrentUserProfile(docSnap.data());
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
      return () => unsubscribe();
    } else {
      setCurrentUserProfile(null);
    }
  }, [user]);

  // Sync all user profiles for dynamic avatar, displayName, nameColor
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const profiles: Record<string, any> = {};
      snapshot.docs.forEach((docSnap) => {
        profiles[docSnap.id] = docSnap.data();
      });
      setUserProfiles(profiles);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });
    return () => unsubscribe();
  }, []);

  // Fetch confessions list
  useEffect(() => {
    const q = query(collection(db, "feelings_posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as FeelingPost));
      setPosts(postsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "feelings_posts");
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);

    const postId = Date.now().toString();
    try {
      const targetChar = characters.find((c) => c.id === selectedCharId);
      const characterName = selectedCharId === "all" ? "Tất cả các chồng" : (targetChar?.name || "Các chồng");

      const authorId = (user && !isAnonymous) ? user.uid : "anonymous";
      const authorName = (user && !isAnonymous)
        ? (currentUserProfile?.displayName || user.displayName || "Thành viên")
        : "Nàng ẩn danh 🌸";
      const authorAvatar = (user && !isAnonymous)
        ? (currentUserProfile?.photoURL || user.photoURL || "")
        : "";
      const authorEmail = (user && !isAnonymous) ? (user.email || "") : "";

      const newPost: FeelingPost = {
        id: postId,
        authorId,
        authorName,
        authorAvatar,
        authorEmail,
        content: content.trim(),
        characterId: selectedCharId,
        characterName,
        imageUrl: driveUrl.trim() || undefined,
        timestamp: new Date().toISOString(),
        heartsCount: 0,
        likedBy: []
      };

      await setDoc(doc(db, "feelings_posts", postId), newPost);
      setContent("");
      setDriveUrl("");
    } catch (error) {
      console.error("Lỗi gửi tâm tư:", error);
      alert("Đã xảy ra lỗi khi gửi bài viết. Vui lòng thử lại!");
      handleFirestoreError(error, OperationType.CREATE, `feelings_posts/${postId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactHeart = async (post: FeelingPost) => {
    const uid = user?.uid || "guest_" + (localStorage.getItem("meomeo_guest_id") || "");
    if (!localStorage.getItem("meomeo_guest_id")) {
      localStorage.setItem("meomeo_guest_id", Math.random().toString(36).substring(2, 11));
    }

    const likedByArray = post.likedBy || [];
    const hasLiked = likedByArray.includes(uid);

    try {
      const postRef = doc(db, "feelings_posts", post.id);
      if (hasLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(uid),
          heartsCount: Math.max(0, post.heartsCount - 1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(uid),
          heartsCount: (post.heartsCount || 0) + 1
        });
      }
    } catch (error) {
      console.error("Lỗi thả tim tâm tư:", error);
      handleFirestoreError(error, OperationType.UPDATE, `feelings_posts/${post.id}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmDelete = window.confirm("Nàng có chắc chắn muốn xóa lời tâm tư này không? Hành động này không thể hoàn tác.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "feelings_posts", postId));
    } catch (error) {
      console.error("Lỗi xóa tâm tư:", error);
      alert("Đã xảy ra lỗi khi xóa bài viết.");
      handleFirestoreError(error, OperationType.DELETE, `feelings_posts/${postId}`);
    }
  };

  // Helper mapping character color theme or default pink for categories
  const getThemeColorClass = (charId: string) => {
    if (charId === "all") return "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300";
    const char = characters.find((c) => c.id === charId);
    if (!char) return "bg-stone-50 border-stone-200 text-stone-600 dark:bg-stone-900/40 dark:border-stone-800/40 dark:text-stone-300";

    const color = char.themeColor;
    switch (color) {
      case "rose":
        return "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300";
      case "purple":
        return "bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:border-purple-900/40 dark:text-purple-300";
      case "orange":
        return "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/40 dark:border-orange-900/40 dark:text-orange-300";
      case "yellow":
        return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-300";
      case "cyan":
        return "bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950/40 dark:border-cyan-900/40 dark:text-cyan-300";
      case "sky":
        return "bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-950/40 dark:border-sky-900/40 dark:text-sky-300";
      case "emerald":
        return "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300";
      case "red":
        return "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-300";
      default:
        return "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950/40 dark:border-pink-900/40 dark:text-pink-300";
    }
  };

  const isAdmin = user?.email === "nguyennthao1987664@gmail.com" || user?.email === "nguyenthao19876.64@gmail.com";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Header Card */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-3xl shadow-sm border gap-4 transition-all duration-300 ${
        isDarkMode ? "bg-stone-900/80 border-stone-800" : "bg-white/80 border-rose-100/60 backdrop-blur-md"
      }`}>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-rose-500 tracking-tight flex items-center gap-2">
            <span>💖</span> Gửi tâm tư - lời yêu đến các chồng
          </h2>
          <p className={`font-medium text-xs sm:text-sm mt-1.5 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
            Nơi san sẻ tình yêu, gửi trao lời thương mến thầm kín tới các chàng trai của lòng nàng ✨
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end">
              <span className={`text-xs font-bold ${isDarkMode ? "text-stone-200" : "text-stone-700"}`}>
                {currentUserProfile?.displayName || user.displayName}
              </span>
              <span className="text-[10px] text-gray-400">{user.email}</span>
            </div>
            {(currentUserProfile?.photoURL || user.photoURL) ? (
              <img 
                src={formatImageUrl(currentUserProfile?.photoURL || user.photoURL || "")} 
                alt="Avatar" 
                className="w-9 h-9 rounded-full border-2 border-rose-200 object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-sm">
                {(currentUserProfile?.displayName || user.displayName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md shadow-rose-200/50 transition-all active:scale-95 cursor-pointer"
          >
            <LogIn size={14} />
            Đăng nhập bằng Google
          </button>
        )}
      </div>

      {/* Confession Create Form */}
      <motion.div 
        whileHover={{ y: -2, boxShadow: "0 12px 30px -10px rgba(244, 63, 94, 0.1)" }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`p-5 rounded-3xl shadow-sm border relative overflow-hidden transition-all duration-300 ${
          isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-white border-rose-100/50"
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/40 rounded-bl-full -z-10 dark:bg-rose-950/5"></div>
        
        <h3 className={`font-bold text-sm mb-4 flex items-center gap-1.5 ${isDarkMode ? "text-stone-200" : "text-stone-700"}`}>
          <span>📝</span> Thổ lộ tình yêu mới của nàng
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Target Character Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
              Gửi lời yêu thương tới ai? 💖
            </label>
            <div className="relative">
              <select
                value={selectedCharId}
                onChange={(e) => setSelectedCharId(e.target.value)}
                className={`w-full appearance-none rounded-xl px-3 py-2 text-xs font-semibold outline-none border transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10" 
                    : "bg-stone-50 border-stone-200 text-stone-700 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/50"
                }`}
              >
                <option value="all">💞 Tất cả các chồng nhe~</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    ✨ {c.name} {c.role ? `(${c.role})` : ""}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Anonymity / Profile Option */}
          <div className="flex flex-col gap-1.5 justify-end">
            {user ? (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors duration-300 ${
                  isDarkMode ? "bg-stone-950/40 border-stone-800" : "bg-stone-50/80 border-stone-150"
                }`}
              >
                <input
                  type="checkbox"
                  id="anonymous-toggle"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-400 w-4 h-4 cursor-pointer accent-rose-500"
                />
                <label htmlFor="anonymous-toggle" className={`text-xs font-bold cursor-pointer select-none ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
                  🕵️‍♂️ Đăng ẩn danh (Ẩn thông tin tài khoản)
                </label>
              </motion.div>
            ) : (
              <div className={`flex items-start gap-1.5 p-2 rounded-xl border ${
                isDarkMode ? "bg-stone-950/20 border-stone-800/60" : "bg-amber-50/60 border-amber-100"
              }`}>
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span className={`text-[11px] leading-relaxed font-medium ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
                  Bạn chưa đăng nhập, bài viết sẽ được gửi dưới danh nghĩa <b className="text-rose-500">Nàng ẩn danh 🌸</b>. Nàng có thể đăng nhập Google phía trên để hiện tên nhen!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Confession Text Area */}
        <motion.div 
          whileHover={{ scale: 1.002 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nàng hãy thổ lộ tâm tư, những ngọt ngào thầm kín hay lời yêu thương gửi tới các anh chồng tại đây nhé... 💕"
            className={`w-full rounded-2xl p-4 text-xs sm:text-sm outline-none resize-none min-h-[120px] transition-all border duration-300 ${
              isDarkMode 
                ? "bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500/70 focus:ring-2 focus:ring-rose-500/10" 
                : "bg-stone-50 border-rose-100 focus:border-rose-300 focus:bg-white text-stone-700 focus:ring-4 focus:ring-rose-100/50"
            }`}
          />
        </motion.div>

        {/* Google Drive Upload Field with Help button */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
              <ImageIcon size={14} className="text-rose-400" />
              <span>Link ảnh / GIF (tải lên bằng Google Drive):</span>
            </label>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 select-none cursor-pointer group"
            >
              <HelpCircle size={14} className="group-hover:rotate-12 transition-transform duration-200" />
              <span>Cách lấy link ảnh Drive?</span>
            </button>
          </div>

          {/* Interactive Guide Modal Dialog */}
          <AnimatePresence>
            {showGuide && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop Blur overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowGuide(false)}
                  className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
                />

                {/* Dialog Content Box */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className={`relative w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl border overflow-hidden max-h-[85vh] overflow-y-auto ${
                    isDarkMode 
                      ? "bg-stone-900 border-stone-800 text-stone-100" 
                      : "bg-white border-rose-100 text-stone-800"
                  }`}
                >
                  {/* Decorative flower in background */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100/30 rounded-full blur-3xl dark:bg-rose-950/10 pointer-events-none"></div>

                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-rose-100/20 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 dark:text-rose-300 font-bold">
                        💡
                      </div>
                      <div>
                        <h4 className="text-base md:text-lg font-black tracking-tight text-rose-500">
                          Hướng Dẫn Lấy Link Ảnh Google Drive
                        </h4>
                        <p className={`text-[11px] font-medium ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                          Dễ dàng hiển thị hình ảnh hay GIF lung linh của nàng lên bài viết
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuide(false)}
                      className={`p-2 rounded-xl border hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ${
                        isDarkMode ? "border-stone-800 text-stone-400" : "border-stone-200 text-stone-500"
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Detailed Timeline Steps */}
                  <div className="space-y-5">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-rose-200/50">
                          1
                        </div>
                        <div className="w-0.5 h-12 bg-rose-100 dark:bg-rose-950/30"></div>
                      </div>
                      <div className="flex-1 pb-2">
                        <h5 className="text-xs md:text-sm font-extrabold text-rose-400">Tải ảnh lên Google Drive</h5>
                        <p className={`text-[11px] md:text-xs mt-1 leading-relaxed font-medium ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                          Tải hình ảnh ngọt ngào hoặc tệp GIF động lên tài khoản <b>Google Drive</b> cá nhân của nàng.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-rose-200/50">
                          2
                        </div>
                        <div className="w-0.5 h-12 bg-rose-100 dark:bg-rose-950/30"></div>
                      </div>
                      <div className="flex-1 pb-2">
                        <h5 className="text-xs md:text-sm font-extrabold text-rose-400">Mở cài đặt chia sẻ của ảnh</h5>
                        <p className={`text-[11px] md:text-xs mt-1 leading-relaxed font-medium ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                          Nhấp chuột phải vào tệp ảnh vừa tải (hoặc nhấn biểu tượng dấu ba chấm dọc trên điện thoại) và chọn <b>Chia sẻ (Share)</b>.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-rose-200/50">
                          3
                        </div>
                        <div className="w-0.5 h-12 bg-rose-100 dark:bg-rose-950/30"></div>
                      </div>
                      <div className="flex-1 pb-2">
                        <h5 className="text-xs md:text-sm font-extrabold text-rose-400">Đổi quyền truy cập thành Công khai</h5>
                        <p className={`text-[11px] md:text-xs mt-1 leading-relaxed font-medium ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                          Tại phần <b>Quyền truy cập chung (General access)</b>, chuyển từ trạng thái <i>Bị hạn chế (Restricted)</i> thành <b>Bất kỳ ai có liên kết đều có thể xem (Anyone with the link)</b>.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-md shadow-rose-200/50">
                          4
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs md:text-sm font-extrabold text-rose-400">Sao chép liên kết</h5>
                        <p className={`text-[11px] md:text-xs mt-1 leading-relaxed font-medium ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                          Nhấn nút <b>Sao chép đường liên kết (Copy link)</b>. Sau đó, nàng chỉ việc dán liên kết đó vào ô nhập liệu bên dưới nhen!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informative Tip Box */}
                  <div className={`mt-6 p-4 rounded-2xl border flex gap-3 text-xs leading-relaxed font-medium ${
                    isDarkMode ? "bg-amber-950/20 border-amber-900/40 text-amber-300" : "bg-rose-50/50 border-rose-100 text-stone-600"
                  }`}>
                    <span className="text-lg">💡</span>
                    <div className="space-y-1">
                      <span className="font-extrabold text-rose-500 block">Tự động tối ưu hóa đường dẫn:</span>
                      <span>Hệ thống MeoMeo sẽ tự động chuyển đổi định dạng liên kết Drive của nàng thành liên kết xem trực tiếp, tương thích tốt nhất để hình ảnh tải mượt mà nhất.</span>
                    </div>
                  </div>

                  {/* Action Understood Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowGuide(false)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-md shadow-rose-200/50 transition-all active:scale-95 cursor-pointer"
                    >
                      Đã hiểu luôn nhen 💕
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <input
              type="text"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="Dán liên kết tệp chia sẻ Google Drive tại đây..."
              className={`flex-1 rounded-xl px-4 py-2 text-xs outline-none border transition-all duration-300 ${
                isDarkMode
                  ? "bg-stone-950 border-stone-800 text-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                  : "bg-stone-50 border-rose-150 focus:border-rose-300 focus:bg-white text-stone-700 focus:ring-4 focus:ring-rose-100/50"
              }`}
            />
            {driveUrl && (
              <button
                type="button"
                onClick={() => setDriveUrl("")}
                className={`p-2 rounded-xl border hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
                  isDarkMode ? "border-stone-800 text-stone-400" : "border-stone-200 text-stone-500"
                }`}
                title="Xóa link ảnh"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Link Realtime Image Preview */}
          {driveUrl.trim() && (
            <div className={`mt-3 p-3 rounded-2xl border ${isDarkMode ? "bg-stone-950/40 border-stone-800" : "bg-stone-50 border-rose-100/20"}`}>
              <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Xem trước hình ảnh của nàng:</div>
              <div className="max-w-[200px] rounded-xl overflow-hidden border border-gray-200 bg-black/5 dark:bg-white/5 relative">
                <img
                  src={formatImageUrl(driveUrl)}
                  alt="Ảnh xem trước"
                  className="w-full h-auto object-contain max-h-[150px]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = "https://placehold.co/400x300/fecdd3/e11d48?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh+Drive";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="flex justify-end pt-2 border-t border-dashed border-rose-100/30">
          <motion.button
            whileHover={{ scale: !content.trim() ? 1 : 1.03, y: !content.trim() ? 0 : -1 }}
            whileTap={{ scale: !content.trim() ? 1 : 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={handlePost}
            disabled={isSubmitting || !content.trim()}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-md shadow-rose-200/50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Đang gửi...</span>
            ) : (
              <>
                <Send size={14} />
                <span>Gửi lời yêu thương</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Confessions List Section */}
      <div className="space-y-4">
        <h3 className={`font-serif font-semibold text-lg flex items-center gap-2 transition-colors ${
          isDarkMode ? "text-stone-200" : "text-stone-800"
        }`}>
          ✨ Lời Tâm Tình Đã Gửi ({posts.length})
        </h3>

        {posts.length === 0 ? (
          <div className={`text-center py-12 rounded-3xl border border-dashed text-xs font-medium ${
            isDarkMode ? "border-stone-800 bg-stone-900/20 text-stone-500" : "border-rose-100 bg-rose-50/20 text-stone-400"
          }`}>
            ☘️ Chưa có lời tâm tình nào được thổ lộ. Hãy là người đầu tiên gửi trao lời yêu nhé nàng ơi! 🌸
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => {
              const postUid = post.authorId;
              const isPostAnonymous = postUid === "anonymous";

              // Fetch dynamic user profile properties
              const customProfile = isPostAnonymous ? null : userProfiles[postUid];
              const authorName = customProfile?.displayName || post.authorName;
              const authorColor = customProfile?.nameColor;
              const authorAvatar = formatImageUrl(customProfile?.photoURL || post.authorAvatar || "");

              // User reaction local resolve
              const currentUid = user?.uid || localStorage.getItem("meomeo_guest_id") || "";
              const likedByArray = post.likedBy || [];
              const hasLiked = likedByArray.includes(currentUid);

              return (
                <div 
                  key={post.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 shadow-xs ${
                    isDarkMode 
                      ? "bg-stone-900 border-stone-800 text-stone-200" 
                      : "bg-white border-rose-100/30 hover:border-rose-200"
                  }`}
                >
                  <div>
                    {/* Header: Author & Target Character Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        {authorAvatar ? (
                          <img 
                            src={authorAvatar} 
                            alt="Avatar" 
                            className="w-8.5 h-8.5 rounded-full object-cover border border-rose-100" 
                            referrerPolicy="no-referrer"
                            onError={(e) => handleImageError(e, authorName)}
                          />
                        ) : (
                          <div className="w-8.5 h-8.5 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 dark:text-rose-400 font-bold text-xs shadow-inner select-none">
                            🌸
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span 
                            className="text-xs font-extrabold truncate max-w-[120px]"
                            style={authorColor ? { color: authorColor } : undefined}
                          >
                            {authorName}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {new Date(post.timestamp).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      {/* Character Target Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 tracking-wide ${getThemeColorClass(post.characterId)}`}>
                        💞 Gửi: {post.characterName}
                      </span>
                    </div>

                    {/* Content */}
                    <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed mb-4 font-medium break-words ${
                      isDarkMode ? "text-stone-300" : "text-stone-700"
                    }`}>
                      {post.content}
                    </p>

                    {/* Confession Attachment Image */}
                    {post.imageUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-black/5 dark:bg-white/5 relative">
                        <img 
                          src={formatImageUrl(post.imageUrl)} 
                          alt="Gửi tâm tư" 
                          className="w-full h-auto max-h-[300px] object-contain" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src = "https://placehold.co/400x300/fecdd3/e11d48?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh+Drive";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-dashed border-rose-100/20">
                    <button
                      onClick={() => handleReactHeart(post)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-90 ${
                        hasLiked 
                          ? "bg-rose-100 text-rose-600 scale-105 dark:bg-rose-950/40 dark:text-rose-300" 
                          : "bg-stone-50 hover:bg-stone-100 text-stone-500 dark:bg-stone-950/40 dark:border-stone-800 dark:text-stone-400"
                      }`}
                    >
                      <Heart size={14} className={hasLiked ? "fill-rose-500 text-rose-500 dark:fill-rose-300 dark:text-rose-300" : ""} />
                      <span>Thương ({post.heartsCount || 0})</span>
                    </button>

                    {(isAdmin || (user && post.authorId === user.uid)) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className={`p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-stone-400 hover:text-red-500 transition-colors cursor-pointer active:scale-95`}
                        title="Xóa bài viết"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
