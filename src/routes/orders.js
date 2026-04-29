const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendOrderConfirmation } = require('../emails/orderConfirmation');
const { sendNewOrderAlert } = require('../emails/newOrderAlert');

const router = express.Router();
const prisma = new PrismaClient();

// ── Helper: generate order number ─────────────────────────────────────────────
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `GT-${timestamp}${random}`;
}

// ── Basic Admin Auth Middleware ───────────────────────────────────────────────
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const password = authHeader && authHeader.replace('Bearer ', '');
  if (password !== 'glossy2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── POST / — Create a new order ───────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      name, email, phone,
      address, city, state, pincode,
      paymentMethod, total, giftNote,
      items,
    } = req.body;

    if (!name || !email || !phone || !address || !city || !state || !pincode || !paymentMethod || !total || !items?.length) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        paymentMethod,
        total: parseFloat(total),
        giftNote: giftNote || null,
        items: {
          create: items.map((item) => {
            const opts = item.selectedOptions || {};
            // For candles, it's 'size' and 'fragrance'. 
            // For resin, it's 'color', 'size', 'stand', 'personalization'.
            // We'll combine them to fit into our schema fields.
            const size = opts.size || null;
            const extraDetails = [
              opts.fragrance,
              opts.color,
              opts.stand ? `Stand: ${opts.stand}` : null,
              opts.personalization ? `Msg: ${opts.personalization}` : null
            ].filter(Boolean).join(' | ');

            return {
              productSlug: item.productSlug,
              productName: item.productName,
              category: item.category,
              price: parseFloat(item.price),
              quantity: parseInt(item.quantity, 10),
              selectedSize: size,
              selectedFragrance: extraDetails || null,
            };
          }),
        },
      },
      include: { items: true },
    });

    // Fire emails (non-blocking — don't fail order if email fails)
    sendOrderConfirmation(order).catch((err) =>
      console.error('Order confirmation email failed:', err.message)
    );
    sendNewOrderAlert(order).catch((err) =>
      console.error('New order alert email failed:', err.message)
    );

    res.status(201).json({ orderNumber: order.orderNumber, orderId: order.id });
  } catch (err) {
    next(err);
  }
});

// ── GET / — All orders (admin only) ──────────────────────────────────────────
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// ── GET /:orderNumber — Single order by orderNumber ───────────────────────────
router.get('/:orderNumber', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /:orderNumber/status — Update order status (admin only) ─────────────
router.patch('/:orderNumber/status', adminAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.update({
      where: { orderNumber: req.params.orderNumber },
      data: { status },
    });
    res.json({ message: 'Status updated', order });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found' });
    next(err);
  }
});

module.exports = router;
