import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 700,
  color: "#374151",
  borderBottom: "2px solid #eef2f6"
};

function parseJsonSafe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recipes`);
        const text = await res.text();
        if (!res.ok) {
          console.error("Failed to fetch recipes:", text);
          setError("Failed to load recipes");
          setRecipes([]);
        } else {
          const data = parseJsonSafe(text) || [];
          if (!Array.isArray(data)) {
            setRecipes([]);
            setError("Invalid response from server");
          } else {
            const normalized = data.map(r => ({
              id: r.id,
              name: r.name ?? "(no name)",
              image: r.image ?? null,
              calories: typeof r.calories === "number" ? r.calories : Number(r.calories) || 0,
              protein: typeof r.protein === "number" ? r.protein : Number(r.protein) || 0,
              carbs: typeof r.carbs === "number" ? r.carbs : Number(r.carbs) || 0,
              fat: typeof r.fat === "number" ? r.fat : Number(r.fat) || 0,
              base_servings: Number(r.base_servings) || 1
            }));

            if (!cancelled) setRecipes(normalized);
          }
        }
      } catch (err) {
        console.error("Error loading recipes", err);
        if (!cancelled) {
          setError("Failed to load recipes");
          setRecipes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  //Show toast on first load only
  useEffect(() => {
    toast.info("Click on a recipe to view full page", { autoClose: 4500 });
  }, []);

  const toPerServing = (value, baseServings) => {
    const bs = Number(baseServings) || 1;
    const per = (Number(value) || 0) / bs;
    return Math.round(per);
  };

  //Search by name (cade-insensitive)
  const filtered = useMemo(() => {
    if (!search || !search.trim()) return recipes;
    const q = search.trim().toLowerCase();
    return recipes.filter(r => (r.name || "").toLowerCase().includes(q));
  }, [recipes, search]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading recipes…</div>;
  }

  if (error) {
    return <div style={{ padding: 20, color: "crimson" }}>{error}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <ToastContainer position="top-right" />
      <h1 style={{ marginBottom: 12 }}>All Recipes</h1>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th colSpan={6} style={{ padding: 10, textAlign: "left", background: "#fafafa", borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 720 }}>
                  <input
                    type="search"
                    placeholder="Search recipes by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 14
                    }}
                    aria-label="Search recipes"
                  />
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    Clear
                  </button>

                  <div style={{ marginLeft: "auto", color: "#6b7280", fontSize: 13 }}>
                    Showing {filtered.length} / {recipes.length}
                  </div>
                </div>
              </th>
            </tr>
            <tr>
              <th style={thStyle}>Info</th>
              <th style={thStyle}>Nutrition</th>
            </tr>
            <tr>
              <th style={thStyle}>Image</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Calories (per serving)</th>
              <th style={thStyle}>Carbs (g)</th>
              <th style={thStyle}>Protein (g)</th>
              <th style={thStyle}>Fat (g)</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "#6b7280" }}>No recipes match your search.</td>
              </tr>
            ) : filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/recipe/${r.id}`)}
                style={{ cursor: "pointer", borderBottom: "1px solid #e6e9ee" }}
                title={`Open ${r.name}`}
              >
                <td style={{ padding: 8, width: 120 }}>
                  {r.image ? (
                    <img src={r.image} alt={r.name} style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 100, height: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", borderRadius: 6, color: "#64748b" }}>
                      No image
                    </div>
                  )}
                </td>
                <td style={{ padding: 12 }}>{r.name}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{toPerServing(r.calories, r.base_servings)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{toPerServing(r.carbs, r.base_servings)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{toPerServing(r.protein, r.base_servings)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{toPerServing(r.fat, r.base_servings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}