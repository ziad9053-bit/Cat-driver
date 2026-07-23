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
    return products.filter(p => {
      const isMainCat = p.category_id === mainCatId || p.category_ids?.includes(mainCatId);
      const isSubCat = subCatIds.includes(p.category_id) || p.category_ids?.some(id => subCatIds.includes(id));
      return isMainCat || isSubCat;
    });
  };

  const mainCategories = categories.filter(c => c.parent_id === null);
  const offerProducts = products.filter(p => p.is_offer);

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '100px' }}>
      


      {/* قسم عروض اليوم */}
      {offerProducts.length > 0 && (
        <div className="category-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

      {/* قسم العروض الأسبوعية (مؤقتاً نفس العروض كأمثلة) */}
      {offerProducts.length > 0 && (
        <div className="category-section animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <h2 className="section-title">
              <Tag size={24} color="var(--primary-color)" />
              العروض الأسبوعية
            </h2>
          </div>
          <div className="products-slider">
            {offerProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* عرض المنتجات حسب الأقسام (شريط أفقي) */}
      <div className="categories-sections">
        {mainCategories.map((category, index) => {
          const catProducts = getProductsForCategory(category.id);
          if (catProducts.length === 0) return null;

          return (
            <div key={category.id} className="category-section animate-slide-up" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
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

    </div>
  );
}
