import { useEffect, useState } from "react";

// Bookmarks are a per-browser convenience, so they live in localStorage
// rather than in MySQL.
const STORAGE_KEY = "showup_bookmarks";

function readStorage(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
}

function writeStorage(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("showup_bookmarks_changed"));
  } catch {
    // Ignore storage quota errors
  }
}

export function toggleBookmark(id: number): boolean {
  const current = readStorage();
  const exists = current.includes(id);
  const updated = exists ? current.filter((x) => x !== id) : [...current, id];
  writeStorage(updated);
  return !exists;
}

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(readStorage);

  useEffect(() => {
    const handler = () => setBookmarkedIds(readStorage());
    window.addEventListener("showup_bookmarks_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("showup_bookmarks_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return {
    bookmarkedIds,
    isBookmarked: (id: number) => bookmarkedIds.includes(id),
    toggleBookmark,
  };
}
