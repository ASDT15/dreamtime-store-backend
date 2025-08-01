// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products - جلب جميع المنتجات
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    console.error('خطأ في جلب المنتجات:', error.message);
    res.status(500).json({ 
      error: 'خطأ داخلي في الخادم',
      details: error.message 
    });
  }
});

// GET /api/products/:id - جلب منتج حسب المعرف
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }

    const product = await Product.getById(id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'المنتج غير موجود' });
    }
  } catch (error) {
    console.error('خطأ في جلب المنتج:', error.message);
    res.status(500).json({ 
      error: 'خطأ داخلي في الخادم',
      details: error.message 
    });
  }
});

// POST /api/products - إنشاء منتج جديد
router.post('/', async (req, res) => {
  try {
    const productId = await Product.create(req.body);
    res.status(201).json({ 
      id: productId, 
      message: 'تم إنشاء المنتج بنجاح' 
    });
  } catch (error) {
    console.error('فشل في إنشاء المنتج:', error.message);
    res.status(500).json({ 
      error: 'فشل إنشاء المنتج',
      details: error.message 
    });
  }
});

// PUT /api/products/:id - تحديث منتج
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }

    const success = await Product.update(id, req.body);
    if (success) {
      res.json({ message: 'تم التحديث بنجاح' });
    } else {
      res.status(404).json({ error: 'المنتج غير موجود' });
    }
  } catch (error) {
    console.error('فشل في تحديث المنتج:', error.message);
    res.status(500).json({ 
      error: 'فشل التحديث',
      details: error.message 
    });
  }
});

// DELETE /api/products/:id - حذف منتج
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }

    const success = await Product.delete(id);
    if (success) {
      res.json({ message: 'تم الحذف بنجاح' });
    } else {
      res.status(404).json({ error: 'المنتج غير موجود' });
    }
  } catch (error) {
    console.error('فشل في حذف المنتج:', error.message);
    res.status(500).json({ 
      error: 'فشل الحذف',
      details: error.message 
    });
  }
});

module.exports = router;