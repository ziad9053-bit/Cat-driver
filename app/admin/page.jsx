'use client';
import Link from 'next/link';
import './admin.css';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/image-utils';
import { Plus, Camera, Image as ImageIcon, CheckCircle, Package, Edit, Trash2, X, Grid, Settings, ListTree, UploadCloud } from 'lucide-react';
import SettingsTab from './SettingsTab';
import ExcelImporter from './ExcelImporter';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [activeAccordion, setActiveAccordion] = useState('products');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const toggleAccordion = (section) => {
    setActiveAccordion(prev => prev === section ? null : section);
  };

  // Fetch Data
  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*')
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helpers for categories
  const mainCategories = categories.filter(c => !c.parent_id);
  const subCategories = categories.filter(c => c.parent_id);
  
  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return 'بدون تصنيف';
    if (cat.parent_id) {
      const parent = categories.find(c => c.id === cat.parent_id);
      return parent ? `${parent.name} > ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  const [productForm, setProductForm] = useState({
    name: '',
    current_price: '',
    weight: '',
    description: '',
    category_ids: [],
    stock_quantity: 100,
    is_active: true,
    is_offer: false,
    offer_label: '',
    offer_color: '#FF3B30'
  });
  const [prodImageFile, setProdImageFile] = useState(null);
  const [prodImagePreview, setProdImagePreview] = useState('');

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({ name: '', current_price: '', weight: '', description: '', category_ids: [], stock_quantity: 100, is_active: true, is_offer: false, offer_label: '', offer_color: '#FF3B30' });
    setProdImageFile(null);
    setProdImagePreview('');
  };

  const handleProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProdImageCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProdImagePreview(URL.createObjectURL(file));
      try {
        const webpFile = await convertToWebP(file);
        setProdImageFile(webpFile);
      } catch (err) {
        alert('حدث خطأ أثناء معالجة الصورة');
      }
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = editingProductId ? prodImagePreview : null;
      if (prodImageFile) {
        const fileName = `product_${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, prodImageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const payload = {
        name: productForm.name,
        current_price: parseFloat(productForm.current_price),
        weight: productForm.weight,
        description: productForm.description,
        category_ids: productForm.category_ids,
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        is_active: productForm.is_active,
        is_offer: productForm.is_offer,
        offer_label: productForm.is_offer ? productForm.offer_label : null,
        offer_color: productForm.is_offer ? productForm.offer_color : null,
        image_url: imageUrl
      };

      if (editingProductId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
        if (error) throw error;
        alert('تم تعديل المنتج بنجاح');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        alert('تم إضافة المنتج بنجاح');
      }
      resetProductForm();
      fetchData();
      setActiveAccordion('products');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setIsSubmitting(false);
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      current_price: product.current_price,
      weight: product.weight || '',
      description: product.description || '',
      category_ids: product.category_ids || (product.category_id ? [product.category_id] : []),
      stock_quantity: product.stock_quantity ?? 100,
      is_active: product.is_active ?? true,
      is_offer: product.is_offer || false,
      offer_label: product.offer_label || '',
      offer_color: product.offer_color || '#FF3B30'
    });
    setProdImagePreview(product.image_url || '');
    setActiveAccordion('add-product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };


  // --- Category Form State ---
  const [catForm, setCatForm] = useState({ name: '', parent_id: '' });
  const [catImageFile, setCatImageFile] = useState(null);
  const [catImagePreview, setCatImagePreview] = useState('');

  const resetCatForm = () => {
    setEditingCategoryId(null);
    setCatForm({ name: '', parent_id: '' });
    setCatImageFile(null);
    setCatImagePreview('');
  };

  const handleCatImageCapture = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCatImagePreview(URL.createObjectURL(file));
      try {
        const webpFile = await convertToWebP(file);
        setCatImageFile(webpFile);
      } catch (err) {
        alert('خطأ في معالجة الصورة');
      }
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsSubmittingCategory(true);
    try {
      let imageUrl = editingCategoryId ? catImagePreview : null;
      if (catImageFile) {
        const fileName = `category_${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, catImageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const payload = {
        name: catForm.name,
        parent_id: catForm.parent_id || null,
        image_url: imageUrl
      };

      if (editingCategoryId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategoryId);
        if (error) throw error;
        alert('تم تعديل القسم');
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
        alert('تم إضافة القسم');
      }
      resetCatForm();
      fetchData();
      setActiveAccordion('categories-list');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
    setIsSubmittingCategory(false);
  };

  const editCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setCatForm({ name: cat.name, parent_id: cat.parent_id || '' });
    setCatImagePreview(cat.image_url || '');
    setActiveAccordion('add-category');
  };

  const deleteCategory = async (id) => {
    if (confirm('هل أنت متأكد؟ (سيتم حذف أي أقسام فرعية تابعة له)')) {
      await supabase.from('categories').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="page-wrapper admin-dashboard">
      <header className="admin-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>لوحة تحكم السوبر ماركت 🛒</h1>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--border-radius-md)', background: 'var(--primary-color)', textDecoration: 'none', color: '#000', fontWeight: 'bold' }}>
            زيارة المتجر 🏠
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
           <div className="glass" style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
             المنتجات: {products.length}
           </div>
           <div className="glass" style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
             الأقسام: {categories.length}
           </div>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* ===================== SETTINGS ===================== */}
        <div className="glass accordion-card">
          <div onClick={() => toggleAccordion('settings')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}><Settings /> الإعدادات العامة</div>
            <div>{activeAccordion === 'settings' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'settings' && <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}><SettingsTab /></div>}
        </div>

        {/* ===================== ADD CATEGORY ===================== */}
        <div className="glass accordion-card">
          <div onClick={() => toggleAccordion('add-category')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}><ListTree /> {editingCategoryId ? 'تعديل القسم' : 'إضافة قسم جديد'}</div>
            <div>{activeAccordion === 'add-category' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'add-category' && (
             <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <form onSubmit={handleSaveCategory} className="admin-form">
                  <div className="form-group">
                    <label>صورة القسم (مربعة)</label>
                    <div className="image-upload-area">
                      {catImagePreview ? <img src={catImagePreview} className="image-preview" alt="preview" /> : <div className="image-placeholder"><Grid /></div>}
                      <label className="btn-upload"><ImageIcon size={18} /> رفع صورة<input type="file" accept="image/*" hidden onChange={handleCatImageCapture} /></label>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>اسم القسم <span style={{color: 'red'}}>*</span></label>
                      <input type="text" value={catForm.name} onChange={(e) => setCatForm({...catForm, name: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>متفرع من (اختياري)</label>
                      <select value={catForm.parent_id} onChange={(e) => setCatForm({...catForm, parent_id: e.target.value})}>
                        <option value="">هذا قسم رئيسي (لا يتبع لأي قسم)</option>
                        {mainCategories.filter(c => c.id !== editingCategoryId).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    {editingCategoryId && <button type="button" className="btn-secondary" onClick={resetCatForm}>إلغاء</button>}
                    <button type="submit" className="btn-primary" disabled={isSubmittingCategory}>{isSubmittingCategory ? 'جاري الحفظ...' : 'حفظ القسم'}</button>
                  </div>
                </form>
             </div>
          )}
        </div>

        {/* ===================== CATEGORIES LIST ===================== */}
        <div className="glass accordion-card">
          <div onClick={() => toggleAccordion('categories-list')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}><Grid /> الأقسام الحالية</div>
            <div>{activeAccordion === 'categories-list' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'categories-list' && (
             <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
               {mainCategories.map(mainCat => (
                 <div key={mainCat.id} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
                     <h3 style={{ margin: 0 }}>📦 {mainCat.name}</h3>
                     <div>
                       <button onClick={() => editCategory(mainCat)} className="btn-edit" style={{background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer', marginLeft: 10}}><Edit size={18} /></button>
                       <button onClick={() => deleteCategory(mainCat.id)} className="btn-delete" style={{background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer'}}><Trash2 size={18} /></button>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                     {categories.filter(c => c.parent_id === mainCat.id).map(sub => (
                        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>
                          {sub.name}
                          <button onClick={() => editCategory(sub)} style={{background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer', marginLeft: 5}}><Edit size={14} /></button>
                          <button onClick={() => deleteCategory(sub.id)} style={{background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer'}}><Trash2 size={14} /></button>
                        </div>
                     ))}
                     {categories.filter(c => c.parent_id === mainCat.id).length === 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>لا توجد أقسام فرعية.</span>}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* ===================== ADD PRODUCT ===================== */}
        <div className="glass accordion-card">
          <div onClick={() => toggleAccordion('add-product')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}><Plus /> {editingProductId ? 'تعديل منتج' : 'إضافة منتج يدوي'}</div>
            <div>{activeAccordion === 'add-product' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'add-product' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <form onSubmit={handleSaveProduct} className="admin-form">
                
                <div className="form-group">
                  <label>صورة المنتج</label>
                  <div className="image-upload-area">
                    {prodImagePreview ? <img src={prodImagePreview} className="image-preview" alt="preview" /> : <div className="image-placeholder"><Package size={48} /></div>}
                    <div className="upload-buttons">
                      <label className="btn-upload"><ImageIcon size={18} /> رفع صورة<input type="file" accept="image/*" hidden onChange={handleProdImageCapture} /></label>
                      <label className="btn-capture"><Camera size={18} /> التقاط بالكاميرا<input type="file" accept="image/*" capture="environment" hidden onChange={handleProdImageCapture} /></label>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>اسم المنتج <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="name" value={productForm.name} onChange={handleProductInputChange} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>السعر <span style={{color: 'red'}}>*</span></label>
                    <input type="number" name="current_price" value={productForm.current_price} onChange={handleProductInputChange} required min="0" step="0.01" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>الوزن/الحجم (مثال: 500g)</label>
                    <input type="text" name="weight" value={productForm.weight} onChange={handleProductInputChange} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>الفروع (يمكنك اختيار أكثر من فرع)</label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {categories.map(c => (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                          <input 
                            type="checkbox" 
                            checked={productForm.category_ids.includes(c.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setProductForm(prev => {
                                const newIds = checked 
                                  ? [...prev.category_ids, c.id]
                                  : prev.category_ids.filter(id => id !== c.id);
                                return { ...prev, category_ids: newIds };
                              });
                            }}
                          />
                          {getCategoryName(c.id)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>وصف المنتج</label>
                  <textarea name="description" value={productForm.description} onChange={handleProductInputChange} rows="3" style={{width: '100%', padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)'}}></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>المخزون (الكمية المتوفرة)</label>
                    <input type="number" name="stock_quantity" value={productForm.stock_quantity} onChange={handleProductInputChange} required />
                  </div>
                  <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: 25 }}>
                      <input type="checkbox" name="is_active" checked={productForm.is_active} onChange={handleProductInputChange} style={{ width: '18px', height: '18px' }} />
                      <span>المنتج مفعل ويظهر للعملاء</span>
                    </label>
                  </div>
                </div>

                {/* Offer details */}
                <div className="form-group" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: 'var(--border-radius-md)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_offer" checked={productForm.is_offer} onChange={handleProductInputChange} style={{ width: '18px', height: '18px' }} />
                    <span>تفعيل كـ (عرض خاص)؟</span>
                  </label>
                  {productForm.is_offer && (
                    <div className="form-row" style={{ marginTop: 15 }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>نص العرض (مثال: خصم 20%)</label>
                        <input type="text" name="offer_label" value={productForm.offer_label} onChange={handleProductInputChange} />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>لون بادج العرض</label>
                        <input type="color" name="offer_color" value={productForm.offer_color} onChange={handleProductInputChange} style={{ height: '40px', width: '100px', border: 'none', borderRadius: '4px' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  {editingProductId && <button type="button" className="btn-secondary" onClick={resetProductForm}>إلغاء</button>}
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج'}</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ===================== EXCEL IMPORTER ===================== */}
        <div className="glass accordion-card">
          <div onClick={() => toggleAccordion('excel-import')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}><UploadCloud /> استيراد المنتجات (Excel/CSV)</div>
            <div>{activeAccordion === 'excel-import' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'excel-import' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <ExcelImporter onImportSuccess={() => { fetchData(); setActiveAccordion('products'); }} />
            </div>
          )}
        </div>

        {/* ===================== PRODUCTS LIST ===================== */}
        <div className="glass accordion-card">
          <div onClick={() => toggleAccordion('products')} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-color)' }}>
            <div style={{ display: 'flex', gap: '10px' }}><Package /> المنتجات الحالية ({products.length})</div>
            <div>{activeAccordion === 'products' ? '▲' : '▼'}</div>
          </div>
          {activeAccordion === 'products' && (
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="admin-products-grid">
                {products.map(product => (
                  <div key={product.id} className="admin-product-card glass" style={{ opacity: product.is_active ? 1 : 0.5 }}>
                    {product.is_offer && <div className="offer-badge-preview" style={{ background: product.offer_color || '#E65100' }}>{product.offer_label || 'عرض'}</div>}
                    {!product.is_active && <div className="offer-badge-preview" style={{ background: '#7f8c8d', top: 40 }}>معطل</div>}
                    
                    {product.image_url && <div className="admin-product-img"><img src={product.image_url} alt={product.name} /></div>}
                    
                    <div className="admin-product-info">
                      <h3>{product.name}</h3>
                      <p className="admin-product-price">${product.current_price} <span style={{fontSize:'0.8rem'}}>{product.weight}</span></p>
                      <span className="admin-product-category">{product.category_ids?.length > 0 ? product.category_ids.map(id => getCategoryName(id)).join('، ') : (product.category_id ? getCategoryName(product.category_id) : 'بدون تصنيف')}</span>
                      <p style={{fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 5}}>المخزون: {product.stock_quantity}</p>
                    </div>
                    <div className="admin-product-actions">
                      <button onClick={() => editProduct(product)} className="btn-edit" title="تعديل"><Edit size={18} /></button>
                      <button onClick={() => deleteProduct(product.id)} className="btn-delete" title="حذف"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
