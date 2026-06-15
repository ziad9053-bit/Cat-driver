'use client';

import './admin.css';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/image-utils';
import { Plus, Camera, Image as ImageIcon, CheckCircle, Package } from 'lucide-react';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  const categories = [
    { id: 1, name: 'خضار' },
    { id: 2, name: 'بقوليات' },
    { id: 3, name: 'فواكه' }
  ];

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

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = null;
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

      const { data, error } = await supabase.from('products').insert([{
        name: formData.name,
        current_price: parseFloat(formData.price),
        unit_type: formData.unit_type,
        category_id: parseInt(formData.category_id) || categories[0].id,
        is_offer: formData.is_offer,
        offer_label: formData.is_offer ? formData.offer_label : null,
        offer_color: formData.is_offer ? formData.offer_color : null,
        image_url: imageUrl
      }]);

      if (error) throw error;
      
      alert('تم إضافة المنتج بنجاح!');
      setShowAddForm(false);
      setFormData({ name: '', price: '', unit_type: 'Kilo', category_id: '', is_offer: false, offer_label: '', offer_color: '#E65100' });
      setImageFile(null);
      setImagePreview('');
      // Trigger refresh or update state here if needed
    } catch (err) {
      alert('فشل في إضافة المنتج: ' + err.message);
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
          <h2>إضافة صنف جديد</h2>
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
              {isSubmitting ? 'جاري الحفظ والرفع...' : 'حفظ وإضافة للمتجر'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
