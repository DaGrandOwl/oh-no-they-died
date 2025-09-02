import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, Moon, Sun, Package, ShoppingCart, Heart } from "lucide-react";
import { usePreferences } from "../contexts/PrefContext";

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  wrapper: { maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" },
  logoSection: { display: "flex", alignItems: "center", gap: "1rem" },
  logo: {
    width: "2.5rem",
    height: "2.5rem",
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1.125rem",
    fontWeight: "bold",
  },
  logoText: { color: "white", fontWeight: "600", margin: 0 },
  logoSubtext: { color: "#9ca3af", fontSize: "0.875rem", margin: 0 },
  skipButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#9ca3af",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
  },

  progressContainer: { marginBottom: "2rem" },
  progressHeader: { display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" },
  progressText: { color: "#9ca3af", fontSize: "0.875rem" },
  progressBar: { width: "100%", height: "0.5rem", backgroundColor: "#374151", borderRadius: "9999px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #8b5cf6, #06b6d4)", borderRadius: "9999px" },

  contentCard: { background: "rgba(31, 41, 55, 0.5)", backdropFilter: "blur(10px)", borderRadius: "1.5rem", padding: "2rem", marginBottom: "2rem" },

  themeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" },
  themeOption: { padding: "1.5rem", borderRadius: "1rem", border: "2px solid", cursor: "pointer", textAlign: "center" },
  themeOptionDark: { borderColor: "#8b5cf6", background: "linear-gradient(135deg, #1e293b, #334155)" },
  themeOptionLight: { borderColor: "#06b6d4", background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)", color: "#1f2937" },
  themeOptionInactive: { borderColor: "#4b5563", background: "#1f2937" },

  infoBox: { background: "linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem" },
  infoText: { color: "#d1d5db", fontSize: "0.875rem", margin: 0 },

  allergenGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" },
  allergenButton: {
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.3s",
    fontSize: "0.875rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
  },
  allergenActive: { background: "linear-gradient(45deg, #ef4444, #f97316)", borderColor: "#ef4444", color: "white" },
  allergenInactive: { background: "#1f2937", borderColor: "#4b5563", color: "#d1d5db" },

  selectedInfo: { background: "linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))", borderRadius: "0.75rem", padding: "1rem" },

  featureCard: { padding: "1.5rem", borderRadius: "1rem", border: "2px solid", cursor: "pointer", transition: "all 0.3s", marginBottom: "1rem" },
  featureActive: { borderColor: "#8b5cf6", background: "linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))" },
  featureInactive: { borderColor: "#4b5563", background: "#1f2937" },

  toggle: { width: "3rem", height: "1.5rem", borderRadius: "9999px", position: "relative", cursor: "pointer" },
  toggleActive: { background: "#8b5cf6" },
  toggleInactive: { background: "#4b5563" },
  toggleSwitch: { width: "1.25rem", height: "1.25rem", background: "white", borderRadius: "50%", position: "absolute", top: "0.125rem", transition: "transform 0.3s" },
  toggleSwitchActive: { transform: "translateX(1.75rem)" },
  toggleSwitchInactive: { transform: "translateX(0.125rem)" },

  completeCard: { background: "linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))", borderRadius: "1rem", padding: "2rem", marginBottom: "1.5rem" },

  navigation: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  navButton: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", fontSize: "0.875rem" },
  backButton: { color: "#d1d5db", background: "transparent" },
  nextButton: { color: "white", background: "linear-gradient(45deg, #8b5cf6, #06b6d4)", fontWeight: "500" },

  dots: { display: "flex", gap: "0.5rem" },
  dot: { width: "0.5rem", height: "0.5rem", borderRadius: "50%", transition: "all 0.3s" },
  dotActive: { background: "linear-gradient(90deg, #8b5cf6, #06b6d4)", width: "1.5rem" },
  dotCompleted: { background: "#a78bfa" },
  dotInactive: { background: "#4b5563" },
};

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { prefs, updatePrefs } = usePreferences();

  const [settings, setSettings] = useState({
    allergens: Array.isArray(prefs.allergens) ? prefs.allergens : [],
    inventory: prefs.user_inventory ?? true,
    shoppingList: prefs.shopping_list ?? false,
    darkMode: prefs.theme === "dark",
    dietType: prefs.diet_type || "any",
  });

  useEffect(() => {
    setSettings({
      allergens: Array.isArray(prefs.allergens) ? prefs.allergens : [],
      inventory: prefs.user_inventory ?? true,
      shoppingList: prefs.shopping_list ?? false,
      darkMode: prefs.theme === "dark",
      dietType: prefs.diet_type || "any",
    });
  }, [prefs]);

  const allergenOptions = ["Celiac", "Diabetic", "Nut Allergy", "Dairy Free", "Shellfish", "Soy", "Egg"];

  const dietOptions = [
    { value: "any", label: "No preference" },
    { value: "vegan", label: "Vegan" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "keto", label: "Keto" },
    { value: "paleo", label: "Paleo" },
    { value: "low_carb", label: "Low carb" },
  ];

  const handleThemeChange = (dark) => {
    setSettings((s) => ({ ...s, darkMode: dark }));
    updatePrefs({ theme: dark ? "dark" : "light" });
    try { document.body.setAttribute("data-theme", dark ? "dark" : "light"); } catch {}
  };

  const persistSettings = () => {
    updatePrefs({
      theme: settings.darkMode ? "dark" : "light",
      allergens: settings.allergens,
      user_inventory: !!settings.inventory,
      shopping_list: !!settings.shoppingList,
      diet_type: settings.dietType,
    });
  };

  const finishOnboarding = () => {
    persistSettings();
    window.location.href = "/dashboard";
  };

  const steps = [
    {
      id: "welcome",
      title: "Welcome to Meal Planner!",
      subtitle: "Let's set up your perfect meal planning experience",
      icon: <Heart style={{ width: 32, height: 32 }} />,
      content: (
        <div style={{ textAlign: "center" }}>
          <div style={{ padding: 20, borderRadius: 12, marginBottom: 12, background: "linear-gradient(45deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))" }}>
            <p style={{ color: "#d1d5db", margin: 0 }}>
              We'll guide you through a few quick preferences to personalize your meal planning journey.
            </p>
          </div>
          <div style={{ color: "#9ca3af" }}>4 quick steps · 2 minutes · Skip anytime</div>
        </div>
      ),
    },
    {
      id: "theme",
      title: "Choose Your Theme",
      subtitle: "How do you prefer to view your meal plans?",
      icon: settings.darkMode ? <Moon /> : <Sun />,
      content: (
        <div>
          <div style={styles.themeGrid}>
            <button
              onClick={() => handleThemeChange(true)}
              style={{ ...styles.themeOption, ...(settings.darkMode ? styles.themeOptionDark : styles.themeOptionInactive) }}
            >
              <Moon style={{ width: 32, height: 32, color: settings.darkMode ? "#a78bfa" : "#9ca3af" }} />
              <h3 style={{ color: settings.darkMode ? "white" : "#9ca3af" }}>Dark Mode</h3>
            </button>

            <button
              onClick={() => handleThemeChange(false)}
              style={{ ...styles.themeOption, ...(!settings.darkMode ? styles.themeOptionLight : styles.themeOptionInactive) }}
            >
              <Sun style={{ width: 32, height: 32, color: !settings.darkMode ? "#eab308" : "#9ca3af" }} />
              <h3 style={{ color: !settings.darkMode ? "#1f2937" : "#9ca3af" }}>Light Mode</h3>
            </button>
          </div>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>You can change this later in settings.</p>
          </div>
        </div>
      ),
    },
    {
      id: "health",
      title: "Health & Dietary Needs",
      subtitle: "Help us filter meals that work for you",
      icon: <Heart />,
      content: (
        <div>
          <div style={{ ...styles.infoBox, background: "linear-gradient(45deg, rgba(239,68,68,0.08), rgba(249,115,22,0.08))" }}>
            <p style={styles.infoText}>Select any allergens or health conditions so we can filter out meals that might not be suitable.</p>
          </div>

          <div style={styles.allergenGrid}>
            {allergenOptions.map((a) => {
              const active = settings.allergens.includes(a);
              return (
                <button
                  key={a}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      allergens: prev.allergens.includes(a) ? prev.allergens.filter((x) => x !== a) : [...prev.allergens, a],
                    }))
                  }
                  style={{ ...(active ? styles.allergenActive : styles.allergenInactive), ...styles.allergenButton }}
                >
                  {a}
                </button>
              );
            })}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 8, color: "#d1d5db" }}>Diet type</label>
            <select
              value={settings.dietType}
              onChange={(e) => setSettings((s) => ({ ...s, dietType: e.target.value }))}
              style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #4b5563", background: "#374151", color: "white" }}
            >
              {dietOptions.map((d) => (
                <option value={d.value} key={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {settings.allergens.length > 0 && (
            <div style={styles.selectedInfo}>
              <h4 style={{ color: "white", margin: "0 0 8px 0" }}>Selected conditions:</h4>
              <div style={{ color: "#d1d5db" }}>{settings.allergens.join(", ")}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "features",
      title: "Enable Smart Features",
      subtitle: "Unlock powerful meal planning tools",
      icon: <Package />,
      content: (
        <div>
          <div
            style={{
              ...styles.featureCard,
              ...(settings.inventory ? styles.featureActive : styles.featureInactive),
            }}
            onClick={() => setSettings((p) => ({ ...p, inventory: !p.inventory }))}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <Package style={{ width: 32, height: 32, color: settings.inventory ? "#a78bfa" : "#9ca3af" }} />
              <div>
                <div style={{ color: "white", fontWeight: 600 }}>Inventory Tracking</div>
                <div style={{ color: "#9ca3af" }}>We'll suggest meals based on what's available at home.</div>
              </div>
            </div>
          </div>

          <div
            style={{
              ...styles.featureCard,
              ...(settings.shoppingList ? { borderColor: "#06b6d4", background: "linear-gradient(45deg, rgba(6,182,212,0.2), rgba(34,197,94,0.2))" } : styles.featureInactive),
            }}
            onClick={() => setSettings((p) => ({ ...p, shoppingList: !p.shoppingList }))}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <ShoppingCart style={{ width: 32, height: 32, color: settings.shoppingList ? "#22d3ee" : "#9ca3af" }} />
              <div>
                <div style={{ color: "white", fontWeight: 600 }}>Smart Shopping Lists</div>
                <div style={{ color: "#9ca3af" }}>Automatically generate shopping lists from your meal plans.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "complete",
      title: "You're All Set!",
      subtitle: "Ready to start your meal planning journey",
      icon: <Check />,
      content: (
        <div style={{ textAlign: "center" }}>
          <div style={styles.completeCard}>
            <h3 style={{ color: "white", fontSize: 20, margin: "0 0 12px 0" }}>Perfect! Here's what we saved:</h3>
            <div style={{ color: "#d1d5db", textAlign: "left" }}>
              <div>Theme: {settings.darkMode ? "Dark" : "Light"}</div>
              <div>Diet: {settings.dietType || "No preference"}</div>
              <div>Allergens: {settings.allergens.length > 0 ? settings.allergens.join(", ") : "None"}</div>
              <div>Inventory: {settings.inventory ? "Enabled" : "Disabled"}</div>
              <div>Shopping lists: {settings.shoppingList ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
          <p style={{ color: "#d1d5db" }}>You can change any of these later in Settings.</p>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    // persist before moving forward
    persistSettings();
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((s) => s - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const skipAll = () => {
    persistSettings();
    finishOnboarding();
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <div style={styles.logo}>MP</div>
            <div>
              <h1 style={styles.logoText}>Meal Planner</h1>
              <p style={styles.logoSubtext}>Setup your preferences</p>
            </div>
          </div>

          {currentStep < 4 && (
            <button onClick={skipAll} style={styles.skipButton}>
              <ChevronRight style={{ width: 16, height: 16 }} />
              <span>Skip all</span>
            </button>
          )}
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressText}>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span style={styles.progressText}>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>

          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div style={{ transition: "all 0.3s", opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? "translateX(1rem)" : "translateX(0)" }}>
          <div style={styles.contentCard}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {steps[currentStep].icon}
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <h2 style={{ color: "white", margin: 0 }}>{steps[currentStep].title}</h2>
              <p style={{ color: "#9ca3af" }}>{steps[currentStep].subtitle}</p>
            </div>

            <div>{steps[currentStep].content}</div>
          </div>
        </div>

        <div style={styles.navigation}>
          <button onClick={prevStep} disabled={currentStep === 0} style={{ ...styles.navButton, ...(currentStep === 0 ? { opacity: 0.5, cursor: "not-allowed" } : styles.backButton) }}>
            <ChevronLeft />
            <span>Back</span>
          </button>

          <div style={styles.dots}>
            {steps.map((_, i) => (
              <div key={i} style={{ ...styles.dot, ...(i === currentStep ? styles.dotActive : i < currentStep ? styles.dotCompleted : styles.dotInactive) }} />
            ))}
          </div>

          <button onClick={nextStep} style={styles.nextButton}>
            <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
            {currentStep === steps.length - 1 ? <Check /> : <ChevronRight />}
          </button>
        </div>
      </div>
    </div>
  );
}