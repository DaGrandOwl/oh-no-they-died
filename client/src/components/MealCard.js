import { useState, useEffect } from "react";
import { useDrag } from "react-dnd";

export default function MealCard({
  recipe,
  item,
  compact = false,
  onAddToPlan,
  isoDate,
  mealTime,
  onStartHighlight = () => {},
  onClearHighlight = () => {},
}) {
  const data = recipe || item;
  // pick initial servings: explicit value on data.servings, otherwise recommended_servings, otherwise base_servings, fallback 1
  const initialServings = (() => {
    if (!data) return 1;
    if (data.servings != null) return Math.max(1, Math.round(Number(data.servings)));
    if (data.recommended_servings != null) return Math.max(1, Math.round(Number(data.recommended_servings)));
    if (data.base_servings != null) return Math.max(1, Math.round(Number(data.base_servings)));
    return 1;
  })();

  const [servings, setServings] = useState(initialServings);

  // keep servings in sync if data changes (e.g. server merge replaced the item)
  useEffect(() => {
    setServings(initialServings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data && (data.servings ?? data.recommended_servings ?? data.base_servings)]);

  // drag: include the recipe data *and* the currently selected servings
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "RECIPE",
    item: () => {
      // attach servings so drop handler knows how many to add/move
      try { onStartHighlight && onStartHighlight({ ...data, servings }); } catch (e) {}
      return { recipe: { ...data, servings } };
    },
    end: () => {
      try { onClearHighlight && onClearHighlight(); } catch (e) {}
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [data, servings, onStartHighlight, onClearHighlight]);

  if (!data) return null;

  const changeServings = (delta) => {
    setServings((s) => {
      const next = Math.max(1, Math.round((s || 0) + delta));
      return next;
    });
  };

  const onServingsInput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isNaN(v)) return;
    setServings(Math.max(1, v));
  };

  const handleAddClick = async (e) => {
    e.stopPropagation();
    if (typeof onAddToPlan === "function" && isoDate && mealTime) {
      // call with current servings
      await onAddToPlan(data, isoDate, mealTime, servings);
    } else {
      // fallback: highlight for mobile
      try { onStartHighlight && onStartHighlight({ ...data, servings }); } catch (e) {}
    }
  };

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
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
      }}
      role="article"
      aria-label={data.name}
    >
      <div
        style={{
          width: compact ? 48 : 80,
          height: compact ? 48 : 60,
          borderRadius: 6,
          overflow: "hidden",
          background: "#f3f4f6",
          flexShrink: 0
        }}
      >
        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: compact ? 13 : 15, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.name}
          </div>

          <div style={{ textAlign: "right", minWidth: 90 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{Math.round(data.calories ?? 0)} cal</div>
            {/* show servings */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center", marginTop: 6 }}>
              {/* small decrement/increment for compact; input for non-compact */}
              {compact ? (
                <>
                  <button onClick={(e) => { e.stopPropagation(); changeServings(-1); }} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}>−</button>
                  <div style={{ minWidth: 26, textAlign: "center" }}>{servings}</div>
                  <button onClick={(e) => { e.stopPropagation(); changeServings(1); }} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}>+</button>
                </>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" value={servings} onChange={onServingsInput} style={{ width: 56, padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.08)" }} />
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
              <span key={a} style={{ fontSize: 11, background: "#fff7ed", color: "#92400e", padding: "2px 6px", borderRadius: 6, border: "1px solid rgba(249,115,22,0.08)" }}>
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

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