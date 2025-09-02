import fp from "fastify-plugin";

export default fp(async function (fastify) {
  function isValidDateYYYYMMDD(s) {
    if (!s || typeof s !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
  }

  // POST /api/user/mealplan - create & schedule/apply changes (stores base_servings)
  fastify.post("/api/user/mealplan", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const conn = await fastify.db.getConnection();
    try {
      const userId = request.user?.id;
      const { recipeId, date, mealType, servings } = request.body || {};

      if (!recipeId || !date || !mealType || servings == null) {
        conn.release();
        return reply.status(400).send({ error: "Missing required fields" });
      }
      if (!isValidDateYYYYMMDD(date)) {
        conn.release();
        return reply.status(400).send({ error: "Invalid date format, expected YYYY-MM-DD" });
      }

      const safeMealType = String(mealType).toLowerCase();
      const serv = Number(servings || 1);

      // get recipe base_servings (if any) to persist into user_mealplan.base_servings
      const [riRows] = await conn.query(
        `SELECT COALESCE(base_servings, NULL) AS base_servings FROM recipe_instructions WHERE recipe_id = ? LIMIT 1`,
        [recipeId]
      );
      const baseServFromRecipe = (riRows && riRows[0] && riRows[0].base_servings != null) ? Number(riRows[0].base_servings) : 1;

      await conn.beginTransaction();

      // insert including base_servings column
      const insertSql = `
        INSERT INTO user_mealplan (user_id, recipe_id, scheduled_date, meal_type, servings, base_servings)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await conn.query(insertSql, [userId, recipeId, date, safeMealType, serv, baseServFromRecipe]);
      const insertedId = result.insertId;

      // Fetch the inserted row with recipe metadata (including base_servings)
      const [rows] = await conn.query(
        `SELECT
          ump.id,
          ump.recipe_id AS recipeId,
          DATE_FORMAT(ump.scheduled_date, '%Y-%m-%d') AS date,
          LOWER(ump.meal_type) AS mealType,
          ump.servings,
          DATE_FORMAT(ump.created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
          rg.name,
          rg.calories,
          rg.protein,
          rg.carbs,
          rg.fat,
          rg.allergens,
          ump.base_servings AS base_servings,
          ri.appx_mass,
          ri.image AS image
        FROM user_mealplan AS ump
        LEFT JOIN recipe_general AS rg ON rg.id = ump.recipe_id
        LEFT JOIN recipe_instructions AS ri ON ri.recipe_id = rg.id
        WHERE ump.id = ? AND ump.user_id = ?`,
        [insertedId, userId]
      );

      const saved = rows[0] || null;
      if (saved && saved.allergens && typeof saved.allergens === "string") {
        saved.allergens = saved.allergens.split(",").map(s => s.trim()).filter(Boolean);
      } else if (saved) {
        saved.allergens = saved.allergens || [];
      }

      // Gather ingredients and compute adjustments as before (using recipe_ingredients + recipe_instructions.base_servings)
      const [ings] = await conn.query(
        `SELECT ri.id, ri.item_name, ri.quantity, ri.unit, COALESCE(rins.base_servings, NULL) AS base_servings
         FROM recipe_ingredients ri
         LEFT JOIN recipe_instructions rins ON rins.recipe_id = ri.recipe_id
         WHERE ri.recipe_id = ?`,
        [recipeId]
      );

      const baseServings = (ings && ings.length && ings[0].base_servings)
        ? Number(ings[0].base_servings)
        : (saved?.base_servings ? Number(saved.base_servings) : 1);

      const adjustments = [];
      for (const ing of (ings || [])) {
        const itemName = String(ing.item_name || "").trim();
        if (!itemName) continue;
        const rawAmt = Number(ing.quantity || 0) || 0;
        const qty = rawAmt * (serv / (Number(baseServings) || 1));
        if (qty === 0) continue;
        adjustments.push({ item_name: itemName, delta: -qty, unit: ing.unit || null });
      }

      // determine whether to apply now (legacy behavior or explicit applyNow)
      let applyNow = false;
      if (typeof request.body?.applyNow !== "undefined") {
        applyNow = !!request.body.applyNow;
      } else {
        const todayUTC = new Date().toISOString().slice(0, 10);
        applyNow = (date === todayUTC);
      }

      if (applyNow) {
        if (adjustments.length > 0) {
          for (const adj of adjustments) {
            const item_name = String(adj.item_name || "").trim();
            const delta = Number(adj.delta || 0);
            const unit = adj.unit || null;
            if (!item_name) continue;

            const [invRows] = await conn.query(
              `SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_name = ? AND (unit = ? OR (unit IS NULL AND ? IS NULL)) LIMIT 1 FOR UPDATE`,
              [userId, item_name, unit, unit]
            );
            if (invRows.length > 0) {
              const rowInv = invRows[0];
              let newQty = Number(rowInv.quantity || 0) + delta;
              if (!Number.isFinite(newQty)) newQty = 0;
              await conn.query("UPDATE user_inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newQty, rowInv.id]);
            } else {
              await conn.query("INSERT INTO user_inventory (user_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)", [userId, item_name, delta, unit]);
            }
          }
        }
      } else {
        if (adjustments.length > 0) {
          for (const adj of adjustments) {
            await conn.query(
              `INSERT INTO user_inventory_changes (user_id, mealplan_id, item_name, delta, unit, scheduled_date)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, insertedId, adj.item_name, adj.delta, adj.unit, date]
            );
          }
        }
      }

      await conn.commit();
      conn.release();
      return reply.status(201).send(saved);
    } catch (err) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
      conn.release();
      fastify.log.error(err);
      return reply.status(500).send({ error: "Server error" });
    }
  });

  // PATCH /api/user/mealplan/:id (update servings & inventory changes)
  // (Keep existing behavior: update user_mealplan.servings; if applyNow apply inventory diffs; else rebuild user_inventory_changes)
  fastify.patch("/api/user/mealplan/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const conn = await fastify.db.getConnection();
    try {
      const userId = request.user?.id;
      const id = parseInt(request.params.id, 10);
      if (!id) { conn.release(); return reply.status(400).send({ error: "Invalid id" }); }

      const { servings: newServRaw, applyNow: applyNowBody } = request.body || {};
      if (typeof newServRaw === "undefined" || newServRaw === null) { conn.release(); return reply.status(400).send({ error: "Missing servings" }); }
      const newServ = Math.max(1, Math.round(Number(newServRaw) || 1));

      const [rows] = await conn.query(
        "SELECT id, recipe_id, servings, DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date FROM user_mealplan WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      if (!rows.length) { conn.release(); return reply.status(404).send({ error: "Not found" }); }

      const row = rows[0];
      const oldServ = Number(row.servings || 0);
      const delta = newServ - oldServ;
      if (delta === 0) { conn.release(); return reply.send({ ok: true, updated: { id: row.id, servings: oldServ } }); }

      const todayUTC = new Date().toISOString().slice(0,10);
      const scheduledDate = row.scheduled_date;
      const applyNow = (typeof applyNowBody !== "undefined") ? !!applyNowBody : (scheduledDate && scheduledDate <= todayUTC);

      await conn.beginTransaction();

      await conn.query("UPDATE user_mealplan SET servings = ? WHERE id = ? AND user_id = ?", [newServ, id, userId]);

      if (applyNow) {
        // apply immediate inventory diffs for delta
        const recipeId = row.recipe_id;
        const [ings] = await conn.query(
          `SELECT ri.item_name, ri.quantity, ri.unit, COALESCE(rins.base_servings, NULL) AS base_servings
           FROM recipe_ingredients ri
           LEFT JOIN recipe_instructions rins ON rins.recipe_id = ri.recipe_id
           WHERE ri.recipe_id = ?`,
          [recipeId]
        );

        const baseServings = (ings && ings.length && ings[0].base_servings) ? Number(ings[0].base_servings) : 1;
        const absDelta = Math.abs(delta);
        const sign = delta > 0 ? -1 : 1;

        for (const ing of (ings || [])) {
          const itemName = String(ing.item_name || "").trim();
          if (!itemName) continue;
          const rawAmt = Number(ing.quantity || 0) || 0;
          const qty = rawAmt * (absDelta / (Number(baseServings) || 1));
          if (qty === 0) continue;
          const change = sign * qty;

          const [invRows] = await conn.query(
            `SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_name = ? AND (unit = ? OR (unit IS NULL AND ? IS NULL)) LIMIT 1 FOR UPDATE`,
            [userId, itemName, ing.unit || null, ing.unit || null]
          );
          if (invRows.length > 0) {
            const rowInv = invRows[0];
            let newQty = Number(rowInv.quantity || 0) + change;
            if (!Number.isFinite(newQty)) newQty = 0;
            await conn.query("UPDATE user_inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newQty, rowInv.id]);
          } else {
            await conn.query("INSERT INTO user_inventory (user_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)", [userId, itemName, change, ing.unit || null]);
          }
        }
      } else {
        // rebuild scheduled rows
        await conn.query("DELETE FROM user_inventory_changes WHERE mealplan_id = ?", [id]);

        if (newServ !== 0) {
          const recipeId = row.recipe_id;
          const [ings2] = await conn.query(
            `SELECT ri.item_name, ri.quantity, ri.unit, COALESCE(rins.base_servings, NULL) AS base_servings
             FROM recipe_ingredients ri
             LEFT JOIN recipe_instructions rins ON rins.recipe_id = ri.recipe_id
             WHERE ri.recipe_id = ?`,
            [recipeId]
          );
          const baseServings2 = (ings2 && ings2.length && ings2[0].base_servings) ? Number(ings2[0].base_servings) : 1;

          for (const ing of (ings2 || [])) {
            const itemName = String(ing.item_name || "").trim();
            if (!itemName) continue;
            const rawAmt = Number(ing.quantity || 0) || 0;
            const qty = rawAmt * (newServ / (Number(baseServings2) || 1));
            if (qty === 0) continue;
            await conn.query(
              `INSERT INTO user_inventory_changes (user_id, mealplan_id, item_name, delta, unit, scheduled_date)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, id, itemName, -qty, ing.unit || null, scheduledDate]
            );
          }
        }
      }

      await conn.commit();

      const [updatedRows] = await conn.query(
        `SELECT ump.id, ump.recipe_id AS recipeId, DATE_FORMAT(ump.scheduled_date, '%Y-%m-%d') AS date,
                LOWER(ump.meal_type) AS mealType, ump.servings,
                DATE_FORMAT(ump.created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at
         FROM user_mealplan ump WHERE ump.id = ? AND ump.user_id = ?`,
        [id, userId]
      );

      conn.release();
      return reply.send({ ok: true, updated: updatedRows[0] || null });
    } catch (err) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
      conn.release();
      fastify.log.error(err);
      return reply.status(500).send({ error: "Server error" });
    }
  });

  // GET /api/user/mealplan (unchanged except will return base_servings from user_mealplan)
  fastify.get("/api/user/mealplan", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const { start, end } = request.query || {};

      let sql = `
        SELECT
          ump.id,
          ump.recipe_id AS recipeId,
          DATE_FORMAT(ump.scheduled_date, '%Y-%m-%d') AS date,
          LOWER(ump.meal_type) AS mealType,
          ump.servings,
          DATE_FORMAT(ump.created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
          rg.name,
          rg.calories,
          rg.protein,
          rg.carbs,
          rg.fat,
          rg.allergens,
          ump.base_servings,
          ri.appx_mass,
          ri.image AS image
        FROM user_mealplan AS ump
        LEFT JOIN recipe_general AS rg ON rg.id = ump.recipe_id
        LEFT JOIN recipe_instructions AS ri ON ri.recipe_id = rg.id
        WHERE ump.user_id = ?
      `;
      const params = [userId];

      if (start && end) {
        if (!isValidDateYYYYMMDD(start) || !isValidDateYYYYMMDD(end)) {
          return reply.status(400).send({ error: "Invalid start/end date (expected YYYY-MM-DD)" });
        }
        sql += " AND ump.scheduled_date BETWEEN ? AND ?";
        params.push(start, end);
      } else if (start) {
        if (!isValidDateYYYYMMDD(start)) {
          return reply.status(400).send({ error: "Invalid start date (expected YYYY-MM-DD)" });
        }
        sql += " AND ump.scheduled_date >= ?";
        params.push(start);
      } else if (end) {
        if (!isValidDateYYYYMMDD(end)) {
          return reply.status(400).send({ error: "Invalid end date (expected YYYY-MM-DD)" });
        }
        sql += " AND ump.scheduled_date <= ?";
        params.push(end);
      }

      sql += " ORDER BY ump.scheduled_date, ump.meal_type, ump.id";

      const [rows] = await fastify.db.query(sql, params);

      const normalized = rows.map(r => ({
        id: r.id,
        recipeId: r.recipeId,
        name: r.name,
        image: r.image || null,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        allergens: r.allergens ? String(r.allergens).split(",").map(s => s.trim()).filter(Boolean) : [],
        base_servings: r.base_servings != null ? Number(r.base_servings) : null,
        appx_mass: r.appx_mass != null ? Number(r.appx_mass) : null,
        date: r.date,
        mealType: r.mealType,
        servings: r.servings,
        created_at: r.created_at
      }));

      return reply.send(normalized);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: "Server error" });
    }
  });

  // DELETE /api/user/mealplan/:id (unchanged)
  fastify.delete("/api/user/mealplan/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const conn = await fastify.db.getConnection();
    try {
      const userId = request.user?.id;
      const id = parseInt(request.params.id, 10);
      if (!id) { conn.release(); return reply.status(400).send({ error: "Invalid id" }); }

      const [rows] = await conn.query(
        "SELECT id, recipe_id, DATE_FORMAT(scheduled_date, '%Y-%m-%d') AS scheduled_date, servings FROM user_mealplan WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      if (!rows.length) { conn.release(); return reply.status(404).send({ error: "Not found" }); }
      const row = rows[0];
      const scheduledDate = row.scheduled_date;

      const applyNowQuery = request.query?.applyNow;
      const applyNow = (applyNowQuery === "1" || applyNowQuery === "true" || applyNowQuery === 1 || applyNowQuery === true);
      const todayUTC = new Date().toISOString().slice(0, 10);

      await conn.beginTransaction();

      await conn.query("DELETE FROM user_inventory_changes WHERE mealplan_id = ?", [id]);

      const shouldRefund = applyNow || (scheduledDate && scheduledDate <= todayUTC);

      if (!shouldRefund) {
        await conn.query("DELETE FROM user_mealplan WHERE id = ? AND user_id = ?", [id, userId]);
        await conn.commit();
        conn.release();
        return reply.send({ success: true });
      }

      const [ings] = await conn.query(
        `SELECT ri.item_name, ri.quantity, ri.unit, COALESCE(rins.base_servings, NULL) AS base_servings
         FROM recipe_ingredients ri
         LEFT JOIN recipe_instructions rins ON rins.recipe_id = ri.recipe_id
         WHERE ri.recipe_id = ?`,
        [row.recipe_id]
      );

      const baseServings = (ings && ings.length && ings[0].base_servings) ? Number(ings[0].base_servings) : 1;
      const serv = Number(row.servings || 1);

      const adjustments = [];
      for (const ing of (ings || [])) {
        const itemName = String(ing.item_name || "").trim();
        if (!itemName) continue;
        const rawAmt = Number(ing.quantity || 0) || 0;
        const qty = rawAmt * (serv / (Number(baseServings) || 1));
        if (qty === 0) continue;
        adjustments.push({ item_name: itemName, delta: qty, unit: ing.unit || null });
      }

      for (const adj of adjustments) {
        const item_name = String(adj.item_name || "").trim();
        const delta = Number(adj.delta || 0);
        const unit = adj.unit || null;
        if (!item_name) continue;

        const [invRows] = await conn.query(
          `SELECT id, quantity FROM user_inventory WHERE user_id = ? AND item_name = ? AND (unit = ? OR (unit IS NULL AND ? IS NULL)) LIMIT 1 FOR UPDATE`,
          [userId, item_name, unit, unit]
        );
        if (invRows.length > 0) {
          const rowInv = invRows[0];
          let newQty = Number(rowInv.quantity || 0) + delta;
          if (!Number.isFinite(newQty)) newQty = 0;
          await conn.query("UPDATE user_inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newQty, rowInv.id]);
        } else {
          await conn.query("INSERT INTO user_inventory (user_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)", [userId, item_name, delta, unit]);
        }
      }

      await conn.query("DELETE FROM user_mealplan WHERE id = ? AND user_id = ?", [id, userId]);

      await conn.commit();
      conn.release();
      return reply.send({ success: true });
    } catch (err) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
      conn.release();
      fastify.log.error(err);
      return reply.status(500).send({ error: "Server error" });
    }
  });
});