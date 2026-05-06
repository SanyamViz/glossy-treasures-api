const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();

// ── Initialize Razorpay ──────────────────────────────────────────────────────
let razorpay;
const initRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_secret === 'YOUR_RAZORPAY_SECRET_HERE') {
    console.error('RAZORPAY ERROR: Missing or invalid Key ID/Secret.');
    return null;
  }

  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err) {
    console.error('RAZORPAY ERROR: Initialization failed:', err);
    return null;
  }
};

// Initialize once at startup
razorpay = initRazorpay();

// ── POST /api/create-order ───────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  console.log('--- Razorpay Order Creation ---');
  console.log('Body:', req.body);

  try {
    // 1. Validation
    const { amount } = req.body;
    
    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // 2. Check Razorpay Initialization
    if (!razorpay) {
      // Try to re-initialize in case env vars were added late
      razorpay = initRazorpay();
      if (!razorpay) {
        return res.status(500).json({ 
          success: false, 
          message: 'Order creation failed',
          details: 'Razorpay Key Secret is missing or invalid in .env file.'
        });
      }
    }

    // 3. Create Order
    const options = {
      amount: Math.round(numericAmount * 100), // amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    console.log('Options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Success:', order.id);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('RAZORPAY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Order creation failed',
      details: error.description || error.message || 'Internal Server Error'
    });
  }
});

module.exports = router;
