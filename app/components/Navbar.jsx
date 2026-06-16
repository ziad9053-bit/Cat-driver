'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';

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
        {/* Spacer for layout balance */}
        <div style={{ width: '60px' }}></div>

        {/* Logo (Center) */}
        <Link href="/" className="logo" style={{justifyContent: 'center', flex: 1, textAlign: 'center'}}>
          <Truck className="logo-icon" size={28} />
          <span style={{ color: 'var(--primary-color)' }}>{settings?.store_name || 'كات درايفر'}</span>
        </Link>

        {/* Cart */}
        <div className="nav-links" style={{ width: '60px', justifyContent: 'flex-end' }}>
          <Link href="/cart" className="cart-link">
            <ShoppingCart size={24} />
            {cartItemsCount > 0 && (
              <span className="cart-badge animate-fade-in">{cartItemsCount}</span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
