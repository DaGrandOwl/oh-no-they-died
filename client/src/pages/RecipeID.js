import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

//Parse and scale ingredients
function scaleIngredients(ingredients, servings, baseServings, size, selectedSize, mode) {
  return ingredients.map(ing => {
    const q = parseFloat(ing.quantity);
    if (isNaN(q)) {
      return { ...ing, quantity: ing.quantity };
    }

    let scaled;
    if (mode === "servings") {
      scaled = q * servings / baseServings;
    } else {
      scaled = q * selectedSize / size;
    }

    return { 
      ...ing, 
      quantity: Number.isInteger(scaled) ? scaled : scaled.toFixed(2) 
    };
  });
}

//Detect and scale directions
function scaleDirections(directions, servings, baseServings, size, selectedSize, mode) {
  const unitRegex = /(\d+(\.\d+)?|\d+\/\d+)\s*(g|kg|mg|μg|ml|l|IU|cups|cup|tsp|tbsp|oz|lb|pieces|piece|pcs|pc)/gi;

  return directions.replace(unitRegex, (match, num, _, unit) => {
    let value;
    if (num.includes("/")) {
      const [a, b] = num.split("/");
      value = parseFloat(a) / parseFloat(b);
    } else {
      value = parseFloat(num);
    }

    let scaled;
    if (mode === "servings") {
      scaled = value * servings / baseServings;
    } else {
      scaled = value * selectedSize / size;
    }

    const clean = Number.isInteger(scaled) ? scaled : scaled.toFixed(2);
    return `${clean} ${unit}`;
  });
}

//Parse and scale nutrition facts
function scaleNutritionFacts(text, servings, baseServings, size, selectedSize, mode) {
  const lines = text.split(/\n|(?=[A-Z][a-z])|(?<=%)/).map(l => l.trim()).filter(Boolean);
  const nutrition = [];

  for (let line of lines) {
    const match = line.match(/^(.+?)\s+([\d.]+)([a-z|A-Z|μ|IU]*)\s*(\d+%|)$/);
    if (match) {
      const [, name, num, unit, dv] = match;
      let value;
      if (mode === "servings") {
        value = parseFloat(num) * servings / baseServings;
      } else {
        value = parseFloat(num) * selectedSize / size;
      }

      nutrition.push({
        type: "nutrient",
        name,
        value: Number.isInteger(value) ? value : value.toFixed(2),
        unit,
        dv: dv || ""
      });
    } else {
      nutrition.push({ type: "category", name: line });
    }
  }
  return nutrition;
}

export default function RecipeID() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);

  //Recipe scaling state
  const [servings, setServings] = useState(1);
  const [sizeInput, setSizeInput] = useState(100);
  const [mode, setMode] = useState("servings"); // "servings" | "size"

  //Nutrition scaling state
  const [nutritionMode, setNutritionMode] = useState("servings"); 
  const [nutritionServings, setNutritionServings] = useState(1);
  const [nutritionSize, setNutritionSize] = useState(100);

  useEffect(() => {
    async function fetchRecipe() {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recipe/${id}`);
      const data = await res.json();
      setRecipe(data.recipe);
      setServings(data.recipe.baseServings);
      setNutritionServings(data.recipe.baseServings);
      setSizeInput(data.recipe.size);
      setNutritionSize(data.recipe.size);
    }
    fetchRecipe();
  }, [id]);

  if (!recipe) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f8fafc',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontSize: '1.125rem'
        }}>
          Loading recipe...
        </div>
      </div>
    );
  }

  const scaledIngredients = scaleIngredients(recipe.ingredients, servings, recipe.baseServings, recipe.size, sizeInput, mode);
  const scaledDirections = scaleDirections(recipe.directions, servings, recipe.baseServings, recipe.size, sizeInput, mode);
  const nutrition = scaleNutritionFacts(recipe.nutrition_facts, nutritionServings, recipe.baseServings, recipe.size, nutritionSize, nutritionMode);

     const subtitle = {
    color: '#94a3b8',
    fontSize: '1.125rem',
    margin: 0
  };

  const title = {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };
  
  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  };

  const inputStyle = {
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '0.5rem',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
    marginLeft: '0.5rem',
    width: '80px'
  };

  const radioStyle = {
    marginRight: '0.5rem',
    accentColor: '#8b5cf6'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
    color: '#e2e8f0',
    fontSize: '0.875rem'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* NEW: Utensils Title */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          padding: '1rem'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <span>🍴</span> Recipe <span></span>
          </h1>
        </div>

        <div style={cardStyle}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#e2e8f0',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📋</span> {recipe.name} {/*HERE*/}
          </h2>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                margin: '0 0 0.5rem 0',
                background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                {recipe.name}
              </h1>
              <h2 style={{ 
                fontSize: '1.125rem', 
                color: '#94a3b8', 
                margin: '0 0 1rem 0',
                fontWeight: 'normal'
              }}>
                {recipe.description}
              </h2>
            </div>
            {recipe.image && (
              <img 
                src={recipe.image} 
                alt="recipe" 
                style={{
                  width: '200px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}
              />
            )}
          </div>
        </div>

        {/* Scaling Controls Card */}
        <div style={cardStyle}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ 
              borderRadius: '0.5rem',
              padding: '0.5rem',
              fontSize: '1.5rem'
            }}>
              ⚖️
            </span>
            Ingredients & Directions Scaling
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={labelStyle}>
              <input 
                type="radio" 
                value="servings" 
                checked={mode === "servings"} 
                onChange={() => setMode("servings")}
                style={radioStyle}
              />
              By Servings
              <input 
                type="number" 
                value={servings} 
                onChange={(e) => setServings(Number(e.target.value))} 
                disabled={mode !== "servings"}
                style={{
                  ...inputStyle,
                  opacity: mode !== "servings" ? 0.5 : 1
                }}
              />
            </label>
            <label style={labelStyle}>
              <input 
                type="radio" 
                value="size" 
                checked={mode === "size"} 
                onChange={() => setMode("size")}
                style={radioStyle}
              />
              By Size (g)
              <input 
                type="number" 
                value={sizeInput} 
                onChange={(e) => setSizeInput(Number(e.target.value))} 
                disabled={mode !== "size"}
                style={{
                  ...inputStyle,
                  opacity: mode !== "size" ? 0.5 : 1
                }}
              />
            </label>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Ingredients Card */}
          <div style={cardStyle}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                borderRadius: '0.5rem',
                padding: '0.5rem',
                fontSize: '1.5rem'
              }}>
                🥘
              </span>
              Ingredients
            </h2>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {scaledIngredients.map(ing => (
                <li 
                  key={ing.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ 
                    fontWeight: '600', 
                    color: '#a78bfa',
                    minWidth: '60px',
                    textAlign: 'right'
                  }}>
                    {ing.quantity} {ing.unit}
                  </span>
                  <span style={{ color: '#e2e8f0' }}>
                    {ing.item_name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Directions Card */}
          <div style={cardStyle}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                borderRadius: '0.5rem',
                padding: '0.5rem',
                fontSize: '1.5rem'
              }}>
                📝
              </span>
              Directions
            </h2>
            <div style={{
              padding: '1rem',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              lineHeight: '1.6',
              color: '#e2e8f0'
            }}>
              {scaledDirections}
            </div>
          </div>
        </div>

        {/* Nutrition Section */}
        <div style={cardStyle}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ 
              borderRadius: '0.5rem',
              padding: '0.5rem',
              fontSize: '1.5rem'
            }}>
              🎯
            </span>
            Nutrition Scaling
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <label style={labelStyle}>
              <input 
                type="radio" 
                value="servings" 
                checked={nutritionMode === "servings"} 
                onChange={() => setNutritionMode("servings")}
                style={radioStyle}
              />
              By Servings
              <input 
                type="number" 
                value={nutritionServings} 
                onChange={(e) => setNutritionServings(Number(e.target.value))} 
                disabled={nutritionMode !== "servings"}
                style={{
                  ...inputStyle,
                  opacity: nutritionMode !== "servings" ? 0.5 : 1
                }}
              />
            </label>
            <label style={labelStyle}>
              <input 
                type="radio" 
                value="size" 
                checked={nutritionMode === "size"} 
                onChange={() => setNutritionMode("size")}
                style={radioStyle}
              />
              By Size (g)
              <input 
                type="number" 
                value={nutritionSize} 
                onChange={(e) => setNutritionSize(Number(e.target.value))} 
                disabled={nutritionMode !== "size"}
                style={{
                  ...inputStyle,
                  opacity: nutritionMode !== "size" ? 0.5 : 1
                }}
              />
            </label>
          </div>

          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ 
              borderRadius: '0.5rem',
              padding: '0.5rem',
              fontSize: '1.5rem'
            }}>
              📊
            </span>
            Nutrition Facts
          </h2>
          
          <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: '600',
                    color: '#a78bfa',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Nutrient
                  </th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: '600',
                    color: '#a78bfa',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Value
                  </th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '1rem',
                    fontWeight: '600',
                    color: '#a78bfa',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    %DV
                  </th>
                </tr>
              </thead>
              <tbody>
                {nutrition.map((item, idx) =>
                  item.type === "category" ? (
                    <tr key={idx}>
                      <td 
                        colSpan="3" 
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                          fontWeight: 'bold',
                          color: '#f8fafc',
                          background: 'rgba(139, 92, 246, 0.08)'
                        }}
                      >
                        {item.name}
                      </td>
                    </tr>
                  ) : (
                    <tr key={idx} style={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                      transition: 'background 0.2s'
                    }}>
                      <td style={{ 
                        padding: '0.75rem 1rem',
                        color: '#e2e8f0'
                      }}>
                        {item.name}
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem',
                        color: '#e2e8f0',
                        fontWeight: '500'
                      }}>
                        {item.value} {item.unit}
                      </td>
                      <td style={{ 
                        padding: '0.75rem 1rem',
                        color: '#4ade80',
                        fontWeight: '500'
                      }}>
                        {item.dv}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}