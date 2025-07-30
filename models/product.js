
const pool = require('../config/db');

const Product = {
  // جلب جميع المنتجات مع صورها وفيديوهاتها
  async getAll() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT p.*, 
               COALESCE(json_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '[]') as images,
               COALESCE(json_agg(pv.video_url) FILTER (WHERE pv.video_url IS NOT NULL), '[]') as videos
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN product_videos pv ON p.id = pv.product_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);
      return result.rows.map(row => ({
        ...row,
        images: Array.isArray(row.images) ? row.images.filter(url => url) : [],
        videos: Array.isArray(row.videos) ? row.videos.filter(url => url) : []
      }));
    } finally {
      client.release();
    }
  },

  // جلب منتج واحد مع تفاصيله
  async getById(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT p.*, 
               COALESCE(json_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL), '[]') as images,
               COALESCE(json_agg(pv.video_url) FILTER (WHERE pv.video_url IS NOT NULL), '[]') as videos
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN product_videos pv ON p.id = pv.product_id
        WHERE p.id = $1
        GROUP BY p.id
      `, [id]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        images: Array.isArray(row.images) ? row.images.filter(url => url) : [],
        videos: Array.isArray(row.videos) ? row.videos.filter(url => url) : []
      };
    } finally {
      client.release();
    }
  },

  // إنشاء منتج جديد
  async create(productData) {
    const { name, price, description, main_image_url, type, images = [], videos = [] } = productData;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const productResult = await client.query(
        'INSERT INTO products (name, price, description, main_image_url, type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, price, description, main_image_url, type]
      );
      const productId = productResult.rows[0].id;

      // إدخال الصور الإضافية
      if (images.length > 0) {
        const imageQueries = images.map(url => client.query('INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)', [productId, url]));
        await Promise.all(imageQueries);
      }

      // إدخال الفيديوهات
      if (videos.length > 0) {
        const videoQueries = videos.map(url => client.query('INSERT INTO product_videos (product_id, video_url) VALUES ($1, $2)', [productId, url]));
        await Promise.all(videoQueries);
      }

      await client.query('COMMIT');
      return productId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // تحديث منتج
  async update(id, productData) {
    const { name, price, description, main_image_url, type, images = [], videos = [] } = productData;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // تحديث بيانات المنتج الأساسية
      await client.query(
        'UPDATE products SET name = $1, price = $2, description = $3, main_image_url = $4, type = $5 WHERE id = $6',
        [name, price, description, main_image_url, type, id]
      );

      // حذف الصور والفيديوهات القديمة
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      await client.query('DELETE FROM product_videos WHERE product_id = $1', [id]);

      // إدخال الصور الجديدة
      if (images.length > 0) {
        const imageQueries = images.map(url => client.query('INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)', [id, url]));
        await Promise.all(imageQueries);
      }

      // إدخال الفيديوهات الجديدة
      if (videos.length > 0) {
        const videoQueries = videos.map(url => client.query('INSERT INTO product_videos (product_id, video_url) VALUES ($1, $2)', [id, url]));
        await Promise.all(videoQueries);
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // حذف منتج
  async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // سيؤدي CASCADE في تعريف الجدول إلى حذف الصور والفيديوهات المرتبطة تلقائيًا
      await client.query('DELETE FROM products WHERE id = $1', [id]);
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // مهم لـ Render
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
module.exports = Product;