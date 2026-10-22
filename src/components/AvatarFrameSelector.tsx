import React from "react";
import { Check, X, Sparkles } from "lucide-react";
import { formatImageUrl } from "../utils/image";

interface Frame {
  id: string;
  name: string;
  url: string;
}

// Danh sách các khung có sẵn. Sử dụng link tải trực tiếp hoặc lh3 để tránh lỗi hiển thị ảnh từ Google Drive
export const AVATAR_FRAMES: Frame[] = [
  {
    id: "cat_frame",
    name: "Khung Mèo",
    url: "https://lh3.googleusercontent.com/d/13Yi69Rr2DrMPbCNhVDT77D1YYqPhpHDs",
  },
  {
    id: "frame_2",
    name: "Khung Gấu",
    url: "https://lh3.googleusercontent.com/d/10W2MZE_V1NfLLC0BZfoBmF1fiRdmGvg0",
  },
  {
    id: "frame_3",
    name: "Khung Hoa",
    url: "https://lh3.googleusercontent.com/d/1ZPOmSclin9G_V9g3R_FmrnaDE_0EtImb",
  },
  {
    id: "frame_4",
    name: "Khung Rừng",
    url: "https://lh3.googleusercontent.com/d/1Nb4xSCKzYGZulPdtzQ897gPnWXrh4PJ7",
  },
  {
    id: "frame_5",
    name: "Khung Lá",
    url: "https://lh3.googleusercontent.com/d/1DCvI96fhvdjaq0EbKz3XggDr5cdQwQuk",
  },
  {
    id: "frame_6",
    name: "Khung 6",
    url: "https://lh3.googleusercontent.com/d/1sXf7RoSvrNvpBkpQQ1U7_hLNFJJrJk_e",
  },
  {
    id: "frame_7",
    name: "Khung 7",
    url: "https://lh3.googleusercontent.com/d/1R0e3YE_C23fQ9Eier2YvCyrlZLUrAL41",
  },
  {
    id: "frame_8",
    name: "Khung 8",
    url: "https://lh3.googleusercontent.com/d/1m0a2Fa_hgg2g8yOsMV-GRb4gPIdOncuk",
  },
  {
    id: "frame_9",
    name: "Khung 9",
    url: "https://lh3.googleusercontent.com/d/10kpgnPJv0DXYm8282Ap5azq45yERORWN",
  },
  {
    id: "frame_10",
    name: "Khung 10",
    url: "https://lh3.googleusercontent.com/d/1BxVbbOoVKg0aQbGDJMMwsuo5vNjQIL51",
  },
  {
    id: "frame_11",
    name: "Khung 11",
    url: "https://lh3.googleusercontent.com/d/1AbUk70BoGZ9M2WNDrh9L_Vm8bu-j5O-9",
  },
  {
    id: "frame_12",
    name: "Khung 12",
    url: "https://lh3.googleusercontent.com/d/1tFpkC3Iwja9eFsDP5-68liwhU2RkH8y_",
  },
  {
    id: "frame_13",
    name: "Khung 13",
    url: "https://lh3.googleusercontent.com/d/1-jXvIaVUndcWK2TeJkSzm0ZdvGVoqVsE",
  },
  {
    id: "frame_14",
    name: "Khung 14",
    url: "https://lh3.googleusercontent.com/d/1G_dZfmwHV-EgHRyn4OoEZbs5rwoveC5P",
  },
  {
    id: "frame_15",
    name: "Khung 15",
    url: "https://lh3.googleusercontent.com/d/1B2aXmYQDiReqNHBi_8ImPx00n3BD2Wjs",
  },
];

interface AvatarFrameSelectorProps {
  selectedFrame: string;
  onSelectFrame: (url: string) => void;
  isDarkMode: boolean;
}

export function AvatarFrameSelector({
  selectedFrame,
  onSelectFrame,
  isDarkMode,
}: AvatarFrameSelectorProps) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-3 ${
        isDarkMode
          ? "bg-stone-950/40 border-stone-800/80"
          : "bg-rose-500/[0.02] border-rose-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
        <label
          className={`text-sm font-bold ${
            isDarkMode ? "text-stone-300" : "text-stone-700"
          }`}
        >
          Khung Avatar (Trang trí ảnh đại diện)
        </label>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Nút bỏ khung */}
        <button
          type="button"
          onClick={() => onSelectFrame("")}
          className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
            selectedFrame === ""
              ? "border-rose-500 bg-rose-500/10 text-rose-500"
              : "border-stone-300 dark:border-stone-700 text-stone-400"
          }`}
          title="Bỏ khung"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Danh sách khung */}
        {AVATAR_FRAMES.map((frame) => {
          const formattedSelected = formatImageUrl(selectedFrame);
          const isSelected = formattedSelected === frame.url;
          return (
            <button
              key={frame.id}
              type="button"
              onClick={() => onSelectFrame(frame.url)}
              className={`w-14 h-14 rounded-full border-2 p-0.5 transition-all relative ${
                isSelected
                  ? "border-rose-500 ring-2 ring-rose-500/40 bg-stone-100 dark:bg-stone-800"
                  : "border-transparent hover:border-stone-300 dark:hover:border-stone-700 bg-stone-100 dark:bg-stone-800"
              }`}
              title={frame.name}
            >
              <img
                src={frame.url}
                alt={frame.name}
                className="w-full h-full object-contain scale-110"
                referrerPolicy="no-referrer"
              />
              {isSelected && (
                <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-md z-10">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
