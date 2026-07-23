import { supabase } from '../../../lib/supabase';

export async function generateStaticParams() {
  try {
    const { data } = await supabase.from('products').select('id');
    if (data) {
      return data.map((product) => ({
        id: product.id,
      }));
    }
  } catch (error) {
    console.error('Error generating static params:', error);
  }
  return [];
}

export default function ProductLayout({ children }) {
  return <>{children}</>;
}
