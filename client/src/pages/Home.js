import React, { useState } from "react";
import logo from '../components/logo.png';


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

function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem('token'); // remove JWT
    window.location.href = '/login';  // redirect to login
  };
  return <button onClick={handleLogout}>Log Out</button>;
}

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
    <table className="table">
      <thead>
        <tr>
          <th className="th">Meal</th>
          <th className="th">Category</th>
          <th className="th">Day</th>
          <th className="th">Calories</th>
          <th className="th">Actions</th>
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
                  className="input"
                />
              </td>
              <td>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  className="select"
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
                  className="select"
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
                  className="input"
                  min={0}
                />
              </td>
              <td>
                <button
                  className="saveBtn"
                  onClick={() => saveMeal(meal.index)}
                >
                  Save
                </button>
              </td>
            </tr>
          ) : (
            <tr key={meal.index}>
              <td className="td">{meal.name}</td>
              <td className="td">{meal.category}</td>
              <td className="td">{meal.day}</td>
              <td className="td">{meal.calories} kcal</td>
              <td className="td">
                <button
                  className="moveBtn"
                  onClick={() => moveMeal(meal.index, -1)}
                  title="Move up"
                >
                  ⬆
                </button>
                <button
                  className="moveBtn"
                  onClick={() => moveMeal(meal.index, 1)}
                  title="Move down"
                >
                  ⬇
                </button>
                <button
                  className="editBtn"
                  onClick={() => startEditMeal(meal.index)}
                >
                  Edit
                </button>
                <button
                  className="deleteBtn"
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
      <table className="table">
        <thead>
          <tr>
            {days.map((day) => (
              <th key={day} className="th">
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
                if (!meal) return <td key={day} className="td"></td>;
                return (
                  <td key={day} className="td">
                    <strong>{meal.name}</strong>
                    <br />
                    ({meal.category})
                    <br />
                    {meal.calories} kcal
                    <br />
                    <button
                      className="moveBtn"
                      onClick={() => moveMeal(meal.index, -1)}
                      title="Move up"
                    >
                      ⬆
                    </button>
                    <button
                      className="moveBtn"
                      onClick={() => moveMeal(meal.index, 1)}
                      title="Move down"
                    >
                      ⬇
                    </button>
                    <br />
                    <button
                      className="editBtn"
                      onClick={() => startEditMeal(meal.index)}
                    >
                      Edit
                    </button>
                    <button
                      className="deleteBtn"
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
    <div className="body">
      <div className="titleHeader">
        <img src={logo} alt="Bitewise Logo" className="logo" />
        <h1 className="h1">Weekly Food Planner</h1>
      </div>
      <div className="container">
        <div>
          <LogoutButton />
        </div>
        <div>
          <h3>Add a Meal</h3>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="Meal Name"
            className="input"
          />
          <select
            name="category"
            value={form.category}
            onChange={handleFormChange}
            className="select"
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
            className="select"
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
            className="input"
          />
          <button className="button" onClick={addMeal}>
            Add Meal
          </button>
        </div>
        {/* Filters and View Mode */}
        <div className="filters">
          <label>
            Filter by Category:
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="select"
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
              className="select"
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
              className="select"
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