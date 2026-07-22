-- ==============================================================================
-- Supabase Update Script for Phase 1: Admin Dashboard Features
-- ==============================================================================

-- 1. إضافة أعمدة إدارة المنتجات الجديدة
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. إعداد حاوية الصور (Storage Bucket) - قم بتشغيل هذا الجزء للتأكد من وجود الحاوية
-- سيقوم بإنشاء الحاوية إذا لم تكن موجودة، وجعلها عامة ليتمكن المستخدمون من رؤية الصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. سياسات الوصول للحاوية (Storage Policies)
-- السماح للجميع بمشاهدة الصور (تنزيل)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'products' );

-- السماح للمدير (أو للجميع مؤقتاً لغرض التطوير) برفع الصور
-- ملاحظة: هذه السياسة مؤقتة للتطوير، يفضل ربطها بـ auth.uid() في بيئة الإنتاج
CREATE POLICY "Allow public uploads temporarily" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'products' );

CREATE POLICY "Allow public update temporarily" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'products' );

CREATE POLICY "Allow public delete temporarily" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'products' );
