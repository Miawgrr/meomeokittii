import React, { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, query, orderBy, deleteDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import { SupportPost, SupportReaction } from "../types";
import { Heart, LogOut, Image as ImageIcon, Link as LinkIcon, Send, LogIn, Trash2, Pencil, MessageCircle, Reply } from "lucide-react";
import { formatImageUrl } from "../utils/image";

const EMOTES = {
  emote1: "https://i.pinimg.com/736x/e6/0f/6c/e60f6cf1e1c11080ad280d11bbec6b7d.jpg",
  emote2: "https://i.pinimg.com/736x/76/ed/bf/76edbf20f527ccf63927cbc483c72d8b.jpg",
  emote3: "https://i.pinimg.com/736x/44/0d/eb/440debc7e4b5e3a73b0fe9cba9d6ef46.jpg",
  emote4: "https://i.pinimg.com/736x/45/85/34/458534c26985199f317c4839a689a3d8.jpg",
  emote5: "https://i.pinimg.com/736x/0d/c5/b8/0dc5b8177ecefe0095fe1ab2418c3f52.jpg"
};

export const SupportCorner: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<SupportPost[]>([]);
  const [reactions, setReactions] = useState<Record<string, SupportReaction[]>>({});
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'link' | 'none'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit post states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editMediaType, setEditMediaType] = useState<'image' | 'video' | 'link' | 'none'>('none');
  const [isUpdating, setIsUpdating] = useState(false);

  // Comment states
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});
  
  // Custom profile states
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen to current user's profile changes
  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCurrentUserProfile(docSnap.data());
        }
      });
      return () => unsubscribe();
    } else {
      setCurrentUserProfile(null);
    }
  }, [user]);

  // Listen to all users to grab dynamic profile updates (names, colors, custom avatars)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const profiles: Record<string, any> = {};
      snapshot.docs.forEach(docSnap => {
        profiles[docSnap.id] = docSnap.data();
      });
      setAdminProfiles(profiles);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "support_posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SupportPost));
      setPosts(postsData);
      
      // Load reactions for each post
      postsData.forEach(post => {
        onSnapshot(collection(db, "support_posts", post.id, "reactions"), (reactSnapshot) => {
          const postReactions = reactSnapshot.docs.map(reactDoc => ({ id: reactDoc.id, ...reactDoc.data() } as SupportReaction));
          setReactions(prev => ({ ...prev, [post.id]: postReactions }));
        });
      });
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsSubmitting(true);
    
    try {
      const postId = Date.now().toString();
      const newPost: SupportPost = {
        id: postId,
        authorEmail: user.email || "",
        authorName: currentUserProfile?.displayName || user.displayName || "Thành viên",
        authorId: user.uid,
        content,
        timestamp: new Date().toISOString(),
      };
      
      // Cache author avatar on post creation
      const currentAvatar = currentUserProfile?.photoURL || user.photoURL;
      if (currentAvatar) {
        (newPost as any).authorAvatar = currentAvatar;
      }
      
      if (user.email === "nguyenthao19876.64@gmail.com" && mediaType !== 'none' && mediaUrl) {
        newPost.mediaType = mediaType;
        newPost.mediaUrl = mediaUrl;
      }
      
      await setDoc(doc(db, "support_posts", postId), newPost);
      setContent("");
      setMediaUrl("");
      setMediaType('none');
    } catch (error) {
      console.error("Error posting", error);
      alert("Bạn không có quyền đăng bài!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReact = async (postId: string, type: string) => {
    if (!user) return;
    try {
      const reaction: SupportReaction = {
        id: user.uid,
        userId: user.uid,
        userName: currentUserProfile?.displayName || user.displayName || "Thành viên",
        type: type as any
      };
      await setDoc(doc(db, "support_posts", postId, "reactions", user.uid), reaction);
    } catch (error) {
      console.error("Error reacting", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Nàng có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "support_posts", postId));
    } catch (error) {
      console.error("Error deleting post", error);
      alert("Đã xảy ra lỗi khi xóa bài viết.");
    }
  };

  const startEditing = (post: SupportPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditMediaType(post.mediaType || 'none');
    setEditMediaUrl(post.mediaUrl || '');
  };

  const handleUpdatePost = async () => {
    if (!editingPostId || !editContent.trim() || !user) return;
    setIsUpdating(true);
    try {
      const postRef = doc(db, "support_posts", editingPostId);
      const updateData: Partial<SupportPost> = {
        content: editContent,
      };

      if (user.email === "nguyenthao19876.64@gmail.com" && editMediaType !== 'none' && editMediaUrl) {
        updateData.mediaType = editMediaType;
        updateData.mediaUrl = editMediaUrl;
      } else {
        updateData.mediaType = 'none';
        updateData.mediaUrl = '';
      }

      await updateDoc(postRef, updateData);
      setEditingPostId(null);
    } catch (error) {
      console.error("Error updating post", error);
      alert("Bạn không có quyền chỉnh sửa bài viết này!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) return;
    const commentText = commentDrafts[postId];
    if (!commentText || !commentText.trim()) return;

    setIsCommenting(prev => ({ ...prev, [postId]: true }));
    try {
      const commentId = Date.now().toString();
      const newComment = {
        id: commentId,
        authorId: user.uid,
        authorEmail: user.email || "",
        authorName: currentUserProfile?.displayName || user.displayName || "Thành viên",
        content: commentText.trim(),
        timestamp: new Date().toISOString()
      };

      const postRef = doc(db, "support_posts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      setCommentDrafts(prev => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment", error);
      alert("Bạn không có quyền bình luận vào bài viết này.");
    } finally {
      setIsCommenting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const renderContentWithLinks = (text: string) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-rose-500 hover:text-rose-600 hover:underline break-all font-bold inline-flex items-center gap-1"
          >
            <LinkIcon size={12} className="inline shrink-0" /> {part}
          </a>
        );
      }
      return part;
    });
  };

  const isAdminTextOnly = user?.email === "nguyennthao1987664@gmail.com";
  const isAdminFull = user?.email === "nguyenthao19876.64@gmail.com";
  const canPost = !!user;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-24 md:pb-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/70 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-rose-100/50 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-rose-500 tracking-tight flex items-center gap-2">
            <span className="text-3xl">🌸</span> Góc Hỗ Trợ
          </h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Nơi các admin chia sẻ thông tin mới nhất</p>
        </div>
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span 
                className="text-sm font-bold text-gray-700"
                style={currentUserProfile?.nameColor ? { color: currentUserProfile.nameColor } : undefined}
              >
                {currentUserProfile?.displayName || user.displayName}
              </span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            {(currentUserProfile?.photoURL || user.photoURL) ? (
              <img 
                src={formatImageUrl(currentUserProfile?.photoURL || user.photoURL || "")} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border-2 border-rose-200 object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold">
                {(currentUserProfile?.displayName || user.displayName || "A").charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={handleLogout} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-full font-bold shadow-md shadow-rose-200 transition-all hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <LogIn size={18} />
            Đăng nhập bằng Google
          </button>
        )}
      </div>

      {!user ? (
        <div className="bg-white/50 backdrop-blur-md p-10 rounded-3xl text-center shadow-sm border border-white">
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Yêu cầu đăng nhập</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Vui lòng đăng nhập bằng tài khoản Google để xem các bài viết, thả tim và tương tác tại Góc Hỗ Trợ nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {canPost && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10 opacity-50"></div>
              
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                ✍️ Đăng bài viết mới
              </h3>
              
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung bài viết..."
                className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-rose-200 text-gray-700 resize-none min-h-[100px]"
              />
              
              {isAdminFull && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setMediaType('image')} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${mediaType === 'image' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <ImageIcon size={14} /> Ảnh
                    </button>
                    <button 
                      onClick={() => setMediaType('video')} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${mediaType === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <LinkIcon size={14} /> Video URL
                    </button>
                    <button 
                      onClick={() => setMediaType('link')} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${mediaType === 'link' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <LinkIcon size={14} /> Link
                    </button>
                    {mediaType !== 'none' && (
                      <button 
                        onClick={() => {setMediaType('none'); setMediaUrl('');}} 
                        className="text-xs text-red-500 hover:underline ml-auto self-center"
                      >
                        Hủy đính kèm
                      </button>
                    )}
                  </div>
                  
                  {mediaType !== 'none' && (
                    <input 
                      type="text" 
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={`Nhập URL ${mediaType}...`}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-200 focus:outline-none"
                    />
                  )}
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handlePost}
                  disabled={isSubmitting || !content.trim()}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-sm shadow-rose-200 transition-all active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? "Đang đăng..." : <><Send size={16} /> Đăng bài</>}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                Chưa có bài viết nào ở đây cả ~
              </div>
            ) : (
              posts.map(post => {
                const postReactions = reactions[post.id] || [];
                // Group reactions
                const heartCount = postReactions.filter(r => r.type === 'heart').length;
                const emote1Count = postReactions.filter(r => r.type === 'emote1').length;
                const emote2Count = postReactions.filter(r => r.type === 'emote2').length;
                const emote3Count = postReactions.filter(r => r.type === 'emote3').length;
                const emote4Count = postReactions.filter(r => r.type === 'emote4').length;
                const emote5Count = postReactions.filter(r => r.type === 'emote5').length;
                
                const userReaction = postReactions.find(r => r.userId === user.uid)?.type;

                // Dynamic live avatar resolve
                const authorProfile = post.authorId ? adminProfiles[post.authorId] : null;
                const displayName = authorProfile?.displayName || post.authorName;
                const nameColor = authorProfile?.nameColor;
                const avatarUrl = formatImageUrl(authorProfile?.photoURL || (post as any).authorAvatar || "");

                const ReactionBtn = ({ type, icon, count, url }: { type: string, icon?: React.ReactNode, count: number, url?: string }) => {
                  const isReacted = userReaction === type;
                  return (
                    <button 
                      onClick={() => handleReact(post.id, type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                        isReacted ? 'bg-rose-100 text-rose-600 scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {url ? (
                        <img src={url} alt={type} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        icon
                      )}
                      <span>{count > 0 ? count : ''}</span>
                    </button>
                  );
                };

                return (
                  <div key={post.id} className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-rose-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-rose-100/50" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-orange-300 flex items-center justify-center text-white font-bold shadow-inner">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div>
                        <div 
                          className="font-bold text-gray-800"
                          style={nameColor ? { color: nameColor } : undefined}
                        >
                          {displayName}
                        </div>
                        <div className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString('vi-VN')}</div>
                      </div>
                      
                      <div className="ml-auto flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          post.authorEmail === "nguyennthao1987664@gmail.com" || post.authorEmail === "nguyenthao19876.64@gmail.com"
                            ? "bg-rose-50 text-rose-500" 
                            : "bg-blue-50 text-blue-500"
                        }`}>
                          {post.authorEmail === "nguyennthao1987664@gmail.com" || post.authorEmail === "nguyenthao19876.64@gmail.com" ? "Admin" : "Thành viên"}
                        </span>
                        {(isAdminFull || isAdminTextOnly || post.authorId === user?.uid) && (
                          <>
                            <button
                              onClick={() => startEditing(post)}
                              className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Chỉnh sửa bài viết"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                              title="Xóa bài viết"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingPostId === post.id ? (
                      <div className="mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-200 text-gray-700 resize-none min-h-[100px] mb-3"
                          placeholder="Nhập nội dung bài viết..."
                        />
                        
                        {isAdminFull && (
                          <div className="mb-3 space-y-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditMediaType('image')} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${editMediaType === 'image' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                              >
                                <ImageIcon size={14} /> Ảnh
                              </button>
                              <button 
                                onClick={() => setEditMediaType('video')} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${editMediaType === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                              >
                                <LinkIcon size={14} /> Video URL
                              </button>
                              <button 
                                onClick={() => setEditMediaType('link')} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${editMediaType === 'link' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                              >
                                <LinkIcon size={14} /> Link
                              </button>
                              {editMediaType !== 'none' && (
                                <button 
                                  onClick={() => {setEditMediaType('none'); setEditMediaUrl('');}} 
                                  className="text-xs text-red-500 hover:underline ml-auto self-center"
                                >
                                  Hủy đính kèm
                                </button>
                              )}
                            </div>
                            
                            {editMediaType !== 'none' && (
                              <input 
                                type="text" 
                                value={editMediaUrl}
                                onChange={(e) => setEditMediaUrl(e.target.value)}
                                placeholder={`Nhập URL ${editMediaType}...`}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-200 focus:outline-none"
                              />
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingPostId(null)}
                            className="px-4 py-2 rounded-full font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleUpdatePost}
                            disabled={isUpdating || !editContent.trim()}
                            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-5 py-2 rounded-full font-bold transition-all shadow-sm"
                          >
                            {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4 font-medium text-sm md:text-base">
                          {renderContentWithLinks(post.content)}
                        </div>
                        
                        {post.mediaType === 'image' && post.mediaUrl && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                            <img src={post.mediaUrl} alt="Post media" className="w-full h-auto max-h-[500px] object-contain" />
                          </div>
                        )}
                        
                        {post.mediaType === 'video' && post.mediaUrl && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video">
                            <iframe src={post.mediaUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media"></iframe>
                          </div>
                        )}
                        
                        {post.mediaType === 'link' && post.mediaUrl && (
                          <a 
                            href={post.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mb-4 block p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 border border-rose-100/50 hover:from-rose-100 hover:to-pink-100 transition-all flex items-center justify-between gap-2 font-bold group"
                          >
                            <span className="flex items-center gap-2">
                              <LinkIcon size={18} className="text-rose-500 animate-pulse" /> 
                              <span>Truy cập liên kết đính kèm</span>
                            </span>
                            <span className="text-xs text-rose-400 underline font-mono font-medium truncate max-w-[200px] sm:max-w-[400px]">
                              {post.mediaUrl}
                            </span>
                          </a>
                        )}
                      </>
                    )}
                    
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wider select-none">Tương tác:</span>
                      <ReactionBtn type="heart" icon={<Heart size={16} className={userReaction === 'heart' ? 'fill-rose-500 text-rose-500' : ''} />} count={heartCount} />
                      <ReactionBtn type="emote1" url={EMOTES.emote1} count={emote1Count} />
                      <ReactionBtn type="emote2" url={EMOTES.emote2} count={emote2Count} />
                      <ReactionBtn type="emote3" url={EMOTES.emote3} count={emote3Count} />
                      <ReactionBtn type="emote4" url={EMOTES.emote4} count={emote4Count} />
                      <ReactionBtn type="emote5" url={EMOTES.emote5} count={emote5Count} />
                    </div>

                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        {post.comments.map(comment => {
                          const cAuthorProfile = adminProfiles[comment.authorId] || null;
                          const cAvatarUrl = formatImageUrl(cAuthorProfile?.photoURL || "");
                          const cDisplayName = cAuthorProfile?.displayName || comment.authorName;
                          const cNameColor = cAuthorProfile?.nameColor;
                          const isCAdmin = comment.authorEmail === "nguyennthao1987664@gmail.com" || comment.authorEmail === "nguyenthao19876.64@gmail.com";
                          
                          return (
                            <div key={comment.id} className="flex gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                              {cAvatarUrl ? (
                                <img src={cAvatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">
                                  {cDisplayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span 
                                    className="font-bold text-sm"
                                    style={{ color: cNameColor || (isCAdmin ? '#f43f5e' : '#374151') }}
                                  >
                                    {cDisplayName}
                                  </span>
                                  {isCAdmin && (
                                    <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Admin</span>
                                  )}
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(comment.timestamp).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                                <div className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(isAdminFull || user?.uid === post.authorId) && (
                      <div className="mt-4 flex gap-2">
                        <textarea
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          placeholder={isAdminFull ? "Bình luận với tư cách Admin..." : "Trả lời bình luận..."}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-rose-200 resize-none min-h-[44px]"
                          rows={1}
                        />
                        <button
                          onClick={() => handleComment(post.id)}
                          disabled={!commentDrafts[post.id]?.trim() || isCommenting[post.id]}
                          className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white p-2.5 rounded-2xl transition-all shadow-sm flex items-center justify-center self-end"
                        >
                          <Reply size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
