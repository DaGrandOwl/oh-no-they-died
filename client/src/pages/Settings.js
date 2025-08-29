import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { usePreferences } from "../contexts/PrefContext";

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  wrapper: {
    maxWidth: "64rem",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  header: { marginBottom: "2rem" },
  title: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    color: "white",
    margin: "0 0 0.5rem 0",
  },
  subtitle: { color: "#d1d5db", margin: 0 },

  tabContainer: {
    background: "rgba(31, 41, 55, 0.5)",
    backdropFilter: "blur(10px)",
    borderRadius: "1rem 1rem 0 0",
    borderBottom: "1px solid #374151",
  },
  tabNav: { display: "flex" },
  tab: {
    display: "flex",
    alignItems: "center",
    padding: "1rem 1.5rem",
    fontWeight: "500",
    transition: "all 0.3s",
    border: "none",
    cursor: "pointer",
    background: "none",
    borderBottom: "2px solid transparent",
    color: "#9ca3af",
  },
  tabActive: {
    color: "white",
    borderBottomColor: "#8b5cf6",
    background: "rgba(55, 65, 81, 0.3)",
  },

  content: {
    background: "rgba(31, 41, 55, 0.5)",
    backdropFilter: "blur(10px)",
    borderRadius: "0 0 1rem 1rem",
    padding: "1.5rem",
  },

  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "white",
    margin: "0 0 1rem 0",
  },

  settingItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 0",
    borderBottom: "1px solid #374151",
  },
  settingInfo: { flex: 1 },
  settingTitle: { color: "white", fontWeight: "500", margin: "0 0 0.25rem 0" },
  settingDesc: {
    color: "#9ca3af",
    fontSize: "0.875rem",
    margin: 0,
  },

  toggle: {
    position: "relative",
    display: "inline-flex",
    height: "1.5rem",
    width: "2.75rem",
    alignItems: "center",
    borderRadius: "9999px",
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.2s",
  },
  toggleActive: { background: "linear-gradient(45deg, #8b5cf6, #06b6d4)" },
  toggleInactive: { background: "#4b5563" },
  toggleSwitch: {
    display: "inline-block",
    height: "1rem",
    width: "1rem",
    borderRadius: "50%",
    background: "white",
    transition: "transform 0.2s",
    position: "absolute",
  },
  toggleSwitchActive: { transform: "translateX(1.5rem)" },
  toggleSwitchInactive: { transform: "translateX(0.25rem)" },

  allergenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  allergenButton: {
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "0.875rem",
  },
  allergenActive: {
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
    borderColor: "#8b5cf6",
    color: "white",
  },
  allergenInactive: {
    background: "#374151",
    borderColor: "#4b5563",
    color: "#d1d5db",
  },

  select: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    background: "#374151",
    color: "white",
  },

  logoutSection: {
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #374151",
  },
  logoutButton: {
    background: "#dc2626",
    color: "white",
    padding: "0.5rem 1.5rem",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { prefs, updatePrefs } = usePreferences();

  // Local editing state (keeps UI snappy and allows immediate updates)
  const [darkMode, setDarkMode] = useState(prefs.theme === "dark");
  const [inventory, setInventory] = useState(!!prefs.user_inventory);
  const [shoppingList, setShoppingList] = useState(!!prefs.shopping_list);
  const [allergens, setAllergens] = useState(Array.isArray(prefs.allergens) ? prefs.allergens : []);
  const [dietType, setDietType] = useState(prefs.diet_type || "any");

  useEffect(() => {
    setDarkMode(prefs.theme === "dark");
    setInventory(!!prefs.user_inventory);
    setShoppingList(!!prefs.shopping_list);
    setAllergens(Array.isArray(prefs.allergens) ? prefs.allergens : []);
    setDietType(prefs.diet_type || "any");
  }, [prefs]);

  // Options
  const allergenOptions = [
    "Celiac",
    "Diabetic",
    "Nut Allergy",
    "Dairy Free",
    "Shellfish",
    "Soy",
    "Egg",
  ];

  const dietOptions = [
    { value: "any", label: "No preference" },
    { value: "vegan", label: "Vegan" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "keto", label: "Keto" },
    { value: "paleo", label: "Paleo" },
    { value: "low_carb", label: "Low carb" },
  ];

  // Persist single preference
  const persist = (patch) => {
    updatePrefs(patch);
  };

  // Handlers
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    persist({ theme: next ? "dark" : "light" });
  };

  const toggleInventory = () => {
    const next = !inventory;
    setInventory(next);
    persist({ user_inventory: next });
  };

  const toggleShoppingList = () => {
    const next = !shoppingList;
    setShoppingList(next);
    persist({ shopping_list: next });
  };

  const handleAllergenToggle = (a) => {
    let next;
    if (allergens.includes(a)) next = allergens.filter((x) => x !== a);
    else next = [...allergens, a];
    setAllergens(next);
    persist({ allergens: next });
  };

  const handleDietChange = (e) => {
    setDietType(e.target.value);
    persist({ diet_type: e.target.value });
  };

  const handleLogout = () => {
    // Implement your logout routine / call auth context
    console.log("logout clicked");
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      aria-pressed={enabled}
      style={{
        ...styles.toggle,
        ...(enabled ? styles.toggleActive : styles.toggleInactive),
      }}
    >
      <span
        style={{
          ...styles.toggleSwitch,
          ...(enabled ? styles.toggleSwitchActive : styles.toggleSwitchInactive),
        }}
      />
    </button>
  );

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        ...styles.tab,
        ...(activeTab === id ? styles.tabActive : {}),
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Manage your preferences and account settings</p>
        </div>

        <div style={styles.tabContainer}>
          <div style={styles.tabNav}>
            <TabButton id="general" label="General" />
            <TabButton id="preferences" label="Preferences" />
            <TabButton id="account" label="Account" />
          </div>
        </div>

        <div style={styles.content}>
          {activeTab === "general" && (
            <div>
              <h2 style={styles.sectionTitle}>General Settings</h2>

              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingTitle}>Dark Mode</h3>
                  <p style={styles.settingDesc}>Toggle between light and dark theme.</p>
                </div>
                <div style={styles.settingControl}>
                  <ToggleSwitch enabled={darkMode} onChange={toggleDarkMode} />
                </div>
              </div>

              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingTitle}>Inventory Tracking</h3>
                  <p style={styles.settingDesc}>Keep track of your ingredients and supplies.</p>
                </div>
                <div style={styles.settingControl}>
                  <ToggleSwitch enabled={inventory} onChange={toggleInventory} />
                </div>
              </div>

              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <h3 style={styles.settingTitle}>Shopping List</h3>
                  <p style={styles.settingDesc}>Generate shopping lists from your meal plans.</p>
                </div>
                <div style={styles.settingControl}>
                  <ToggleSwitch enabled={shoppingList} onChange={toggleShoppingList} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div>
              <h2 style={styles.sectionTitle}>Diet & Health Preferences</h2>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 8, color: "#d1d5db" }}>
                  Diet type
                </label>
                <select
                  value={dietType}
                  onChange={handleDietChange}
                  style={styles.select}
                >
                  {dietOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 8, color: "#d1d5db" }}>
                  Allergens / health conditions
                </label>

                <div style={styles.allergenGrid}>
                  {allergenOptions.map((a) => {
                    const active = allergens.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => handleAllergenToggle(a)}
                        style={{
                          ...styles.allergenButton,
                          ...(active ? styles.allergenActive : styles.allergenInactive),
                        }}
                        aria-pressed={active}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>

                {allergens.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: "#d1d5db", fontWeight: 600 }}>Selected</div>
                    <div style={{ color: "#9ca3af" }}>{allergens.join(", ")}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div>
              <h2 style={styles.sectionTitle}>Account</h2>
              <p style={{ color: "#9ca3af" }}>
                Security and account options will appear here.
              </p>
            </div>
          )}

          <div style={styles.logoutSection}>
            <button onClick={handleLogout} style={styles.logoutButton}>
              <Shield style={{ width: "1.25rem", height: "1.25rem" }} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}