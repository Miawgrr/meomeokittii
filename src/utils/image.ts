import React from "react";

// Helper utilities for handling character profile images safely on mobile and desktop devices.

export const formatImageUrl = (url: string): string => {
  if (!url) return "";
  let clean = url.trim();

  // Convert http:// to https:// to prevent mobile mixed-content blocking
  if (clean.startsWith("http://")) {
    clean = "https://" + clean.substring(7);
  }

  // Handle Google Drive links (convert preview/view links to direct CDN view links)
  // e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // or https://drive.google.com/open?id=FILE_ID
  const driveFileMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveIdMatch = clean.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  // Handle Dropbox links (dl=0 -> raw=1)
  if (clean.includes("dropbox.com") && clean.includes("dl=0")) {
    clean = clean.replace("dl=0", "raw=1");
  }

  // Handle Pinterest links (redirect through proxy to extract og:image)
  if (clean.includes("pin.it") || clean.includes("pinterest.com")) {
    return `/api/image-redirect?url=${encodeURIComponent(clean)}`;
  }

  return clean;
};

export const isImageUrl = (str: string): boolean => {
  if (!str) return false;
  const clean = str.trim();

  // Data URIs or Blob URIs
  if (clean.startsWith("data:image/") || clean.startsWith("blob:")) return true;

  // Local assets starting with / or ./ or ../
  if (clean.startsWith("/") || clean.startsWith("./") || clean.startsWith("../")) {
    return true;
  }

  // Web URLs starting with http:// or https://
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return true;
  }

  // Common image extensions
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(clean)) {
    return true;
  }

  return false;
};

export const getAvatarFallback = (name: string): string => {
  const cleanName = (name || "MeoMeo").trim();
  const seed = encodeURIComponent(cleanName);
  // Using a clean letter avatar badge with pastel rose background instead of random adventurer illustrations
  return `https://ui-avatars.com/api/?name=${seed}&background=f43f5e&color=ffffff&bold=true&size=256`;
};

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  name: string
) => {
  const target = e.currentTarget;
  target.onerror = null; // Prevent infinite loop
  target.src = getAvatarFallback(name);
};

export const formatAudioUrl = (url: string): string => {
  if (!url) return "";
  let clean = url.trim();
  let driveUrl = "";
  
  const driveFileMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    driveUrl = `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`;
  }
  const driveIdMatch = clean.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    driveUrl = `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`;
  }

  if (driveUrl) {
    return `/api/audio-proxy?url=${encodeURIComponent(driveUrl)}`;
  }
  
  return clean;
};
