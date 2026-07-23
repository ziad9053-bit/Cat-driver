'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, SlidersHorizontal, Tag } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

export default function CategoryPage({ params }) {
  const categoryId = params.id;
  const { categories, products, loading } = useCart();
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('default');

  const mainCategory = categories.find(c => c.id === categoryId);
  const subCategories = categories.filter(c => c.parent_id === categoryId);
  
  const showBranchesView = subCategories.length > 0 && !activeSubcategoryId;
  const displayCategoryId = activeSubcategoryId || categoryId;
  
  // All products belonging to this main category and its subcategories
  const allCategoryProducts = useMemo(() => {
    const subCatIds = subCategories.map(c => c.id);
    return products.filter(p => {
      const isMainCat = p.category_id === categoryId || p.category_ids?.includes(categoryId);
      const isSubCat = subCatIds.includes(p.category_id) || p.category_ids?.some(id => subCatIds.includes(id));
      return (isMainCat || isSubCat) && p.is_active !== false;
    });
  }, [products, categoryId, subCategories]);

  // Offers within this category
  const categoryOffers = useMemo(() => {
    return allCategoryProducts.filter(p => p.is_offer);
  }, [allCategoryProducts]);

  // Products to display (either all for main cat, or filtered for subcat)
  const categoryProducts = useMemo(() => {
    if (showBranchesView) return allCategoryProducts; 
    
    let results = products.filter(p => {
      const belongs = p.category_ids?.includes(displayCategoryId) || p.category_id === displayCategoryId;
      return belongs && p.is_active !== false;
    });
    
    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.current_price - b.current_price);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.current_price - a.current_price);
    } else if (sortBy === 'name_asc') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return results;
  }, [products, displayCategoryId, sortBy, showBranchesView, allCategoryProducts]);

  if (loading) {
    return <div className="page-wrapper"><div className="glass loading-card">جاري التحميل...</div></div>;
  }

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* Category Hero Banner */}
      <div className="hero-banner" style={mainCategory?.image_url ? { backgroundImage: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(3,8,6,0.8) 100%), url(${mainCategory.image_url})` } : {}}>
        <Link href="/" className="back-link" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
          <span>الرئيسية</span>
        </Link>
        <div className="hero-content">
          <h1>{mainCategory?.name || 'قسم المنتجات'}</h1>
          <p>اكتشف أفضل المنتجات الطازجة والعروض الحصرية المتوفرة لدينا خصيصاً لك.</p>
        </div>
      </div>

      {/* شريط الأقسام الفرعية العلوية إذا كان هناك فرع محدد */}
      {subCategories.length > 0 && activeSubcategoryId && (
        <div className="subcategories-scroll" style={{ marginTop: '20px' }}>
          <button
            className={`subcategory-pill ${!activeSubcategoryId ? 'active' : ''}`}
            onClick={() => setActiveSubcategoryId(null)}
          >
            كل الفروع
          </button>
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

      {showBranchesView ? (
        <>
          {/* عروض القسم الحصرية */}
          {categoryOffers.length > 0 && (
            <div className="category-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="section-header">
                <h2 className="section-title">
                  <Tag size={24} color="var(--error-color)" />
                  عروض {mainCategory?.name}
                </h2>
              </div>
              <div className="products-slider">
                {categoryOffers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* الفروع (Branches) */}
          <div className="category-section animate-slide-up" style={{ animationDelay: '0.2s', marginTop: '20px' }}>
            <div className="branches-grid">
              {subCategories.map((sub, index) => (
                <div 
                  key={sub.id} 
                  className="branch-card glass"
                  onClick={() => setActiveSubcategoryId(sub.id)}
                >
                  {sub.image_url ? (
                    <div className="branch-img" style={{ backgroundImage: `url(${sub.image_url})` }}></div>
                  ) : (
                    <div className="branch-img placeholder"><SlidersHorizontal size={32} /></div>
                  )}
                  <div className="branch-info">
                    <h3>{sub.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* أحدث المنتجات في القسم (منتجات مختارة) */}
          <div className="category-section animate-slide-up" style={{ animationDelay: '0.3s', marginTop: '30px' }}>
            <div className="section-header">
              <h2 className="section-title">
                <ShoppingBag size={24} color="var(--text-primary)" />
                منتجات مختارة
              </h2>
            </div>
            <div className="products-grid">
              {categoryProducts.slice(0, 10).map((product, index) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* عرض المنتجات لفرع محدد */}
          {/* شريط الترتيب */}
          {categoryProducts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', padding: '0 10px', marginTop: '20px' }}>
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
            <div className="empty-state glass" style={{ marginTop: '20px' }}>
              <ShoppingBag size={48} className="empty-icon" />
              <p>لا توجد منتجات حالياً في هذا القسم.</p>
            </div>
          ) : (
            <div className="products-grid">
              {categoryProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

