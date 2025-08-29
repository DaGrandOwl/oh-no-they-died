import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const PreferencesContext = createContext();

export function PrefProvider({ children }) {
  const { token } = useAuth();

  const initialFromStorage = (() => {
    try {
      const raw = localStorage.getItem("preferences");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  // default theme: prefer system preference if no saved prefs
  const systemPrefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const defaultPrefs = {
    theme: systemPrefersDark ? "dark" : "light",
    allergens: [],
    user_inventory: false,
    diet_type: null,
    lastUpdated: new Date().toISOString(),
  };

  const [prefs, setPrefs] = useState(() => {
    return initialFromStorage ? { ...defaultPrefs, ...initialFromStorage } : defaultPrefs;
  });

  // apply theme to document root whenever prefs.theme changes
  useEffect(() => {
    if (!prefs) return;
    const theme = prefs.theme === "dark" ? "dark" : "light";
    try {
      // set data attribute and class for CSS hooks
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch (e) {
      // ignore in SSR or restricted environments
    }
  }, [prefs, prefs?.theme]);

  // Sync with DB if logged in and DB prefs are newer
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const dbPrefs = await res.json();
        if (!dbPrefs) return;

        const localRaw = localStorage.getItem("preferences");
        const localPrefs = localRaw ? JSON.parse(localRaw) : null;

        const dbUpdated = dbPrefs.lastUpdated ? new Date(dbPrefs.lastUpdated) : null;
        const localUpdated = localPrefs && localPrefs.lastUpdated ? new Date(localPrefs.lastUpdated) : null;

        // Only overwrite local if DB is newer
        if (!cancelled && dbUpdated && (!localUpdated || dbUpdated > localUpdated)) {
          const merged = { ...defaultPrefs, ...dbPrefs };
          localStorage.setItem("preferences", JSON.stringify(merged));
          setPrefs(merged);
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Update preferences locally and optionally in DB
  const updatePrefs = async (newPrefs) => {
    const merged = { ...prefs, ...newPrefs, lastUpdated: new Date().toISOString() };
    setPrefs(merged);
    try {
      localStorage.setItem("preferences", JSON.stringify(merged));
    } catch {}

    // Update DB only if user is logged in
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL}/api/user/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(merged), 
      }).catch(() => {
        // DB update failed; local prefs still intact
      });
    }
  };

  return (
    <PreferencesContext.Provider value={{ prefs, updatePrefs }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
