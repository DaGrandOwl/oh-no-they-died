import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const fastify = Fastify();

await fastify.register(cors);
await fastify.register(jwt, { secret: process.env.JWT_SECRET });

// Example test route
fastify.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT 1');
  return { success: true, rows };
});

fastify.listen({ port: 3001 }, err => {
  if (err) throw err;
  console.log('Server running at http://localhost:3001');
});