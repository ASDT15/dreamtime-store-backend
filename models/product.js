// models/product.js
const db = require('../db');

const Product = {
  // جلب جميع المنتجات مع الصور والفيديوهات
  getAll: async () => {
    try {
      // من المفترض أن جدول products يحتوي على أعمدة size_type و available_sizes
      const result = await db.query(`
        SELECT p.*,
               COALESCE(json_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '[]') AS images,
               COALESCE(json_agg(pv.video_url) FILTER (WHERE pv.video_url IS NOT NULL), '[]') AS videos
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN product_videos pv ON p.id = pv.product_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);
      return result.rows.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [],
        videos: Array.isArray(product.videos) ? product.videos : []
      }));
    } catch (err) {
      console.error('خطأ في جلب المنتجات:', err.message);
      throw err;
    }
  },

  // جلب منتج حسب الـ ID
  getById: async (id) => {
    if (isNaN(id)) throw new Error('معرف المنتج غير صالح');

    try {
      // من المفترض أن جدول products يحتوي على أعمدة size_type و available_sizes
      const result = await db.query(`
        SELECT p.*,
               COALESCE(json_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '[]') AS images,
               COALESCE(json_agg(pv.video_url) FILTER (WHERE pv.video_url IS NOT NULL), '[]') AS videos
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN product_videos pv ON p.id = pv.product_id
        WHERE p.id = $1
        GROUP BY p.id
      `, [id]);

      const product = result.rows[0];
      if (!product) return null;

      return {
        ...product,
        images: Array.isArray(product.images) ? product.images : [],
        videos: Array.isArray(product.videos) ? product.videos : []
      };
    } catch (err) {
      console.error('خطأ في جلب المنتج بالـ ID:', err.message);
      throw err;
    }
  },

  // إنشاء منتج جديد
  create: async (productData) => {
    // استخراج الحقول الجديدة
    const { name, price, description, main_image_url, type, images = [], videos = [], size_type = 'default', available_sizes = [] } = productData;

    if (!name || !price || !type) {
      throw new Error('الاسم، السعر، والنوع مطلوبون');
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // إدراج الحقول الجديدة size_type و available_sizes في الاستعلام
      const productResult = await client.query(
        `INSERT INTO products (name, price, description, main_image_url, type, size_type, available_sizes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [name, price, description, main_image_url, type, size_type, JSON.stringify(available_sizes)] // تخزين المصفوفة كـ JSON
      );

      const productId = productResult.rows[0].id;

      // إدخال الصور
      if (Array.isArray(images) && images.length > 0) {
        const imageQueries = images
          .filter(url => url && typeof url === 'string')
          .map(url => client.query(
            'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
            [productId, url]
          ));
        await Promise.all(imageQueries);
      }

      // إدخال الفيديوهات
      if (Array.isArray(videos) && videos.length > 0) {
        const videoQueries = videos
          .filter(url => url && typeof url === 'string')
          .map(url => client.query(
            'INSERT INTO product_videos (product_id, video_url) VALUES ($1, $2)',
            [productId, url]
          ));
        await Promise.all(videoQueries);
      }

      await client.query('COMMIT');
      return productId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('خطأ في إنشاء المنتج:', err.message);
      throw err;
    } finally {
      client.release();
    }
  },

  // تحديث منتج
  update: async (id, productData) => {
    if (isNaN(id)) throw new Error('معرف المنتج غير صالح');

    // استخراج الحقول الجديدة
    const { name, price, description, main_image_url, type, images, videos, size_type, available_sizes } = productData;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const check = await client.query('SELECT id FROM products WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // تحديث الحقول الجديدة size_type و available_sizes في الاستعلام
      // استخدام COALESCE للتعامل مع القيم غير المحددة
      await client.query(
        `UPDATE products 
         SET name = $1, price = $2, description = $3, main_image_url = $4, type = $5, 
             size_type = COALESCE($6, size_type), 
             available_sizes = COALESCE($7, available_sizes) 
         WHERE id = $8`,
        [name, price, description, main_image_url, type, size_type, JSON.stringify(available_sizes), id] // تخزين المصفوفة كـ JSON
      );

      // تحديث الصور والفيديوهات كما كانت
      if (images !== undefined) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
        if (Array.isArray(images) && images.length > 0) {
          const imageQueries = images
            .filter(url => url && typeof url === 'string')
            .map(url => client.query(
              'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
              [id, url]
            ));
          await Promise.all(imageQueries);
        }
      }

      if (videos !== undefined) {
        await client.query('DELETE FROM product_videos WHERE product_id = $1', [id]);
        if (Array.isArray(videos) && videos.length > 0) {
          const videoQueries = videos
            .filter(url => url && typeof url === 'string')
            .map(url => client.query(
              'INSERT INTO product_videos (product_id, video_url) VALUES ($1, $2)',
              [id, url]
            ));
          await Promise.all(videoQueries);
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('خطأ في تحديث المنتج:', err.message);
      throw err;
    } finally {
      client.release();
    }
  },

  // حذف منتج
  delete: async (id) => {
    if (isNaN(id)) throw new Error('معرف المنتج غير صالح');

    const client = await db.getClient();

    try {
      await client.query('BEGIN');
      const result = await client.query('DELETE FROM products WHERE id = $1', [id]);
      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('خطأ في حذف المنتج:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = Product;