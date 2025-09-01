import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Calendar,
  ShoppingCart,
  Utensils,
  Settings,
  Sparkles,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { usePreferences } from "../contexts/PrefContext";
import { useAuth } from "../contexts/AuthContext";

const sidebarStyles = {
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "280px",
    background: "linear-gradient(180deg, #0f172a, #1e293b)",
    borderRight: "1px solid rgba(148, 163, 184, 0.1)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    boxSizing: "border-box",
    zIndex: 20,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(148, 163, 184, 0.06)",
  },
  logo: {
    width: "2.5rem",
    height: "2.5rem",
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.125rem",
    fontWeight: "bold",
    color: "#fff",
  },
  brandText: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#f8fafc",
    margin: 0,
  },
  brandSub: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: 0,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    color: "#94a3b8",
    transition: "all 0.15s ease",
    cursor: "pointer",
    border: "none",
    background: "none",
    width: "100%",
    fontSize: "0.875rem",
    boxSizing: "border-box",
  },
  navItemActive: {
    background: "rgba(139, 92, 246, 0.18)",
    color: "#a78bfa",
    borderLeft: "3px solid #8b5cf6",
    paddingLeft: "0.75rem",
  },
  navItemDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  themeCard: {
    background: "rgba(30, 41, 59, 0.55)",
    backdropFilter: "blur(8px)",
    borderRadius: "1rem",
    border: "1px solid rgba(148, 163, 184, 0.06)",
    padding: "1rem",
    boxShadow: "0 6px 18px rgba(2,6,23,0.25)",
  },
};

const settingsStyles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  wrapper: {
    maxWidth: "48rem",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  header: { 
    marginBottom: "2rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "white",
    margin: "0 0 0.5rem 0",
  },
  subtitle: { 
    color: "#d1d5db", 
    margin: 0,
    fontSize: "1rem"
  },
  settingsContainer: {
    background: "rgba(31, 41, 55, 0.5)",
    backdropFilter: "blur(10px)",
    borderRadius: "1rem",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    overflow: "hidden",
  },
  sectionHeader: {
    padding: "1.5rem",
    background: "rgba(139, 92, 246, 0.1)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "white",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  settingItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid rgba(148, 163, 184, 0.05)",
    minHeight: "60px"
  },
  settingItemLast: {
    borderBottom: "none"
  },
  settingInfo: { 
    flex: 1,
    marginRight: "1rem"
  },
  settingTitle: { 
    color: "white", 
    fontWeight: "500", 
    margin: "0 0 0.25rem 0",
    fontSize: "0.95rem"
  },
  settingDesc: {
    color: "#9ca3af",
    fontSize: "0.825rem",
    margin: 0,
    lineHeight: "1.4"
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
    height: "1.25rem",
    width: "1.25rem",
    borderRadius: "50%",
    background: "white",
    transition: "transform 0.2s",
    position: "absolute",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  },
  toggleSwitchActive: { transform: "translateX(1.25rem)" },
  toggleSwitchInactive: { transform: "translateX(0.125rem)" },
  select: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    background: "#374151",
    color: "white",
    minWidth: "140px"
  },
  allergenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "0.5rem",
    marginTop: "0.75rem",
  },
  allergenButton: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "0.8rem",
    textAlign: "center"
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
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s"
  },
  dangerButton: {
    background: "#dc2626",
    color: "white",
  },
};

export default function SettingsPageWithSidebar() {
  const { prefs, updatePrefs } = usePreferences();
  const { logout } = useAuth();

  // Local state for immediate UI updates
  const [darkMode, setDarkMode] = useState(prefs?.theme === "dark");
  const [inventory, setInventory] = useState(!!prefs?.user_inventory);
  const [shoppingList, setShoppingList] = useState(!!prefs?.shopping_list);
  const [allergens, setAllergens] = useState(Array.isArray(prefs?.allergens) ? prefs.allergens : []);
  const [dietType, setDietType] = useState(prefs?.diet_type || "any");

  // Sync local state when prefs change
  useEffect(() => {
    setDarkMode(prefs?.theme === "dark");
    setInventory(!!prefs?.user_inventory);
    setShoppingList(!!prefs?.shopping_list);
    setAllergens(Array.isArray(prefs?.allergens) ? prefs.allergens : []);
    setDietType(prefs?.diet_type || "any");
  }, [prefs]);

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

  // Theme toggle from the sidebar
  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    updatePrefs({ theme: next ? "dark" : "light" });
  };

  // Handlers
  const toggleInventory = () => {
    const next = !inventory;
    setInventory(next);
    updatePrefs({ user_inventory: next });
  };

  const toggleShoppingList = () => {
    const next = !shoppingList;
    setShoppingList(next);
    updatePrefs({ shopping_list: next });
  };

  const handleAllergenToggle = (a) => {
    let next;
    if (allergens.includes(a)) next = allergens.filter((x) => x !== a);
    else next = [...allergens, a];
    setAllergens(next);
    updatePrefs({ allergens: next });
  };

  const handleDietChange = (e) => {
    setDietType(e.target.value);
    updatePrefs({ diet_type: e.target.value });
  };

  const handleLogout = () => {
    logout();
  };

  // Components
  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      aria-pressed={enabled}
      style={{
        ...settingsStyles.toggle,
        ...(enabled ? settingsStyles.toggleActive : settingsStyles.toggleInactive),
      }}
    >
      <span
        style={{
          ...settingsStyles.toggleSwitch,
          ...(enabled ? settingsStyles.toggleSwitchActive : settingsStyles.toggleSwitchInactive),
        }}
      />
    </button>
  );

  const navLinkStyle = ({ isActive }) => ({
    ...sidebarStyles.navItem,
    ...(isActive ? sidebarStyles.navItemActive : {}),
  });

  const themeLabel = prefs?.theme === "dark" ? "Dark" : "Light";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={sidebarStyles.sidebar}>
        <div style={sidebarStyles.brand}>
          <div style={sidebarStyles.logo}>MP</div>
          <div>
            <div style={sidebarStyles.brandText}>Meal Planner</div>
            <div style={sidebarStyles.brandSub}>Stay on track, effortlessly</div>
          </div>
        </div>

        <nav style={sidebarStyles.nav}>
          <NavLink to="/home" style={navLinkStyle}>
            <Calendar style={{ width: "1rem", height: "1rem" }} />
            Weekly Planner
          </NavLink>

          <button style={{ ...sidebarStyles.navItem, ...sidebarStyles.navItemDisabled }} disabled>
            <ShoppingCart style={{ width: "1rem", height: "1rem" }} />
            Groceries
          </button>

          <NavLink to="/recipe" style={navLinkStyle}>
            <Utensils style={{ width: "1rem", height: "1rem" }} />
            Recipes
          </NavLink>

          <NavLink to="/settings" style={navLinkStyle}>
            <Settings style={{ width: "1rem", height: "1rem" }} />
            Settings
          </NavLink>
        </nav>

        {/* Theme info card */}
        <div style={sidebarStyles.themeCard}>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#f8fafc",
              margin: "0 0 0.5rem 0",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Sparkles style={{ width: "1rem", height: "1rem", color: "#a78bfa" }} />
            Current Theme: {themeLabel}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.4" }}>
            Toggle theme directly below or change in Settings.
          </div>
        </div>

        {/* Dark mode switch */}
        <button
          onClick={toggleTheme}
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(148, 163, 184, 0.12)",
            background: "rgba(30, 41, 59, 0.6)",
            color: "#f8fafc",
            cursor: "pointer",
            fontSize: "0.875rem",
            width: "100%",
            boxSizing: "border-box",
          }}
          aria-label="Toggle theme"
          title={`Switch to ${prefs?.theme === "dark" ? "light" : "dark"} mode`}
        >
          {prefs?.theme === "dark" ? (
            <Sun style={{ width: "1rem", height: "1rem" }} />
          ) : (
            <Moon style={{ width: "1rem", height: "1rem" }} />
          )}
          Toggle {prefs?.theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: "280px", overflow: "auto", minHeight: "100vh" }}>
        <div style={settingsStyles.container}>
          <div style={settingsStyles.wrapper}>
            <div style={settingsStyles.header}>
              <h1 style={settingsStyles.title}>Settings</h1>
              <p style={settingsStyles.subtitle}>Manage your preferences and account settings</p>
            </div>

            <div style={settingsStyles.settingsContainer}>
              {/* General Settings Section */}
              <h2 style={settingsStyles.sectionHeader}>
                <Settings style={{ width: "1.25rem", height: "1.25rem" }} />
                General Settings
              </h2>

              <div style={settingsStyles.settingItem}>
                <div style={settingsStyles.settingInfo}>
                  <h3 style={settingsStyles.settingTitle}>Dark Mode</h3>
                  <p style={settingsStyles.settingDesc}>Toggle between light and dark theme</p>
                </div>
                <ToggleSwitch enabled={darkMode} onChange={toggleTheme} />
              </div>

              <div style={settingsStyles.settingItem}>
                <div style={settingsStyles.settingInfo}>
                  <h3 style={settingsStyles.settingTitle}>Inventory Tracking</h3>
                  <p style={settingsStyles.settingDesc}>Keep track of your ingredients and supplies</p>
                </div>
                <ToggleSwitch enabled={inventory} onChange={toggleInventory} />
              </div>

              <div style={settingsStyles.settingItem}>
                <div style={settingsStyles.settingInfo}>
                  <h3 style={settingsStyles.settingTitle}>Shopping List</h3>
                  <p style={settingsStyles.settingDesc}>Generate shopping lists from your meal plans</p>
                </div>
                <ToggleSwitch enabled={shoppingList} onChange={toggleShoppingList} />
              </div>

              {/* Dietary Preferences Section */}
              <h2 style={settingsStyles.sectionHeader}>
                <Utensils style={{ width: "1.25rem", height: "1.25rem" }} />
                Dietary Preferences
              </h2>

              <div style={settingsStyles.settingItem}>
                <div style={settingsStyles.settingInfo}>
                  <h3 style={settingsStyles.settingTitle}>Diet Type</h3>
                  <p style={settingsStyles.settingDesc}>Select your preferred diet type</p>
                </div>
                <select
                  value={dietType}
                  onChange={handleDietChange}
                  style={settingsStyles.select}
                >
                  {dietOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{...settingsStyles.settingItem, ...settingsStyles.settingItemLast, alignItems: 'flex-start'}}>
                <div style={settingsStyles.settingInfo}>
                  <h3 style={settingsStyles.settingTitle}>Allergens & Health Conditions</h3>
                  <p style={settingsStyles.settingDesc}>Select any allergens or dietary restrictions</p>
                  
                  <div style={settingsStyles.allergenGrid}>
                    {allergenOptions.map((a) => {
                      const active = allergens.includes(a);
                      return (
                        <button
                          key={a}
                          onClick={() => handleAllergenToggle(a)}
                          style={{
                            ...settingsStyles.allergenButton,
                            ...(active ? settingsStyles.allergenActive : settingsStyles.allergenInactive),
                          }}
                          aria-pressed={active}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>

                  {allergens.length > 0 && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>
                      <div style={{ color: "#d1d5db", fontWeight: "600" }}>Selected:</div>
                      <div style={{ color: "#9ca3af" }}>{allergens.join(", ")}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Logout Section */}
              <div style={{
                padding: "1.5rem",
                borderTop: "1px solid rgba(148, 163, 184, 0.1)",
                background: "rgba(139, 92, 246, 0.05)"
              }}>
                <button onClick={handleLogout} style={{...settingsStyles.actionButton, ...settingsStyles.dangerButton}}>
                  <Shield style={{ width: "1.25rem", height: "1.25rem" }} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}