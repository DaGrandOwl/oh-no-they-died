import fp from 'fastify-plugin';

// For RecipeList page
export default fp(async function (fastify, opts) {
  fastify.get("/api/recipes", async (request, reply) => {
    try {
      const sql = `
        SELECT
          rg.id,
          ANY_VALUE(rg.name) AS name,
          ANY_VALUE(ri.image) AS image,
          ANY_VALUE(rg.calories) AS calories,
          ANY_VALUE(rg.protein) AS protein,
          ANY_VALUE(rg.carbs) AS carbs,
          ANY_VALUE(rg.fat) AS fat,
          ANY_VALUE(ri.base_servings) AS base_servings
        FROM recipe_general rg
        LEFT JOIN recipe_instructions ri ON ri.recipe_id = rg.id
        GROUP BY rg.id
        ORDER BY rg.name ASC
      `;
      const [rows] = await fastify.db.query(sql);
      return reply.send(rows || []);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Failed to fetch recipes" });
    }
  });

  // For RecipeID page
  fastify.get("/api/recipe/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [rows] = await fastify.db.query(`
        SELECT 
          rg.name,
          ri.recipe_id,
          ri.base_servings,
          ri.appx_mass,
          ri.description,
          ri.directions,
          ri.nutrition_facts,
          ri.image
        FROM recipe_instructions ri
        JOIN recipe_general rg ON rg.id = ri.recipe_id
        WHERE ri.recipe_id = ?
      `, [id]);

      if (!rows || rows.length === 0) {
        return reply.code(404).send({ error: "Recipe not found" });
      }

      const recipe = rows[0];

      const [ingredients] = await fastify.db.query(
        "SELECT * FROM recipe_ingredients WHERE recipe_id = ?",
        [id]
      );

      return reply.send({
        recipe: {
          id: recipe.recipe_id,
          name: recipe.name,
          baseServings: recipe.base_servings,
          size: recipe.appx_mass,
          description: recipe.description,
          directions: recipe.directions,
          nutrition_facts: recipe.nutrition_facts,
          image: recipe.image,
          ingredients
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Internal server error" });
    }
  })
});
