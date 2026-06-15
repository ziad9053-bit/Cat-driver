import './globals.css';

export const metadata = {
  title: 'Freshly - Premium Produce Delivery',
  description: 'Order fresh vegetables and fruits directly from the store.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
