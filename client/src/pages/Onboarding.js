import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Moon, Sun, Package, ShoppingCart, Heart } from 'lucide-react';
import { usePreferences } from '../contexts/PrefContext';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  wrapper: {
    maxWidth: '42rem',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logo: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.125rem',
    fontWeight: 'bold'
  },
  logoText: {
    color: 'white',
    fontWeight: '600',
    margin: 0
  },
  logoSubtext: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    margin: 0
  },
  skipButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#9ca3af',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s',
    fontSize: '0.875rem'
  },
  progressContainer: {
    marginBottom: '2rem'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  progressText: {
    color: '#9ca3af',
    fontSize: '0.875rem'
  },
  progressBar: {
    width: '100%',
    height: '0.5rem',
    backgroundColor: '#374151',
    borderRadius: '9999px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
    borderRadius: '9999px',
    transition: 'width 0.3s'
  },
  contentCard: {
    background: 'rgba(31, 41, 55, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1.5rem',
    padding: '2rem',
    marginBottom: '2rem',
    transition: 'all 0.3s'
  },
  stepIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  },
  iconContainer: {
    width: '5rem',
    height: '5rem',
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a78bfa'
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    color: '#9ca3af',
    margin: 0
  },
  welcomeContent: {
    textAlign: 'center'
  },
  welcomeCard: {
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
    borderRadius: '1rem',
    padding: '2rem',
    marginBottom: '1.5rem'
  },
  welcomeText: {
    color: '#d1d5db',
    fontSize: '1.125rem',
    lineHeight: '1.7',
    margin: 0
  },
  welcomeStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    fontSize: '0.875rem',
    color: '#9ca3af'
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  themeOption: {
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center'
  },
  themeOptionDark: {
    borderColor: '#8b5cf6',
    background: 'linear-gradient(135deg, #1e293b, #334155)'
  },
  themeOptionLight: {
    borderColor: '#06b6d4',
    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    color: '#1f2937'
  },
  themeOptionInactive: {
    borderColor: '#4b5563',
    background: '#1f2937'
  },
  themeIcon: {
    width: '2rem',
    height: '2rem',
    margin: '0 auto 0.75rem'
  },
  themeTitle: {
    fontWeight: '500',
    margin: '0 0 0.25rem 0'
  },
  themeDesc: {
    fontSize: '0.875rem',
    margin: 0,
    opacity: 0.8
  },
  infoBox: {
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
    borderRadius: '0.75rem',
    padding: '1rem',
    marginBottom: '1.5rem'
  },
  infoText: {
    color: '#d1d5db',
    fontSize: '0.875rem',
    margin: 0
  },
  allergenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  allergenButton: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem'
  },
  allergenActive: {
    background: 'linear-gradient(45deg, #ef4444, #f97316)',
    borderColor: '#ef4444',
    color: 'white'
  },
  allergenInactive: {
    background: '#1f2937',
    borderColor: '#4b5563',
    color: '#d1d5db'
  },
  selectedInfo: {
    background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
    borderRadius: '0.75rem',
    padding: '1rem'
  },
  selectedTitle: {
    color: 'white',
    fontWeight: '500',
    margin: '0 0 0.5rem 0'
  },
  selectedText: {
    color: '#d1d5db',
    fontSize: '0.875rem',
    margin: 0
  },
  featureCard: {
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '1rem'
  },
  featureActive: {
    borderColor: '#8b5cf6',
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))'
  },
  featureInactive: {
    borderColor: '#4b5563',
    background: '#1f2937'
  },
  featureContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  featureIcon: {
    flexShrink: 0,
    width: '2rem',
    height: '2rem'
  },
  featureInfo: {
    flex: 1
  },
  featureHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  featureTitle: {
    color: 'white',
    fontWeight: '500',
    margin: 0
  },
  toggle: {
    width: '3rem',
    height: '1.5rem',
    borderRadius: '9999px',
    position: 'relative',
    cursor: 'pointer'
  },
  toggleActive: {
    background: '#8b5cf6'
  },
  toggleInactive: {
    background: '#4b5563'
  },
  toggleSwitch: {
    width: '1.25rem',
    height: '1.25rem',
    background: 'white',
    borderRadius: '50%',
    position: 'absolute',
    top: '0.125rem',
    transition: 'transform 0.3s'
  },
  toggleSwitchActive: {
    transform: 'translateX(1.75rem)'
  },
  toggleSwitchInactive: {
    transform: 'translateX(0.125rem)'
  },
  featureDesc: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    margin: 0,
    lineHeight: '1.4'
  },
  completeContent: {
    textAlign: 'center'
  },
  completeCard: {
    background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
    borderRadius: '1rem',
    padding: '2rem',
    marginBottom: '1.5rem'
  },
  completeTitle: {
    color: 'white',
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 1rem 0'
  },
  settingsList: {
    textAlign: 'left'
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem'
  },
  settingDot: {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%'
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '0.875rem'
  },
  backButton: {
    color: '#d1d5db',
    background: 'transparent'
  },
  backButtonDisabled: {
    color: '#4b5563',
    cursor: 'not-allowed'
  },
  nextButton: {
    color: 'white',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    fontWeight: '500'
  },
  dots: {
    display: 'flex',
    gap: '0.5rem'
  },
  dot: {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    transition: 'all 0.3s'
  },
  dotActive: {
    background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
    width: '1.5rem'
  },
  dotCompleted: {
    background: '#a78bfa'
  },
  dotInactive: {
    background: '#4b5563'
  },
  debugPanel: {
    marginTop: '2rem',
    padding: '1rem',
    background: 'rgba(17, 24, 39, 0.5)',
    borderRadius: '0.75rem'
  },
  debugTitle: {
    color: 'white',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
    fontSize: '0.875rem'
  },
  debugContent: {
    color: '#d1d5db',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    overflow: 'auto'
  }
};

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { prefs, updatePrefs } = usePreferences();

  const [settings, setSettings] = useState({
    allergens: prefs.allergens || [],
    inventory: prefs.user_inventory ?? true,
    shoppingList: prefs.shopping_list ?? false,
    darkMode: prefs.theme === "dark"
  });

  const handleThemeChange = (dark) => {
    setSettings((prev) => ({ ...prev, darkMode: dark }));
    updatePrefs({ theme: dark ? "dark" : "light" });
    document.body.setAttribute("data-theme", dark ? "dark" : "light");
  };

  const persistSettings = () => {
    updatePrefs({
      theme: settings.darkMode ? "dark" : "light",
      allergens: settings.allergens,
      user_inventory: !!settings.inventory,
      shopping_list: !!settings.shoppingList,
    });
  };

  const finishOnboarding = () => {
    persistSettings();
    window.location.href = "/dashboard";
  };

  useEffect(() => {
    setSettings({
      allergens: prefs.allergens || [],
      inventory: prefs.user_inventory ?? true,
      shoppingList: prefs.shopping_list ?? false,
      darkMode: prefs.theme === "dark",
    });
  }, [prefs]);

  const allergenOptions = ['Celiac', 'Diabetic', 'Nut Allergy', 'Dairy Free', 'Shellfish', 'Soy', 'Egg'];

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Meal Planner!',
      subtitle: 'Let\'s set up your perfect meal planning experience',
      icon: <Heart style={styles.featureIcon} />,
      content: (
        <div style={styles.welcomeContent}>
          <div style={styles.welcomeCard}>
            <p style={styles.welcomeText}>
              We'll guide you through a few quick preferences to personalize your meal planning journey. 
              This will help us recommend meals that fit your lifestyle perfectly.
            </p>
          </div>
          <div style={styles.welcomeStats}>
            <span>4 quick steps</span>
            <span>•</span>
            <span>2 minutes</span>
            <span>•</span>
            <span>Skip anytime</span>
          </div>
        </div>
      )
    },
    {
      id: 'theme',
      title: 'Choose Your Theme',
      subtitle: 'How do you prefer to view your meal plans?',
      icon: settings.darkMode ? <Moon style={styles.featureIcon} /> : <Sun style={styles.featureIcon} />,
      content: (
        <div>
          <div style={styles.themeGrid}>
            <button 
              onClick={() => handleThemeChange(true)}
              style={{
                ...styles.themeOption,
                ...(settings.darkMode ? styles.themeOptionDark : styles.themeOptionInactive)
              }}
            >
              <Moon style={{...styles.themeIcon, color: settings.darkMode ? '#a78bfa' : '#9ca3af'}} />
              <h3 style={{...styles.themeTitle, color: 'white'}}>Dark Mode</h3>
              <p style={{...styles.themeDesc, color: '#9ca3af'}}>Easy on the eyes, perfect for evening planning</p>
            </button>
            
            <button
              onClick={() => handleThemeChange(false)}
              style={{
                ...styles.themeOption,
                ...(!settings.darkMode ? styles.themeOptionLight : styles.themeOptionInactive)
              }}
            >
              <Sun style={{...styles.themeIcon, color: !settings.darkMode ? '#eab308' : '#9ca3af'}} />
              <h3 style={{...styles.themeTitle, color: !settings.darkMode ? '#1f2937' : 'white'}}>Light Mode</h3>
              <p style={{...styles.themeDesc, color: !settings.darkMode ? '#4b5563' : '#9ca3af'}}>Clean and bright, great for daytime use</p>
            </button>
          </div>
          
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              💡 Don't worry, you can always change this later in settings
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'health',
      title: 'Health & Dietary Needs',
      subtitle: 'Help us filter meals that work for you',
      icon: <Heart style={styles.featureIcon} />,
      content: (
        <div>
          <div style={{...styles.infoBox, background: 'linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(249, 115, 22, 0.1))'}}>
            <p style={styles.infoText}>
              🏥 Select any allergens or health conditions so we can filter out meals that might not be suitable for you
            </p>
          </div>
          
          <div style={styles.allergenGrid}>
            {allergenOptions.map((allergen) => (
              <button
                key={allergen}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  allergens: prev.allergens.includes(allergen)
                    ? prev.allergens.filter(a => a !== allergen)
                    : [...prev.allergens, allergen]
                }))}
                style={{
                  ...styles.allergenButton,
                  ...(settings.allergens.includes(allergen) ? styles.allergenActive : styles.allergenInactive)
                }}
              >
                {settings.allergens.includes(allergen) && <Check style={{width: '1rem', height: '1rem'}} />}
                <span>{allergen}</span>
              </button>
            ))}
          </div>

          {settings.allergens.length > 0 && (
            <div style={styles.selectedInfo}>
              <h4 style={styles.selectedTitle}>Selected conditions:</h4>
              <p style={styles.selectedText}>{settings.allergens.join(', ')}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'features',
      title: 'Enable Smart Features',
      subtitle: 'Unlock powerful meal planning tools',
      icon: <Package style={styles.featureIcon} />,
      content: (
        <div>
          <div 
            style={{
              ...styles.featureCard,
              ...(settings.inventory ? styles.featureActive : styles.featureInactive)
            }}
            onClick={() => setSettings(prev => ({ ...prev, inventory: !prev.inventory }))}
          >
            <div style={styles.featureContent}>
              <Package style={{...styles.featureIcon, color: settings.inventory ? '#a78bfa' : '#9ca3af'}} />
              <div style={styles.featureInfo}>
                <div style={styles.featureHeader}>
                  <h3 style={styles.featureTitle}>Inventory Tracking</h3>
                  <div style={{...styles.toggle, ...(settings.inventory ? styles.toggleActive : styles.toggleInactive)}}>
                    <div style={{...styles.toggleSwitch, ...(settings.inventory ? styles.toggleSwitchActive : styles.toggleSwitchInactive)}}></div>
                  </div>
                </div>
                <p style={styles.featureDesc}>Keep track of ingredients you have at home. We'll suggest meals based on what's available and remind you when items are running low.</p>
              </div>
            </div>
          </div>

          <div 
            style={{
              ...styles.featureCard,
              ...(settings.shoppingList ? {borderColor: '#06b6d4', background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.2), rgba(34, 197, 94, 0.2))'} : styles.featureInactive)
            }}
            onClick={() => setSettings(prev => ({ ...prev, shoppingList: !prev.shoppingList }))}
          >
            <div style={styles.featureContent}>
              <ShoppingCart style={{...styles.featureIcon, color: settings.shoppingList ? '#22d3ee' : '#9ca3af'}} />
              <div style={styles.featureInfo}>
                <div style={styles.featureHeader}>
                  <h3 style={styles.featureTitle}>Smart Shopping Lists</h3>
                  <div style={{...styles.toggle, background: settings.shoppingList ? '#06b6d4' : '#4b5563'}}>
                    <div style={{...styles.toggleSwitch, ...(settings.shoppingList ? styles.toggleSwitchActive : styles.toggleSwitchInactive)}}></div>
                  </div>
                </div>
                <p style={styles.featureDesc}>Automatically generate shopping lists from your meal plans. Organize by store sections and never forget an ingredient again.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      subtitle: 'Ready to start your meal planning journey',
      icon: <Check style={styles.featureIcon} />,
      content: (
        <div style={styles.completeContent}>
          <div style={styles.completeCard}>
            <h3 style={styles.completeTitle}>Perfect! Here's what we've set up:</h3>
            <div style={styles.settingsList}>
              <div style={styles.settingItem}>
                <div style={{...styles.settingDot, background: '#a78bfa'}}></div>
                <span style={{color: '#d1d5db'}}>Theme: {settings.darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              {settings.allergens.length > 0 && (
                <div style={styles.settingItem}>
                  <div style={{...styles.settingDot, background: '#f87171'}}></div>
                  <span style={{color: '#d1d5db'}}>Health filters: {settings.allergens.length} condition{settings.allergens.length > 1 ? 's' : ''}</span>
                </div>
              )}
              <div style={styles.settingItem}>
                <div style={{...styles.settingDot, background: '#22d3ee'}}></div>
                <span style={{color: '#d1d5db'}}>Inventory: {settings.inventory ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div style={styles.settingItem}>
                <div style={{...styles.settingDot, background: '#4ade80'}}></div>
                <span style={{color: '#d1d5db'}}>Shopping Lists: {settings.shoppingList ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
          <p style={{color: '#d1d5db', margin: 0}}>
            You can always change these preferences later in your settings. Let's start planning some delicious meals!
          </p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    persistSettings(); // always persist current settings

    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
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
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  //Change to add toasts
  const skipAll = () => {
    persistSettings();
    finishOnboarding();
  };

  const currentStepData = steps[currentStep];

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoSection}>
            <div style={styles.logo}>MP</div>
            <div>
              <h1 style={styles.logoText}>Meal Planner</h1>
              <p style={styles.logoSubtext}>Setup your preferences</p>
            </div>
          </div>
          
          {currentStep < steps.length - 1 && (
            <button
              onClick={skipAll}
              style={{
                ...styles.skipButton,
                ':hover': { color: 'white' }
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
            >
              <ChevronRight style={{width: '1rem', height: '1rem'}} />
              <span>Skip all</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressHeader}>
            <span style={styles.progressText}>Step {currentStep + 1} of {steps.length}</span>
            <span style={styles.progressText}>{Math.round((currentStep + 1) / steps.length * 100)}%</span>
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${(currentStep + 1) / steps.length * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          transition: 'all 0.3s',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateX(1rem)' : 'translateX(0)'
        }}>
          <div style={styles.contentCard}>
            {/* Step Icon */}
            <div style={styles.stepIcon}>
              <div style={styles.iconContainer}>
                {currentStepData.icon}
              </div>
            </div>

            {/* Step Title */}
            <div style={styles.stepTitle}>
              <h2 style={styles.title}>{currentStepData.title}</h2>
              <p style={styles.subtitle}>{currentStepData.subtitle}</p>
            </div>

            {/* Step Content */}
            <div>
              {currentStepData.content}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={styles.navigation}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              ...styles.navButton,
              ...(currentStep === 0 ? styles.backButtonDisabled : styles.backButton)
            }}
            onMouseEnter={(e) => {
              if (currentStep > 0) {
                e.target.style.background = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep > 0) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <ChevronLeft style={{width: '1.25rem', height: '1.25rem'}} />
            <span>Back</span>
          </button>

          <div style={styles.dots}>
            {steps.map((_, index) => (
              <div
                key={index}
                style={{
                  ...styles.dot,
                  ...(index === currentStep 
                    ? styles.dotActive 
                    : index < currentStep 
                    ? styles.dotCompleted 
                    : styles.dotInactive
                  )
                }}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            style={styles.nextButton}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(45deg, #7c3aed, #0891b2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(45deg, #8b5cf6, #06b6d4)';
            }}
          >
            <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
            {currentStep === steps.length - 1 ? (
              <Check style={{width: '1.25rem', height: '1.25rem'}} />
            ) : (
              <ChevronRight style={{width: '1.25rem', height: '1.25rem'}} />
            )}
          </button>
        </div>

        {/* Debug Panel */}
        <div style={styles.debugPanel}>
          <h4 style={styles.debugTitle}>Current Settings (Debug):</h4>
          <div style={styles.debugContent}>
            {JSON.stringify(settings, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
}