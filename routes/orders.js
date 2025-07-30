
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
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/completed - جلب الطلبات المكتملة
router.get('/completed', async (req, res) => {
  try {
    const orders = await Order.getCompleted();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching completed orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders - إنشاء طلب جديد
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    // استدعاء الدالة المحدثة التي تعيد كائن { success: true, orderId: generatedOrderId }
    const result = await Order.create(orderData);
    
    if (result.success) {
      // إرسال orderId المولد من قاعدة البيانات
      res.status(201).json({ id: result.orderId, message: 'Order created successfully' });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    // إرسال رسالة خطأ أكثر تفصيلاً إذا كانت متوفرة
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PUT /api/orders/:orderId/complete - وضع علامة "جاهز"
// ملاحظة مهمة: يجب التأكد من استخدام المعرف الصحيح (id أو order_id)
router.put('/:orderId/complete', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    // استخدام parseInt للتأكد من أن orderId رقم
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const success = await Order.markAsCompleted(numericOrderId);
    if (success) {
      res.json({ message: 'Order marked as completed' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error marking order as completed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/orders/:orderId - حذف طلب
// ملاحظة مهمة: يجب التأكد من استخدام المعرف الصحيح (id أو order_id)
router.delete('/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    // استخدام parseInt للتأكد من أن orderId رقم
    const numericOrderId = parseInt(orderId, 10);
    if (isNaN(numericOrderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const success = await Order.delete(numericOrderId);
    if (success) {
      res.json({ message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;