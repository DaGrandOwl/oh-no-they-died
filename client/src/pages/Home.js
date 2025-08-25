// work in progress
import styles from "../components/home.module.css";
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

// Tooltip component
function Tooltip({ children, content, show }) {
  return (
    <div className={styles.tooltip}>
      {children}
      {show && (
        <div className={styles.tooltipContent}>
          {content}
        </div>
      )}
    </div>
  );
}

// Logout button
function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  return (
    <button 
      onClick={handleLogout} 
      className={`${styles.navItem} ${styles.navItemActive}`}
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
    <div className={styles.app}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}>MP</div>
          <div>
            <div className={styles.brandText}>Meal Planner</div>
            <div className={styles.brandSub}>Stay on track, effortlessly</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={`${styles.navItem} ${styles.navItemActive}`}>
            <Calendar style={{width: '1rem', height: '1rem'}} />
            Planner
          </button>
          <button className={`${styles.navItem} ${styles.navItemDisabled}`}>
            <ShoppingCart style={{width: '1rem', height: '1rem'}} />
            Groceries (soon)
          </button>
          <button className={`${styles.navItem} ${styles.navItemDisabled}`}>
            <BarChart3 style={{width: '1rem', height: '1rem'}} />
            Stats (soon)
          </button>
          <button className={styles.navItem}>
            <Settings style={{width: '1rem', height: '1rem'}} />
            Settings
          </button>
        </nav>

        <div className={styles.card}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
            <div>
              <div className={styles.cardTitle}>Appearance</div>
              <div className={styles.cardContent}>Dark/Light mode</div>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              className={`${styles.toggle} ${dark ? styles.toggleActive : ''}`}
            >
              <div className={styles.toggleSwitch}
                style={{ transform: dark ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }}>
                {dark ? <Moon style={{width: '0.75rem', height: '0.75rem', color: '#8b5cf6'}} /> 
                       : <Sun style={{width: '0.75rem', height: '0.75rem', color: '#f59e0b'}} />}
              </div>
            </button>
          </div>
          
          <div className={styles.dateSection}>
            <label className={`${styles.cardTitle}`} style={{margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Calendar style={{width: '1rem', height: '1rem'}} />
              Plan for date
            </label>
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>💡 Tips</div>
          <div className={styles.cardContent}>
            • Click any recommended meal to add it to your day<br />
            • Use filters to find meals that match your goals<br />
            • Your plans are automatically saved
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Meal Planning Dashboard</h1>
            <p className={styles.headerSub}>Plan your meals for {formatPretty(selectedDate)}</p>
          </div>
          <div className={styles.headerActions}>
            <LogoutButton />
          </div>
        </div>

        <div className={styles.grid}>
          {/* Recommended Meals */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Sparkles style={{width: '1.25rem', height: '1.25rem', color: '#a78bfa'}} />
                Recommended Meals
                <Tooltip 
                  content="Click any meal to add it to your daily plan. Use filters to find exactly what you need!"
                  show={showTooltips.recommended}
                >
                  <button 
                    className={`${styles.button} ${styles.buttonIcon}`} style={{padding: '0.25rem'}}
                    onClick={() => toggleTooltip('recommended')}
                  >
                    <Info style={{width: '0.875rem', height: '0.875rem'}} />
                  </button>
                </Tooltip>
              </h2>
              <button 
                className={`${styles.button} ${styles.buttonGhost}`}
                onClick={() => setFilter({ search: "", maxCal: "", minPro: "", allergen: "" })}
              >
                Reset Filters
              </button>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.filters}>
                <div style={{position: 'relative'}}>
                  <input 
                    className={`${styles.input}`}
                    style={{paddingLeft: '2.5rem'}}
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
                  className={styles.input}
                  type="number" 
                  min="0" 
                  placeholder="Max Calories" 
                  value={filter.maxCal}
                  onChange={e => setFilter(f => ({ ...f, maxCal: e.target.value }))}
                />
                <input 
                  className={styles.input}
                  type="number" 
                  min="0" 
                  placeholder="Min Protein (g)" 
                  value={filter.minPro}
                  onChange={e => setFilter(f => ({ ...f, minPro: e.target.value }))}
                />
                <select 
                  className={styles.input}
                  value={filter.allergen}
                  onChange={e => setFilter(f => ({ ...f, allergen: e.target.value }))}
                >
                  <option value="">Exclude Allergen...</option>
                  {allergenOptions.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
                </select>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Meal</th>
                    <th className={styles.th}>Calories</th>
                    <th className={styles.th}>Protein</th>
                    <th className={styles.th}>Tags</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeals.length === 0 ? (
                    <tr>
                      <td className={`${styles.td}`} style={{ textAlign: 'center', color: '#94a3b8'}} colSpan={5}>
                        No meals match your filters
                      </td>
                    </tr>
                  ) : filteredMeals.map((m, i) => (
                    <tr 
                      key={i} 
                      className={styles.mealRow}
                      onClick={() => handleAddToPlan({ name: m.name, calories: m.calories, protein: m.protein, allergens: m.allergens })}
                    >
                      <td className={styles.td}>{m.name}</td>
                      <td className={styles.td}>{m.calories}</td>
                      <td className={styles.td}>{m.protein}g</td>
                      <td className={styles.td}>
                        {m.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                      </td>
                      <td className={styles.td}>
                        <button 
                          className={`${styles.button} ${styles.buttonIcon}`}
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
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Calendar style={{width: '1.25rem', height: '1.25rem', color: '#4ade80'}} />
                Your Daily Plan
                <Tooltip 
                  content="Add meals manually or click from recommendations. Remove meals with the X button."
                  show={showTooltips.plan}
                >
                  <button className={`${styles.button} ${styles.buttonIcon}`}
                    style={{padding: '0.25rem'}}
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
                    className={`${styles.button} ${styles.buttonGhost}`}
                    onClick={handleCopyPlan}
                  >
                    <Copy style={{width: '1rem', height: '1rem'}} />
                    Copy
                  </button>
                </Tooltip>
                <button 
                  className={`${styles.button} ${styles.buttonGhost}`}
                  onClick={handleClearDay}
                >
                  <Trash2 style={{width: '1rem', height: '1rem'}} />
                  Clear
                </button>
              </div>
            </div>
            <div className={styles.sectionBody}>
              <form onSubmit={handleAddFormSubmit} className={styles.addForm}>
                <input 
                  required
                  ref={mealNameRef}
                  className={styles.input}
                  placeholder="Meal name"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                />
                <input 
                  required
                  type="number" 
                  min="0"
                  className={styles.input}
                  placeholder="Calories"
                  value={addForm.calories}
                  onChange={e => setAddForm(f => ({ ...f, calories: e.target.value }))}
                />
                <input 
                  required
                  type="number" 
                  min="0"
                  className={styles.input}
                  placeholder="Protein (g)"
                  value={addForm.protein}
                  onChange={e => setAddForm(f => ({ ...f, protein: e.target.value }))}
                />
                <input 
                  className={styles.input}
                  placeholder="Allergens (comma-separated)"
                  value={addForm.allergens}
                  onChange={e => setAddForm(f => ({ ...f, allergens: e.target.value }))}
                />
                <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
                  <Plus style={{width: '1rem', height: '1rem'}} />
                  Add
                </button>
              </form>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Meal</th>
                    <th className={styles.th}>Calories</th>
                    <th className={styles.th}>Protein</th>
                    <th className={styles.th}>Allergens</th>
                    <th className={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((m, i) => (
                    <tr key={i}>
                      <td className={styles.td}>{m.name}</td>
                      <td className={styles.td}>{m.calories}</td>
                      <td className={styles.td}>{m.protein}g</td>
                      <td className={styles.td}>{(m.allergens || []).join(", ")}</td>
                      <td className={styles.td}>
                        <button className={`${styles.button} ${styles.buttonIcon} ${styles.removeButton}`}
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
              <div className={styles.totals}>
                <div className={styles.totalBadge}>
                  <span style={{fontWeight: 'bold'}}>{totalCal}</span>
                  <span>calories</span>
                </div>
                <div className={styles.totalBadge}>
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