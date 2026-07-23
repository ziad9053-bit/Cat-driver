'use client';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { useState, useMemo, Suspense } from 'react';
import { ArrowLeft, SearchX, SlidersHorizontal } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products, loading } = useCart();
  const [sortBy, setSortBy] = useState('default');

  const filteredProducts = useMemo(() => {
    if (!query) return [];
    
    // Filter
    let results = products.filter(p => 
      p.is_active !== false && 
      (
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
      )
    );

    // Sort
    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.current_price - b.current_price);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.current_price - a.current_price);
    } else if (sortBy === 'name_asc') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    return results;
  }, [products, query, sortBy]);

  if (loading) {
    return <div className="page-wrapper"><div className="glass loading-card">جاري البحث...</div></div>;
  }

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/" className="back-link" style={{ marginBottom: 0 }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>نتائج البحث عن: &quot;{query}&quot;</h1>
        </div>
      </header>

      {filteredProducts.length > 0 && (
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

      {filteredProducts.length === 0 ? (
        <div className="empty-state glass">
          <SearchX size={48} className="empty-icon" />
          <p>عذراً، لم نجد أي منتجات تطابق &quot;{query}&quot;</p>
          <Link href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>تصفح المتجر</Link>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product, index) => (
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
                  <span className="price-unit">/ {product.unit_type || product.weight}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-wrapper"><div className="glass loading-card">جاري التحميل...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
