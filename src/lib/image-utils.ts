export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // If the URL is an upload containing an obsolete or hardcoded IP/host (e.g. http://192.168.1.44:8888/uploads/...)
  // extract the relative /uploads/... path so it proxies to the active backend cleanly.
  const uploadIndex = trimmed.indexOf("/uploads/");
  if (uploadIndex !== -1) {
    const uploadPath = trimmed.slice(uploadIndex);
    const envBase = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
    return envBase ? `${envBase}${uploadPath}` : uploadPath;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const envBase = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return envBase ? `${envBase}${path}` : path;
}
