import fp from 'fastify-plugin';
import bcrypt from 'bcrypt';
import rateLimit from '@fastify/rate-limit';

export default fp(async function (fastify, opts) {
  if (!fastify.jwt) {
    fastify.register(import('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'supersecret',
    });
  }

  //Sets rate limit for all functions in this route to 10 requests/min
  await fastify.register(rateLimit, {
    max: 10,
    timeWindow: '1 minute',
  });
  
  // REGISTER
  fastify.post('/api/register', async (request, reply) => {
    try {
      const { username, email, password } = request.body;

      if (!username || !email || !password) {
        return reply.code(400).send({ error: 'All fields are required' });
      }

      const [rows] = await fastify.db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      if (rows.length > 0) {
        return reply.code(400).send({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      await fastify.db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      return reply.send({ message: 'Registration successful' });
    } catch (err) {
      console.error('❌ Error in /api/register:', err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // LOGIN
  fastify.post('/api/login', async (request, reply) => {
    try {
      const { identifier, password } = request.body; // Identifier can be email or username

      if (!identifier || !password) {
        return reply.code(400).send({ error: 'Email/Username and password are required' });
      }

      const [rows] = await fastify.db.query(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [identifier, identifier]
      );
      if (rows.length === 0) {
        return reply.code(401).send({ error: 'User not found' });
      }

      const user = rows[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return reply.code(401).send({ error: 'Incorrect password' });
      }

      const token = fastify.jwt.sign({ id: user.id, email: user.email });

      return reply.send({ message: 'Login successful', token });
    } catch (err) {
      console.error('❌ Error in /api/login:', err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
});
