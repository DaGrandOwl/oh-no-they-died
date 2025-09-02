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
      if (fat) { conditions.push(`rg.fat >= ?`); params.push(parseFloat(fat)); }
      if (maxCost) { conditions.push(`rg.appx_cost <= ?`); params.push(parseFloat(maxCost)); }
      //Take dietary preferrence and allergies into account
      if (request.user) {
        const userDiet = request.user.diet_type || "any";
        const userAllergies = Array.isArray(request.user.allergens)
          ? request.user.allergens
          : (request.user.allergens || "").split(",").map(a => a.trim()).filter(Boolean);

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

      //Base SELECT
      let sql = `SELECT 
        rg.id,
        ANY_VALUE(rg.name) AS name,
        ANY_VALUE(rg.calories) AS calories,
        ANY_VALUE(rg.protein) AS protein,
        ANY_VALUE(rg.carbs) AS carbs,
        ANY_VALUE(rg.fat) AS fat,
        ANY_VALUE(rg.appx_cost) AS appx_cost,
        ANY_VALUE(rg.allergens) AS allergens,
        ANY_VALUE(rg.diet_type) AS diet_type,
        ANY_VALUE(ri.base_servings) AS base_servings,
        ANY_VALUE(ri.appx_mass) AS appx_mass,
        ANY_VALUE(ri.image) AS image
      FROM recipe_general rg
      LEFT JOIN recipe_instructions ri ON ri.recipe_id = rg.id
      LEFT JOIN recipe_ingredients ri2 ON rg.id = ri2.recipe_id
      `;

      // JOIN for inventory match
      if (inventoryMatch === "true" && request.user) {
        sql += ` LEFT JOIN user_inventory AS ui ON ui.user_id = ? AND ui.item_name = ri2.item_name `;
        params.push(request.user.id);
      }

      // WHERE
      if (conditions.length) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " GROUP BY rg.id";

      // HAVING for inventory match
      if (inventoryMatch === "true" && request.user) {
        sql += ` HAVING (SUM(ui.quantity IS NOT NULL) >= 0.8 * COUNT(ri2.id))
                 AND (SUM(CASE WHEN (ri2.notes LIKE '%main%' OR ri2.notes LIKE '%main:%' OR ri2.notes LIKE '%main;%') AND ui.quantity IS NULL THEN 1 ELSE 0 END) = 0)`;
      }

      // ORDER BY closest calories, then picks 5 random
      sql += ` ORDER BY ABS(rg.calories - ?) ASC, RAND() LIMIT 5`;
      params.push(parseFloat(calories) || 0);

      const [rows] = await fastify.db.query(sql, params);

      const desiredServings = servings != null ? Number(servings) : null;
      const normalized = (rows || []).map(r => {
        const baseServ = r.base_servings != null ? Number(r.base_servings) : 1;
        const recommended_servings = desiredServings ? Math.max(1, Math.round(desiredServings)) : Math.max(1, Math.round(baseServ));
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