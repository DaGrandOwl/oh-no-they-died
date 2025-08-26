import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const PreferencesContext = createContext();

export function PrefProvider({ children }) {
  const { token } = useAuth(); // optional; may be null
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("preferences");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Sync with DB if logged in and DB prefs are newer
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const dbPrefs = await res.json();
        if (!dbPrefs) return;

        const localRaw = localStorage.getItem("preferences");
        const localPrefs = localRaw ? JSON.parse(localRaw) : {};

        const dbUpdated = dbPrefs.lastUpdated ? new Date(dbPrefs.lastUpdated) : null;
        const localUpdated = localPrefs.lastUpdated ? new Date(localPrefs.lastUpdated) : null;

        // Only overwrite local if DB is newer
        if (dbUpdated && (!localUpdated || dbUpdated > localUpdated)) {
          localStorage.setItem("preferences", JSON.stringify(dbPrefs));
          setPrefs(dbPrefs);
        }
      } catch (err) {
        console.error("Failed to fetch preferences:", err);
      }
    })();
  }, [token]);

  // Update preferences locally and optionally in DB
  const updatePrefs = async (newPrefs) => {
    const merged = { ...prefs, ...newPrefs, lastUpdated: new Date().toISOString() };
    setPrefs(merged);
    localStorage.setItem("preferences", JSON.stringify(merged));

    // Update DB only if user is logged in
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL}/api/user/preferences`, {
        method: "PUT",
        headers: { //currently has no effect
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
