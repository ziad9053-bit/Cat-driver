-- ==============================================================================
-- Supabase Update Script for Supermarket Hierarchical Categories & Offers
-- ==============================================================================
-- قم بتنفيذ هذا الكود في SQL Editor لتحديث قاعدة البيانات

-- 1. تحديث جدول الأقسام (categories) ليقبل أقسام رئيسية وفرعية وصور
ALTER TABLE IF EXISTS categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. تحديث جدول المنتجات (products) ليقبل الصور، الوصف، والوزن
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT; -- e.g., '500g', '1kg', '1L'

-- 3. مسح البيانات القديمة لتجنب التعارض (اختياري، يفضل لتجربة نظيفة)
-- DELETE FROM products;
-- DELETE FROM categories;

-- 4. إدراج الأقسام الرئيسية (Main Categories)
INSERT INTO categories (id, name, image_url) VALUES 
('11111111-1111-1111-1111-111111111111', 'المواد الغذائية', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'),
('22222222-2222-2222-2222-222222222222', 'المنظفات', 'https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?auto=format&fit=crop&w=400&q=80'),
('33333333-3333-3333-3333-333333333333', 'اللحوم', 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=400&q=80'),
('44444444-4444-4444-4444-444444444444', 'المخبوزات', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80'),
('55555555-5555-5555-5555-555555555555', 'الخضار والفواكه', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url;

-- 5. إدراج الأقسام الفرعية (Sub Categories)
INSERT INTO categories (id, name, parent_id, image_url) VALUES 
('10000000-0000-0000-0000-000000000001', 'معلبات', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1599583161048-c116d4e48b3b?auto=format&fit=crop&w=400&q=80'),
('10000000-0000-0000-0000-000000000002', 'تموينات (سكر، أرز)', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=400&q=80'),
('20000000-0000-0000-0000-000000000001', 'منظفات الغسيل', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=400&q=80'),
('30000000-0000-0000-0000-000000000001', 'لحوم طازجة', '33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1602164945488-322a0e0a09e4?auto=format&fit=crop&w=400&q=80'),
('40000000-0000-0000-0000-000000000001', 'خبز ومعجنات', '44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80'),
('50000000-0000-0000-0000-000000000001', 'خضار ورقية', '55555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, image_url = EXCLUDED.image_url;

-- 6. إدراج منتجات تجريبية (Dummy Products) مع تفعيل العروض لبعضها
INSERT INTO products (id, name, category_id, current_price, is_offer, offer_label, offer_color, unit_type, image_url, description, weight) VALUES 
('a1111111-1111-1111-1111-111111111111', 'أرز بسمتي', '10000000-0000-0000-0000-000000000002', 15.50, true, 'خصم 20%', '#FF3B30', 'كيس', 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=400&q=80', 'أرز بسمتي درجة أولى مثالي للكبسة.', '5KG'),
('a2222222-2222-2222-2222-222222222222', 'صابون غسيل سائل', '20000000-0000-0000-0000-000000000001', 25.00, false, '', '', 'عبوة', 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=400&q=80', 'صابون غسيل ملابس برائحة اللافندر.', '3L'),
('a3333333-3333-3333-3333-333333333333', 'لحم غنم طازج', '30000000-0000-0000-0000-000000000001', 65.00, true, 'عرض اليوم', '#34C759', 'كيلو', 'https://images.unsplash.com/photo-1602164945488-322a0e0a09e4?auto=format&fit=crop&w=400&q=80', 'لحم غنم طازج ومقطع حسب الطلب.', '1KG'),
('a4444444-4444-4444-4444-444444444444', 'خبز فرنسي', '40000000-0000-0000-0000-000000000001', 3.50, false, '', '', 'حبة', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', 'خبز باجيت فرنسي مقرمش يخبز يومياً.', '250g'),
('a5555555-5555-5555-5555-555555555555', 'خس روماني', '50000000-0000-0000-0000-000000000001', 4.00, true, 'وصل حديثاً', '#007AFF', 'حبة', 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=400&q=80', 'خس طازج ومقرمش للسلطات.', '500g')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  current_price = EXCLUDED.current_price, 
  is_offer = EXCLUDED.is_offer, 
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;
