// db.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// التحقق مما إذا كنا نستخدم قاعدة بيانات محلية
// هذا للمطورين المحليين الذين لا يستخدمون DATABASE_URL
const isLocalDB = process.env.LOCAL_DB === 'true';

let poolConfig = {};

// *** التغيير الأساسي هنا ***
// إعطاء الأولوية لـ DATABASE_URL. إذا كان موجودًا، نستخدمه.
if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
    console.log("[INFO] استخدام DATABASE_URL للاتصال بقاعدة البيانات.");

    // **تفعيل SSL دائمًا عند استخدام DATABASE_URL**
    // لأن قواعد بيانات Render (والعديد من الخدمات السحابية) تتطلب SSL.
    poolConfig.ssl = {
        rejectUnauthorized: false // مطلوب للاتصال ب Render Postgres
    };
    console.log("[INFO] تفعيل SSL للاتصال بقاعدة البيانات (DATABASE_URL مستخدم).");

} else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    // بناء الكونفيغ يدويًا من المتغيرات الفردية (مفيد محليًا بدون DATABASE_URL)
    poolConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    };
    console.log("[INFO] بناء connectionString يدويًا من المتغيرات البيئية الفردية.");

    // تفعيل SSL فقط في البيئة المحلية إذا تم تعيين LOCAL_DB=false
    // أو يمكنك تعطيله تمامًا محليًا كما كان في الإصدار السابق
    if (!isLocalDB) {
        poolConfig.ssl = {
            rejectUnauthorized: false
        };
        console.log("[INFO] تفعيل SSL للاتصال بقاعدة البيانات (LOCAL_DB=false).");
    }
} else {
    console.error("❌ لم يتم توفير معلومات كافية للاتصال بقاعدة البيانات. تحقق من ملف .env أو متغيرات Render.");
    process.exit(1);
}

const pool = new Pool(poolConfig);

// ... (باقي الكود كما هو: db object, initializeTables function, pool.query test) ...

// تصدير دالة query و getClient
const db = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};

// دالة جديدة لإنشاء الجداول من ملف SQL
db.initializeTables = async () => {
    try {
        const sqlFilePath = path.join(__dirname, 'config', 'create_tables.sql');
        console.log(`[INFO] محاولة قراءة ملف SQL من: ${sqlFilePath}`);

        const sqlContent = await fs.readFile(sqlFilePath, 'utf8');

        const queries = sqlContent
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0);

        const client = await pool.connect();
        console.log("[INFO] الاتصال بقاعدة البيانات لإنشاء الجداول...");

        for (const query of queries) {
            if (query) {
                console.log(`[DEBUG] تنفيذ الاستعلام: ${query.substring(0, 50)}...`);
                await client.query(query);
            }
        }

        client.release();
        console.log("✅ الجداول تم إنشاؤها أو التحقق من وجودها بنجاح");

    } catch (err) {
        console.error("❌ خطأ في تهيئة الجداول:", err.message);
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

module.exports = db;