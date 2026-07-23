'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, Package, Truck, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { QRCodeSVG } from 'qrcode.react';
import './track.css';

function OrderTrackingContent() {
  const { unitTranslations } = useCart();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [qrContent, setQrContent] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname; // e.g. "/Cat-driver/track"
      const newPathname = pathname.replace(/\/track\/?$/, '/invoice');
      setQrContent(`${origin}${newPathname}?id=${id}`);
    }
  }, [id]);

  useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchOrderData = async () => {
      // 1. Fetch Order details
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
        
      if (orderData) {
        setOrder(orderData);

        // 2. Fetch Order Items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*, products(name, image_url, weight, unit_type)')
          .eq('order_id', id);
          
        if (itemsData) setItems(itemsData);

        // 3. Fetch Invoice details
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .eq('order_id', id)
          .maybeSingle();
          
        if (invoiceData) setInvoice(invoiceData);
      }
      setLoading(false);
    };

    fetchOrderData();

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
        setOrder(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (!mounted || loading) {
    return (
      <div className="page-wrapper animate-fade-in">
        <div className="glass animate-pulse" style={{ padding: '40px', borderRadius: 'var(--border-radius-lg)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>جاري جلب تفاصيل الطلب... 🚚</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="page-wrapper"><div className="glass" style={{padding: '40px', textAlign: 'center'}}>الطلب غير موجود</div></div>;
  }

  // Determine current step
  // Steps: 1. Pending -> 2. Processing -> 3. Processing & is_packed -> 4. OnTheWay -> 5. Delivered
  const isPickup = order.delivery_type === 'Pickup';

  let currentStep = 1;
  if (isPickup) {
    if (order.status === 'Completed' || order.status === 'Delivered') currentStep = 3;
    else if (order.is_packed) currentStep = 3;
    else if (order.status === 'Processing') currentStep = 2;
  } else {
    if (order.status === 'Delivered') currentStep = 5;
    else if (order.status === 'OnTheWay') currentStep = 4;
    else if (order.is_packed) currentStep = 3;
    else if (order.status === 'Processing') currentStep = 2;
  }

  const steps = isPickup ? [
    { num: 1, title: 'تم استلام الطلب', icon: <Clock size={24} /> },
    { num: 2, title: 'جاري التحضير', icon: <Package size={24} /> },
    { num: 3, title: 'جاهز للاستلام', icon: <CheckCircle size={24} /> }
  ] : [
    { num: 1, title: 'تم استلام الطلب', icon: <Clock size={24} /> },
    { num: 2, title: 'جاري التحضير', icon: <Package size={24} /> },
    { num: 3, title: 'جاهز للسائق', icon: <CheckCircle size={24} /> },
    { num: 4, title: 'في الطريق', icon: <Truck size={24} /> },
    { num: 5, title: 'تم التوصيل', icon: <Home size={24} /> }
  ];

  // The order is considered "ready/packed" when the preparer finishes.
  const isCompleted = order.is_packed === true || order.status === 'Delivered' || order.status === 'Completed';
  
  // Use darker shades for QR code to ensure good contrast and readability on white background.
  const qrColor = isCompleted ? '#2E7D32' : '#B8860B'; // Dark Green if completed, Dark Gold otherwise


  return (
    <div className="page-wrapper animate-fade-in track-page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header className="page-header glass" style={{textAlign: 'center', marginBottom: '30px', position: 'relative', padding: '20px', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
        <Link href="/" className="back-link" style={{position: 'absolute', right: '15px', top: '15px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: 'var(--primary-color)' }}>
          <ArrowRight size={20} /> للرئيسية
        </Link>
        <h1 style={{ color: 'var(--primary-color)', margin: '10px 0 0 0', fontSize: '1.5rem' }}>{settings?.track_title || 'فاتورة وتتبع الطلب'}</h1>
        
        {/* SVG Definition for Metallic Gold Gradient */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#AA7C11" />
              <stop offset="25%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#FDF0A6" />
              <stop offset="75%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#AA7C11" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{ 
          background: 'white', /* The white gap */
          padding: '4px', 
          borderRadius: '20px', 
          display: 'inline-block', 
          boxShadow: `0 8px 30px ${isCompleted ? 'rgba(46,125,50,0.4)' : 'rgba(212, 175, 55, 0.4)'}`,
          transition: 'all 0.5s ease' 
        }}>
          <div style={{ 
            background: '#0a0a0a', /* The black frame */
            padding: '16px', 
            borderRadius: '16px' 
          }}>
            {qrContent ? (
              <QRCodeSVG 
                value={qrContent} 
                size={180} 
                bgColor={"transparent"}
                fgColor={isCompleted ? '#2E7D32' : 'url(#gold-gradient)'}
                level={"H"}
              />
            ) : (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#555' }}>Loading QR...</span>
              </div>
            )}
          </div>
        </div>
        <p style={{ color: isCompleted ? 'var(--success-color)' : 'var(--primary-color)', margin: '0', fontWeight: 'bold', fontSize: '1.1rem', transition: 'color 0.5s ease' }}>
          {isCompleted ? 'الطلب جاهز ومكتمل التحضير ✅' : 'امسح الكود لعرض الفاتورة'}
        </p>

        {isPickup && (
          <span style={{ display: 'inline-block', backgroundColor: '#ff9800', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            استلام من المحل 🏪
          </span>
        )}
      </header>

      <div className="glass track-card">
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>حالة الطلب اللحظية</h2>
        
        <div className={`stepper ${isPickup ? 'pickup-stepper' : ''}`}>
          {steps.map((step, idx) => (
            <div key={step.num} className={`step ${currentStep >= step.num ? 'completed' : ''} ${currentStep === step.num ? 'active' : ''}`}>
              <div className="step-icon">
                {step.icon}
              </div>
              <p>{step.title}</p>
              {idx < steps.length - 1 && <div className={`step-line ${currentStep > step.num ? 'completed' : ''}`}></div>}
            </div>
          ))}
        </div>

        <div className="status-message">
          {currentStep === 1 && <p>{settings?.track_queue || 'طلبك الآن في قائمة الانتظار، وسيبدأ عاملنا بجمعه قريباً! ⏱️'}</p>}
          {currentStep === 2 && <p>{settings?.track_preparing || 'يتم الآن تجهيز خضرواتك وفواكهك الطازجة بعناية فائقة وتغليفها 📦'}</p>}
          {isPickup && currentStep === 3 && <p>الطلب بانتظارك في المحل! تفضل بزيارتنا لاستلامه 🏪✨</p>}
          {!isPickup && currentStep === 3 && <p>{settings?.track_ready || 'طلبك تم تجهيزه وهو الآن بانتظار السائق لاستلامه والتوجه إليك 🚀'}</p>}
          {!isPickup && currentStep === 4 && <p>{settings?.track_on_way || 'السائق استلم طلبك وهو الآن في الطريق لمنزلك، ترقب وصوله! 🛵'}</p>}
          {!isPickup && currentStep === 5 && <p>{settings?.track_delivered || 'تم تسليم الطلب بنجاح، بالعافية ونتمنى لك يوم سعيد! 🎉'}</p>}
        </div>
      </div>

      {/* Product Items Details Card */}
      <div className="glass track-card" style={{ marginTop: '24px', padding: '24px' }}>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)', fontSize: '1.4rem' }}>تفاصيل المشتريات ({items.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(item => {
            const unitName = item.products?.weight || item.products?.unit_type || 'حبة';
            
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} /></div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: '600' }}>{item.products?.name || 'منتج طازج'}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {Number(item.price_at_purchase).toFixed(2)} ريال / {unitName}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الكمية: {Number(item.quantity)}</span>
                  <span style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '1rem', marginTop: '2px' }}>
                    {Number(item.price_at_purchase * item.quantity).toFixed(2)} ريال
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoice Summary */}
        <div style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            <span>رسوم التوصيل</span>
            <span>
              {(() => {
                const deliveryFee = invoice?.delivery_fee ? Number(invoice.delivery_fee) : 0;
                const subtotal = items.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0);
                const finalDeliveryFee = invoice ? deliveryFee : (Number(order.total_price) - subtotal);
                return finalDeliveryFee > 0 ? `${finalDeliveryFee.toFixed(2)} ريال` : 'مجاني';
              })()}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '8px' }}>
            <span>الإجمالي الكلي</span>
            <span>{Number(order.total_price).toFixed(2)} ريال</span>
          </div>
          
          {invoice && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              <span>طريقة الدفع</span>
              <span>{invoice.payment_method === 'Cash' ? 'الدفع عند الاستلام' : 'بطاقة بنكية / أبل باي'}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a 
          href={settings?.whatsapp_link || 'https://wa.me/966500000000'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: 'var(--border-radius-full)', background: '#25D366', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}
        >
          📞 تواصل مع الدعم الفني
        </a>
      </div>
    </div>
  );
}

export default function OrderTracking() {
  return (
    <Suspense fallback={<div className="page-wrapper"><div className="glass" style={{padding: '40px', textAlign: 'center'}}>جاري تحميل الصفحة...</div></div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
