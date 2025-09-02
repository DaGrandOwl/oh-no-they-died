import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, Utensils, Settings, Heart, Package } from "lucide-react";
import { usePreferences } from "../contexts/PrefContext";

//Page does not set hasOnboarded=True when completed. Not addressed due to no major issues caused

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  wrapper: { 
    maxWidth: "48rem", 
    margin: "0 auto", 
    padding: "2rem 1rem" 
  },
  header: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: "2rem" 
  },
  logoSection: { 
    display: "flex", 
    alignItems: "center", 
    gap: "1rem" 
  },
  logo: {
    width: "3rem",
    height: "3rem",
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
    borderRadius: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1.25rem",
    fontWeight: "bold",
    boxShadow: "0 8px 25px rgba(139, 92, 246, 0.3)",
  },
  logoText: { 
    color: "white", 
    fontWeight: "700", 
    fontSize: "1.5rem",
    margin: 0 
  },
  logoSubtext: { 
    color: "#94a3b8", 
    fontSize: "0.875rem", 
    margin: 0 
  },
  skipButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#94a3b8",
    background: "rgba(30, 41, 59, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "all 0.2s",
  },
  skipButtonHover: {
    background: "rgba(30, 41, 59, 0.8)",
    borderColor: "rgba(148, 163, 184, 0.3)",
  },

  progressContainer: { 
    marginBottom: "2.5rem" 
  },
  progressHeader: { 
    display: "flex", 
    justifyContent: "space-between", 
    marginBottom: "0.75rem" 
  },
  progressText: { 
    color: "#94a3b8", 
    fontSize: "0.875rem",
    fontWeight: "500"
  },
  progressBar: { 
    width: "100%", 
    height: "0.375rem", 
    backgroundColor: "rgba(30, 41, 59, 0.8)", 
    borderRadius: "9999px", 
    overflow: "hidden",
    border: "1px solid rgba(148, 163, 184, 0.1)"
  },
  progressFill: { 
    height: "100%", 
    background: "linear-gradient(90deg, #8b5cf6, #06b6d4)", 
    borderRadius: "9999px",
    transition: "width 0.5s ease-in-out"
  },

  contentCard: { 
    background: "rgba(30, 41, 59, 0.6)", 
    backdropFilter: "blur(20px)", 
    borderRadius: "1.5rem", 
    padding: "2.5rem", 
    marginBottom: "2rem",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
  },

  stepIcon: {
    width: "4rem",
    height: "4rem",
    borderRadius: "1rem",
    background: "rgba(139, 92, 246, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
    border: "2px solid rgba(139, 92, 246, 0.3)"
  },

  stepTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "white",
    margin: "0 0 0.5rem 0",
    textAlign: "center"
  },

  stepSubtitle: {
    color: "#cbd5e1",
    fontSize: "1.125rem",
    margin: "0 0 2rem 0",
    textAlign: "center",
    lineHeight: "1.6"
  },

  infoBox: { 
    background: "rgba(139, 92, 246, 0.08)", 
    borderRadius: "0.75rem", 
    padding: "1.25rem", 
    marginBottom: "1.5rem",
    border: "1px solid rgba(139, 92, 246, 0.2)"
  },
  infoText: { 
    color: "#e2e8f0", 
    fontSize: "0.875rem", 
    margin: 0,
    lineHeight: "1.5"
  },

  // Settings-style
  settingItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem",
    marginBottom: "1rem",
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "1rem",
    border: "1px solid rgba(148, 163, 184, 0.1)",
    transition: "all 0.2s"
  },
  settingItemActive: {
    borderColor: "rgba(139, 92, 246, 0.4)",
    background: "rgba(139, 92, 246, 0.08)"
  },
  settingInfo: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  settingIcon: {
    color: "#8b5cf6",
    background: "rgba(139, 92, 246, 0.15)",
    padding: "0.5rem",
    borderRadius: "0.5rem"
  },
  settingTitle: {
    color: "#f8fafc",
    fontWeight: "600",
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
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)"
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
    transform: "translateX(1.25rem)",
  },
  toggleSwitchInactive: {
    transform: "translateX(0.125rem)",
  },

  select: {
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.6)",
    color: "white",
    minWidth: "180px",
    fontSize: "0.875rem",
    fontWeight: "500"
  },

  allergenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  allergenButton: {
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
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
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)"
  },
  allergenInactive: {
    background: "rgba(15, 23, 42, 0.4)",
    borderColor: "rgba(148, 163, 184, 0.2)",
    color: "#cbd5e1",
  },

  selectedAllergens: {
    marginTop: "1.5rem",
    padding: "1rem",
    background: "rgba(6, 182, 212, 0.08)",
    borderRadius: "0.75rem",
    border: "1px solid rgba(6, 182, 212, 0.2)",
  },
  selectedTitle: {
    color: "#22d3ee",
    fontWeight: "600",
    fontSize: "0.875rem",
    margin: "0 0 0.5rem 0",
  },
  selectedList: {
    color: "#cbd5e1",
    fontSize: "0.875rem",
    margin: 0,
  },

  summaryCard: {
    background: "rgba(34, 197, 94, 0.08)",
    borderRadius: "1rem",
    padding: "1.5rem",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    marginBottom: "1.5rem"
  },
  summaryTitle: {
    color: "#22c55e",
    fontWeight: "700",
    fontSize: "1.125rem",
    margin: "0 0 1rem 0"
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
  },
  summaryLabel: {
    color: "#94a3b8",
    fontWeight: "500"
  },
  summaryValue: {
    color: "#e2e8f0",
    fontWeight: "600"
  },

  navigation: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  navButton: { 
    display: "flex", 
    alignItems: "center", 
    gap: "0.5rem", 
    padding: "0.875rem 1.5rem", 
    borderRadius: "0.75rem", 
    border: "none", 
    cursor: "pointer", 
    fontSize: "0.875rem",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  backButton: { 
    color: "#cbd5e1", 
    background: "rgba(30, 41, 59, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.2)"
  },
  nextButton: { 
    color: "white", 
    background: "linear-gradient(45deg, #8b5cf6, #06b6d4)", 
    fontWeight: "600",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)"
  },

  dots: { 
    display: "flex", 
    gap: "0.5rem" 
  },
  dot: { 
    width: "0.5rem", 
    height: "0.5rem", 
    borderRadius: "50%", 
    transition: "all 0.3s" 
  },
  dotActive: { 
    background: "linear-gradient(90deg, #8b5cf6, #06b6d4)", 
    width: "1.5rem",
    borderRadius: "9999px"
  },
  dotCompleted: { 
    background: "#22c55e" 
  },
  dotInactive: { 
    background: "#4b5563" 
  },
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

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { prefs, updatePrefs } = usePreferences();

  const [settings, setSettings] = useState({
    allergens: Array.isArray(prefs.allergens) ? prefs.allergens : [],
    inventory: prefs.user_inventory ?? true,
    dietType: prefs.diet_type || "any",
  });

  useEffect(() => {
    setSettings({
      allergens: Array.isArray(prefs.allergens) ? prefs.allergens : [],
      inventory: prefs.user_inventory ?? true,
      dietType: prefs.diet_type || "any",
    });
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

  const persistSettings = () => {
    updatePrefs({
      allergens: settings.allergens,
      user_inventory: !!settings.inventory,
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
      subtitle: "Let's personalize your meal planning experience with a few quick questions",
      icon: <Heart style={{ width: 32, height: 32, color: "#8b5cf6" }} />,
      content: (
        <div style={{ textAlign: "center" }}>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              We'll guide you through setting up your dietary preferences, allergens, and smart features. 
              This takes about 2 minutes and can be changed anytime in Settings.
            </p>
          </div>
          <div style={{ 
            color: "#94a3b8", 
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginTop: "1rem"
          }}>
            <span>3 quick steps</span>
            <span>•</span>
            <span>2 minutes</span>
            <span>•</span>
            <span>Skip anytime</span>
          </div>
        </div>
      ),
    },
    {
      id: "dietary",
      title: "Dietary Preferences",
      subtitle: "Tell us about your diet type and any restrictions you have",
      icon: <Utensils style={{ width: 32, height: 32, color: "#8b5cf6" }} />,
      content: (
        <div>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              Select your diet type and any allergens or restrictions. We'll use this to filter recipes and suggest meals that work for you.
            </p>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingInfo}>
              <div style={styles.settingIcon}>
                <Utensils size={20} />
              </div>
              <div>
                <h3 style={styles.settingTitle}>Diet Type</h3>
                <p style={styles.settingDesc}>Choose your preferred eating style</p>
              </div>
            </div>
            <select
              value={settings.dietType}
              onChange={(e) => setSettings(s => ({ ...s, dietType: e.target.value }))}
              style={styles.select}
            >
              {dietOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ ...styles.settingTitle, marginBottom: "1rem" }}>Allergens & Restrictions</h3>
            <p style={{ ...styles.settingDesc, marginBottom: "1rem" }}>
              Select any allergens or dietary restrictions to avoid
            </p>
            
            <div style={styles.allergenGrid}>
              {allergenOptions.map((a) => {
                const active = settings.allergens.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() =>
                      setSettings(prev => ({
                        ...prev,
                        allergens: prev.allergens.includes(a) 
                          ? prev.allergens.filter(x => x !== a) 
                          : [...prev.allergens, a],
                      }))
                    }
                    style={{
                      ...styles.allergenButton,
                      ...(active ? styles.allergenActive : styles.allergenInactive),
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>

            {settings.allergens.length > 0 && (
              <div style={styles.selectedAllergens}>
                <div style={styles.selectedTitle}>Selected restrictions:</div>
                <p style={styles.selectedList}>{settings.allergens.join(", ")}</p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "features",
      title: "Smart Features",
      subtitle: "Enable features to enhance your meal planning experience",
      icon: <Settings style={{ width: 32, height: 32, color: "#8b5cf6" }} />,
      content: (
        <div>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              These optional features help streamline your meal planning. You can always adjust these settings later.
            </p>
          </div>

          <div 
            style={{
              ...styles.settingItem,
              ...(settings.inventory ? styles.settingItemActive : {})
            }}
          >
            <div style={styles.settingInfo}>
              <div style={styles.settingIcon}>
                <Package size={20} />
              </div>
              <div>
                <h3 style={styles.settingTitle}>Inventory Tracking</h3>
                <p style={styles.settingDesc}>Keep track of your ingredients and get recipe suggestions based on what you have</p>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.inventory} 
              onChange={() => setSettings(p => ({ ...p, inventory: !p.inventory }))} 
            />
          </div>
        </div>
      ),
    },
    {
      id: "complete",
      title: "You're All Set!",
      subtitle: "Your meal planning experience has been personalized",
      icon: <Check style={{ width: 32, height: 32, color: "#22c55e" }} />,
      content: (
        <div style={{ textAlign: "center" }}>
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>Your Preferences Summary</h3>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Diet Type:</span>
              <span style={styles.summaryValue}>
                {dietOptions.find(d => d.value === settings.dietType)?.label || "No preference"}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Restrictions:</span>
              <span style={styles.summaryValue}>
                {settings.allergens.length > 0 ? settings.allergens.join(", ") : "None"}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Pantry Tracking:</span>
              <span style={styles.summaryValue}>
                {settings.inventory ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            You can modify any of these preferences anytime from the Settings page.
          </p>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    persistSettings();
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(s => s + 1);
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
        setCurrentStep(s => s - 1);
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

          {currentStep < 3 && (
            <button onClick={skipAll} style={styles.skipButton}>
              <span>Skip setup</span>
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressText}>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span style={styles.progressText}>
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </span>
          </div>

          <div style={styles.progressBar}>
            <div style={{ 
              ...styles.progressFill, 
              width: `${((currentStep + 1) / steps.length) * 100}%` 
            }} />
          </div>
        </div>

        <div style={{ 
          transition: "all 0.3s ease-in-out", 
          opacity: isTransitioning ? 0 : 1, 
          transform: isTransitioning ? "translateY(1rem)" : "translateY(0)" 
        }}>
          <div style={styles.contentCard}>
            <div style={styles.stepIcon}>
              {steps[currentStep].icon}
            </div>

            <h2 style={styles.stepTitle}>{steps[currentStep].title}</h2>
            <p style={styles.stepSubtitle}>{steps[currentStep].subtitle}</p>

            <div>{steps[currentStep].content}</div>
          </div>
        </div>

        <div style={styles.navigation}>
          <button 
            onClick={prevStep} 
            disabled={currentStep === 0} 
            style={{ 
              ...styles.navButton,
              ...styles.backButton,
              ...(currentStep === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {})
            }}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          <div style={styles.dots}>
            {steps.map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  ...styles.dot, 
                  ...(i === currentStep ? styles.dotActive : 
                      i < currentStep ? styles.dotCompleted : 
                      styles.dotInactive) 
                }} 
              />
            ))}
          </div>

          <button onClick={nextStep} style={{ ...styles.navButton, ...styles.nextButton }}>
            <span>{currentStep === steps.length - 1 ? "Get Started" : "Continue"}</span>
            {currentStep === steps.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}