'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FloatingBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // إخفاء الزر في الصفحة الرئيسية ولوحات التحكم
  if (
    pathname === '/' || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/driver') || 
    pathname.startsWith('/preparer')
  ) {
    return null;
  }

  return (
    <button 
      onClick={() => router.back()} 
      className="floating-back-btn"
      aria-label="العودة للخلف"
    >
      <ArrowRight size={28} />
    </button>
  );
}
