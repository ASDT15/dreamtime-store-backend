// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // استيراد الكائن db الذي يحتوي على initializeTables الآن

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

// دالة لبدء تشغيل الخادم بعد التأكد من الجداول
const startServer = async () => {
    try {
        // 1. تنفيذ تهيئة الجداول
        await db.initializeTables();

        // 2. بدء استماع الخادم فقط بعد التأكد من الجداول
        app.listen(port, '0.0.0.0', () => {
            console.log(`✅ الخادم يعمل على المنفذ ${port}`);
            console.log(`      ==> خدمتك متاحة الآن 🎉`);
            console.log(`     ==> متوفر على عنوان URL الأساسي الخاص بك https://dreamtime-store-api.onrender.com`);
            console.log(`     ==> ///////////////////////////////////////////////////////////`);
        });

    } catch (error) {
        console.error("❌ فشل في بدء تشغيل الخادم:", error.message);
        process.exit(1); // إنهاء العملية في حالة فشل جسيم
    }
};

// استدعاء الدالة لبدء التشغيل
startServer();