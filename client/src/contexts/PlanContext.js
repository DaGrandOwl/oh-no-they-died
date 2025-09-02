// PlanContext.js (updated)
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const PlanContext = createContext();

function safeParseJSON(s, fallback = {}) {
  try { return JSON.parse(s); } catch { return fallback; }
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
  } catch { return {}; }
}

function saveLocalPlan(plan) {
  try { localStorage.setItem("mealPlan", JSON.stringify(plan)); } catch (err) {}
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
  const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  return { start: toYMD(sunday), end: toYMD(saturday) };
}

function parseTime(s) {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/* inventory helpers (local backup + server sync) */
function loadLocalInventory() { return safeParseJSON(localStorage.getItem("inventory") || "{}", {}); }
function saveLocalInventory(inv) { try { localStorage.setItem("inventory", JSON.stringify(inv)); } catch {} }
function readPrefsLocal() { try { return safeParseJSON(localStorage.getItem("preferences") || "{}", {}); } catch { return {}; } }

export function PlanProvider({ children }) {
  const { token } = useAuth();
  const [plan, setPlan] = useState(() => loadLocalPlan());
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState(() => loadLocalInventory());

  useEffect(() => { saveLocalInventory(inventory); }, [inventory]);

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

  // merge server rows into local plan (used by syncRange)
  const mergeServerIntoLocal = useCallback((serverRows) => {
    setPlan((prevLocal) => {
      const next = { ...prevLocal };
      const normalizedServer = {};

      (Array.isArray(serverRows) ? serverRows : []).forEach((r) => {
        // r is expected to be a mealplan row returned by GET /api/user/mealplan
        // r.id = user_mealplan.id
        const date = r.date;
        const mealType = (r.mealType || r.meal_type || "unknown").toString().toLowerCase();
        const key = `${date}-${mealType}`;
        normalizedServer[key] = normalizedServer[key] || [];

        const mapped = {
          // canonical server-side mealplan identifier:
          serverId: r.id ?? null,
          mealplanId: r.id ?? r.mealplanId ?? null,
          // recipe id (the recipe this mealplan row points to)
          recipeId: r.recipeId ?? r.recipe_id ?? null,
          // user-facing recipe metadata (safely copy)
          name: r.name ?? r.title ?? null,
          image: r.image ?? null,
          calories: r.calories ?? null,
          protein: r.protein ?? null,
          carbs: r.carbs ?? null,
          fat: r.fat ?? null,
          allergens: Array.isArray(r.allergens) ? r.allergens : (typeof r.allergens === "string" ? r.allergens.split(",").map(s => s.trim()).filter(Boolean) : []),
          date: r.date,
          mealType: mealType,
          servings: Number(r.servings ?? 1),
          base_servings: r.base_servings ?? r.baseServings ?? null,
          created_at: r.created_at ?? r.createdAt ?? null
        };

        normalizedServer[key].push(mapped);
      });

      // For each server key, merge server items into local arrays (server has priority for authoritative state)
      Object.keys(normalizedServer).forEach((key) => {
        const serverItems = normalizedServer[key];
        const localItems = Array.isArray(next[key]) ? [...next[key]] : [];

        serverItems.forEach((sItem) => {
          // match by serverId first, then by recipeId (best-effort)
          const idxByServerId = localItems.findIndex(li => li.serverId && sItem.serverId && String(li.serverId) === String(sItem.serverId));
          const idxByClientId = localItems.findIndex(li => li.clientId && sItem.clientId && String(li.clientId) === String(sItem.clientId));
          const idxByRecipe = localItems.findIndex(li => (li.recipeId || li.id) && (sItem.recipeId || sItem.id) && String(li.recipeId || li.id) === String(sItem.recipeId || sItem.id));

          let idx = -1;
          if (idxByServerId !== -1) idx = idxByServerId;
          else if (idxByClientId !== -1) idx = idxByClientId;
          else if (idxByRecipe !== -1) idx = idxByRecipe;

          if (idx !== -1) {
            // If local item exists, prefer server's newer data for authoritative fields
            const local = localItems[idx];
            const localTime = parseTime(local.addedAt || local.created_at || local.added_at || 0);
            const serverTime = parseTime(sItem.created_at || sItem.createdAt || 0);

            if (serverTime >= localTime) {
              // merge server fields into local item but keep local clientId if present
              localItems[idx] = {
                ...local,
                ...sItem,
                serverId: sItem.serverId ?? local.serverId ?? null,
                recipeId: sItem.recipeId ?? local.recipeId ?? null
              };
            } else {
              // keep local item but ensure serverId is set if available
              localItems[idx] = {
                ...local,
                serverId: local.serverId ?? sItem.serverId ?? null,
                recipeId: local.recipeId ?? sItem.recipeId ?? null
              };
            }
          } else {
            // New server item -> append
            localItems.push({
              ...sItem,
              clientId: null // server-origin items have no clientId
            });
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

  /* --- Inventory helpers kept as in your code --- */
  async function adjustInventoryForRecipe(recipeLike, servingsDelta) {
    const recipeId = recipeLike?.id ?? recipeLike?.recipeId ?? null;
    const base_servings = recipeLike?.base_servings ?? recipeLike?.recommended_servings ?? 1;
    if (!recipeId || !servingsDelta) return [];

    const prefs = readPrefsLocal();
    if (!prefs.user_inventory) {
      return [];
    }

    let ingPayload = null;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recipes/${recipeId}/ingredients`);
      if (!res.ok) {
        console.warn("No ingredients endpoint or failed to fetch ingredients for recipe", recipeId);
      } else {
        ingPayload = await res.json();
      }
    } catch (err) {
      console.warn("Failed to fetch recipe ingredients", err);
      ingPayload = null;
    }

    let ingList = [];
    if (Array.isArray(ingPayload)) {
      ingList = ingPayload;
    } else if (ingPayload && Array.isArray(ingPayload.ingredients)) {
      ingList = ingPayload.ingredients;
    } else {
      ingList = [];
    }

    if (!Array.isArray(ingList) || ingList.length === 0) {
      return [];
    }

    const candidateBase = ingList[0]?.base_servings ?? ingPayload?.base_servings ?? base_servings ?? 1;
    const baseServings = Number(candidateBase || 1);

    const adjustments = [];
    for (const ing of ingList) {
      const itemName = ing.item_name || null;
      if (!itemName) continue;
      const rawAmt = ing.quantity || 0;
      const numeric = Number(rawAmt) || 0;
      const qtyToAdjust = numeric * (servingsDelta / (Number(baseServings) || 1));
      if (qtyToAdjust === 0) continue;
      adjustments.push({ item_name: itemName, delta: -qtyToAdjust, unit: ing.unit || null });
    }

    if (adjustments.length === 0) return [];

    // optimistic local update
    setInventory((prevInv) => {
      const next = { ...(prevInv || {}) };
      for (const adj of adjustments) {
        const cur = Number(next[adj.item_name] ?? 0);
        const nextVal = cur + adj.delta;
        next[adj.item_name] = Number.isFinite(nextVal) ? nextVal : cur;
      }
      saveLocalInventory(next);
      return next;
    });

    // notify backend (only if token present)
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

    const afterInv = loadLocalInventory();
    const negatives = [];
    for (const adj of adjustments) {
      const v = Number(afterInv[adj.item_name] ?? 0);
      if (v < 0) negatives.push({ item_name: adj.item_name, value: v });
    }

    if (negatives.length > 0) {
      toast.warn(`Inventory low: ${negatives.map(n => `${n.item_name} (${Math.round(n.value)})`).join(", ")}`, { autoClose: 6000 });
    }

    return negatives;
  }

  const syncInventoryFromServer = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const payload = await res.json();
      const rows = Array.isArray(payload?.inventory) ? payload.inventory : [];
      const mapping = {};
      for (const r of rows) {
        if (r && r.item_name) mapping[r.item_name] = Number(r.quantity ?? 0);
      }
      setInventory(mapping);
      saveLocalInventory(mapping);
    } catch (err) {
      console.warn("Failed to sync inventory from server", err);
    }
  }, [token]);

  /* --- Core plan functions --- */

  function getLocalTodayYMD() {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async function addMeal(meal, date, mealType, servings) {
    const safeMealType = (mealType || "unknown").toString().toLowerCase();
    const key = `${date}-${safeMealType}`;
    const entry = {
      clientId: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipeId: meal.id ?? meal.recipeId ?? null,
      serverId: null, // will be populated after server save
      name: meal.name ?? null,
      calories: meal.calories ?? null,
      protein: meal.protein ?? null,
      carbs: meal.carbs ?? null,
      fat: meal.fat ?? null,
      image: meal.image || null,
      allergens: Array.isArray(meal.allergens) ? meal.allergens : (typeof meal.allergens === "string" ? meal.allergens.split(",").map(s => s.trim()).filter(Boolean) : []),
      servings: servings ?? meal.servings ?? 1,
      base_servings: meal.base_servings ?? meal.recommended_servings ?? 1, // store base_servings on client side for accurate scaling
      addedAt: new Date().toISOString(),
      date,
      mealType: safeMealType
    };

    // optimistic local add
    addLocal(key, entry);

    const prefs = readPrefsLocal();
    const trackInventory = !!prefs.user_inventory;
    const localToday = getLocalTodayYMD();
    const applyNow = date === localToday;

    if (!token && trackInventory && applyNow) {
      try {
        await adjustInventoryForRecipe({ id: entry.recipeId, base_servings: entry.base_servings }, entry.servings);
      } catch (err) {
        console.warn("Offline inventory adjust failed", err);
      }
    }

    if (!token) return { ok: true, saved: entry };

    // Persist the mealplan to server
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipeId: entry.recipeId,
          date: date,
          mealType: safeMealType,
          servings: entry.servings,
          applyNow: !!applyNow,
          base_servings: entry.base_servings
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Server refused to save plan item:", text);
        return { ok: false, error: text };
      }

      const saved = await res.json();

      // saved is expected to be the joined row returned by backend GET after insert
      // map server response to canonical local shape and merge into plan
      setPlan((prev) => {
        const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
        const idx = arr.findIndex((it) => it.clientId === entry.clientId);

        const mapped = {
          clientId: arr[idx]?.clientId ?? null,
          serverId: saved.id ?? saved.serverId ?? null,
          mealplanId: saved.id ?? saved.mealplanId ?? null,
          recipeId: saved.recipeId ?? saved.recipe_id ?? entry.recipeId,
          name: saved.name ?? entry.name,
          image: saved.image ?? entry.image,
          calories: saved.calories ?? entry.calories,
          protein: saved.protein ?? entry.protein,
          carbs: saved.carbs ?? entry.carbs,
          fat: saved.fat ?? entry.fat,
          allergens: Array.isArray(saved.allergens) ? saved.allergens : (typeof saved.allergens === "string" ? saved.allergens.split(",").map(s => s.trim()).filter(Boolean) : entry.allergens),
          date: saved.date ?? saved.scheduled_date ?? date,
          mealType: (saved.mealType || saved.meal_type || safeMealType).toString().toLowerCase(),
          servings: saved.servings ?? entry.servings,
          base_servings: saved.base_servings ?? entry.base_servings,
          created_at: saved.created_at ?? saved.createdAt ?? new Date().toISOString()
        };

        if (idx !== -1) {
          arr[idx] = { ...arr[idx], ...mapped };
        } else {
          arr.push(mapped);
        }
        const next = { ...prev, [key]: arr };
        saveLocalPlan(next);
        return next;
      });

      // If inventory being tracked, sync authoritative inventory (server might have applied or scheduled adjustments)
      if (trackInventory) {
        await syncInventoryFromServer();
      }

      return { ok: true, saved };
    } catch (err) {
      console.error("Failed to persist plan item", err);
      return { ok: false, error: err.message };
    }
  }

  // UPDATE SERVINGS - persist to server when possible
  async function updateServings(key, indexOrMatcher, newServings) {
    // optimistic local update
    let targetItem = null;
    setPlan((prev) => {
      const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
      let idx = typeof indexOrMatcher === "number" ? indexOrMatcher : -1;

      if (idx < 0) {
        if (typeof indexOrMatcher === "object" && indexOrMatcher !== null) {
          const getId = x => x.clientId ?? x.serverId ?? x.mealplanId ?? x.id ?? x.recipeId;
          const needle = indexOrMatcher.clientId ?? indexOrMatcher.serverId ?? indexOrMatcher.mealplanId ?? indexOrMatcher.recipeId ?? null;
          if (needle != null) idx = arr.findIndex(x => getId(x) === String(needle) || getId(x) === needle);
        }
      }

      if (idx < 0 || idx >= arr.length) {
        return prev;
      }

      const oldItem = arr[idx];
      const oldServ = Number(oldItem.servings ?? 1);
      const nextServ = Math.max(1, Math.round(Number(newServings) || 1));
      const delta = nextServ - oldServ;

      if (delta === 0) {
        // nothing changed
        return prev;
      }

      const updated = { ...oldItem, servings: nextServ };
      arr[idx] = updated;
      targetItem = updated;
      const next = { ...prev, [key]: arr };
      saveLocalPlan(next);
      return next;
    });

    if (!targetItem) return { ok: false, error: "item not found" };

    (async () => {
      try {
        const prefs = readPrefsLocal();
        const trackInventory = !!prefs.user_inventory;

        // derive scheduled local date from key
        const localDate = typeof key === "string" ? key.slice(0,10) : (targetItem.date || null);
        const localToday = getLocalTodayYMD();
        const isToday = localDate && localDate === localToday;

        // server-side identifier (mealplan row id) should be in serverId / mealplanId
        const mealplanId = targetItem.serverId ?? targetItem.mealplanId ?? null;

        if (mealplanId && token) {
          try {
            const applyNow = !!isToday;
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan/${mealplanId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ servings: targetItem.servings, applyNow })
            });

            if (res.ok) {
              const payload = await res.json(); // server returns { ok: true, updated: {...} }
              const updatedServerRow = payload?.updated ?? null;

              if (updatedServerRow && (updatedServerRow.id || updatedServerRow.servings != null)) {
                // Merge authoritative server row into local item
                setPlan((prev) => {
                  const arr = Array.isArray(prev[key]) ? [...prev[key]] : [];
                  const idx = arr.findIndex(it =>
                    (it.serverId && updatedServerRow.id && String(it.serverId) === String(updatedServerRow.id)) ||
                    (it.clientId && targetItem.clientId && it.clientId === targetItem.clientId)
                  );
                  if (idx !== -1) {
                    arr[idx] = {
                      ...arr[idx],
                      serverId: updatedServerRow.id ?? arr[idx].serverId,
                      mealplanId: updatedServerRow.id ?? arr[idx].mealplanId,
                      servings: updatedServerRow.servings ?? arr[idx].servings,
                      base_servings: updatedServerRow.base_servings ?? arr[idx].base_servings,
                      date: updatedServerRow.date ?? arr[idx].date,
                      mealType: ((updatedServerRow.mealType || updatedServerRow.meal_type) ?? arr[idx].mealType).toString().toLowerCase()
                    };
                  }
                  const next = { ...prev, [key]: arr };
                  saveLocalPlan(next);
                  return next;
                });

                // ensure server authoritative inventory sync
                if (trackInventory) {
                  await syncInventoryFromServer();
                }
              } else {
                // fallback: re-sync that date's range
                await syncRange(localDate, localDate);
                if (trackInventory) await syncInventoryFromServer();
              }
            } else {
              // server refused; re-sync range so client reflects server
              await syncRange(localDate, localDate);
              // notify user
              const t = await res.text().catch(() => "");
              console.warn("Server PATCH /mealplan returned:", t);
              toast.warn("Failed to persist servings change to server; sync attempted.");
            }
            return;
          } catch (err) {
            console.warn("Failed to PATCH mealplan:", err);
            await syncRange(localDate, localDate);
            return;
          }
        }

        // If no mealplanId (not yet persisted), but we are online & have token, best-effort: re-sync that date
        if (token) {
          await syncRange(localDate, localDate);
        }

      } catch (err) {
        console.warn("updateServings inventory adjustment failed", err);
      }
    })();

    return { ok: true };
  }

  async function removeMeal(...args) {
    // same normalize-remove logic as before (unchanged)
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

    const prefs = readPrefsLocal();
    const trackInventory = !!prefs.user_inventory;

    if (!token && trackInventory && removedItem && removedItem.recipeId) {
      try {
        const localDate = typeof key === "string" ? key.slice(0,10) : (removedItem.date || null);
        const localToday = getLocalTodayYMD();
        if (localDate && localDate === localToday) {
          await adjustInventoryForRecipe({ id: removedItem.recipeId, base_servings: removedItem.base_servings ?? 1 }, -Number(removedItem.servings ?? 0));
        }
      } catch (err) { console.warn("Offline refund failed", err); }
    }

    if (token && serverId) {
      try {
        const localDate = typeof key === "string" ? key.slice(0,10) : (removedItem?.date || null);
        const localToday = getLocalTodayYMD();
        const applyNowQuery = (localDate && localDate === localToday) ? "?applyNow=1" : "";
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/mealplan/${serverId}${applyNowQuery}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          console.warn("Server failed to delete plan item", t);
          return { ok: false, error: t };
        }
        if (trackInventory) await syncInventoryFromServer();
        return { ok: true };
      } catch (err) {
        console.error("Delete request failed", err);
        return { ok: false, error: err.message };
      }
    }

    return { ok: true };
  }

  const getInventory = useCallback(() => (typeof inventory === "object" ? inventory : {}), [inventory]);
  const setInventoryLocal = useCallback((obj) => { setInventory(obj || {}); saveLocalInventory(obj || {}); }, []);

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