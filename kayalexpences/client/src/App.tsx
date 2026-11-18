/* Copper Ledger design: one focused private finance workspace with a warm editorial shell. */
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";

const AUTH_KEY = "kayal_auth_session";
const THEME_KEY = "kayal_theme_mode";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_KEY) === "true";
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("theme-light");
      document.body.classList.add("theme-light");
    } else {
      document.documentElement.classList.remove("theme-light");
      document.body.classList.remove("theme-light");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogin = (userEmail?: string) => {
    sessionStorage.setItem(AUTH_KEY, "true");
    if (userEmail && typeof userEmail === "string") {
      sessionStorage.setItem("kayal_user_email", userEmail);
      localStorage.setItem("kayal_user_email", userEmail);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <Home onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
      <Toaster position="bottom-right" richColors theme={theme === "light" ? "light" : "dark"} />
    </>
  );
}
