// src/contexts/PlanContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const PlanContext = createContext();

function loadLocalPlan() {
  try {
    return JSON.parse(localStorage.getItem("mealPlan") || "{}");
  } catch {
    return {};
  }
}
function saveLocalPlan(plan) {
  try {
    localStorage.setItem("mealPlan", JSON.stringify(plan));
  } catch {}
}

/**
 * PlanProvider
 * - syncs server -> local on login
 * - optimistic local add; replace clientId with server id when server responds
 * - remove supports local & server delete
 *
 * addMeal signature used by UI: addMeal(meal, date, mealType, servings)
 * removeMeal signature used by UI: removeMeal(day, mealTime, index, serverId?)
 */
export function PlanProvider({ children }) {
  const { token } = useAuth();
  const [plan, setPlan] = useState(() => loadLocalPlan());
  const [loading, setLoading] = useState(false);

  // Sync server -> local when token becomes available
  useEffect(() => {
    if (!token) return;
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const serverPlanRaw = await res.json();

        // normalize to { "YYYY-MM-DD-mealTime": [items...] }
        const normalized = {};
        if (Array.isArray(serverPlanRaw)) {
          serverPlanRaw.forEach((item) => {
            // expect item.date and item.mealType (server naming may differ)
            const date = item.date;
            const mealType = (item.mealType || item.meal_type || "unknown").toLowerCase();
            const key = `${date}-${mealType}`;
            normalized[key] = normalized[key] || [];
            normalized[key].push(item);
          });
        } else if (serverPlanRaw && typeof serverPlanRaw === "object") {
          // already keyed shape
          Object.assign(normalized, serverPlanRaw);
        }

        // Merge into local: prefer server entries for keys it has, otherwise keep local
        setPlan((prevLocal) => {
          const next = { ...prevLocal };
          Object.keys(normalized).forEach((k) => {
            next[k] = normalized[k];
          });
          saveLocalPlan(next);
          return next;
        });
      } catch (err) {
        if (err.name !== "AbortError") console.error("Plan sync failed", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // helper: add locally and persist
  function addLocal(key, entry) {
    setPlan((prev) => {
      const arr = prev[key] ? [...prev[key]] : [];
      const nextArr = [...arr, entry];
      const next = { ...prev, [key]: nextArr };
      saveLocalPlan(next);
      return next;
    });
  }

  /**
   * addMeal used by UI:
   * addMeal(meal, date, mealType, servings)
   * - meal: object from recommendations (must contain id,name,...)
   */
  async function addMeal(meal, date, mealType, servings) {
    const key = `${date}-${mealType.toLowerCase()}`;
    const entry = {
      clientId: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipeId: meal.id,
      name: meal.name,
      calories: meal.calories ?? null,
      servings: servings ?? meal.servings ?? 1,
      image: meal.image || null,
      addedAt: new Date().toISOString(),
    };

    // optimistic local add
    addLocal(key, entry);

    // if not logged in, we're done
    if (!token) return { ok: true, saved: entry };

    // persist to server
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipeId: entry.recipeId,
          date,
          mealType,
          servings: entry.servings,
        }),
      });
      if (!res.ok) {
        // server refused; keep local but inform caller
        const text = await res.text().catch(() => "");
        console.warn("Server refused to save plan item:", text);
        return { ok: false, error: text };
      }
      const saved = await res.json(); // expect server returns saved item with server id

      // replace client entry with server data (match by clientId)
      setPlan((prev) => {
        const arr = prev[key] ? [...prev[key]] : [];
        const idx = arr.findIndex((it) => it.clientId === entry.clientId);
        if (idx !== -1) {
          // merge server response into item
          arr[idx] = { ...arr[idx], ...saved };
        } else {
          // fallback: push
          arr.push(saved);
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

  /**
   * removeMeal(day, mealTime, index)
   * optionally serverId can be provided in UI->remove call after finding it in the item.
   */
  async function removeMeal(day, mealTime, index, serverId = null) {
    const key = `${day}-${mealTime.toLowerCase()}`;

    // remove locally
    setPlan((prev) => {
      const arr = prev[key] ? [...prev[key]] : [];
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
          console.warn("Server failed to delete plan item", await res.text().catch(() => ""));
        }
      } catch (err) {
        console.error("Delete request failed", err);
      }
    }
  }

  return (
    <PlanContext.Provider value={{ plan, addMeal, removeMeal, loading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}