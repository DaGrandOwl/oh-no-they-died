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
  minimized = false,
  darkTheme = false
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
  const showImage = !hideImage && !!data.image && !compact;

  // Enhanced styles with smooth transitions and dark theme support
  const containerStyle = {
    borderRadius: isMinimized ? '12px' : '16px',
    border: darkTheme 
      ? (isHovered ? "2px solid rgba(139,92,246,0.8)" : "1px solid rgba(148,163,184,0.2)")
      : (isHovered ? "2px solid rgba(139,92,246,0.9)" : "1px solid rgba(148,163,184,0.18)"),
    padding: isMinimized ? '8px' : (compact ? 12 : 16),
    display: "flex",
    gap: isMinimized ? 8 : 12,
    alignItems: "center",
    opacity: isDragging ? 0.5 : 1,
    background: darkTheme 
      ? (isMinimized 
          ? (isHovered ? 'rgba(30,41,59,0.95)' : 'rgba(30,41,59,0.8)')
          : (isHovered ? 'rgba(30,41,59,0.95)' : 'rgba(30,41,59,0.9)')
        )
      : (isMinimized 
          ? (isHovered ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)')
          : "#fff"
        ),
    minWidth: 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: "pointer",
    outline: "none",
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: darkTheme
      ? (isHovered 
          ? '0 12px 24px rgba(139,92,246,0.15), 0 4px 12px rgba(0,0,0,0.4)'
          : (isMinimized ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.3)'))
      : (isHovered 
          ? '0 12px 24px rgba(139,92,246,0.15), 0 4px 12px rgba(0,0,0,0.1)'
          : (isMinimized ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.1)')),
    backdropFilter: darkTheme ? 'blur(12px)' : 'none',
    height: isMinimized ? '48px' : 'auto',
    overflow: 'hidden'
  };

  const imageContainerStyle = {
    width: isMinimized ? 32 : (compact ? 48 : (showImage ? 88 : 56)),
    height: isMinimized ? 32 : (compact ? 48 : (showImage ? 66 : 56)),
    borderRadius: isMinimized ? '8px' : '12px',
    overflow: "hidden",
    background: darkTheme 
      ? (showImage ? "rgba(30,41,59,0.4)" : "rgba(139,92,246,0.1)")
      : (showImage ? "#f8fafc" : "rgba(139,92,246,0.08)"),
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: isMinimized ? 10 : (compact ? 12 : 14),
    textAlign: "center",
    padding: showImage || isMinimized ? 0 : 6,
    color: darkTheme ? "#a78bfa" : "#8b5cf6",
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    border: darkTheme ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(139,92,246,0.1)'
  };

  const titleStyle = {
    fontWeight: 600,
    fontSize: isMinimized ? 13 : (compact ? 14 : 16),
    color: darkTheme ? "#f8fafc" : "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    lineHeight: '1.2'
  };

  const caloriesStyle = {
    fontWeight: 700,
    fontSize: isMinimized ? 11 : 14,
    color: darkTheme ? "#a78bfa" : "#7c3aed",
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const macrosStyle = {
    marginTop: 6,
    display: "flex",
    gap: 12,
    alignItems: "center",
    color: darkTheme ? "#94a3b8" : "#6b7280",
    fontSize: 12,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const servingsContainer = {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const servingsButton = {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: darkTheme ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(139,92,246,0.2)",
    background: darkTheme ? "rgba(30,41,59,0.8)" : "#fff",
    cursor: "pointer",
    color: darkTheme ? "#a78bfa" : "#8b5cf6",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: darkTheme ? '0 2px 4px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
  };

  const servingsInput = {
    width: 60,
    padding: "6px 8px",
    borderRadius: 8,
    border: darkTheme ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(139,92,246,0.2)",
    background: darkTheme ? "rgba(30,41,59,0.8)" : "#fff",
    color: darkTheme ? "#f8fafc" : "#0f172a",
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const addButtonSmall = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
  };

  const viewButtonStyle = {
    padding: "8px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: darkTheme ? "#94a3b8" : "#6b7280",
    border: darkTheme ? "1px solid rgba(148,163,184,0.2)" : "1px solid rgba(148,163,184,0.18)",
    textAlign: "center",
    display: "inline-block",
    background: darkTheme ? "rgba(30,41,59,0.6)" : "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)'
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
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              display: "block",
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
            }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : (
          // Planner: show short textual block in the image spot
          <div style={{ 
            padding: 4, 
            fontSize: isMinimized ? 10 : 12,
            lineHeight: '1.2',
            overflow: 'hidden',
            textAlign: 'center'
          }}>
            {hideImage ? 
              (isMinimized ? 
                (data.name || "").slice(0, 8) + (data.name?.length > 8 ? "..." : "") :
                (data.name || "").slice(0, 20) + (data.name?.length > 20 ? "..." : "")
              ) : 
              ((data.name || "").split(/\s+/).map(n => n[0]).slice(0,2).join("").toUpperCase())
            }
          </div>
        )}
      </div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMinimized ? 4 : 8 }}>
          <div style={titleStyle}>
            {data.name}
          </div>

          {!isMinimized && (
            <div style={{ textAlign: "right", minWidth: 90 }}>
              <div style={caloriesStyle}>{Math.round(data.calories ?? 0)} cal</div>

              <div style={servingsContainer}>
                {compact ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); changeServings(-1); }}
                      style={{
                        ...servingsButton,
                        ':hover': {
                          background: darkTheme ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)"
                        }
                      }}
                      onMouseEnter={(e) => e.target.style.background = darkTheme ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)"}
                      onMouseLeave={(e) => e.target.style.background = darkTheme ? "rgba(30,41,59,0.8)" : "#fff"}
                      aria-label="Decrease servings"
                    >
                      −
                    </button>
                    <div style={{ minWidth: 30, textAlign: "center", color: darkTheme ? "#f8fafc" : "#0f172a", fontWeight: '600' }}>{servings}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); changeServings(1); }}
                      style={servingsButton}
                      onMouseEnter={(e) => e.target.style.background = darkTheme ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)"}
                      onMouseLeave={(e) => e.target.style.background = darkTheme ? "rgba(30,41,59,0.8)" : "#fff"}
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
          )}
        </div>

        {!isMinimized && (
          <div style={macrosStyle}>
            <div style={{ padding: '2px 6px', background: darkTheme ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)', borderRadius: '4px', fontSize: '11px' }}>
              P: {data.protein ?? "-"}g
            </div>
            <div style={{ padding: '2px 6px', background: darkTheme ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.05)', borderRadius: '4px', fontSize: '11px' }}>
              C: {data.carbs ?? "-"}g
            </div>
            <div style={{ padding: '2px 6px', background: darkTheme ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)', borderRadius: '4px', fontSize: '11px' }}>
              F: {data.fat ?? "-"}g
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      {!compact && !isMinimized && (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 10,
          opacity: isHovered ? 1 : 0.8,
          transform: isHovered ? 'translateX(0)' : 'translateX(4px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleAddClick}
            style={addButtonSmall}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 6px 16px rgba(139,92,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = isHovered ? 'scale(1.05)' : 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)';
            }}
            aria-label={`Add ${data.name} to plan`}
          >
            Add
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); window.location.href = `/recipe/${data.id}`; }}
            style={viewButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.color = darkTheme ? "#e2e8f0" : "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = isHovered ? 'scale(1.05)' : 'scale(1)';
              e.target.style.color = darkTheme ? "#94a3b8" : "#6b7280";
            }}
            aria-label={`View ${data.name}`}
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}