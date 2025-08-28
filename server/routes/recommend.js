import fp from "fastify-plugin";

export default fp(async function (fastify) {
  async function optionalAuth(request, reply) {
    const auth = request.headers['authorization'];
    if (!auth) {
      request.user = null;
      return;
    }
    try {
      const decoded = await request.jwtVerify();
      request.user = decoded;
    } catch {
      request.user = null;
    }
  }

  fastify.get("/api/recommendations", { preHandler: [optionalAuth] }, async (request, reply) => {
    try {
      const { calories, carbs, protein, fat, cuisine, mealType, maxCost, inventoryMatch, servings } = request.query || {};
      let sql = `SELECT rg.*, ri.base_servings, ri.appx_mass, ri.image AS image FROM recipe_general rg LEFT JOIN recipe_instructions ri ON ri.recipe_id = rg.id`;
      const params = [];
      const conditions = [];

      const allowMultiValues = (field, values) => {
        const vals = String(values || "").split(",").map(v => v.trim()).filter(Boolean);
        if (!vals.length) return;
        const subConds = vals.map(() => `FIND_IN_SET(?, ${field}) > 0`);
        conditions.push(`(${subConds.join(" OR ")})`);
        params.push(...vals);
      };

      if (cuisine) allowMultiValues("rg.cuisine", cuisine);
      if (mealType) allowMultiValues("rg.meal_type", mealType);
      if (calories) { conditions.push(`rg.calories <= ?`); params.push(parseFloat(calories)); }
      if (carbs) { conditions.push(`rg.carbs >= ?`); params.push(parseFloat(carbs)); }
      if (protein) { conditions.push(`rg.protein >= ?`); params.push(parseFloat(protein)); }
      if (fat) { conditions.push(`rg.fat <= ?`); params.push(parseFloat(fat)); }
      if (maxCost) { conditions.push(`rg.appx_cost <= ?`); params.push(parseFloat(maxCost)); }

      if (request.user) {
        const userDiet = request.user.diet_type || "any";
        const userAllergies = Array.isArray(request.user.allergens) ? request.user.allergens : (request.user.allergens || "").split(",").map(a => a.trim()).filter(Boolean);

        if (userDiet && userDiet !== "any") {
          const diets = String(userDiet).split(",").map(d => d.trim()).filter(Boolean);
          if (diets.length) {
            const dietConds = diets.map(() => `FIND_IN_SET(?, rg.diet_type) > 0`);
            conditions.push(`(${dietConds.join(" OR ")} OR rg.diet_type = 'any')`);
            params.push(...diets);
          }
        }

        userAllergies.forEach(a => {
          conditions.push(`FIND_IN_SET(?, rg.allergens) = 0`);
          params.push(a);
        });
      }

      if (inventoryMatch === "true" && request.user) {
        sql += ` JOIN recipe_ingredients AS ri2 ON rg.id = ri2.recipe_id`;
        sql += ` LEFT JOIN user_inventory AS ui ON ri2.item_name = ui.item_name AND ui.user_id = ?`;
        params.push(request.user.id);
      }

      if (conditions.length) sql += " WHERE " + conditions.join(" AND ");

      if (inventoryMatch === "true" && request.user) {
        sql += ` GROUP BY rg.id HAVING SUM(ui.quantity IS NOT NULL) >= 0.8 * COUNT(ri2.id)`;
      }

      sql += ` ORDER BY ABS(rg.calories - ?) ASC, RAND() LIMIT 10`;
      params.push(parseFloat(calories) || 0);

      const [rows] = await fastify.db.query(sql, params);

      // normalize rows, parse allergens & diet_type arrays, compute recommended_servings
      const desiredServings = servings != null ? Number(servings) : null;

      const normalized = (rows || []).map(r => {
        const baseServ = (r.base_servings != null) ? Number(r.base_servings) : null;
        const recommended_servings = desiredServings ? Math.max(1, Math.round(desiredServings)) : Math.max(1, Math.round(baseServ || 1));

        return {
          id: r.id,
          name: r.name,
          image: r.image || null,
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          appx_cost: r.appx_cost,
          base_servings: baseServ,
          appx_mass: r.appx_mass != null ? Number(r.appx_mass) : null,
          allergens: r.allergens ? String(r.allergens).split(",").map(s => s.trim()).filter(Boolean) : [],
          diet_type: r.diet_type ? String(r.diet_type).split(",").map(s => s.trim()).filter(Boolean) : [],
          recommended_servings
        };
      });

      reply.send(normalized);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: "Server error" });
    }
  });
});