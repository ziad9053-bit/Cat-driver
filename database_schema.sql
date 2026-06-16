-- ==========================================
-- Cat Driver Store - Database Setup Script
-- ==========================================
-- This script contains all the tables, columns, and security policies 
-- needed to run the application on a new Supabase project.

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image_url TEXT,
    unit_type TEXT DEFAULT 'piece', -- 'kg', 'piece', 'box', 'gram', 'liter'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_location TEXT NOT NULL,
    total_price NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, preparing, ready, out_for_delivery, delivered, cancelled
    notes TEXT,
    delivery_type TEXT DEFAULT 'standard', -- standard, fast
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity NUMERIC NOT NULL,
    price_at_time NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Insert Default Settings
-- ==========================================
INSERT INTO public.app_settings (key, value, description)
VALUES 
('store_name', '"كات درايفر"', 'اسم المتجر المعروض في الأعلى'),
('store_logo', 'null', 'رابط شعار المتجر (اختياري)'),
('delivery_fee', '10', 'رسوم التوصيل العادي'),
('fast_delivery_fee', '25', 'رسوم التوصيل السريع'),
('invoice_header', '"مؤسسة كات درايفر للتوصيل - شكراً لتسوقكم معنا"', 'العبارة الترحيبية في الفاتورة'),
('invoice_footer', '"نسعد بخدمتكم دائماً، في حال وجود استفسار يرجى التواصل معنا"', 'العبارة الختامية في الفاتورة'),
('invoice_color', '"#d4af37"', 'اللون الرئيسي في تصميم الفاتورة')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================
-- By default, allow anyone to read and write (since auth is handled via custom frontend logic currently)
-- In a production environment with strict Supabase Auth, these should be locked down.

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow public access (Read/Write) for all tables
-- Products
CREATE POLICY "Allow public select on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

-- Orders
CREATE POLICY "Allow public select on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on orders" ON public.orders FOR DELETE USING (true);

-- Order Items
CREATE POLICY "Allow public select on order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on order_items" ON public.order_items FOR DELETE USING (true);

-- App Settings
CREATE POLICY "Allow public select on app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on app_settings" ON public.app_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on app_settings" ON public.app_settings FOR DELETE USING (true);

-- Invoices
CREATE POLICY "Allow public select on invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoices" ON public.invoices FOR DELETE USING (true);
