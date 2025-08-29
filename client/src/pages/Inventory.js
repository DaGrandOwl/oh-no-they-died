// frontend/src/pages/InventoryPage.js
import React, { useEffect, useState } from "react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchInventory() {
    try {
      const res = await fetch("/api/user/inventory", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setInventory(data || []);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  }

  async function adjustItem(itemName, delta, unit) {
    try {
      const res = await fetch("/api/user/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ item_name: itemName, delta, unit }),
      });
      if (!res.ok) throw new Error("Failed to adjust");
      await fetchInventory();
    } catch (err) {
      console.error("Adjust failed", err);
    }
  }

  async function removeItem(itemName) {
    try {
      const res = await fetch("/api/user/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ item_name: itemName, delta: 0, unit: null, remove: true }),
      });
      if (!res.ok) throw new Error("Remove failed");
      await fetchInventory();
    } catch (err) {
      console.error("Remove failed", err);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading inventory...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>My Inventory</h2>
      {inventory.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No items in inventory.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: 8 }}>Item</th>
              <th style={{ padding: 8 }}>Quantity</th>
              <th style={{ padding: 8 }}>Unit</th>
              <th style={{ padding: 8 }}>Last Updated</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: 8, fontWeight: 500 }}>{item.item_name}</td>
                <td style={{ padding: 8 }}>{item.quantity}</td>
                <td style={{ padding: 8 }}>{item.unit || "-"}</td>
                <td style={{ padding: 8, color: "#6b7280", fontSize: 12 }}>
                  {new Date(item.updated_at).toLocaleString()}
                </td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => adjustItem(item.item_name, -1, item.unit)}
                    style={{
                      marginRight: 6,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => adjustItem(item.item_name, 1, item.unit)}
                    style={{
                      marginRight: 6,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.item_name)}
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#b91c1c",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
