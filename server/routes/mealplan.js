import fp from "fastify-plugin";

export default fp(async function (fastify) {
  fastify.post('/api/user/mealplan', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { recipeId, date, mealType, servings } = request.body;
    if (!recipeId || !date || !mealType || !servings) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    const sql = `
      INSERT INTO user_meal_plan (user_id, recipe_id, scheduled_date, meal_type, servings)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await fastify.db.query(sql, [request.user.id, recipeId, date, mealType, servings]);
    reply.status(201).send({ id: result.insertId, recipeId, date, mealType, servings });
  });
});