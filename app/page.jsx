'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Plus, Minus, ShoppingBag, Carrot, Wheat, Apple, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './catalog.css';

export default function ProductCatalog() {
  const { products, cart, updateQuantity, loading } = useCart();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  
  // Fetch dynamic categories
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (data && data.length > 0) {
        // Order them consistently
        const ordered = [...data].sort((a, b) => {
          if (a.name.includes('خضار')) return -1;
          if (b.name.includes('خضار')) return 1;
          if (a.name.includes('بقول')) return -1;
          if (b.name.includes('بقول')) return 1;
          return 0;
        });
        setCategoriesList(ordered);
        setActiveCategory(ordered[0].id); // Select first category by default
      }
    };
    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper animate-fade-in">
        <div className="glass loading-card" style={{textAlign: 'center', padding: '40px'}}>
          <h1 style={{ color: 'var(--primary-color)' }}>جاري تحميل متجر كات درايفر... 🚚</h1>
        </div>
      </div>
    );
  }

  // Filter products by category
  const filteredProducts = activeCategory 
    ? products.filter(p => p.category_id == activeCategory)
    : [];

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="page-header" style={{textAlign: 'center', margin: '20px 0'}}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>متجر كات درايفر</h1>
        <p style={{ color: 'var(--text-secondary)' }}>خدمة التوصيل الفاخرة لاحتياجاتك اليومية.</p>
      </header>

      {/* Persistent Bottom Navigation Bar */}
      <div className="bottom-nav-bar glass" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: 'rgba(26, 26, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)'
      }}>
        {categoriesList.map(cat => {
          let icon = <Leaf size={22} />;
          if (cat.name.includes('خضار')) icon = <Carrot size={22} />;
          else if (cat.name.includes('بقول')) icon = <Wheat size={22} />;
          else if (cat.name.includes('فواك')) icon = <Apple size={22} />;

          const isActive = activeCategory === cat.id;

          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 'bold' : 'normal',
                flex: 1
              }}
            >
              {icon}
              <span>{cat.name}</span>
            </button>
          );
        })}
        
        {/* Cart Item in Bottom Bar */}
        <button 
          onClick={() => router.push('/cart')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            fontSize: '0.85rem',
            position: 'relative',
            flex: 1
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={22} />
            {Object.keys(cart).length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-10px',
                background: 'var(--primary-color)',
                color: 'black',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {Object.values(cart).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </div>
          <span>السلة</span>
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state glass">
          <ShoppingBag size={48} className="empty-icon" />
          <p>لا توجد منتجات متاحة في هذا القسم حالياً.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product, index) => {
            const quantity = cart[product.id] || 0;
            const unitTranslations = {
              'Kilo': 'كيلو',
              'SmallBox': 'فلين صغير',
              'MediumBox': 'فلين وسط',
              'LargeBox': 'فلين كبير',
              'Box': 'صندوق' // legacy
            };
            const unitName = unitTranslations[product.unit_type] || product.unit_type;
            
            return (
              <div 
                key={product.id} 
                className="product-card glass animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {product.image_url && (
                  <div className="product-image" style={{ width: '100%', height: '200px', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', marginBottom: '10px' }}>
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="product-info">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    {product.is_offer && (
                      <span className="offer-badge" style={{ backgroundColor: product.offer_color || 'var(--accent-color)' }}>
                        {product.offer_label}
                      </span>
                    )}
                  </div>
                  <div className="product-price">
                    <span className="price-value">{Number(product.current_price).toFixed(2)} ريال</span>
                    <span className="price-unit">/ {unitName}</span>
                  </div>
                </div>

                <div className="product-actions">
                  {quantity === 0 ? (
                    <button className="add-to-cart-btn" onClick={() => updateQuantity(product.id, 1)}>
                      <Plus size={18} />
                      <span>إضافة للسلة</span>
                    </button>
                  ) : (
                    <div className="quantity-selector">
                      <button className="qty-btn" onClick={() => updateQuantity(product.id, -1)}>
                        <Minus size={18} />
                      </button>
                      <span className="qty-value">{quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(product.id, 1)}>
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
