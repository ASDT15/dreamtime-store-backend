
// models/order.js
const pool = require('../config/db');


const Order = {
  // جلب جميع الطلبات (بما في ذلك المنتجات داخلها)
  async getAll() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT o.*, json_agg(oi.*) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'pending' OR o.status IS NULL
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      return result.rows.map(row => ({
        ...row,
        items: row.items && row.items[0]?.order_id ? row.items : [] // تأكد من وجود عناصر
      }));
    } finally {
      client.release();
    }
  },

  // جلب الطلبات المكتملة
  async getCompleted() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT o.*, json_agg(oi.*) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      return result.rows.map(row => ({
        ...row,
        items: row.items && row.items[0]?.order_id ? row.items : []
      }));
    } finally {
      client.release();
    }
  },

  // إنشاء طلب جديد - مُعدل لحل مشكلة order_id
  async create(orderData) {
    // استخراج البيانات المطلوبة من orderData
    const { customer_name, items, payment_method, total_amount } = orderData;
    
    // *** بداية الإضافة: توليد order_id ***
    // توليد معرف فريد للطلب يراه العميل
    const orderIdForClient = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();
    // *** نهاية الإضافة ***
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // *** تعديل الاستعلام ليشمل order_id ***
      const orderResult = await client.query(
        'INSERT INTO orders (order_id, customer_name, payment_method, total_amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [orderIdForClient, customer_name, payment_method, total_amount, 'pending'] // *** إضافة orderIdForClient ***
      );
      // *** نهاية التعديل ***
      
      // استرجاع الـ ID المولد تلقائياً
      const generatedOrderId = orderResult.rows[0].id; 
      
      // الآن قم بإدخال عناصر الطلب باستخدام generatedOrderId
      if (items && items.length > 0) {
        const itemQueries = items.map(item => 
          client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, size, location) VALUES ($1, $2, $3, $4, $5)',
            [generatedOrderId, item.product_id, item.quantity, item.size, item.location]
          )
        );
        await Promise.all(itemQueries);
      }
      
      await client.query('COMMIT');
      // أعد الـ ID المولد إذا لزم الأمر
      return { success: true, orderId: generatedOrderId }; 
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', err); // تسجيل الخطأ للمساعدة في التصحيح
      throw err; // أعد رمي الخطأ ليتم التعامل معه في route handler
    } finally {
      client.release();
    }
  },

  // وضع علامة "جاهز" على طلب
  async markAsCompleted(orderId) {
    const client = await pool.connect();
    try {
      // تغيير الاستعلام لاستخدام id بدلاً من order_id إذا كان id هو المفتاح الأساسي
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['completed', orderId]);
      return true;
    } finally {
      client.release();
    }
  },

  // حذف طلب
  async delete(orderId) {
    const client = await pool.connect();
    try {
      // تغيير الاستعلام لاستخدام id بدلاً من order_id إذا كان id هو المفتاح الأساسي
      // CASCADE سيؤدي إلى حذف order_items المرتبطة
      await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
      return true;
    } finally {
      client.release();
    }
  }
};


module.exports = Order;