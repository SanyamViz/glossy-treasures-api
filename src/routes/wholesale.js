const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ── POST / — Save wholesale enquiry ──────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, business, email, phone, interest, quantity, message } = req.body;

    if (!name || !business || !email || !phone || !interest || !quantity) {
      return res.status(400).json({ error: 'Name, business, email, phone, interest, and quantity are required' });
    }

    const enquiry = await prisma.wholesaleEnquiry.create({
      data: {
        name,
        business,
        email,
        phone,
        interest,
        quantity,
        message: message || null,
      },
    });

    res.status(201).json({ success: true, id: enquiry.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
