import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import testRoutes from './routes/test.js';
import userRoutes from './routes/users.js'; // Optional: for Day 3+ auth
import { db } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
// Enable CORS for frontend requests
await fastify.register(cors, {
  origin: '*' // Adjust this to frontend URL in final deployment
});

// JWT setup
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'secret_key'
});

// Optional: Protect routes with this decorator
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Attach MySQL DB connection
fastify.decorate('db', db);

// Register routes
await fastify.register(testRoutes);
await fastify.register(userRoutes); // Add if you use /api/register or /api/login

// Root route
fastify.get('/', async (request, reply) => {
  return { message: 'API is running' };
});

// Start server
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: '0.0.0.0' }); // Required for Render
    console.log(`✅ Server listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
