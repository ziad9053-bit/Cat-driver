'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Truck, Home, Phone, BellRing, Navigation } from 'lucide-react';
import './driver.css';

export default function DriverDashboard() {
  const [orders, setOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [driverId, setDriverId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initDriver = async () => {
      let activeDriverId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          activeDriverId = user.id;
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      }

      if (!activeDriverId) {
        // Fallback to a valid test driver UUID if no auth session
        activeDriverId = '22222222-2222-2222-2222-222222222222';
      }

      setDriverId(activeDriverId);

      // Self-heal: ensure the driver user exists in public.users to satisfy foreign key constraints
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', activeDriverId)
          .maybeSingle();

        if (!dbUser) {
          // Generate a unique phone number to prevent unique key violation (e.g. if '0500000002' is already taken)
          const uniquePhone = '05' + Math.floor(10000000 + Math.random() * 90000000);
          await supabase.from('users').insert({
            id: activeDriverId,
            name: 'سائق التوصيل التجريبي',
            phone: uniquePhone,
            role: 'Driver'
          });
        }
      } catch (dbErr) {
        console.error('Self-healing public user creation failed:', dbErr);
      }
    };

    initDriver();
  }, []);

  // Fetch orders and subscribe to realtime updates once driverId is active
  useEffect(() => {
    if (!driverId) return;

    fetchOrders(driverId);

    const channel = supabase
      .channel('driver-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.is_packed && payload.new.status === 'Processing') {
          playNotification();
        }
        fetchOrders(driverId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const fetchOrders = async (currentDriverId) => {
    // Fetch ready orders
    const { data: readyOrders, error: readyErr } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone, location_gps)')
      .eq('status', 'Processing')
      .eq('is_packed', true)
      .order('created_at', { ascending: false });
      
    if (readyErr) console.error('Error fetching ready orders:', readyErr);
      
    // Fetch my active deliveries
    const { data: activeDeliveries, error: activeErr } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone, location_gps)')
      .eq('status', 'OnTheWay')
      .eq('driver_id', currentDriverId)
      .order('created_at', { ascending: false });

    if (activeErr) console.error('Error fetching active deliveries:', activeErr);

    // Fetch my past deliveries (Delivered or Cancelled)
    const { data: pastData, error: pastErr } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone, location_gps)')
      .in('status', ['Delivered', 'Cancelled'])
      .eq('driver_id', currentDriverId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (pastErr) console.error('Error fetching past deliveries:', pastErr);

    if (readyOrders) setOrders(readyOrders);
    if (activeDeliveries) setMyDeliveries(activeDeliveries);
    if (pastData) setPastOrders(pastData);
  };

  const playNotification = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.value = 523.25; // C5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio notification failed', e);
    }
  };

  const handleAcceptDelivery = async (orderId) => {
    if (!driverId) {
      alert('يرجى الانتظار حتى تحميل بيانات السائق.');
      return;
    }
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'OnTheWay',
        driver_id: driverId
      })
      .eq('id', orderId);
      
    if (error) alert('Error: ' + error.message);
    else fetchOrders(driverId);
  };

  const handleCompleteDelivery = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Delivered' })
      .eq('id', orderId);
      
    if (error) alert('Error: ' + error.message);
    else {
      alert('عمل رائع! تم تسليم الطلب.');
      fetchOrders(driverId);
    }
  };

  const openGoogleMaps = (gpsCoords) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${gpsCoords}`, '_blank');
  };

  if (!mounted) {
    return (
      <div className="page-wrapper" style={{ opacity: 0 }}></div>
    );
  }

  return (
    <div className="page-wrapper driver-dashboard">
      <header className="page-header" style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1 style={{ color: 'var(--primary-color)' }}>شاشة السائق 🛵</h1>
        <p style={{ color: 'var(--text-secondary)' }}>الطلبات الجاهزة بانتظار التوصيل.</p>
      </header>

      <div className="driver-grid">
        {/* Active Deliveries Section */}
        <div className="deliveries-section my-deliveries">
          <h2>طلباتي الحالية (قيد التوصيل)</h2>
          {myDeliveries.length === 0 ? (
            <div className="glass empty-state">لا يوجد لديك طلبات قيد التوصيل حالياً.</div>
          ) : (
            myDeliveries.map(order => (
              <div key={order.id} className="glass driver-card active-delivery">
                <div className="card-header">
                  <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                  <span className="price-tag">{order.total_price} ريال</span>
                </div>
                
                <div className="customer-info">
                  <p><Home size={16} /> {order.users?.name}</p>
                  <p><Phone size={16} /> {order.users?.phone}</p>
                </div>
                
                <div className="card-actions">
                  <button className="btn-maps" onClick={() => openGoogleMaps(order.users?.location_gps)}>
                    <Navigation size={18} /> موقع العميل (خرائط جوجل)
                  </button>
                  <button className="btn-complete" onClick={() => handleCompleteDelivery(order.id)}>
                    <Home size={18} /> تم تسليم الطلب للعميل
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ready Orders Section */}
        <div className="deliveries-section ready-orders">
          <h2>طلبات جاهزة بالمتجر للاستلام ({orders.length})</h2>
          {orders.length === 0 ? (
            <div className="glass empty-state">
              <BellRing size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>لا يوجد طلبات جاهزة للاستلام بالوقت الحالي.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="glass driver-card">
                <div className="card-header">
                  <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                  <span className="price-tag">{order.total_price} ريال</span>
                </div>
                
                <div className="customer-info">
                  <p><Home size={16} /> حي العميل (متاح بعد القبول)</p>
                </div>
                
                <button className="btn-accept full-width" onClick={() => handleAcceptDelivery(order.id)}>
                  <Truck size={20} /> استلام هذا الطلب للتوصيل
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past Deliveries Section */}
      <div className="past-deliveries-section glass" style={{ marginTop: '40px', padding: '24px', borderRadius: 'var(--border-radius-lg)' }}>
        <h2>الطلبات السابقة التي قمت بتوصيلها ({pastOrders.length})</h2>
        {pastOrders.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px', margin: 0 }}>لا توجد طلبات سابقة مكتملة بعد.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {pastOrders.map(order => (
              <div key={order.id} className="glass driver-card" style={{ opacity: 0.8, background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                <div className="card-header">
                  <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                  <span className="price-tag">{order.total_price} ريال</span>
                </div>
                <div className="customer-info" style={{ marginTop: '12px' }}>
                  <p><Home size={16} style={{ marginLeft: '6px' }} /> {order.users?.name}</p>
                  <p><Phone size={16} style={{ marginLeft: '6px' }} /> {order.users?.phone}</p>
                </div>
                <div style={{ marginTop: '16px', textAlign: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: 'var(--border-radius-sm)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {order.status === 'Delivered' ? '✓ تم التوصيل بنجاح' : '✕ تم الإلغاء'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
