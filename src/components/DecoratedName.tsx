import React from "react";

interface DecoratedNameProps {
  name: string;
  nameBg?: string;
  nameColor?: string;
  className?: string;
  textClassName?: string;
}

export function getBlendMode(url: string): string {
  if (!url) return "normal";
  
  // Images with black/dark backgrounds that should use "screen" to become transparent
  const darkBgUrls = [
    "4ea83bfcda6a16951caa6f7045f8012a.jpg", // dec_1 🌸
    "13ad66fa910459a650c36c0367204ca0.jpg", // dec_2 🌌
    "27e996bf43d4383fbcc9a82281c4c8b2.jpg", // dec_3 ✨
    "bc9e9b00b0436921528b1b0f6764faa2.jpg", // dec_5 🍃
    "474815a269a57f63e643a3fd849f6de0.jpg", // dec_6 🌠
  ];
  
  const isDarkBg = darkBgUrls.some(path => url.includes(path));
  if (isDarkBg) {
    return "screen"; // screen filters out black, keeping only light/glowing details
  }
  
  // Images with white/light backgrounds that should use "multiply" to become transparent
  const lightBgUrls = [
    "5a8e5a74f3945422a3ca385c336073c8.jpg", // dec_4 🌈
    "406bb31d52378c420dfc40e0818fffbd.jpg", // dec_7 ☁️
    "314ca620279ba6217f88985a9159848b.jpg"  // dec_8 💎
  ];
  const isLightBg = lightBgUrls.some(path => url.includes(path));
  if (isLightBg) {
    return "multiply"; // multiply filters out white, keeping only colorful/darker details
  }
  
  return "normal";
}

export function DecoratedName({
  name,
  nameBg,
  nameColor,
  className = "",
  textClassName = ""
}: DecoratedNameProps) {
  if (!nameBg) {
    return (
      <span 
        className={`${textClassName} transition-colors duration-200`} 
        style={nameColor ? { color: nameColor } : undefined}
      >
        {name}
      </span>
    );
  }

  const blendMode = getBlendMode(nameBg);

  return (
    <span 
      className={`relative inline-flex items-center justify-center px-4.5 py-1.5 rounded-xl overflow-hidden font-extrabold shadow-sm ${className}`}
    >
      {/* Name decoration image background (placed strictly behind) with dynamic blend mode */}
      <span 
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-300 transform scale-105"
        style={{ 
          backgroundImage: `url(${nameBg})`,
          filter: "brightness(0.95)",
          mixBlendMode: blendMode as any
        }}
      />
      {/* Light glassmorphism shimmer overlay for extra premium look */}
      <span className="absolute inset-0 z-[1] bg-white/[0.06] pointer-events-none" />

      {/* Text displayed over the decoration (above background, with high contrast drop shadow) */}
      <span 
        className={`relative z-10 select-none tracking-wide text-shadow-sm filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.65)] ${textClassName}`} 
        style={{ 
          color: nameColor || "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        {name}
      </span>
    </span>
  );
}
