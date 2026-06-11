import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("vs_theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try { localStorage.setItem("vs_theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((p) => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
