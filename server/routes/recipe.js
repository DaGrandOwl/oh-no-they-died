import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
  // For RecipeList page
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
      const [instructions] = await fastify.db.query(
        "SELECT * FROM recipe_instructions WHERE recipe_id = ?",
        [id]
      );

      if (!instructions || instructions.length === 0) {
        return reply.code(404).send({ error: "Recipe not found" });
      }

      const instruction = instructions[0];

      const [ingredients] = await fastify.db.query(
        "SELECT * FROM recipe_ingredients WHERE recipe_id = ?",
        [id]
      );

      return reply.send({
        recipe: {
          id: instruction.recipe_id,
          name: instruction.name ?? null,
          baseServings: instruction.base_servings,
          size: instruction.appx_mass,
          description: instruction.description,
          directions: instruction.directions,
          nutrition_facts: instruction.nutrition_facts,
          image: instruction.image,
          ingredients: ingredients,
        }
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });
});