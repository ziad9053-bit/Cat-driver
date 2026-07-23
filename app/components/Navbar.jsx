'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import SearchBar from './SearchBar';

export default function Navbar() {
  const { cartItemsCount } = useCart();
  const { settings } = useSettings();
  const pathname = usePathname();

  // Hide navbar on internal pages and login portals
  const hiddenPaths = ['/admin', '/preparer', '/driver', '/login'];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav className="navbar glass">
      <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Manager (Right Side - flex-start in RTL) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <Link 
            href="/login/admin" 
            style={{ display: 'flex', alignItems: 'center', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '4px 10px', borderRadius: '15px', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.3s', whiteSpace: 'nowrap' }}
          >
            الإدارة
          </Link>
        </div>

        {/* Logo (Center) */}
        <Link href="/" className="logo" style={{justifyContent: 'center', flex: '0 1 auto', textAlign: 'center', whiteSpace: 'nowrap', padding: '0 5px'}}>
          <Truck className="logo-icon" size={24} />
          <span style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>{settings?.store_name || 'كات درايفر'}</span>
        </Link>

        {/* Search Bar */}
        <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </div>

        {/* Cart Icon / Worker Link (Left Side - flex-end in RTL) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Link 
            href="/cart" 
            style={{ display: 'flex', alignItems: 'center', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '6px 12px', borderRadius: '20px', color: 'var(--primary-color)', transition: 'all 0.3s' }}
          >
            <ShoppingCart size={20} />
            {cartItemsCount > 0 && <span style={{ marginRight: '5px', fontWeight: 'bold' }}>{cartItemsCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
