'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, CreditCard, Banknote, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import './cart.css';

export default function CartCheckout() {
  const [items, setItems] = useState([
    // Mock initial data, in a real app this would come from a global state/context
    { id: '1', product_id: 'p1', name: 'Fresh Tomatoes', unit_type: 'Kilo', price: 5.50, quantity: 2, is_offer: false },
    { id: '2', product_id: 'p2', name: 'Premium Bananas', unit_type: 'Box', price: 45.00, quantity: 1, is_offer: true, offer_label: '20% OFF', offer_color: '#EF4444' },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);

  // Real-time Price Sync (Mockup logic simulating the requirement)
  useEffect(() => {
    // We listen to changes on the Products table to update prices instantly
    const channel = supabase
      .channel('realtime_prices')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Products' }, (payload) => {
        setItems(currentItems => 
          currentItems.map(item => {
            if (item.product_id === payload.new.id) {
              return { ...item, price: payload.new.current_price };
            }
            return item;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateQuantity = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDropPin = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          alert('Location captured successfully! 📍');
        },
        (error) => {
          alert('Unable to retrieve your location. Please check permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const submitOrder = async () => {
    if (!customerName || !customerPhone || !gpsLocation) {
      alert('Please fill all details and drop a pin for your location.');
      return;
    }
    
    // Create user (or find existing by phone), create order, create order items...
    // In a full implementation, we'd call Supabase RPC or insert sequentially
    alert('Order Submitted Successfully! Thank you.');
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 15.00;
  const finalTotal = subtotal + deliveryFee;

  return (
    <div className="cart-page animate-fade-in">
      <header className="cart-header glass">
        <h1>Your Cart 🛒</h1>
      </header>

      <div className="cart-content">
        <section className="cart-items-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2>Items</h2>
          {items.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            <div className="items-list">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <div className="item-price-row">
                      <span className="price">${item.price.toFixed(2)} / {item.unit_type}</span>
                      {item.is_offer && (
                        <span className="offer-badge" style={{ backgroundColor: item.offer_color || 'var(--accent-color)' }}>
                          {item.offer_label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn"><Minus size={16} /></button>
                      <span className="qty-value">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn"><Plus size={16} /></button>
                    </div>
                    <div className="item-subtotal">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button onClick={() => removeItem(item.id)} className="delete-btn">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="customer-section animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2>Delivery Details</h2>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="custom-input"
            />
          </div>
          <div className="input-group">
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="custom-input"
            />
          </div>
          <button className={`pin-btn ${gpsLocation ? 'success' : ''}`} onClick={handleDropPin}>
            <MapPin size={20} />
            {gpsLocation ? 'Location Captured ✓' : 'Drop a Pin 📍'}
          </button>
        </section>

        <section className="payment-section animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2>Payment Method</h2>
          <div className="payment-options">
            <label className={`payment-card ${paymentMethod === 'Cash' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="Cash" 
                checked={paymentMethod === 'Cash'}
                onChange={() => setPaymentMethod('Cash')}
                hidden
              />
              <Banknote size={24} />
              <span>Cash on Delivery</span>
            </label>
            <label className={`payment-card ${paymentMethod === 'Card' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="Card" 
                checked={paymentMethod === 'Card'}
                onChange={() => setPaymentMethod('Card')}
                hidden
              />
              <CreditCard size={24} />
              <span>Card Payment</span>
            </label>
          </div>
        </section>

        <section className="summary-section animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Final Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </section>
      </div>

      <div className="sticky-footer glass animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <button className="submit-btn" onClick={submitOrder}>
          <span>Submit Order</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
