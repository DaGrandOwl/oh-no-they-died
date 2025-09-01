import { useState, useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";

export default function MealCard({
  recipe,
  item,
  compact = false,
  hideImage = false,
  darkTheme = false,
  onAddToPlan,
  isoDate,
  mealTime,
  onStartHighlight = () => {},
  onClearHighlight = () => {},
  onServingsChange = null, // optional callback for parent to react to servings changes
  plannerMode = false, // NEW: indicates if this is used in the planner
  minimized = false, // NEW: starts in minimized state
}) {
  const data = recipe || item;

  // pick initial servings: explicit value on data.servings, otherwise recommended_servings, otherwise base_servings, fallback 1
  const initialServings = useMemo(() => {
    if (!data) return 1;
    if (data.servings != null) return Math.max(1, Math.round(Number(data.servings)));
    if (data.recommended_servings != null) return Math.max(1, Math.round(Number(data.recommended_servings)));
    if (data.base_servings != null) return Math.max(1, Math.round(Number(data.base_servings)));
    return 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && (data.servings ?? data.recommended_servings ?? data.base_servings)]);

  const [servings, setServings] = useState(initialServings);
  const [isHovered, setIsHovered] = useState(false); // NEW: hover state

  // keep servings in sync if data changes (e.g. server merge replaced the item)
  useEffect(() => {
    setServings(initialServings);
  }, [initialServings]);

  // helper to extract origin meta (if the card came from planner local data)
  const originMeta = useMemo(() => {
    return {
      date: data?.date || data?.scheduled_date || data?.scheduledDate || null,
      mealType: data?.mealType || data?.meal_type || null,
      clientId: data?.clientId ?? null,
      serverId: data?.serverId ?? null,
      recipeId: data?.id ?? data?.recipeId ?? null,
    };
  }, [data]);

  // drag: include the recipe data *and* the currently selected servings + origin info
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "RECIPE",
    item: () => {
      const payload = {
        recipe: {
          ...data,
          servings,
          // include origin metadata so drop handler can detect same-cell moves
          _origin: originMeta
        }
      };
      try {
        onStartHighlight && onStartHighlight(payload.recipe);
      } catch (e) { /* ignore callback errors */ }
      return payload;
    },
    end: () => {
      try { onClearHighlight && onClearHighlight(); } catch (e) {}
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [data, servings, onStartHighlight, onClearHighlight, originMeta]);

  if (!data) return null;

  const changeServings = (delta) => {
    setServings((s) => {
      const next = Math.max(1, Math.round((s || 0) + delta));
      if (typeof onServingsChange === "function") {
        try { onServingsChange(next, data); } catch (e) {}
      }
      return next;
    });
  };

  const onServingsInput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isNaN(v)) return;
    const next = Math.max(1, v);
    setServings(next);
    if (typeof onServingsChange === "function") {
      try { onServingsChange(next, data); } catch (e) {}
    }
  };

  const handleAddClick = async (e) => {
    e.stopPropagation();
    const servingsToSend = servings;
    if (typeof onAddToPlan === "function" && isoDate && mealTime) {
      // call with current servings
      await onAddToPlan(data, isoDate, mealTime, servingsToSend);
    } else {
      // fallback: highlight for mobile
      try { onStartHighlight && onStartHighlight({ ...data, servings: servingsToSend }); } catch (e) {}
    }
  };

  // NEW: Check if we should show minimized version
  const isMinimized = plannerMode && minimized && !isHovered;
  
  // image area: hide if hideImage or if compact (planner cards) or if minimized
  const showImage = !hideImage && !!data.image && !compact && !isMinimized;

  // Theme-based styles
const cardStyles = darkTheme ? {
  container: {
    // ... existing container styles ...
    // NEW: minimized state styles
    ...(isMinimized && {
      height: '40px',
      width: '40px',
      padding: '0.25rem',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center'
    }),
  },
  imageContainer: {
    width: isMinimized ? 32 : (compact ? 40 : (showImage ? 80 : 48)),
    height: isMinimized ? 32 : (compact ? 40 : (showImage ? 60 : 48)),
    // ... rest of imageContainer styles ...
  },
  title: {
    // ... existing title styles ...
    // NEW: minimized title
    ...(isMinimized && {
      position: 'absolute',
      bottom: 2,
      left: 2,
      right: 2,
      fontSize: '0.5rem',
      textAlign: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
      padding: '1px 2px',
      borderRadius: '2px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }),
  },
    calories: {
      fontWeight: 700,
      fontSize: isMinimized ? '0.625rem' : '0.8125rem',
      color: '#a78bfa',
      background: 'rgba(139, 92, 246, 0.1)',
      padding: isMinimized ? '0.125rem 0.25rem' : '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      border: '1px solid rgba(139, 92, 246, 0.2)'
    },
    macros: {
      marginTop: 6,
      display: isMinimized ? "none" : "flex",
      gap: 8,
      alignItems: "center",
      color: "#94a3b8",
      fontSize: 11
    },
    servingsContainer: {
      display: isMinimized ? "none" : "flex",
      justifyContent: "flex-end",
      gap: 6,
      alignItems: "center",
      marginTop: 6
    },
    servingsButton: {
      width: compact ? 24 : 28,
      height: compact ? 24 : 28,
      borderRadius: '0.375rem',
      border: "1px solid rgba(148, 163, 184, 0.2)",
      background: "rgba(30, 41, 59, 0.8)",
      color: '#e2e8f0',
      fontSize: compact ? 12 : 14,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    },
    servingsInput: {
      width: 52,
      padding: "0.25rem 0.375rem",
      borderRadius: '0.375rem',
      border: "1px solid rgba(148, 163, 184, 0.2)",
      background: "rgba(30, 41, 59, 0.8)",
      color: '#e2e8f0',
      fontSize: 12,
      textAlign: 'center'
    },
    allergenTag: {
      fontSize: 10,
      background: "rgba(249, 115, 22, 0.1)",
      color: "#fb923c",
      padding: "0.125rem 0.375rem",
      borderRadius: '0.25rem',
      border: "1px solid rgba(249, 115, 22, 0.2)"
    },
    addButton: {
      padding: compact ? '0.5rem 0.75rem' : '0.625rem 1rem',
      borderRadius: '0.5rem',
      border: "none",
      background: "linear-gradient(45deg, #8b5cf6, #06b6d4)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: compact ? 11 : 13,
      transition: 'all 0.2s ease'
    },
    viewButton: {
      padding: compact ? '0.375rem 0.625rem' : '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      textDecoration: "none",
      color: "#94a3b8",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      textAlign: "center",
      display: "inline-block",
      fontSize: compact ? 10 : 12,
      transition: 'all 0.2s ease',
      background: 'rgba(30, 41, 59, 0.6)'
    }
  } : {
    // Light theme styles (original)
    container: {
      borderRadius: 8,
      border: "1px solid rgba(229,231,235,0.6)",
      padding: isMinimized ? 6 : (compact ? 8 : 12),
      display: "flex",
      gap: isMinimized ? 6 : 12,
      alignItems: "center",
      opacity: isDragging ? 0.5 : 1,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      minWidth: 0,
      transition: 'all 0.2s ease',
      // NEW: minimized state styles
      ...(isMinimized && {
        height: '2.5rem',
        overflow: 'hidden',
        padding: '0.25rem 0.5rem',
        gap: '0.5rem'
      })
    },
    imageContainer: {
      width: isMinimized ? 24 : (compact ? 40 : (showImage ? 80 : 48)),
      height: isMinimized ? 24 : (compact ? 40 : (showImage ? 60 : 48)),
      borderRadius: 6,
      overflow: "hidden",
      background: showImage ? "#f3f4f6" : "#eef2ff",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontWeight: 600,
      fontSize: isMinimized ? 12 : (compact ? 13 : 15),
      color: "#0f172a",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    calories: {
      fontWeight: 700,
      fontSize: isMinimized ? 10 : 13
    },
    macros: {
      marginTop: 6,
      display: isMinimized ? "none" : "flex",
      gap: 10,
      alignItems: "center",
      color: "#6b7280",
      fontSize: 12
    },
    servingsContainer: {
      display: isMinimized ? "none" : "flex",
      justifyContent: "flex-end",
      gap: 6,
      alignItems: "center",
      marginTop: 6
    },
    servingsButton: {
      width: 26,
      height: 26,
      borderRadius: 6,
      border: "1px solid rgba(0,0,0,0.06)",
      background: "#fff"
    },
    servingsInput: {
      width: 56,
      padding: "4px 6px",
      borderRadius: 6,
      border: "1px solid rgba(0,0,0,0.08)"
    },
    allergenTag: {
      fontSize: 11,
      background: "#fff7ed",
      color: "#92400e",
      padding: "2px 6px",
      borderRadius: 6,
      border: "1px solid rgba(249,115,22,0.08)"
    },
    addButton: {
      padding: "8px 12px",
      borderRadius: 8,
      border: "none",
      background: "linear-gradient(90deg,#8b5cf6,#06b6d4)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 600
    },
    viewButton: {
      padding: "6px 10px",
      borderRadius: 8,
      textDecoration: "none",
      color: "#6b7280",
      border: "1px solid rgba(148,163,184,0.12)",
      textAlign: "center",
      display: "inline-block"
    }
  };

  return (
    <div
      ref={dragRef}
      style={cardStyles.container}
      role="article"
      aria-label={data.name}
      onMouseEnter={() => setIsHovered(true)} // NEW: hover handlers
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* image / avatar */}
      <div style={cardStyles.imageContainer}>
        {showImage ? (
          <img
            src={data.image}
            alt={data.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          // small placeholder: initials
          <div style={{ 
            fontWeight: 700, 
            color: darkTheme ? "#a78bfa" : "#0f172a", 
            fontSize: isMinimized ? 10 : (compact ? 12 : 14), 
            padding: 4 
          }}>
            {(data.name || "").split(/\s+/).map(n => n[0]).slice(0,2).join("").toUpperCase()}
          </div>
        )}
      </div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: isMinimized ? 4 : 8 
        }}>
          <div style={cardStyles.title}>
            {data.name}
            {isMinimized && (
              <div style={{
                position: 'absolute',
                bottom: 2,
                left: 2,
                right: 2,
                fontSize: '0.5rem',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '1px 2px',
                borderRadius: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {data.name}
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", minWidth: isMinimized ? 'auto' : 90 }}>
            <div style={cardStyles.calories}>{Math.round(data.calories ?? 0)} cal</div>

            {/* show servings - hidden when minimized */}
            <div style={cardStyles.servingsContainer}>
              {compact ? (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); changeServings(-1); }}
                    style={cardStyles.servingsButton}
                    aria-label="Decrease servings"
                  >
                    −
                  </button>
                  <div style={{ minWidth: 26, textAlign: "center", color: darkTheme ? '#e2e8f0' : 'inherit' }}>
                    {servings}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); changeServings(1); }}
                    style={cardStyles.servingsButton}
                    aria-label="Increase servings"
                  >
                    +
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    value={servings}
                    onChange={onServingsInput}
                    onClick={(e) => e.stopPropagation()}
                    style={cardStyles.servingsInput}
                    aria-label="Servings"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* macros - hidden when minimized */}
        <div style={cardStyles.macros}>
          <div>P: {data.protein ?? "-"}g</div>
          <div>C: {data.carbs ?? "-"}g</div>
          <div>F: {data.fat ?? "-"}g</div>
        </div>

        {/* allergens - hidden when minimized */}
        {Array.isArray(data.allergens) && data.allergens.length > 0 && !isMinimized && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {data.allergens.slice(0,3).map(a => (
              <span key={a} style={cardStyles.allergenTag}>
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* controls - hidden when minimized or compact */}
      {!compact && !isMinimized && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={handleAddClick}
            style={cardStyles.addButton}
            aria-label={`Add ${data.name} to plan`}
          >
            Add
          </button>

          <a
            href={`/recipe/${data.id}`}
            onClick={(e) => e.stopPropagation()}
            style={cardStyles.viewButton}
            aria-label={`View ${data.name}`}
          >
            View
          </a>
        </div>
      )}
    </div>
  );
}