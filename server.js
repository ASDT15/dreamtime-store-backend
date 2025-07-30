<<<<<<< HEAD
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

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
=======
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

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
>>>>>>> 2b6678334f8dc690f7fea68dd5c0b3920abcc2ca
