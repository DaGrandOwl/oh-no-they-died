import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { db } from './db.js';
//Routes
import recipeRoutes from './routes/recipe.js';
import userRoutes from './routes/users.js';
import preferenceRoutes from './routes/preferences.js';
import mealplanRoutes from './routes/mealplan.js';
import inventoryRoutes from './routes/inventory.js';
import recommendRoutes from './routes/recommend.js';
import inventoryProcessor from './routes/InventoryProcessor.js';

dotenv.config();

const fastify = Fastify({ logger: true });

const DEFAULT_ORIGINS = [
  'https://oh-no-they-died.vercel.app',
  'http://localhost:3000' //for testing
];

const envOrigins = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(',')).split(',').map(s => s.trim()).filter(Boolean);
await fastify.register(cors, {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (envOrigins.includes(origin)) {
      return callback(null, true);
    }
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    return callback(err, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
  maxAge: 600
});

//JWT setup
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'secret_key'
});

//Authentication setup
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

//Connect to database
fastify.decorate('db', db);

//Register routes
await fastify.register(recipeRoutes);
await fastify.register(userRoutes);
await fastify.register(preferenceRoutes);
await fastify.register(mealplanRoutes);
await fastify.register(recommendRoutes);
await fastify.register(inventoryRoutes);
await fastify.register(inventoryProcessor);

//Root route displays a message
fastify.get('/', async (request, reply) => {
  return { message: 'API is running' };
});

//Start
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();