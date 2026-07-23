'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Banknote, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';
import '../cart.css';
import Link from 'next/link';

export default function CartCheckout() {
  const router = useRouter();
  const { settings } = useSettings();
  
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('05');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState('Delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (!val.startsWith('05')) {
      if (val.startsWith('0')) val = '05' + val.slice(1);
      else val = '05' + val;
    }
    if (val.length > 10) val = val.slice(0, 10);
    setCustomerPhone(val);
  };

  const baseDeliveryFee = settings?.delivery_fee !== undefined ? Number(settings.delivery_fee) : 15.00;
  const freeDeliveryThreshold = settings?.free_delivery_threshold !== undefined ? Number(settings.free_delivery_threshold) : 500;

  const safeSubtotal = typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal : 0;
  
  let deliveryFee = 0;
  let isFreeDelivery = false;

  if (deliveryType === 'Delivery' && safeSubtotal > 0) {
    if (safeSubtotal >= freeDeliveryThreshold) {
      deliveryFee = 0;
      isFreeDelivery = true;
    } else {
      deliveryFee = baseDeliveryFee;
    }
  }

  const finalTotal = safeSubtotal + deliveryFee;

  const formatPrice = (val) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handleDropPin = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsLocation(`${lat}, ${lng}`);
          
          const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
          setManualAddress(prev => {
            if (prev && prev.trim() !== '') {
              // If user already typed something, append the link
              return `${prev}\n\nرابط الموقع: ${mapsLink}`;
            }
            // Otherwise just set the link
            return `رابط الموقع: ${mapsLink}`;
          });
          
          showToast('تم التقاط الموقع بنجاح! 📍', 'success');
        },
        (error) => {
          showToast('تم رفض صلاحية الموقع. يرجى كتابة العنوان يدوياً.', 'error');
        },
        { timeout: 10000, maximumAge: 60000 }
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
    if (deliveryType === 'Delivery' && !gpsLocation && (!manualAddress || !manualAddress.trim())) {
      showToast('يرجى كتابة عنوان التوصيل أو الضغط على زر تحديد موقعي.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const finalLocation = gpsLocation && manualAddress 
        ? `${manualAddress} (GPS: ${gpsLocation})` 
        : (gpsLocation || manualAddress || 'Pickup');

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
          .insert({ name: customerName, phone: customerPhone, location_gps: finalLocation, role: 'Customer' })
          .select()
          .single();
          
        if (userErr) throw userErr;
        userId = newUser.id;
      }
      
      // 2. Create Order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ user_id: userId, total_price: finalTotal, status: 'Pending', delivery_type: deliveryType })
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

      showToast('تم إرسال طلبك بنجاح! جاري تحويلك...', 'success');
      setIsRedirecting(true);
      router.push(`/track/?id=${order.id}`);
      
      // Clear cart only after a delay to prevent UI glitching during router transition
      setTimeout(() => {
        clearCart();
      }, 2000);
      
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('حدث خطأ أثناء إرسال الطلب: ' + error.message, 'error');
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

      <div className="cart-content" style={{ opacity: isRedirecting ? 0.5 : 1, pointerEvents: isRedirecting ? 'none' : 'auto', transition: 'all 0.3s ease' }}>
        <section className="cart-items-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2>سلة مشترياتك</h2>
          {cartItems.length === 0 ? (
            <div className="empty-cart glass">
              <p>{settings?.cart_empty_text || 'سلتك فارغة حالياً.'}</p>
              <Link href="/" className="continue-shopping">تصفح المنتجات</Link>
            </div>
          ) : (
            <div className="items-list">
              {cartItems.map(item => {
                const unitName = item.weight || item.unit_type || '';

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
                  dir="ltr"
                  placeholder="05XXXXXXXX" 
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  className="custom-input"
                  style={{ 
                    textAlign: 'left', 
                    letterSpacing: '2px', 
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderColor: customerPhone.length === 10 ? '#4caf50' : customerPhone.length > 2 ? '#ff9800' : 'rgba(255,255,255,0.1)',
                    borderWidth: customerPhone.length > 2 ? '2px' : '1px',
                    boxShadow: customerPhone.length === 10 ? '0 0 10px rgba(76, 175, 80, 0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  required
                />
              </div>
              <div className="input-group" style={{ display: deliveryType === 'Delivery' ? 'block' : 'none' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <span>عنوان التوصيل <span style={{ color: '#ff4d4f' }}>*</span></span>
                  <button 
                    type="button"
                    className={`pin-btn-small ${gpsLocation && gpsLocation !== 'Pickup' ? 'success' : ''}`} 
                    onClick={handleDropPin}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: gpsLocation && gpsLocation !== 'Pickup' ? 'var(--success-color)' : 'var(--accent-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    <MapPin size={16} />
                    {gpsLocation && gpsLocation !== 'Pickup' ? 'تم حفظ الـ GPS' : 'التقاط موقعي (GPS)'}
                  </button>
                </label>
                <textarea 
                  placeholder="اسم الحي، الشارع، أو وصف للمنزل..." 
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  className="custom-input"
                  rows="2"
                  style={{ resize: 'none' }}
                  required={deliveryType === 'Delivery' && !gpsLocation}
                />
                {!gpsLocation && (
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>
                    يمكنك كتابة العنوان يدوياً أو استخدام زر الالتقاط أعلاه.
                  </small>
                )}
              </div>

              <div className="input-group" style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  طريقة الاستلام
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setDeliveryType('Delivery');
                      if (gpsLocation === 'Pickup') setGpsLocation(null);
                    }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 'var(--border-radius-md)',
                      background: deliveryType === 'Delivery' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                      color: deliveryType === 'Delivery' ? '#000' : 'var(--text-primary)',
                      border: deliveryType === 'Delivery' ? 'none' : '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold',
                      transition: 'all 0.3s', cursor: 'pointer'
                    }}
                  >
                    توصيل 🛵
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setDeliveryType('Pickup'); setGpsLocation('Pickup'); }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 'var(--border-radius-md)',
                      background: deliveryType === 'Pickup' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                      color: deliveryType === 'Pickup' ? '#000' : 'var(--text-primary)',
                      border: deliveryType === 'Pickup' ? 'none' : '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold',
                      transition: 'all 0.3s', cursor: 'pointer'
                    }}
                  >
                    استلام من المحل 🏪
                  </button>
                </div>
              </div>
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
                {deliveryType === 'Pickup' ? (
                  <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>مجاني (استلام)</span>
                ) : isFreeDelivery ? (
                  <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>مجاني</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span>{formatPrice(deliveryFee)} ريال</span>
                    {freeDeliveryThreshold > 0 && safeSubtotal < freeDeliveryThreshold && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        أضف بقيمة {formatPrice(freeDeliveryThreshold - safeSubtotal)} ريال للحصول على توصيل مجاني!
                      </span>
                    )}
                  </div>
                )}
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
            <span>{isSubmitting ? 'جاري إرسال الطلب...' : (settings?.cart_checkout_btn || 'إتمام الطلب')}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
