import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
  fastify.get('/api/recipe/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // Get recipe instructions
      const [instructions] = await fastify.db.query(
        'SELECT * FROM recipe_instructions WHERE recipe_id = ?',
        [id]
      );

      if (instructions.length === 0) {
        return reply.code(404).send({ error: 'Recipe not found' });
      }

      const instruction = instructions[0];

      // Get recipe ingredients
      const [ingredients] = await fastify.db.query(
        'SELECT * FROM recipe_ingredients WHERE recipe_id = ?',
        [id]
      );

      return reply.send({
        recipe: {
          id: instruction.recipe_id,
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
      console.error('Error fetching recipe:', err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
});
