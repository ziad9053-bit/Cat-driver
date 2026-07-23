'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, CheckCircle, Clock } from 'lucide-react';
import './preparer.css';

export default function PreparerDashboard() {
  const [orders, setOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [unitTranslations, setUnitTranslations] = useState({});
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(null);


  // Derive selectedOrder from orders list so it's always in sync
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || null;

  const fetchUnits = useCallback(async () => {
    const { data } = await supabase.from('product_units').select('*');
    if (data) {
      const trans = {};
      data.forEach(u => {
        trans[u.code] = u.name_ar;
      });
      setUnitTranslations(trans);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    // Active orders (Pending/Processing and not packed)
    const { data, error } = await supabase
      .from('orders')
      .select('*, users!orders_user_id_fkey(name, phone)')
      .in('status', ['Pending', 'Processing'])
      .or('is_packed.is.null,is_packed.eq.false')
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
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    fetchUnits();

    const channel = supabase
      .channel('preparer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playNotification();
        }
        fetchOrders();
      })
      .subscribe();

    const unitsChannel = supabase
      .channel('preparer-units')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_units' }, () => {
        fetchUnits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(unitsChannel);
    };
  }, [fetchOrders, fetchUnits]);

  const playNotification = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio notification failed', e);
    }
  };

  const loadOrderItems = async (orderId) => {
    setLoadingItems(true);
    const { data } = await supabase
      .from('order_items')
      .select('*, products(*)')
      .eq('order_id', orderId);

    if (data) setOrderItems(data);
    setLoadingItems(false);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrderId(order.id);
    loadOrderItems(order.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartPacking = async (orderId) => {
    // Optimistic update: immediately update local state
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Processing' } : o
    ));

    const { error } = await supabase
      .from('orders')
      .update({ status: 'Processing' })
      .eq('id', orderId);

    if (error) {
      showToast('خطأ: ' + error.message, 'error');
      fetchOrders(); // Revert on error
    } else {
      showToast('تم استلام الطلب وبدء التحضير', 'success');
    }
  };

  const handleFinishPacking = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ is_packed: true })
      .eq('id', orderId);

    if (error) {
      showToast('خطأ: ' + error.message, 'error');
    } else {
      const orderType = orders.find(o => o.id === orderId)?.delivery_type;
      if (orderType === 'Pickup') {
        showToast('تم التجهيز، الطلب بانتظار استلام العميل!', 'success');
      } else {
        showToast('تم التجهيز وإرسال إشعار للسائقين!', 'success');
      }
      setSelectedOrderId(null);
      fetchOrders();
    }
  };

  // Removed mounted check to allow instant render from localStorage

  // Determine which button to show for the selected order
  const renderOrderActions = () => {
    if (!selectedOrder) return null;

    const status = selectedOrder.status;
    const packed = selectedOrder.is_packed;

    if (status === 'Pending') {
      return (
        <button
          className="btn-primary full-width"
          style={{ backgroundColor: '#ff4d4f', border: 'none', boxShadow: '0 4px 15px rgba(255, 77, 79, 0.4)' }}
          onClick={() => handleStartPacking(selectedOrder.id)}
        >
          البدء بالتحضير 📦
        </button>
      );
    }

    if (status === 'Processing' && packed !== true) {
      return (
        <button
          className="btn-success full-width"
          onClick={() => handleFinishPacking(selectedOrder.id)}
        >
          <CheckCircle size={20} /> تم التجهيز، بانتظار السائق
        </button>
      );
    }

    return null;
  };

  return (
    <div className="page-wrapper preparer-dashboard">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <header className="page-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
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
                    className={`order-card ${selectedOrderId === order.id ? 'active' : ''} ${order.status === 'Processing' ? 'processing' : ''}`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="order-card-header">
                      <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                      <span className="time-elapsed"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString('ar-SA')}</span>
                    </div>
                    <p>العميل: {order.users?.name}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                      <span 
                        className={`status-badge ${order.status}`}
                        style={order.status === 'Pending' ? { backgroundColor: '#ff4d4f', color: 'white', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255, 77, 79, 0.4)' } : {}}
                      >
                        {order.status === 'Pending' ? 'جديد 🚨' : 'جاري التحضير ⏳'}
                      </span>
                      {order.delivery_type === 'Pickup' && (
                        <span className="status-badge" style={{ backgroundColor: '#ff9800', color: '#fff' }}>
                          استلام من المحل 🏪
                        </span>
                      )}
                    </div>
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
                    className={`order-card ${selectedOrderId === order.id ? 'active' : ''}`}
                    style={{ opacity: 0.75, borderRight: '4px solid var(--success-color)' }}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="order-card-header">
                      <h3>طلب #{order.id.split('-')[0].toUpperCase()}</h3>
                      <span className="time-elapsed"><Clock size={14} /> {new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <p>العميل: {order.users?.name}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                      <span className="status-badge" style={{ backgroundColor: order.status === 'Delivered' || order.status === 'Completed' ? 'var(--success-color)' : 'var(--primary-color)', color: 'white' }}>
                        {order.delivery_type === 'Pickup' ? 'جاهز للاستلام' : (order.status === 'Delivered' ? 'تم التوصيل' : 'جاهز للتوصيل')}
                      </span>
                      {order.delivery_type === 'Pickup' && (
                        <span className="status-badge" style={{ backgroundColor: '#ff9800', color: '#fff' }}>
                          استلام من المحل 🏪
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="order-details glass">
          {selectedOrder ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}>تفاصيل الطلب #{selectedOrder.id.split('-')[0].toUpperCase()}</h2>
                {selectedOrder.delivery_type === 'Pickup' && (
                  <span style={{ 
                    backgroundColor: '#ff9800', color: '#fff', padding: '8px 16px', 
                    borderRadius: 'var(--border-radius-sm)', fontWeight: 'bold', fontSize: '1.1rem',
                    boxShadow: '0 0 10px rgba(255, 152, 0, 0.4)'
                  }}>
                    استلام من المحل 🏪
                  </span>
                )}
              </div>

              {loadingItems ? (
                <p>جاري تحميل الأصناف...</p>
              ) : (
                <div className="items-list">
                  {orderItems.map(item => {
                    const unitName = item.products?.weight || item.products?.unit_type || 'حبة';
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
                {renderOrderActions()}
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
