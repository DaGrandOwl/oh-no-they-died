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

// CORS has been enabled for certain URLs only
await fastify.register(cors, {
  origin: ['https://oh-no-they-died.vercel.app','http://localhost:3000'], //localhost for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
    reply.send(err);
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

//Start
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${PORT}`); //Shows for local testing
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
