import { Outlet, NavLink } from "react-router-dom";
import {
  Croissant,
  Utensils,
  Settings,
  Home,
} from "lucide-react";

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

const Layout = () => {
  const navLinkStyle = ({ isActive }) => ({
    ...sidebarStyles.navItem,
    ...(isActive ? sidebarStyles.navItemActive : {}),
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={sidebarStyles.sidebar}>
        <div style={sidebarStyles.brand}>
          <div style={sidebarStyles.logo}>MP</div>
          <div>
            <div style={sidebarStyles.brandText}>Meal Planner</div>
            <div style={sidebarStyles.brandSub}>Stay on track, effortlessly</div>
          </div>
        </div>
        <nav style={sidebarStyles.nav}>
          <NavLink to="/dashboard" style={navLinkStyle}>
            <Home style={{ width: "1rem", height: "1rem" }} />
            Dashboard
          </NavLink>

          <NavLink to="/inventory" style={navLinkStyle}>
            <Croissant style={{ width: "1rem", height: "1rem" }} />
            Pantry
          </NavLink>

          <NavLink to="/recipe" style={navLinkStyle}>
            <Utensils style={{ width: "1rem", height: "1rem" }} />
            Recipes
          </NavLink>

          <NavLink to="/settings" style={navLinkStyle}>
            <Settings style={{ width: "1rem", height: "1rem" }} />
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: "280px", overflow: "auto", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;