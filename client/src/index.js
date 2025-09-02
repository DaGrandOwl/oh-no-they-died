import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
//contexts
import { PrefProvider } from './contexts/PrefContext.js';
import { AuthProvider } from './contexts/AuthContext.js';
import { PlanProvider } from './contexts/PlanContext.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <PrefProvider>
        <PlanProvider>
        <App />
        </PlanProvider>
      </PrefProvider>
    </AuthProvider>
  </React.StrictMode>
);