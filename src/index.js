import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Basic Route untuk test V5.3
app.get('/', (c) => {
  return c.html(`
    <h1>🚀 KiraEnterpriseV5.3 is Live!</h1>
    <p>Fresh start. Connected to mykira D1 Database.</p>
  `);
});

// Test Database Connection
app.get('/api/test-db', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT client_id, entity_name FROM client_entries LIMIT 3').all();
    return c.json({ success: true, message: 'Database connected!', data: results });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;