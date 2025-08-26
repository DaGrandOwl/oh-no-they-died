import { useMemo, useState, useCallback } from "react";
import { X } from "lucide-react";
import { useDrop } from "react-dnd";
import { toast } from "react-toastify";
import { usePreferences } from "../contexts/PrefContext";
import { usePlan } from "../contexts/PlanContext";

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

// Simple confirm modal component
function ConfirmModal({ open, title, message, onYes, onNo }) {
  if (!open) return null;
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
        background: "#fff", boxShadow: "0 10px 30px rgba(2,6,23,0.35)"
      }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>{title}</h3>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onNo} style={{
            padding: "8px 12px", background: "#f3f4f6", borderRadius: 8, border: "none", cursor: "pointer"
          }}>Cancel</button>
          <button onClick={onYes} style={{
            padding: "8px 12px", background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer"
          }}>Add Anyway</button>
        </div>
      </div>
    </div>
  );
}

// Single cell in the planner grid that accepts drops
function PlannerCell({ isoDate, dayLabel, mealTime, meals = [], onDropMeal, onSlotClick, onRemove, highlightedRecipe }) {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: "RECIPE",
    drop: (item) => {
      const recipe = item.recipe || item;
      onDropMeal && onDropMeal(recipe, isoDate, mealTime);
      return undefined;
    },
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() })
  });

  // Highlight cell if highlightedRecipe is set
  const highlight = highlightedRecipe !== null;

  return (
    <td
      ref={dropRef}
      style={{
        minHeight: 80,
        padding: "0.25rem",
        border: highlight ? "2px solid #8b5cf6" : "1px dashed rgba(148,163,184,0.3)",
        borderRadius: 4,
        background: isOver && canDrop ? "rgba(139,92,246,0.12)" : highlight ? "rgba(139,92,246,0.08)" : "transparent",
        verticalAlign: "top",
        cursor: highlight ? "pointer" : "default"
      }}
      onClick={() => highlight && onSlotClick && onSlotClick(isoDate, mealTime)}
    >
      {meals.length === 0 ? (
        <div style={{ textAlign: "center", color: highlight ? "#8b5cf6" : "#94a3b8", fontSize: 12, marginBottom: 6 }}>
          + Add Meal
        </div>
      ) : (
        meals.map((meal, idx) => {
          const key = meal.id || meal.serverId || meal.clientId || `${isoDate}-${mealTime}-${idx}`;
          return (
            <div key={key} style={{
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.14)",
              borderRadius: 6,
              padding: "8px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8
            }}>
              <div style={{ overflow: "hidden", minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {meal.name}
                </div>
                {meal.calories != null && (
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {meal.calories} cal • {meal.protein ?? 0}g pro
                  </div>
                )}
              </div>

              <button
                onClick={() => onRemove && onRemove({ key: `${isoDate}-${mealTime}`, index: idx, serverId: meal.id || meal.serverId || null })}
                style={{
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
                }}
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

export default function WeekPlanner({ dateForWeekday, highlightedRecipe, onSlotClick, ...rest }) {
  const weekDates = useMemo(() => buildWeekDates(dateForWeekday), [dateForWeekday]);
  const { prefs } = usePreferences();
  const { plan, addMeal, removeMeal } = usePlan();

  // local confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null); // { recipe, isoDate, mealTime }

  // Handler to actually persist pending drop after user confirms
  const confirmAndAdd = useCallback(async () => {
    if (!pending) { setConfirmOpen(false); return; }
    const { recipe, isoDate, mealTime } = pending;
    setConfirmOpen(false);
    setPending(null);

    const res = await addMeal({ recipe, date: isoDate, mealType: mealTime, servings: recipe.servings || 1 });
    if (res && res.ok) toast.success("Added to plan");
    else toast.error("Failed to add to plan");
  }, [pending, addMeal]);

  // Cancel pending
  const cancelPending = useCallback(() => {
    setPending(null);
    setConfirmOpen(false);
  }, []);

  // Called when a recipe is dropped / added into a cell
  const handleDropMeal = useCallback(async (recipe, isoDate, mealTime) => {
    // allergen checking
    const userAllergens = (prefs?.allergens || []).map(a => a.toLowerCase());
    const recipeAllergens = (recipe?.allergens || []).map(a => a.toLowerCase());
    const conflict = recipeAllergens.some(a => userAllergens.includes(a));
    if (conflict) {
      // show inline confirm modal
      setPending({ recipe, isoDate, mealTime });
      setConfirmOpen(true);
      return;
    }

    // no conflict — add immediately
    const res = await addMeal({ recipe, date: isoDate, mealType: mealTime, servings: recipe.servings || 1 });
    if (res && res.ok) toast.success("Added to plan");
    else toast.error("Failed to add to plan");
  }, [prefs, addMeal]);

  // Remove meal wrapper (calls PlanContext removeMeal)
  const handleRemove = useCallback(async ({ key, index, serverId }) => {
    // key is like "YYYY-MM-DD-MealTime"
    await removeMeal({ key, index, serverId });
    toast.info("Removed from plan");
  }, [removeMeal]);

  return (
    <div style={{ padding: 16 }}>
      <ConfirmModal
        open={confirmOpen}
        title="Allergen Warning"
        message="This recipe contains one or more allergens you marked. Are you sure you want to add it?"
        onYes={confirmAndAdd}
        onNo={cancelPending}
      />

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Weekly Planner</h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", width: 120 }}>Meal Time</th>
            {weekDates.map(({ day, displayDate }, idx) => (
              <th key={`${day}-${idx}`} style={{ padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{displayDate}</div>
                <div style={{ fontWeight: 600 }}>{day}</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {mealTimes.map((mealTime) => (
            <tr key={mealTime}>
              <td style={{
                fontWeight: 600,
                color: "#7c3aed",
                textAlign: "center",
                background: "rgba(139,92,246,0.04)",
                padding: 8
              }}>{mealTime}</td>

              {weekDates.map(({ weekdayKey, isoDate }, idx) => {
                // key string that PlanContext uses
                const key = `${isoDate || weekdayKey}-${mealTime}`;
                const meals = plan[key] || [];

                return (
                  <PlannerCell
                    key={key + "-" + idx}
                    isoDate={isoDate || weekdayKey}
                    dayLabel={weekdayKey}
                    mealTime={mealTime}
                    meals={meals}
                    onDropMeal={handleDropMeal}
                    onRemove={handleRemove}
                    highlightedRecipe={highlightedRecipe}
                    onSlotClick={onSlotClick}
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