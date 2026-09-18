import { useEffect, useState } from "react";

const STORAGE_KEY = "feastify_bookmarks";

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("feastify_bookmarks_changed"));
  } catch {
    // Ignore storage quota errors
  }
}

export function getBookmarkedIds(): string[] {
  return readStorage();
}

export function isEventBookmarked(id: string): boolean {
  return readStorage().includes(id);
}

export function toggleBookmark(id: string): boolean {
  const current = readStorage();
  const exists = current.includes(id);
  const updated = exists ? current.filter((x) => x !== id) : [...current, id];
  writeStorage(updated);
  return !exists;
}

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(readStorage);

  useEffect(() => {
    const handler = () => setBookmarkedIds(readStorage());
    window.addEventListener("feastify_bookmarks_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("feastify_bookmarks_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return {
    bookmarkedIds,
    isBookmarked: (id: string) => bookmarkedIds.includes(id),
    toggleBookmark,
  };
}
