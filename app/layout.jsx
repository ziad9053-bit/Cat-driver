import './globals.css';
import { CartProvider } from '../context/CartContext';
import { SettingsProvider } from '../context/SettingsContext';
import Navbar from './components/Navbar';
import FloatingBackButton from './components/FloatingBackButton';

export const metadata = {
  title: 'مخزن الجوف للخضروات | أجود أنواع الخضار والفواكه والطازجة',
  description: 'تسوق أفضل الخضار والفواكه الطازجة والبقوليات المختارة بعناية من مخزن الجوف للخضروات. نوفر لك أعلى جودة طازجة وتوصيل سريع ومباشر للمنزل.',
  keywords: 'مخزن الجوف للخضروات، خضار طازجة، فواكه موسمية، بقوليات، متجر خضار الجوف، توصيل خضار وفواكه، سكاكا، دومة الجندل',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://aljouf-market.vercel.app/',
  },
  verification: {
    google: '9dURtgX7JFddlPam0l1r86LKYrAML7FsMw-V3LMeyUw',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "name": "مخزن الجوف للخضروات",
    "description": "تسوق أفضل الخضار والفواكه الطازجة والبقوليات المختارة بعناية من مخزن الجوف للخضروات. نوفر لك أعلى جودة طازجة وتوصيل سريع ومباشر للمنزل.",
    "url": "https://aljouf-market.vercel.app/",
    "telephone": "+966500000000",
    "priceRange": "$$",
    "areaServed": ["الجوف", "المنطقة الشمالية", "سكاكا", "دومة الجندل", "طبرجل"],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "الجوف",
      "addressRegion": "المنطقة الشمالية",
      "addressCountry": "SA"
    }
  };

  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SettingsProvider>
          <CartProvider>
            <div className="app-layout">
              <Navbar />
              <FloatingBackButton />
              <main className="container">
                {children}
              </main>
            </div>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
