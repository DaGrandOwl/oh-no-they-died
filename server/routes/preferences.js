import fp from "fastify-plugin"; 
//theme and shopping list is redundant but has been left for backwards compatibility

export default fp(async function (fastify) {
  //Convert ISO 8601 to MySQL DATETIME format for DB
  function toMySQLDate(isoString) {
    return new Date(isoString).toISOString().slice(0, 19).replace("T", " ");
  }

  //Convert MySQL DATETIME to ISO 8601 format for frontend
  function toISODate(mysqlDate) {
    return mysqlDate ? new Date(mysqlDate).toISOString() : null;
  }

  //Ensure parsed JSON is not null
  function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

  //GET preferences from DB
  fastify.get("/api/user/preferences", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const [rows] = await fastify.db.query(
      "SELECT theme, allergens, user_inventory, shopping_list, updated_at FROM user_preferences WHERE user_id = ?",
      [userId]
    );

    if (!rows.length) {
      return reply.send(null);
    }

    const row = rows[0];
    return {
      theme: row.theme || "light",
      allergens: row.allergens ? safeJSONParse(row.allergens, []) : [],
      user_inventory: !!row.user_inventory,
      shopping_list: !!row.shopping_list,
      lastUpdated: toISODate(row.updated_at),
    };
  });

  //PUT preferences to DB
  fastify.put("/api/user/preferences", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const { theme, allergens, user_inventory, shopping_list, lastUpdated } = req.body;
    const updatedAt = lastUpdated ? toMySQLDate(lastUpdated) : toMySQLDate(new Date());

    await fastify.db.query(
      `INSERT INTO user_preferences (user_id, theme, allergens, user_inventory, shopping_list, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         theme = VALUES(theme),
         allergens = VALUES(allergens),
         user_inventory = VALUES(user_inventory),
         shopping_list = VALUES(shopping_list),
         updated_at = VALUES(updated_at)`,
      [
        userId,
        theme || "light",
        JSON.stringify(allergens || []),
        user_inventory ? 1 : 0,
        shopping_list ? 1 : 0,
        updatedAt,
      ]
    );

    return { success: true };
  });
});
