import Fastify from 'fastify';
import cors from '@fastify/cors';
import testRoutes from './routes/test.js';
import { db } from './db.js';

const fastify = Fastify({ logger: true });
// Register CORS to allow frontend requests
await fastify.register(cors, { 
  origin: '*', // Use specific origin in production
});
// Attach DB instance to Fastify (optional but useful)
fastify.decorate('db', db);
// Register route
await fastify.register(testRoutes); 
// Root route (optional)
fastify.get('/', async (request, reply) => {    
  return { message: 'API is running' };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
    console.log('Server listening on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
