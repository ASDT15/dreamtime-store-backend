// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// المسارات
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// مسار اختبار
app.get('/', (req, res) => {
  res.send('Dream Time Store Backend API is running...');
});

// تشغيل الخادم
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ الخادم يعمل على المنفذ ${port}`);
});