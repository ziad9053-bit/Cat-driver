-- 1. إضافة عمود الصورة لجدول المنتجات
ALTER TABLE Products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- 2. حذف البيانات القديمة (اختياري، لترتيب الواجهة فقط)
DELETE FROM Products;
DELETE FROM Categories;

-- 3. إضافة التصنيفات والمنتجات باللغة العربية مع الصور
WITH cat_fruits AS (
    INSERT INTO Categories (name) VALUES ('فواكه طازجة') RETURNING id
),
cat_veg AS (
    INSERT INTO Categories (name) VALUES ('خضروات عضوية') RETURNING id
),
cat_drinks AS (
    INSERT INTO Categories (name) VALUES ('مشروبات فاخرة') RETURNING id
)
INSERT INTO Products (category_id, name, unit_type, current_price, is_offer, offer_label, offer_color, image_url)
VALUES 
((SELECT id FROM cat_fruits), 'تفاح ذهبي فاخر', 'Kilo', 12.50, true, 'الأكثر مبيعاً', '#E65100', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=800&q=80'),
((SELECT id FROM cat_fruits), 'فراولة عضوية طازجة', 'Box', 25.00, false, null, null, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80'),
((SELECT id FROM cat_veg), 'هليون (أسبراجوس) طازج', 'Kilo', 18.00, true, 'وصل حديثاً', '#10B981', 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?w=800&q=80'),
((SELECT id FROM cat_drinks), 'قهوة مقطرة باردة', 'Box', 45.00, false, null, null, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80');
