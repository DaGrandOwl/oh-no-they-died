import { useState } from "react";
import { DndProvider, useDrag } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import WeekPlanner from "../components/WeekPlanner"; // must accept onDrop, highlightedRecipe, onSlotClick, onRemove
import { usePreferences } from "../contexts/PrefContext";
import { usePlan } from "../contexts/PlanContext";
import { useAuth } from "../contexts/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function confirmToast(message, onConfirm, options = {}) {
  toast.warn(
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span>{message}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { toast.dismiss(); onConfirm(); }}
          style={{ padding: '2px 6px', background: '#4ade80', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Yes
        </button>
        <button
          onClick={() => toast.dismiss()}
          style={{ padding: '2px 6px', background: '#f87171', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
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

function RecipeResultCard({ recipe, onStartHighlight, onClearHighlight }) {
  const [, dragRef] = useDrag(() => ({
    type: "RECIPE",
    item: () => {
      onStartHighlight(recipe);
      return { recipe };
    },
    end: () => {
      onClearHighlight();
    },
    collect: () => ({})
  }));

  return (
    <div
      ref={dragRef}
      style={{
        borderRadius: 8,
        border: "1px solid rgba(148,163,184,0.12)",
        padding: 12,
        background: "linear-gradient(180deg, rgba(15,23,42,0.6), rgba(17,24,39,0.6))",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{recipe.name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{recipe.cuisine || recipe.mealType || ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{recipe.calories ?? "-" } cal</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{recipe.servings ?? 1} serv</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, fontSize: 13, color: "#cbd5e1" }}>
        <div>P: {recipe.protein ?? "-" }g</div>
        <div>C: {recipe.carbs ?? "-" }g</div>
        <div>F: {recipe.fat ?? "-" }g</div>
        <div>Cost: ${recipe.appx_cost ?? "-"}</div>
      </div>

      {typeof recipe.match_pct === "number" && (
        <div style={{ fontSize: 12, color: "#a78bfa" }}>
          Inventory match: {Math.round(recipe.match_pct)}%
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={() => onStartHighlight(recipe)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            background: "linear-gradient(90deg,#8b5cf6,#06b6d4)",
            color: "white",
            cursor: "pointer"
          }}
        >
          Add
        </button>

        <a
          href={`/recipe/${recipe.id}`}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            textDecoration: "none",
            color: "#a78bfa",
            border: "1px solid rgba(167,139,250,0.14)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          View
        </a>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const { prefs } = usePreferences();
  const { addMeal, plan, removeMeal } = usePlan();
  const { token } = useAuth();
  const [filters, setFilters] = useState({
    cuisine: "",
    mealType: "",
    dietType: "",
    maxCalories: "",
    minCarbs: "",
    minProtein: "",
    minFat: "",
    maxCost: "",
    inventoryMatch: false,
    servings: ""
  });
  const [results, setResults] = useState([]);
  const [highlightedRecipe, setHighlightedRecipe] = useState(null); // recipe object when Add pressed or drag begun
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  async function searchRecipes() {
    try {
      setLoading(true);
      // build query params only for non-empty filters
      const params = {};
      Object.entries(filters).forEach(([k,v]) => {
        if (v !== "" && v !== false && v !== null && v !== undefined) params[k] = v;
      });
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recommendations?${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        toast.error("Failed to get recommendations");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }

  // Called by Recipe card drag begin or Add button
  function startHighlight(recipe) {
    setHighlightedRecipe(recipe);
    toast.info("Click a slot in the planner to add this meal (or drop onto a slot).", { autoClose: 3000 });
  }

  function clearHighlight() {
    setHighlightedRecipe(null);
  }

  // Called by planner when a slot is clicked (mobile fallback)
  async function handleSlotClick(date, mealTime) {
    if (!highlightedRecipe) {
      toast.info("Select a recipe first (Add or drag).");
      return;
    }
    await handleAddRecipeToPlan(highlightedRecipe, date, mealTime);
    clearHighlight();
  }

  // Called when a recipe is dropped on planner slot (drag)
  async function handleDrop(recipe, date, mealTime) {
    await handleAddRecipeToPlan(recipe, date, mealTime);
    clearHighlight();
  }

  // Centralized add flow (allergen check -> confirm -> add)
  async function handleAddRecipeToPlan(recipe, date, mealTime) {
    try {
      // allergen check (use user's prefs)
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
      const doAdd = async () => {
        const res = await addMeal(recipe, date, mealTime, recipe.servings ?? 1);
        if (res.ok) toast.success("Added to plan");
        else toast.error("Failed to add to plan");
      };

      if (hasBad) {
        // show confirm toast with Yes callback
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, padding: 16 }}>
        <ToastContainer position="top-right" />
        <main style={{ paddingRight: 12 }}>
          <h2>Recipe Recommendations</h2>

          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginBottom: 12 }}>
            <input placeholder="Cuisine" value={filters.cuisine} onChange={e => handleFilterChange("cuisine", e.target.value)} />
            <input placeholder="Meal type (Breakfast/Lunch/...)" value={filters.mealType} onChange={e => handleFilterChange("mealType", e.target.value)} />
            <input placeholder="Diet type (keto/vegan...)" value={filters.dietType} onChange={e => handleFilterChange("dietType", e.target.value)} />
            <input type="number" placeholder="Max Calories" value={filters.maxCalories} onChange={e => handleFilterChange("maxCalories", e.target.value)} />
            <input type="number" placeholder="Min Carbs (g)" value={filters.minCarbs} onChange={e => handleFilterChange("minCarbs", e.target.value)} />
            <input type="number" placeholder="Min Protein (g)" value={filters.minProtein} onChange={e => handleFilterChange("minProtein", e.target.value)} />
            <input type="number" placeholder="Min Fat (g)" value={filters.minFat} onChange={e => handleFilterChange("minFat", e.target.value)} />
            <input type="number" placeholder="Max Cost ($)" value={filters.maxCost} onChange={e => handleFilterChange("maxCost", e.target.value)} />
            <input type="number" placeholder="Servings" value={filters.servings} onChange={e => handleFilterChange("servings", e.target.value)} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={filters.inventoryMatch} onChange={e => handleFilterChange("inventoryMatch", e.target.checked)} />
              Match inventory
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={searchRecipes} style={{ padding: "8px 12px", borderRadius: 6, background: "#06b6d4", color: "#fff", border: "none" }}>
              {loading ? "Searching..." : "Search"}
            </button>
            <button onClick={() => { setFilters({}); setResults([]); }} style={{ padding: "8px 12px", borderRadius: 6 }}>
              Clear
            </button>
            {highlightedRecipe && (
              <button onClick={() => clearHighlight()} style={{ padding: "8px 12px", borderRadius: 6 }}>
                Cancel Add
              </button>
            )}
          </div>

          {/* Results grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {results.length === 0 ? (
              <div style={{ gridColumn: "1/-1", color: "#9ca3af" }}>No results. Try different filters.</div>
            ) : results.map(r => (
              <RecipeResultCard
                key={r.id}
                recipe={r}
                onStartHighlight={startHighlight}
                onClearHighlight={clearHighlight}
              />
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