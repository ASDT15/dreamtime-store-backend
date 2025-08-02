// models/order.js
const db = require('../db'); // استيراد اتصال قاعدة البيانات

const Order = {
  // جلب جميع الطلبات المعلقة
  getAll: async () => {
    try {
      // استعلام لجلب الطلبات مع عناصرها
      const result = await db.query(`
        SELECT o.*, json_agg(oi) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'pending' OR o.status IS NULL
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      // معالجة النتائج لضمان تنسيق العناصر بشكل صحيح
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
      // استعلام لجلب الطلبات المكتملة مع عناصرها
      const result = await db.query(`
        SELECT o.*, json_agg(oi) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
      // معالجة النتائج لضمان تنسيق العناصر بشكل صحيح
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
    // الحصول على اتصال من الـ pool
    const client = await db.getClient();
    try {
      // بدء عملية قاعدة بيانات معاملية (Transaction)
      await client.query('BEGIN');

      // 1. إنشاء order_id عشوائي (UUID-like) - هذا مفتاح الطلب المرئي للعميل
      const generatedOrderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      console.log("معرف الطلب المُنشأ:", generatedOrderId);

      // 2. إدراج الطلب الرئيسي - *** التصحيح الأساسي هنا ***
      // يجب إدراج order_id في قائمة الأعمدة وتمرير generatedOrderId كمعامل
      const orderResult = await client.query(
        `INSERT INTO orders (order_id, customer_name, customer_phone, status, total_amount, payment_method) -- <-- إضافة order_id هنا
         VALUES ($1, $2, $3, $4, $5, $6) -- <-- تحديث عدد المعاملات ($1 أصبح generatedOrderId)
         RETURNING id`,
         // تمرير generatedOrderId كأول معامل ($1)
        [generatedOrderId, orderData.customer_name, orderData.customer_phone, 'pending', orderData.total_amount, orderData.payment_method] // <-- تحديث قائمة المعاملات
      );

      const orderId = orderResult.rows[0].id;

      // 3. إدراج عناصر الطلب (order_items) إذا وُجدت
      if (Array.isArray(orderData.items) && orderData.items.length > 0) {
        for (const item of orderData.items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, size, location)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, item.product_id, item.quantity, item.size, item.location]
          );
        }
      }

      // إنهاء العملية المعاملية بنجاح
      await client.query('COMMIT');
      // إرجاع معرف الطلب المرئي للعميل
      return { success: true, orderId: generatedOrderId };

    } catch (err) {
      // في حالة الخطأ، التراجع عن جميع التغييرات في قاعدة البيانات
      await client.query('ROLLBACK');
      console.error('خطأ في إنشاء الطلب:', err.message);
      throw err;
    } finally {
      // تحرير الاتصال وإعادته إلى الـ pool
      client.release();
    }
  },

  // حذف طلب بناءً على معرفه الداخلي (ID)
  delete: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      // أولاً حذف عناصر الطلب
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      // ثم حذف الطلب الرئيسي
      const result = await client.query('DELETE FROM orders WHERE id = $1', [id]);
      await client.query('COMMIT');
      // التحقق مما إذا تم حذف أي صف
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