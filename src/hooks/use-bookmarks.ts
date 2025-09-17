
"use client";

import { useState, useEffect, useCallback } from "react";
import useLocalStorage from "./use-local-storage";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>("bookmarks", []);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      if (prev.includes(id)) {
        return prev.filter(bId => bId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, [setBookmarks]);

  const isBookmarked = useCallback((id: string) => {
    return bookmarks.includes(id);
  }, [bookmarks]);

  return { isMounted, bookmarks, toggleBookmark, isBookmarked };
}
