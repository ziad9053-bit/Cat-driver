'use client';

import './admin.css';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/image-utils';
import { Plus, Camera, Image as ImageIcon, CheckCircle, Package, Edit, Trash2, X, Grid } from 'lucide-react';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [categories, setCategories] = useState([]);

  // Fetch products and categories
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

  const resetForm = () => {
    setShowAddForm(false);
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
      category_id: product.category_id,
      is_offer: product.is_offer,
      offer_label: product.offer_label || '',
      offer_color: product.offer_color || '#E65100'
    });
    setImagePreview(product.image_url || '');
    setShowAddForm(true);
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
    } catch (err) {
      alert('فشل في حفظ المنتج: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper admin-dashboard">
      <header className="admin-header">
        <h1>لوحة تحكم المدير</h1>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} /> إضافة صنف جديد
        </button>
      </header>

      {showAddForm && (
        <div className="glass admin-form-card animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ marginBottom: 0 }}>{editingProductId ? 'تعديل صنف' : 'إضافة صنف جديد'}</h2>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
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
                  <button className="btn-gallery" onClick={handleOpenGallery}>
                    <Grid size={18} /> مخزن الصور
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>اسم الصنف</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="مثال: طماطم محمي" />
              </div>
              
              <div className="form-group">
                <label>القسم</label>
                <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} required>
                  <option value="">اختر القسم...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>السعر (ريال)</label>
                <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label>وحدة الوزن</label>
                <select value={formData.unit_type} onChange={(e) => setFormData({...formData, unit_type: e.target.value})}>
                  <option value="Kilo">كيلو</option>
                  <option value="SmallBox">فلين صغير</option>
                  <option value="MediumBox">فلين وسط</option>
                  <option value="LargeBox">فلين كبير</option>
                </select>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={formData.is_offer} onChange={(e) => setFormData({...formData, is_offer: e.target.checked})} />
                تفعيل كعرض خاص؟
              </label>
            </div>

            {formData.is_offer && (
              <div className="form-row animate-fade-in">
                <div className="form-group">
                  <label>نص العرض</label>
                  <input type="text" value={formData.offer_label} onChange={(e) => setFormData({...formData, offer_label: e.target.value})} placeholder="مثال: خصم 20%" />
                </div>
                <div className="form-group">
                  <label>لون ملصق العرض</label>
                  <input type="color" value={formData.offer_color} onChange={(e) => setFormData({...formData, offer_color: e.target.value})} />
                </div>
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ والرفع...' : (editingProductId ? 'حفظ التعديلات' : 'حفظ وإضافة للمتجر')}
            </button>
          </form>
        </div>
      )}

      {/* Admin Products List */}
      <div className="admin-products-section" style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>المنتجات الحالية ({products.length})</h2>
        <div className="admin-products-grid">
          {products.map(product => {
            const unitTranslations = { 'Kilo': 'كيلو', 'SmallBox': 'فلين صغير', 'MediumBox': 'فلين وسط', 'LargeBox': 'فلين كبير', 'Box': 'صندوق' };
            const unitName = unitTranslations[product.unit_type] || product.unit_type;
            const categoryName = categories.find(c => c.id == product.category_id)?.name || 'غير مصنف';

            return (
              <div key={product.id} className="admin-product-card glass">
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
