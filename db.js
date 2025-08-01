// db.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises; // لقراءة ملفات
const path = require('path'); // للتعامل مع المسارات

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // ضروري لـ Render
    }
});

// تصدير دالة query و getClient
const db = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};

// دالة جديدة لإنشاء الجداول من ملف SQL
db.initializeTables = async () => {
    try {
        // تحديد المسار الكامل لملف create_tables.sql
        // __dirname هو مجلد db.js (dreamtime_store/backend)
        const sqlFilePath = path.join(__dirname, 'config', 'create_tables.sql');
        console.log(`[INFO] محاولة قراءة ملف SQL من: ${sqlFilePath}`);

        // قراءة محتوى الملف
        const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

        // تقسيم الملف إلى عبارات SQL منفصلة (باستخدام الفاصلة المنقوطة كفاصل)
        // هذا مهم لأن pg لا تنفذ عدة عبارات في استعلام واحد بسهولة
        const queries = sqlContent
            .split(';') // تقسيم بالفاصلة المنقوطة
            .map(query => query.trim()) // إزالة المسافات
            .filter(query => query.length > 0); // تجاهل العبارات الفارغة

        const client = await pool.connect();
        console.log("[INFO] الاتصال بقاعدة البيانات لإنشاء الجداول...");

        // تنفيذ كل استعلام على حدة
        for (const query of queries) {
            if (query) { // تأكد من أن الاستعلام ليس فارغًا
                console.log(`[DEBUG] تنفيذ الاستعلام: ${query.substring(0, 50)}...`); // طباعة جزء من الاستعلام للتصحيح
                await client.query(query);
            }
        }

        client.release();
        console.log("✅ الجداول تم إنشاؤها أو التحقق من وجودها بنجاح");

    } catch (err) {
        console.error("❌ خطأ في تهيئة الجداول:", err.message);
        // لا تتوقف عند الخطأ، ربما الجداول موجودة بالفعل
        // يمكنك إضافة منطق أكثر تعقيدًا هنا إذا لزم الأمر
    }
};

// اختبار الاتصال الأساسي
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message);
    } else {
        console.log("✅ الاتصال بقاعدة البيانات ناجح:", res.rows[0].now);
    }
});

module.exports = db; // تصدير الكائن الكامل