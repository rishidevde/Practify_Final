import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addWishlistItem, getAttempts, getWishlist, removeWishlistItem } from "../lib/api";
import { languages, translate } from "../lib/i18n";
import { computeStreak } from "../lib/streak";

const AppContext = createContext(null);

const THEME_KEY = "practify-theme";
const LANGUAGE_KEY = "practify-language";

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || "en");
  const [wishlist, setWishlist] = useState([]);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.setAttribute("data-theme", resolved);
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("data-lang", language);
  }, [language]);

  useEffect(() => {
    getWishlist().then(setWishlist).catch(() => {});
    getAttempts().then(setAttempts).catch(() => {});
  }, []);

  const streak = useMemo(() => computeStreak(attempts), [attempts]);

  async function toggleWishlist(quizId) {
    const hasItem = wishlist.some((item) => item.quiz_id === quizId);
    if (hasItem) {
      await removeWishlistItem(quizId);
      setWishlist((prev) => prev.filter((item) => item.quiz_id !== quizId));
      return false;
    }
    const added = await addWishlistItem(quizId);
    setWishlist((prev) => [added, ...prev.filter((item) => item.quiz_id !== quizId)]);
    return true;
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      language,
      setLanguage,
      languages,
      t: (key, params) => translate(language, key, params),
      wishlist,
      toggleWishlist,
      streak,
      refreshAttempts: () => getAttempts().then(setAttempts).catch(() => {}),
    }),
    [theme, language, wishlist, streak],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
