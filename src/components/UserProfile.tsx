import React, { useState, useEffect, useRef } from "react";
import { User, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { LogIn, LogOut, Loader2, User as UserIcon, Settings, Image as ImageIcon } from "lucide-react";
import { EditProfileModal } from "./EditProfileModal";
import { formatImageUrl } from "../utils/image";

interface UserProfileProps {
  variant?: "icon" | "block";
  isDarkMode: boolean;
}

export function UserProfile({ isDarkMode, variant = "icon" }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customProfile, setCustomProfile] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      const fetchCustom = async () => {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setCustomProfile(snap.data());
          }
        } catch (e) { }
      };
      fetchCustom();
    } else {
      setCustomProfile(null);
    }
  }, [user]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangingCover, setIsChangingCover] = useState(false);
  const [tempCoverUrl, setTempCoverUrl] = useState("");
  const [isSavingCover, setIsSavingCover] = useState(false);

  const handleSaveQuickCover = async () => {
    if (!user) return;
    let finalUrl = tempCoverUrl.trim();
    setIsSavingCover(true);
    try {
      if (
        finalUrl.includes("pin.it") ||
        finalUrl.includes("pinterest.com") ||
        finalUrl.includes("facebook.com") ||
        finalUrl.includes("fb.watch")
      ) {
        const res = await fetch(`/api/extract-image?url=${encodeURIComponent(finalUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            finalUrl = data.imageUrl;
          }
        }
      }
      
      await setDoc(doc(db, "users", user.uid), { coverPhoto: finalUrl }, { merge: true });
      setCustomProfile((prev: any) => ({ ...prev, coverPhoto: finalUrl }));
      setIsChangingCover(false);
    } catch (error) {
      console.error("Lỗi cập nhật ảnh bìa nhanh:", error);
    } finally {
      setIsSavingCover(false);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setDropdownOpen(false);
    } catch (error: any) {
      setDropdownOpen(false);
      console.error("Lỗi đăng nhập Google:", error);
      if (error.code === "auth/configuration-not-found") {
        alert("Bạn cần bật tính năng Đăng nhập bằng Google trong Firebase Console (Authentication -> Sign-in method) cho dự án của bạn.");
      } else if (error.code === "auth/unauthorized-domain") {
        alert(`Domain chưa được cấp phép. Vui lòng thêm domain sau vào Firebase Console -> Authentication -> Settings -> Authorized domains:\n\n${window.location.hostname}`);
      } else if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-blocked") {
        alert("Cửa sổ đăng nhập đã bị đóng hoặc bị trình duyệt chặn.\n\n👉 Nếu bạn đang mở link từ Zalo/Facebook hoặc xem trong khung thu nhỏ, vui lòng chọn 'Mở bằng trình duyệt' (Chrome/Safari) hoặc mở trong thẻ mới rồi thử lại.");
      } else {
        alert("Có lỗi xảy ra khi đăng nhập: " + error.message);
      }
    }
  };



  const handleSignOut = async () => {
    try {
      setDropdownOpen(false);
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };


  if (loading) {
    if (variant === "block") {
      return (
        <div className={`flex items-center justify-center p-3 w-full border rounded-xl ${isDarkMode ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-white"}`}>
          <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
        </div>
      );
    }
    return (
      <div className={`p-2 border rounded-full ${

        isDarkMode ? "border-stone-700 bg-stone-900" : "border-stone-200 bg-white"
      }`}>
        <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
      </div>
    );
  }


  if (variant === "block") {
    if (user) {
      return (
        <>
          <div className={`flex flex-col rounded-2xl border shadow-sm w-full overflow-hidden transition-all duration-300 ${
            isDarkMode 
               ? "bg-stone-900/60 border-stone-800" 
               : "bg-white/90 border-stone-200"
          }`}>
            {/* Cover photo behind avatar */}
            <div 
              id="user-profile-header" 
              className={`h-28 sm:h-32 w-full relative overflow-hidden flex items-center justify-center transition-all group ${
                customProfile?.coverPhoto 
                  ? "" 
                  : isDarkMode 
                    ? "bg-gradient-to-r from-stone-800 via-stone-900 to-purple-950/40" 
                    : "bg-gradient-to-r from-rose-100 via-pink-150 to-amber-100"
              }`}
            >
              {isChangingCover ? (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-3 z-20 transition-all duration-350">
                  <div className="text-[10px] font-sans font-bold text-stone-200 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <span>✨ Dán link ảnh hoặc GIF mới:</span>
                  </div>
                  <div className="flex w-full max-w-[280px] gap-1.5">
                    <input
                      type="url"
                      value={tempCoverUrl}
                      onChange={(e) => setTempCoverUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveQuickCover();
                        } else if (e.key === "Escape") {
                          setIsChangingCover(false);
                          setTempCoverUrl("");
                        }
                      }}
                      placeholder="Link ảnh tĩnh hoặc GIF..."
                      className="flex-1 bg-stone-900/95 border border-stone-700/80 text-xs text-stone-100 px-3 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 placeholder-stone-500 font-medium"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveQuickCover}
                      disabled={isSavingCover}
                      className={`px-3 py-1.5 rounded-xl disabled:bg-stone-800 disabled:text-stone-500 font-bold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm ${
                        isDarkMode 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                          : "bg-emerald-100 hover:bg-emerald-200 text-stone-900 border border-emerald-200"
                      }`}
                      title="Lưu ảnh bìa"
                    >
                      {isSavingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lưu"}
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingCover(false);
                        setTempCoverUrl("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer transition-all active:scale-95 border border-stone-700/50"
                      title="Hủy"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {customProfile?.coverPhoto ? (
                    <img 
                      src={formatImageUrl(customProfile.coverPhoto)} 
                      alt="Ảnh bìa" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`text-[10px] font-sans font-semibold tracking-wider select-none opacity-45 uppercase ${isDarkMode ? "text-stone-500" : "text-stone-400"}`}>
                      Chưa cài đặt ảnh bìa ✨
                    </div>
                  )}

                  {/* Quick Change Cover Photo Button on Hover */}
                  <button
                    onClick={() => {
                      setTempCoverUrl(customProfile?.coverPhoto || "");
                      setIsChangingCover(true);
                    }}
                    className="absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 bg-black/60 hover:bg-black/85 border border-white/20 hover:border-white/40 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-md active:scale-95 select-none"
                    title="Đổi ảnh bìa nhanh"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>ĐỔI ẢNH BÌA</span>
                  </button>
                </>
              )}
            </div>

            {/* Profile info section */}
            <div className="p-4 flex flex-col gap-3 relative">
              {/* Overlapping Avatar container */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 -mt-12 sm:-mt-14 z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 text-center sm:text-left">
                  <div className="relative">
                    <img 
                      src={formatImageUrl(user.photoURL || "") || `https://ui-avatars.com/api/?name=${user.displayName || "User"}&background=random`} 
                      alt="Avatar" 
                      className="user-profile-avatar w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 shadow-md border-white dark:border-stone-900"
                      referrerPolicy="no-referrer"
                    />
                    {customProfile?.avatarFrame && (
                      <img 
                        src={formatImageUrl(customProfile.avatarFrame)} 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.35]" 
                        alt="Frame" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="flex flex-col pb-1 items-center sm:items-start">
                    <div 
                      className={`font-serif font-bold text-base ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}
                      style={customProfile?.nameColor ? { color: customProfile.nameColor } : undefined}
                    >
                      {customProfile?.displayName || user.displayName || "Người dùng"}
                    </div>
                    <div className={`text-xs font-mono mt-0.5 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                      {customProfile?.customUid ? customProfile.customUid : user.email?.split("@")[0]}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                      isDarkMode 
                        ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 hover:text-stone-200" 
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                    title="Chỉnh sửa hồ sơ"
                  >
                    <Settings className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hồ sơ</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                      isDarkMode 
                        ? "bg-red-950/40 border-red-900/40 text-red-300 hover:bg-red-900/60" 
                        : "bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:border-red-200"
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>

              {/* Bio under layout if exists */}
              {customProfile?.bio && (
                <div className={`mt-1 pt-3 border-t text-left flex flex-col gap-1.5 transition-colors duration-300 ${
                  isDarkMode ? "border-stone-800/80" : "border-stone-100"
                }`}>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                    {customProfile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
          {isEditModalOpen && (
            <EditProfileModal 
              user={user}
              isDarkMode={isDarkMode}
              onClose={() => setIsEditModalOpen(false)}
              onUpdated={(updatedData) => {
                if (updatedData) {
                  setCustomProfile(updatedData);
                }
                setUser({ ...user } as User); 
              }}
            />
          )}
        </>
      );
    }

    return (
      <div className={`flex flex-col gap-2 p-4 rounded-xl border shadow-sm w-full transition-all duration-300 ${
        isDarkMode 
           ? "bg-stone-900/60 border-stone-800" 
           : "bg-white/90 border-stone-200"
      }`}>
        <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? "text-stone-500" : "text-stone-400"}`}>
          Đăng nhập để bình luận
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={handleSignInGoogle}
            className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              isDarkMode 
                ? "bg-stone-950 border-stone-800 hover:bg-stone-800 text-stone-200" 
                : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center justify-center p-1.5 sm:p-2 border rounded-full transition-all duration-300 cursor-pointer ${
          isDarkMode 
             ? "border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800" 
             : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
        } ${user ? 'p-1' : ''}`}
        title={user ? "Trang cá nhân" : "Đăng nhập"}
      >
        {user ? (
          <div className="relative w-5 h-5 sm:w-6 sm:h-6">
            <img 
              src={formatImageUrl(user.photoURL || "") || `https://ui-avatars.com/api/?name=${user.displayName || "User"}&background=random`} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            {customProfile?.avatarFrame && (
              <img 
                src={formatImageUrl(customProfile.avatarFrame)} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.35]" 
                alt="Frame" 
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ) : (
          <LogIn className="w-4 h-4" />
        )}
      </button>
      {dropdownOpen && (
        <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border overflow-hidden transition-all duration-200 origin-top-right z-50 ${
          isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200 shadow-black/50" : "bg-white border-stone-200 text-stone-800 shadow-stone-200/50"
        }`}>
          {user ? (
            <div className="flex flex-col">
              <div className={`px-4 py-3 border-b flex flex-col gap-1 items-start ${isDarkMode ? "border-stone-800" : "border-stone-100"}`}>
                <div 
                  className={`font-medium text-sm truncate max-w-full ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}
                  style={customProfile?.nameColor ? { color: customProfile.nameColor } : undefined}
                >
                  {customProfile?.displayName || user.displayName || "Người dùng ẩn danh"}
                </div>
                <div className={`text-xs truncate w-full ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>{customProfile?.customUid ? customProfile.customUid : user.email}</div>
              </div>
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  setIsEditModalOpen(true);
                }}
                className={`flex items-center w-full px-4 py-3 text-sm text-left transition-colors border-b ${
                  isDarkMode ? "hover:bg-stone-800 border-stone-800 text-stone-200" : "hover:bg-stone-50 border-stone-100 text-stone-700"
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Chỉnh sửa hồ sơ
              </button>
              <button 
                onClick={handleSignOut}
                className={`flex items-center w-full px-4 py-3 text-sm text-left transition-colors ${
                  isDarkMode ? "hover:bg-stone-800 text-red-400" : "hover:bg-red-50 text-red-600"
                }`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex flex-col p-2 space-y-1">
              <div className={`px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-stone-500" : "text-stone-400"}`}>
                Đăng nhập bằng
              </div>
              <button 
                onClick={handleSignInGoogle}
                className={`flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-stone-800" : "hover:bg-stone-100"
                }`}
              >
                <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>
          )}
        </div>
      )}
      {isEditModalOpen && user && (
        <EditProfileModal 
          user={user}
          isDarkMode={isDarkMode}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={(updatedData) => {
            if (updatedData) {
              setCustomProfile(updatedData);
            }
            setUser({ ...user } as User); 
          }}
        />
      )}
    </div>
  );
}
