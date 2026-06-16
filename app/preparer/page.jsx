'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, CheckCircle, BellRing, Clock } from 'lucide-react';
import './preparer.css';

export default function PreparerDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchOrders();

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

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone)')
      .in('status', ['Pending', 'Processing'])
      .eq('is_packed', false)
      .order('created_at', { ascending: true });
      
    if (error) console.error('Error fetching orders:', error);
    if (data) setOrders(data);
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
      .select('*, products(name, image_url, unit_type)')
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

  return (
    <div className="page-wrapper preparer-dashboard">
      <header className="page-header" style={{textAlign: 'center', marginBottom: '30px'}}>
        <h1 style={{ color: 'var(--primary-color)' }}>شاشة عامل التحضير 📦</h1>
        <p style={{ color: 'var(--text-secondary)' }}>الطلبات الواردة بانتظار التجهيز والتغليف.</p>
      </header>

      <div className="dashboard-grid">
        <div className="orders-list glass">
          <h2>الطلبات المتاحة ({orders.length})</h2>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <BellRing size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>لا توجد طلبات جديدة حالياً.</p>
            </div>
          ) : (
            orders.map(order => (
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
            ))
          )}
        </div>

        <div className="order-details glass">
          {selectedOrder ? (
            <>
              <h2>تفاصيل الطلب #{selectedOrder.id.split('-')[0].toUpperCase()}</h2>
              
              {loadingItems ? (
                <p>جاري تحميل الأصناف...</p>
              ) : (
                <div className="items-list">
                  {orderItems.map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-img">
                        {item.products?.image_url ? <img src={item.products.image_url} alt="" /> : <Package />}
                      </div>
                      <div className="item-info">
                        <h4>{item.products?.name}</h4>
                        <p>{item.quantity} × {item.products?.unit_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="order-actions">
                {selectedOrder.status === 'Pending' ? (
                  <button className="btn-primary full-width" onClick={() => handleStartPacking(selectedOrder.id)}>
                    البدء بالتحضير
                  </button>
                ) : (
                  <button className="btn-success full-width" onClick={() => handleFinishPacking(selectedOrder.id)}>
                    <CheckCircle size={20} /> تم التجهيز، بانتظار السائق
                  </button>
                )}
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
