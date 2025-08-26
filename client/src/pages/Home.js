import { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  X, 
  TrendingUp,
  PieChart,
  Sparkles
} from "lucide-react";
import { usePreferences } from "../contexts/PrefContext";

// Import shared styles (would be in a separate constants file)
import { 
  cardStyle, 
  buttonIcon,
  inputStyle,
  tableHeaderStyle,
  tableCellStyle
} from '../Styles';

const recommendedMeals = [
  { name:'Grilled Chicken Bowl', calories:520, protein:42, fats:15, carbs:35, fiber:8, tags:['high‑protein'], allergens:['gluten'] },
  // ... other meals (truncated for brevity)
];

const allergenOptions = ["gluten", "dairy", "nuts", "eggs", "soy", "shellfish"];
const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getWeekDates() {
  return daysOfWeek.map((day, index) => ({
    day,
    date: day.toLowerCase(),
    displayDate: day.slice(0, 3)
  }));
}

function readWeekPlan() {
  return JSON.parse(localStorage.getItem('weeklyPlan') || "{}");
}

function writeWeekPlan(plan) {
  localStorage.setItem('weeklyPlan', JSON.stringify(plan));
}

export default function Home() {
  const { prefs } = usePreferences();
  const weekDates = getWeekDates();
  
  // Weekly plan
  const [weekPlan, setWeekPlan] = useState(() => readWeekPlan());
  useEffect(() => {
    writeWeekPlan(weekPlan);
  }, [weekPlan]);

  // Chart hover states
  const [chartHover, setChartHover] = useState({ line: false, pie: false });

  // Popup for recommended meals
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Filters for popup
  const [filter, setFilter] = useState({ search: "", maxCal: "", minPro: "", allergen: "" });

  // Filtered recommended meals (with allergen filtering from settings)
  const filteredMeals = recommendedMeals.filter(m => {
    const q = filter.search.trim().toLowerCase();
    const maxCal = parseInt(filter.maxCal, 10) || Infinity;
    const minPro = parseInt(filter.minPro, 10) || 0;
    const allerg = filter.allergen;
    
    // Filter out meals with user's allergens from settings
    const hasUserAllergen = m.allergens.some(allergen => 
      prefs.allergens.map(a => a.toLowerCase()).includes(allergen.toLowerCase())
    );
    
    return (
      !hasUserAllergen &&
      m.calories <= maxCal &&
      m.protein >= minPro &&
      (!allerg || !m.allergens.includes(allerg)) &&
      (!q || m.name.toLowerCase().includes(q) || m.tags.join(" ").toLowerCase().includes(q))
    );
  });

  const openMealSelector = (dayDate, mealTime) => {
    setSelectedSlot({ dayDate, mealTime });
    setShowPopup(true);
  };

  const addMealToSlot = (meal) => {
    if (!selectedSlot) return;
    const { dayDate, mealTime } = selectedSlot;
    const key = `${dayDate}-${mealTime}`;
    
    setWeekPlan(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), meal]
    }));
    setShowPopup(false);
    setSelectedSlot(null);
  };

  const removeMealFromSlot = (dayDate, mealTime, mealIndex) => {
    const key = `${dayDate}-${mealTime}`;
    setWeekPlan(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, index) => index !== mealIndex)
    }));
  };

  const getMealsForSlot = (dayDate, mealTime) => {
    const key = `${dayDate}-${mealTime}`;
    return weekPlan[key] || [];
  };

  // Calculate nutrition data for charts
  const getNutritionData = () => {
    const mealTimeData = mealTimes.map(mealTime => {
      const totals = { calories: 0, protein: 0, fats: 0, carbs: 0, fiber: 0 };
      
      daysOfWeek.forEach(day => {
        const meals = getMealsForSlot(day.toLowerCase(), mealTime) || [];
        meals.forEach(meal => {
          totals.calories += meal.calories || 0;
          totals.protein += meal.protein || 0;
          totals.fats += meal.fats || 0;
          totals.carbs += meal.carbs || 0;
          totals.fiber += meal.fiber || 0;
        });
      });
      
      return { mealTime, ...totals };
    });

    // Calculate total weekly nutrition for pie chart
    const weeklyTotals = mealTimeData.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      fats: acc.fats + meal.fats,
      carbs: acc.carbs + meal.carbs,
      fiber: acc.fiber + meal.fiber
    }), { calories: 0, protein: 0, fats: 0, carbs: 0, fiber: 0 });

    return { mealTimeData, weeklyTotals };
  };

  const { mealTimeData, weeklyTotals } = getNutritionData();

  // Styles that depend on theme
  const themeStyles = {
    app: {
      minHeight: '100vh',
      background: prefs.theme === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)' 
        : 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 50%, #cffafe 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: prefs.theme === 'dark' ? '#f8fafc' : '#1e293b'
    },
    main: {
      padding: '2rem',
      overflow: 'auto'
    },
    headerTitle: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: prefs.theme === 'dark' ? '#f8fafc' : '#1e293b',
      margin: 0
    },
    headerSub: {
      fontSize: '1rem',
      color: prefs.theme === 'dark' ? '#94a3b8' : '#64748b',
      margin: '0.25rem 0 0 0'
    }
  };

  return (
    <div style={themeStyles.app}>
      <div style={themeStyles.main}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem'}}>
          <div>
            <h1 style={themeStyles.headerTitle}>Weekly Meal Planner</h1>
            <p style={themeStyles.headerSub}>Plan your meals across the entire week</p>
          </div>
        </div>

        {/* Weekly Schedule Table */}
        <div style={cardStyle}>
          <div style={tableHeaderStyle}>
            <h2 style={{...themeStyles.headerTitle, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Calendar style={{width: '1.25rem', height: '1.25rem', color: '#4ade80'}} />
              Weekly Meal Schedule
            </h2>
          </div>

          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{...tableCellStyle, textAlign: 'left', width: '120px'}}>Meal Time</th>
                {weekDates.map(({day, displayDate}) => (
                  <th key={day} style={tableCellStyle}>
                    <div>{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mealTimes.map(mealTime => (
                <tr key={mealTime}>
                  <td style={{...tableCellStyle, background: 'rgba(139, 92, 246, 0.05)', fontWeight: '600', color: '#a78bfa', textAlign: 'center'}}>
                    {mealTime}
                  </td>
                  {weekDates.map(({date}) => {
                    const meals = getMealsForSlot(date, mealTime);
                    return (
                      <td key={date} style={tableCellStyle}>
                        <div 
                          style={{
                            minHeight: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'all 0.2s',
                            ...(meals.length === 0 ? {
                              border: '1px dashed rgba(148, 163, 184, 0.3)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: '0.75rem'
                            } : {})
                          }}
                          onClick={() => openMealSelector(date, mealTime)}
                          onMouseEnter={(e) => {
                            if (meals.length === 0) {
                              e.currentTarget.style.borderColor = '#a78bfa';
                              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (meals.length === 0) {
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          {meals.length === 0 ? (
                            <span>+ Add meal</span>
                          ) : (
                            meals.map((meal, index) => (
                              <div key={index} style={{
                                background: 'rgba(139, 92, 246, 0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                borderRadius: '0.25rem',
                                padding: '0.375rem 0.5rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.25rem'
                              }}>
                                <div>
                                  <div style={{fontWeight: '500', color: '#f8fafc', fontSize: '0.75rem', lineHeight: '1'}}>
                                    {meal.name}
                                  </div>
                                  <div style={{color: '#a78bfa', fontSize: '0.625rem'}}>
                                    {meal.calories} cal • {meal.protein}g pro
                                  </div>
                                </div>
                                <button
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '1rem',
                                    height: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#f87171',
                                    flexShrink: 0
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeMealFromSlot(date, mealTime, index);
                                  }}
                                >
                                  <X style={{width: '0.625rem', height: '0.625rem'}} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nutrition Charts */}
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '2rem'}}>
          {/* Line Chart - Nutrition by Meal Time */}
          <div 
            style={{
              ...cardStyle,
              ...(chartHover.line ? {
                transform: 'scale(1.05)',
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3)',
                zIndex: 10
              } : {})
            }}
            onMouseEnter={() => setChartHover(prev => ({...prev, line: true}))}
            onMouseLeave={() => setChartHover(prev => ({...prev, line: false}))}
          >
            <div style={{fontSize: '1rem', fontWeight: '600', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <TrendingUp style={{width: '1rem', height: '1rem', color: '#4ade80'}} />
              Nutrition by Meal Time
            </div>
            {/* Chart SVG code remains the same */}
          </div>

          {/* Pie Chart - Weekly Nutrition Distribution */}
          <div 
            style={{
              ...cardStyle,
              ...(chartHover.pie ? {
                transform: 'scale(1.05)',
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3)',
                zIndex: 10
              } : {})
            }}
            onMouseEnter={() => setChartHover(prev => ({...prev, pie: true}))}
            onMouseLeave={() => setChartHover(prev => ({...prev, pie: false}))}
          >
            <div style={{fontSize: '1rem', fontWeight: '600', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <PieChart style={{width: '1rem', height: '1rem', color: '#a78bfa'}} />
              Weekly Distribution
            </div>
            {/* Pie chart code remains the same */}
          </div>
        </div>

        {/* Recommended Meals Popup */}
        {showPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowPopup(false)}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                padding: '1.5rem',
                background: 'rgba(139, 92, 246, 0.1)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{...themeStyles.headerTitle, fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <Sparkles style={{width: '1.25rem', height: '1.25rem', color: '#a78bfa'}} />
                  Add Meal to {selectedSlot?.mealTime}
                </h3>
                <button 
                  style={buttonIcon}
                  onClick={() => setShowPopup(false)}
                >
                  <X style={{width: '1rem', height: '1rem'}} />
                </button>
              </div>
              
              <div style={{padding: '1.5rem', maxHeight: '60vh', overflow: 'auto'}}>
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '0.75rem', marginBottom: '1.5rem'}}>
                  <div style={{position: 'relative'}}>
                    <input 
                      style={{...inputStyle, paddingLeft: '2.5rem'}}
                      placeholder="Search meals..."
                      value={filter.search}
                      onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                    />
                    <Search style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1rem',
                      height: '1rem',
                      color: '#94a3b8'
                    }} />
                  </div>
                  <input 
                    style={inputStyle}
                    type="number" 
                    min="0" 
                    placeholder="Max Calories" 
                    value={filter.maxCal}
                    onChange={e => setFilter(f => ({ ...f, maxCal: e.target.value }))}
                  />
                  <input 
                    style={inputStyle}
                    type="number" 
                    min="0" 
                    placeholder="Min Protein (g)" 
                    value={filter.minPro}
                    onChange={e => setFilter(f => ({ ...f, minPro: e.target.value }))}
                  />
                  <select 
                    style={inputStyle}
                    value={filter.allergen}
                    onChange={e => setFilter(f => ({ ...f, allergen: e.target.value }))}
                  >
                    <option value="">Exclude Allergen...</option>
                    {allergenOptions.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
                  </select>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem'}}>
                  {filteredMeals.length === 0 ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      color: '#94a3b8',
                      padding: '3rem',
                      fontSize: '1rem'
                    }}>
                      No meals match your filters
                    </div>
                  ) : filteredMeals.map((meal, index) => (
                    <div 
                      key={index} 
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => addMealToSlot(meal)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.borderColor = '#a78bfa';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Meal card content remains the same */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}