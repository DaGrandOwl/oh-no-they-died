import fp from "fastify-plugin";

export default fp(async function (fastify) {
  function isValidDateYYYYMMDD(s) {
    if (!s || typeof s !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
  }

  // POST create a plan item
  fastify.post("/api/user/mealplan", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const { recipeId, date, mealType, servings } = request.body || {};

      if (!recipeId || !date || !mealType || servings == null) {
        return reply.status(400).send({ error: "Missing required fields" });
      }
      if (!isValidDateYYYYMMDD(date)) {
        return reply.status(400).send({ error: "Invalid date format, expected YYYY-MM-DD" });
      }

      const safeMealType = String(mealType).toLowerCase();

      const sql = `
        INSERT INTO user_meal_plan (user_id, recipe_id, scheduled_date, meal_type, servings)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await fastify.db.query(sql, [userId, recipeId, date, safeMealType, Number(servings)]);

      // fetch the inserted row and include recipe metadata (join recipe_general + recipe_instructions)
      const [rows] = await fastify.db.query(
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
           ri.base_servings,
           ri.appx_mass,
           ri.image AS image
         FROM user_meal_plan AS ump
         LEFT JOIN recipe_general AS rg ON rg.id = ump.recipe_id
         LEFT JOIN recipe_instructions AS ri ON ri.recipe_id = rg.id
         WHERE ump.id = ? AND ump.user_id = ?`,
        [result.insertId, userId]
      );

      const saved = rows[0] || null;
      // normalize allergens to array on server side (helps frontend)
      if (saved && saved.allergens && typeof saved.allergens === "string") {
        saved.allergens = saved.allergens.split(",").map(s => s.trim()).filter(Boolean);
      } else if (saved) {
        saved.allergens = saved.allergens || [];
      }

      return reply.status(201).send(saved);
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: "Server error" });
    }
  });

  // GET list plan items for a user, supports optional range query: start & end (YYYY-MM-DD)
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
          ri.base_servings,
          ri.appx_mass,
          ri.image AS image
        FROM user_meal_plan AS ump
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

      // normalize and parse allergens into arrays
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

  // DELETE by server id
  fastify.delete("/api/user/mealplan/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user?.id;
      const id = parseInt(request.params.id, 10);
      if (!id) return reply.status(400).send({ error: "Invalid id" });

      const [rows] = await fastify.db.query("SELECT id FROM user_meal_plan WHERE id = ? AND user_id = ?", [id, userId]);
      if (!rows.length) return reply.status(404).send({ error: "Not found" });

      await fastify.db.query("DELETE FROM user_meal_plan WHERE id = ? AND user_id = ?", [id, userId]);
      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err);
      reply.status(500).send({ error: "Server error" });
    }
  });
});