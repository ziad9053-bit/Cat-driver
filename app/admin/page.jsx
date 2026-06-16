'use client';
import Link from 'next/link';

import './admin.css';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/image-utils';
import { Plus, Camera, Image as ImageIcon, CheckCircle, Package, Edit, Trash2, X, Grid, Settings } from 'lucide-react';
import SettingsTab from './SettingsTab';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [activeAccordion, setActiveAccordion] = useState('products');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const toggleAccordion = (section) => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [newUnitNameAr, setNewUnitNameAr] = useState('');
  const [isSavingUnit, setIsSavingUnit] = useState(false);

  // Fetch products, categories, and units
  const fetchData = async () => {
    const { data: prods, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (prodErr) console.error('Error fetching products:', prodErr);
    else setProducts(prods || []);

    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('*');

    if (catErr) console.error('Error fetching categories:', catErr);
    else setCategories(cats || []);

    const { data: utypes, error: utypesErr } = await supabase
      .from('product_units')
      .select('*')
      .order('created_at', { ascending: true });

    if (utypesErr) console.error('Error fetching units:', utypesErr);
    else setUnits(utypes || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit_type: 'Kilo',
    category_id: '',
    is_offer: false,
    offer_label: '',
    offer_color: '#E65100'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Gallery State
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const fetchGalleryImages = async () => {
    setLoadingGallery(true);
    const { data, error } = await supabase.storage.from('products').list();
    if (error) {
      console.error('Error fetching gallery images:', error);
    } else if (data) {
      // Filter out non-image files if any and map to public URLs
      const urls = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .map(file => {
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(file.name);
          return { name: file.name, url: publicUrl };
        });
      setGalleryImages(urls);
    }
    setLoadingGallery(false);
  };

  const handleOpenGallery = (e) => {
    e.preventDefault();
    setShowGallery(true);
    fetchGalleryImages();
  };

  const handleSelectGalleryImage = (url) => {
    setImagePreview(url);
    setImageFile(null); // Clear any pending local file upload since we are using an existing image
    setShowGallery(false);
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show immediate preview
      setImagePreview(URL.createObjectURL(file));
      try {
        // Convert to WebP
        const webpFile = await convertToWebP(file);
        setImageFile(webpFile);
      } catch (err) {
        alert('حدث خطأ أثناء معالجة الصورة');
        console.error(err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setEditingProductId(null);
    setFormData({ name: '', price: '', unit_type: 'Kilo', category_id: '', is_offer: false, offer_label: '', offer_color: '#E65100' });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      price: product.current_price,
      unit_type: product.unit_type,
      category_id: product.category_id || '',
      is_offer: product.is_offer || false,
      offer_label: product.offer_label || '',
      offer_color: product.offer_color || '#E65100'
    });
    setImagePreview(product.image_url);
    setActiveAccordion('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف نهائياً؟')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        alert('تم الحذف بنجاح!');
        fetchData();
      }
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!newUnitNameAr.trim()) return;
    setIsSavingUnit(true);

    const code = 'unit_' + Date.now();

    const { error } = await supabase
      .from('product_units')
      .insert([{ code, name_ar: newUnitNameAr.trim() }]);

    if (error) {
      alert('حدث خطأ أثناء إضافة الوحدة: ' + error.message);
    } else {
      setNewUnitNameAr('');
      const { data: utypes } = await supabase
        .from('product_units')
        .select('*')
        .order('created_at', { ascending: true });
      if (utypes) setUnits(utypes);
    }
    setIsSavingUnit(false);
  };

  const handleDeleteUnit = async (unitId, code) => {
    const isUsed = products.some(p => p.unit_type === code);
    if (isUsed) {
      alert('لا يمكن حذف هذه الوحدة لأنها مستخدمة حالياً في بعض المنتجات. يرجى تغيير وحدة المنتجات أولاً.');
      return;
    }

    if (confirm('هل أنت متأكد من حذف هذه الوحدة نهائياً؟')) {
      const { error } = await supabase
        .from('product_units')
        .delete()
        .eq('id', unitId);

      if (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        const { data: utypes } = await supabase
          .from('product_units')
          .select('*')
          .order('created_at', { ascending: true });
        if (utypes) setUnits(utypes);
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = editingProductId ? imagePreview : null; // keep old image if editing and no new file

      if (imageFile) {
        const fileName = `product_${Date.now()}.webp`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      const productPayload = {
        name: formData.name,
        current_price: parseFloat(formData.price),
        unit_type: formData.unit_type,
        category_id: formData.category_id || (categories.length > 0 ? categories[0].id : null),
        is_offer: formData.is_offer,
        offer_label: formData.is_offer ? formData.offer_label : null,
        offer_color: formData.is_offer ? formData.offer_color : null,
        image_url: imageUrl
      };

      let error;
      if (editingProductId) {
        const { error: updateError } = await supabase.from('products').update(productPayload).eq('id', editingProductId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert([productPayload]);
        error = insertError;
      }

      if (error) throw error;
      
      alert(editingProductId ? 'تم تحديث المنتج بنجاح!' : 'تم إضافة المنتج بنجاح!');
      resetForm();
      fetchData();
      setActiveAccordion('products');
    } catch (err) {
      alert('فشل في حفظ المنتج: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper admin-dashboard">
      <header className="admin-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>لوحة تحكم المدير</h1>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', background: 'var(--primary-color)', textDecoration: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
            الرجوع للمتجر 🏠
          </Link>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>أهلاً بك في لوحة التحكم، يمكنك إدارة إعدادات المتجر والمنتجات من هنا.</p>
      </header>

      {/* Accordions Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Settings Accordion */}
        <div className="glass accordion-card" style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('settings')}
            style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: activeAccordion === 'settings' ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              <Settings size={24} />
              إعدادات التطبيق
            </div>
            <div>{activeAccordion === 'settings' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'settings' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <SettingsTab />
            </div>
          )}
        </div>

        {/* Units Accordion */}
        <div className="glass accordion-card" style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('units')}
            style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: activeAccordion === 'units' ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              <span style={{ fontSize: '24px' }}>⚖️</span>
              إدارة وحدات الوزن
            </div>
            <div>{activeAccordion === 'units' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'units' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <form onSubmit={handleAddUnit} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  placeholder="اسم الوحدة بالكامل (مثال: كيس كبير)" 
                  value={newUnitNameAr} 
                  onChange={(e) => setNewUnitNameAr(e.target.value)} 
                  required 
                  style={{ flex: 1, padding: '12px', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
                <button 
                  type="submit" 
                  disabled={isSavingUnit}
                  className="btn-primary"
                  style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
                >
                  {isSavingUnit ? 'جاري الحفظ...' : 'إضافة وحدة'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>الوحدات المتوفرة ({units.length})</h3>
                {units.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '15px' }}>لا توجد وحدات مضافة حالياً.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {units.map(u => (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontWeight: '500' }}>{u.name_ar}</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); handleDeleteUnit(u.id, u.code); }} 
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px' }}
                          title="حذف الوحدة"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Product Accordion */}
        <div className="glass accordion-card" style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('add')}
            style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: activeAccordion === 'add' ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              <Plus size={24} />
              {editingProductId ? 'تعديل صنف' : 'إضافة صنف جديد'}
            </div>
            <div>{activeAccordion === 'add' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'add' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <form onSubmit={handleAddProduct} className="admin-form">
                
                <div className="form-group">
                  <label>صورة المنتج</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                      <div className="image-placeholder"><Package size={48} /></div>
                    )}
                    
                    <div className="upload-buttons">
                      <label className="btn-upload">
                        <ImageIcon size={18} /> رفع صورة
                        <input type="file" accept="image/*" hidden onChange={handleImageCapture} />
                      </label>
                      <label className="btn-capture">
                        <Camera size={18} /> التقاط بالكاميرا
                        <input type="file" accept="image/*" capture="environment" hidden onChange={handleImageCapture} />
                      </label>
                      <button type="button" className="btn-gallery" onClick={() => { setShowGallery(true); fetchGalleryImages(); }}>
                        <ImageIcon size={18} /> اختيار من المخزن
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>اسم المنتج <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="مثال: طماطم" />
                  </div>
                  
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>السعر (ريال) <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>التصنيف</label>
                    <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                      <option value="">بدون تصنيف</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>وحدة البيع <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <select name="unit_type" value={formData.unit_type} onChange={handleInputChange} required>
                      {units.map(u => (
                        <option key={u.code} value={u.code}>{u.name_ar}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Offer details */}
                <div className="form-group" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: 'var(--border-radius-md)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: formData.is_offer ? '15px' : '0' }}>
                    <input 
                      type="checkbox" 
                      name="is_offer" 
                      checked={formData.is_offer} 
                      onChange={handleInputChange} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>هل المنتج عليه عرض خاص؟</span>
                  </label>

                  {formData.is_offer && (
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>نص العرض (مثال: عرض اليوم)</label>
                        <input type="text" name="offer_label" value={formData.offer_label} onChange={handleInputChange} placeholder="نص قصير..." />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>لون بادج العرض</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input type="color" name="offer_color" value={formData.offer_color} onChange={handleInputChange} style={{ height: '40px', width: '50px', padding: 0, border: 'none', borderRadius: '4px' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>اختر اللون</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  {editingProductId && (
                    <button type="button" className="btn-secondary" onClick={resetForm}>
                      إلغاء التعديل
                    </button>
                  )}
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'جاري الحفظ...' : (editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Products List Accordion */}
        <div className="glass accordion-card" style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
          <div 
            onClick={() => toggleAccordion('products')}
            style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: activeAccordion === 'products' ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.3s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              <Package size={24} />
              المنتجات الحالية ({products.length})
            </div>
            <div>{activeAccordion === 'products' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'products' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="admin-products-grid">
                {products.map(product => {
                  const unitName = (units.find(u => u.code === product.unit_type))?.name_ar || product.unit_type;
                  const categoryName = (categories.find(c => c.id == product.category_id))?.name || 'بدون تصنيف';

                  return (
                    <div key={product.id} className="admin-product-card glass">
                      {product.is_offer && (
                        <div className="offer-badge-preview" style={{ background: product.offer_color || '#E65100' }}>
                          {product.offer_label || 'عرض'}
                        </div>
                      )}
                      {product.image_url && (
                        <div className="admin-product-img">
                          <img src={product.image_url} alt={product.name} />
                        </div>
                      )}
                      <div className="admin-product-info">
                        <h3>{product.name}</h3>
                        <p className="admin-product-price">{product.current_price} ريال / {unitName}</p>
                        <span className="admin-product-category">{categoryName}</span>
                      </div>
                      <div className="admin-product-actions">
                        <button onClick={() => handleEditClick(product)} className="btn-edit" title="تعديل">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="btn-delete" title="حذف">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showGallery && (
        <div className="modal-overlay">
          <div className="gallery-modal glass animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: 0, color: 'var(--primary-color)' }}>مخزن الصور 🖼️</h2>
              <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            {loadingGallery ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>جاري تحميل الصور...</div>
            ) : galleryImages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>لا توجد صور في المخزن حالياً.</div>
            ) : (
              <div className="gallery-grid">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="gallery-item" onClick={() => handleSelectGalleryImage(img.url)}>
                    <img src={img.url} alt={img.name} loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
