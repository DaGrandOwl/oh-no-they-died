import { useState, useCallback } from "react";
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

export default function Dashboard() {
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
    maxCost: 3,
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

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

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
      const mc = Number(filters.maxCost);
      if ([1,2,3].includes(mc)) params.maxCost = mc;
      if (filters.inventoryMatch === true) params.inventoryMatch = true;

      const qs = new URLSearchParams(params).toString();
      const url = `${process.env.REACT_APP_API_URL}/api/recommendations${qs ? ("?" + qs) : ""}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const text = await res.text();
      if (!res.ok) {
        console.error("Recommendations failed:", text);
        toast.error("Failed to get recommendations");
        setResults([]);
        return;
      }
      let data;
      try { data = text ? JSON.parse(text) : []; } catch (err) { console.error("Non-JSON recommendations response:", text); toast.error("Server returned invalid data"); setResults([]); return; }
      let normalized = Array.isArray(data) ? data : (data && typeof data === "object" ? [data] : []);
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
    setHighlightedRecipe(recipeWithServings);
    toast.info("Click a slot in the planner to add this meal (or drop onto a slot).", { autoClose: 3000 });
  }
  function clearHighlight() { setHighlightedRecipe(null); }

  async function handleSlotClick(date, mealTime) {
    if (!highlightedRecipe) { toast.info("Select a recipe first (Add or drag)."); return; }
    await handleAddRecipeToPlan(highlightedRecipe, date, mealTime);
    clearHighlight();
  }

  async function handleDrop(recipe, date, mealTime) {
    // this is called from the planner when a card is dropped
    await handleAddRecipeToPlan(recipe, date, mealTime);
    clearHighlight();
  }

  async function handleAddRecipeToPlan(recipe, date, mealTime) {
    try {
      function toArray(val) {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(v => typeof v === "string" && v.trim() !== "");
        if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
        return [];
      }
      const userAllergens = toArray(prefs?.allergens).map(a => a.toLowerCase());
      const recipeAllergens = toArray(recipe.allergens).map(a => a.toLowerCase());
      const hasBad = recipeAllergens.some(a => userAllergens.includes(a));
      const servingsToUse = Number(recipe.servings ?? recipe.recommended_servings ?? 1);

      const doAdd = async () => {
        const res = await addMeal(recipe, date, mealTime, servingsToUse);
        if (res.ok) toast.success("Added to plan");
        else toast.error("Failed to add to plan");
      };

      if (hasBad) {
        confirmToast("This recipe contains allergens you marked. Add anyway?", async () => doAdd());
      } else {
        await doAdd();
      }
    } catch (err) {
      console.error("Add to plan failed", err);
      toast.error("Add failed");
    }
  }

  const clearAll = () => { setFilters({ ...initialFilters }); setResults([]); };

  const handleRemove = useCallback(async ({ key, index, serverId, clientId, recipeId }) => {
    // wrapper so the planner can call onRemove and we call removeMeal()
    try {
      // try to remove, removeMeal expects { key, index, serverId } in your codebase
      await removeMeal({ key, index, serverId });
      toast.info("Removed from plan");
    } catch (err) {
      console.error("Failed remove:", err);
      toast.error("Failed to remove from server");
    }
  }, [removeMeal]);

  const cardStyle = { background: 'rgba(30,41,59,0.6)', backdropFilter: 'blur(10px)', borderRadius:'1rem', border:'1px solid rgba(148,163,184,0.1)', padding:'1.5rem', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '1rem' };
  const inputStyle = { padding:'0.75rem 1rem', background:'rgba(30,41,59,0.8)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:'0.5rem', color:'#f8fafc', fontSize:'0.875rem', outline:'none' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const buttonStyle = { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem 1rem', borderRadius:'0.5rem', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:'500' };
  const buttonPrimary = { ...buttonStyle, background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)', color: 'white' };
  const buttonSecondary = { ...buttonStyle, background: 'transparent', color: '#94a3b8', border:'1px solid rgba(148,163,184,0.2)' };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
        <ToastContainer position="top-right" />
        <main style={{ flex: 1, minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)', fontFamily:'system-ui, -apple-system, sans-serif', color: '#f8fafc', padding: '2rem' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize:'2.5rem', fontWeight:'bold', margin: '0 0 0.5rem 0', background:'linear-gradient(45deg,#8b5cf6,#06b6d4)', backgroundClip:'text', WebkitBackgroundClip:'text', color:'transparent' }}>
                    Recipe Recommendations
                  </h1>
                  <p style={{ fontSize: '1.125rem', color:'#94a3b8', margin: 0 }}>Discover and plan your next meal</p>
                </div>

                {highlightedRecipe && (
                  <button onClick={() => clearHighlight()} style={{ ...buttonSecondary, background: 'rgba(239,68,68,0.1)', color:'#f87171' }}>
                    Cancel Selection
                  </button>
                )}
              </div>
            </div>

            {/* Top grid: Filters (left) and Results (right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={cardStyle}>
                  <h3 style={{ fontSize:'1.25rem', fontWeight:600, marginBottom: '1rem' }}>🔍 Search Filters</h3>

                  <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <input type="number" placeholder="Min Carbs (g)" value={filters.minCarbs} onChange={e => handleFilterChange("minCarbs", e.target.value)} style={inputStyle} />
                    <input type="number" placeholder="Min Protein (g)" value={filters.minProtein} onChange={e => handleFilterChange("minProtein", e.target.value)} style={inputStyle} />
                    <input type="number" placeholder="Min Fat (g)" value={filters.minFat} onChange={e => handleFilterChange("minFat", e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <input type="number" placeholder="Max Calories" value={filters.maxCalories} onChange={e => handleFilterChange("maxCalories", e.target.value)} style={inputStyle} />
                    <div><select value={filters.maxCost ?? 3} onChange={e => handleFilterChange("maxCost", Number(e.target.value))} style={selectStyle}><option value={3}>$$$ (Premium)</option><option value={2}>$$ (Moderate)</option><option value={1}>$ (Budget)</option></select></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <label style={{ display:'flex', alignItems:'center', gap: 8, fontSize: '0.875rem', color:'#e2e8f0', cursor:'pointer' }}>
                        <input type="checkbox" checked={filters.inventoryMatch} onChange={e => handleFilterChange("inventoryMatch", e.target.checked)} style={{ accentColor: '#8b5cf6' }} />
                        Match my inventory
                      </label>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap:'1rem', marginBottom: '1.5rem' }}>
                    <input placeholder="Cuisine" value={filters.cuisine} onChange={e => handleFilterChange("cuisine", e.target.value)} style={inputStyle} />
                    <select value={filters.mealType} onChange={e => handleFilterChange("mealType", e.target.value)} style={selectStyle}><option value="">Any meal type</option><option value="Breakfast">Breakfast</option><option value="Lunch">Lunch</option><option value="Dinner">Dinner</option><option value="Snacks">Snacks</option></select>
                    <input placeholder="Diet type (keto/vegan...)" value={filters.dietType} onChange={e => handleFilterChange("dietType", e.target.value)} style={inputStyle} />
                  </div>

                  <div style={{ display:'flex', gap: '1rem' }}>
                    <button onClick={searchRecipes} style={buttonPrimary}>{loading ? "Searching..." : "🔍 Search Recipes"}</button>
                    <button onClick={clearAll} style={buttonSecondary}>🗑️ Clear Filters</button>
                  </div>
                </div>
              </div>

              <div>
                <div style={cardStyle}>
                  <h2 style={{ fontSize:'1.5rem', fontWeight:600, marginBottom: '1rem' }}>🍽️ Recipe Results {results.length > 0 && `(${results.length})`}</h2>

                  {results.length === 0 ? (
                    <div style={{ textAlign: 'center', padding:'3rem 1rem', color:'#94a3b8', background:'rgba(139,92,246,0.05)', borderRadius: '0.75rem' }}>
                      <div style={{ fontSize:'3rem', marginBottom: '1rem' }}>🔍</div>
                      <div style={{ fontSize:'1.125rem', fontWeight: '500' }}>No recipes found</div>
                      <div style={{ fontSize:'0.875rem' }}>Try adjusting your search filters</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {results.map(r => (
                        <div key={r.id}>
                          <MealCard recipe={r} compact={false} hideImage={false} darkTheme={true} onStartHighlight={(recipeWithServings) => startHighlight(recipeWithServings)} onClearHighlight={() => clearHighlight()} />
                          {typeof r.match_pct === "number" && <div style={{ fontSize:'0.75rem', color:'#a78bfa', marginTop:8 }}>Inventory match: {Math.round(r.match_pct)}%</div>}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Bottom: Weekly planner across full width */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize:'1.25rem', fontWeight:600, marginBottom: '1rem' }}>📅 Weekly Planner</h3>
                <WeekPlanner
                  plan={plan}
                  highlightedRecipe={highlightedRecipe}
                  onSlotClick={handleSlotClick}
                  onDrop={(recipe, date, mealTime) => handleDrop(recipe, date, mealTime)}
                  onRemove={(args) => handleRemove(args)}
                  dateForWeekday={(weekday) => nextDateForWeekday(weekday)}
                  plannerMode={true}
                  minimized={true}
                  darkTheme={true}
                />

                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', padding: '0.75rem', background:'rgba(139,92,246,0.05)', borderRadius: 8 }}>
                  <strong>Tip:</strong> Drag recipe cards onto the planner (desktop) or press Add then click a time slot (mobile)
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </DndProvider>
  );
}