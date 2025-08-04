import React, { useState } from "react";
import logo from './logo.png';

const styles = {
  body: {
    fontFamily: "Arial, sans-serif",
    padding: 20,
    background: "#FFF4DC",
    minHeight: "100vh",
  },
  h1: {
    textAlign: "center",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  input: {
    padding: 8,
    marginRight: 10,
  },
  select: {
    padding: 8,
    marginRight: 10,
  },
  button: {
    padding: "8px 16px",
    marginRight: 10,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
  },
  th: {
    padding: 10,
    border: "1px solid #ddd",
    textAlign: "left",
    verticalAlign: "top",
    backgroundColor: "#f0f0f0",
  },
  td: {
    padding: 10,
    border: "1px solid #ddd",
    textAlign: "left",
    verticalAlign: "top",
  },
  filters: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  moveBtn: {
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    margin: 1,
  },
  deleteBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    margin: 1,
  },
  editBtn: {
    backgroundColor: "#f39c12",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    margin: 1,
  },
  saveBtn: {
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
    margin: 1,
  },
  titleHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
};

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const categories = ["Breakfast", "Lunch", "Dinner", "Snack"];

function Home() {
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    day: "",
    calories: "",
  });
  const [filters, setFilters] = useState({
    category: "",
    day: "",
    viewMode: "table",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    day: "",
    calories: "",
  });

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const addMeal = () => {
    const { name, category, day, calories } = form;
    if (
      !name.trim() ||
      !category ||
      !day ||
      calories === "" ||
      isNaN(Number(calories))
    ) {
      alert("Please complete all fields.");
      return;
    }
    setMeals([
      ...meals,
      {
        name: name.trim(),
        category,
        day,
        calories: Number(calories),
      },
    ]);
    setForm({ name: "", category: "", day: "", calories: "" });
  };

  const deleteMeal = (index) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const moveMeal = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= meals.length) return;
    const newMeals = [...meals];
    [newMeals[index], newMeals[newIndex]] = [newMeals[newIndex], newMeals[index]];
    setMeals(newMeals);
  };

  const startEditMeal = (index) => {
    setEditIndex(index);
    setEditForm({ ...meals[index], calories: meals[index].calories.toString() });
  };

  const saveMeal = (index) => {
    const { name, category, day, calories } = editForm;
    if (
      !name.trim() ||
      !category ||
      !day ||
      calories === "" ||
      isNaN(Number(calories))
    ) {
      alert("All fields required.");
      return;
    }
    const newMeals = [...meals];
    newMeals[index] = {
      name: name.trim(),
      category,
      day,
      calories: Number(calories),
    };
    setMeals(newMeals);
    setEditIndex(null);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredMeals = meals
    .map((meal, i) => ({ ...meal, index: i }))
    .filter(
      (meal) =>
        (!filters.category || meal.category === filters.category) &&
        (!filters.day || meal.day === filters.day)
    );

  // Table View
  const renderTableView = () => (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Meal</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Day</th>
          <th style={styles.th}>Calories</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredMeals.map((meal, i) =>
          editIndex === meal.index ? (
            <tr key={meal.index}>
              <td>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  style={styles.input}
                />
              </td>
              <td>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  style={styles.select}
                >
                  <option value="">Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  name="day"
                  value={editForm.day}
                  onChange={handleEditFormChange}
                  style={styles.select}
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  name="calories"
                  type="number"
                  value={editForm.calories}
                  onChange={handleEditFormChange}
                  style={styles.input}
                  min={0}
                />
              </td>
              <td>
                <button
                  style={styles.saveBtn}
                  onClick={() => saveMeal(meal.index)}
                >
                  Save
                </button>
              </td>
            </tr>
          ) : (
            <tr key={meal.index}>
              <td style={styles.td}>{meal.name}</td>
              <td style={styles.td}>{meal.category}</td>
              <td style={styles.td}>{meal.day}</td>
              <td style={styles.td}>{meal.calories} kcal</td>
              <td style={styles.td}>
                <button
                  style={styles.moveBtn}
                  onClick={() => moveMeal(meal.index, -1)}
                  title="Move up"
                >
                  ⬆
                </button>
                <button
                  style={styles.moveBtn}
                  onClick={() => moveMeal(meal.index, 1)}
                  title="Move down"
                >
                  ⬇
                </button>
                <button
                  style={styles.editBtn}
                  onClick={() => startEditMeal(meal.index)}
                >
                  Edit
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteMeal(meal.index)}
                >
                  Delete
                </button>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );

  // Calendar View
  const renderCalendarView = () => {
    const columns = Object.fromEntries(days.map((d) => [d, []]));
    filteredMeals.forEach((meal) => columns[meal.day].push(meal));
    const maxRows = Math.max(...Object.values(columns).map((c) => c.length), 0);

    return (
      <table style={styles.table}>
        <thead>
          <tr>
            {days.map((day) => (
              <th key={day} style={styles.th}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(maxRows)].map((_, rowIdx) => (
            <tr key={rowIdx}>
              {days.map((day) => {
                const meal = columns[day][rowIdx];
                if (!meal) return <td key={day} style={styles.td}></td>;
                return (
                  <td key={day} style={styles.td}>
                    <strong>{meal.name}</strong>
                    <br />
                    ({meal.category})
                    <br />
                    {meal.calories} kcal
                    <br />
                    <button
                      style={styles.moveBtn}
                      onClick={() => moveMeal(meal.index, -1)}
                      title="Move up"
                    >
                      ⬆
                    </button>
                    <button
                      style={styles.moveBtn}
                      onClick={() => moveMeal(meal.index, 1)}
                      title="Move down"
                    >
                      ⬇
                    </button>
                    <br />
                    <button
                      style={styles.editBtn}
                      onClick={() => startEditMeal(meal.index)}
                    >
                      Edit
                    </button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => deleteMeal(meal.index)}
                    >
                      Delete
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={styles.body}>
      <div style={styles.titleHeader}>
        <img src={logo} alt="Bitewise Logo" style={{ height: 180, marginBottom: 0 }} />
        <h1 style={styles.h1}>Weekly Food Planner</h1>
      </div>
      <div style={styles.container}>
        {/* Add Meal Form */}
        <div>
          <h3>Add a Meal</h3>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="Meal Name"
            style={styles.input}
          />
          <select
            name="category"
            value={form.category}
            onChange={handleFormChange}
            style={styles.select}
          >
            <option value="">Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            name="day"
            value={form.day}
            onChange={handleFormChange}
            style={styles.select}
          >
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="calories"
            value={form.calories}
            onChange={handleFormChange}
            placeholder="Calories (kcal)"
            min={0}
            style={styles.input}
          />
          <button style={styles.button} onClick={addMeal}>
            Add Meal
          </button>
        </div>
        {/* Filters and View Mode */}
        <div style={styles.filters}>
          <label>
            Filter by Category:
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filter by Day:
            <select
              name="day"
              value={filters.day}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="">All</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            View Mode:
            <select
              name="viewMode"
              value={filters.viewMode}
              onChange={handleFilterChange}
              style={styles.select}
            >
              <option value="table">Table View</option>
              <option value="calendar">Calendar View</option>
            </select>
          </label>
        </div>
        {/* Display Output */}
        <div>
          {filters.viewMode === "table"
            ? renderTableView()
            : renderCalendarView()}
        </div>
      </div>
    </div>
  );
}

export default Home;