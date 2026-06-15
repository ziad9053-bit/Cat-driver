'use client';

import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './catalog.css';

export default function ProductCatalog() {
  const { products, cart, updateQuantity, loading } = useCart();

  if (loading) {
    return (
      <div className="page-wrapper animate-fade-in">
        <div className="glass loading-card" style={{textAlign: 'center', padding: '40px'}}>
          <h1 style={{ color: 'var(--primary-color)' }}>جاري تحميل متجر كات درايفر... 🚚</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in">
      <header className="page-header" style={{textAlign: 'center', margin: '40px 0'}}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>متجر كات درايفر</h1>
        <p style={{ color: 'var(--text-secondary)' }}>خدمة التوصيل الفاخرة لاحتياجاتك اليومية.</p>
      </header>

      {products.length === 0 ? (
        <div className="empty-state glass">
          <ShoppingBag size={48} className="empty-icon" />
          <p>لا توجد منتجات متاحة حالياً.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product, index) => {
            const quantity = cart[product.id] || 0;
            
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
                    <span className="price-unit">/ {product.unit_type === 'Kilo' ? 'كيلو' : 'صندوق'}</span>
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
