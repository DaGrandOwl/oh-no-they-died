import React, { useState, useEffect, useRef } from "react";
import "../components/Home.css"; // Move your CSS into this file

// Home.js
function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem('token'); // remove JWT
    window.location.href = '/login';  // redirect to login
  };
  return <button onClick={handleLogout}>Log Out</button>;
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

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" aria-hidden="true"></div>
          <div>
            <div style={{ fontSize: 18 }}>Meal Planner</div>
            <div className="small">Stay on track, effortlessly</div>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          <a href="#planner" className="active">📅 Planner</a>
          <a href="#groceries" aria-disabled="true" style={{ opacity: .6, pointerEvents: "none" }}>🛒 Groceries (soon)</a>
          <a href="#stats" aria-disabled="true" style={{ opacity: .6, pointerEvents: "none" }}>📈 Stats (soon)</a>
        </nav>
        <div className="card" role="region" aria-label="Preferences">
          <div className="row" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700 }}>Appearance</div>
              <div className="small">Dark/Light mode</div>
            </div>
            <button
              className="toggle"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
              onClick={() => setDark(d => !d)}
            ></button>
          </div>
          <div className="row">
            <label htmlFor="dayPicker" className="small" style={{ fontWeight: 700 }}>Plan for date</label>
            <input
              id="dayPicker"
              type="date"
              className="input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Tips</div>
          <div className="small">
            • Click a recommended meal to add it to your day.<br />
            • Use filters to find high‑protein, lower calorie options.<br />
            • Your plan & theme are saved automatically.
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main" id="planner">
        <div className="cards">
      <p><LogoutButton /></p>
          {/* Recommended */}
          <section className="card" aria-labelledby="recTitle">
            <div className="card-header">
              <div>
                <div className="card-title" id="recTitle">Recommended Meals</div>
                <div className="card-sub">Filter by calories, protein, and allergens; click to add to your day.</div>
              </div>
              <button className="btn ghost" onClick={() => setFilter({ search: "", maxCal: "", minPro: "", allergen: "" })}>Reset</button>
            </div>
            <div className="card-body">
              <div className="controls" role="group" aria-label="Filters">
                <input className="input" placeholder="Search meals (e.g., bowl, chicken)" value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
                <input className="input" type="number" min="0" placeholder="Max Calories" value={filter.maxCal} onChange={e => setFilter(f => ({ ...f, maxCal: e.target.value }))} />
                <input className="input" type="number" min="0" placeholder="Min Protein (g)" value={filter.minPro} onChange={e => setFilter(f => ({ ...f, minPro: e.target.value }))} />
                <select className="input" value={filter.allergen} onChange={e => setFilter(f => ({ ...f, allergen: e.target.value }))}>
                  <option value="">Exclude Allergen…</option>
                  {allergenOptions.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
                </select>
              </div>
              <table aria-describedby="recTitle">
                <thead>
                  <tr>
                    <th>Meal</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Tags</th>
                    <th style={{ width: "1%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="small">No meals match your filters.</td>
                    </tr>
                  ) : filteredMeals.map((m, i) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td>{m.calories}</td>
                      <td>{m.protein} g</td>
                      <td>{m.tags.map(t => <span key={t} className="tag">{t}</span>)}</td>
                      <td>
                        <button className="btn icon" title="Add" onClick={() => handleAddToPlan({ name: m.name, calories: m.calories, protein: m.protein, allergens: m.allergens })}>＋</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Your Plan */}
          <section className="card" aria-labelledby="planTitle">
            <div className="card-header">
              <div>
                <div className="card-title" id="planTitle">Your Plan for <span>{formatPretty(selectedDate)}</span></div>
                <div className="card-sub">Add meals manually or from recommendations. Remove with the × button.</div>
              </div>
              <div className="flex">
                <button className="btn ghost" title="Copy plan as text" onClick={handleCopyPlan}>Copy as text</button>
                <button className="btn" style={{ border: "1px solid var(--border)" }} title="Clear all meals" onClick={handleClearDay}>Clear</button>
              </div>
            </div>
            <div className="card-body">
              <form className="flex" aria-label="Add meal manually" style={{ marginBottom: 10, flexWrap: "wrap" }} onSubmit={handleAddFormSubmit}>
                <input required ref={mealNameRef} className="input" placeholder="Meal name" style={{ minWidth: 180, flex: 2 }} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                <input required type="number" min="0" className="input" placeholder="Calories" style={{ flex: 1 }} value={addForm.calories} onChange={e => setAddForm(f => ({ ...f, calories: e.target.value }))} />
                <input required type="number" min="0" className="input" placeholder="Protein (g)" style={{ flex: 1 }} value={addForm.protein} onChange={e => setAddForm(f => ({ ...f, protein: e.target.value }))} />
                <input className="input" placeholder="Allergens (comma‑separated)" style={{ flex: 2 }} value={addForm.allergens} onChange={e => setAddForm(f => ({ ...f, allergens: e.target.value }))} />
                <button className="btn primary" style={{ flex: "0 0 auto" }}>Add</button>
              </form>
              <table>
                <thead>
                  <tr>
                    <th>Meal</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Allergens</th>
                    <th style={{ width: "1%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((m, i) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td>{m.calories}</td>
                      <td>{m.protein} g</td>
                      <td>{(m.allergens || []).join(", ")}</td>
                      <td>
                        <button className="btn icon" title="Remove" style={{ border: "1px solid var(--border)" }} onClick={() => handleRemoveFromPlan(i)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th>{totalCal}</th>
                    <th>{totalPro} g</th>
                    <th></th>
                    <th></th>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="ribbon" role="status">
              <span className="pill"><strong>{totalCal}</strong>&nbsp;cal</span>
              <span className="pill"><strong>{totalPro}</strong>&nbsp;g protein</span>
              <div className="space"></div>
              <span className="small">Autosaved ✓</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
