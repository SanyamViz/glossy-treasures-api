const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { cloudinary, upload } = require('../config/cloudinary');

const router = express.Router();
const prisma = new PrismaClient();

// Auth middleware
const adminAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer AngelManchanda@152116') return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// GET all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, type, occasion, bestseller, all } = req.query;
    const where = {};
    if (all !== 'true') where.active = true;
    if (category) where.category = {
      equals: category,
      mode: 'insensitive'
    };
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

// Helper to wrap multer for better error handling
const handleUpload = (req, res, next) => {
  upload.array('images', 6)(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(500).json({
        error: 'Upload Error',
        details: err.message || 'Error during file upload/Cloudinary storage'
      });
    }
    next();
  });
};

// POST create product with image upload (admin)
router.post('/', adminAuth, handleUpload, async (req, res) => {
  console.log('--- Product Creation Start ---');
  console.log('Env Check:', {
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
  });
  console.log('Body Keys:', Object.keys(req.body));
  console.log('Files:', req.files?.length || 0);
  try {
    const {
      name, description, category, type, basePrice, originalPrice,
      badge, occasion, inStock, stock, bestseller, active,
      burnTime, scentFamily, ingredients,
      sizes, fragrances, colors, personalization
    } = req.body;

    if (!name) throw new Error('Product name is required');

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const images = req.files ? req.files.map(f => f.path) : [];

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description,
        category,
        type: type || null,
        basePrice: parseFloat(basePrice) || 0,
        originalPrice: (originalPrice && originalPrice !== 'null' && originalPrice !== '') ? parseFloat(originalPrice) : null,
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
        sizes: (sizes && sizes !== 'undefined') ? JSON.parse(sizes) : null,
        fragrances: (fragrances && fragrances !== 'undefined') ? JSON.parse(fragrances) : null,
        colors: (colors && colors !== 'undefined') ? JSON.parse(colors) : null,
        personalization: (personalization && personalization !== 'undefined') ? JSON.parse(personalization) : null,
      }
    });
    console.log('Product created successfully:', product.id);
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message
    });
  }
});



// PUT update product (admin)
router.put('/:id', adminAuth, upload.array('images', 6), async (req, res) => {
  console.log('--- Product Update Start ---', req.params.id);
  try {
    const {
      name, description, category, type, basePrice, originalPrice,
      badge, occasion, inStock, stock, bestseller, active,
      burnTime, scentFamily, ingredients,
      sizes, fragrances, colors, personalization,
      existingImages
    } = req.body;

    const newImages = req.files ? req.files.map(f => f.path) : [];
    const existing = (existingImages && existingImages !== 'undefined') ? JSON.parse(existingImages) : [];
    const images = [...existing, ...newImages];

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (type !== undefined) updateData.type = type || null;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice) || 0;
    if (originalPrice !== undefined) updateData.originalPrice = (originalPrice && originalPrice !== 'null' && originalPrice !== '') ? parseFloat(originalPrice) : null;
    if (images.length > 0) updateData.images = images;
    if (badge !== undefined) updateData.badge = badge || null;
    if (occasion !== undefined) updateData.occasion = occasion || null;
    if (inStock !== undefined) updateData.inStock = inStock === 'true';
    if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
    if (bestseller !== undefined) updateData.bestseller = bestseller === 'true';
    if (active !== undefined) updateData.active = active !== 'false';
    if (burnTime !== undefined) updateData.burnTime = burnTime || null;
    if (scentFamily !== undefined) updateData.scentFamily = scentFamily || null;
    if (ingredients !== undefined) updateData.ingredients = ingredients || null;
    if (sizes !== undefined) updateData.sizes = (sizes && sizes !== 'undefined') ? JSON.parse(sizes) : null;
    if (fragrances !== undefined) updateData.fragrances = (fragrances && fragrances !== 'undefined') ? JSON.parse(fragrances) : null;
    if (colors !== undefined) updateData.colors = (colors && colors !== 'undefined') ? JSON.parse(colors) : null;
    if (personalization !== undefined) updateData.personalization = (personalization && personalization !== 'undefined') ? JSON.parse(personalization) : null;

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });
    console.log('Product updated successfully:', product.id);
    res.json(product);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

const normalized = products.map(p => ({
  ...p,
  price: p.basePrice,
  image: p.images?.[0] || null,
}));
res.json(normalized);

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
