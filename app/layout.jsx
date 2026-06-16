import './globals.css';
import { CartProvider } from '../context/CartContext';
import { SettingsProvider } from '../context/SettingsContext';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'متجر خيرات الجوف - أجود أنواع الخضار والفواكه والبقوليات الطازجة',
  description: 'تسوق أفضل الخضار والفواكه الطازجة والبقوليات المختارة بعناية. نوفر لك الجودة العالية والتوصيل السريع للمنزل. نخدم أهالي الجوف والمنطقة الشمالية بجودة لا تضاهى. اطلب الآن واستمتع بطعم الطبيعة!',
  keywords: 'خضار طازجة، فواكه موسمية، بقوليات، متجر خضار، توصيل خضار وفواكه، خضار عضوية',
  verification: {
    google: '9dURtgX7JFddlPam0l1r86LKYrAML7FsMw-V3LMeyUw',
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "name": "متجر خيرات الجوف",
    "description": "تسوق أفضل الخضار والفواكه الطازجة والبقوليات المختارة بعناية. نوفر لك الجودة العالية والتوصيل السريع للمنزل. نخدم أهالي الجوف والمنطقة الشمالية بجودة لا تضاهى.",
    "url": "https://cat-driver.vercel.app/",
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
