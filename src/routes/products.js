const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { cloudinary, upload } = require('../config/cloudinary');

const router = express.Router();
const prisma = new PrismaClient();

// Auth middleware
const adminAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer glossy2024') return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// GET all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, type, occasion, bestseller, all } = req.query;
    const where = {};
    if (all !== 'true') where.active = true;
    if (category) where.category = category;
    if (type) where.type = type;
    if (occasion) where.occasion = occasion;
    if (bestseller) where.bestseller = true;
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create product with image upload (admin)
router.post('/', adminAuth, upload.array('images', 6), async (req, res) => {
  try {
    const {
      name, description, category, type, basePrice, originalPrice,
      badge, occasion, inStock, stock, bestseller, active,
      burnTime, scentFamily, ingredients,
      sizes, fragrances, colors, personalization
    } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const images = req.files ? req.files.map(f => f.path) : [];

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description,
        category,
        type: type || null,
        basePrice: parseFloat(basePrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        images,
        badge: badge || null,
        occasion: occasion || null,
        inStock: inStock === 'true',
        stock: parseInt(stock) || 0,
        bestseller: bestseller === 'true',
        active: active !== 'false',
        burnTime: burnTime || null,
        scentFamily: scentFamily || null,
        ingredients: ingredients || null,
        sizes: sizes ? JSON.parse(sizes) : null,
        fragrances: fragrances ? JSON.parse(fragrances) : null,
        colors: colors ? JSON.parse(colors) : null,
        personalization: personalization ? JSON.parse(personalization) : null,
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product (admin)
router.put('/:id', adminAuth, upload.array('images', 6), async (req, res) => {
  try {
    const {
      name, description, category, type, basePrice, originalPrice,
      badge, occasion, inStock, stock, bestseller, active,
      burnTime, scentFamily, ingredients,
      sizes, fragrances, colors, personalization,
      existingImages
    } = req.body;

    const newImages = req.files ? req.files.map(f => f.path) : [];
    const existing = existingImages ? JSON.parse(existingImages) : [];
    const images = [...existing, ...newImages];

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        category,
        type: type || null,
        basePrice: parseFloat(basePrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        images,
        badge: badge || null,
        occasion: occasion || null,
        inStock: inStock === 'true',
        stock: parseInt(stock) || 0,
        bestseller: bestseller === 'true',
        active: active !== 'false',
        burnTime: burnTime || null,
        scentFamily: scentFamily || null,
        ingredients: ingredients || null,
        sizes: sizes ? JSON.parse(sizes) : null,
        fragrances: fragrances ? JSON.parse(fragrances) : null,
        colors: colors ? JSON.parse(colors) : null,
        personalization: personalization ? JSON.parse(personalization) : null,
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
