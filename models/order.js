// models/order.js
const db = require('../db'); // يجب أن يُصدر getClient

const Order = {
  // جلب جميع الطلبات المعلقة
  getAll: async () => {
    try {
      const result = await db.query(`
        SELECT o.*, json_agg(oi) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'pending' OR o.status IS NULL
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      return result.rows.map(order => ({
        ...order,
        items: Array.isArray(order.items) && order.items[0] ? order.items : []
      }));
    } catch (err) {
      console.error('خطأ في جلب الطلبات:', err.message);
      throw err;
    }
  },

  // جلب الطلبات المكتملة
  getCompleted: async () => {
    try {
      const result = await db.query(`
        SELECT o.*, json_agg(oi) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      return result.rows.map(order => ({
        ...order,
        items: Array.isArray(order.items) && order.items[0] ? order.items : []
      }));
    } catch (err) {
      console.error('خطأ في جلب الطلبات المكتملة:', err.message);
      throw err;
    }
  },

  // إنشاء طلب جديد
  create: async (orderData) => {
    const { customer_name, payment_method, total_amount, items } = orderData;

    // توليد معرف فريد يُعرض للعميل
    const order_id = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();

    const client = await db.getClient();

    try {
      await client.query('BEGIN');


// models/order.js
// ... داخل دالة create ...
const orderResult = await client.query(
  // استخدم payment_method هنا
  `INSERT INTO orders (customer_name, customer_phone, status, total_amount, payment_method) 
   VALUES ($1, $2, $3, $4, $5) 
   RETURNING id`,
   // استخدم payment_method هنا
  [orderData.customer_name, orderData.customer_phone, 'pending', orderData.total_amount, orderData.payment_method] 
);
// ... باقي الكود ...
      const generatedOrderId = orderResult.rows[0].id;

      if (Array.isArray(items) && items.length > 0) {
        const itemQueries = items
          .filter(item => item.product_id && item.quantity)
          .map(item => client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, size, location)
             VALUES ($1, $2, $3, $4, $5)`,
            [generatedOrderId, item.product_id, item.quantity, item.size || null, item.location || null]
          ));
        await Promise.all(itemQueries);
      }

      await client.query('COMMIT');
      return { success: true, orderId: generatedOrderId };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('خطأ في إنشاء الطلب:', err.message);
      throw err;
    } finally {
      client.release();
    }
  },

  // وضع علامة "جاهز" على طلب
  markAsCompleted: async (id) => {
    if (isNaN(id)) throw new Error('معرف الطلب غير صالح');

    try {
      const result = await db.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['completed', id]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.error('خطأ في وضع علامة جاهز:', err.message);
      throw err;
    }
  },

  // حذف طلب
  delete: async (id) => {
    if (isNaN(id)) throw new Error('معرف الطلب غير صالح');

    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      const result = await client.query('DELETE FROM orders WHERE id = $1', [id]);
      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('خطأ في حذف الطلب:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = Order;