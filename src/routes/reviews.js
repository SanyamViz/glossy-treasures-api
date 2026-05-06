const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ── GET /:productSlug — get reviews for a product (public) ─────────────────────
router.get('/:productSlug', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productSlug: req.params.productSlug },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ── POST / — submit a review ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { productSlug, customerName, rating, comment } = req.body;
    
    if (!productSlug || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const review = await prisma.review.create({
      data: {
        productSlug,
        customerName: customerName || 'Anonymous',
        rating: parseInt(rating),
        comment,
        verified: false
      }
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ── GET / — get all reviews (admin only) ───────────────────────────────────────
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const password = authHeader && authHeader.replace('Bearer ', '');
  if (password !== 'AngelManchanda@152116') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/', adminAuth, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all reviews' });
  }
});

module.exports = router;
