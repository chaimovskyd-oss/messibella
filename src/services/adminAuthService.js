import { supabase } from '@/lib/supabaseClient';

function logAdminAuthError(action, error, extra = {}) {
  console.error(`Admin auth ${action} failed`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    ...extra,
  });
}

export async function isCurrentUserAdmin(userId) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('app_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logAdminAuthError('check-admin', error, { userId });
    throw error;
  }

  return Boolean(data?.user_id);
}

export async function getAdminAuthState() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    logAdminAuthError('get-session', error);
    throw error;
  }

  const session = data?.session || null;
  const user = session?.user || null;

  if (!user) {
    return { session: null, user: null, isAdmin: false };
  }

  const isAdmin = await isCurrentUserAdmin(user.id);
  return { session, user, isAdmin };
}

export async function signInAdmin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password,
  });

  if (error) {
    logAdminAuthError('sign-in', error, { email });
    throw error;
  }

  const user = data?.user || null;
  const session = data?.session || null;
  const isAdmin = await isCurrentUserAdmin(user?.id);

  if (!isAdmin) {
    await supabase.auth.signOut();
    const adminError = {
      type: 'not_admin',
      message: 'המשתמש מחובר ל-Supabase Auth אבל לא מופיע בטבלת public.app_admins.',
    };
    throw adminError;
  }

  return { user, session, isAdmin: true };
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    logAdminAuthError('sign-out', error);
    throw error;
  }
}
