import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const PlanContext = createContext();

/* --- Helpers --- */

function safeParseJSON(s, fallback = {}) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function loadLocalPlan() {
  try {
    const raw = safeParseJSON(localStorage.getItem("mealPlan") || "{}", {});
    const normalized = {};

    for (const key of Object.keys(raw)) {
      const parts = String(key).split("-");
      if (parts.length >= 2) {
        const datePart = parts.slice(0, 3).length === 3 && /^\d{4}$/.test(parts[0]) ? parts.slice(0, 3).join('-') : parts[0];
        const mealPart = parts.slice(1).join("-");
        const safeKey = `${datePart}-${mealPart.toLowerCase()}`;
        normalized[safeKey] = Array.isArray(raw[key]) ? raw[key] : [];
      } else {
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

function getCurrentWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  const toYMD = (d) => d.toISOString().slice(0, 10);
  return { start: toYMD(sunday), end: toYMD(saturday) };
}

function parseTime(s) {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/* --- Inventory helpers (local backup + server sync) --- */

function loadLocalInventory() {
  return safeParseJSON(localStorage.getItem("inventory") || "{}", {});
}

function saveLocalInventory(inv) {
  try {
    localStorage.setItem("inventory", JSON.stringify(inv));
  } catch {}
}

// helper to read user's preferences quickly (non-hook) from localStorage
function readPrefsLocal() {
  try {
    const p = safeParseJSON(localStorage.getItem("preferences") || "{}", {});
    return p;
  } catch {
    return {};
  }
}

/* --- Context provider --- */

export function PlanProvider({ children }) {
  const { token } = useAuth();
  const [plan, setPlan] = useState(() => loadLocalPlan());
  const [loading, setLoading] = useState(false);

  // inventory (kept locally; sync attempts made if token present)
  // shape: { "<item_name>": number, ... }
  const [inventory, setInventory] = useState(() => loadLocalInventory());

  useEffect(() => {
    // persist inventory on changes
    saveLocalInventory(inventory);
  }, [inventory]);

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

  const mergeServerIntoLocal = useCallback((serverRows) => {
    setPlan((prevLocal) => {
      const next = { ...prevLocal };
      const normalizedServer = {};
      (Array.isArray(serverRows) ? serverRows : []).forEach((r) => {
        const date = r.date;
        const mealType = (r.mealType || r.meal_type || "unknown").toString().toLowerCase();
        const key = `${date}-${mealType}`;
        normalizedServer[key] = normalizedServer[key] || [];

        const mapped = {
          serverId: r.id ?? r.serverId ?? null,
          recipeId: r.recipeId ?? r.recipe_id ?? r.recipeId ?? null,
          id: r.recipeId ?? r.recipe_id ?? r.id ?? r.recipeId ?? null,
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

      Object.keys(normalizedServer).forEach((key) => {
        const serverItems = normalizedServer[key];
        const localItems = Array.isArray(next[key]) ? [...next[key]] : [];

        serverItems.forEach((sItem) => {
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
              localItems[idx] = { ...local, ...sItem, clientId: local.clientId ?? null };
            } else {
              if (!local.serverId && sItem.serverId) {
                localItems[idx] = { ...localItems[idx], serverId: sItem.serverId };
              }
            }
          } else {
            localItems.push(sItem);
          }
        });

        next[key] = localItems;
      });

      saveLocalPlan(next);
      return next;
    });
  }, []);

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
      mergeServerIntoLocal(serverRows);
    } catch (err) {
      if (err.name !== "AbortError") console.error("syncRange failed", err);
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, [token, mergeServerIntoLocal]);

  useEffect(() => {
    if (!token) return;
    const { start, end } = getCurrentWeekRange();
    syncRange(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* --- Inventory: core function to adjust inventory for a recipe --- */
  async function adjustInventoryForRecipe(recipeLike, servingsDelta) {
    // recipeLike should include id and base_servings ideally
    const recipeId = recipeLike?.id ?? recipeLike?.recipeId ?? null;
    const base_servings = recipeLike?.base_servings ?? recipeLike?.recommended_servings ?? 1;
    if (!recipeId || !servingsDelta) return [];

    // check user preference (read local prefs)
    const prefs = readPrefsLocal();
    if (!prefs.user_inventory) {
      // inventory tracking disabled — no-op
      return [];
    }

    // fetch recipe ingredients (defensive; backend must implement endpoint)
    let ingPayload = null;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recipes/${recipeId}/ingredients`);
      if (!res.ok) {
        // no ingredient data available: cannot adjust
        console.warn("No ingredients endpoint or failed to fetch ingredients for recipe", recipeId);
      } else {
        ingPayload = await res.json();
      }
    } catch (err) {
      console.warn("Failed to fetch recipe ingredients", err);
      ingPayload = null;
    }

    // Normalize payload: backend might return { ok: true, ingredients: [...] } or an array directly
    let ingList = [];
    if (Array.isArray(ingPayload)) {
      ingList = ingPayload;
    } else if (ingPayload && Array.isArray(ingPayload.ingredients)) {
      ingList = ingPayload.ingredients;
    } else {
      ingList = [];
    }

    if (!Array.isArray(ingList) || ingList.length === 0) {
      // no ingredients to adjust
      return [];
    }

    // derive base_servings if available in payload / ingredient row
    const candidateBase = ingList[0]?.base_servings ?? ingPayload?.base_servings ?? base_servings ?? 1;
    const baseServings = Number(candidateBase || 1);

    // Build adjustments: deltaAmount = ingredient.amount * (servingsDelta/base_servings)
    // Note: in our convention, we use negative delta to *consume* inventory (server expects delta numeric)
    const adjustments = [];
    for (const ing of ingList) {
      const itemName = ing.item_name || null;
      if (!itemName) continue;
      // try to find numeric amount field
      const rawAmt = ing.quantity || 0;
      const numeric = Number(rawAmt) || 0;
      const qtyToAdjust = numeric * (servingsDelta / (Number(baseServings) || 1));
      if (qtyToAdjust === 0) continue;
      // when servingsDelta > 0 we want to consume, so delta = -qtyToAdjust
      // when servingsDelta < 0 we want to restore, so delta = - (negative) => positive
      adjustments.push({ item_name: itemName, delta: -qtyToAdjust, unit: ing.unit || null });
    }

    if (adjustments.length === 0) return [];

    // Apply to local inventory (optimistic)
    setInventory((prevInv) => {
      const next = { ...(prevInv || {}) };
      for (const adj of adjustments) {
        const cur = Number(next[adj.item_name] ?? 0);
        const nextVal = cur + adj.delta; // adj.delta negative => consume
        next[adj.item_name] = Number.isFinite(nextVal) ? nextVal : cur;
      }
      saveLocalInventory(next);
      return next;
    });

    // Try to notify backend (defensive)
    if (token) {
      try {
        const resAdj = await fetch(`${process.env.REACT_APP_API_URL}/api/user/inventory/adjust`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ adjustments: adjustments.map(a => ({ item_name: a.item_name, delta: a.delta, unit: a.unit })) })
        });

        if (resAdj.ok) {
          const payload = await resAdj.json();
          // Optionally merge server returned rows into local mapping to keep authoritative values
          if (Array.isArray(payload.updated)) {
            setInventory((prevInv) => {
              const next = { ...(prevInv || {}) };
              for (const row of payload.updated) {
                if (row && row.item_name) {
                  next[row.item_name] = Number(row.quantity ?? next[row.item_name] ?? 0);
                }
              }
              saveLocalInventory(next);
              return next;
            });
          }
        } else {
          const t = await resAdj.text().catch(() => "");
          console.warn("Inventory adjust endpoint returned error:", t);
        }
      } catch (err) {
        console.warn("Failed to sync inventory adjustments to server", err);
      }
    }

    // compute negative items to report
    const afterInv = loadLocalInventory();
    const negatives = [];
    for (const adj of adjustments) {
      const v = Number(afterInv[adj.item_name] ?? 0);
      if (v < 0) negatives.push({ item_name: adj.item_name, value: v });
    }

    if (negatives.length > 0) {
      // warn user with a friendly toast
      toast.warn(`Inventory low: ${negatives.map(n => `${n.item_name} (${Math.round(n.value)})`).join(", ")}`, { autoClose: 6000 });
    }

    return negatives;
  }

  /* --- Core plan functions --- */

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

    // optimistic add local
    addLocal(key, entry);

    // If inventory tracking is enabled, adjust inventory (consume)
    try {
      const prefs = readPrefsLocal();
      if (prefs.user_inventory) {
        // call adjustInventoryForRecipe with positive servings => consumption
        await adjustInventoryForRecipe({ id: entry.recipeId, base_servings: meal.base_servings ?? meal.recommended_servings ?? 1 }, entry.servings);
      }
    } catch (err) {
      console.warn("Inventory adjust on add failed", err);
    }

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

  // updateServings: adjust a plan item servings and inventory accordingly
  async function updateServings(key, indexOrMatcher, newServings) {
    // locate the item robustly
    setPlan((prev) => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      let idx = typeof indexOrMatcher === "number" ? indexOrMatcher : -1;

      if (idx < 0) {
        // indexOrMatcher may be object with clientId/serverId/recipeId
        if (typeof indexOrMatcher === "object" && indexOrMatcher !== null) {
          const getId = x => x.clientId ?? x.serverId ?? x.id ?? x.recipeId;
          const needle = indexOrMatcher.clientId ?? indexOrMatcher.serverId ?? indexOrMatcher.recipeId ?? null;
          if (needle != null) idx = arr.findIndex(x => getId(x) === needle);
        }
      }

      if (idx < 0 || idx >= arr.length) {
        // nothing to update
        return prev;
      }

      const oldItem = arr[idx];
      const oldServ = Number(oldItem.servings ?? 1);
      const nextServ = Math.max(1, Math.round(Number(newServings) || 1));
      const delta = nextServ - oldServ;

      if (delta === 0) return prev;

      arr[idx] = { ...oldItem, servings: nextServ };
      const next = { ...prev, [key]: arr };
      saveLocalPlan(next);

      // apply inventory adjustments asynchronously (do not block local update)
      (async () => {
        try {
          const prefs = readPrefsLocal();
          if (prefs.user_inventory && oldItem.recipeId) {
            await adjustInventoryForRecipe({ id: oldItem.recipeId, base_servings: oldItem.base_servings ?? oldItem.recommended_servings ?? 1 }, delta);
          }
        } catch (err) {
          console.warn("updateServings inventory adjustment failed", err);
        }
      })();

      return next;
    });

    return { ok: true };
  }

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

    // obtain the item to be removed for inventory refund
    let removedItem = null;
    setPlan((prev) => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      if (index < 0 || index >= arr.length) return prev;
      removedItem = arr[index];
      arr.splice(index, 1);
      const next = { ...prev, [key]: arr };
      saveLocalPlan(next);
      return next;
    });

    // refund inventory if needed
    try {
      const prefs = readPrefsLocal();
      if (prefs.user_inventory && removedItem && removedItem.recipeId) {
        // To refund inventory, pass negative servingsDelta so adjustInventoryForRecipe produces positive deltas
        await adjustInventoryForRecipe({ id: removedItem.recipeId, base_servings: removedItem.base_servings ?? removedItem.recommended_servings ?? 1 }, -Number(removedItem.servings ?? 0));
      }
    } catch (err) {
      console.warn("Failed to refund inventory when removing item", err);
    }

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

  // inventory accessors
  const getInventory = useCallback(() => (typeof inventory === "object" ? inventory : {}), [inventory]);
  const setInventoryLocal = useCallback((obj) => {
    setInventory(obj || {});
    saveLocalInventory(obj || {});
  }, []);

  return (
    <PlanContext.Provider value={{
      plan,
      addMeal,
      removeMeal,
      updateServings,
      adjustInventoryForRecipe,
      getInventory,
      setInventoryLocal,
      loading,
      syncRange
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}