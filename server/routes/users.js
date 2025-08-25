import fp from 'fastify-plugin';
import bcrypt from 'bcrypt';
import rateLimit from '@fastify/rate-limit';

export default fp(async function (fastify, opts) {
  if (!fastify.jwt) {
    fastify.register(import('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'supersecret',
    });
  }

  // Rate limit for this route only
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

      // Insert new user
      const result = await fastify.db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const userId = result[0].insertId;

      // Insert default preferences until user sets their own
      await fastify.db.query(
        'INSERT INTO user_preferences (user_id, theme, allergens, user_inventory, shopping_list, updated_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [userId, 'light', '[]', '0', '0']
      );


      // Generate JWT token for auto-login
      const token = fastify.jwt.sign({ id: userId, email });

      // Return token and basic user info
      return reply.send({
        message: 'Registration successful',
        token,
        user: { id: userId, username, email }
      });

    } catch (err) {
      console.error('Error in /api/register:', err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // LOGIN
  fastify.post('/api/login', async (request, reply) => {
    try {
      const { identifier, password } = request.body;

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

      // Fetch preferences from DB if any
      const [prefsRows] = await fastify.db.query(
        'SELECT theme, allergens, user_inventory, shopping_list, updated_at FROM user_preferences WHERE user_id = ?',
        [user.id]
      );

      let preferences = {};
      if (prefsRows.length > 0) {
        const row = prefsRows[0];
        preferences = {
          theme: row.theme,
          allergens: row.allergens ? JSON.parse(row.allergens) : [],
          user_inventory: !!row.user_inventory,
          shopping_list: !!row.shopping_list,  
          updated_at: row.updated_at
        };
      }

      return reply.send({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email },
        preferences
      });

    } catch (err) {
      console.error('Error in /api/login:', err);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
});
