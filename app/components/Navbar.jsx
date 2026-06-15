'use client';

import Link from 'next/link';
import { ShoppingCart, Leaf } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { cartItemsCount } = useCart();

  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link href="/" className="logo">
          <Leaf className="logo-icon" />
          <span>Freshly</span>
        </Link>
        <div className="nav-links">
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
