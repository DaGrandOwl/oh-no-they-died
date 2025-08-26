import { useDrag } from "react-dnd";

export default function MealCard({
  recipe,
  item,
  compact = false,
  onOpenAddModal,
  onStartHighlight = () => {},
  onClearHighlight = () => {}
}) {
  const data = recipe || item;
  const [{ isDragging }, dragRef] = useDrag({
    type: "RECIPE",
    item: { recipe: data },
    begin: () => {
      // when dragging starts, notify parent to highlight planner slots
      try { onStartHighlight && onStartHighlight(data); } catch (e) {}
      return { recipe: data };
    },
    end: () => {
      // clear highlight when drag ends
      try { onClearHighlight && onClearHighlight(); } catch (e) {}
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  if (!data) return null;

  const handleAddClick = (e) => {
    e.stopPropagation();
    // prefer explicit modal handler if provided, otherwise start highlight (mobile)
    if (typeof onOpenAddModal === "function") {
      onOpenAddModal(data);
    } else {
      onStartHighlight(data);
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

          {/* Simple small stats */}
          <div style={{ textAlign: "right", minWidth: 80 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{data.calories ?? "-" } cal</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{data.servings ?? 1} serv</div>
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