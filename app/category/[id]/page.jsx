'use client';

import { use, useState, useEffect } from 'react';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export default function CategoryPage({ params }) {
  // Using React.use to unwrap params in Next 15+ if needed, or just destructure
  const categoryId = params.id;
  const { categories, products, loading } = useCart();
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);

  useEffect(() => {
    // If no active subcategory is set, set it to the first available subcategory
    if (!loading && categories.length > 0 && !activeSubcategoryId) {
      const subs = categories.filter(c => c.parent_id === categoryId);
      if (subs.length > 0) {
        setActiveSubcategoryId(subs[0].id);
      }
    }
  }, [loading, categories, categoryId, activeSubcategoryId]);

  if (loading) {
    return <div className="page-wrapper"><div className="glass loading-card">جاري التحميل...</div></div>;
  }

  const mainCategory = categories.find(c => c.id === categoryId);
  const subCategories = categories.filter(c => c.parent_id === categoryId);
  
  // If no subcategories, show products directly for the main category.
  // Otherwise, show products for the selected subcategory.
  const displayCategoryId = activeSubcategoryId || categoryId;
  const categoryProducts = products.filter(p => p.category_id === displayCategoryId);

  return (
    <div className="page-wrapper animate-fade-in">
      <header className="page-header subcategories-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={20} />
          <span>العودة للرئيسية</span>
        </Link>
        <h1>{mainCategory?.name || 'قسم المنتجات'}</h1>
      </header>

      {/* شريط الأقسام الفرعية */}
      {subCategories.length > 0 && (
        <div className="subcategories-scroll">
          {subCategories.map(sub => (
            <button
              key={sub.id}
              className={`subcategory-pill ${activeSubcategoryId === sub.id ? 'active' : ''}`}
              onClick={() => setActiveSubcategoryId(sub.id)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* المنتجات */}
      {categoryProducts.length === 0 ? (
        <div className="empty-state glass">
          <ShoppingBag size={48} className="empty-icon" />
          <p>لا توجد منتجات حالياً في هذا القسم.</p>
        </div>
      ) : (
        <div className="products-grid">
          {categoryProducts.map((product, index) => (
            <Link 
              href={`/product/${product.id}`}
              key={product.id} 
              className="product-card glass animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s`, textDecoration: 'none' }}
            >
              <div className="product-info">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  {product.is_offer && (
                    <span className="offer-badge" style={{ backgroundColor: product.offer_color || 'var(--error-color)' }}>
                      {product.offer_label}
                    </span>
                  )}
                </div>
                <div className="product-price">
                  <span className="price-value">${Number(product.current_price).toFixed(2)}</span>
                  <span className="price-unit">/ {product.unit_type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
