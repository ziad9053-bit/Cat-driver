'use client';

import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Info } from 'lucide-react';
import Image from 'next/image';

export default function ProductDetailsPage({ params }) {
  const productId = params.id;
  const { products, cart, updateQuantity, loading } = useCart();

  if (loading) {
    return <div className="page-wrapper"><div className="glass loading-card">جاري التحميل...</div></div>;
  }

  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="page-wrapper">
        <div className="empty-state glass">
          <h2>المنتج غير موجود</h2>
          <Link href="/" className="back-link">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const quantity = cart[product.id] || 0;

  return (
    <div className="product-detail-page animate-fade-in">
      <header className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Link href="/" className="back-link">
          <ArrowLeft size={20} />
          <span>رجوع</span>
        </Link>
      </header>

      <div className="product-detail-image-wrapper">
        <Image 
          src={product.image_url || 'https://via.placeholder.com/600?text=صورة+المنتج'}
          alt={product.name}
          fill
          className="product-detail-image"
        />
        {product.is_offer && (
          <span className="offer-badge" style={{ 
            position: 'absolute', top: 16, right: 16, fontSize: '1rem', padding: '8px 16px',
            backgroundColor: product.offer_color || 'var(--error-color)' 
          }}>
            {product.offer_label}
          </span>
        )}
      </div>

      <div className="product-detail-info animate-slide-up">
        <h1 className="product-detail-title">{product.name}</h1>
        
        <div className="product-detail-price-row">
          <div className="product-detail-price">
            ${Number(product.current_price).toFixed(2)} <span style={{fontSize: '1.2rem', color: 'var(--text-secondary)'}}>/ {product.unit_type}</span>
          </div>
          {product.weight && (
            <div className="product-detail-weight">
              الوزن: {product.weight}
            </div>
          )}
        </div>

        <div className="product-detail-desc">
          <h3 style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-primary)'}}>
            <Info size={20} />
            تفاصيل المنتج
          </h3>
          <p>{product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}</p>
        </div>

        <div className="product-actions" style={{ justifyContent: 'center', marginTop: 32 }}>
          {quantity === 0 ? (
            <button className="add-to-cart-btn" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', justifyContent: 'center' }} onClick={() => updateQuantity(product.id, 1)}>
              <Plus size={24} />
              <span>إضافة إلى السلة</span>
            </button>
          ) : (
            <div className="quantity-selector" style={{ width: '100%', justifyContent: 'space-between', padding: '8px 16px' }}>
              <button className="qty-btn" style={{ width: 48, height: 48 }} onClick={() => updateQuantity(product.id, -1)}>
                <Minus size={24} />
              </button>
              <span className="qty-value" style={{ fontSize: '1.5rem' }}>{quantity}</span>
              <button className="qty-btn" style={{ width: 48, height: 48 }} onClick={() => updateQuantity(product.id, 1)}>
                <Plus size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
