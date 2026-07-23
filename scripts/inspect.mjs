import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('parent_id', { nullsFirst: true });
  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }
  
  console.log('--- ALL CATEGORIES ---');
  data.forEach(c => {
    console.log(`[${c.id}] ${c.name} (Parent: ${c.parent_id})`);
  });
}

inspectCategories();
