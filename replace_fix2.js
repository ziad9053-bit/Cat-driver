const fs = require('fs');
let content = fs.readFileSync('app/category/[id]/page.jsx', 'utf8');

// Replace top section
content = content.replace(
`import React, { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, SlidersHorizontal, Tag } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

function CategoryPageContent({ params }) {
  const categoryId = params.id;
  const { categories, products, loading } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSubcategoryId = searchParams.get('branch');
  // using query parameter to set sort later if needed, but keeping it local for now is fine
  const sortBy = 'default';`,
`import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, SlidersHorizontal, Tag } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

export default function CategoryPage({ params }) {
  const categoryId = params.id;
  const { categories, products, loading } = useCart();
  const router = useRouter();
  
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setActiveSubcategoryId(params.get('branch'));
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveSubcategoryId(params.get('branch'));
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBranchClick = (id) => {
    setActiveSubcategoryId(id);
    if (typeof window !== 'undefined') {
      const newUrl = id ? window.location.pathname + '?branch=' + id : window.location.pathname;
      window.history.pushState(null, '', newUrl);
    }
  };`
);

const bottomTextToReplace = `export default function CategoryPage({ params }) {
  return (
    <Suspense fallback={<div className="page-wrapper"><div className="glass loading-card">جاري التحميل...</div></div>}>
      <CategoryPageContent params={params} />
    </Suspense>
  );
}`;
content = content.replace(bottomTextToReplace, '');

fs.writeFileSync('app/category/[id]/page.jsx', content, 'utf8');
console.log('Script executed');
