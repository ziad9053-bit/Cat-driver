'use client';

import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { Tag, Grid } from 'lucide-react';
import './catalog.css';
import Image from 'next/image';

export default function Home() {
  const { products, categories, loading } = useCart();

  if (loading) {
    return (
      <div className="page-wrapper animate-fade-in">
        <div className="glass loading-card">
          <h1>جاري تحميل المتجر... 🛒</h1>
        </div>
      </div>
    );
  }

  const mainCategories = categories.filter(c => c.parent_id === null);
  const offerProducts = products.filter(p => p.is_offer);

  return (
    <div className="page-wrapper animate-fade-in">
      <header className="page-header">
        <h1>متجر فريشلي الشامل</h1>
        <p>كل ما تحتاجه لمنزلك في مكان واحد.</p>
      </header>

      {/* الأقسام الرئيسية */}
      <h2 className="section-title">
        <Grid size={24} />
        تصفح الأقسام
      </h2>
      <div className="categories-grid">
        {mainCategories.map((category, index) => (
          <Link 
            href={`/category/${category.id}`} 
            key={category.id} 
            className="category-card animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="category-image-wrapper">
              <Image 
                src={category.image_url || 'https://via.placeholder.com/400?text=قسم'} 
                alt={category.name}
                fill
                className="category-image"
              />
            </div>
            <div className="category-title">
              {category.name}
            </div>
          </Link>
        ))}
      </div>

      {/* قسم العروض الخاصة */}
      {offerProducts.length > 0 && (
        <>
          <h2 className="section-title">
            <Tag size={24} color="var(--error-color)" />
            عروض اليوم
          </h2>
          <div className="products-grid">
            {offerProducts.map((product, index) => (
              <Link 
                href={`/product/${product.id}`}
                key={product.id} 
                className="product-card glass animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s`, textDecoration: 'none' }}
              >
                <div className="product-info">
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span className="offer-badge" style={{ backgroundColor: product.offer_color || 'var(--error-color)' }}>
                      {product.offer_label}
                    </span>
                  </div>
                  <div className="product-price">
                    <span className="price-value">${Number(product.current_price).toFixed(2)}</span>
                    <span className="price-unit">/ {product.weight || 'حبة'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
