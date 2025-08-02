
-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    main_image_url TEXT, -- رابط الصورة الرئيسية
    type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الصور الإضافية للمنتجات
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE -- لتحديد الصورة الرئيسية إن لزم
);

-- جدول الفيديوهات للمنتجات
CREATE TABLE IF NOT EXISTS product_videos (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL
);

-- جدول الطلبات الرئيسي
-- جدول الطلبات الرئيسي
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL, -- معرف الطلب الذي يراه العميل
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20), -- العمود الذي أضفته مؤخرًا
    -- البداية: إضافة عمود طريقة الدفع --
    payment_method VARCHAR(50),
    -- النهاية: إضافة عمود طريقة الدفع --
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' -- pending, completed
    -- يمكنك إضافة أعمدة أخرى حسب الحاجة
);

-- جدول عناصر الطلب (المنتجات داخل كل طلب)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    size VARCHAR(50),
    location VARCHAR(255)

);