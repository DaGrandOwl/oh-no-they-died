import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Star, Heart, Clock, Users } from "lucide-react";
import { buttonPrimary, cardStyle } from "../components/Styles";

const StartPage = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [animationState, setAnimationState] = useState("entering");

  // Features to cycle through in the hero section
  const features = [
    {
      title: "Plan Your Meals",
      description: "Effortlessly organize your weekly meals with our intuitive planner.",
      icon: <Heart size={24} />,
      color: "#ef4444",
    },
    {
      title: "Save Time",
      description: "Reduce decision fatigue and shopping time with organized meal plans.",
      icon: <Clock size={24} />,
      color: "#06b6d4",
    },
    {
      title: "Eat Healthier",
      description: "Make better food choices with planned, balanced meals throughout the week.",
      icon: <Star size={24} />,
      color: "#8b5cf6",
    },
    {
      title: "For Everyone",
      description: "Perfect for individuals, couples, and families of all sizes.",
      icon: <Users size={24} />,
      color: "#10b981",
    },
  ];

  // Auto-cycle through features with animation states
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState("exiting");
      
      setTimeout(() => {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setAnimationState("entering");
      }, 500); // Half of the transition time
    }, 4000);
    
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      color: "#f8fafc",
      padding: "2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "-100px",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.1) 70%, transparent 100%)",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-50px",
        left: "-50px",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.1) 70%, transparent 100%)",
        zIndex: 0
      }}></div>

      {/* Header with CTA button */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "1200px",
        marginBottom: "4rem",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
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
          }}>MP</div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>Meal Planner</h1>
        </div>
        
        <button 
          style={buttonPrimary}
          onClick={() => navigate("/login")}
        >
          Get Started <ChevronRight size={16} />
        </button>
      </header>

      {/* Hero section */}
      <section style={{
        textAlign: "center",
        margin: "0 auto 6rem",
        maxWidth: "800px",
        position: "relative",
        zIndex: 10
      }}>
        <h2 style={{
          fontSize: "3.5rem",
          fontWeight: "800",
          margin: "0 0 1.5rem 0",
          background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}>
          Transform Your Eating Habits
        </h2>
        
        <p style={{
          fontSize: "1.25rem",
          color: "#cbd5e1",
          lineHeight: "1.6",
          margin: "0 0 2.5rem 0"
        }}>
          Plan your meals, save time, reduce waste, and eat healthier with our intuitive meal planning platform.
        </p>

        {/* Animated Feature highlight */}
        <div style={{
          ...cardStyle,
          maxWidth: "500px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          opacity: animationState === "entering" ? 1 : 0,
          transform: animationState === "entering" ? "translateX(0)" : 
                    animationState === "exiting" ? "translateX(-100px)" : "translateX(100px)",
          transition: "all 0.5s ease-in-out"
        }}>
          <div style={{ color: features[currentFeature].color }}>
            {features[currentFeature].icon}
          </div>
          <div>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.125rem" }}>
              {features[currentFeature].title}
            </h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem" }}>
              {features[currentFeature].description}
            </p>
          </div>
        </div>
      </section>

      {/* Top paragraph */}
      <div style={{
        textAlign: "center",
        margin: "0 auto 4rem",
        maxWidth: "900px",
        position: "relative",
        zIndex: 10
      }}>
        <p style={{
          fontSize: "1.125rem",
          lineHeight: "1.7",
          color: "#e2e8f0"
        }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>

      {/* Three column section with offset */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "2rem",
        maxWidth: "1200px",
        margin: "0 auto 4rem",
        position: "relative",
        zIndex: 10
      }}>
        {/* First column - offset upward */}
        <div style={{
          ...cardStyle,
          transform: "translateY(-40px)",
          height: "fit-content",
          transition: "transform 0.3s ease"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#a78bfa" }}>Weekly Planning</h3>
          <p style={{ color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </p>
        </div>

        {/* Second column - middle (not offset) */}
        <div style={{
          ...cardStyle,
          transition: "transform 0.3s ease"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#a78bfa" }}>Recipe Library</h3>
          <p style={{ color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        {/* Third column - offset upward */}
        <div style={{
          ...cardStyle,
          transform: "translateY(-40px)",
          height: "fit-content",
          transition: "transform 0.3s ease"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#a78bfa" }}>Grocery Lists</h3>
          <p style={{ color: "#cbd5e1", lineHeight: "1.6", margin: 0 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </p>
        </div>
      </div>

      {/* Bottom paragraph */}
      <div style={{
        textAlign: "center",
        margin: "0 auto",
        maxWidth: "900px",
        position: "relative",
        zIndex: 10
      }}>
        <p style={{
          fontSize: "1.125rem",
          lineHeight: "1.7",
          color: "#e2e8f0"
        }}>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </div>
    </div>
  );
};

export default StartPage;