require('dotenv').config();

const express = require('express');
const cors = require('cors');

// استيراد المسارات
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

// إعداد قاعدة البيانات أولًا
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // ضروري لـ Render
  }
});

// تصدير دالة query
module.exports = {
  query: (text, params) => pool.query(text, params)
};

// اختبار الاتصال بقاعدة البيانات (اختياري)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("فشل الاتصال بقاعدة البيانات", err);
  } else {
    console.log("الاتصال بقاعدة البيانات ناجح:", res.rows[0].now);
  }
});

// إعداد الخادم
const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // لدعم Base64 الكبير

// المسارات
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// مسار اختبار
app.get('/', (req, res) => {
  res.send('Dream Time Store Backend API is running...');
});

// تشغيل الخادم
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});