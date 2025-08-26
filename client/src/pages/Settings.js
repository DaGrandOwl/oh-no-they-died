import { useState } from 'react';
import { Settings, User, Shield, Eye, EyeOff, ChevronRight } from 'lucide-react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  wrapper: {
    maxWidth: '64rem',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    color: '#d1d5db',
    margin: 0
  },
  tabContainer: {
    background: 'rgba(31, 41, 55, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem 1rem 0 0',
    borderBottom: '1px solid #374151'
  },
  tabNav: {
    display: 'flex'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    fontWeight: '500',
    transition: 'all 0.3s',
    border: 'none',
    cursor: 'pointer',
    background: 'none',
    borderBottom: '2px solid transparent'
  },
  tabActive: {
    color: 'white',
    borderBottomColor: '#8b5cf6',
    background: 'rgba(55, 65, 81, 0.3)'
  },
  tabInactive: {
    color: '#9ca3af'
  },
  tabIcon: {
    width: '1.25rem',
    height: '1.25rem',
    marginRight: '0.5rem'
  },
  content: {
    background: 'rgba(31, 41, 55, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '0 0 1rem 1rem',
    padding: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'white',
    margin: '0 0 1rem 0'
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 0',
    borderBottom: '1px solid #374151'
  },
  settingInfo: {
    flex: 1
  },
  settingTitle: {
    color: 'white',
    fontWeight: '500',
    margin: '0 0 0.25rem 0'
  },
  settingDesc: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    margin: 0
  },
  settingControl: {
    marginLeft: '1rem'
  },
  toggle: {
    position: 'relative',
    display: 'inline-flex',
    height: '1.5rem',
    width: '2.75rem',
    alignItems: 'center',
    borderRadius: '9999px',
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.3s'
  },
  toggleActive: {
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)'
  },
  toggleInactive: {
    background: '#4b5563'
  },
  toggleSwitch: {
    display: 'inline-block',
    height: '1rem',
    width: '1rem',
    borderRadius: '50%',
    background: 'white',
    transition: 'transform 0.3s',
    position: 'absolute'
  },
  toggleSwitchActive: {
    transform: 'translateX(1.5rem)'
  },
  toggleSwitchInactive: {
    transform: 'translateX(0.25rem)'
  },
  securitySection: {
    marginTop: '2rem'
  },
  securityTitle: {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: 'white',
    margin: '0 0 1rem 0'
  },
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#d1d5db',
    margin: '0 0 0.5rem 0'
  },
  inputContainer: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '0.5rem 1rem',
    background: '#374151',
    border: '1px solid #4b5563',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.3s'
  },
  inputFocus: {
    borderColor: '#8b5cf6',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)'
  },
  passwordToggle: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s'
  },
  button: {
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '0.875rem'
  },
  allergenSection: {
    marginBottom: '2rem'
  },
  allergenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  allergenButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '0.875rem'
  },
  allergenActive: {
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    borderColor: '#8b5cf6',
    color: 'white'
  },
  allergenInactive: {
    background: '#374151',
    borderColor: '#4b5563',
    color: '#d1d5db'
  },
  selectedBox: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(55, 65, 81, 0.3)',
    borderRadius: '0.5rem'
  },
  selectedTitle: {
    color: 'white',
    fontWeight: '500',
    margin: '0 0 0.5rem 0'
  },
  selectedText: {
    color: '#d1d5db',
    margin: 0
  },
  advancedSection: {
    marginTop: '1.5rem'
  },
  advancedTitle: {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: 'white',
    margin: '0 0 1rem 0'
  },
  advancedItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    background: 'rgba(55, 65, 81, 0.3)',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background 0.3s',
    marginBottom: '1rem'
  },
  advancedInfo: {
    flex: 1
  },
  advancedItemTitle: {
    color: 'white',
    fontWeight: '500',
    margin: '0 0 0.25rem 0'
  },
  advancedItemDesc: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    margin: 0
  },
  logoutSection: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #374151'
  },
  logoutButton: {
    background: '#dc2626',
    color: 'white',
    padding: '0.5rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  debugPanel: {
    marginTop: '2rem',
    padding: '1rem',
    background: 'rgba(17, 24, 39, 0.5)',
    borderRadius: '0.5rem'
  },
  debugTitle: {
    color: 'white',
    fontWeight: '500',
    margin: '0 0 0.5rem 0'
  },
  debugContent: {
    color: '#d1d5db',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    overflow: 'auto'
  }
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    allergens: [],
    inventory: true,
    shoppingList: false,
    darkMode: true,
    password: '',
    newPassword: '',
    confirmPassword: ''
  });

  const allergenOptions = ['Celiac', 'Diabetic', 'Nut Allergy', 'Dairy Free', 'Shellfish', 'Soy', 'Egg'];
  const [showPassword, setShowPassword] = useState(false);

  const handleAllergenToggle = (allergen) => {
    setSettings(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      style={{
        ...styles.toggle,
        ...(enabled ? styles.toggleActive : styles.toggleInactive)
      }}
    >
      <span
        style={{
          ...styles.toggleSwitch,
          ...(enabled ? styles.toggleSwitchActive : styles.toggleSwitchInactive)
        }}
      />
    </button>
  );

  const SettingItem = ({ title, description, children }) => (
    <div style={styles.settingItem}>
      <div style={styles.settingInfo}>
        <h3 style={styles.settingTitle}>{title}</h3>
        {description && <p style={styles.settingDesc}>{description}</p>}
      </div>
      <div style={styles.settingControl}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Manage your preferences and account settings</p>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <div style={styles.tabNav}>
            <button
              onClick={() => setActiveTab('general')}
              style={{
                ...styles.tab,
                ...(activeTab === 'general' ? styles.tabActive : styles.tabInactive)
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'general') {
                  e.target.style.color = 'white';
                  e.target.style.background = 'rgba(55, 65, 81, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'general') {
                  e.target.style.color = '#9ca3af';
                  e.target.style.background = 'none';
                }
              }}
            >
              <Settings style={styles.tabIcon} />
              General
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              style={{
                ...styles.tab,
                ...(activeTab === 'preferences' ? styles.tabActive : styles.tabInactive)
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'preferences') {
                  e.target.style.color = 'white';
                  e.target.style.background = 'rgba(55, 65, 81, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'preferences') {
                  e.target.style.color = '#9ca3af';
                  e.target.style.background = 'none';
                }
              }}
            >
              <User style={styles.tabIcon} />
              Preferences
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'general' && (
            <div>
              <div>
                <h2 style={styles.sectionTitle}>General Settings</h2>
                
                <SettingItem
                  title="Dark Mode"
                  description="Toggle between light and dark theme"
                >
                  <ToggleSwitch
                    enabled={settings.darkMode}
                    onChange={() => handleToggle('darkMode')}
                  />
                </SettingItem>

                <SettingItem
                  title="Inventory Tracking"
                  description="Keep track of your ingredients and supplies"
                >
                  <ToggleSwitch
                    enabled={settings.inventory}
                    onChange={() => handleToggle('inventory')}
                  />
                </SettingItem>

                <SettingItem
                  title="Shopping List"
                  description="Generate shopping lists from your meal plans"
                >
                  <ToggleSwitch
                    enabled={settings.shoppingList}
                    onChange={() => handleToggle('shoppingList')}
                  />
                </SettingItem>
              </div>

              <div style={styles.securitySection}>
                <h3 style={styles.securityTitle}>Security</h3>
                
                <div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Current Password</label>
                    <div style={styles.inputContainer}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={settings.password}
                        onChange={(e) => handlePasswordChange('password', e.target.value)}
                        style={styles.input}
                        placeholder="Enter current password"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#4b5563';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                        onMouseEnter={(e) => e.target.style.color = 'white'}
                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                      >
                        {showPassword ? <EyeOff style={{width: '1.25rem', height: '1.25rem'}} /> : <Eye style={{width: '1.25rem', height: '1.25rem'}} />}
                      </button>
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                      type="password"
                      value={settings.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      style={styles.input}
                      placeholder="Enter new password"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#4b5563';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm New Password</label>
                    <input
                      type="password"
                      value={settings.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      style={styles.input}
                      placeholder="Confirm new password"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8b5cf6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#4b5563';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <button 
                    style={styles.button}
                    onMouseEnter={(e) => e.target.style.background = 'linear-gradient(45deg, #7c3aed, #0891b2)'}
                    onMouseLeave={(e) => e.target.style.background = 'linear-gradient(45deg, #8b5cf6, #06b6d4)'}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <div style={styles.allergenSection}>
                <h2 style={styles.sectionTitle}>Health & Dietary Preferences</h2>
                
                <div>
                  <h3 style={styles.securityTitle}>Allergens & Health Issues</h3>
                  <p style={{color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem'}}>
                    Select any allergens or health conditions to filter meal recommendations
                  </p>
                  
                  <div style={styles.allergenGrid}>
                    {allergenOptions.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => handleAllergenToggle(allergen)}
                        style={{
                          ...styles.allergenButton,
                          ...(settings.allergens.includes(allergen) ? styles.allergenActive : styles.allergenInactive)
                        }}
                        onMouseEnter={(e) => {
                          if (!settings.allergens.includes(allergen)) {
                            e.target.style.background = '#4b5563';
                            e.target.style.borderColor = '#6b7280';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!settings.allergens.includes(allergen)) {
                            e.target.style.background = '#374151';
                            e.target.style.borderColor = '#4b5563';
                          }
                        }}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>

                  <div style={styles.selectedBox}>
                    <h4 style={styles.selectedTitle}>Selected: </h4>
                    <p style={styles.selectedText}>
                      {settings.allergens.length > 0 
                        ? settings.allergens.join(', ') 
                        : 'None selected'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div style={styles.advancedSection}>
                <h3 style={styles.advancedTitle}>Advanced Settings</h3>
                <div>
                  <div 
                    style={styles.advancedItem}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(55, 65, 81, 0.4)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(55, 65, 81, 0.3)'}
                  >
                    <div style={styles.advancedInfo}>
                      <h4 style={styles.advancedItemTitle}>Notification Preferences</h4>
                      <p style={styles.advancedItemDesc}>Manage email and push notifications</p>
                    </div>
                    <ChevronRight style={{width: '1.25rem', height: '1.25rem', color: '#9ca3af'}} />
                  </div>

                  <div 
                    style={styles.advancedItem}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(55, 65, 81, 0.4)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(55, 65, 81, 0.3)'}
                  >
                    <div style={styles.advancedInfo}>
                      <h4 style={styles.advancedItemTitle}>Data Export</h4>
                      <p style={styles.advancedItemDesc}>Download your meal plans and preferences</p>
                    </div>
                    <ChevronRight style={{width: '1.25rem', height: '1.25rem', color: '#9ca3af'}} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div style={styles.logoutSection}>
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.background = '#dc2626'}
            >
              <Shield style={{width: '1.25rem', height: '1.25rem'}} />
              Logout
            </button>
          </div>

          {/* Debug Info */}
          <div style={styles.debugPanel}>
            <h4 style={styles.debugTitle}>Current Settings (Debug):</h4>
            <div style={styles.debugContent}>
              {JSON.stringify(settings, null, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}