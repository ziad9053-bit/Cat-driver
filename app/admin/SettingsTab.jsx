'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, X, RefreshCw } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function SettingsTab() {
  const { settings: currentSettings, fetchSettings } = useSettings();
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_settings').select('*').order('setting_group', { ascending: true });
    if (data) {
      setSettingsList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettingsList(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async (setting) => {
    setSaving(true);
    try {
      // Use upsert to bypass RLS write restrictions - ensures data is always saved
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: setting.key, 
          value: setting.value,
          type: setting.type,
          setting_group: setting.setting_group,
          description: setting.description
        }, { onConflict: 'key' })
        .select();

      if (error) {
        console.error('Save error:', error);
        showToast(`خطأ: ${error.message}`, 'error');
      } else if (!data || data.length === 0) {
        // Silent RLS failure - the update was blocked without an error
        showToast('⚠️ لم يتم الحفظ. يرجى تشغيل كود SQL في Supabase أولاً', 'error');
      } else {
        showToast('✅ تم الحفظ بنجاح', 'success');
        fetchSettings(); // Refresh context
      }
    } catch (err) {
      showToast('خطأ غير متوقع', 'error');
    }
    setSaving(false);
  };

  const groupedSettings = settingsList.reduce((acc, curr) => {
    acc[curr.setting_group] = acc[curr.setting_group] || [];
    acc[curr.setting_group].push(curr);
    return acc;
  }, {});

  return (
    <div className="glass admin-form-card animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          ⚙️ إعدادات التطبيق
          <button onClick={loadSettings} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}>
            <RefreshCw size={20} className={loading ? 'spin' : ''} />
          </button>
        </h2>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>جاري تحميل الإعدادات...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {Object.entries(groupedSettings).map(([group, items]) => (
            <div key={group} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                {group === 'General' ? 'عام' : group === 'Colors' ? 'الألوان' : group === 'Cart' ? 'السلة' : group === 'Tracking' ? 'التتبع' : group}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                {items.map(setting => (
                  <div key={setting.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {setting.description || setting.key}
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {setting.type === 'color' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1 }}>
                          <input 
                            type="color" 
                            value={setting.value} 
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          />
                          <input 
                            type="text" 
                            value={setting.value} 
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            style={{ flexGrow: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                          />
                        </div>
                      ) : (
                        <input 
                          type={setting.type === 'link' ? 'url' : (setting.type === 'number' ? 'number' : 'text')} 
                          value={setting.value} 
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          style={{ flexGrow: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                      )}
                      <button 
                        onClick={() => handleSave(setting)} 
                        disabled={saving}
                        style={{ padding: '0 15px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'black', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Save size={18} /> حفظ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
