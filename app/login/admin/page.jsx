'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@catdriver.com',
      password: password,
    });
    
    if (error) {
      alert('كلمة المرور غير صحيحة أو الحساب غير موجود');
    } else {
      alert('تم تسجيل الدخول بنجاح كمدير!');
      router.push('/admin');
    }
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '20px' }}>دخول الإدارة</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--text-tertiary)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} required />
          </div>
          <button type="submit" style={{ padding: '12px', background: 'var(--primary-color)', color: '#000', fontWeight: 'bold', borderRadius: 'var(--border-radius-md)', marginTop: '10px' }}>تسجيل الدخول</button>
        </form>
      </div>
    </div>
  );
}
