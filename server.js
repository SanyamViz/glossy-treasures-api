require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ordersRouter = require('./src/routes/orders');
const contactRouter = require('./src/routes/contact');
const wholesaleRouter = require('./src/routes/wholesale');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Glossy Treasures API running' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/wholesale', wholesaleRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✨ Glossy Treasures API running on http://localhost:${PORT}`);
});
