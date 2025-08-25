import React from "react";
import { useParams } from "react-router-dom";
import { useSettings } from '../App';
import { cardStyle } from '../Styles';

// Example recipe data
const recipes = {
  1: {
    id: 1,
    name: "Mediterranean Quinoa Bowl",
    description: "A healthy and flavorful bowl packed with fresh vegetables, quinoa, and Mediterranean herbs",
    prepTime: "15 mins",
    cookTime: "25 mins",
    difficulty: "Easy",
    ingredients: [
      "1 cup quinoa, rinsed",
      "2 cups vegetable broth",
      "1 large cucumber, diced",
      "200 g feta cheese, crumbled",
    ],
    directions: "Cook 1 cup quinoa in 2 cups vegetable broth for 15 mins. Let cool. Mix with feta, olive oil, and lemon juice. Add vegetables and toss.",
    nutrition: [
      { name: "Calories", value: "285 kcal", dv: "-" },
      { name: "Protein", value: "12 g", dv: "24%" },
      { name: "Carbohydrates", value: "35 g", dv: "12%" },
      { name: "Fat", value: "12 g", dv: "18%" },
    ],
  },
  2: {
    id: 2,
    name: "Spicy Lentil Soup",
    description: "Warm and comforting lentil soup with spices and herbs",
    prepTime: "10 mins",
    cookTime: "30 mins",
    difficulty: "Medium",
    ingredients: [
      "1 cup red lentils",
      "4 cups vegetable broth",
      "1 onion, chopped",
      "2 cloves garlic, minced",
    ],
    directions: "Sauté onion and garlic, add lentils and broth, cook for 30 mins. Season with spices of choice.",
    nutrition: [
      { name: "Calories", value: "210 kcal", dv: "-" },
      { name: "Protein", value: "14 g", dv: "28%" },
      { name: "Carbohydrates", value: "30 g", dv: "10%" },
      { name: "Fat", value: "5 g", dv: "8%" },
    ],
  },
};

export default function RecipePage() {
  const { id } = useParams();
  const { settings } = useSettings();
  const recipe = recipes[id];

  // Theme-dependent styles
  const themeStyles = {
    container: {
      minHeight: '100vh',
      background: settings.theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)' 
        : 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 50%, #cffafe 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b'
    },
    main: {
      padding: '2rem',
      overflow: 'auto'
    }
  };

  if (!recipe) {
    return <div style={{ color: "white", padding: "2rem" }}>Recipe not found.</div>;
  }

  return (
    <div style={themeStyles.container}>
      <div style={themeStyles.main}>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
            {recipe.name}
          </h2>
          <p style={{color: settings.theme === 'dark' ? '#94a3b8' : '#64748b'}}>{recipe.description}</p>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.3rem 0.7rem',
              borderRadius: '1rem',
              color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563'
            }}>Prep: {recipe.prepTime}</span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.3rem 0.7rem',
              borderRadius: '1rem',
              color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563'
            }}>Cook: {recipe.cookTime}</span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.3rem 0.7rem',
              borderRadius: '1rem',
              color: settings.theme === 'dark' ? '#d1d5db' : '#4b5563'
            }}>{recipe.difficulty}</span>
          </div>
        </div>

        {/* Ingredients */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '1rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b'
          }}>
            Ingredients
          </div>
          <div style={{padding: '1rem 1.5rem 1.5rem 1.5rem'}}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.6rem',
                  borderRadius: '0.5rem',
                  color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b'
                }}>{ing}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Directions */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '1rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b'
          }}>
            Directions
          </div>
          <div style={{
            padding: '1rem 1.5rem 1.5rem 1.5rem',
            color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
            fontSize: '0.95rem'
          }}>
            {recipe.directions}
          </div>
        </div>

        {/* Nutrition Facts */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '1rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b'
          }}>
            Nutrition Facts
          </div>
          <div style={{padding: '1rem 1.5rem 1.5rem 1.5rem'}}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: settings.theme === 'dark' ? '#e2e8f0' : '#4b5563', fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th style={{textAlign: "left", padding: "0.5rem", color: '#a78bfa'}}>Nutrient</th>
                  <th style={{textAlign: "left", padding: "0.5rem", color: '#a78bfa'}}>Value</th>
                  <th style={{textAlign: "left", padding: "0.5rem", color: '#a78bfa'}}>%DV</th>
                </tr>
              </thead>
              <tbody>
                {recipe.nutrition.map((n, i) => (
                  <tr key={i}>
                    <td style={{padding: "0.5rem", borderBottom: "1px solid rgba(148, 163, 184, 0.1)"}}>{n.name}</td>
                    <td style={{padding: "0.5rem", borderBottom: "1px solid rgba(148, 163, 184, 0.1)"}}>{n.value}</td>
                    <td style={{padding: "0.5rem", borderBottom: "1px solid rgba(148, 163, 184, 0.1)"}}>{n.dv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}