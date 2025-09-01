import fp from "fastify-plugin";

export default fp(async function(fastify) {
  const db = fastify.db;

  // GET recipe ingredients + base_servings (joins recipe_instructions)
  fastify.get("/api/recipes/:id/ingredients", async (request, reply) => {
    const recipeId = Number(request.params.id);
    if (!recipeId) return reply.code(400).send({ error: "Invalid recipe ID" });

    try {
      const [rows] = await db.query(
        `SELECT ri.id, ri.recipe_id, ri.item_name, ri.quantity, ri.unit, ri.notes,
                COALESCE(rins.base_servings, NULL) AS base_servings
         FROM recipe_ingredients ri
         LEFT JOIN recipe_instructions rins ON rins.recipe_id = ri.recipe_id
         WHERE ri.recipe_id = ?`,
        [recipeId]
      );
      return { ok: true, ingredients: rows || [] };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch ingredients" });
    }
  });

// GET known ingredients (used for not-in-inventory)
  fastify.get("/api/ingredients", async (request, reply) => {
    try {
      // master list is indexed by user_id = 0
      const [rows] = await fastify.db.query(
        `SELECT DISTINCT item_name, unit FROM recipe_ingredients WHERE recipe_id = 0 AND item_name IS NOT NULL AND item_name <> '' ORDER BY item_name ASC`
      );
      const list = (rows || []).map(r => ({ item_name: r.item_name, unit: r.unit }));
      return reply.send({ ok: true, ingredients: list });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch known ingredients" });
    }
  });

  // GET user inventory (returns all items for logged-in user)
  fastify.get("/api/user/inventory", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    try {
      const [rows] = await db.query(
        "SELECT id, item_name, quantity, unit, updated_at FROM user_inventory WHERE user_id = ? ORDER BY item_name ASC",
        [userId]
      );
      return { ok: true, inventory: rows || [] };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch inventory" });
    }
  });

  // POST adjust user inventory (batch)
  fastify.post("/api/user/inventory/adjust", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { adjustments } = request.body;

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return reply.code(400).send({ error: "No adjustments provided" });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Normalize adjustments and track item names that changed
      const touchedNames = new Set();

      for (const adj of adjustments) {
        const item_name = String(adj.item_name || "").trim();
        const delta = Number(adj.delta || 0);
        const unit = adj.unit || null;

        if (!item_name) continue; // skip invalid

        // Try to find existing inventory row (match by item_name + unit)
        const [rows] = await conn.query(
          "SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_name = ? AND (unit = ? OR (unit IS NULL AND ? IS NULL)) LIMIT 1",
          [userId, item_name, unit, unit]
        );

        if (rows.length > 0) {
          const row = rows[0];
          let newQty = Number(row.quantity || 0) + delta;
          // ensure non-null numeric; allow negative to indicate shortage
          if (!Number.isFinite(newQty)) newQty = 0;
          await conn.query("UPDATE user_inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newQty, row.id]);
          touchedNames.add(item_name);
        } else {
          // Insert a new row with the delta (can be negative to show shortage)
          await conn.query("INSERT INTO user_inventory (user_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)", [userId, item_name, delta, unit]);
          touchedNames.add(item_name);
        }
      }

      await conn.commit();

      // Return updated rows for touched items so client can update local UI and detect negatives
      const namesArr = Array.from(touchedNames);
      let updated = [];
      if (namesArr.length > 0) {
        const placeholders = namesArr.map(() => "?").join(",");
        const params = [userId, ...namesArr];
        const [updatedRows] = await db.query(
          `SELECT id, item_name, quantity, unit, updated_at FROM user_inventory WHERE user_id = ? AND item_name IN (${placeholders})`,
          params
        );
        updated = updatedRows || [];
      }

      return reply.send({ ok: true, updated });
    } catch (err) {
      await conn.rollback();
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to adjust inventory" });
    } finally {
      conn.release();
    }
  });

  // GET user inventory changes over date range (default next 7 days)
  fastify.get("/api/user/inventory/changes", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const days = Number(request.query.days ?? 7);
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + days);
      const startStr = today.toISOString().slice(0,10);
      const endStr = end.toISOString().slice(0,10);

      const [rows] = await fastify.db.query(
        `SELECT id, user_id, mealplan_id, item_name, delta, unit, DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date
        FROM user_inventory_changes
        WHERE user_id = ? AND scheduled_date BETWEEN ? AND ?
        ORDER BY scheduled_date ASC`,
        [userId, startStr, endStr]
      );
      return reply.send({ ok: true, changes: rows || [] });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch inventory changes" });
    }
  });
});