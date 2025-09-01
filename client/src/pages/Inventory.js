import { useEffect, useState } from "react";
import { toast } from "react-toastify";

function titleCase(s) {
  if (!s) return s;
  return s.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]); // user's inventory rows (array)
  const [known, setKnown] = useState([]); // master known ingredients (array of {item_name, unit})
  const [changes, setChanges] = useState([]); // upcoming changes (array)
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({}); // { item_name: <string qty> }
  const token = localStorage.getItem("token");

  useEffect(() => {
    toast.info("To add/change any ingredients, please update the 'quantity' present.");
  }, []);

  async function safeJson(res) {
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; } catch { return { html: text }; }
  }

  async function fetchAll() {
    setLoading(true);
    try {
      // fetch user inventory
      const [res1, res2, res3] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/user/inventory`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${process.env.REACT_APP_API_URL}/api/ingredients`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${process.env.REACT_APP_API_URL}/api/user/inventory/changes?days=7`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      ]);
      const d1 = await safeJson(res1);
      const d2 = await safeJson(res2);
      const d3 = await safeJson(res3);

      if (!res1.ok) {
        console.error("Failed to load inventory", d1);
        toast.error("Failed to load inventory");
        setInventory([]);
      } else {
        // backend returns { ok: true, inventory: [...] }
        setInventory(Array.isArray(d1?.inventory) ? d1.inventory : []);
      }

      if (!res2.ok) {
        console.error("Failed to load known ingredients", d2);
        setKnown([]);
      } else {
        const ing = d2?.ingredients ?? d2?.names ?? [];
        const normalized = (Array.isArray(ing) ? ing : []).map(x => {
          if (typeof x === "string") return { item_name: x, unit: null };
          return { item_name: x.item_name ?? x.name ?? "", unit: x.unit ?? null };
        });
        setKnown(normalized);
      }

      if (!res3.ok) {
        console.error("Failed to load upcoming changes", d3);
        setChanges([]);
      } else {
        // expecting { ok:true, changes: [...] } or array
        const ch = d3?.changes ?? d3?.updated ?? d3 ?? [];
        setChanges(Array.isArray(ch) ? ch : []);
      }
    } catch (err) {
      console.error("Failed to load inventory or ingredients", err);
      toast.error("Failed to load inventory or ingredients");
      setInventory([]); setKnown([]); setChanges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function saveQuantity(itemRow, newQtyRaw) {
    const prevQty = Number(itemRow?.quantity ?? 0);
    const newQty = Number(newQtyRaw);
    if (Number.isNaN(newQty)) { toast.error("Invalid quantity"); return; }
    const delta = newQty - prevQty;

    try {
      const adjustments = [{ item_name: itemRow.item_name, delta, unit: itemRow.unit ?? null }];
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/inventory/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ adjustments })
      });
      const text = await res.text();
      if (!res.ok) {
        console.error("Adjust failed", text);
        toast.error("Failed to save quantity");
        return;
      }
      // backend returns { ok:true, updated: [...] }
      toast.success("Saved");
      // refresh locally
      await fetchAll();
    } catch (err) {
      console.error("Adjust failed", err);
      toast.error("Failed to save quantity");
    }
  }

  async function saveNewForKnown(itemName, unit, newQtyRaw) {
    const newQty = Number(newQtyRaw);
    if (Number.isNaN(newQty)) { toast.error("Invalid quantity"); return; }
    try {
      const adjustments = [{ item_name: itemName, delta: newQty, unit }];
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user/inventory/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ adjustments })
      });
      const text = await res.text();
      if (!res.ok) {
        console.error("Adjust failed", text);
        toast.error("Failed to add quantity");
        return;
      }
      toast.success("Added to your inventory");
      await fetchAll();
    } catch (err) {
      console.error("Add failed", err);
      toast.error("Failed to add");
    }
  }

  // compute quick lookup maps
  const invMap = {};
  inventory.forEach(r => { invMap[r.item_name] = r; });

  // compute upcoming net adjustments per item in next 7 days
  const upcomingNet = {};
  changes.forEach(c => {
    const name = c.item_name;
    const val = Number(c.delta || 0);
    upcomingNet[name] = (upcomingNet[name] || 0) + val;
  });

  // build "in inventory" list and "not in inventory" list
  const inInventory = inventory.filter(i => (Number(i.quantity || 0) !== 0));
  const notInventory = known.filter(k => {
    const present = invMap[k.item_name];
    return !present || Number(present.quantity || 0) === 0;
  });

  // within inInventory split into runOutSoon and remaining
  const runOutSoon = [];
  const remaining = [];
  inInventory.forEach(item => {
    const current = Number(item.quantity || 0);
    const projected = current + (upcomingNet[item.item_name] || 0);
    // will run out if projected <= 0 within next week
    if (projected <= 0) runOutSoon.push({ ...item, projected });
    else remaining.push({ ...item, projected });
  });

  if (loading) return <div style={{ padding: 20 }}>Loading inventory...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>My Inventory</h2>

      <section style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Will run out within 7 days</h3>
        {runOutSoon.length === 0 ? <div style={{ color: "#6b7280" }}>No items will fully run out within next week.</div> :
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Item</th>
                <th style={{ padding: 8 }}>Quantity</th>
                <th style={{ padding: 8 }}>Unit</th>
                <th style={{ padding: 8 }}>Projected (7d)</th>
                <th style={{ padding: 8 }}>Last Updated</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runOutSoon.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, fontWeight: 500 }}>{titleCase(item.item_name)}</td>
                  <td style={{ padding: 8 }}>
                    <input value={editing[item.item_name] ?? String(item.quantity ?? 0)} onChange={(e) => setEditing(prev => ({ ...prev, [item.item_name]: e.target.value }))} style={{ width: 80 }} />
                  </td>
                  <td style={{ padding: 8 }}>{item.unit || "-"}</td>
                  <td style={{ padding: 8, color: "#b91c1c" }}>{item.projected}</td>
                  <td style={{ padding: 8, color: "#6b7280", fontSize: 12 }}>{new Date(item.updated_at).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => saveQuantity(item, editing[item.item_name] ?? String(item.quantity ?? 0))} style={{ marginRight: 6 }}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Remaining in inventory</h3>
        {remaining.length === 0 ? <div style={{ color: "#6b7280" }}>No remaining items.</div> :
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Item</th>
                <th style={{ padding: 8 }}>Quantity</th>
                <th style={{ padding: 8 }}>Unit</th>
                <th style={{ padding: 8 }}>Projected (7d)</th>
                <th style={{ padding: 8 }}>Last Updated</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {remaining.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, fontWeight: 500 }}>{titleCase(item.item_name)}</td>
                  <td style={{ padding: 8 }}>
                    <input value={editing[item.item_name] ?? String(item.quantity ?? 0)} onChange={(e) => setEditing(prev => ({ ...prev, [item.item_name]: e.target.value }))} style={{ width: 80 }} />
                  </td>
                  <td style={{ padding: 8 }}>{item.unit || "-"}</td>
                  <td style={{ padding: 8 }}>{item.projected}</td>
                  <td style={{ padding: 8, color: "#6b7280", fontSize: 12 }}>{new Date(item.updated_at).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => saveQuantity(item, editing[item.item_name] ?? String(item.quantity ?? 0))} style={{ marginRight: 6 }}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>

      <section>
        <h3 style={{ marginBottom: 8 }}>Known items not in your inventory</h3>
        {notInventory.length === 0 ? <div style={{ color: "#6b7280" }}>No known items missing.</div> :
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 8 }}>Item</th>
                <th style={{ padding: 8 }}>Add Quantity</th>
                <th style={{ padding: 8 }}>Unit</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notInventory.map(k => (
                <tr key={k.item_name} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, fontWeight: 500 }}>{titleCase(k.item_name)}</td>
                  <td style={{ padding: 8 }}>
                    <input value={editing[`known-${k.item_name}`] ?? ""} onChange={(e) => setEditing(prev => ({ ...prev, [`known-${k.item_name}`]: e.target.value }))} style={{ width: 80 }} placeholder="0" />
                  </td>
                  <td style={{ padding: 8 }}>{k.unit || "-"}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => saveNewForKnown(k.item_name, k.unit, editing[`known-${k.item_name}`] ?? "0")}>Add</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>
    </div>
  );
}