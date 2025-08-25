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

  //Nutrition scaling staate
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

  if (!recipe) return <p>Loading...</p>;

  const scaledIngredients = scaleIngredients(recipe.ingredients, servings, recipe.baseServings, recipe.size, sizeInput, mode);
  const scaledDirections = scaleDirections(recipe.directions, servings, recipe.baseServings, recipe.size, sizeInput, mode);
  const nutrition = scaleNutritionFacts(recipe.nutrition_facts, nutritionServings, recipe.baseServings, recipe.size, nutritionSize, nutritionMode);

  return (
    <div>
      <h1>{recipe.name}</h1> 
      <h2>{recipe.description}</h2> 
      <img src={recipe.image} alt="recipe" width={200}/><br />

      {/* Scaling selector */}
      <div>
        <h3>Ingredients & Directions Scaling</h3>
        <label>
          <input type="radio" value="servings" checked={mode === "servings"} onChange={() => setMode("servings")} />
          By Servings
        </label>
        <input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value))} disabled={mode !== "servings"} />
        <br />
        <label>
          <input type="radio" value="size" checked={mode === "size"} onChange={() => setMode("size")} />
          By Size (in g)
        </label>
        <input type="number" value={sizeInput} onChange={(e) => setSizeInput(Number(e.target.value))} disabled={mode !== "size"} />
      </div>

      {/* Ingredients */}
      <h2>Ingredients</h2>
      <ul>
        {scaledIngredients.map(ing => (
          <li key={ing.id}> {ing.quantity} {ing.unit} {ing.item_name}</li>
        ))}
      </ul>

      {/* Directions */}
      <h2>Directions</h2>
      <p>{scaledDirections}</p>

      {/* Nutrition Facts */}
      <div>
        <h3>Nutrition Scaling</h3>
        <label>
          <input type="radio" value="servings" checked={nutritionMode === "servings"} onChange={() => setNutritionMode("servings")} />
          By Servings
        </label>
        <input type="number" value={nutritionServings} onChange={(e) => setNutritionServings(Number(e.target.value))} disabled={nutritionMode !== "servings"} />
        <br />
        <label>
          <input type="radio" value="size" checked={nutritionMode === "size"} onChange={() => setNutritionMode("size")} />
          By Size (g)
        </label>
        <input type="number" value={nutritionSize} onChange={(e) => setNutritionSize(Number(e.target.value))} disabled={nutritionMode !== "size"} />
      </div>

      <h2>Nutrition</h2>
      <table>
        <thead>
          <tr>
            <th>Nutrient</th>
            <th>Value</th>
            <th>%DV</th>
          </tr>
        </thead>
        <tbody>
          {nutrition.map((item, idx) =>
            item.type === "category" ? (
              <tr key={idx}>
                <td colSpan="3"><b>{item.name}</b></td>
              </tr>
            ) : (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.value} {item.unit}</td>
                <td>{item.dv}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}