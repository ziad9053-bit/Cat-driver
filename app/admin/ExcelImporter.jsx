'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ExcelImporter({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Importing, 4: Done
  
  // Mapping state: mapping our DB fields to Excel headers
  const [mappings, setMappings] = useState({
    name: '',
    current_price: '',
    stock_quantity: '',
    weight: '',
    category_name: '' // We will match this name with our categories
  });
  
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, inserted: 0, updated: 0, failed: 0 });

  useEffect(() => {
    // Fetch categories to match names
    const fetchCategories = async () => {
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) setCategories(catData);
    };
    fetchCategories();
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const parsedData = XLSX.utils.sheet_to_json(ws, { defval: '' });
      
      if (parsedData.length > 0) {
        setData(parsedData);
        setHeaders(Object.keys(parsedData[0]));
        
        // Auto-guess mappings
        const newMappings = { ...mappings };
        const keys = Object.keys(parsedData[0]);
        keys.forEach(k => {
          const lower = k.toLowerCase();
          if (lower.includes('name') || lower.includes('اسم') || lower.includes('صنف')) newMappings.name = k;
          if (lower.includes('price') || lower.includes('سعر')) newMappings.current_price = k;
          if (lower.includes('stock') || lower.includes('qty') || lower.includes('كمية') || lower.includes('مخزون')) newMappings.stock_quantity = k;
          if (lower.includes('weight') || lower.includes('وزن') || lower.includes('حجم')) newMappings.weight = k;
          if (lower.includes('category') || lower.includes('قسم') || lower.includes('تصنيف')) newMappings.category_name = k;
        });
        setMappings(newMappings);
        setStep(2);
      } else {
        alert('الملف فارغ أو لا يمكن قراءته.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleImport = async () => {
    if (!mappings.name || !mappings.current_price) {
      alert('يجب تحديد عمود لاسم المنتج والسعر على الأقل.');
      return;
    }

    setIsImporting(true);
    setStep(3);
    
    let insertedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    
    // --- 1. Auto-create missing categories ---
    let currentCategories = [...categories];
    if (mappings.category_name) {
      const uniqueCategoryNames = [...new Set(data.map(r => r[mappings.category_name]).filter(c => c))];
      const newCategories = [];
      
      for (const catName of uniqueCategoryNames) {
        const catStr = String(catName).trim();
        const exists = currentCategories.find(c => c.name.toLowerCase() === catStr.toLowerCase());
        if (!exists && catStr !== '') {
          newCategories.push({ name: catStr });
        }
      }
      
      if (newCategories.length > 0) {
        const { data: insertedCats, error: catErr } = await supabase.from('categories').insert(newCategories).select();
        if (!catErr && insertedCats) {
          currentCategories = [...currentCategories, ...insertedCats];
          setCategories(currentCategories);
        }
      }
    }
    
    // --- 2. Fetch existing products for UPSERT matching ---
    // Fetch all products (just id and name) to check if they already exist
    const { data: existingProducts } = await supabase.from('products').select('id, name');
    const existingMap = new Map();
    if (existingProducts) {
      existingProducts.forEach(p => existingMap.set(p.name.toLowerCase().trim(), p.id));
    }

    // Process in chunks to avoid overwhelming the DB
    const CHUNK_SIZE = 100;
    
    // Prepare data
    const formattedProducts = data.map(row => {
      // Find category ID
      let category_id = null;
      if (mappings.category_name && row[mappings.category_name]) {
        const catStr = String(row[mappings.category_name]).trim().toLowerCase();
        const foundCat = currentCategories.find(c => c.name.toLowerCase() === catStr);
        if (foundCat) category_id = foundCat.id;
      }
      
      const pName = String(row[mappings.name] || '').trim();
      const payload = {
        name: pName,
        current_price: parseFloat(row[mappings.current_price]) || 0,
        stock_quantity: parseInt(row[mappings.stock_quantity]) || 100,
        weight: mappings.weight ? String(row[mappings.weight] || '').trim() : 'حبة',
        category_id: category_id,
        is_active: true
      };
      
      // If product exists, add its ID to trigger an update (upsert)
      const existingId = existingMap.get(pName.toLowerCase());
      if (existingId) {
        payload.id = existingId;
      }
      
      return payload;
    }).filter(p => p.name && p.current_price > 0);
    
    for (let i = 0; i < formattedProducts.length; i += CHUNK_SIZE) {
      const chunk = formattedProducts.slice(i, i + CHUNK_SIZE);
      // Upsert: matches on ID if provided, otherwise inserts.
      const { data: upsertedData, error } = await supabase.from('products').upsert(chunk).select('id');
      if (error) {
        console.error('Import Error:', error);
        failedCount += chunk.length;
      } else {
        // Count how many were updates vs inserts based on whether chunk items had .id
        chunk.forEach(item => {
          if (item.id) updatedCount++;
          else insertedCount++;
        });
      }
    }
    
    setImportStats({ total: formattedProducts.length, inserted: insertedCount, updated: updatedCount, failed: failedCount });
    setStep(4);
    setIsImporting(false);
    if (onImportSuccess) onImportSuccess();
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setHeaders([]);
    setStep(1);
    setMappings({ name: '', current_price: '', stock_quantity: '', weight: '', category_name: '' });
  };

  return (
    <div className="excel-importer" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px dashed rgba(255,255,255,0.1)' }}>
      {/* STEP 1: Upload */}
      {step === 1 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Upload size={48} style={{ color: 'var(--primary-color)', marginBottom: '15px' }} />
          <h3 style={{ marginBottom: '10px' }}>استيراد المنتجات من ملف Excel أو CSV</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
            قم برفع ملف الإكسيل الذي تم تصديره من برنامج المحاسبة الخاص بك.
          </p>
          <label style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--primary-color)', color: '#000', fontWeight: 'bold', borderRadius: 'var(--border-radius-md)', cursor: 'pointer' }}>
            اختر الملف للبدء
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} hidden />
          </label>
        </div>
      )}

      {/* STEP 2: Mapping */}
      {step === 2 && (
        <div className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>مُطابقة الأعمدة (Smart Mapping)</h3>
            <span style={{ background: 'var(--surface-color)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
              تم العثور على {data.length} منتج
            </span>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            يرجى تحديد العمود المناسب لكل حقل في قاعدة بيانات التطبيق لتحديث المنتجات بنجاح.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { id: 'name', label: 'اسم المنتج', required: true },
              { id: 'current_price', label: 'السعر (للبيع)', required: true },
              { id: 'category_name', label: 'القسم (نص)', required: false },
              { id: 'stock_quantity', label: 'كمية المخزون', required: false },
              { id: 'weight', label: 'الوزن/الحجم', required: false },
            ].map(field => (
              <div key={field.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: 'var(--border-radius-sm)' }}>
                <div style={{ flex: 1, fontWeight: 'bold' }}>
                  {field.label} {field.required && <span style={{ color: '#ff4d4f' }}>*</span>}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ArrowRight size={16} color="var(--text-tertiary)" />
                  <select 
                    value={mappings[field.id]} 
                    onChange={(e) => setMappings({ ...mappings, [field.id]: e.target.value })}
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--text-tertiary)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="">-- تجاهل (فارغ) --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button onClick={reset} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
            <button onClick={handleImport} className="btn-primary" style={{ flex: 2 }}>بدء الاستيراد الآن 🚀</button>
          </div>
        </div>
      )}

      {/* STEP 3 & 4: Importing / Result */}
      {(step === 3 || step === 4) && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }} className="animate-fade-in">
          {isImporting ? (
            <>
              <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(212, 175, 55, 0.3)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h3>جاري استيراد المنتجات...</h3>
              <p style={{ color: 'var(--text-secondary)' }}>الرجاء عدم إغلاق هذه الصفحة.</p>
            </>
          ) : (
            <>
              <CheckCircle size={64} style={{ color: 'var(--success-color)', margin: '0 auto 15px' }} />
              <h3 style={{ color: 'var(--success-color)' }}>تم الانتهاء من الاستيراد!</h3>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '15px', borderRadius: '8px', minWidth: '100px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{importStats.inserted}</div>
                  <div style={{ fontSize: '0.85rem' }}>منتج جديد</div>
                </div>
                <div style={{ background: 'rgba(33, 150, 243, 0.1)', padding: '15px', borderRadius: '8px', minWidth: '100px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2196f3' }}>{importStats.updated}</div>
                  <div style={{ fontSize: '0.85rem' }}>تم تحديثه</div>
                </div>
                {importStats.failed > 0 && (
                  <div style={{ background: 'rgba(255, 77, 79, 0.1)', padding: '15px', borderRadius: '8px', minWidth: '100px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error-color)' }}>{importStats.failed}</div>
                    <div style={{ fontSize: '0.85rem' }}>فشلت</div>
                  </div>
                )}
              </div>
              
              <button onClick={reset} className="btn-primary">استيراد ملف آخر</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
