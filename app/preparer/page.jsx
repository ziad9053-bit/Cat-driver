'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, CheckCircle, BellRing, Clock } from 'lucide-react';
import './preparer.css';

export default function PreparerDashboard() {
  const [orders, setOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [unitTranslations, setUnitTranslations] = useState({});
  const [mounted, setMounted] = useState(false);

  const fetchUnits = async () => {
    const { data } = await supabase.from('product_units').select('*');
    if (data) {
      const trans = {};
      data.forEach(u => {
        trans[u.code] = u.name_ar;
      });
      setUnitTranslations(trans);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    fetchUnits();

    const channel = supabase
      .channel('preparer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Play notification sound or show toast for new orders
        if (payload.eventType === 'INSERT') {
          playNotification();
        }
        fetchOrders(); // Refresh list on any change
      })
      .subscribe();

    const unitsChannel = supabase
      .channel('preparer-units')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_units' }, (payload) => {
        fetchUnits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(unitsChannel);
    };
  }, []);

  const fetchOrders = async () => {
    // Active orders (Pending/Processing and not packed)
    const { data, error } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone)')
      .in('status', ['Pending', 'Processing'])
      .neq('is_packed', true)
      .order('created_at', { ascending: true });
      
    if (error) console.error('Error fetching orders:', error);
    if (data) setOrders(data);

    // Past orders (packed, delivered, or cancelled)
    const { data: pastData, error: pastErr } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone)')
      .or('is_packed.eq.true,status.in.(Delivered,Cancelled)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (pastErr) console.error('Error fetching past orders:', pastErr);
    if (pastData) setPastOrders(pastData);
  };

  const playNotification = () => {
    // Simple beep using AudioContext
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio notification failed', e);
    }
  };

  const loadOrderItems = async (orderId) => {
    setLoadingItems(true);
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(*)')
      .eq('order_id', orderId);
      
    if (data) setOrderItems(data);
    setLoadingItems(false);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    loadOrderItems(order.id);
  };

  const handleStartPacking = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Processing' })
      .eq('id', orderId);
      
    if (error) alert('Error: ' + error.message);
    else {
      setSelectedOrder(prev => ({ ...prev, status: 'Processing' }));
    }
  };

  const handleFinishPacking = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ is_packed: true })
      .eq('id', orderId);
      
    if (error) alert('Error: ' + error.message);
    else {
      alert('تم إرسال إشعار للسائقين!');
      setSelectedOrder(null);
      fetchOrders();
    }
  };

  if (!mounted) {
    return (
      <div className="page-wrapper" style={{ opacity: 0 }}></div>
    );
  }

  return (
    <div className="page-wrapper preparer-dashboard">
      <header className="page-header" style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1 style={{ color: 'var(--primary-color)' }}>شاشة عامل التحضير 📦</h1>
        <p style={{ color: 'var(--text-secondary)' }}>الطلبات الواردة بانتظار التجهيز والتغليف.</p>
      </header>

      <div className="dashboard-grid">
        <div className="orders-list glass" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2>الطلبات المتاحة ({orders.length})</h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                <p>لا توجد طلبات جديدة حالياً.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    className={`order-card ${selectedOrder?.id === order.id ? 'active' : ''} ${order.status === 'Processing' ? 'processing' : ''}`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="order-card-header">
                      <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                      <span className="time-elapsed"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('ar-SA')}</span>
                    </div>
                    <p>العميل: {order.users?.name}</p>
                    <span className={`status-badge ${order.status}`}>
                      {order.status === 'Pending' ? 'جديد' : 'جاري التحضير'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <h2 style={{ color: 'var(--text-secondary)' }}>الطلبات السابقة المجهزة ({pastOrders.length})</h2>
            {pastOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '15px', color: 'var(--text-tertiary)' }}>
                <p>لا توجد طلبات سابقة.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                {pastOrders.map(order => (
                  <div 
                    key={order.id} 
                    className={`order-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                    style={{ opacity: 0.75, borderRight: '4px solid var(--success-color)' }}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="order-card-header">
                      <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                      <span className="time-elapsed"><Clock size={14} /> {new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <p>العميل: {order.users?.name}</p>
                    <span className="status-badge" style={{ backgroundColor: order.status === 'Delivered' ? 'var(--success-color)' : 'var(--primary-color)', color: 'white' }}>
                      {order.status === 'Delivered' ? 'تم التوصيل' : 'جاهز للتوصيل'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="order-details glass">
          {selectedOrder ? (
            <>
              <h2>تفاصيل الطلب #{selectedOrder.id.split('-')[0].toUpperCase()}</h2>
              
              {loadingItems ? (
                <p>جاري تحميل الأصناف...</p>
              ) : (
                <div className="items-list">
                  {orderItems.map(item => {
                    const unitName = item.products?.unit_type ? ((unitTranslations && unitTranslations[item.products.unit_type]) || item.products.unit_type) : 'وحدة';
                    const displayQty = item.quantity !== undefined && item.quantity !== null ? Number(item.quantity) : '';

                    return (
                      <div key={item.id} className="item-row">
                        <div className="item-img">
                          {item.products?.image_url ? <img src={item.products.image_url} alt="" /> : <Package />}
                        </div>
                        <div className="item-info">
                          <h4>{item.products?.name}</h4>
                          <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            الكمية: {displayQty} {unitName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="order-actions">
                {selectedOrder.is_packed === true || ['Delivered', 'Cancelled', 'OnTheWay'].includes(selectedOrder.status) ? (
                  <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: 'var(--border-radius-md)', fontWeight: 'bold' }}>
                    {selectedOrder.status === 'Delivered' ? '✓ تم توصيل هذا الطلب للعميل' : '✓ تم تغليف الطلب وبانتظار استلام السائق'}
                  </div>
                ) : selectedOrder.status === 'Pending' ? (
                  <button className="btn-primary full-width" onClick={() => handleStartPacking(selectedOrder.id)}>
                    البدء بالتحضير
                  </button>
                ) : selectedOrder.status === 'Processing' && !selectedOrder.is_packed ? (
                  <button className="btn-success full-width" onClick={() => handleFinishPacking(selectedOrder.id)}>
                    <CheckCircle size={20} /> تم التجهيز، بانتظار السائق
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="empty-selection">
              <Package size={64} />
              <p>اختر طلباً من القائمة لعرض تفاصيله والبدء بتحضيره.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
