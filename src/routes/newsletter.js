const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendWelcomeCoupon } = require('../emails/welcomeCoupon');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Get the active welcome coupon (first active discount code with type 'welcome')
    // Or use a hardcoded welcome code
    const welcomeCode = 'BLOOM10';
    const discountValue = 10;

    // Send the coupon email
    await sendWelcomeCoupon(email, welcomeCode, discountValue);

    res.json({ success: true, message: 'Coupon sent to your email!' });
  } catch (error) {
    console.error('Newsletter error:', error);
    res.status(500).json({ error: 'Failed to send coupon' });
  }
});

module.exports = router;
