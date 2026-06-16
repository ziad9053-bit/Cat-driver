'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Banknote, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import '../cart.css';
import Link from 'next/link';

export default function CartCheckout() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeItem, clearCart, subtotal, loading } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = subtotal > 0 ? 15.00 : 0;
  const finalTotal = subtotal + deliveryFee;

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
    if (cartItems.length === 0) {
      alert('سلتك فارغة!');
      return;
    }
    if (!customerName || !customerPhone || !gpsLocation) {
      alert('يرجى تعبئة جميع البيانات وتحديد موقعك على الخريطة.');
      return;
    }
    
    setIsSubmitting(true);
    
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
      
      // 3. Create Order Items
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

      alert('تم إرسال طلبك بنجاح! سيتم تحويلك لصفحة التتبع.');
      clearCart();
      router.push(`/track/${order.id}`);
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-header glass">
          <h1>Loading Cart...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page animate-fade-in">
      <header className="page-header">
        <Link href="/" className="back-link">
          <ArrowRight size={20} />
          <span>العودة للمتجر</span>
        </Link>
        <h1>إتمام الطلب</h1>
      </header>

      <div className="cart-content">
        <section className="cart-items-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2>سلة مشترياتك</h2>
          {cartItems.length === 0 ? (
            <div className="empty-cart glass">
              <p>سلتك فارغة حالياً.</p>
              <Link href="/" className="continue-shopping">تصفح المنتجات</Link>
            </div>
          ) : (
            <div className="items-list">
              {cartItems.map(item => {
                const unitTranslations = {
                  'Kilo': 'كيلو',
                  'SmallBox': 'فلين صغير',
                  'MediumBox': 'فلين وسط',
                  'LargeBox': 'فلين كبير',
                  'Box': 'صندوق'
                };
                const unitName = unitTranslations[item.unit_type] || item.unit_type;

                return (
                <div key={item.product_id} className="cart-item glass">
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <div className="item-price-row">
                      <span className="price">{Number(item.price).toFixed(2)} ريال / {unitName}</span>
                      {item.is_offer && (
                        <span className="offer-badge" style={{ backgroundColor: item.offer_color || 'var(--accent-color)' }}>
                          {item.offer_label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.product_id, -1)} className="qty-btn"><Minus size={16} /></button>
                      <span className="qty-value">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)} className="qty-btn"><Plus size={16} /></button>
                    </div>
                    <div className="item-subtotal">
                      {Number(item.price * item.quantity).toFixed(2)} ريال
                    </div>
                    <button onClick={() => removeItem(item.product_id)} className="delete-btn" title="حذف من السلة">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </section>

        {cartItems.length > 0 && (
          <>
            <section className="customer-section glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2>تفاصيل التوصيل</h2>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="الاسم الكامل" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="custom-input"
                />
              </div>
              <div className="input-group">
                <input 
                  type="tel" 
                  placeholder="رقم الجوال" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="custom-input"
                />
              </div>
              <button className={`pin-btn ${gpsLocation ? 'success' : ''}`} onClick={handleDropPin}>
                <MapPin size={20} />
                {gpsLocation ? 'تم التقاط الموقع بنجاح ✓' : 'تحديد موقعي 📍'}
              </button>
            </section>

            <section className="payment-section glass animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h2>طريقة الدفع</h2>
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
                  <span>الدفع عند الاستلام</span>
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
                  <span>بطاقة بنكية / أبل باي</span>
                </label>
              </div>
            </section>

            <section className="summary-section glass animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="summary-row">
                <span>المجموع الفرعي</span>
                <span>{subtotal.toFixed(2)} ريال</span>
              </div>
              <div className="summary-row">
                <span>رسوم التوصيل</span>
                <span>{deliveryFee.toFixed(2)} ريال</span>
              </div>
              <div className="summary-row total">
                <span>الإجمالي الكلي</span>
                <span>{finalTotal.toFixed(2)} ريال</span>
              </div>
            </section>
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="sticky-footer glass animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <button className="submit-btn" onClick={submitOrder} disabled={isSubmitting}>
            <span>{isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال الطلب'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
