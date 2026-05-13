const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendOrderConfirmation } = require('../emails/orderConfirmation');
const { sendNewOrderAlert } = require('../emails/newOrderAlert');
const { sendOrderCancelled } = require('../emails/orderCancelled');
const { sendDiscountConfirmation } = require('../emails/discountConfirmation');
const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (err) {
  console.error('Razorpay initialization failed. Check your environment variables.');
}

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
  if (password !== 'AngelManchanda@152116') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── POST / — Create a new order (DB ONLY) ─────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('--- STEP 1: /api/orders HIT ---');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      name, email, phone,
      address, city, state, pincode,
      paymentMethod, total, giftNote,
      items, discountCode, discountAmount,
      razorpayOrderId // Optional at this stage
    } = req.body;

    // 1. Validation
    if (!name || !email || !phone || !address || !city || !state || !pincode || !paymentMethod || total === undefined || !items?.length) {
      console.error('Validation failed: Missing fields');
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderNumber = generateOrderNumber();
    console.log('Generated Order Number:', orderNumber);

    const orderData = {
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
      discountCode: discountCode || null,
      discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
      giftNote: giftNote || null,
      razorpayOrderId: razorpayOrderId || null,
      status: paymentMethod === 'cod' ? 'CONFIRMED' : 'PENDING',
      items: {
        create: items.map((item) => {
          return {
            productSlug: item.productSlug,
            productName: item.productName,
            category: item.category,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity, 10),
            selectedSize: item.selectedSize || null,
            selectedFragrance: item.selectedFragrance || null,
            selectedColor: item.selectedColor || null,
            personalization: item.personalization || null,
            selectedOptions: item.selectedOptions || null,
          };
        }),
      },
    };

    console.log('STEP 2: Saving to DB...');
    const order = await prisma.order.create({
      data: orderData,
      include: { items: true },
    });
    console.log('STEP 3: Order saved in DB:', order.id);

    // 2. Discount code usage
    if (discountCode) {
      try {
        await prisma.discountCode.update({
          where: { code: discountCode.toUpperCase() },
          data: { usedCount: { increment: 1 } }
        });
      } catch (err) {
        console.error('Failed to increment discount code usage:', err.message);
      }
    }

    // 3. COD Emails
    if (paymentMethod === 'cod') {
      try {
        await Promise.all([
          sendOrderConfirmation(order).catch(err => console.error('Customer email failed:', err.message)),
          sendNewOrderAlert(order).catch(err => console.error('Admin alert failed:', err.message))
        ]);
      } catch (emailErr) {
        console.error('Email dispatch system error:', emailErr.message);
      }
    }

    res.status(201).json({ 
      success: true,
      orderNumber: order.orderNumber, 
      orderId: order.id
    });
  } catch (err) {
    console.error('FULL BACKEND ERROR (Orders):', err);
    console.error('STACK:', err.stack);
    res.status(500).json({ 
      success: false,
      error: 'Internal Server Error', 
      message: err.message,
      stack: err.stack
    });
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

// GET /api/orders/customer/:email — All orders for a specific customer
router.get('/customer/:email', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { email: req.params.email },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

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
      include: { items: true }
    });

    // If order is cancelled, send email
    if (status === 'CANCELLED') {
      sendOrderCancelled(order).catch(err => console.error('Cancellation email failed:', err.message));
    }

    res.json({ message: 'Status updated', order });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found' });
    next(err);
  }
});

// ── POST /verify — Verify Razorpay Payment ────────────────────────────────────
router.post('/verify', async (req, res, next) => {
  try {
    if (!razorpay) {
      console.error('Razorpay not initialized. Cannot verify payment.');
      return res.status(500).json({ error: 'Payment gateway is currently unavailable' });
    }
    console.log('--- STEP 1: Verification Request Received ---');
    console.log('Payload:', JSON.stringify(req.body, null, 2));

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('STEP 1.5: Missing verification fields');
      return res.status(400).json({ success: false, message: 'Missing required verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    console.log('Using Secret (First 4 chars):', secret ? secret.substring(0, 4) + '...' : 'MISSING');

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    console.log('Generated Data String for HMAC:', body);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    console.log('Expected Signature:', expectedSignature);
    console.log('Received Signature:', razorpay_signature);

    const isAuthentic = expectedSignature === razorpay_signature;
    console.log('Signatures Match:', isAuthentic);

    if (isAuthentic) {
      // Update order in DB
      const order = await prisma.order.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        },
        include: { items: true }
      });

      // Fire confirmation emails
      try {
        await Promise.all([
          sendOrderConfirmation(order).catch(err => console.error('Customer email failed:', err.message)),
          sendNewOrderAlert(order).catch(err => console.error('Admin alert failed:', err.message))
        ]);
      } catch (emailErr) {
        console.error('Email dispatch system error:', emailErr.message);
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    next(err);
  }
});

// ── POST /webhook — Razorpay Webhook ──────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  console.log('--- RAZORPAY WEBHOOK HIT ---');
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!secret) {
      console.error('Webhook Error: RAZORPAY_WEBHOOK_SECRET is missing');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    if (!signature) {
      console.error('Webhook Error: No signature found');
      return res.status(400).json({ error: 'No signature' });
    }

    if (!req.rawBody) {
      console.error('Webhook Error: req.rawBody is missing');
      return res.status(500).json({ error: 'Raw body missing' });
    }

    // Convert Buffer to string for validation
    const rawBodyString = req.rawBody.toString('utf-8');

    const isValid = Razorpay.validateWebhookSignature(
      rawBodyString,
      signature,
      secret
    );

    console.log('Signature Validation Result:', isValid);

    if (!isValid) {
      console.error('Webhook Error: Invalid signature match');
      return res.status(400).send('Invalid signature');
    }

    // Acknowledge receipt immediately to prevent timeouts
    res.json({ status: 'ok' });

    // Process event asynchronously
    const event = req.body.event;
    const payload = req.body.payload;
    console.log('Webhook Event Received:', event);

    if (event === 'payment.captured') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const razorpayPaymentId = payload.payment.entity.id;
      
      console.log(`Processing captured payment: ${razorpayOrderId}`);

      const order = await prisma.order.findUnique({
        where: { razorpayOrderId: razorpayOrderId }
      });

      if (order && order.paymentStatus !== 'PAID') {
        const updatedOrder = await prisma.order.update({
          where: { razorpayOrderId: razorpayOrderId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            razorpayPaymentId: razorpayPaymentId
          },
          include: { items: true }
        });

        // Fire emails
        sendOrderConfirmation(updatedOrder).catch(err => console.error('Webhook Email Error:', err.message));
        sendNewOrderAlert(updatedOrder).catch(err => console.error('Webhook Alert Error:', err.message));
        console.log(`Order ${order.orderNumber} successfully updated via Webhook`);
      }
    }
  } catch (err) {
    console.error('CRITICAL Webhook Error:', err);
    // If we haven't sent a response yet, send a 500
    if (!res.headersSent) {
      res.status(500).send('Internal Error');
    }
  }
});

module.exports = router;
