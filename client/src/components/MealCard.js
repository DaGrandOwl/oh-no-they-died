import { useState, useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";
import { usePlan } from "../contexts/PlanContext";
import { X } from "lucide-react"; // Add this import

export default function MealCard({
  recipe,
  item,
  compact = false,
  hideImage = false,
  onAddToPlan,
  isoDate,
  mealTime,
  onStartHighlight = () => {},
  onClearHighlight = () => {},
  onServingsChange = null,
  plannerMode = false,
  minimized = false,
  showRemoveButton = false, // New prop to control remove button visibility
  onRemove = null, // New prop for remove functionality
  removeData = null // New prop for remove data (key, index, etc.)
}) {
  const data = recipe || item;
  const { updateServings } = usePlan();

  // Set initial servings based on data. If not present, default to 1.
  const initialServings = useMemo(() => {
    if (!data) return 1;
    if (data.servings != null) return Math.max(1, Math.round(Number(data.servings)));
    if (data.recommended_servings != null) return Math.max(1, Math.round(Number(data.recommended_servings)));
    if (data.base_servings != null) return Math.max(1, Math.round(Number(data.base_servings)));
    return 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && (data.servings ?? data.recommended_servings ?? data.base_servings)]);

  const [servings, setServings] = useState(initialServings);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setServings(initialServings);
  }, [initialServings]);

  const originMeta = useMemo(() => ({
    date: data?.date || data?.scheduled_date || data?.scheduledDate || null,
    mealType: data?.mealType || data?.meal_type || null,
    clientId: data?.clientId ?? null,
    serverId: data?.serverId ?? null,
    recipeId: data?.id ?? data?.recipeId ?? null
  }), [data]);

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "RECIPE",
    item: () => {
      const payload = {
        recipe: {
          ...data,
          servings,
          _origin: originMeta
        }
      };
      try { onStartHighlight && onStartHighlight(payload.recipe); } catch (e) {}
      return payload;
    },
    end: () => { try { onClearHighlight && onClearHighlight(); } catch (e) {} },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [data, servings, onStartHighlight, onClearHighlight, originMeta]);

  if (!data) return null;

  // change servings locally; if in planner and item is from plan then call updateServings
  function changeServings(delta) {
    setServings((s) => {
      const next = Math.max(1, Math.round((s || 0) + delta));
      if (typeof onServingsChange === "function") {
        try { onServingsChange(next, data); } catch (e) {}
      } else if (plannerMode && (data.clientId || data.serverId)) {
        try {
          const d = originMeta.date || isoDate || null;
          const mt = originMeta.mealType || (mealTime || "unknown");
          if (d && mt) {
            const key = `${d}-${String(mt).toLowerCase()}`;
            const matcher = { clientId: data.clientId ?? null, serverId: data.serverId ?? null, recipeId: data.recipeId ?? data.id ?? null };
            updateServings(key, matcher, next).catch((e) => console.warn("updateServings failed", e));
          }
        } catch (e) {
          console.warn("auto updateServings failed", e);
        }
      }
      return next;
    });
  }

  function onServingsInput(e) {
    const v = parseInt(e.target.value, 10);
    if (Number.isNaN(v)) return;
    const next = Math.max(1, v);
    setServings(next);
    if (typeof onServingsChange === "function") {
      try { onServingsChange(next, data); } catch (e) {}
    } else if (plannerMode && (data.clientId || data.serverId)) {
      const d = originMeta.date || isoDate || null;
      const mt = originMeta.mealType || (mealTime || "unknown");
      if (d && mt) {
        const key = `${d}-${String(mt).toLowerCase()}`;
        const matcher = { clientId: data.clientId ?? null, serverId: data.serverId ?? null, recipeId: data.recipeId ?? data.id ?? null };
        updateServings(key, matcher, next).catch((e) => console.warn("updateServings failed", e));
      }
    }
  }

  async function handleAddClick(e) {
    e.stopPropagation();
    const servingsToSend = servings;
    if (typeof onAddToPlan === "function" && isoDate && mealTime) {
      await onAddToPlan(data, isoDate, mealTime, servingsToSend);
    } else {
      try { onStartHighlight && onStartHighlight({ ...data, servings: servingsToSend }); } catch (e) {}
    }
  }

  // whole-card click => view
  function handleCardClick(e) {
    if (isDragging) return;
    if (!data.id) return;
    window.location.href = `/recipe/${data.id}`;
  }

  // Minimized state (used by planner): make image smaller but still visible
  const isMinimized = plannerMode && minimized && !isHovered;

  // ALWAYS show image when present (we ignore hideImage for display logic)
  const hasImage = !!data.image;

  // compute base servings to scale macros
  const baseServings = Number(data.base_servings ?? data.recommended_servings ?? 1) || 1;
  const scale = Number(servings) / baseServings;

  const displayCalories = Math.round((data.calories ?? 0) * scale);
  const displayProtein = Math.round(((data.protein ?? 0) * scale) * 10) / 10;
  const displayCarbs = Math.round(((data.carbs ?? 0) * scale) * 10) / 10;
  const displayFat = Math.round(((data.fat ?? 0) * scale) * 10) / 10;

  // ---- styles (single unified theme) ----
  const removeButtonStyle = {
    position: 'absolute',
    top: 2,
    right: 5,
    background: "rgba(239,68,68,0.9)",
    border: "none",
    borderRadius: "50%",
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    zIndex: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.15s ease',
    opacity: isHovered ? 1 : 0,
    transform: isHovered ? 'scale(1)' : 'scale(0.8)'
  };

  const containerStyle = {
    borderRadius: isMinimized ? 10 : 12,
    border: isHovered ? "2px solid rgba(139,92,246,0.9)" : "1px solid rgba(148,163,184,0.12)",
    padding: isMinimized ? 8 : (compact ? 10 : 14),
    display: "flex",
    gap: isMinimized ? 8 : 12,
    alignItems: "center",
    opacity: isDragging ? 0.5 : 1,
    background: isMinimized ? "rgba(30,41,59,0.85)" : "rgba(30,41,59,0.9)",
    color: "#f8fafc",
    minWidth: 0,
    transition: 'all 0.18s ease',
    cursor: "pointer",
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.45)' : '0 4px 10px rgba(0,0,0,0.3)',
    overflow: "hidden",
    position: 'relative' // Added for absolute positioning of remove button
  };

  // image always shown when available; scale down for minimized
  const imageContainerStyle = {
    width: isMinimized ? 36 : (compact ? 48 : 88),
    height: isMinimized ? 36 : (compact ? 48 : 66),
    borderRadius: isMinimized ? 8 : 10,
    overflow: "hidden",
    background: hasImage ? "rgba(0,0,0,0.15)" : "rgba(139,92,246,0.06)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: hasImage ? 0 : 6,
    color: "#a78bfa",
    fontWeight: 700,
    textAlign: "center"
  };

  const titleStyle = {
    fontWeight: 700,
    fontSize: isMinimized ? 12 : (compact ? 14 : 16),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: 1.2
  };

  const caloriesStyle = {
    marginTop: "15px",
    fontWeight: 800,
    fontSize: isMinimized ? 11 : 14,
    color: "#a78bfa"
  };

  const macrosStyle = {
    marginTop: 6,
    display: isMinimized ? "none" : "flex",
    gap: 10,
    alignItems: "center",
    color: "#94a3b8",
    fontSize: 12
  };

  const servingsContainer = {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    alignItems: "center",
    marginTop: 8
  };

  const servingsButton = {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    color: "#a78bfa",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700'
  };

  const servingsInput = {
    width: 60,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "#f8fafc",
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '700',
    outline: 'none'
  };

  const addButtonSmall = {
    padding: "6px 8px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
    transition: 'all 0.15s ease'
  };

  const viewButtonStyle = {
    padding: "6px 8px",
    borderRadius: 8,
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.08)",
    textAlign: "center",
    display: "inline-block",
    background: "rgba(0,0,0,0.18)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600
  };

  return (
    <div
      ref={dragRef}
      style={containerStyle}
      role="article"
      aria-label={data.name}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
           {showRemoveButton && plannerMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove && onRemove(removeData);
          }}
          style={removeButtonStyle}
          title="Remove"
          aria-label={`Remove ${data.name}`}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      )}
      <div style={imageContainerStyle}>
        {hasImage ? (
          <img
            src={data.image}
            alt={data.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: 'transform 0.18s ease',
              transform: isHovered ? 'scale(1.03)' : 'scale(1)'
            }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          // fallback: initials
          <div style={{ padding: 4, fontSize: isMinimized ? 10 : 12, lineHeight: '1.1', textAlign: 'center', color: "#c7b3ff" }}>
            {(data.name || "").split(/\s+/).map(n => n[0]).slice(0,2).join("").toUpperCase()}
          </div>
        )}
      </div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMinimized ? 4 : 8 }}>
          <div style={titleStyle}>{data.name}</div>

          {!isMinimized && (
            <div style={{ textAlign: "right", minWidth: 90 }}>
              <div style={caloriesStyle}>{displayCalories} cal</div>

              <div style={servingsContainer}>
                {compact ? (
                  <>
                  </>
                ) : (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="number"
                      value={servings}
                      onChange={onServingsInput}
                      onClick={(e) => e.stopPropagation()}
                      style={servingsInput}
                      aria-label="Servings"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!isMinimized && (
          <div style={macrosStyle}>
            <div style={{ padding: '2px 6px', background: 'rgba(139,92,246,0.06)', borderRadius: '4px', fontSize: '11px' }}>
              P: {displayProtein}g
            </div>
            <div style={{ padding: '2px 6px', background: 'rgba(6,182,212,0.06)', borderRadius: '4px', fontSize: '11px' }}>
              C: {displayCarbs}g
            </div>
            <div style={{ padding: '2px 6px', background: 'rgba(245,158,11,0.06)', borderRadius: '4px', fontSize: '11px' }}>
              F: {displayFat}g
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      {!compact && !isMinimized && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          opacity: isHovered ? 1 : 0.95,
          transform: isHovered ? 'translateX(0)' : 'translateX(4px)',
          transition: 'all 0.12s ease'
        }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleAddClick}
            style={addButtonSmall}
            aria-label={`Add ${data.name} to plan`}
          >
            ➕
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); window.location.href = `/recipe/${data.id}`; }}
            style={viewButtonStyle}
            aria-label={`View ${data.name}`}
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}