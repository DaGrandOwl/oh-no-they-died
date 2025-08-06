import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
  if (!fastify.jwt) {
    fastify.register(import('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'supersecret',
    });
  }

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

      await fastify.db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password]
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
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password are required' });
      }

      const [rows] = await fastify.db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (rows.length === 0) {
        return reply.code(401).send({ error: 'User not found' });
      }

      const user = rows[0];

      // Plaintext password check (insecure — upgrade later)
      if (user.password !== password) {
        return reply.code(401).send({ error: 'Incorrect password' });
      }

      // Sign JWT token
      const token = fastify.jwt.sign({ id: user.id, email: user.email });

      return reply.send({ message: 'Login successful', token });
    } catch (err) {
      console.error('❌ Error in /api/login:', err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
});
