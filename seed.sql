-- Insert Mock Categories and Products for testing
-- This script uses CTEs (Common Table Expressions) to insert categories and then use their generated UUIDs for the products.

WITH cat_fruits AS (
    INSERT INTO Categories (name) VALUES ('Fresh Fruits') RETURNING id
),
cat_veg AS (
    INSERT INTO Categories (name) VALUES ('Organic Vegetables') RETURNING id
),
cat_drinks AS (
    INSERT INTO Categories (name) VALUES ('Premium Drinks') RETURNING id
)
INSERT INTO Products (category_id, name, unit_type, current_price, is_offer, offer_label, offer_color)
VALUES 
((SELECT id FROM cat_fruits), 'Premium Golden Apples', 'Kilo', 12.50, true, 'Best Seller', '#E65100'),
((SELECT id FROM cat_fruits), 'Organic Strawberries', 'Box', 25.00, false, null, null),
((SELECT id FROM cat_veg), 'Fresh Asparagus', 'Kilo', 18.00, true, 'New Arrival', '#10B981'),
((SELECT id FROM cat_drinks), 'Cold Brew Coffee', 'Box', 45.00, false, null, null);
