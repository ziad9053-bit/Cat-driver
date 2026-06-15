import './globals.css';
import { CartProvider } from '../context/CartContext';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Cat Driver Store - متجر كات درايفر',
  description: 'خدمة التوصيل الفاخرة لاحتياجاتك اليومية.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CartProvider>
          <div className="app-layout">
            <Navbar />
            <main className="container">
              {children}
            </main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
