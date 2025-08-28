// PlanContext.js
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

const PlanContext = createContext();

/* --- Helpers --- */

function safeParseJSON(s, fallback = {}) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

/**
 * Load local plan from localStorage and normalize shape:
 * - ensure every key maps to an array
 * - migrate keys like "YYYY-MM-DD-Breakfast" -> "YYYY-MM-DD-breakfast"
 */
function loadLocalPlan() {
  try {
    const raw = safeParseJSON(localStorage.getItem("mealPlan") || "{}", {});
    const normalized = {};

    for (const key of Object.keys(raw)) {
      // migrate mealType part to lowercase if possible
      // expect keys in form "<date>-<mealType>" but be tolerant
      const parts = String(key).split("-");
      if (parts.length >= 2) {
        const datePart = parts.slice(0, 3).length === 3 && /^\d{4}$/.test(parts[0]) ? parts.slice(0, 3).join('-') : parts[0];
        // fallback: treat last part as mealType
        const mealPart = parts.slice(1).join("-"); // everything after first dash
        const safeKey = `${datePart}-${mealPart.toLowerCase()}`;
        normalized[safeKey] = Array.isArray(raw[key]) ? raw[key] : [];
      } else {
        // unrecognised key: keep as-is but ensure array
        normalized[key] = Array.isArray(raw[key]) ? raw[key] : [];
      }
    }

    return normalized;
  } catch {
    return {};
  }
}

function saveLocalPlan(plan) {
  try {
    localStorage.setItem("mealPlan", JSON.stringify(plan));
  } catch (err) {
    // ignore
  }
}

function isValidDateYYYYMMDD(s) {
  if (!s || typeof s !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

/**
 * return { start, end } for current week (Sunday-Saturday) in YYYY-MM-DD
 */
function getCurrentWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const toYMD = (d) => d.toISOString().slice(0, 10);
  return { start: toYMD(sunday), end: toYMD(saturday) };
}

/**
 * parse ISO-ish timestamps safely to millis
 */
function parseTime(s) {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/* --- Context provider --- */

export function PlanProvider({ children }) {
  const { token } = useAuth();
  const [plan, setPlan] = useState(() => loadLocalPlan());
  const [loading, setLoading] = useState(false);

  // helper: add locally and persist
  const addLocal = useCallback((key, entry) => {
    setPlan((prev) => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const nextArr = [...arr, entry];
      const next = { ...prev, [key]: nextArr };
      saveLocalPlan(next);
      return next;
    });
  }, []);

  /**
   * Merge server items into local plan with simple timestamp logic:
   * - For each server item mapped to a key:
   *    * try to find local item matched by clientId or serverId
   *    * if found compare server.created_at > local.addedAt => replace local item
   *    * otherwise keep local (optimistic)
   *    * if not found push server item
   */
  const mergeServerIntoLocal = useCallback((serverRows) => {
    setPlan((prevLocal) => {
      const next = { ...prevLocal };

      // normalizedServer keyed by "YYYY-MM-DD-mealtype"
      const normalizedServer = {};
      (Array.isArray(serverRows) ? serverRows : []).forEach((r) => {
        const date = r.date;
        const mealType = (r.mealType || r.meal_type || "unknown").toString().toLowerCase();
        const key = `${date}-${mealType}`;
        normalizedServer[key] = normalizedServer[key] || [];

        // map server row into client-friendly shape
        const mapped = {
          // server row id (mealplan record)
          serverId: r.id ?? r.serverId ?? null,
          // recipe id (used by MealCard as `id`)
          recipeId: r.recipeId ?? r.recipe_id ?? r.recipeId ?? null,
          id: r.recipeId ?? r.recipe_id ?? r.id ?? r.recipeId ?? null, // keep `id` as recipe id for UI compatibility
          name: r.name ?? r.title ?? null,
          image: r.image ?? null,
          calories: r.calories ?? null,
          protein: r.protein ?? null,
          carbs: r.carbs ?? null,
          fat: r.fat ?? null,
          allergens: Array.isArray(r.allergens) ? r.allergens : (typeof r.allergens === "string" ? r.allergens.split(",").map(s => s.trim()).filter(Boolean) : []),
          date: r.date,
          mealType: mealType,
          servings: r.servings ?? 1,
          created_at: r.created_at ?? r.createdAt ?? null
        };

        normalizedServer[key].push(mapped);
      });

      // merge each server key into next
      Object.keys(normalizedServer).forEach((key) => {
        const serverItems = normalizedServer[key];
        const localItems = Array.isArray(next[key]) ? [...next[key]] : [];

        serverItems.forEach((sItem) => {
          // try match by serverId -> clientId -> recipeId + created_at
          const idxByServerId = localItems.findIndex(li => li.serverId && sItem.serverId && li.serverId === sItem.serverId);
          const idxByClientId = localItems.findIndex(li => li.clientId && sItem.clientId && li.clientId === sItem.clientId);
          const idxByRecipe = localItems.findIndex(li => (li.recipeId || li.id) && (sItem.recipeId || sItem.id) && String(li.recipeId || li.id) === String(sItem.recipeId || sItem.id));

          let idx = -1;
          if (idxByServerId !== -1) idx = idxByServerId;
          else if (idxByClientId !== -1) idx = idxByClientId;
          else if (idxByRecipe !== -1) idx = idxByRecipe;

          if (idx !== -1) {
            const local = localItems[idx];
            const localTime = parseTime(local.addedAt || local.created_at || local.added_at || 0);
            const serverTime = parseTime(sItem.created_at || sItem.createdAt || 0);

            if (serverTime > localTime) {
              // server wins: replace/merge preserving clientId if present
              localItems[idx] = { ...local, ...sItem, clientId: local.clientId ?? null };
            } else {
              // keep local optimistic item
              // but if local doesn't have serverId and server does provide one, attach it (server accepted earlier entry)
              if (!local.serverId && sItem.serverId) {
                localItems[idx] = { ...localItems[idx], serverId: sItem.serverId };
              }
            }
          } else {
            // no local match: push server item
            localItems.push(sItem);
          }
        });

        next[key] = localItems;
      });

      saveLocalPlan(next);
      return next;
    });
  }, []);

  /**
   * syncRange(start,end) - fetch server-side items for the range and merge them into local
   * start,end format: YYYY-MM-DD (inclusive)
   */
  const syncRange = useCallback(async (start, end) => {
    if (!token) return;
    if (start && !isValidDateYYYYMMDD(start)) return;
    if (end && !isValidDateYYYYMMDD(end)) return;

    setLoading(true);
    const ac = new AbortController();
    try {
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      const url = `${process.env.REACT_APP_API_URL}/api/user/mealplan${qs.toString() ? `?${qs.toString()}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ac.signal
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const serverRows = await res.json();
      // merge server rows into local
      mergeServerIntoLocal(serverRows);
    } catch (err) {
      if (err.name !== "AbortError") console.error("syncRange failed", err);
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, [token, mergeServerIntoLocal]);

  // On token available, auto-sync current week so WeekPlanner has data without manual call
  useEffect(() => {
    if (!token) return;
    const { start, end } = getCurrentWeekRange();
    syncRange(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // addMeal: optimistic local add, then persist to server; on success merge server response into local entry
  async function addMeal(meal, date, mealType, servings) {
    const safeMealType = (mealType || "unknown").toString().toLowerCase();
    const key = `${date}-${safeMealType}`;
    const entry = {
      clientId: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipeId: meal.id ?? meal.recipeId ?? null,
      id: meal.id ?? meal.recipeId ?? null,
      serverId: null,
      name: meal.name ?? null,
      calories: meal.calories ?? null,
      protein: meal.protein ?? null,
      carbs: meal.carbs ?? null,
      fat: meal.fat ?? null,
      image: meal.image || null,
      allergens: Array.isArray(meal.allergens) ? meal.allergens : (typeof meal.allergens === "string" ? meal.allergens.split(",").map(s => s.trim()).filter(Boolean) : []),
      servings: servings ?? meal.servings ?? 1,
      addedAt: new Date().toISOString(),
    };

    // optimistic add
    addLocal(key, entry);

    if (!token) return { ok: true, saved: entry };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipeId: entry.recipeId,
          date,
          mealType: safeMealType,
          servings: entry.servings,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Server refused to save plan item:", text);
        return { ok: false, error: text };
      }

      const saved = await res.json();
      // saved is expected to include at least id (mealplan row) and recipeId and created_at/date/mealType
      // Merge server returned row into local entry (match by clientId)
      setPlan((prev) => {
        const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
        const idx = arr.findIndex((it) => it.clientId === entry.clientId);
        if (idx !== -1) {
          arr[idx] = {
            ...arr[idx],
            ...saved,
            serverId: saved.id ?? saved.serverId ?? arr[idx].serverId,
            recipeId: saved.recipeId ?? saved.recipe_id ?? arr[idx].recipeId,
            id: saved.recipeId ?? saved.recipe_id ?? arr[idx].id,
            created_at: saved.created_at ?? saved.createdAt ?? arr[idx].created_at
          };
        } else {
          // push mapped saved
          const mapped = {
            serverId: saved.id ?? saved.serverId ?? null,
            recipeId: saved.recipeId ?? saved.recipe_id ?? saved.recipeId ?? null,
            id: saved.recipeId ?? saved.recipe_id ?? saved.id ?? null,
            name: saved.name ?? entry.name,
            image: saved.image ?? entry.image,
            calories: saved.calories ?? entry.calories,
            protein: saved.protein ?? entry.protein,
            carbs: saved.carbs ?? entry.carbs,
            fat: saved.fat ?? entry.fat,
            allergens: Array.isArray(saved.allergens) ? saved.allergens : (typeof saved.allergens === "string" ? saved.allergens.split(",").map(s => s.trim()).filter(Boolean) : entry.allergens),
            date: saved.date ?? saved.scheduled_date ?? null,
            mealType: (saved.mealType || saved.meal_type || safeMealType).toString().toLowerCase(),
            servings: saved.servings ?? entry.servings,
            created_at: saved.created_at ?? saved.createdAt ?? new Date().toISOString()
          };
          arr.push(mapped);
        }
        const next = { ...prev, [key]: arr };
        saveLocalPlan(next);
        return next;
      });

      return { ok: true, saved };
    } catch (err) {
      console.error("Failed to persist plan item", err);
      return { ok: false, error: err.message };
    }
  }

  // removeMeal supports multiple signatures (see user's code expectations)
  async function removeMeal(...args) {
    // normalize args
    let key, index, serverId = null;

    if (args.length === 1 && typeof args[0] === "object") {
      ({ key, index, serverId = null } = args[0]);
    } else if (args.length >= 2 && typeof args[0] === "string" && typeof args[1] === "number") {
      key = args[0];
      index = args[1];
      serverId = args[2] ?? null;
    } else if (args.length >= 3) {
      const day = args[0];
      const mealTime = args[1];
      index = args[2];
      serverId = args[3] ?? null;
      const safeMealType = (mealTime || "unknown").toString().toLowerCase();
      key = `${day}-${safeMealType}`;
    } else {
      console.warn("removeMeal: invalid args", args);
      return { ok: false, error: "invalid args" };
    }

    // remove locally
    setPlan((prev) => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      if (index < 0 || index >= arr.length) return prev;
      arr.splice(index, 1);
      const next = { ...prev, [key]: arr };
      saveLocalPlan(next);
      return next;
    });

    // remove on server if logged in and serverId known
    if (token && serverId) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan/${serverId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          console.warn("Server failed to delete plan item", t);
          return { ok: false, error: t };
        }
        return { ok: true };
      } catch (err) {
        console.error("Delete request failed", err);
        return { ok: false, error: err.message };
      }
    }

    return { ok: true };
  }

  return (
    <PlanContext.Provider value={{
      plan,
      addMeal,
      removeMeal,
      loading,
      // expose syncRange so WeekPlanner (or other UI) can explicitly refresh the visible week
      syncRange
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}