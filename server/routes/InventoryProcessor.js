import fp from "fastify-plugin";

export default fp(async function (fastify, opts) {
  const db = fastify.db;

  fastify.decorate("processInventoryForDate", async function processInventoryForDate(dateStr) {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error("Invalid date (expected YYYY-MM-DD)");
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(
        `SELECT id, user_id, mealplan_id, item_name, delta, unit
         FROM user_inventory_changes
         WHERE scheduled_date = ? AND applied_at IS NULL
         FOR UPDATE`,
        [dateStr]
      );

      if (!rows || rows.length === 0) {
        await conn.commit();
        return { appliedCount: 0, message: "No pending inventory changes for date", date: dateStr };
      }

      const groups = new Map();
      for (const r of rows) {
        const userId = Number(r.user_id);
        const itemName = String(r.item_name).trim();
        const unit = r.unit === null ? null : String(r.unit);
        const key = `${userId}||${itemName}||${unit ?? "__NULL__"}`;
        const existing = groups.get(key);
        if (existing) {
          existing.totalDelta = Number(existing.totalDelta) + Number(r.delta);
          existing.changeIds.push(r.id);
        } else {
          groups.set(key, {
            userId,
            itemName,
            unit,
            totalDelta: Number(r.delta),
            changeIds: [r.id]
          });
        }
      }

      const appliedChangeIds = [];
      const perUserSummary = {};

      for (const [k, g] of groups.entries()) {
        const { userId, itemName, unit, totalDelta, changeIds } = g;

        perUserSummary[userId] = perUserSummary[userId] || { applied: 0, deltas: [] };

        const [invRows] = await conn.query(
          `SELECT id, quantity 
           FROM user_inventory 
           WHERE user_id = ? AND item_name = ? AND (unit = ? OR (unit IS NULL AND ? IS NULL))
           LIMIT 1 FOR UPDATE`,
          [userId, itemName, unit, unit]
        );

        if (invRows.length > 0) {
          const invRow = invRows[0];
          const oldQty = Number(invRow.quantity || 0);
          const newQty = oldQty + Number(totalDelta);
          await conn.query(
            `UPDATE user_inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [newQty, invRow.id]
          );
        } else {
          await conn.query(
            `INSERT INTO user_inventory (user_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)`,
            [userId, itemName, totalDelta, unit]
          );
        }

        const placeholders = changeIds.map(() => "?").join(",");
        await conn.query(
          `UPDATE user_inventory_changes
           SET applied_at = CURRENT_TIMESTAMP
           WHERE id IN (${placeholders})`,
          changeIds
        );

        appliedChangeIds.push(...changeIds);
        perUserSummary[userId].applied += changeIds.length;
        perUserSummary[userId].deltas.push({ itemName, unit, totalDelta, changeIds });
      }

      await conn.commit();

      return {
        appliedCount: appliedChangeIds.length,
        appliedChangeIds,
        perUserSummary,
        date: dateStr
      };
    } catch (err) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
      fastify.log.error("processInventoryForDate failed", err);
      throw err;
    } finally {
      conn.release();
    }
  });

  // Manual trigger endpoint for admin to process inventory for a specific date
  fastify.post("/api/admin/process-inventory", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { date } = request.body || {};
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return reply.code(400).send({ error: "Missing or invalid date (YYYY-MM-DD required)" });
    }
    try {
      const result = await fastify.processInventoryForDate(date);
      return reply.send({ ok: true, result });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Processing failed" });
    }
  });
});