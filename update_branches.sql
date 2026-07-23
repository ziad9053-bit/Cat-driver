-- ==============================================================================
-- Supabase Update Script for Multi-Category Products (Branches)
-- ==============================================================================
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor ثم اضغط RUN

-- 1. إضافة عمود جديد للمنتجات ليقبل مصفوفة من الفروع
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids UUID[];

-- 2. تحديث المنتجات القديمة لنسخ القسم القديم إلى العمود الجديد
UPDATE products SET category_ids = ARRAY[category_id] WHERE category_id IS NOT NULL;

-- 3. إضافة الأقسام والفروع الجديدة (العناية الشخصية، المنظفات، والشامبوهات)
-- الأقسام الرئيسية
INSERT INTO categories (id, name, image_url, parent_id) VALUES 
('66666666-6666-6666-6666-666666666666', 'العناية الشخصية', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80', null),
('77777777-7777-7777-7777-777777777777', 'المنظفات', 'https://images.unsplash.com/photo-1584820927500-1c5c06bc2bc8?auto=format&fit=crop&w=400&q=80', null)
ON CONFLICT (id) DO NOTHING;

-- الفروع
INSERT INTO categories (id, name, parent_id, image_url) VALUES 
('60000000-0000-0000-0000-000000000001', 'الشامبوهات', '66666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80'),
('70000000-0000-0000-0000-000000000001', 'الشامبوهات', '77777777-7777-7777-7777-777777777777', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO NOTHING;

-- 4. إضافة منتج "شامبو" يظهر في الفرعين معاً
INSERT INTO products (id, name, category_ids, current_price, is_offer, unit_type, image_url, description) VALUES 
('b1111111-1111-1111-1111-111111111111', 'شامبو بانتين للعناية', ARRAY['60000000-0000-0000-0000-000000000001'::UUID, '70000000-0000-0000-0000-000000000001'::UUID], 20.00, false, 'حبة', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', 'شامبو لتنظيف وعناية متكاملة')
ON CONFLICT (id) DO NOTHING;
