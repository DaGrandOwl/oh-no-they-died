import React, { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../App';

// Import shared styles
import { buttonPrimary, inputStyle } from '../Styles';

const allergenOptions = ['Celiac', 'Diabetic', 'Nut Allergy', 'Dairy Free', 'Shellfish', 'Soy', 'Egg'];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleAllergenToggle = (allergen) => {
    const newAllergens = settings.allergens.includes(allergen)
      ? settings.allergens.filter(a => a !== allergen)
      : [...settings.allergens, allergen];
    
    updateSettings({ allergens: newAllergens });
  };

  const handleToggle = (key, value) => {
    updateSettings({ [key]: value });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = () => {
    // Password change logic would go here
    console.log('Password change requested');
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Logout logic would go here
  };

  // Theme-dependent styles
  const themeStyles = {
    container: {
      minHeight: '100vh',
      background: settings.theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)' 
        : 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 50%, #cffafe 100%)',
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
      color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
      margin: '0 0 0.5rem 0'
    },
    subtitle: {
      color: settings.theme === 'dark' ? '#d1d5db' : '#64748b',
      margin: 0
    },
    tabContainer: {
      background: 'rgba(31, 41, 55, 0.5)',
      backdropFilter: 'blur(10px)',
      borderRadius: '1rem 1rem 0 0',
      borderBottom: '1px solid #374151'
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
      borderBottom: '2px solid transparent',
      color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280'
    },
    tabActive: {
      color: settings.theme === 'dark' ? 'white' : '#1e293b',
      borderBottomColor: '#8b5cf6',
      background: 'rgba(55, 65, 81, 0.3)'
    },
    content: {
      background: 'rgba(31, 41, 55, 0.5)',
      backdropFilter: 'blur(10px)',
      borderRadius: '0 0 1rem 1rem',
      padding: '1.5rem'
    }
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: '1.5rem',
        width: '2.75rem',
        alignItems: 'center',
        borderRadius: '9999px',
        cursor: 'pointer',
        border: 'none',
        transition: 'background-color 0.3s',
        background: enabled ? 'linear-gradient(45deg, #8b5cf6, #06b6d4)' : '#4b5563'
      }}
    >
      <span
        style={{
          display: 'inline-block',
          height: '1rem',
          width: '1rem',
          borderRadius: '50%',
          background: 'white',
          transition: 'transform 0.3s',
          position: 'absolute',
          transform: enabled ? 'translateX(1.5rem)' : 'translateX(0.25rem)'
        }}
      />
    </button>
  );

  const SettingItem = ({ title, description, children }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 0',
      borderBottom: '1px solid #374151'
    }}>
      <div style={{flex: 1}}>
        <h3 style={{
          color: settings.theme === 'dark' ? 'white' : '#1e293b',
          fontWeight: '500',
          margin: '0 0 0.25rem 0'
        }}>{title}</h3>
        {description && <p style={{
          color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: '0.875rem',
          margin: 0
        }}>{description}</p>}
      </div>
      <div style={{marginLeft: '1rem'}}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={themeStyles.container}>
      <div style={themeStyles.wrapper}>
        {/* Header */}
        <div style={themeStyles.header}>
          <h1 style={themeStyles.title}>Settings</h1>
          <p style={themeStyles.subtitle}>Manage your preferences and account settings</p>
        </div>

        {/* Tab Navigation */}
        <div style={themeStyles.tabContainer}>
          <div style={{display: 'flex'}}>
            <button
              onClick={() => setActiveTab('general')}
              style={{
                ...themeStyles.tab,
                ...(activeTab === 'general' ? themeStyles.tabActive : {})
              }}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              style={{
                ...themeStyles.tab,
                ...(activeTab === 'preferences' ? themeStyles.tabActive : {})
              }}
            >
              Preferences
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={themeStyles.content}>
          {activeTab === 'general' && (
            <div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
                  margin: '0 0 1rem 0'
                }}>General Settings</h2>
                
                <SettingItem
                  title="Dark Mode"
                  description="Toggle between light and dark theme"
                >
                  <ToggleSwitch
                    enabled={settings.theme === 'dark'}
                    onChange={(enabled) => handleToggle('theme', enabled ? 'dark' : 'light')}
                  />
                </SettingItem>

                <SettingItem
                  title="Inventory Tracking"
                  description="Keep track of your ingredients and supplies"
                >
                  <ToggleSwitch
                    enabled={settings.user_inventory}
                    onChange={(enabled) => handleToggle('user_inventory', enabled)}
                  />
                </SettingItem>

                <SettingItem
                  title="Shopping List"
                  description="Generate shopping lists from your meal plans"
                >
                  <ToggleSwitch
                    enabled={settings.shopping_list}
                    onChange={(enabled) => handleToggle('shopping_list', enabled)}
                  />
                </SettingItem>
              </div>

              <div style={{marginTop: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
                  margin: '0 0 1rem 0'
                }}>Security</h3>
                
                <div>
                  <div style={{marginBottom: '1rem'}}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563',
                      margin: '0 0 0.5rem 0'
                    }}>Current Password</label>
                    <div style={{position: 'relative'}}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.current}
                        onChange={(e) => handlePasswordChange('current', e.target.value)}
                        style={inputStyle}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'color 0.3s'
                        }}
                      >
                        {showPassword ? <EyeOff style={{width: '1.25rem', height: '1.25rem'}} /> : <Eye style={{width: '1.25rem', height: '1.25rem'}} />}
                      </button>
                    </div>
                  </div>

                  <div style={{marginBottom: '1rem'}}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563',
                      margin: '0 0 0.5rem 0'
                    }}>New Password</label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => handlePasswordChange('new', e.target.value)}
                      style={inputStyle}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div style={{marginBottom: '1rem'}}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563',
                      margin: '0 0 0.5rem 0'
                    }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                      style={inputStyle}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button 
                    style={buttonPrimary}
                    onClick={handlePasswordSubmit}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <div style={{marginBottom: '2rem'}}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
                  margin: '0 0 1rem 0'
                }}>Health & Dietary Preferences</h2>
                
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
                    margin: '0 0 1rem 0'
                  }}>Allergens & Health Issues</h3>
                  <p style={{
                    color: settings.theme === 'dark' ? '#9ca3af' : '#6b7280', 
                    fontSize: '0.875rem', 
                    marginBottom: '1rem'
                  }}>
                    Select any allergens or health conditions to filter meal recommendations
                  </p>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    {allergenOptions.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => handleAllergenToggle(allergen)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: '1px solid',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          fontSize: '0.875rem',
                          background: settings.allergens.includes(allergen) 
                            ? 'linear-gradient(45deg, #8b5cf6, #06b6d4)' 
                            : '#374151',
                          borderColor: settings.allergens.includes(allergen) 
                            ? '#8b5cf6' 
                            : '#4b5563',
                          color: settings.allergens.includes(allergen) 
                            ? 'white' 
                            : (settings.theme === 'dark' ? '#d1d5db' : '#4b5563')
                        }}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(55, 65, 81, 0.3)',
                    borderRadius: '0.5rem'
                  }}>
                    <h4 style={{
                      color: settings.theme === 'dark' ? 'white' : '#1e293b',
                      fontWeight: '500',
                      margin: '0 0 0.5rem 0'
                    }}>Selected: </h4>
                    <p style={{
                      color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563',
                      margin: 0
                    }}>
                      {settings.allergens.length > 0 
                        ? settings.allergens.join(', ') 
                        : 'None selected'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #374151'
          }}>
            <button
              onClick={handleLogout}
              style={{
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
              }}
            >
              <Shield style={{width: '1.25rem', height: '1.25rem'}} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}