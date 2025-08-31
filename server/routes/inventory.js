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

  // GET user inventory (returns all items for logged-in user)
  fastify.get("/api/user/inventory", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    try {
      const [rows] = await db.query(
        "SELECT id, item_name, quantity, unit, updated_at FROM user_inventory WHERE user_id = ?",
        [userId]
      );
      return { ok: true, inventory: rows || [] };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch inventory" });
    }
  });

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
          const newQty = (Number(row.quantity || 0) + delta);
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
        // Use item_name IN (...) - restrict to this user_id
        const [updatedRows] = await db.query(
          `SELECT id, item_name, quantity, unit, updated_at FROM user_inventory WHERE user_id = ? AND item_name IN (${placeholders})`,
          params
        );
        updated = updatedRows || [];
      } else {
        updated = [];
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
});