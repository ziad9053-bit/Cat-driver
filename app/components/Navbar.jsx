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
        {/* Right Spacer (Flexible) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          {/* Empty spacer to balance the left side if needed, or we can just leave it empty */}
        </div>

        {/* Logo (Center) */}
        <Link href="/" className="logo" style={{justifyContent: 'center', flex: '0 1 auto', textAlign: 'center', whiteSpace: 'nowrap', padding: '0 10px'}}>
          <Truck className="logo-icon" size={24} />
          <span style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{settings?.store_name || 'كات درايفر'}</span>
        </Link>

        {/* Auth Links (Left - Replaces Cart) */}
        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
          <Link 
            href="/login/admin" 
            style={{ display: 'flex', alignItems: 'center', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '4px 10px', borderRadius: '15px', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.3s', whiteSpace: 'nowrap' }}
          >
            الإدارة
          </Link>
          <Link 
            href="/login/worker" 
            style={{ display: 'flex', alignItems: 'center', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '4px 10px', borderRadius: '15px', color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.3s', whiteSpace: 'nowrap' }}
          >
            العمال
          </Link>
        </div>
      </div>
    </nav>
  );
}
