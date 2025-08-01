// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// GET /api/orders - جلب جميع الطلبات المعلقة
router.get('/', async (req, res) => {
  try {
    const orders = await Order.getAll();
    res.json(orders);
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error.message);
    res.status(500).json({ 
      error: 'خطأ داخلي في الخادم',
      details: error.message 
    });
  }
});

// GET /api/orders/completed - جلب الطلبات المكتملة
router.get('/completed', async (req, res) => {
  try {
    const orders = await Order.getCompleted();
    res.json(orders);
  } catch (error) {
    console.error('خطأ في جلب الطلبات المكتملة:', error.message);
    res.status(500).json({ 
      error: 'خطأ في جلب الطلبات المكتملة',
      details: error.message 
    });
  }
});

// POST /api/orders - إنشاء طلب جديد
router.post('/', async (req, res) => {
  try {
    const result = await Order.create(req.body);
    if (result.success) {
      res.status(201).json({ 
        id: result.orderId, 
        message: 'تم إنشاء الطلب بنجاح' 
      });
    } else {
      res.status(500).json({ error: 'فشل إنشاء الطلب' });
    }
  } catch (error) {
    console.error('فشل في إنشاء الطلب:', error.message);
    res.status(500).json({ 
      error: 'فشل إنشاء الطلب',
      details: error.message 
    });
  }
});

// PUT /api/orders/:id/complete - وضع علامة "جاهز"
router.put('/:id/complete', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }

    const success = await Order.markAsCompleted(id);
    if (success) {
      res.json({ message: 'تم وضع علامة "جاهز"' });
    } else {
      res.status(404).json({ error: 'الطلب غير موجود' });
    }
  } catch (error) {
    console.error('فشل في وضع علامة جاهز:', error.message);
    res.status(500).json({ 
      error: 'فشل في معالجة الطلب',
      details: error.message 
    });
  }
});

// DELETE /api/orders/:id - حذف طلب
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }

    const success = await Order.delete(id);
    if (success) {
      res.json({ message: 'تم حذف الطلب بنجاح' });
    } else {
      res.status(404).json({ error: 'الطلب غير موجود' });
    }
  } catch (error) {
    console.error('فشل في حذف الطلب:', error.message);
    res.status(500).json({ 
      error: 'فشل في الحذف',
      details: error.message 
    });
  }
});

module.exports = router;