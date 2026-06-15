'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Connect to Supabase Auth
    alert('Admin Login via Supabase Auth');
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass" style={{ padding: '40px', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '20px' }}>Admin Panel Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Email / Username</label>
            <input type="text" style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--text-tertiary)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--text-tertiary)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} required />
          </div>
          <button type="submit" style={{ padding: '12px', background: 'var(--primary-color)', color: '#000', fontWeight: 'bold', borderRadius: 'var(--border-radius-md)', marginTop: '10px' }}>Login to Admin</button>
        </form>
      </div>
    </div>
  );
}
