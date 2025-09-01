import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RefreshCw, AlertTriangle, Package, PlusCircle } from "lucide-react";

function titleCase(s) {
  if (!s) return s;
  return s.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [known, setKnown] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
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
      toast.success("Saved");
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

  // Styling constants
  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #164e63 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#f8fafc',
    padding: '2rem'
  };

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem'
  };

  const buttonPrimary = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.875rem',
    fontWeight: '500',
    background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
    color: 'white'
  };

  const buttonGhost = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.875rem',
    fontWeight: '500',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.2)'
  };

  const inputStyle = {
    padding: '0.5rem 0.75rem',
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '0.5rem',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s',
    width: '80px'
  };

  // Compute data
  const invMap = {};
  inventory.forEach(r => { invMap[r.item_name] = r; });

  const upcomingNet = {};
  changes.forEach(c => {
    const name = c.item_name;
    const val = Number(c.delta || 0);
    upcomingNet[name] = (upcomingNet[name] || 0) + val;
  });

  const inInventory = inventory.filter(i => (Number(i.quantity || 0) !== 0));
  const notInventory = known.filter(k => {
    const present = invMap[k.item_name];
    return !present || Number(present.quantity || 0) === 0;
  });

  const runOutSoon = [];
  const remaining = [];
  inInventory.forEach(item => {
    const current = Number(item.quantity || 0);
    const projected = current + (upcomingNet[item.item_name] || 0);
    if (projected <= 0) runOutSoon.push({ ...item, projected });
    else remaining.push({ ...item, projected });
  });

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            color: '#94a3b8'
          }}>
            <RefreshCw className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            Loading inventory...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
            My Inventory
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Manage your ingredients and track upcoming usage
          </p>
        </div>
        <button 
          onClick={fetchAll} 
          style={buttonGhost}
          title="Refresh inventory"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Will run out soon section */}
      <section style={cardStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          color: '#f87171'
        }}>
          <AlertTriangle size={20} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
            Will run out within 7 days
          </h3>
        </div>
        
        {runOutSoon.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>
            No items will fully run out within next week.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Quantity</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Projected (7d)</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Updated</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runOutSoon.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500', color: '#e2e8f0' }}>{titleCase(item.item_name)}</td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        value={editing[item.item_name] ?? String(item.quantity ?? 0)} 
                        onChange={(e) => setEditing(prev => ({ ...prev, [item.item_name]: e.target.value }))} 
                        style={inputStyle}
                        type="number"
                        min="0"
                        step="0.1"
                      />
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{item.unit || "-"}</td>
                    <td style={{ padding: '1rem', color: '#f87171', fontWeight: '500' }}>{item.projected}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                      {new Date(item.updated_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => saveQuantity(item, editing[item.item_name] ?? String(item.quantity ?? 0))} 
                        style={buttonPrimary}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Remaining inventory section */}
      <section style={cardStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          color: '#a78bfa'
        }}>
          <Package size={20} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
            Remaining in inventory
          </h3>
        </div>
        
        {remaining.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>
            No remaining items.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Quantity</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Projected (7d)</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Updated</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {remaining.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500', color: '#e2e8f0' }}>{titleCase(item.item_name)}</td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        value={editing[item.item_name] ?? String(item.quantity ?? 0)} 
                        onChange={(e) => setEditing(prev => ({ ...prev, [item.item_name]: e.target.value }))} 
                        style={inputStyle}
                        type="number"
                        min="0"
                        step="0.1"
                      />
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{item.unit || "-"}</td>
                    <td style={{ padding: '1rem', color: '#4ade80', fontWeight: '500' }}>{item.projected}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                      {new Date(item.updated_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => saveQuantity(item, editing[item.item_name] ?? String(item.quantity ?? 0))} 
                        style={buttonPrimary}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Known items section */}
      <section style={cardStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          color: '#06b6d4'
        }}>
          <PlusCircle size={20} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
            Known items not in your inventory
          </h3>
        </div>
        
        {notInventory.length === 0 ? (
          <div style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>
            No known items missing.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Add Quantity</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notInventory.map(k => (
                  <tr key={k.item_name} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500', color: '#e2e8f0' }}>{titleCase(k.item_name)}</td>
                    <td style={{ padding: '1rem' }}>
                      <input 
                        value={editing[`known-${k.item_name}`] ?? ""} 
                        onChange={(e) => setEditing(prev => ({ ...prev, [`known-${k.item_name}`]: e.target.value }))} 
                        style={inputStyle}
                        placeholder="0"
                        type="number"
                        min="0"
                        step="0.1"
                      />
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{k.unit || "-"}</td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => saveNewForKnown(k.item_name, k.unit, editing[`known-${k.item_name}`] ?? "0")}
                        style={buttonPrimary}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          input:focus {
            border-color: #8b5cf6;
            outline: none;
          }
          button:hover {
            opacity: 0.9;
          }
        `}
      </style>
    </div>
  );
}