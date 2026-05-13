const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/wishlist/:email
router.get('/:email', async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userEmail: req.params.email },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist — add item
router.post('/', async (req, res) => {
  try {
    const { userEmail, productSlug, productName, productImage, price, category } = req.body;
    const item = await prisma.wishlist.upsert({
      where: { userEmail_productSlug: { userEmail, productSlug } },
      update: {},
      create: { userEmail, productSlug, productName, productImage, price, category }
    });
    res.json(item);
  } catch (error) {
    console.error('Wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:email/:slug
router.delete('/:email/:slug', async (req, res) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { userEmail: req.params.email, productSlug: req.params.slug }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
