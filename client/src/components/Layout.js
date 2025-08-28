import { Outlet } from 'react-router-dom';
import { 
  Calendar, 
  ShoppingCart,
  Utensils,
  Settings,
  Sparkles,
  Moon,
  Sun
} from 'lucide-react';
import { usePreferences } from '../contexts/PrefContext';

const sidebarStyles = {
  sidebar: {
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  width: '280px',
  background: 'linear-gradient(180deg, #0f172a, #1e293b)',
  borderRight: '1px solid rgba(148, 163, 184, 0.1)',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
},
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  logo: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.125rem',
    fontWeight: 'bold'
  },
  brandText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f8fafc',
    margin: 0
  },
  brandSub: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    color: '#94a3b8',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    fontSize: '0.875rem'
  },
  navItemActive: {
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    borderLeft: '3px solid #8b5cf6'
  },
  navItemDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  themeCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
};

  const Layout = () => {
  const { prefs, setPrefs } = usePreferences();


  const toggleTheme = () => {
    setPrefs({ ...prefs, theme: prefs.theme === 'dark' ? 'light' : 'dark' });
  };

  const getActiveNav = (path) => {
    return window.location.pathname.startsWith(path)
      ? sidebarStyles.navItemActive
      : {};
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
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
          <a href="/home" style={{...sidebarStyles.navItem, ...getActiveNav('/home')}}>
            <Calendar style={{width: '1rem', height: '1rem'}} />
            Weekly Planner
          </a>
          <button style={{...sidebarStyles.navItem, ...sidebarStyles.navItemDisabled}}>
            <ShoppingCart style={{width: '1rem', height: '1rem'}} />
            Groceries
          </button>
          <a href="/recipe/1" style={{...sidebarStyles.navItem, ...getActiveNav('/recipe')}}> 
            <Utensils style={{width: '1rem', height: '1rem'}} />
            Recipes
          </a>
          <a href="/settings" style={{...sidebarStyles.navItem, ...getActiveNav('/settings')}}>
            <Settings style={{width: '1rem', height: '1rem'}} />
            Settings
          </a>
        </nav>

        {/* Theme info card */}
        <div style={sidebarStyles.themeCard}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#f8fafc',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles style={{width: '1rem', height: '1rem', color: '#a78bfa'}} />
            Current Theme: {prefs.theme === 'dark' ? 'Dark' : 'Light'}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            lineHeight: '1.4'
          }}>
            Change in Settings
          </div>
        </div>

        {/* Dark mode switch */}
        <button 
          onClick={toggleTheme}
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            background: 'rgba(30, 41, 59, 0.6)',
            color: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          {prefs.theme === 'dark' ? (
            <Sun style={{width: '1rem', height: '1rem'}} />
          ) : (
            <Moon style={{width: '1rem', height: '1rem'}} />
          )}
          Toggle {prefs.theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '280px', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
