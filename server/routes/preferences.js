import fp from "fastify-plugin";

export default fp(async function (fastify) {
  // Convert ISO 8601 to MySQL DATETIME format for DB
  function toMySQLDate(isoString) {
    return new Date(isoString).toISOString().slice(0, 19).replace("T", " ");
  }

  // Convert MySQL DATETIME to ISO 8601 format for frontend
  function toISODate(mysqlDate) {
    return mysqlDate ? new Date(mysqlDate).toISOString() : null;
  }

  // Ensure parsed JSON is not null
  function safeJSONParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  // GET preferences from DB
  fastify.get("/api/user/preferences", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const [rows] = await fastify.db.query(
        "SELECT diet_type, allergens, user_inventory, updated_at FROM user_preferences WHERE user_id = ?",
        [userId]
      );

      if (!rows.length) {
        // No prefs record yet
        return reply.send(null);
      }

      const row = rows[0];
      return reply.send({
        diet_type: row.diet_type || "any",
        allergens: row.allergens ? safeJSONParse(row.allergens, []) : [],
        user_inventory: !!row.user_inventory,
        lastUpdated: toISODate(row.updated_at),
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Server error" });
    }
  });

  // PUT preferences to DB (upsert)
  fastify.put("/api/user/preferences", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const userId = req.user.id;
      const { diet_type, allergens, user_inventory, lastUpdated } = req.body || {};
      const safeDiet = typeof diet_type === "string" && diet_type.trim() !== "" ? diet_type.trim() : "any";
      const updatedAt = lastUpdated ? toMySQLDate(lastUpdated) : toMySQLDate(new Date());

      // Ensure allergens is JSON
      const allergensJson = JSON.stringify(Array.isArray(allergens) ? allergens : (allergens ? [allergens] : []));

      await fastify.db.query(
        `INSERT INTO user_preferences (user_id, diet_type, allergens, user_inventory, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          diet_type = VALUES(diet_type),
          allergens = VALUES(allergens),
          user_inventory = VALUES(user_inventory),
          updated_at = VALUES(updated_at)`,
        [
          userId,
          safeDiet,
          allergensJson,
          user_inventory ? 1 : 0,
          updatedAt,
        ]
      );

      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Server error" });
    }
  });
});