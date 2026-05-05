const express = require('express');
const { sendWelcomeEmail } = require('../emails/welcomeEmail');
const router = express.Router();

// POST /api/newsletter
router.post('/', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Attempt to send email
    await sendWelcomeEmail(email);

    res.json({ success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Newsletter email error:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

module.exports = router;
