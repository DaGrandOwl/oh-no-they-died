import fp from "fastify-plugin";

export default fp(async function (fastify) {
  fastify.get('/api/recommendations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { calories, carbs, protein, fat, cuisine, mealType, maxCost, inventoryMatch } = request.query;
    let sql = `SELECT * FROM recipe_general`;

    const params = [];
    const conditions = [];

    if (cuisine) { conditions.push(`recipe_general.cuisine = ?`); params.push(cuisine); }
    if (mealType) { conditions.push(`recipe_general.meal_type = ?`); params.push(mealType); }
    if (calories) { conditions.push(`recipe_general.calories <= ?`); params.push(parseInt(calories)); }
    if (carbs) { conditions.push(`recipe_general.carbs >= ?`); params.push(parseInt(carbs)); }
    if (protein) { conditions.push(`recipe_general.protein >= ?`); params.push(parseInt(protein)); }
    if (fat) { conditions.push(`recipe_general.fat >= ?`); params.push(parseInt(fat)); }
    if (maxCost) { conditions.push(`recipe_general.appx_cost <= ?`); params.push(parseFloat(maxCost)); }

    // Diet and allergy
    const userDiet = request.userecipe_general.dietType;
    const userAllergies = request.userecipe_general.allergies || [];
    if (userDiet) {
      conditions.push(`(recipe_general.diet_type = ? OR recipe_general.diet_type = 'any')`);
      params.push(userDiet);
    }
    userAllergies.forEach(allergy => {
      conditions.push(`recipe_general.allergens NOT LIKE ?`);
      params.push(`%${allergy}%`);
    });

    if (inventoryMatch === 'true') {
      sql += ` JOIN recipe_ingredients AS ri ON recipe_general.id = ri.recipe_id`;
      sql += ` LEFT JOIN user_inventory AS ui ON ri.item_name = ui.item_name AND ui.user_id = ?`;
      params.push(request.userecipe_general.id);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    if (inventoryMatch === 'true') {
      sql += ` GROUP BY recipe_general.id HAVING SUM(ui.quantity IS NOT NULL) >= 0.8 * COUNT(ri.id)`;
    }

    sql += ` ORDER BY ABS(recipe_general.calories - ?) ASC, RAND() LIMIT 10`;
    params.push(parseInt(calories) || 0);

    const results = await fastify.db.query(sql, params);
    reply.send(results);
  });
});