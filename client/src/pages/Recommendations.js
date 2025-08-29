import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import WeekPlanner from "../components/WeekPlanner";
import { usePreferences } from "../contexts/PrefContext";
import { usePlan } from "../contexts/PlanContext";
import { useAuth } from "../contexts/AuthContext";
import MealCard from "../components/MealCard";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function confirmToast(message, onConfirm, options = {}) {
  toast.warn(
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span>{message}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => { toast.dismiss(); onConfirm(); }}
          style={{ padding: "2px 6px", background: "#4ade80", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Yes
        </button>
        <button
          onClick={() => toast.dismiss()}
          style={{ padding: "2px 6px", background: "#f87171", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>,
    { autoClose: false, ...options }
  );
}

function nextDateForWeekday(weekday) {
  const today = new Date();
  const target = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(weekday);
  const diff = (target - today.getDay() + 7) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + (diff === 0 ? 0 : diff));
  return next.toISOString().slice(0,10);
}

export default function Recommendations() {
  const { prefs } = usePreferences();
  const { addMeal, plan, removeMeal } = usePlan();
  const { token } = useAuth();

  // Filters: no servings filter here
  const [filters, setFilters] = useState({
    cuisine: "",
    mealType: "",
    dietType: "",
    maxCalories: "",
    minCarbs: "",
    minProtein: "",
    minFat: "",
    maxCost: 3,           // default to highest tier ($$$)
    inventoryMatch: false
  });

  const initialFilters = {
    cuisine: "",
    mealType: "",
    dietType: "",
    maxCalories: "",
    minCarbs: "",
    minProtein: "",
    minFat: "",
    maxCost: 3,
    inventoryMatch: false
  };

  const [results, setResults] = useState([]);
  const [highlightedRecipe, setHighlightedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  async function searchRecipes() {
    try {
      setLoading(true);

      const params = {};
      if (filters.cuisine && String(filters.cuisine).trim() !== "") params.cuisine = filters.cuisine;
      if (filters.mealType && String(filters.mealType).trim() !== "") params.mealType = filters.mealType;
      if (filters.dietType && String(filters.dietType).trim() !== "") params.dietType = filters.dietType;
      if (filters.maxCalories !== "" && filters.maxCalories != null) params.calories = filters.maxCalories;
      if (filters.minCarbs !== "" && filters.minCarbs != null) params.carbs = filters.minCarbs;
      if (filters.minProtein !== "" && filters.minProtein != null) params.protein = filters.minProtein;
      if (filters.minFat !== "" && filters.minFat != null) params.fat = filters.minFat;

      // maxCost must be 1..3 to match appx_cost DB column semantics
      const mc = Number(filters.maxCost);
      if ([1,2,3].includes(mc)) params.maxCost = mc;

      if (filters.inventoryMatch === true) params.inventoryMatch = true;

      const qs = new URLSearchParams(params).toString();
      const url = `${process.env.REACT_APP_API_URL}/api/recommendations${qs ? ("?" + qs) : ""}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // read text once and parse JSON defensively (prevents multiple body reads / HTML responses causing exceptions)
      const text = await res.text();

      if (!res.ok) {
        // backend returned an error page or JSON error
        console.error("Recommendations failed:", text);
        toast.error("Failed to get recommendations");
        setResults([]);
        return;
      }

      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch (err) {
        console.error("Non-JSON recommendations response:", text);
        toast.error("Server returned invalid data");
        setResults([]);
        return;
      }

      let normalized = [];
      if (Array.isArray(data)) normalized = data;
      else if (data && typeof data === "object") normalized = [data];
      else normalized = [];

      // limit to 5 as UI expects
      normalized = normalized.slice(0, 5);

      setResults(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function startHighlight(recipeWithServings) {
    // recipeWithServings should include the current servings as selected in the MealCard
    setHighlightedRecipe(recipeWithServings);
    toast.info("Click a slot in the planner to add this meal (or drop onto a slot).", { autoClose: 3000 });
  }

  function clearHighlight() {
    setHighlightedRecipe(null);
  }

  async function handleSlotClick(date, mealTime) {
    if (!highlightedRecipe) {
      toast.info("Select a recipe first (Add or drag).");
      return;
    }
    await handleAddRecipeToPlan(highlightedRecipe, date, mealTime);
    clearHighlight();
  }

  async function handleDrop(recipe, date, mealTime) {
    await handleAddRecipeToPlan(recipe, date, mealTime);
    clearHighlight();
  }

  async function handleAddRecipeToPlan(recipe, date, mealTime) {
    try {
      function toArray(val) {
        if (!val) return [];
        if (Array.isArray(val)) {
          return val.filter(v => typeof v === "string" && v.trim() !== "");
        }
        if (typeof val === "string") {
          return val.split(",").map(s => s.trim()).filter(s => s.length > 0);
        }
        return [];
      }
      const userAllergens = toArray(prefs?.allergens).map(a => a.toLowerCase());
      const recipeAllergens = toArray(recipe.allergens).map(a => a.toLowerCase());
      const hasBad = recipeAllergens.some(a => userAllergens.includes(a));

      // honor servings included on recipe (from MealCard drag or highlighted item)
      const servingsToUse = Number(recipe.servings ?? recipe.recommended_servings ?? 1);

      const doAdd = async () => {
        const res = await addMeal(recipe, date, mealTime, servingsToUse);
        if (res.ok) toast.success("Added to plan");
        else toast.error("Failed to add to plan");
      };

      if (hasBad) {
        confirmToast(
          "This recipe contains allergens you marked. Add anyway?",
          async () => doAdd()
        );
      } else {
        await doAdd();
      }
    } catch (err) {
      console.error("Add to plan failed", err);
      toast.error("Add failed");
    }
  }

  const clearAll = () => {
    setFilters({ ...initialFilters });
    setResults([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, padding: 16 }}>
        <ToastContainer position="top-right" />
        <main style={{ paddingRight: 12 }}>
          <h2>Recipe Recommendations</h2>

          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 12 }}>
            <input placeholder="Cuisine" value={filters.cuisine} onChange={e => handleFilterChange("cuisine", e.target.value)} />

            {/* mealType dropdown */}
            <select value={filters.mealType} onChange={e => handleFilterChange("mealType", e.target.value)}>
              <option value="">Any meal type</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snacks">Snacks</option>
            </select>

            <input placeholder="Diet type (keto/vegan...)" value={filters.dietType} onChange={e => handleFilterChange("dietType", e.target.value)} />
            <input type="number" placeholder="Max Calories" value={filters.maxCalories} onChange={e => handleFilterChange("maxCalories", e.target.value)} />
            <input type="number" placeholder="Min Carbs (g)" value={filters.minCarbs} onChange={e => handleFilterChange("minCarbs", e.target.value)} />
            <input type="number" placeholder="Min Protein (g)" value={filters.minProtein} onChange={e => handleFilterChange("minProtein", e.target.value)} />
            <input type="number" placeholder="Min Fat (g)" value={filters.minFat} onChange={e => handleFilterChange("minFat", e.target.value)} />

            {/* Max cost: show as $, $$, $$$ (maps to 1,2,3) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
                Max cost:
              </label>
              <select
                value={filters.maxCost ?? 3}
                onChange={(e) => handleFilterChange("maxCost", Number(e.target.value))}
                style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 14 }}
              >
                <option value={3}>$$$</option>
                <option value={2}>$$</option>
                <option value={1}>$</option>
              </select>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={filters.inventoryMatch} onChange={e => handleFilterChange("inventoryMatch", e.target.checked)} />
              Match inventory
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={searchRecipes} style={{ padding: "8px 12px", borderRadius: 6, background: "#06b6d4", color: "#fff", border: "none" }}>
              {loading ? "Searching..." : "Search"}
            </button>

            <button onClick={clearAll} style={{ padding: "8px 12px", borderRadius: 6 }}>
              Clear
            </button>

            {highlightedRecipe && (
              <button onClick={() => clearHighlight()} style={{ padding: "8px 12px", borderRadius: 6 }}>
                Cancel Add
              </button>
            )}
          </div>

          {/* Results grid: use MealCard for recommendations */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {results.length === 0 ? (
              <div style={{ gridColumn: "1/-1", color: "#9ca3af" }}>No results. Try different filters.</div>
            ) : results.map(r => (
              <div key={r.id}>
                <MealCard
                  recipe={r}
                  compact={false}
                  hideImage={false}
                  onStartHighlight={(recipeWithServings) => startHighlight(recipeWithServings)}
                  onClearHighlight={() => clearHighlight()}
                />
                {typeof r.match_pct === "number" && (
                  <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 6 }}>Inventory match: {Math.round(r.match_pct)}%</div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Side: Planner */}
        <aside style={{ position: "relative" }}>
          <h3>Weekly Planner</h3>
          <WeekPlanner
            plan={plan}
            highlightedRecipe={highlightedRecipe}
            onSlotClick={handleSlotClick}
            onDrop={(recipe, date, mealTime) => handleDrop(recipe, date, mealTime)}
            onRemove={({ key, index, serverId }) => removeMeal({ key, index, serverId })}
            dateForWeekday={(weekday) => nextDateForWeekday(weekday)}
          />
          <div style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>
            Tip: drag a card onto planner (desktop) or press Add then click a slot (mobile).
          </div>
        </aside>
      </div>
    </DndProvider>
  );
}