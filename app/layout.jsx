import './globals.css';
import { CartProvider } from '../context/CartContext';
import { SettingsProvider } from '../context/SettingsContext';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Cat Driver Store - متجر كات درايفر',
  description: 'خدمة التوصيل الفاخرة لاحتياجاتك اليومية.',
  verification: {
    google: '9dURtgX7JFddlPam0l1r86LKYrAML7FsMw-V3LMeyUw',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
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
