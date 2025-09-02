import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cardStyle } from "../components/Styles";
import logo from '../components/logo.png';

const About = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
      color: "#f8fafc",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute",
        top: "10%",
        right: "5%",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "15%",
        left: "5%",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
        zIndex: 0
      }}></div>

      {/* Back button */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "1000px",
        marginBottom: "3rem",
        position: "relative",
        zIndex: 10
      }}>
        <button 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "0.875rem",
            fontWeight: "500",
            background: "rgba(30, 41, 59, 0.6)",
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.2)"
          }}
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={16} /> Back
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            fontWeight: "bold",
            color: "#fff",
          }}><div><img src={logo} width={75} height={75} alt='MP' /></div></div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>About Meal Planner</h1>
        </div>
      </header>

      {/* Main content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        maxWidth: "1000px",
        width: "100%",
        position: "relative",
        zIndex: 10
      }}>
        {/* Project description */}
        <div style={cardStyle}>
          <h2 style={{ 
            margin: "0 0 1rem 0", 
            fontSize: "1.75rem",
            background: "linear-gradient(45deg, #ef4444, #8b5cf6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}>
            About The Project
          </h2>
          <p style={{ color: "#e2e8f0", lineHeight: "1.6", margin: "0 0 1rem 0" }}>
          Meal Planner is a project submission to Scholastica International Tech Summit 2025, Innovators' Arena segment.
          </p>
          <p style={{ color: "#e2e8f0", lineHeight: "1.6", margin: 0 }}>
            This website was built with React and utilizes Vercel for Frontend hosting, Render for backend server, and Aiven for MySQL database server
          </p> 
        </div>

        {/* Team section */}
        <div style={cardStyle}>
          <h2 style={{ 
            margin: "0 0 1.5rem 0", 
            fontSize: "1.75rem",
            background: "linear-gradient(45deg, #06b6d4, #8b5cf6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}>
            Our Team
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(200px, 1fr))",
            gap: "1.5rem"
          }}>
            {/* Team member 1 */}
            <div style={{
              padding: "1.5rem",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", textAlign: "center", color: "#f8fafc" }}>Yaad Nihan</h3>
              <p style={{ 
                margin: "0 0 1rem 0", 
                textAlign: "center", 
                color: "#94a3b8",
                fontSize: "0.875rem"
              }}>Backend Developer</p>
              <p style={{ 
                color: "#cbd5e1", 
                lineHeight: "1.5", 
                margin: "0 0 1rem 0",
                fontSize: "0.875rem"
              }}>
                Set up the backend, database as well as the frontend logic.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              </div>
            </div>

            {/* Team member 2 */}
            <div style={{
              padding: "1.5rem",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", textAlign: "center", color: "#f8fafc" }}>Samara Sharleez</h3>
              <p style={{ 
                margin: "0 0 1rem 0", 
                textAlign: "center", 
                color: "#94a3b8",
                fontSize: "0.875rem"
              }}>Creative Designer</p>
              <p style={{ 
                color: "#cbd5e1", 
                lineHeight: "1.5", 
                margin: "0 0 1rem 0",
                fontSize: "0.875rem"
              }}>
                Provided the creative template and theme for the website.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              </div>
            </div>

            {/* Team member 3 */}
            <div style={{
              padding: "1.5rem",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", textAlign: "center", color: "#f8fafc" }}>Sifat Ullah</h3>
              <p style={{ 
                margin: "0 0 1rem 0", 
                textAlign: "center", 
                color: "#94a3b8",
                fontSize: "0.875rem"
              }}>Nutritionist</p>
              <p style={{ 
                color: "#cbd5e1", 
                lineHeight: "1.5", 
                margin: "0 0 1rem 0",
                fontSize: "0.875rem"
              }}>
                Ate stuff.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              </div>
            </div>

            {/* Team member 4 */}
            <div style={{
              padding: "1.5rem",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.1)"
            }}>
              <h3 style={{ margin: "0 0 0.5rem 0", textAlign: "center", color: "#f8fafc" }}>Aryan Hassan</h3>
              <p style={{ 
                margin: "0 0 1rem 0", 
                textAlign: "center", 
                color: "#94a3b8",
                fontSize: "0.875rem"
              }}>Frontend Developer</p>
              <p style={{ 
                color: "#cbd5e1", 
                lineHeight: "1.5", 
                margin: "0 0 1rem 0",
                fontSize: "0.875rem"
              }}>
                Set up the frontend.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;