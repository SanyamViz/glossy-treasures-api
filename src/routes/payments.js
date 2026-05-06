const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();

// ── Initialize Razorpay ──────────────────────────────────────────────────────
let razorpay;
const initRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  console.log("STEP 0: Initializing Razorpay Instance");
  console.log("Razorpay Key ID Loaded:", !!key_id);
  console.log("Razorpay Key Secret Loaded:", !!key_secret);
  console.log("Secret matches placeholder:", key_secret === 'YOUR_RAZORPAY_SECRET_HERE');

  if (!key_id || !key_secret) {
    console.error('RAZORPAY ERROR: Missing Key ID or Secret.');
    return null;
  }

  try {
    const instance = new Razorpay({ key_id, key_secret });
    console.log("Razorpay instance created successfully");
    return instance;
  } catch (err) {
    console.error('RAZORPAY ERROR: Initialization failed:', err);
    return null;
  }
};

// Initialize once at startup
razorpay = initRazorpay();

// ── POST /api/create-order ───────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  console.log('--- STEP 1: /api/create-order HIT ---');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // 1. Validation
    const { amount } = req.body;
    
    if (amount === undefined || amount === null) {
      console.error("STEP 1.5: Validation Failed - Amount missing");
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.error("STEP 1.5: Validation Failed - Invalid amount:", amount);
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // 2. Check Razorpay Initialization
    if (!razorpay) {
      console.log("STEP 2: Razorpay not initialized, attempting re-init");
      razorpay = initRazorpay();
      if (!razorpay) {
        throw new Error("Razorpay SDK is not configured. Check your .env file and ensure RAZORPAY_KEY_SECRET is not the placeholder.");
      }
    }

    // 3. Create Order
    const options = {
      amount: Math.round(numericAmount * 100), // amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    console.log('STEP 2: Creating Razorpay order with options:', options);
    
    const order = await razorpay.orders.create(options);
    
    console.log('STEP 3: Razorpay Order created successfully:', order.id);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error('FULL BACKEND ERROR:', error);
    console.error('STACK:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Order creation failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
