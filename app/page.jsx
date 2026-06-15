'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, CreditCard, Banknote, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import './cart.css';

export default function CartCheckout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);

  useEffect(() => {
    // Fetch actual products from Supabase
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) {
        setItems(data.map(p => ({
          ...p,
          product_id: p.id,
          price: p.current_price,
          quantity: 0 // 0 quantity until user adds to cart
        })));
      }
      setLoading(false);
    };
    
    fetchProducts();

    // We listen to changes on the products table to update prices instantly
    const channel = supabase
      .channel('realtime_prices')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setItems(currentItems => 
          currentItems.map(item => {
            if (item.product_id === payload.new.id) {
              return { 
                ...item, 
                price: payload.new.current_price,
                is_offer: payload.new.is_offer,
                offer_label: payload.new.offer_label,
                offer_color: payload.new.offer_color
              };
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
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity: 0 } : item));
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
    
    try {
      // 1. Check if user exists by phone
      let { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('phone', customerPhone)
        .limit(1);
        
      let userId = existingUsers?.[0]?.id;
      
      if (!userId) {
        // Create new user
        const { data: newUser, error: userErr } = await supabase
          .from('users')
          .insert({ name: customerName, phone: customerPhone, location_gps: gpsLocation, role: 'Customer' })
          .select()
          .single();
          
        if (userErr) throw userErr;
        userId = newUser.id;
      }
      
      // 2. Create Order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ user_id: userId, total_price: finalTotal, status: 'Pending' })
        .select()
        .single();
        
      if (orderErr) throw orderErr;
      
      // 3. Create Order Items (only for items with quantity > 0)
      const cartItems = items.filter(item => item.quantity > 0);
      
      if (cartItems.length === 0) {
        alert('Your cart is empty.');
        return;
      }
      
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }));
      
      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsErr) throw itemsErr;
      
      // 4. Create Invoice
      const { error: invoiceErr } = await supabase
        .from('invoices')
        .insert({
          order_id: order.id,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'Card' ? 'Paid' : 'Pending',
          delivery_fee: deliveryFee
        });
        
      if (invoiceErr) throw invoiceErr;

      alert('Order Submitted Successfully! Thank you.');
      // Reset cart quantities
      setItems(items.map(item => ({ ...item, quantity: 0 }))); 
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error submitting order: ' + error.message);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 15.00 : 0;
  const finalTotal = subtotal + deliveryFee;
  const cartItemsCount = items.filter(i => i.quantity > 0).length;

  if (loading) {
    return <div className="cart-page"><div className="cart-header glass"><h1>Loading Store...</h1></div></div>;
  }

  return (
    <div className="cart-page animate-fade-in">
      <header className="cart-header glass">
        <h1>Your Cart 🛒</h1>
      </header>

      <div className="cart-content">
        <section className="cart-items-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2>Products Catalog</h2>
          {items.length === 0 ? (
            <p className="empty-cart">No products available at the moment.</p>
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
                    {item.quantity > 0 && (
                      <button onClick={() => removeItem(item.id)} className="delete-btn" title="Remove from cart">
                        <Trash2 size={20} />
                      </button>
                    )}
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
