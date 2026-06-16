'use client';
import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function WorkerLogin() {
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Driver');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = role === 'Preparer' ? 'preparer@catdriver.com' : 'driver@catdriver.com';
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      alert('كلمة المرور غير صحيحة أو الحساب غير موجود');
    } else {
      alert(`تم تسجيل الدخول بنجاح كـ ${role === 'Preparer' ? 'عامل تحضير' : 'سائق توصيل'}!`);
      const targetPath = role === 'Preparer' ? '/preparer' : '/driver';
      // Attempt Next.js router first, fallback to direct location change if needed
      try {
        router.push(targetPath);
        // Fallback timeout in case router.push doesn't navigate
        setTimeout(() => {
          window.location.href = `/Cat-driver${targetPath}`;
        }, 500);
      } catch (e) {
        window.location.href = `/Cat-driver${targetPath}`;
      }
    }
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--accent-color)', textAlign: 'center', marginBottom: '20px' }}>بوابة العمال</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>تسجيل الدخول كـ</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--text-tertiary)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
              <option value="Preparer">عامل تحضير</option>
              <option value="Driver">سائق توصيل</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--text-tertiary)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} required />
          </div>
          <button type="submit" style={{ padding: '12px', background: 'var(--accent-color)', color: '#000', fontWeight: 'bold', borderRadius: 'var(--border-radius-md)', marginTop: '10px' }}>تسجيل الدخول</button>
        </form>
      </div>
    </div>
  );
}
