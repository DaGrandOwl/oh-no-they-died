import { useMemo, useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { useDrop } from "react-dnd";
import { toast } from "react-toastify";
import { usePreferences } from "../contexts/PrefContext";
import { usePlan } from "../contexts/PlanContext";
import MealCard from "./MealCard";

const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildWeekDates(dateForWeekday) {
  return daysOfWeek.map((day) => {
    const weekdayKey = day.toLowerCase();
    return {
      day,
      weekdayKey,
      displayDate: day.slice(0, 3),
      isoDate: typeof dateForWeekday === "function" ? dateForWeekday(weekdayKey) : null
    };
  });
}

function ConfirmModal({ open, title, message, onYes, onNo, darkTheme = false }) {
  if (!open) return null;
  
  const modalStyle = darkTheme ? {
    background: 'rgba(30, 41, 59, 0.95)',
    color: '#f8fafc',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  } : {
    background: "#fff",
    color: '#000',
    boxShadow: "0 10px 30px rgba(2,6,23,0.35)"
  };

  const cancelStyle = darkTheme ? {
    padding: "8px 12px", 
    background: "rgba(148, 163, 184, 0.2)", 
    borderRadius: 8, 
    border: "1px solid rgba(148, 163, 184, 0.3)", 
    cursor: "pointer",
    color: '#e2e8f0'
  } : {
    padding: "8px 12px", 
    background: "#f3f4f6", 
    borderRadius: 8, 
    border: "none", 
    cursor: "pointer"
  };

  return (
    <div style={{
      position: "fixed",
      left: 0, right: 0, top: 0, bottom: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)",
      zIndex: 1200
    }}>
      <div style={{
        width: 360, maxWidth: "94%", borderRadius: 12, padding: 18,
        ...modalStyle
      }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3>
        <p style={{ marginTop: 0, marginBottom: 16, color: darkTheme ? "#94a3b8" : "#374151" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onNo} style={cancelStyle}>Cancel</button>
          <button onClick={onYes} style={{
            padding: "8px 12px", 
            background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", 
            color: "#fff", 
            borderRadius: 8, 
            border: "none", 
            cursor: "pointer"
          }}>Add Anyway</button>
        </div>
      </div>
    </div>
  );
}

function PlannerCell({ 
  isoDate, 
  mealTime, 
  meals = [], 
  onDropMeal, 
  onSlotClick, 
  onRemove, 
  highlightedRecipe,
  plannerMode = false,
  minimized = false,
  darkTheme = false
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: "RECIPE",
    drop: (item) => {
      const recipe = item?.recipe ?? item;
      if (!recipe || (!recipe.id && !recipe.recipeId)) return;
      onDropMeal && onDropMeal(recipe, isoDate, mealTime);
      return undefined;
    },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() })
  });

  const highlight = highlightedRecipe !== null;

  // Merge same meals in a cell
  const mergedMeals = useMemo(() => {
    const map = new Map();
    meals.forEach((m, rawIndex) => {
      const id = m.clientId ?? m.serverId ?? m.id ?? m.recipeId ?? `no-id-${rawIndex}`;
      const prev = map.get(id);
      if (prev) {
        map.set(id, {
          ...prev,
          servings: (prev.servings ?? 0) + (m.servings ?? 1),
          __sourceIndices: [...prev.__sourceIndices, rawIndex],
        });
      } else {
        map.set(id, {
          ...m,
          servings: m.servings ?? 1,
          __sourceIndices: [rawIndex],
        });
      }
    });
    return Array.from(map.values());
  }, [meals]);

  const cellStyle = darkTheme ? {
    minHeight: 60,
    padding: "0.15rem",
    border: highlight ? "2px solid #8b5cf6" : "1px dashed rgba(148,163,184,0.3)",
    borderRadius: 4,
    background: isOver && canDrop ? "rgba(139,92,246,0.12)" : highlight ? "rgba(139,92,246,0.08)" : "transparent",
    verticalAlign: "top",
    cursor: highlight ? "pointer" : "default",
    position: 'relative',
    overflow: 'hidden'
  } : {
    minHeight: 60,
    padding: "0.15rem",
    border: highlight ? "2px solid #8b5cf6" : "1px dashed rgba(148,163,184,0.3)",
    borderRadius: 4,
    background: isOver && canDrop ? "rgba(139,92,246,0.12)" : highlight ? "rgba(139,92,246,0.08)" : "transparent",
    verticalAlign: "top",
    cursor: highlight ? "pointer" : "default",
    position: 'relative',
    overflow: 'hidden'
  };

  const removeButtonStyle = darkTheme ? {
    background: "rgba(239,68,68,0.2)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#f87171",
    marginLeft: 8
  } : {
    background: "rgba(239,68,68,0.12)",
    border: "none",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ef4444",
    marginLeft: 8
  };

  return (
    <td
      ref={dropRef}
      style={cellStyle}
      onClick={() => highlight && onSlotClick && onSlotClick(isoDate, mealTime)}
    >
      {(!mergedMeals || mergedMeals.length === 0) ? (
        <div style={{ 
          textAlign: "center", 
          color: highlight ? "#8b5cf6" : (darkTheme ? "#94a3b8" : "#94a3b8"), 
          fontSize: 12, 
          marginBottom: 6 
        }}>
          + Add Meal
        </div>
      ) : (
        mergedMeals.map((meal, idx) => {
          const key = meal.clientId ? `c-${meal.clientId}` : `m-${meal.id ?? meal.recipeId ?? idx}`;
          return (
            <div key={key} style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <MealCard
                item={meal}
                compact={true}
                hideImage={true}
                isoDate={isoDate}
                mealTime={mealTime}
                onAddToPlan={onDropMeal}
                plannerMode={plannerMode}
                minimized={minimized}
                darkTheme={darkTheme}
              />
              <button
                onClick={() => {
                  const keyStr = `${isoDate}-${String(mealTime).toLowerCase()}`;
                  const rawIndex =
                    meal.__sourceIndices?.[0] ??
                    meals.findIndex(x => {
                      const getId = y => y.clientId ?? y.serverId ?? y.id ?? y.recipeId;
                      return getId(x) === (meal.clientId ?? meal.serverId ?? meal.id ?? meal.recipeId);
                    });

                  onRemove && onRemove({
                    key: keyStr,
                    index: rawIndex,
                    serverId: meal.serverId ?? null,
                    clientId: meal.clientId ?? null,
                    recipeId: meal.id ?? meal.recipeId ?? null,
                  });
                }}
                style={removeButtonStyle}
                title="Remove"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          );
        })
      )}
    </td>
  );
}

export default function WeekPlanner({ 
  dateForWeekday, 
  highlightedRecipe, 
  onSlotClick,
  plannerMode = false,
  minimized = false,
  darkTheme = false,
  ...rest 
}) {
  // weekOffset: 0 -> current week; -1 previous; +1 next, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  // helper to build isoDate based on weekday + weekOffset
  const computeIsoForWeekday = useCallback((weekdayKey) => {
    // weekdayKey is "sunday", "monday", etc.
    // find the date for sunday of the target week then add offset
    const targetWeekStart = (() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));
      sunday.setHours(0,0,0,0);
      return sunday;
    })();

    const idx = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(weekdayKey);
    if (idx === -1) return null;
    const d = new Date(targetWeekStart);
    d.setDate(targetWeekStart.getDate() + idx);
    // return local YYYY-MM-DD (used for display and for backend conversion)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [weekOffset]);

  const weekDates = useMemo(() => buildWeekDates(computeIsoForWeekday), [computeIsoForWeekday]);
  const { prefs } = usePreferences();
  const { plan, addMeal, removeMeal, syncRange } = usePlan();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const confirmAndAdd = useCallback(async () => {
    if (!pending) { setConfirmOpen(false); return; }
    const { recipe, isoDate, mealTime } = pending;
    setConfirmOpen(false);
    setPending(null);
    await handleDropMeal(recipe, isoDate, mealTime);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, addMeal, removeMeal, plan]);

  const cancelPending = useCallback(() => {
    setPending(null);
    setConfirmOpen(false);
  }, []);

  const handleDropMeal = useCallback(async (recipe, isoDate, mealTime) => {
    if (!recipe) return;

    const safeMealTime = (mealTime || "unknown").toLowerCase();
    const targetKey = `${isoDate}-${safeMealTime}`;

    const getRecipeId = (r) => r.recipeId ?? r.id ?? r.recipe_id ?? null;
    const droppedRecipeId = getRecipeId(recipe);
    const droppedServings = Number(recipe.servings ?? 1);

    const userAllergens = Array.isArray(prefs?.allergens) ? prefs.allergens.map(a => a.toLowerCase()) : [];
    const recipeAllergens = Array.isArray(recipe.allergens) ? recipe.allergens.map(a => a.toLowerCase()) : [];
    const conflict = recipeAllergens.some(a => userAllergens.includes(a));
    if (conflict) {
      setPending({ recipe, isoDate, mealTime });
      setConfirmOpen(true);
      return;
    }

    // check if already exists in target
    const targetArr = Array.isArray(plan[targetKey]) ? [...plan[targetKey]] : [];
    const existingIdx = targetArr.findIndex(it => String(getRecipeId(it)) === String(droppedRecipeId));

    const sourceDate = recipe.date || recipe.scheduled_date || recipe.scheduledDate || null;
    const sourceMealType = recipe.mealType || recipe.meal_type || null;
    const sourceKey = (sourceDate && sourceMealType) ? `${sourceDate}-${String(sourceMealType).toLowerCase()}` : null;

    const srcArr = sourceKey && Array.isArray(plan[sourceKey]) ? [...plan[sourceKey]] : null;
    let sourceIndex = -1;
    if (srcArr && sourceKey) {
      sourceIndex = srcArr.findIndex(it => (it.clientId && recipe.clientId && it.clientId === recipe.clientId) || (it.serverId && recipe.serverId && it.serverId === recipe.serverId) || (String(getRecipeId(it)) === String(droppedRecipeId)));
    }

    // If the dragged item originated from the planner itself and nothing changed — ignore
    if (sourceKey && sourceKey === targetKey && sourceIndex !== -1 && existingIdx !== -1 && sourceIndex === existingIdx) return;

    // if existing found -> merge servings
    if (existingIdx !== -1) {
      const existing = targetArr[existingIdx];
      const combinedServings = Number(existing.servings ?? 0) + droppedServings;

      // remove existing entry first (so local display doesn't show duplicate)
      try {
        await removeMeal({ key: targetKey, index: existingIdx, serverId: existing.serverId ?? null });
      } catch (err) {
        // best-effort
      }

      // if the drop originated from a different cell, remove original too
      if (sourceKey && sourceKey !== targetKey) {
        // find index in source cell
        const sourceArr = Array.isArray(plan[sourceKey]) ? [...plan[sourceKey]] : [];
        const matchIdx = sourceArr.findIndex(it => (it.clientId && recipe.clientId && it.clientId === recipe.clientId) || (it.serverId && recipe.serverId && it.serverId === recipe.serverId));
        if (matchIdx !== -1) {
          try {
            await removeMeal({ key: sourceKey, index: matchIdx, serverId: sourceArr[matchIdx].serverId ?? null });
          } catch (err) {
            // ignore
          }
        }
      }

      // add combined entry (PlanContext will manage inventory based on user prefs)
      const res = await addMeal({ id: droppedRecipeId, name: recipe.name, image: recipe.image, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat, allergens: recipe.allergens }, isoDate, mealTime, combinedServings);
      if (res?.ok) toast.success("Merged servings and saved to plan");
      else toast.error("Failed to merge servings");
      return;
    }

    // no existing in target, just move (if from other cell remove original first)
    if (sourceKey && sourceKey !== targetKey && srcArr) {
      const matchIdx = srcArr.findIndex(it => (it.clientId && recipe.clientId && it.clientId === recipe.clientId) || (it.serverId && recipe.serverId && it.serverId === recipe.serverId) || (String(getRecipeId(it)) === String(droppedRecipeId)));
      if (matchIdx !== -1) {
        try {
          await removeMeal({ key: sourceKey, index: matchIdx, serverId: srcArr[matchIdx].serverId ?? null });
        } catch (err) {
          // ignore
        }
      }
    }

    // add dropped recipe to target (PlanContext handles inventory if enabled)
    const addRes = await addMeal({ id: droppedRecipeId, name: recipe.name, image: recipe.image, calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat, allergens: recipe.allergens }, isoDate, mealTime, droppedServings);
    if (addRes?.ok) toast.success("Added to plan");
    else toast.error("Failed to add to plan");

  }, [prefs, plan, addMeal, removeMeal]);

  const refreshWeek = useCallback(() => {
    if (!weekDates || !weekDates.length) return;
    const dates = weekDates.map(w => w.isoDate).filter(Boolean);
    if (dates.length && typeof syncRange === "function") {
      const sorted = [...dates].sort();
      syncRange(sorted[0], sorted[sorted.length - 1]).catch((e) => console.warn("syncRange failed", e));
    }
  }, [weekDates, syncRange]);

  // Auto-refresh on mount and whenever weekOffset (the displayed week) changes
  useEffect(() => {
    refreshWeek();
  }, [weekOffset, refreshWeek]);

  const handleRemove = useCallback(async ({ key, index, serverId, clientId, recipeId }) => {
    const arr = Array.isArray(plan[key]) ? plan[key] : [];
    let idx = typeof index === 'number' ? index : -1;
    if (idx < 0 || idx >= arr.length) {
      const getId = x => x.clientId ?? x.serverId ?? x.id ?? x.recipeId;
      const needle = clientId ?? serverId ?? recipeId ?? null;
      if (needle != null) idx = arr.findIndex(x => getId(x) === needle);
    }
    if (idx < 0) return;
    try {
      // removeMeal will refund inventory if user has inventory tracking turned on (handled in PlanContext)
      await removeMeal({ key, index: idx, serverId: arr[idx]?.serverId ?? serverId ?? null });
      toast.info("Removed from plan");
    } catch (err) {
      toast.error("Failed to remove from server");
    }
  }, [plan, removeMeal]);

  // compute today local (for highlight)
  const todayLocal = (() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  // NEW: Container styling based on theme
  const containerStyle = darkTheme ? {
    padding: 16,
    color: '#f8fafc'
  } : {
    padding: 16
  };

  const headerStyle = darkTheme ? {
    fontSize: 16, 
    margin: 0,
    color: '#f8fafc'
  } : {
    fontSize: 16, 
    margin: 0
  };

  const navButtonStyle = darkTheme ? {
    padding: "6px 10px", 
    borderRadius: 8, 
    border: "1px solid rgba(148, 163, 184, 0.2)", 
    background: "rgba(30, 41, 59, 0.8)", 
    cursor: "pointer",
    color: '#e2e8f0'
  } : {
    padding: "6px 10px", 
    borderRadius: 8, 
    border: "none", 
    background: "#eef2ff", 
    cursor: "pointer"
  };

  const tableStyle = darkTheme ? {
    width: "100%", 
    borderCollapse: "collapse",
    background: 'rgba(30, 41, 59, 0.3)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    tableLayout: 'fixed'
  } : {
    width: "100%", 
    borderCollapse: "collapse",
    tableLayout: 'fixed'
  };

  const thStyle = darkTheme ? {
    padding: 8, 
    textAlign: "center",
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#e2e8f0'
  } : {
    padding: 8, 
    textAlign: "center"
  };

  const mealTimeStyle = darkTheme ? {
    fontWeight: 600,
    color: "#a78bfa",
    textAlign: "center",
    background: "rgba(139,92,246,0.1)",
    padding: 4,
    fontSize: '0.8rem'
  } : {
    fontWeight: 600,
    color: "#a78bfa",
    textAlign: "center",
    background: "rgba(199, 180, 243, 0.1)",
    padding: 4,
    fontSize: '0.8rem'
  };

  return (
    <div style={containerStyle}>
      <ConfirmModal
        open={confirmOpen}
        title="Allergen Warning"
        message="This recipe contains one or more allergens you marked. Are you sure you want to add it?"
        onYes={confirmAndAdd}
        onNo={cancelPending}
        darkTheme={darkTheme}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={headerStyle}>Weekly Planner</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={navButtonStyle}>Previous</button>
          <button onClick={() => setWeekOffset(0)} style={navButtonStyle}>This Week</button>
          <button onClick={() => setWeekOffset(o => o + 1)} style={navButtonStyle}>Next</button>
        </div>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", width: 120, ...thStyle }}>Meal Time</th>
            {weekDates.map(({ day, displayDate, isoDate }, idx) => {
              const isToday = isoDate === todayLocal;
              const thTodayStyle = isToday ? { background: darkTheme ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.12)", borderRadius: 6 } : {};
              return (
                <th key={`${day}-${idx}`} style={{ ...thStyle, ...thTodayStyle }}>
                  <div style={{ fontSize: 12, color: darkTheme ? "#94a3b8" : "#6b7280" }}>{displayDate}</div>
                  <div style={{ fontWeight: 600 }}>{day}</div>
                  <div style={{ fontSize: 12, color: darkTheme ? "#94a3b8" : "#94a3b8" }}>{isoDate}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {mealTimes.map((mealTime) => (
            <tr key={mealTime}>
              <td style={mealTimeStyle}>{mealTime}</td>

              {weekDates.map(({ isoDate }, idx) => {
                const normalizedMealTime = mealTime.toLowerCase();
                const cellKey = `${isoDate}-${normalizedMealTime}`;
                const meals = Array.isArray(plan[cellKey]) ? plan[cellKey] : [];

                return (
                  <PlannerCell
                    key={cellKey + "-" + idx}
                    isoDate={isoDate}
                    mealTime={mealTime}
                    meals={meals}
                    onDropMeal={handleDropMeal}
                    onRemove={handleRemove}
                    highlightedRecipe={highlightedRecipe}
                    onSlotClick={onSlotClick}
                    plannerMode={plannerMode}
                    minimized={minimized}
                    darkTheme={darkTheme}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}