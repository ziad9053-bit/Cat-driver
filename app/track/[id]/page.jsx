'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { CheckCircle, Clock, Package, Truck, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import './track.css';

export default function OrderTracking({ params }) {
  const { id } = params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
        
      if (data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();

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

  if (loading) {
    return <div className="page-wrapper"><div className="glass" style={{padding: '40px', textAlign: 'center'}}>جاري جلب تفاصيل الطلب...</div></div>;
  }

  if (!order) {
    return <div className="page-wrapper"><div className="glass" style={{padding: '40px', textAlign: 'center'}}>الطلب غير موجود</div></div>;
  }

  // Determine current step
  // Steps: 1. Pending -> 2. Processing -> 3. Processing & is_packed -> 4. OnTheWay -> 5. Delivered
  let currentStep = 1;
  if (order.status === 'Delivered') currentStep = 5;
  else if (order.status === 'OnTheWay') currentStep = 4;
  else if (order.is_packed) currentStep = 3;
  else if (order.status === 'Processing') currentStep = 2;

  const steps = [
    { num: 1, title: 'تم استلام الطلب', icon: <Clock size={24} /> },
    { num: 2, title: 'جاري التحضير', icon: <Package size={24} /> },
    { num: 3, title: 'جاهز للسائق', icon: <CheckCircle size={24} /> },
    { num: 4, title: 'في الطريق', icon: <Truck size={24} /> },
    { num: 5, title: 'تم التوصيل', icon: <Home size={24} /> }
  ];

  return (
    <div className="page-wrapper animate-fade-in track-page">
      <header className="page-header" style={{textAlign: 'center', marginBottom: '30px'}}>
        <Link href="/" className="back-link" style={{position: 'absolute', right: '20px', top: '20px'}}>
          <ArrowRight size={20} /> للرئيسية
        </Link>
        <h1 style={{ color: 'var(--primary-color)' }}>تتبع طلبك</h1>
        <p style={{ color: 'var(--text-secondary)' }}>رقم الطلب: {order.id.split('-')[0].toUpperCase()}</p>
      </header>

      <div className="glass track-card">
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>حالة الطلب اللحظية</h2>
        
        <div className="stepper">
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
          {currentStep === 1 && <p>طلبك الآن في قائمة الانتظار، وسيبدأ عاملنا بجمعه قريباً! ⏱️</p>}
          {currentStep === 2 && <p>يتم الآن تجهيز خضرواتك وفواكهك الطازجة بعناية فائقة وتغليفها 📦</p>}
          {currentStep === 3 && <p>طلبك تم تجهيزه وهو الآن بانتظار السائق لاستلامه والتوجه إليك 🚀</p>}
          {currentStep === 4 && <p>السائق استلم طلبك وهو الآن في الطريق لمنزلك، ترقب وصوله! 🛵</p>}
          {currentStep === 5 && <p>تم تسليم الطلب بنجاح، بالعافية ونتمنى لك يوم سعيد! 🎉</p>}
        </div>
      </div>
    </div>
  );
}
