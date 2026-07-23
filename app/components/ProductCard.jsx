import Link from 'next/link';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Image from 'next/image';

export default function ProductCard({ product }) {
  const { cart, updateQuantity } = useCart();
  
  // Check if product is in cart
  const cartItem = cart.find(item => item.product_id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e) => {
    e.preventDefault(); // Prevent navigating to product page
    updateQuantity(product, quantity + 1);
  };

  const handleRemove = (e) => {
    e.preventDefault(); // Prevent navigating to product page
    if (quantity > 0) {
      updateQuantity(product, quantity - 1);
    }
  };

  return (
    <Link href={`/product/${product.id}`} className="product-card glass">
      <div className="product-image-container">
        {/* Placeholder for product image if we have one, else a gradient box */}
        <div className="product-img-placeholder">
          {product.name.charAt(0)}
        </div>
        {product.is_offer && (
          <span className="offer-badge" style={{ backgroundColor: product.offer_color || 'var(--error-color)' }}>
            {product.offer_label}
          </span>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price-row">
          <span className="price-value">${Number(product.current_price).toFixed(2)}</span>
          <span className="price-unit">/ {product.weight || 'حبة'}</span>
        </div>
        
        {/* Add to Cart Actions */}
        <div className="card-actions" onClick={(e) => e.preventDefault()}>
          {quantity > 0 ? (
            <div className="quantity-controls">
              <button className="qty-btn" onClick={handleAdd}><Plus size={16} /></button>
              <span className="qty-val">{quantity}</span>
              <button className="qty-btn" onClick={handleRemove}><Minus size={16} /></button>
            </div>
          ) : (
            <button className="add-btn" onClick={handleAdd}>
              <ShoppingCart size={18} />
              <span>إضافة</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
