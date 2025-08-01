// models/product.js
const db = require('../db');

const Product = {
  // جلب جميع المنتجات مع الصور والفيديوهات
  getAll: async () => {
    try {
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
    const { name, price, description, main_image_url, type, images = [], videos = [] } = productData;

    if (!name || !price || !type) {
      throw new Error('الاسم، السعر، والنوع مطلوبون');
    }

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const productResult = await client.query(
        `INSERT INTO products (name, price, description, main_image_url, type)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, price, description, main_image_url, type]
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

    const { name, price, description, main_image_url, type, images, videos } = productData;
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const check = await client.query('SELECT id FROM products WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      await client.query(
        `UPDATE products 
         SET name = $1, price = $2, description = $3, main_image_url = $4, type = $5 
         WHERE id = $6`,
        [name, price, description, main_image_url, type, id]
      );

      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      await client.query('DELETE FROM product_videos WHERE product_id = $1', [id]);

      if (Array.isArray(images) && images.length > 0) {
        const imageQueries = images
          .filter(url => url && typeof url === 'string')
          .map(url => client.query(
            'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
            [id, url]
          ));
        await Promise.all(imageQueries);
      }

      if (Array.isArray(videos) && videos.length > 0) {
        const videoQueries = videos
          .filter(url => url && typeof url === 'string')
          .map(url => client.query(
            'INSERT INTO product_videos (product_id, video_url) VALUES ($1, $2)',
            [id, url]
          ));
        await Promise.all(videoQueries);
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