const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();

let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY ERROR: Missing Key ID or Secret in environment variables');
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  }
} catch (err) {
  console.error('RAZORPAY ERROR: Initialization failed:', err);
}

// ── POST /api/payments/create-order ──────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  console.log('Received request to create Razorpay order:', req.body);
  
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      console.error('RAZORPAY ERROR: Invalid amount:', amount);
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    if (!razorpay) {
      console.error('RAZORPAY ERROR: Razorpay instance not initialized');
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway not initialized. Check server logs.' 
      });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // amount in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    console.log('Calling Razorpay API with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay Order created successfully:', order);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('RAZORPAY ERROR: Order creation failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Order creation failed',
      details: error.description || error.message 
    });
  }
});

module.exports = router;
