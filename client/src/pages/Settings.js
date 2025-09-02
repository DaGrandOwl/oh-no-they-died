import { useState, useEffect } from "react";
import { usePreferences } from "../contexts/PrefContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Utensils,
  Shield,
  Settings,
} from "lucide-react";
import { cardStyle, buttonGhost } from "../components/Styles";

const settingsStyles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "2rem",
    display: "flex",
    justifyContent: "center",
  },
  wrapper: {
    width: "100%",
    maxWidth: "800px",
  },
  header: {
    marginBottom: "2rem",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: "1.125rem",
    margin: 0,
  },
  settingsCard: {
    ...cardStyle,
    padding: 0,
    overflow: "hidden",
  },
  section: {
    padding: "1.5rem",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "0 0 1.5rem 0",
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#f8fafc",
  },
  sectionIcon: {
    color: "#8b5cf6",
  },
  settingItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 0",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: "#f8fafc",
    fontWeight: "500",
    margin: "0 0 0.25rem 0",
    fontSize: "1rem",
  },
  settingDesc: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    margin: 0,
    lineHeight: "1.4",
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
    transition: "all 0.2s",
  },
  toggleActive: {
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
  },
  toggleInactive: {
    background: "#4b5563",
  },
  toggleSwitch: {
    display: "inline-block",
    height: "1.25rem",
    width: "1.25rem",
    borderRadius: "50%",
    background: "white",
    transition: "transform 0.2s",
    position: "absolute",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  toggleSwitchActive: {
    transform: "translateX(0.95rem)",
  },
  toggleSwitchInactive: {
    transform: "translateX(-0.2rem)",
  },
  select: {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(30, 41, 59, 0.8)",
    color: "white",
    minWidth: "160px",
    fontSize: "0.875rem",
  },
  allergenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  allergenButton: {
    padding: "0.625rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.2s",
    fontSize: "0.875rem",
    textAlign: "center",
    fontWeight: "500",
  },
  allergenActive: {
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
    borderColor: "transparent",
    color: "white",
  },
  allergenInactive: {
    background: "rgba(30, 41, 59, 0.6)",
    borderColor: "rgba(148, 163, 184, 0.2)",
    color: "#cbd5e1",
  },
  footer: {
    padding: "1.5rem",
    display: "flex",
    justifyContent: "center",
    background: "rgba(139, 92, 246, 0.05)",
  },
  selectedAllergens: {
    marginTop: "1rem",
    padding: "0.75rem",
    background: "rgba(30, 41, 59, 0.4)",
    borderRadius: "0.5rem",
    border: "1px solid rgba(148, 163, 184, 0.1)",
  },
  selectedTitle: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: "0.875rem",
    margin: "0 0 0.5rem 0",
  },
  selectedList: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    margin: 0,
  },
};
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

export default function SettingsPage() {
  const { prefs, updatePrefs } = usePreferences();
  const { logout } = useAuth();

  // Local state for immediate UI updates
  const [inventory, setInventory] = useState(!!prefs?.user_inventory);
  const [allergens, setAllergens] = useState(Array.isArray(prefs?.allergens) ? prefs.allergens : []);
  const [dietType, setDietType] = useState(prefs?.diet_type || "any");

  // Sync local state when prefs change
  useEffect(() => {
    setInventory(!!prefs?.user_inventory);
    setAllergens(Array.isArray(prefs?.allergens) ? prefs.allergens : []);
    setDietType(prefs?.diet_type || "any");
  }, [prefs]);

  const allergenOptions = [
    "Celiac", "Diabetic", "Nut Allergy", "Dairy Free", 
    "Shellfish", "Soy", "Egg", "Wheat", "Sesame"
  ];

  const dietOptions = [
    { value: "any", label: "No preference" },
    { value: "vegan", label: "Vegan" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "keto", label: "Keto" },
    { value: "paleo", label: "Paleo" },
    { value: "low_carb", label: "Low carb" },
    { value: "gluten_free", label: "Gluten-Free" },
    { value: "mediterranean", label: "Mediterranean" }
  ];

  // Handlers
  const toggleInventory = () => {
    const next = !inventory;
    setInventory(next);
    updatePrefs({ user_inventory: next });
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

  return (
    <div style={settingsStyles.container}>
      <div style={settingsStyles.wrapper}>
        <div style={settingsStyles.header}>
          <h1 style={settingsStyles.title}>Settings</h1>
          <p style={settingsStyles.subtitle}>Customize your meal planning experience</p>
        </div>
        

        <div style={settingsStyles.settingsCard}>

          {/* General Settings Section */}
          <div style={settingsStyles.section}>
            <h2 style={settingsStyles.sectionHeader}>
              <Settings style={{ width: "1.25rem", height: "1.25rem" }} />
              General Settings
            </h2>

            <div style={settingsStyles.settingItem}>
              <div style={settingsStyles.settingInfo}>
                <h3 style={settingsStyles.settingTitle}>Inventory Tracking</h3>
                <p style={settingsStyles.settingDesc}>Keep track of your ingredients and supplies</p>
              </div>
              <ToggleSwitch enabled={inventory} onChange={toggleInventory} />
            </div>
          </div>

          {/* Dietary Preferences Section */}
          <div style={settingsStyles.section}>
            <h2 style={settingsStyles.sectionHeader}>
              <Utensils style={settingsStyles.sectionIcon} size={20} />
              Dietary Preferences
            </h2>
            
            <div style={settingsStyles.settingItem}>
              <div style={settingsStyles.settingInfo}>
                <h3 style={settingsStyles.settingTitle}>Diet Type</h3>
                <p style={settingsStyles.settingDesc}>
                  Select your preferred diet type
                </p>
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

            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={settingsStyles.settingTitle}>Allergens & Restrictions</h3>
              <p style={settingsStyles.settingDesc}>
                Select any allergens or dietary restrictions
              </p>
              
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
                <div style={settingsStyles.selectedAllergens}>
                  <div style={settingsStyles.selectedTitle}>Selected restrictions:</div>
                  <p style={settingsStyles.selectedList}>{allergens.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <div style={settingsStyles.footer}>
            <button 
              onClick={handleLogout} 
              style={{ ...buttonGhost, ...settingsStyles.dangerButton }}
            >
              <Shield size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}