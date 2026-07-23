'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '25px', padding: '5px 15px', flex: 1, maxWidth: '400px', margin: '0 10px' }}>
      <input 
        type="text" 
        placeholder="ابحث عن منتج..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem' }}
      />
      <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
        <Search size={18} />
      </button>
    </form>
  );
}
