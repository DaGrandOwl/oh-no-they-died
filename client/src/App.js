import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home.js';
import Dashboard from './pages/Dashboard.js';
import About from './pages/About.js';
import RecipeID from './pages/RecipeID.js';
import RecipeList from './pages/RecipeList.js';
import Onboarding from './pages/Onboarding.js';
import Settings from './pages/Settings.js';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout.js';

// Create Context for Settings
export const SettingsContext = createContext();

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings 
      ? JSON.parse(savedSettings) 
      : {
          theme: 'dark',
          allergens: [],
          user_inventory: true,
          shopping_list: false,
        };
  });

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('appSettings', JSON.stringify(updated));
    
    // Apply theme immediately
    if (newSettings.theme) {
      document.body.classList.toggle('dark', newSettings.theme === 'dark');
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Routes with Layout (Sidebar) */}
          <Route path="/" element={<Layout />}>
            <Route path="/settings" element={<Settings />} />
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/recipe" element={<RecipeList />} />
            <Route path="/recipe/:id" element={<RecipeID />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;