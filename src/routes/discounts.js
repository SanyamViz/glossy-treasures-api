const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADMIN_PASSWORD = 'glossy2024';

// Middleware to check admin auth
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_PASSWORD}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET all discount codes (admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discount codes' });
  }
});

// POST create new code (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt, active } = req.body;
    
    const newCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: parseFloat(minOrder || 0),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: active !== undefined ? active : true
      }
    });
    
    res.status(201).json(newCode);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Discount code already exists' });
    }
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

// DELETE a code (admin)
router.delete('/:code', adminAuth, async (req, res) => {
  try {
    await prisma.discountCode.delete({
      where: { code: req.params.code.toUpperCase() }
    });
    res.json({ message: 'Discount code deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete discount code' });
  }
});

// POST validate a code (public)
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    
    const discount = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() }
    });
    
    if (!discount || !discount.active) {
      return res.status(400).json({ valid: false, message: 'Invalid or inactive discount code' });
    }
    
    // Check expiry
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Discount code has expired' });
    }
    
    // Check usage limit
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return res.status(400).json({ valid: false, message: 'Discount code usage limit reached' });
    }
    
    // Check minimum order
    if (orderTotal < discount.minOrder) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum order amount for this code is ₹${discount.minOrder}` 
      });
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (orderTotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }
    
    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, orderTotal);
    
    res.json({ 
      valid: true, 
      discount: discountAmount, 
      message: 'Discount applied successfully!' 
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate discount code' });
  }
});

module.exports = router;
