'use client';

import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { Tag, Grid } from 'lucide-react';
import './catalog.css';
import Image from 'next/image';
import ProductCard from './components/ProductCard';

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

  const getProductsForCategory = (mainCatId) => {
    const subCatIds = categories.filter(c => c.parent_id === mainCatId).map(c => c.id);
    return products.filter(p => p.category_id === mainCatId || subCatIds.includes(p.category_id));
  };

  const mainCategories = categories.filter(c => c.parent_id === null);
  const offerProducts = products.filter(p => p.is_offer);

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '100px' }}>
      
      {/* Hero Banner Slider */}
      <div className="hero-banner glass animate-slide-up">
        <div className="hero-content">
          <h1>طازج ومقرمش، لباب بيتك!</h1>
          <p>اطلب الآن الخضار والفواكه الطازجة، واحصل على توصيل سريع مع فريشلي.</p>
          <div className="hero-tags">
            <span className="hero-tag">توصيل سريع</span>
            <span className="hero-tag">جودة مضمونة</span>
          </div>
        </div>
      </div>

      {/* عرض المنتجات حسب الأقسام (شريط أفقي) */}
      <div className="categories-sections">
        {mainCategories.map((category, index) => {
          const catProducts = getProductsForCategory(category.id);
          if (catProducts.length === 0) return null;

          return (
            <div key={category.id} className="category-section animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="section-header">
                <h2 className="section-title">
                  <Grid size={24} color="var(--primary-color)" />
                  {category.name}
                </h2>
                <Link href={`/category/${category.id}`} className="view-all-btn">
                  عرض الكل
                </Link>
              </div>
              
              <div className="products-slider">
                {catProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* قسم العروض الخاصة */}
      {offerProducts.length > 0 && (
        <div className="category-section animate-slide-up" style={{ animationDelay: '0.5s', marginTop: '30px' }}>
          <div className="section-header">
            <h2 className="section-title">
              <Tag size={24} color="var(--error-color)" />
              عروض اليوم
            </h2>
          </div>
          <div className="products-slider">
            {offerProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
