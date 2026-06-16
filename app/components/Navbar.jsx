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
        <div style={{ width: '160px' }}></div>

        {/* Logo (Center) */}
        <Link href="/" className="logo" style={{justifyContent: 'center', flex: 1, textAlign: 'center'}}>
          <Truck className="logo-icon" size={28} />
          <span style={{ color: 'var(--primary-color)' }}>{settings?.store_name || 'كات درايفر'}</span>
        </Link>

        {/* Auth Links (Left - Replaces Cart) */}
        <div style={{ display: 'flex', gap: '8px', width: '160px', justifyContent: 'flex-end' }}>
          <Link 
            href="/login/admin" 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '6px 12px', borderRadius: '20px', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.3s' }}
          >
            الإدارة
          </Link>
          <Link 
            href="/login/worker" 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem', transition: 'all 0.3s' }}
          >
            العمال
          </Link>
        </div>
      </div>
    </nav>
  );
}
