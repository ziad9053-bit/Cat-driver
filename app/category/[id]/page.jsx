'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, SlidersHorizontal } from 'lucide-react';

export default function CategoryPage({ params }) {
  // Using React.use to unwrap params in Next 15+ if needed, or just destructure
  const categoryId = params.id;
  const { categories, products, loading } = useCart();
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('default');

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
  
  const categoryProducts = useMemo(() => {
    let results = products.filter(p => p.category_id === displayCategoryId && p.is_active !== false);
    
    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.current_price - b.current_price);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.current_price - a.current_price);
    } else if (sortBy === 'name_asc') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return results;
  }, [products, displayCategoryId, sortBy]);

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

      {/* شريط الترتيب */}
      {categoryProducts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-color)', padding: '5px 15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <SlidersHorizontal size={16} color="var(--primary-color)" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="default">الترتيب الافتراضي</option>
              <option value="price_asc">الأقل سعراً</option>
              <option value="price_desc">الأعلى سعراً</option>
              <option value="name_asc">الاسم (أ - ي)</option>
            </select>
          </div>
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
