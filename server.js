
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const port = process.env.PORT || 10000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
require('dotenv').config();

// Middleware
app.use(cors()); // السماح بالطلبات من النطاق الأمامي
app.use(express.json({ limit: '10mb' })); // زيادة حد حجم الجسم لدعم Base64 الكبير

// المسارات
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// مسار اختبار بسيط
app.get('/', (req, res) => {
  res.send('Dream Time Store Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("فشل الاتصال بقاعدة البيانات", err);
  } else {
    console.log("الاتصال بقاعدة البيانات ناجح:", res.rows[0].now);
  }
});
