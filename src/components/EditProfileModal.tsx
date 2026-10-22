import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { X, Link as LinkIcon, Loader2, Camera, Smile, Check, Sparkles } from "lucide-react";
import { formatImageUrl } from "../utils/image";
import { MEME_AVATARS, MemeAvatar } from "../data/memeAvatars";
import { AvatarFrameSelector } from "./AvatarFrameSelector";

const SUGGESTED_COLORS = [
  { name: "Trắng tinh khôi", value: "#ffffff" },
  { name: "Hồng ngọt ngào", value: "#ffc9db" },
  { name: "Vàng ánh sương", value: "#fef08a" },
  { name: "Lam thanh mát", value: "#bae6fd" },
  { name: "Xanh lá mạ", value: "#bbf7d0" },
  { name: "Tím mộng mơ", value: "#f3e8ff" },
  { name: "Cam san hô", value: "#fed7aa" },
  { name: "Bóng tối huyền bí", value: "#1c1917" }
];

interface EditProfileModalProps {
  user: User;
  isDarkMode: boolean;
  onClose: () => void;
  onUpdated: (updatedData?: any) => void;
}

export function EditProfileModal({ user, isDarkMode, onClose, onUpdated }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [bio, setBio] = useState("");
  const [customUid, setCustomUid] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [nameColor, setNameColor] = useState("");
  const [avatarFrame, setAvatarFrame] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"meme" | "link">("meme");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bio) setBio(data.bio);
          if (data.customUid) setCustomUid(data.customUid);
          if (data.photoURL && !user.photoURL) setPhotoURL(data.photoURL);
          if (data.coverPhoto) setCoverPhoto(data.coverPhoto);
          if (data.nameColor) setNameColor(data.nameColor);
          if (data.avatarFrame) setAvatarFrame(data.avatarFrame);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin user:", error);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLinkBlur = async () => {
    if (!photoURL.trim()) return;
    try {
      if (
        photoURL.includes("pin.it") ||
        photoURL.includes("pinterest.com") ||
        photoURL.includes("facebook.com") ||
        photoURL.includes("fb.watch")
      ) {
        const res = await fetch(`/api/extract-image?url=${encodeURIComponent(photoURL)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setPhotoURL(data.imageUrl);
          }
        }
      }
    } catch (e) {
      console.error("Failed to extract image:", e);
    }
  };

  const handleCoverBlur = async () => {
    if (!coverPhoto.trim()) return;
    try {
      if (
        coverPhoto.includes("pin.it") ||
        coverPhoto.includes("pinterest.com") ||
        coverPhoto.includes("facebook.com") ||
        coverPhoto.includes("fb.watch")
      ) {
        const res = await fetch(`/api/extract-image?url=${encodeURIComponent(coverPhoto)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setCoverPhoto(data.imageUrl);
          }
        }
      }
    } catch (e) {
      console.error("Failed to extract cover image:", e);
    }
  };

  const handleSave = async () => {
    const trimmedDisplayName = displayName.trim();
    const trimmedPhotoURL = photoURL.trim();
    const trimmedBio = bio.trim();

    if (!trimmedDisplayName) {
      alert("Vui lòng nhập tên hiển thị");
      return;
    }
    
    // Optimistic Save: Update the UI instantly and close the modal.
    // The background promise handles persistent storage on the Firebase server.
    const updatedData = {
      displayName: trimmedDisplayName,
      photoURL: trimmedPhotoURL,
      bio: trimmedBio,
      customUid: customUid.trim(),
      socialLink: "",
      socialPlatform: "",
      coverPhoto: coverPhoto.trim(),
      nameBg: "",
      nameColor: nameColor,
      avatarFrame: avatarFrame,
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Immediately update parent component's state so local UI reflects changes with 0ms latency
      onUpdated(updatedData);
      
      // 2. Immediately close the edit modal so there is no spinner/waiting
      onClose();

      // 3. Fire-and-forget the actual network requests in the background
      const userRef = doc(db, "users", user.uid);
      Promise.all([
        updateProfile(user, {
          displayName: trimmedDisplayName,
          photoURL: trimmedPhotoURL || null,
        }),
        setDoc(userRef, updatedData, { merge: true }),
      ]).catch((error) => {
        console.error("Lỗi ngầm khi lưu thông tin Firebase:", error);
      });
    } catch (error: any) {
      console.error("Lỗi khi tối ưu lưu hồ sơ:", error);
      // Fallback if anything goes wrong
      alert("Có lỗi xảy ra: " + error.message);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-lg p-6 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
          isDarkMode ? "bg-stone-900 text-stone-200" : "bg-white text-stone-800"
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold">Chỉnh sửa hồ sơ</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? "hover:bg-stone-800 text-stone-400 hover:text-stone-200"
                : "hover:bg-stone-100 text-stone-500 hover:text-stone-700"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1">
          {/* Integrated Profile Preview */}
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className={`relative w-full rounded-2xl overflow-hidden border shadow-md transition-all duration-300 ${
              isDarkMode ? "border-stone-800 bg-stone-950/60" : "border-stone-200 bg-white"
            }`}>
              {/* Cover Photo Preview */}
              <div className={`h-24 w-full relative overflow-hidden transition-all ${
                coverPhoto 
                  ? "" 
                  : isDarkMode 
                    ? "bg-gradient-to-r from-stone-800 via-stone-900 to-purple-950/40" 
                    : "bg-gradient-to-r from-rose-100 via-pink-150 to-amber-100"
              }`}>
                {coverPhoto && (
                  <img
                    src={formatImageUrl(coverPhoto)}
                    alt="Cover Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {/* Avatar Preview overlay */}
              <div className="absolute left-4 bottom-2 flex items-end gap-2.5">
                <div className="relative group">
                  <img
                    src={
                      formatImageUrl(photoURL) ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        displayName || "User"
                      )}&background=random`
                    }
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className={`w-14 h-14 rounded-full object-cover border-4 shadow-md transition-all duration-200 ${
                      isDarkMode ? "border-stone-900" : "border-white"
                    }`}
                  />
                  {avatarFrame && (
                    <img 
                      src={formatImageUrl(avatarFrame)} 
                      alt="Frame" 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.35]" 
                    />
                  )}
                </div>
                <div className="mb-0.5 text-left bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/10 flex flex-col items-start justify-center gap-0.5 min-h-[36px]">
                  <p 
                    className="text-xs font-bold leading-tight select-none text-stone-100"
                    style={nameColor ? { color: nameColor } : undefined}
                  >
                    {displayName || "Họ và tên"}
                  </p>
                  <p className="text-[9px] text-stone-200 leading-none font-mono">{customUid || user.email?.split("@")[0]}</p>
                </div>
              </div>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Xem trước trang cá nhân</span>
          </div>

          {/* Display Name */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
              Tên hiển thị
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors ${
                isDarkMode ? "bg-stone-950 border-stone-800 text-stone-200" : "bg-stone-50 border-stone-200 text-stone-800"
              }`}
              placeholder="Nhập tên của bạn"
            />
          </div>

          {/* Custom Font Color Choice */}
          <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
            isDarkMode ? "bg-stone-950/40 border-stone-800/80" : "bg-rose-500/[0.02] border-rose-100"
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
              <label className={`text-sm font-bold ${isDarkMode ? "text-stone-300" : "text-stone-700"}`}>
                Màu sắc chữ của tên hiển thị
              </label>
            </div>
            
            <div className="flex flex-wrap gap-1.5 items-center">
              {/* Suggested Color Palette */}
              {SUGGESTED_COLORS.map((col) => {
                const isColorSelected = nameColor === col.value;
                return (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => setNameColor(col.value)}
                    style={{ backgroundColor: col.value }}
                    className={`w-6.5 h-6.5 rounded-full border shadow-xs flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
                      isColorSelected 
                        ? "ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-stone-900 scale-105" 
                        : "border-stone-300 dark:border-stone-700"
                    }`}
                    title={col.name}
                  >
                    {isColorSelected && (
                      <Check 
                        className="w-3.5 h-3.5 stroke-[3]" 
                        style={{ color: col.value === "#ffffff" || col.value === "#fef08a" ? "#1c1917" : "#ffffff" }} 
                      />
                    )}
                  </button>
                );
              })}

              {/* Direct Color Picker input */}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="color"
                  value={nameColor || "#ffffff"}
                  onChange={(e) => setNameColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-stone-300 dark:border-stone-700 cursor-pointer overflow-hidden bg-transparent"
                  title="Chọn màu tự do"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {nameColor || "Mặc định"}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Picture Chooser */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
              Lựa chọn ảnh đại diện
            </label>

            {/* Tab Selection */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab("meme")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-sm font-medium rounded-xl transition-all border ${
                  activeTab === "meme"
                    ? isDarkMode
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                      : "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                    : isDarkMode
                    ? "bg-stone-800/50 text-stone-400 border-transparent hover:bg-stone-800"
                    : "bg-stone-100 text-stone-500 border-transparent hover:bg-stone-200"
                }`}
              >
                <Smile className="w-4 h-4 text-rose-500" />
                <span>Ảnh meme</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-sm font-medium rounded-xl transition-all border ${
                  activeTab === "link"
                    ? isDarkMode
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                      : "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                    : isDarkMode
                    ? "bg-stone-800/50 text-stone-400 border-transparent hover:bg-stone-800"
                    : "bg-stone-100 text-stone-500 border-transparent hover:bg-stone-200"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Link ảnh</span>
              </button>
            </div>

            {/* Meme Gallery Tab Content */}
            {activeTab === "meme" && (
              <div
                className={`p-3 rounded-2xl border ${
                  isDarkMode ? "bg-stone-950/60 border-stone-800" : "bg-stone-50/80 border-stone-200"
                }`}
              >
                {/* Meme Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {MEME_AVATARS.map((meme) => {
                    const isSelected = photoURL === meme.url;
                    return (
                      <button
                        key={meme.id}
                        type="button"
                        onClick={() => setPhotoURL(meme.url)}
                        title={meme.name}
                        className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all duration-150 focus:outline-none ${
                          isSelected
                            ? "border-rose-500 ring-2 ring-rose-500/40 scale-95"
                            : isDarkMode
                            ? "border-stone-800 hover:border-rose-400/50 hover:scale-105"
                            : "border-stone-200 hover:border-rose-400/50 hover:scale-105"
                        }`}
                      >
                        <img
                          src={formatImageUrl(meme.url)}
                          alt={meme.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
                            <div className="bg-rose-500 text-white rounded-full p-1 shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] leading-tight text-white font-medium text-center truncate">
                            {meme.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Link Input Tab Content */}
            {activeTab === "link" && (
              <div className="space-y-1.5">
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  onBlur={handleLinkBlur}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors ${
                    isDarkMode ? "bg-stone-950 border-stone-800 text-stone-200" : "bg-stone-50 border-stone-200 text-stone-800"
                  }`}
                  placeholder="Dán link ảnh (Pinterest, Facebook, Drive...)"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Hỗ trợ dán trực tiếp link từ Pinterest, Google Drive, Facebook...
                </p>
              </div>
            )}
          </div>

          {/* Avatar Frame Selection */}
          <AvatarFrameSelector
            selectedFrame={avatarFrame}
            onSelectFrame={setAvatarFrame}
            isDarkMode={isDarkMode}
          />

          {/* Cover Photo Input */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
              Ảnh bìa (Cover Photo)
            </label>
            <input
              type="url"
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              onBlur={handleCoverBlur}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors ${
                isDarkMode ? "bg-stone-950 border-stone-800 text-stone-200" : "bg-stone-50 border-stone-200 text-stone-800"
              }`}
              placeholder="Dán link ảnh bìa/gif (Pinterest, Drive, Facebook...)"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Hỗ trợ cả link ảnh tĩnh và ảnh GIF từ Pinterest, Drive,... giúp trang cá nhân sinh động hơn!
            </p>
          </div>

          {/* Custom UID */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
              ID Người dùng (UID)
            </label>
            <input
              type="text"
              value={customUid}
              onChange={(e) => setCustomUid(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors ${
                isDarkMode ? "bg-stone-950 border-stone-800 text-stone-200" : "bg-stone-50 border-stone-200 text-stone-800"
              }`}
              placeholder="Ví dụ: @meomeokitty"
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
              Tiểu sử (Tuỳ chọn)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-colors ${
                isDarkMode ? "bg-stone-950 border-stone-800 text-stone-200" : "bg-stone-50 border-stone-200 text-stone-800"
              }`}
              placeholder="Vài dòng giới thiệu về bản thân..."
              rows={2}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-stone-200/20 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
              isDarkMode
                ? "bg-stone-800 text-stone-300 hover:bg-stone-700"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md ${
              isDarkMode 
                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20" 
                : "bg-rose-100 text-stone-900 border border-rose-200 hover:bg-rose-200"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
