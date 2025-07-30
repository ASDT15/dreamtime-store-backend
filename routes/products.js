<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products - جلب جميع المنتجات
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products - إنشاء منتج جديد
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    const productId = await Product.create(productData);
    res.status(201).json({ id: productId, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id - تحديث منتج
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const productData = req.body;
    const success = await Product.update(id, productData);
    if (success) {
      res.json({ message: 'Product updated successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - حذف منتج
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await Product.delete(id);
    if (success) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/products/:id - جلب منتج واحد بناءً على الـ ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const product = await Product.getById(id); // يجب أن تكون لديك هذه الدالة في models/product.js
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
=======
const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// GET /api/products - جلب جميع المنتجات
router.get('/', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products - إنشاء منتج جديد
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    const productId = await Product.create(productData);
    res.status(201).json({ id: productId, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id - تحديث منتج
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const productData = req.body;
    const success = await Product.update(id, productData);
    if (success) {
      res.json({ message: 'Product updated successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - حذف منتج
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await Product.delete(id);
    if (success) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/products/:id - جلب منتج واحد بناءً على الـ ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const product = await Product.getById(id); // يجب أن تكون لديك هذه الدالة في models/product.js
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
>>>>>>> 2b6678334f8dc690f7fea68dd5c0b3920abcc2ca
module.exports = router;