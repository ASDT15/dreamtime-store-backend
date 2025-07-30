const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // ضروري لـ Render
  }
});

// اختبار الاتصال
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("فشل الاتصال بقاعدة البيانات", err);
  } else {
    console.log("الاتصال بقاعدة البيانات ناجح:", res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};