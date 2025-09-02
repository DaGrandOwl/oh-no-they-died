import { useState, useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";
import { usePlan } from "../contexts/PlanContext";

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
  minimized = false
}) {
  const data = recipe || item;
  const { updateServings } = usePlan();

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

  const originMeta = useMemo(() => {
    return {
      date: data?.date || data?.scheduled_date || data?.scheduledDate || null,
      mealType: data?.mealType || data?.meal_type || null,
      clientId: data?.clientId ?? null,
      serverId: data?.serverId ?? null,
      recipeId: data?.id ?? data?.recipeId ?? null
    };
  }, [data]);

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

  function changeServings(delta) {
    setServings((s) => {
      const next = Math.max(1, Math.round((s || 0) + delta));
      if (typeof onServingsChange === "function") {
        try { onServingsChange(next, data); } catch (e) {}
      } else if (plannerMode && (data.clientId || data.serverId)) {
        // auto-call PlanContext.updateServings if in planner and item is from plan
        try {
          // construct key used by PlanContext: YYYY-MM-DD-mealtype
          const d = originMeta.date || isoDate || null;
          const mt = originMeta.mealType || (mealTime || "unknown");
          if (d && mt) {
            const key = `${d}-${String(mt).toLowerCase()}`;
            const matcher = { clientId: data.clientId ?? null, serverId: data.serverId ?? null, recipeId: data.recipeId ?? data.id ?? null };
            // call but don't await
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
    // don't navigate if user is dragging
    if (isDragging) return;
    // don't navigate if click originated on an interactive control
    // controls use stopPropagation; this only fires when not stopped
    if (!data.id) return;
    window.location.href = `/recipe/${data.id}`;
  }

  const isMinimized = plannerMode && minimized && !isHovered;
  const showImage = !hideImage && !!data.image && !compact && !isMinimized;

  // styles (neutral)
  const containerStyle = {
    borderRadius: 8,
    border: isHovered ? "2px solid rgba(139,92,246,0.9)" : "1px solid rgba(148,163,184,0.18)",
    padding: isMinimized ? 6 : (compact ? 8 : 12),
    display: "flex",
    gap: isMinimized ? 6 : 12,
    alignItems: "center",
    opacity: isDragging ? 0.5 : 1,
    background: "#fff",
    minWidth: 0,
    transition: 'all 0.15s ease',
    cursor: "pointer",
    outline: "none"
  };

  const imageContainerStyle = {
    width: isMinimized ? 28 : (compact ? 40 : (showImage ? 80 : 48)),
    height: isMinimized ? 28 : (compact ? 40 : (showImage ? 60 : 48)),
    borderRadius: 6,
    overflow: "hidden",
    background: showImage ? "#f3f4f6" : "#eef2ff",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: isMinimized ? 10 : (compact ? 12 : 14),
    textAlign: "center",
    padding: 4
  };

  const titleStyle = {
    fontWeight: 600,
    fontSize: isMinimized ? 12 : (compact ? 13 : 15),
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  };

  const caloriesStyle = {
    fontWeight: 700,
    fontSize: isMinimized ? 10 : 13,
    color: "#7c3aed"
  };

  const macrosStyle = {
    marginTop: 6,
    display: isMinimized ? "none" : "flex",
    gap: 10,
    alignItems: "center",
    color: "#6b7280",
    fontSize: 12
  };

  const servingsContainer = {
    display: isMinimized ? "none" : "flex",
    justifyContent: "flex-end",
    gap: 6,
    alignItems: "center",
    marginTop: 6
  };

  const servingsButton = {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
    cursor: "pointer"
  };

  const servingsInput = {
    width: 56,
    padding: "4px 6px",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,0.08)"
  };

  const addButtonSmall = {
    padding: "6px 8px",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(90deg,#8b5cf6,#06b6d4)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13
  };

  const viewButtonStyle = {
    padding: "6px 10px",
    borderRadius: 6,
    textDecoration: "none",
    color: "#6b7280",
    border: "1px solid rgba(148,163,184,0.12)",
    textAlign: "center",
    display: "inline-block",
    background: "#fff",
    cursor: "pointer"
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
      {/* image / placeholder / planner text */}
      <div style={imageContainerStyle}>
        {showImage ? (
          <img
            src={data.image}
            alt={data.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          // Planner: show short textual block in the image spot
          <div style={{ padding: 4, fontSize: 12 }}>
            {hideImage ? (data.name || "").slice(0, 20) : ((data.name || "").split(/\s+/).map(n => n[0]).slice(0,2).join("").toUpperCase())}
          </div>
        )}
      </div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMinimized ? 4 : 8 }}>
          <div style={titleStyle}>
            {data.name}
          </div>

          <div style={{ textAlign: "right", minWidth: isMinimized ? 'auto' : 90 }}>
            <div style={caloriesStyle}>{Math.round(data.calories ?? 0)} cal</div>

            <div style={servingsContainer}>
              {compact ? (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); changeServings(-1); }}
                    style={servingsButton}
                    aria-label="Decrease servings"
                  >
                    −
                  </button>
                  <div style={{ minWidth: 26, textAlign: "center" }}>{servings}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); changeServings(1); }}
                    style={servingsButton}
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
                    style={servingsInput}
                    aria-label="Servings"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={macrosStyle}>
          <div>P: {data.protein ?? "-" }g</div>
          <div>C: {data.carbs ?? "-" }g</div>
          <div>F: {data.fat ?? "-" }g</div>
        </div>
      </div>

      {/* controls */}
      {!compact && !isMinimized && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onClick={(e) => e.stopPropagation()}>
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