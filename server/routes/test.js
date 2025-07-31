import { db } from '../db.js';

export default async function (fastify, options) {
  fastify.get('/api/test', async (request, reply) => {
    try {
      const [rows] = await db.query('SELECT column1, column2 FROM test');
      reply.send(rows);
    } catch (err) {
      console.error(err);
      reply.status(500).send({ error: 'Database error' });
    }
  });
}
