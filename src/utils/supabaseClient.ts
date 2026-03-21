import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Defensive check: If the key is the placeholder string from the guide, we should NOT initialize
const IS_PLACEHOLDER = supabaseAnonKey === "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

if (!supabaseUrl || !supabaseAnonKey || IS_PLACEHOLDER) {
  if (typeof window !== 'undefined') {
    console.warn(
      "🛡️ Supabase Config Missing: Please add your actual NEXT_PUBLIC_SUPABASE_ANON_KEY to .env. " +
      "The 'Invalid Compact JWS' error is because you're using the placeholder string."
    );
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey && !IS_PLACEHOLDER) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
