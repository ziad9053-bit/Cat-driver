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

async function fixCategories() {
  const parentId = '55555555-5555-5555-5555-555555555555'; // الخضار والفواكه

  console.log('1. Moving and renaming خضار to خضروات under الخضار والفواكه');
  await supabase.from('categories').update({ name: 'خضروات', parent_id: parentId }).eq('id', '695eee6d-3825-406a-a5a7-f2bd638c2c23');

  console.log('2. Moving بقوليات under الخضار والفواكه');
  await supabase.from('categories').update({ parent_id: parentId }).eq('id', '691778da-0707-4ec0-abdf-52a3542cb3f1');

  console.log('3. Moving فواكه under الخضار والفواكه');
  await supabase.from('categories').update({ parent_id: parentId }).eq('id', 'be5f291a-b2d8-49eb-b1cd-1bb58acc2b9f');

  console.log('4. Moving products from خضار ورقية to خضروات');
  await supabase.from('products').update({ category_id: '695eee6d-3825-406a-a5a7-f2bd638c2c23' }).eq('category_id', '50000000-0000-0000-0000-000000000001');

  console.log('5. Deleting redundant category خضار ورقية');
  await supabase.from('categories').delete().eq('id', '50000000-0000-0000-0000-000000000001');

  console.log('DONE!');
}

fixCategories();
