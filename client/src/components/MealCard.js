import { useState, useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";

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
  onServingsChange = null, // optional callback for parent to react to servings changes
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

  // image area: hide if hideImage or if compact (planner cards)
  const showImage = !hideImage && !!data.image && !compact;

  return (
    <div
      ref={dragRef}
      style={{
        borderRadius: 8,
        border: "1px solid rgba(229,231,235,0.6)",
        padding: compact ? 8 : 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
        opacity: isDragging ? 0.5 : 1,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        minWidth: 0
      }}
      role="article"
      aria-label={data.name}
    >
      {/* image / avatar */}
      <div
        style={{
          width: compact ? 40 : (showImage ? 80 : 48),
          height: compact ? 40 : (showImage ? 60 : 48),
          borderRadius: 6,
          overflow: "hidden",
          background: showImage ? "#f3f4f6" : "#eef2ff",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showImage ? (
          <img
            src={data.image}
            alt={data.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          // small placeholder: initials
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: compact ? 12 : 14, padding: 4 }}>
            {(data.name || "").split(/\s+/).map(n => n[0]).slice(0,2).join("").toUpperCase()}
          </div>
        )}
      </div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{
            fontWeight: 600,
            fontSize: compact ? 13 : 15,
            color: "#0f172a",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {data.name}
          </div>

          <div style={{ textAlign: "right", minWidth: 90 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{Math.round(data.calories ?? 0)} cal</div>

            {/* show servings */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center", marginTop: 6 }}>
              {compact ? (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); changeServings(-1); }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}
                    aria-label="Decrease servings"
                  >
                    −
                  </button>
                  <div style={{ minWidth: 26, textAlign: "center" }}>{servings}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); changeServings(1); }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}
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
                    style={{ width: 56, padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }}
                    aria-label="Servings"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", color: "#6b7280", fontSize: 12 }}>
          <div>P: {data.protein ?? "-" }g</div>
          <div>C: {data.carbs ?? "-" }g</div>
          <div>F: {data.fat ?? "-" }g</div>
        </div>

        {Array.isArray(data.allergens) && data.allergens.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {data.allergens.slice(0,3).map(a => (
              <span
                key={a}
                style={{
                  fontSize: 11,
                  background: "#fff7ed",
                  color: "#92400e",
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "1px solid rgba(249,115,22,0.08)"
                }}
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* controls */}
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={handleAddClick}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(90deg,#8b5cf6,#06b6d4)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600
            }}
            aria-label={`Add ${data.name} to plan`}
          >
            Add
          </button>

          <a
            href={`/recipe/${data.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              textDecoration: "none",
              color: "#6b7280",
              border: "1px solid rgba(148,163,184,0.12)",
              textAlign: "center",
              display: "inline-block"
            }}
            aria-label={`View ${data.name}`}
          >
            View
          </a>
        </div>
      )}
    </div>
  );
}