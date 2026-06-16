'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Banknote, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import '../cart.css';
import Link from 'next/link';

export default function CartCheckout() {
  const router = useRouter();
  
  const cartContext = useCart();
  const { 
    cartItems = [], 
    updateQuantity = () => {}, 
    removeItem = () => {}, 
    clearCart = () => {}, 
    subtotal = 0, 
    loading = false,
    unitTranslations = {}
  } = cartContext || {};

  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeSubtotal = typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal : 0;
  const deliveryFee = safeSubtotal > 0 ? 15.00 : 0;
  const finalTotal = safeSubtotal + deliveryFee;

  const formatPrice = (val) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handleDropPin = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          showToast('تم التقاط الموقع بنجاح! 📍', 'success');
        },
        (error) => {
          showToast('تعذر التقاط الموقع. يرجى التأكد من صلاحيات الموقع.', 'error');
        }
      );
    } else {
      showToast('المتصفح لا يدعم تحديد الموقع.', 'error');
    }
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      showToast('سلتك فارغة!', 'error');
      return;
    }
    if (!customerName || !customerName.trim()) {
      showToast('يرجى إدخال الاسم الكامل.', 'error');
      return;
    }
    if (!customerPhone || !customerPhone.trim()) {
      showToast('يرجى إدخال رقم الجوال.', 'error');
      return;
    }
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(customerPhone.trim())) {
      showToast('يرجى إدخال رقم جوال صحيح يبدأ بـ 05 ومكون من 10 أرقام.', 'error');
      return;
    }
    if (!gpsLocation) {
      showToast('يرجى تحديد موقعك على الخريطة أولاً (اضغط على زر تحديد موقعي).', 'error');
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

      showToast('تم إرسال طلبك بنجاح! سيتم تحويلك لصفحة التتبع.', 'success');
      clearCart();
      router.push(`/track?id=${order.id}`);
      
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('حدث خطأ أثناء إرسال الطلب: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="cart-page">
        <div className="cart-header glass animate-pulse" style={{ height: '80px', borderRadius: 'var(--border-radius-md)' }}></div>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {[1, 2].map(i => (
            <div key={i} className="glass animate-pulse" style={{ height: '120px', borderRadius: 'var(--border-radius-md)' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page animate-fade-in">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}
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
                const unitName = (unitTranslations && unitTranslations[item.unit_type]) || item.unit_type;

                return (
                <div key={item.product_id} className="cart-item glass">
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <div className="item-price-row">
                      <span className="price">{formatPrice(item.price)} ريال / {unitName}</span>
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
                      {formatPrice(item.price * item.quantity)} ريال
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
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  الاسم الكامل <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="الاسم الكامل" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="custom-input"
                  required
                />
              </div>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  رقم الجوال <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <input 
                  type="tel" 
                  placeholder="رقم الجوال" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="custom-input"
                  required
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
                <span>{formatPrice(safeSubtotal)} ريال</span>
              </div>
              <div className="summary-row">
                <span>رسوم التوصيل</span>
                <span>{formatPrice(deliveryFee)} ريال</span>
              </div>
              <div className="summary-row total">
                <span>الإجمالي الكلي</span>
                <span>{formatPrice(finalTotal)} ريال</span>
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
