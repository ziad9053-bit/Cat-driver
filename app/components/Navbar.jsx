'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ShieldCheck, Truck, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { cartItemsCount } = useCart();
  const pathname = usePathname();

  // Hide navbar on internal pages and login portals
  const hiddenPaths = ['/admin', '/preparer', '/driver', '/login'];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        {/* Admin Login (Top Left) */}
        <Link href="/login/admin" className="auth-link admin-link">
          <ShieldCheck size={20} />
          <span className="hide-mobile">دخول الإدارة</span>
        </Link>

        {/* Logo (Center) */}
        <Link href="/" className="logo" style={{justifyContent: 'center', flex: 1, textAlign: 'center'}}>
          <Truck className="logo-icon" size={28} />
          <span style={{ color: 'var(--primary-color)' }}>كات درايفر</span>
        </Link>

        {/* Worker Login & Cart (Top Right in RTL = Left visually) */}
        <div className="nav-links">
          <Link href="/login/worker" className="auth-link worker-link">
            <User size={20} />
            <span className="hide-mobile">دخول العمال</span>
          </Link>
          
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
