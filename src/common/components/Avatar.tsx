import { useState } from "react";
import { normalizeImageUrl } from "../../lib/image-utils";

const AVATAR_COLORS = [
  "bg-[#0D47A1]",
  "bg-[#009688]",
  "bg-violet-600",
  "bg-rose-500",
  "bg-amber-600",
];

const AVATAR_SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-16 h-16 text-xl",
};

export function Avatar({
  name,
  size = "sm",
  src,
  photoUrl,
  photo,
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  src?: string | null;
  photoUrl?: string | null;
  photo?: string | null;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const rawSource = src || photoUrl || photo;
  const imageSource = normalizeImageUrl(rawSource);
  const imageError = Boolean(imageSource) && failedSource === imageSource;

  const initials = name
    ? name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const color =
    AVATAR_COLORS[((name && name.charCodeAt(0)) || 0) % AVATAR_COLORS.length];

  if (imageSource && !imageError) {
    return (
      <img
        src={imageSource}
        alt={name || "Avatar"}
        onError={() => setFailedSource(imageSource)}
        className={`${AVATAR_SIZES[size]} rounded-full object-cover shrink-0 border border-slate-200 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${AVATAR_SIZES[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
