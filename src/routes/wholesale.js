const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

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

    const adminEmail = process.env.ANGEL_EMAIL || 'glossytreasures@gmail.com';
    const html = `
      <h2>New Wholesale / Bulk Enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Business:</strong> ${business}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Interest:</strong> ${interest}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Message:</strong> ${message || 'None'}</p>
    `;

    try {
      await resend.emails.send({
        from: 'Glossy Treasures <orders@glossytreasures.shop>',
        to: adminEmail,
        subject: \`Bulk Enquiry from \${business} (\${name})\`,
        html,
      });
    } catch (emailErr) {
      console.error('Failed to send wholesale email:', emailErr);
    }

    res.status(201).json({ success: true, id: enquiry.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
