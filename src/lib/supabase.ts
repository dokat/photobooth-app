import { createClient } from '@supabase/supabase-js';

const supabaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECTID}.supabase.co`;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLIC_KEY;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
