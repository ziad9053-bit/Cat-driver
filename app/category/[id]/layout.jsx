import { supabase } from '../../../lib/supabase';

export async function generateStaticParams() {
  try {
    const { data } = await supabase.from('categories').select('id');
    if (data) {
      return data.map((category) => ({
        id: category.id,
      }));
    }
  } catch (error) {
    console.error('Error generating static params:', error);
  }
  return [];
}

export default function CategoryLayout({ children }) {
  return <>{children}</>;
}
