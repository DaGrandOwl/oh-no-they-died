import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { Search, X, Utensils, Zap, Wheat, Dumbbell, Droplet } from "lucide-react";
import { cardStyle, buttonIcon, inputStyle } from "../components/Styles";
import "react-toastify/dist/ReactToastify.css";


const styles = {
  container: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    minHeight: '100vh',
    padding: '2rem',
    color: '#f8fafc'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1.125rem',
    margin: 0
  },
  searchCard: {
    ...cardStyle,
    padding: '1.5rem',
    marginBottom: '2rem'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  searchInputContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '500px'
  },
  searchInput: {
    ...inputStyle,
    width: '100%',
    paddingLeft: '3rem',
    fontSize: '1rem',
    borderRadius: '0.75rem',
    boxSizing: 'border-box'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    pointerEvents: 'none'
  },
  clearButton: {
    ...buttonIcon,
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  resultInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#94a3b8',
    fontSize: '0.875rem'
  },
  tableContainer: {
    ...cardStyle,
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.1))',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  categoryHeader: {
    padding: '1.5rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#a78bfa',
    textAlign: 'center',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  columnHeader: {
    padding: '1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'left',
    borderRight: '1px solid rgba(148, 163, 184, 0.1)'
  },
  row: {
    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  cell: {
    padding: '1rem',
    borderRight: '1px solid rgba(148, 163, 184, 0.05)',
    color: '#e2e8f0',
    verticalAlign: 'middle'
  },
  imageCell: {
    padding: '0.75rem',
    width: '120px'
  },
  recipeImage: {
    width: '100px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    border: '1px solid rgba(148, 163, 184, 0.1)'
  },
  noImage: {
    width: '100px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '0.5rem',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    color: '#a78bfa'
  },
  recipeName: {
    fontWeight: '500',
    fontSize: '1rem'
  },
  nutritionValue: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: '0.875rem'
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#94a3b8'
  },
  loadingState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem'
  },
  errorState: {
    padding: '3rem',
    textAlign: 'center',
    color: '#f87171',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '0.75rem',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  }
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

  // Show toast on first load only
  useEffect(() => {
    toast.info("Click on a recipe to view full page", { 
      autoClose: 4500,
      style: {
        background: 'rgba(30, 41, 59, 0.95)',
        color: '#f8fafc',
        border: '1px solid rgba(148, 163, 184, 0.2)'
      }
    });
  }, []);

  const toPerServing = (value, baseServings) => {
    const bs = Number(baseServings) || 1;
    const per = (Number(value) || 0) / bs;
    return Math.round(per);
  };

  // Search by name (case-insensitive)
  const filtered = useMemo(() => {
    if (!search || !search.trim()) return recipes;
    const q = search.trim().toLowerCase();
    return recipes.filter(r => (r.name || "").toLowerCase().includes(q));
  }, [recipes, search]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <Utensils style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
          Loading recipes…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" />
      
      <div style={styles.header}>
        <h1 style={styles.title}>
          <Utensils style={{ width: '2.5rem', height: '2.5rem', color: '#8b5cf6' }} />
          Recipe Collection
        </h1>
        <p style={styles.subtitle}>Discover and explore our catalog of culinary creations</p>
      </div>

      <div style={styles.searchCard}>
        <div style={styles.searchContainer}>
          <div style={styles.searchInputContainer}>
            <Search style={{ ...styles.searchIcon, width: '1.25rem', height: '1.25rem' }} />
            <input
              type="search"
              placeholder="Search recipes by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              aria-label="Search recipes"
            />
          </div>
          <button
            onClick={() => setSearch("")}
            style={styles.clearButton}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
            Clear
          </button>
        </div>
        
        <div style={styles.resultInfo}>
          <Utensils style={{ width: '1rem', height: '1rem' }} />
          Showing {filtered.length} of {recipes.length} recipes
        </div>
      </div>

      <div style={styles.tableContainer}>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.categoryHeader} colSpan={2}>Recipe Info</th>
                <th style={styles.categoryHeader} colSpan={4}>Nutrition per Serving</th>
              </tr>
              <tr>
                <th style={styles.columnHeader}>Image</th>
                <th style={styles.columnHeader}>Name</th>
                <th style={{ ...styles.columnHeader, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap style={{ width: '1rem', height: '1rem', color: '#fbbf24', alignItems: 'center' }} />
                  Calories
                </th>
                <th style={styles.columnHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wheat style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                    Carbs (g)
                  </div>
                </th>
                <th style={styles.columnHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Dumbbell style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                    Protein (g)
                  </div>
                </th>
                <th style={styles.columnHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Droplet style={{ width: '1rem', height: '1rem', color: '#06b6d4' }} />
                    Fat (g)
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={styles.emptyState}>
                    <Utensils style={{ width: '3rem', height: '3rem', color: '#4b5563', marginBottom: '1rem' }} />
                    <div>No recipes match your search.</div>
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/recipe/${r.id}`)}
                  style={styles.row}
                  title={`Open ${r.name}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={styles.imageCell}>
                    {r.image ? (
                      <img src={r.image} alt={r.name} style={styles.recipeImage} />
                    ) : (
                      <div style={styles.noImage}>
                        <Utensils style={{ width: '1.5rem', height: '1.5rem' }} />
                      </div>
                    )}
                  </td>
                  <td style={{ ...styles.cell, ...styles.recipeName }}>{r.name}</td>
                  <td style={{ ...styles.cell, ...styles.nutritionValue }}>{toPerServing(r.calories, r.base_servings)}</td>
                  <td style={{ ...styles.cell, ...styles.nutritionValue }}>{toPerServing(r.carbs, r.base_servings)}</td>
                  <td style={{ ...styles.cell, ...styles.nutritionValue }}>{toPerServing(r.protein, r.base_servings)}</td>
                  <td style={{ ...styles.cell, ...styles.nutritionValue }}>{toPerServing(r.fat, r.base_servings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}