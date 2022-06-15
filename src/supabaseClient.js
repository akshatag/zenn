import { createClient } from '@supabase/supabase-js';

console.log("anon key: " + process.env.REACT_APP_SUPABASE_ANON_KEY)
console.log("url: " + process.env.REACT_APP_SUPABASE_URL)

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);