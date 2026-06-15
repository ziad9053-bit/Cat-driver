-- Enum Types
CREATE TYPE user_role AS ENUM ('Customer', 'Admin', 'Driver', 'Preparer');
CREATE TYPE unit_type AS ENUM ('Kilo', 'Box');
CREATE TYPE order_status AS ENUM ('Pending', 'Processing', 'OnTheWay', 'Delivered', 'Cancelled');
CREATE TYPE payment_method AS ENUM ('Cash', 'Card');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Failed');

-- Users Table
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role user_role DEFAULT 'Customer',
    location_gps VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE Categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE Products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES Categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    unit_type unit_type NOT NULL,
    current_price DECIMAL(10, 2) NOT NULL,
    is_offer BOOLEAN DEFAULT FALSE,
    offer_label VARCHAR(100),
    offer_color VARCHAR(7), -- HEX color (e.g., #FF0000)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for Products table
alter publication supabase_realtime add table Products;

-- Orders Table
CREATE TABLE Orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    status order_status DEFAULT 'Pending',
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE Order_Items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES Orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES Products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 2) NOT NULL, -- DECIMAL to support fractions of a kilo
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE Invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES Orders(id) ON DELETE CASCADE UNIQUE,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'Pending',
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic Row Level Security (RLS) setup (Open for now to facilitate dev)
-- In a real production env, these would be locked down.
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE Products ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE Order_Items ENABLE ROW LEVEL SECURITY;
ALTER TABLE Invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on Categories" ON Categories FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access on Products" ON Products FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on Users" ON Users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read access on Users" ON Users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on Orders" ON Orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert on Order_Items" ON Order_Items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert on Invoices" ON Invoices FOR INSERT WITH CHECK (true);
