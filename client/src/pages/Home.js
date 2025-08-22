//work in progress
import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Copy, 
  Trash2, 
  Moon, 
  Sun, 
  Info, 
  CheckCircle,
  ShoppingCart,
  BarChart3,
  LogOut,
  Settings,
  Sparkles
} from "lucide-react";

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#f8fafc'
  },
  sidebar: {
    width: '280px',
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  logo: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.125rem',
    fontWeight: 'bold'
  },
  brandText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0
  },
  brandSub: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    color: '#94a3b8',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    fontSize: '0.875rem'
  },
  navItemActive: {
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    borderLeft: '3px solid #8b5cf6'
  },
  navItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f8fafc',
    margin: '0 0 0.5rem 0'
  },
  cardContent: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  toggle: {
    width: '2.75rem',
    height: '1.5rem',
    background: '#475569',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s'
  },
  toggleActive: {
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)'
  },
  toggleSwitch: {
    width: '1.25rem',
    height: '1.25rem',
    background: 'white',
    borderRadius: '50%',
    position: 'absolute',
    top: '0.125rem',
    transition: 'transform 0.2s'
  },
  main: {
    flex: 1,
    padding: '2rem',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem'
  },
  headerTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    margin: 0
  },
  headerSub: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: '0.25rem 0 0 0'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  input: {
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '0.5rem',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  buttonPrimary: {
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    color: 'white'
  },
  buttonGhost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.2)'
  },
  buttonIcon: {
    padding: '0.5rem',
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa'
  },
  grid: {
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: '1fr 1fr'
  },
  section: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  sectionHeader: {
    padding: '1.5rem',
    background: 'rgba(139, 92, 246, 0.1)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#f8fafc',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  sectionBody: {
    padding: '1.5rem'
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    color: '#e2e8f0'
  },
  tag: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    marginRight: '0.25rem'
  },
  mealRow: {
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  addForm: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.5fr auto',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  totals: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    background: 'rgba(34, 197, 94, 0.1)',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: '0 0 1rem 1rem'
  },
  totalBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(34, 197, 94, 0.2)',
    borderRadius: '9999px',
    color: '#4ade80',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  tooltip: {
    position: 'relative',
    cursor: 'help'
  },
  tooltipContent: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#f8fafc',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    marginBottom: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  dateSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  dateInput: {
    padding: '0.5rem 0.75rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '0.5rem',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none'
  }
};

// Tooltip component
function Tooltip({ children, content, show }) {
  return (
    <div style={styles.tooltip}>
      {children}
      {show && (
        <div style={styles.tooltipContent}>
          {content}
        </div>
      )}
    </div>
  );
}

// Home.js
function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  return (
    <button 
      onClick={handleLogout} 
      style={{...styles.button, ...styles.buttonGhost}}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(239, 68, 68, 0.1)';
        e.target.style.color = '#f87171';
        e.target.style.borderColor = '#f87171';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'transparent';
        e.target.style.color = '#94a3b8';
        e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      }}
    >
      <LogOut style={{width: '1rem', height: '1rem'}} />
      Log Out
    </button>
  );
}

const recommendedMeals = [
  { name:'Grilled Chicken Bowl', calories:520, protein:42, tags:['high‑protein'], allergens:['gluten'] },
  { name:'Tofu Stir‑Fry', calories:430, protein:28, tags:['vegan'], allergens:['soy'] },
  { name:'Salmon & Quinoa', calories:610, protein:39, tags:['omega‑3'], allergens:['fish'] },
  { name:'Greek Yogurt Parfait', calories:280, protein:20, tags:['breakfast'], allergens:['dairy','nuts'] },
  { name:'Turkey Wrap', calories:450, protein:32, tags:['on‑the‑go'], allergens:['gluten'] },
  { name:'Egg White Omelette', calories:300, protein:24, tags:['breakfast'], allergens:['eggs','dairy'] },
  { name:'Lentil & Veggie Bowl', calories:480, protein:25, tags:['vegetarian','fiber'], allergens:[] },
  { name:'Shrimp Taco Trio', calories:540, protein:35, tags:['fun'], allergens:['shellfish','gluten'] },
  { name:'Cottage Cheese & Fruit', calories:220, protein:22, tags:['snack'], allergens:['dairy'] },
  { name:'Beef & Broccoli', calories:590, protein:45, tags:['classic'], allergens:['soy'] },
  { name:'Chickpea Salad', calories:360, protein:18, tags:['vegetarian'], allergens:[] },
  { name:'Protein Smoothie', calories:310, protein:30, tags:['post‑workout'], allergens:['dairy'] },
];

const allergenOptions = [
  "gluten", "dairy", "nuts", "eggs", "soy", "shellfish"
];

function formatPretty(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function getPlanKey(date) {
  return `plan:${date}`;
}

function readPlan(date) {
  return JSON.parse(localStorage.getItem(getPlanKey(date)) || "[]");
}

function writePlan(date, items) {
  localStorage.setItem(getPlanKey(date), JSON.stringify(items));
}

export default function Home() {
  // Theme
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Date
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem("selectedDate") || todayStr);
  useEffect(() => {
    localStorage.setItem("selectedDate", selectedDate);
  }, [selectedDate]);

  // Plan
  const [plan, setPlan] = useState(() => readPlan(selectedDate));
  useEffect(() => {
    setPlan(readPlan(selectedDate));
  }, [selectedDate]);
  useEffect(() => {
    writePlan(selectedDate, plan);
  }, [plan, selectedDate]);

  // Filters
  const [filter, setFilter] = useState({ search: "", maxCal: "", minPro: "", allergen: "" });

  // Add meal form
  const mealNameRef = useRef();
  const [addForm, setAddForm] = useState({ name: "", calories: "", protein: "", allergens: "" });

  // Tooltips
  const [showTooltips, setShowTooltips] = useState({});

  // Filtered recommended
  const filteredMeals = recommendedMeals.filter(m => {
    const q = filter.search.trim().toLowerCase();
    const maxCal = parseInt(filter.maxCal, 10) || Infinity;
    const minPro = parseInt(filter.minPro, 10) || 0;
    const allerg = filter.allergen;
    return (
      m.calories <= maxCal &&
      m.protein >= minPro &&
      (!allerg || !m.allergens.includes(allerg)) &&
      (!q || m.name.toLowerCase().includes(q) || m.tags.join(" ").toLowerCase().includes(q))
    );
  });

  // Totals
  const totalCal = plan.reduce((a, m) => a + Number(m.calories || 0), 0);
  const totalPro = plan.reduce((a, m) => a + Number(m.protein || 0), 0);

  // Handlers
  function handleAddToPlan(item) {
    setPlan([...plan, item]);
  }
  function handleRemoveFromPlan(idx) {
    setPlan(plan.filter((_, i) => i !== idx));
  }
  function handleAddFormSubmit(e) {
    e.preventDefault();
    const { name, calories, protein, allergens } = addForm;
    if (!name.trim() || calories < 0 || protein < 0) return;
    handleAddToPlan({
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein),
      allergens: allergens.split(",").map(s => s.trim()).filter(Boolean)
    });
    setAddForm({ name: "", calories: "", protein: "", allergens: "" });
    mealNameRef.current && mealNameRef.current.focus();
  }
  function handleClearDay() {
    setPlan([]);
  }
  function handleCopyPlan() {
    const lines = plan.map(m =>
      `• ${m.name} — ${m.calories} cal, ${m.protein} g protein${m.allergens?.length ? ` (allergens: ${m.allergens.join(", ")})` : ""}`
    );
    const text = `Plan for ${formatPretty(selectedDate)}\n${"-".repeat(18)}\n` +
      lines.join("\n") +
      (lines.length ? `\n\nTotal: ${totalCal} cal, ${totalPro} g protein` : "No meals planned");
    navigator.clipboard.writeText(text);
  }

  const toggleTooltip = (key) => {
    setShowTooltips(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logo}>MP</div>
          <div>
            <div style={styles.brandText}>Meal Planner</div>
            <div style={styles.brandSub}>Stay on track, effortlessly</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <button style={{...styles.navItem, ...styles.navItemActive}}>
            <Calendar style={{width: '1rem', height: '1rem'}} />
            Planner
          </button>
          <button style={{...styles.navItem, ...styles.navItemDisabled}}>
            <ShoppingCart style={{width: '1rem', height: '1rem'}} />
            Groceries (soon)
          </button>
          <button style={{...styles.navItem, ...styles.navItemDisabled}}>
            <BarChart3 style={{width: '1rem', height: '1rem'}} />
            Stats (soon)
          </button>
          <button style={styles.navItem}>
            <Settings style={{width: '1rem', height: '1rem'}} />
            Settings
          </button>
        </nav>

        <div style={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
            <div>
              <div style={styles.cardTitle}>Appearance</div>
              <div style={styles.cardContent}>Dark/Light mode</div>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              style={{
                ...styles.toggle,
                ...(dark ? styles.toggleActive : {})
              }}
            >
              <div style={{
                ...styles.toggleSwitch,
                transform: dark ? 'translateX(1.5rem)' : 'translateX(0.125rem)'
              }}>
                {dark ? <Moon style={{width: '0.75rem', height: '0.75rem', color: '#8b5cf6'}} /> : <Sun style={{width: '0.75rem', height: '0.75rem', color: '#f59e0b'}} />}
              </div>
            </button>
          </div>
          
          <div style={styles.dateSection}>
            <label style={{...styles.cardTitle, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Calendar style={{width: '1rem', height: '1rem'}} />
              Plan for date
            </label>
            <input
              type="date"
              style={styles.dateInput}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>💡 Tips</div>
          <div style={styles.cardContent}>
            • Click any recommended meal to add it to your day<br />
            • Use filters to find meals that match your goals<br />
            • Your plans are automatically saved
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Meal Planning Dashboard</h1>
            <p style={styles.headerSub}>Plan your meals for {formatPretty(selectedDate)}</p>
          </div>
          <div style={styles.headerActions}>
            <LogoutButton />
          </div>
        </div>

        <div style={styles.grid}>
          {/* Recommended Meals */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <Sparkles style={{width: '1.25rem', height: '1.25rem', color: '#a78bfa'}} />
                Recommended Meals
                <Tooltip 
                  content="Click any meal to add it to your daily plan. Use filters to find exactly what you need!"
                  show={showTooltips.recommended}
                >
                  <button 
                    style={{...styles.button, ...styles.buttonIcon, padding: '0.25rem'}}
                    onClick={() => toggleTooltip('recommended')}
                  >
                    <Info style={{width: '0.875rem', height: '0.875rem'}} />
                  </button>
                </Tooltip>
              </h2>
              <button 
                style={{...styles.button, ...styles.buttonGhost}}
                onClick={() => setFilter({ search: "", maxCal: "", minPro: "", allergen: "" })}
              >
                Reset Filters
              </button>
            </div>
            <div style={styles.sectionBody}>
              <div style={styles.filters}>
                <div style={{position: 'relative'}}>
                  <input 
                    style={{...styles.input, paddingLeft: '2.5rem'}}
                    placeholder="Search meals..."
                    value={filter.search}
                    onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                  />
                  <Search style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#94a3b8'
                  }} />
                </div>
                <input 
                  style={styles.input}
                  type="number" 
                  min="0" 
                  placeholder="Max Calories" 
                  value={filter.maxCal}
                  onChange={e => setFilter(f => ({ ...f, maxCal: e.target.value }))}
                />
                <input 
                  style={styles.input}
                  type="number" 
                  min="0" 
                  placeholder="Min Protein (g)" 
                  value={filter.minPro}
                  onChange={e => setFilter(f => ({ ...f, minPro: e.target.value }))}
                />
                <select 
                  style={styles.input}
                  value={filter.allergen}
                  onChange={e => setFilter(f => ({ ...f, allergen: e.target.value }))}
                >
                  <option value="">Exclude Allergen...</option>
                  {allergenOptions.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
                </select>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Meal</th>
                    <th style={styles.th}>Calories</th>
                    <th style={styles.th}>Protein</th>
                    <th style={styles.th}>Tags</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeals.length === 0 ? (
                    <tr>
                      <td style={{...styles.td, textAlign: 'center', color: '#94a3b8'}} colSpan={5}>
                        No meals match your filters
                      </td>
                    </tr>
                  ) : filteredMeals.map((m, i) => (
                    <tr 
                      key={i} 
                      style={styles.mealRow}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => handleAddToPlan({ name: m.name, calories: m.calories, protein: m.protein, allergens: m.allergens })}
                    >
                      <td style={styles.td}>{m.name}</td>
                      <td style={styles.td}>{m.calories}</td>
                      <td style={styles.td}>{m.protein}g</td>
                      <td style={styles.td}>
                        {m.tags.map(t => <span key={t} style={styles.tag}>{t}</span>)}
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={{...styles.button, ...styles.buttonIcon}}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPlan({ name: m.name, calories: m.calories, protein: m.protein, allergens: m.allergens });
                          }}
                        >
                          <Plus style={{width: '1rem', height: '1rem'}} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Your Plan */}
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <Calendar style={{width: '1.25rem', height: '1.25rem', color: '#4ade80'}} />
                Your Daily Plan
                <Tooltip 
                  content="Add meals manually or click from recommendations. Remove meals with the X button."
                  show={showTooltips.plan}
                >
                  <button 
                    style={{...styles.button, ...styles.buttonIcon, padding: '0.25rem'}}
                    onClick={() => toggleTooltip('plan')}
                  >
                    <Info style={{width: '0.875rem', height: '0.875rem'}} />
                  </button>
                </Tooltip>
              </h2>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <Tooltip 
                  content="Copy your meal plan as formatted text to share or save"
                  show={showTooltips.copy}
                >
                  <button 
                    style={{...styles.button, ...styles.buttonGhost}}
                    onClick={handleCopyPlan}
                    onMouseEnter={() => setShowTooltips(prev => ({...prev, copy: true}))}
                    onMouseLeave={() => setShowTooltips(prev => ({...prev, copy: false}))}
                  >
                    <Copy style={{width: '1rem', height: '1rem'}} />
                    Copy
                  </button>
                </Tooltip>
                <button 
                  style={{...styles.button, ...styles.buttonGhost}}
                  onClick={handleClearDay}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.color = '#f87171';
                    e.target.style.borderColor = '#f87171';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#94a3b8';
                    e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  }}
                >
                  <Trash2 style={{width: '1rem', height: '1rem'}} />
                  Clear
                </button>
              </div>
            </div>
            <div style={styles.sectionBody}>
              <form onSubmit={handleAddFormSubmit} style={styles.addForm}>
                <input 
                  required
                  ref={mealNameRef}
                  style={styles.input}
                  placeholder="Meal name"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                />
                <input 
                  required
                  type="number" 
                  min="0"
                  style={styles.input}
                  placeholder="Calories"
                  value={addForm.calories}
                  onChange={e => setAddForm(f => ({ ...f, calories: e.target.value }))}
                />
                <input 
                  required
                  type="number" 
                  min="0"
                  style={styles.input}
                  placeholder="Protein (g)"
                  value={addForm.protein}
                  onChange={e => setAddForm(f => ({ ...f, protein: e.target.value }))}
                />
                <input 
                  style={styles.input}
                  placeholder="Allergens (comma-separated)"
                  value={addForm.allergens}
                  onChange={e => setAddForm(f => ({ ...f, allergens: e.target.value }))}
                />
                <button type="submit" style={{...styles.button, ...styles.buttonPrimary}}>
                  <Plus style={{width: '1rem', height: '1rem'}} />
                  Add
                </button>
              </form>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Meal</th>
                    <th style={styles.th}>Calories</th>
                    <th style={styles.th}>Protein</th>
                    <th style={styles.th}>Allergens</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((m, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{m.name}</td>
                      <td style={styles.td}>{m.calories}</td>
                      <td style={styles.td}>{m.protein}g</td>
                      <td style={styles.td}>{(m.allergens || []).join(", ")}</td>
                      <td style={styles.td}>
                        <button 
                          style={{...styles.button, ...styles.buttonIcon, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171'}}
                          onClick={() => handleRemoveFromPlan(i)}
                        >
                          <X style={{width: '1rem', height: '1rem'}} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(totalCal > 0 || totalPro > 0) && (
              <div style={styles.totals}>
                <div style={styles.totalBadge}>
                  <span style={{fontWeight: 'bold'}}>{totalCal}</span>
                  <span>calories</span>
                </div>
                <div style={styles.totalBadge}>
                  <span style={{fontWeight: 'bold'}}>{totalPro}g</span>
                  <span>protein</span>
                </div>
                <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontSize: '0.875rem'}}>
                  <CheckCircle style={{width: '1rem', height: '1rem'}} />
                  Autosaved
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}