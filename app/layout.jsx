import './globals.css';
import { CartProvider } from '../context/CartContext';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Freshly - Premium Produce Delivery',
  description: 'Order fresh vegetables and fruits directly from the store.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
