import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  return String(rawUrl)
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/g, '');
}

function readProjectRefFromKey(key) {
  try {
    const payload = JSON.parse(atob(String(key).split('.')[1] || ''));
    return payload?.ref || null;
  } catch {
    return null;
  }
}

const supabaseUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const urlProjectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : null;
const keyProjectRef = readProjectRefFromKey(supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables: VITE_SUPABASE_URL / VITE_SUPABASE_KEY');
} else if (urlProjectRef && keyProjectRef && urlProjectRef !== keyProjectRef) {
  console.error('Supabase project mismatch between URL and anon key.', {
    urlProjectRef,
    keyProjectRef,
    supabaseUrl,
  });
}

export const supabase = createClient(supabaseUrl, supabaseKey);
