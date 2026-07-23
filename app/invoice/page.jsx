'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { ArrowRight, Printer, Receipt } from 'lucide-react';
import Link from 'next/link';
import './invoice.css';

function InvoiceContent() {
  const { unitTranslations } = useCart();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchInvoiceData = async () => {
      try {
        // 1. Fetch Order
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (orderData) {
          setOrder(orderData);

          // 2. Fetch Items
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, products(name, weight, unit_type)')
            .eq('order_id', id);
            
          if (itemsData) setItems(itemsData);

          // 3. Fetch Invoice
          const { data: invoiceData } = await supabase
            .from('invoices')
            .select('*')
            .eq('order_id', id)
            .maybeSingle();
            
          if (invoiceData) setInvoice(invoiceData);
        }
      } catch (err) {
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="invoice-wrapper animate-fade-in">
        <div className="glass animate-pulse" style={{ padding: '40px', textAlign: 'center' }}>
          <span>جاري جلب بيانات الفاتورة...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="invoice-wrapper animate-fade-in">
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <span>عفواً، الفاتورة غير موجودة.</span>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const deliveryFee = invoice?.delivery_fee ? Number(invoice.delivery_fee) : 0;
  // If we can't find delivery fee in invoice, we try to calculate it backward or just display 0.
  // Actually, wait: we know total_price = subtotal + deliveryFee.
  const subtotal = items.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0);
  const finalDeliveryFee = invoice ? deliveryFee : (Number(order.total_price) - subtotal);

  return (
    <div className="invoice-wrapper animate-fade-in">
      <div className="invoice-card glass">
        <div className="invoice-header">
          <div className="invoice-brand">
            <Receipt size={32} className="brand-icon" />
            <h1>{settings?.invoice_title || settings?.site_name || 'تطبيق الخضروات'}</h1>
          </div>
          <div className="invoice-meta">
            <p><strong>رقم الفاتورة:</strong> #{order.id.split('-')[0].toUpperCase()}</p>
            <p><strong>التاريخ:</strong> {new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
            <p><strong>الوقت:</strong> {new Date(order.created_at).toLocaleTimeString('ar-SA')}</p>
          </div>
        </div>

        <div className="invoice-divider"></div>

        <div className="invoice-customer">
          <p><strong>{settings?.invoice_delivery_method || 'طريقة التوصيل:'}</strong> {order.delivery_type === 'Pickup' ? 'استلام من المحل' : 'توصيل'}</p>
          {invoice && (
            <p><strong>{settings?.invoice_payment_method || 'طريقة الدفع:'}</strong> {invoice.payment_method === 'Cash' ? 'الدفع عند الاستلام' : 'دفع إلكتروني'}</p>
          )}
        </div>

        <div className="invoice-items">
          <div className="items-header">
            <span>الصنف</span>
            <span>الكمية</span>
            <span>الإجمالي</span>
          </div>
          {items.map(item => {
            const unitName = item.products?.weight || item.products?.unit_type || 'حبة';
            const itemTotal = Number(item.price_at_purchase * item.quantity).toFixed(2);
            
            return (
              <div key={item.id} className="item-row">
                <div className="item-name">
                  <span>{item.products?.name || 'منتج طازج'}</span>
                  <small>{Number(item.price_at_purchase).toFixed(2)} ريال / {unitName}</small>
                </div>
                <div className="item-qty">{item.quantity}</div>
                <div className="item-total">{itemTotal} ريال</div>
              </div>
            );
          })}
        </div>

        <div className="invoice-divider"></div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>{settings?.invoice_subtotal || 'المجموع الفرعي:'}</span>
            <span>{subtotal.toFixed(2)} ريال</span>
          </div>
          <div className="summary-row">
            <span>{settings?.invoice_delivery_fee || 'رسوم التوصيل:'}</span>
            <span>{finalDeliveryFee > 0 ? `${finalDeliveryFee.toFixed(2)} ريال` : (settings?.invoice_free_delivery || 'مجاني')}</span>
          </div>
          <div className="summary-row total-row">
            <span>{settings?.invoice_total || 'الإجمالي الكلي:'}</span>
            <span>{Number(order.total_price).toFixed(2)} ريال</span>
          </div>
        </div>

        {settings?.invoice_footer && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <p>{settings.invoice_footer}</p>
          </div>
        )}

        <div className="invoice-actions no-print">
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={20} />
            طباعة الفاتورة
          </button>
          <Link href={`/track/?id=${order.id}`} className="btn-back">
            <ArrowRight size={20} />
            العودة للتتبع
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="invoice-wrapper"><div className="glass">جاري التحميل...</div></div>}>
      <InvoiceContent />
    </Suspense>
  );
}
