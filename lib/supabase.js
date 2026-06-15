import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ursuwvnrbmgwgqlzltnk.supabase.co';
const supabaseKey = 'sb_publishable_AXaWKCyYyExHTN6x-E1Gng_6_55xr5w'; // Usually this should be in .env.local

export const supabase = createClient(supabaseUrl, supabaseKey);
