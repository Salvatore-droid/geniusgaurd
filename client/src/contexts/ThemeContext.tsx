import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

// Helper function to safely access localStorage
const getStoredTheme = (defaultTheme: Theme): Theme => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
  } catch (e) {
    // localStorage is not available (private browsing, insecure context, etc.)
    console.warn("localStorage is not available:", e);
  }
  return defaultTheme;
};

// Helper function to safely set localStorage
const setStoredTheme = (theme: Theme): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem("theme", theme);
    }
  } catch (e) {
    // localStorage is not available
    console.warn("localStorage is not available:", e);
  }
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      return getStoredTheme(defaultTheme);
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      setStoredTheme(theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
